<template>
  <div>
    <div class="row items-center q-my-lg">
      <SimpleModal>
        <template #activator="{open}">
          <ThemeButton
            icon="add"
            color="positive"
            flat
            @click="open"
          />
        </template>
        <template #content>
          <FormFields
            v-model="formValues"
            :form-fields="formFields"
          />
          <ThemeButton
            :label="$t('generic.buttons.submit')"
            @click="submitAddPermissionForm"
          />
        </template>
      </SimpleModal>
      <ThemeIcon
        :name="itemTypeIcons[sharedTypes.KnownItemType.AccessRole]"
        class="q-mr-sm"
        color="accent"
        size="sm"
      />
      <div class="text-h6">{{ $t('tables.permissions.title') }}</div>
    </div>
    <q-table
      v-if="permissionsOnPage"
      :rows="permissionsOnPage"
      :columns="columns"
      class="standout-1 bg-standard"
      flat
    >
      <template #body-cell-userId="ctx">
        <q-td>{{ ctx.value?.split('-')[0] }}</q-td>
      </template>
      <template #body-cell-scope="ctx">
        <q-td>{{ ctx.value?.split('-')[0] }}</q-td>
      </template>
      <template #body-cell-createdBy="ctx">
        <q-td>{{ ctx.value?.split('-')[0] }}</q-td>
      </template>
      <template #body-cell-createdAt="ctx">
        <q-td>
          {{ ctx.value?.split('T')[0] }}
          <q-tooltip>{{ ctx.value }}</q-tooltip>
        </q-td>
      </template>
      <template #body-cell-updatedAt="ctx">
        <q-td v-if="new Date(ctx.value).getTime() == 0"></q-td>
        <q-td v-else>
          {{ ctx.value?.split('T')[0] }}
          <q-tooltip>{{ ctx.value }}</q-tooltip>
        </q-td>
      </template>
      <template #body-cell-status="ctx">
        <q-td>
          {{ $t(`admin.userPermissions.permissionStatus.${ctx.value}`) }}
        </q-td>
      </template>
      <template #body-cell-actions>
        <q-td>
          Actions
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ApiHandler } from 'src/models/api/ApiInterface';
import { getTableColumns } from 'src/logic/utils/items';
import { itemTypeIcons } from 'src/models/BlockTypes';
import { fields, sharedTypes, utils } from 'zencraft-core';
import FormFields from '../form/FormFields.vue';
import SimpleModal from '../ui/SimpleModal.vue';
import { useI18n } from 'vue-i18n';
import ThemeButton from 'src/components/generic/buttons/ThemeButton.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { withDataSource } from 'src/models/api/DataSource';
import { IndexedDbInterface } from 'src/models/api/IndexedDbInterface';

const { t: $t } = useI18n();

const permissionsOnPage = ref<unknown[]>([]);

async function getPermissionsFromApi()
{
  const api = new ApiHandler({ jwtFn: () => (localStorage.getItem('jwt')) });
  const permissionsRes = await api.POST('/permission/list', {});
  const permissions = (permissionsRes?.data as Record<string, unknown>)?.permissions;

  if(!(Array.isArray(permissions) && permissions.length))
  {
    permissionsOnPage.value = [];
  }
  else
  {
    permissionsOnPage.value = permissions;
  }
}

async function getPermissionsFromIndexedDb()
{
  const idb = new IndexedDbInterface({});

  const permissions = await idb.getPermissions();

  if(!(Array.isArray(permissions) && permissions.length))
  {
    permissionsOnPage.value = [];
  }
  else
  {
    permissionsOnPage.value = permissions;
  }
}

async function getPermissions()
{
  await withDataSource({
    api: getPermissionsFromApi,
    indexedDb: getPermissionsFromIndexedDb,
  });
}

onMounted(getPermissions);

const columns = computed<ReturnType<typeof getTableColumns>>(() => (
  getTableColumns({
    results: utils.genericUtils.reduceIntoAssociativeArray(
      permissionsOnPage.value,
      'id'
    ),
    exclude: ['id', 'typeId'],
  })
));

const formValues = ref();

const fieldsMap: Record<(
  'permissionType' | 'status' | 'userId' | 'scope'
), fields.FieldData> = {
  userId: {
    id: utils.uuid.generateUuid(),
    typeId: sharedTypes.KnownItemType.Field,
    key: 'userId',
    fieldType: fields.FieldType.uuid,
    itemType: 'Person', // TODO create User Item and use it here
  },
  permissionType: {
    id: utils.uuid.generateUuid(),
    typeId: sharedTypes.KnownItemType.Field,
    key: 'permissionType',
    fieldType: fields.FieldType.text,
  },
  scope: {
    id: utils.uuid.generateUuid(),
    typeId: sharedTypes.KnownItemType.Field,
    key: 'scope',
    fieldType: fields.FieldType.uuid,
  },
  status:
  {
    id: utils.uuid.generateUuid(),
    typeId: sharedTypes.KnownItemType.Field,
    key: 'status',
    fieldType: fields.FieldType.dropdown,
    options: [0, 1, 2, 3]
  },
};

const formFields = ref<fields.FieldData[]>([
  fieldsMap.userId,
  fieldsMap.permissionType,
  fieldsMap.scope,
  // not including 'status' here as it cannot be set with this action
]);

async function submitAddPermissionForm()
{
  await withDataSource({
    api: async () =>
    {
      const api = new ApiHandler({ jwtFn: () => (localStorage.getItem('jwt')) });
      const res = await api.POST('/permission/request', {
        permissionTypes: [formValues.value.permissionType],
        userId: formValues.value.userId,
        scope: formValues.value.scope,
      });

      console.log('submit:', res);
    },
    // indexedDb: () => {} // TODO
    // firebase: () => {} // TODO
  });
}
</script>
