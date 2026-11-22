<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Catálogo de Peajes & Tarifas INVÍAS / ANI</h2>
        <p class="text-sm text-slate-500">Tarifas oficiales discriminadas por categorías vehiculares en corredores viales nacionales</p>
      </div>
      <button
        @click="mostrarModal = true"
        class="bg-brand-forest hover:bg-brand-emerald text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2 self-start"
      >
        <span>➕</span>
        <span>Agregar Peaje Manual</span>
      </button>
    </div>

    <!-- LISTADO DE PEAJES -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
            <tr>
              <th class="py-3 px-4">Estación Peaje</th>
              <th class="py-3 px-4">Corredor / Sector</th>
              <th class="py-3 px-4">Responsable</th>
              <th class="py-3 px-4 text-right">Cat II (Sencilla)</th>
              <th class="py-3 px-4 text-right">Cat III (Doble Troque)</th>
              <th class="py-3 px-4 text-right">Cat IV (4 Manos)</th>
              <th class="py-3 px-4 text-right">Cat V (Mula)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="p in peajes" :key="p.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">💰</span>
                <span>{{ p.nombre }}</span>
              </td>
              <td class="py-3 px-4 text-slate-600">{{ p.sector || 'Red Vial Nacional' }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {{ p.responsable }}
                </span>
              </td>
              <td class="py-3 px-4 text-right font-semibold">${{ getTarifa(p, 'CAT_II').toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 text-right font-black text-brand-forest">${{ getTarifa(p, 'CAT_III').toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 text-right font-semibold">${{ getTarifa(p, 'CAT_IV').toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 text-right font-semibold">${{ getTarifa(p, 'CAT_V').toLocaleString('es-CO') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL NUEVO PEAJE -->
    <div
      v-if="mostrarModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="font-extrabold text-slate-800 text-base">Registrar Nuevo Peaje</h3>
        <form @submit.prevent="guardarPeaje" class="mt-4 space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nombre del Peaje</label>
            <input v-model="form.nombre" required type="text" class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Sector o Tramo Vial</label>
            <input v-model="form.sector" type="text" class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Latitud</label>
              <input v-model.number="form.latitud" step="0.0001" required type="number" class="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Longitud</label>
              <input v-model.number="form.longitud" step="0.0001" required type="number" class="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tarifa Cat II (Sencilla)</label>
              <input v-model.number="form.tarifas.CAT_II" required type="number" class="w-full px-3 py-1.5 border rounded-lg bg-white" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tarifa Cat III (Doble Troque)</label>
              <input v-model.number="form.tarifas.CAT_III" required type="number" class="w-full px-3 py-1.5 border rounded-lg bg-white" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tarifa Cat IV (4 Manos)</label>
              <input v-model.number="form.tarifas.CAT_IV" required type="number" class="w-full px-3 py-1.5 border rounded-lg bg-white" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tarifa Cat V (Mula)</label>
              <input v-model.number="form.tarifas.CAT_V" required type="number" class="w-full px-3 py-1.5 border rounded-lg bg-white" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" @click="mostrarModal = false" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold">
              Cancelar
            </button>
            <button type="submit" class="px-4 py-2 bg-brand-forest hover:bg-brand-emerald text-white rounded-lg font-bold shadow">
              Guardar Peaje
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';

const store = useAppStore();
const peajes = ref<any[]>([]);
const mostrarModal = ref(false);

const form = ref<any>({
  nombre: '',
  sector: '',
  responsable: 'INVIAS',
  latitud: 7.0,
  longitud: -73.0,
  tarifas: {
    CAT_I: 11000,
    CAT_II: 16000,
    CAT_III: 28000,
    CAT_IV: 37000,
    CAT_V: 42000
  }
});

const getTarifa = (peaje: any, cat: string) => {
  const t = peaje.tarifas?.find((x: any) => x.categoria === cat);
  return t ? t.valor : 0;
};

const cargarPeajes = async () => {
  try {
    const res = await api.get('/tolls');
    peajes.value = res.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const guardarPeaje = async () => {
  try {
    await api.post('/tolls', form.value);
    store.notify({ type: 'success', title: 'Peaje Creado', message: `Peaje ${form.value.nombre} agregado al catálogo.` });
    mostrarModal.value = false;
    await cargarPeajes();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

onMounted(() => {
  cargarPeajes();
});
</script>
