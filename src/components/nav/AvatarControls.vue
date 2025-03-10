<template>
  <q-btn
    color="primary"
    no-caps
    dense
  >
    <div class="row items-center" style="padding: 1px 4px">
      <ThemeIcon class="q-mr-xs" name="fas fa-user" size="xs" />
      <span>{{ $t('user.controls.settings') }}</span>
    </div>
    <q-menu auto-close>
      <q-list>
        <ListItem
          v-close-popup
          clickable
          @click.stop.prevent="Dark.isActive ? themeStore.setLightMode() : themeStore.setDarkMode()"
        >
          <template #left>
            <ThemeIcon
              :name="themeStore.activeTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"
              color="amber"
            />
          </template>
          <template #label>{{ $t('user.controls.themeMode.toggle') }}</template>
          <template #caption>{{ $t('user.controls.themeMode.current', { mode: themeStore.activeTheme }) }}</template>
        </ListItem>
        <ListItem
          v-close-popup
          clickable
          @click.stop.prevent="adminStore.setEditMode(!adminStore.isEditMode)"
        >
          <template #left>
            <ThemeIcon
              :name="adminStore.isEditMode ? 'fas fa-eye' : 'fas fa-edit'"
              color="amber"
            />
          </template>
          <template #label>{{ $t('user.controls.editMode.toggle') }}</template>
          <template #caption>{{ $t(`user.controls.editMode.${adminStore.isEditMode ? 'isOn' : 'isOff'}`) }}</template>
        </ListItem>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import useThemeStore from 'src/pinia/themeStore';
import useAdminStore from 'src/pinia/adminStore';
import { Dark } from 'quasar';
import ListItem from '../ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const themeStore = useThemeStore();
const adminStore = useAdminStore();
</script>
