<template>
  <div v-if="loginsOnPage">
    <div class="row items-center q-my-sm">
      <ThemeIcon
        :name="itemTypeIcons['Person']"
        class="q-ml-md q-mr-sm"
        color="accent"
        size="sm"
      />
      <div class="text-h6 q-my-md">{{ $t('tables.users.title') }}</div>
    </div>
    <q-table
      :rows="loginsOnPage"
      :columns="columns"
      class="standout-1 bg-standard"
      flat
    >
    </q-table>
  </div>
  <pre v-else>{{ {loginsOnPage} }}</pre>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ApiHandler } from 'src/models/api/ApiInterface';
import { itemTypeIcons } from 'src/models/BlockTypes';
import { getTableColumns } from 'src/logic/utils/items';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { checkDataSource } from 'src/models/api/DataSource';
import { IndexedDbInterface } from 'src/models/api/IndexedDbInterface';
import { utils } from 'zencraft-core';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const loginsOnPage = ref <unknown[]>([]);

async function getLogins()
{
  const dataSource = checkDataSource();

  if(dataSource.isIndexedDb)
  {
    const idb = new IndexedDbInterface({});

    const logins = await idb.getLogins();

    if(!(Array.isArray(logins) && logins.length))
    {
      loginsOnPage.value = [];

      return;
    }

    loginsOnPage.value = logins;

    return;
  }

  const api = new ApiHandler({ jwtFn: () => (localStorage.getItem('jwt')) });
  const logins = await api.POST('/login/downstream', {});
  const loginsArray = (logins?.data as Record<string, unknown>)?.logins;

  if(!(Array.isArray(loginsArray) && loginsArray.length))
  {
    loginsOnPage.value = [];

    return;
  }

  loginsOnPage.value = loginsArray;
}

onMounted(getLogins);

const columns = computed<ReturnType<typeof getTableColumns>>(() => (
  getTableColumns({
    results: utils.genericUtils.reduceIntoAssociativeArray(
      loginsOnPage.value,
      'id'
    ),
    exclude: ['id', 'typeId'],
  })
));

</script>
