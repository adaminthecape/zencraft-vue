import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('src/components/views/UserFacingLayout.vue'),
    children: [
      {
        path: '/:moduleId',
        name: 'viewModule',
        component: () => import('src/components/views/UserFacingLayout.vue')
      },
      {
        path: '/:moduleId/:pageId',
        name: 'viewLayout',
        component: () => import('src/components/views/UserFacingLayout.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('src/components/generic/auth/LogIn.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('src/components/views/KanbanDashboard.vue'),
    beforeEnter(to, from, next)
    {
      // console.log('beforeRouteEnter:', { to, from });
      next();
    },
    children: [
      {
        path: '/admin/permissions',
        name: 'managePermissions',
        component: () => import('src/components/views/PermissionsTableView.vue'),
      },
      {
        path: '/admin/users',
        name: 'manageUsers',
        component: () => import('src/components/views/UserTableView.vue'),
      },
      {
        path: '/admin/items/:itemType',
        name: 'manageItemType',
        component: () => import('src/components/views/ItemTableView.vue'),
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('src/components/nav/ImmediateRedirect.vue'),
  },
];

export default routes;
