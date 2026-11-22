import { defineStore } from 'pinia';
import api from '../services/api';

export interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    toasts: [] as Toast[],
    precioAcpmActual: 10077,
    usuario: {
      nombre: 'Administrador de Flota',
      email: 'admin@volquetapro.co',
      rol: 'ADMIN'
    },
    loadingGlobal: false
  }),
  actions: {
    notify(toast: Omit<Toast, 'id'>) {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { ...toast, id };
      this.toasts.push(newToast);
      setTimeout(() => {
        this.removeToast(id);
      }, 5000);
    },
    removeToast(id: string) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },
    async fetchGlobalMetrics() {
      try {
        const res = await api.get('/dashboard/metrics');
        if (res.data?.resumen?.precioAcpmActual) {
          this.precioAcpmActual = res.data.resumen.precioAcpmActual;
        }
      } catch (e) {
        console.warn('Metrics load error:', e);
      }
    }
  }
});
