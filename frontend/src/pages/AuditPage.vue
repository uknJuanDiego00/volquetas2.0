<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Registro de Auditoría & Trazabilidad</h2>
        <p class="text-sm text-slate-500">Historial inmutable de operaciones, cambios de precios, creaciones y modificaciones</p>
      </div>
    </div>

    <!-- TABLA DE LOGS -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
            <tr>
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Usuario</th>
              <th class="py-3 px-4">Entidad / Tabla</th>
              <th class="py-3 px-4">Registro ID</th>
              <th class="py-3 px-4">Acción</th>
              <th class="py-3 px-4">IP</th>
              <th class="py-3 px-4">Detalle / Delta</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="l in logs" :key="l.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 text-slate-500 font-mono">{{ new Date(l.fecha).toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 font-bold text-slate-900">{{ l.usuario?.nombre || 'Sistema' }}</td>
              <td class="py-3 px-4 font-mono text-slate-600">{{ l.tablaAfectada }}</td>
              <td class="py-3 px-4 font-mono">#{{ l.registroId }}</td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="{
                    'bg-emerald-100 text-emerald-800': l.accion === 'CREATE',
                    'bg-amber-100 text-amber-800': l.accion === 'UPDATE',
                    'bg-rose-100 text-rose-800': l.accion === 'DELETE'
                  }"
                >
                  {{ l.accion }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-400 font-mono">{{ l.ip || '127.0.0.1' }}</td>
              <td class="py-3 px-4 max-w-xs truncate text-[11px] font-mono text-slate-500">
                {{ l.valoresNuevos || l.valoresAnteriores || '–' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';

const store = useAppStore();
const logs = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await api.get('/audit?limit=100');
    logs.value = res.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
});
</script>
