<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Monitor de Combustible ACPM (Diésel)</h2>
        <p class="text-sm text-slate-500">Precios oficiales en Colombia mediante fuentes CREG y Datos Abiertos MinMinas / SICOM</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="sincronizarOficial"
          :disabled="sincronizando"
          class="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
        >
          <span :class="{ 'animate-spin': sincronizando }">🔄</span>
          <span>{{ sincronizando ? 'Consultando SICOM...' : 'Sincronizar API Oficial' }}</span>
        </button>
      </div>
    </div>

    <!-- PRECIOS VIGENTES POR CIUDAD -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="p in preciosVigentes"
        :key="p.id"
        class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-brand-dark uppercase tracking-wide">
              {{ p.ciudadNombre || p.municipio?.nombre }}
            </span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold"
              :class="p.fuente === 'OFICIAL_SICOM' ? 'bg-sky-100 text-sky-800' : p.fuente === 'REGULATORIO_CREG' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ p.fuente }}
            </span>
          </div>
          <p class="text-2xl font-black text-slate-900 mt-3">
            ${{ p.precioGalon.toLocaleString('es-CO') }}
            <span class="text-xs font-normal text-slate-500">/ gal</span>
          </p>
          <p class="text-[11px] text-slate-400 mt-1">
            Actualizado: {{ new Date(p.fechaActualizacion).toLocaleDateString('es-CO') }}
          </p>
        </div>

        <button
          @click="abrirAjusteManual(p)"
          class="mt-4 w-full text-xs font-bold text-brand-forest hover:bg-emerald-50 border border-emerald-200 py-1.5 rounded-lg transition"
        >
          Ajustar Precio Manual
        </button>
      </div>
    </div>

    <!-- HISTORIAL INMUTABLE DE PRECIOS -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>📜</span> Historial Inmutable de Modificaciones & Precios de ACPM
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">Trazabilidad completa requerida para auditoría y recálculo retroactivo</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
            <tr>
              <th class="py-3 px-4">Fecha & Hora</th>
              <th class="py-3 px-4">Ciudad / Región</th>
              <th class="py-3 px-4">Precio Galón</th>
              <th class="py-3 px-4">Fuente del Dato</th>
              <th class="py-3 px-4">Usuario / Origen</th>
              <th class="py-3 px-4">Observaciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="h in historial" :key="h.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 text-slate-500 font-mono">{{ new Date(h.fechaCambio).toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 font-bold text-slate-800">{{ h.precioAcpm?.ciudadNombre || 'Nacional' }}</td>
              <td class="py-3 px-4 font-black text-brand-forest">${{ h.precioGalon.toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {{ h.fuente }}
                </span>
              </td>
              <td class="py-3 px-4">{{ h.usuario?.nombre || 'Sistema / API' }}</td>
              <td class="py-3 px-4 text-slate-500 text-[11px]">{{ h.observaciones || 'Sin observaciones' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL AJUSTE MANUAL -->
    <div
      v-if="mostrarModalManual"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <h3 class="font-extrabold text-slate-800 text-base">
          Ajuste Manual de ACPM – {{ precioSeleccionado?.ciudadNombre }}
        </h3>
        <p class="text-xs text-slate-500 mt-1">
          Este valor quedará registrado con auditoría inmutable en el historial contable.
        </p>

        <form @submit.prevent="guardarAjusteManual" class="mt-4 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Nuevo Precio por Galón (COP)</label>
            <input
              v-model.number="formManual.nuevoPrecioGalon"
              type="number"
              required
              class="w-full px-3 py-2 border rounded-lg font-black text-base text-brand-forest focus:ring-2 focus:ring-brand-forest"
            />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Justificación / Motivo del Cambio</label>
            <textarea
              v-model="formManual.observaciones"
              required
              rows="3"
              placeholder="Ej. Precio preferencial pactado con estación Terpel Pescadero..."
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              @click="mostrarModalManual = false"
              class="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-brand-forest hover:bg-brand-emerald text-white rounded-lg font-bold shadow"
            >
              Registrar Cambio
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
const preciosVigentes = ref<any[]>([]);
const historial = ref<any[]>([]);
const sincronizando = ref(false);

const mostrarModalManual = ref(false);
const precioSeleccionado = ref<any>(null);
const formManual = ref({
  nuevoPrecioGalon: 10077,
  observaciones: ''
});

const cargarDatos = async () => {
  try {
    const [pRes, hRes] = await Promise.all([
      api.get('/acpm/vigentes'),
      api.get('/acpm/historial')
    ]);
    preciosVigentes.value = pRes.data;
    historial.value = hRes.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const sincronizarOficial = async () => {
  sincronizando.value = true;
  try {
    const res = await api.post('/acpm/sync-official');
    store.notify({
      type: 'success',
      title: 'Sincronización Exitosa',
      message: res.data.mensaje || 'Precios actualizados con SICOM datos.gov.co'
    });
    await cargarDatos();
  } catch (e: any) {
    store.notify({
      type: 'warning',
      title: 'Sincronización',
      message: 'Se mantienen precios de referencia regulados vigentes en base de datos'
    });
  } finally {
    sincronizando.value = false;
  }
};

const abrirAjusteManual = (p: any) => {
  precioSeleccionado.value = p;
  formManual.value = {
    nuevoPrecioGalon: p.precioGalon,
    observaciones: ''
  };
  mostrarModalManual.value = true;
};

const guardarAjusteManual = async () => {
  try {
    await api.post('/acpm/manual-update', {
      precioId: precioSeleccionado.value.id,
      nuevoPrecioGalon: formManual.value.nuevoPrecioGalon,
      observaciones: formManual.value.observaciones
    });
    store.notify({
      type: 'success',
      title: 'Precio Actualizado',
      message: `Nuevo precio registrado para ${precioSeleccionado.value.ciudadNombre}`
    });
    mostrarModalManual.value = false;
    await cargarDatos();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error al actualizar', message: e.message });
  }
};

onMounted(() => {
  cargarDatos();
});
</script>
