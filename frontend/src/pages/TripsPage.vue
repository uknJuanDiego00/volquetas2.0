<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Control de Viajes & Gastos en Ruta</h2>
        <p class="text-sm text-slate-500">Monitoreo de kilometraje real, registro de gastos operativos y balance de utilidad neta</p>
      </div>
      <button
        @click="mostrarModalNuevo = true"
        class="bg-brand-forest hover:bg-brand-emerald text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2 self-start"
      >
        <span>➕</span>
        <span>Crear Viaje</span>
      </button>
    </div>

    <!-- LISTADO DE VIAJES -->
    <div class="grid grid-cols-1 gap-4">
      <div
        v-for="v in viajes"
        :key="v.id"
        class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 hover:shadow-md transition"
      >
        <!-- Fila Superior -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-sm">
              VJ
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-slate-900 text-sm font-mono">{{ v.codigo }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="{
                    'bg-amber-100 text-amber-800': v.estado === 'PROGRAMADO',
                    'bg-sky-100 text-sky-800': v.estado === 'EN_TRANSITO',
                    'bg-emerald-100 text-emerald-800': v.estado === 'FINALIZADO'
                  }"
                >
                  {{ v.estado }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Volqueta: <b>{{ v.vehiculo?.placa }}</b> • Cliente: <b>{{ v.cliente?.razonSocial || 'Particular' }}</b>
              </p>
            </div>
          </div>

          <div class="text-right flex items-center gap-3">
            <div>
              <span class="text-slate-400 text-[10px] block font-semibold uppercase">Ingreso Cobrado</span>
              <span class="text-base font-black text-slate-900">${{ v.ingresoCobrado.toLocaleString('es-CO') }}</span>
            </div>
            <div>
              <span class="text-slate-400 text-[10px] block font-semibold uppercase">Ganancia Neta Real</span>
              <span class="text-base font-black text-emerald-700">${{ v.gananciaNetaReal.toLocaleString('es-CO') }}</span>
            </div>
          </div>
        </div>

        <!-- Métricas de Operación -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <div>
            <span class="text-slate-400 block text-[10px]">Odómetro Inicial</span>
            <span class="font-bold text-slate-800">{{ v.kilometrajeInicial.toLocaleString('es-CO') }} km</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Odómetro Final</span>
            <span class="font-bold text-slate-800">{{ v.kilometrajeFinal ? v.kilometrajeFinal.toLocaleString('es-CO') + ' km' : 'En tránsito' }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Km Recorridos Reales</span>
            <span class="font-bold text-slate-800">{{ v.kmRealesRecorridos }} km</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">Gastos en Ruta Registrados</span>
            <span class="font-bold text-rose-700">${{ (v.costoTotalReal || 0).toLocaleString('es-CO') }}</span>
          </div>
        </div>

        <!-- Acciones del Viaje -->
        <div class="flex items-center justify-between pt-2">
          <div class="text-xs text-slate-500">
            <span>{{ v.gastos?.length || 0 }} comprobantes de gastos registrados</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="abrirModalGasto(v)"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              ➕ Registrar Gasto
            </button>
            <button
              v-if="v.estado !== 'FINALIZADO'"
              @click="abrirModalFinalizar(v)"
              class="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
            >
              🏁 Finalizar Viaje
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO DE GASTO EN RUTA -->
    <div
      v-if="mostrarModalGasto"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="font-extrabold text-slate-800 text-base">Registrar Gasto de Ruta – {{ viajeSeleccionado?.codigo }}</h3>
        <form @submit.prevent="guardarGasto" class="mt-4 space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Categoría del Gasto</label>
            <select v-model="formGasto.categoria" class="w-full px-3 py-2 border rounded-lg">
              <option value="COMBUSTIBLE">Combustible ACPM Adicional</option>
              <option value="PEAJE">Peaje en Ruta</option>
              <option value="CONDUCTOR_VIATICOS">Viáticos / Alimentación Conductor</option>
              <option value="LAVADO">Lavado de Volqueta</option>
              <option value="PARQUEADERO">Parqueadero</option>
              <option value="CARGUE_DESCARGUE">Cargue / Descargue Adicional</option>
              <option value="OTRO">Imprevistos / Otros</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Concepto / Detalle</label>
            <input v-model="formGasto.concepto" required type="text" placeholder="Ej. Peaje Curití regreso..." class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Valor en Pesos (COP)</label>
            <input v-model.number="formGasto.valor" required type="number" class="w-full px-3 py-2 border rounded-lg font-bold text-brand-forest" />
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" @click="mostrarModalGasto = false" class="px-4 py-2 border rounded-lg text-slate-600 font-semibold">Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-brand-forest hover:bg-brand-emerald text-white rounded-lg font-bold shadow">Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL FINALIZAR VIAJE -->
    <div
      v-if="mostrarModalFinalizar"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="font-extrabold text-slate-800 text-base">Cierre y Liquidación de Viaje – {{ viajeSeleccionado?.codigo }}</h3>
        <p class="text-xs text-slate-500 mt-1">Ingrese las lecturas finales de odómetro y combustible para consolidar la utilidad real.</p>

        <form @submit.prevent="finalizarViaje" class="mt-4 space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kilometraje Odómetro Final</label>
            <input v-model.number="formFin.kilometrajeFinal" required type="number" class="w-full px-3 py-2 border rounded-lg font-bold" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Galones Reales Cargados</label>
            <input v-model.number="formFin.galonesRealesCargados" required type="number" step="0.1" class="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Costo Total Real ACPM ($)</label>
            <input v-model.number="formFin.costoAcpmReal" required type="number" class="w-full px-3 py-2 border rounded-lg font-bold text-brand-forest" />
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" @click="mostrarModalFinalizar = false" class="px-4 py-2 border rounded-lg text-slate-600 font-semibold">Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow">Consolidar Liquidación</button>
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
const viajes = ref<any[]>([]);

const mostrarModalNuevo = ref(false);
const mostrarModalGasto = ref(false);
const mostrarModalFinalizar = ref(false);
const viajeSeleccionado = ref<any>(null);

const formGasto = ref({
  categoria: 'COMBUSTIBLE',
  concepto: '',
  valor: 0
});

const formFin = ref({
  kilometrajeFinal: 0,
  galonesRealesCargados: 0,
  costoAcpmReal: 0
});

const cargarViajes = async () => {
  try {
    const res = await api.get('/trips');
    viajes.value = res.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const abrirModalGasto = (v: any) => {
  viajeSeleccionado.value = v;
  formGasto.value = {
    categoria: 'COMBUSTIBLE',
    concepto: '',
    valor: 0
  };
  mostrarModalGasto.value = true;
};

const abrirModalFinalizar = (v: any) => {
  viajeSeleccionado.value = v;
  formFin.value = {
    kilometrajeFinal: v.kilometrajeInicial + (v.kmRealesRecorridos || 200),
    galonesRealesCargados: 35,
    costoAcpmReal: 350000
  };
  mostrarModalFinalizar.value = true;
};

const guardarGasto = async () => {
  try {
    await api.post(`/trips/${viajeSeleccionado.value.id}/gastos`, formGasto.value);
    store.notify({ type: 'success', title: 'Gasto Registrado', message: 'Se ha agregado el gasto al viaje.' });
    mostrarModalGasto.value = false;
    await cargarViajes();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const finalizarViaje = async () => {
  try {
    await api.put(`/trips/${viajeSeleccionado.value.id}/finalize`, formFin.value);
    store.notify({ type: 'success', title: 'Viaje Liquidado', message: 'El viaje ha sido cerrado exitosamente.' });
    mostrarModalFinalizar.value = false;
    await cargarViajes();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

onMounted(() => {
  cargarViajes();
});
</script>
