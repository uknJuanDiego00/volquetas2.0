import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../pages/DashboardPage.vue')
        },
        {
          path: 'vehiculos',
          name: 'Vehiculos',
          component: () => import('../pages/VehiclesPage.vue')
        },
        {
          path: 'acpm',
          name: 'Acpm',
          component: () => import('../pages/AcpmPage.vue')
        },
        {
          path: 'rutas',
          name: 'Rutas',
          component: () => import('../pages/RoutesPage.vue')
        },
        {
          path: 'peajes',
          name: 'Peajes',
          component: () => import('../pages/TollsPage.vue')
        },
        {
          path: 'cotizaciones',
          name: 'Cotizaciones',
          component: () => import('../pages/QuotationsPage.vue')
        },
        {
          path: 'cotizaciones/:id',
          name: 'CotizacionDetalle',
          component: () => import('../pages/QuotationDetailPage.vue')
        },
        {
          path: 'viajes',
          name: 'Viajes',
          component: () => import('../pages/TripsPage.vue')
        },
        {
          path: 'auditoria',
          name: 'Auditoria',
          component: () => import('../pages/AuditPage.vue')
        }
      ]
    }
  ]
});

export default router;
