<template>
  <q-list>
    <template v-for="(menuItem, m) in menuList" :key="`nav-item-${m}`">
      <div
        v-if="menuItem.to"
        :to="menuItem.to"
        class="nav-link"
        active-class="nav-link-active"
        custom
      >
      <ListItem
        v-if="!menuItem.children"
        clickable
        :active="pathMatch(menuItem.to?.path)"
        v-ripple
        :to="menuItem.to"
      >
        <template #avatar>
          <ThemeIcon color="secondary" :name="menuItem.icon" />
        </template>
        <span class="lato-bold">{{ menuItem.label }}</span>
      </ListItem>
      <q-expansion-item
        v-if="menuItem.children"
        default-opened
        :label="menuItem.label"
      >
        <ListItem
          v-for="subMenuItem in menuItem.children"
          :key="`sub-menu-item-${subMenuItem.label}`"
          :to="subMenuItem.to"
          clickable
          v-ripple
        >
          <template #avatar>
            <ThemeIcon color="secondary" :name="subMenuItem.icon" />
          </template>
          <span class="lato-bold">{{ subMenuItem.label }}</span>
        </ListItem>
      </q-expansion-item>
      <q-separator :key="`nav-sep-${m}`" v-if="menuItem.separator" />
      </div>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { sharedTypes } from 'zencraft-core';
import { itemTypeIcons } from 'src/models/BlockTypes';
import { useCustomItemStore } from 'src/pinia/customItemStore';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ListItem from '../ui/ListItem.vue';
import ThemeIcon from 'src/components/ui/ThemeIcon.vue';

const customItemStore = useCustomItemStore({})();

// const allItemTypes = computed(() => (customItemStore.getDefinitionNames || []));

const allItemTypes = computed(() =>
{
  const types: string[] = Object.values(sharedTypes.KnownItemType);

  if(Array.isArray(customItemStore.getDefinitionNames))
  {
    customItemStore.getDefinitionNames.forEach((name) =>
    {
      if(!types.includes(name))
      {
        types.push(name);
      }
    });
  }

  return types;
});

const menuList = computed(() => ([
  {
    icon: 'people',
    label: 'Users',
    separator: true,
    to: { path: '/admin/users' }
  },
  {
    icon: 'key',
    label: 'Permissions',
    separator: true,
    to: { path: '/admin/permissions' }
  },
  {
    icon: 'inbox',
    label: 'Item Tables',
    separator: true,
    to: { path: '/admin/items' },
    children: (allItemTypes.value).map((itemType) => ({
      icon: itemTypeIcons[itemType] ?? 'house',
      label: `${itemType}s`,
      to: {
        name: 'manageItemType',
        params: { itemType }
      }
    }))
  },
  {
    icon: 'send',
    label: 'View Tours',
    separator: false,
    to: { path: '/admin/tours/list' }
  },
  {
    icon: 'delete',
    label: 'Trash',
    separator: false
  },
  {
    icon: 'error',
    label: 'Spam',
    separator: true
  },
  {
    icon: 'settings',
    label: 'Settings',
    separator: false,
    to: { path: '/admin/settings' }
  },
  {
    icon: 'feedback',
    label: 'Home Page',
    separator: false,
    to: { path: '/' }
  },
  {
    icon: 'help',
    iconColor: 'primary',
    label: 'Help',
    separator: false,
    to: { path: '/help' }
  }
]));

const route = useRoute();

function pathMatch(path: string | undefined): boolean
{
  return path === route.path;
}
</script>

<style lang="postcss" scoped>
.nav-link {
  textDecoration: 'none';
}

.nav-link-active {
  font-weight: bold;
}
</style>
