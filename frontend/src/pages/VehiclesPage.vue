<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Flota de Volquetas</h2>
        <p class="text-sm text-slate-500">Configuración técnica de capacidades, rendimiento de combustible y costos de desgaste</p>
      </div>
      <button
        @click="abrirModalNuevo"
        class="bg-brand-forest hover:bg-brand-emerald text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2 self-start"
      >
        <span>➕</span>
        <span>Registrar Volqueta</span>
      </button>
    </div>

    <!-- LISTADO DE VOLQUETAS -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="v in vehiculos"
        :key="v.id"
        class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
      >
        <div>
          <!-- Header Card -->
          <div class="flex items-start justify-between">
            <div>
              <span class="text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white tracking-widest uppercase">
                {{ v.placa }}
              </span>
              <h3 class="font-extrabold text-base text-slate-800 mt-2">
                {{ v.marca }} {{ v.modelo }}
              </h3>
              <p class="text-xs text-slate-500">Modelo {{ v.anio }} • {{ formatTipo(v.tipoVolqueta) }}</p>
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="v.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
            >
              {{ v.estado }}
            </span>
          </div>

          <!-- Métricas Técnicas -->
          <div class="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Capacidad Máx</span>
              <span class="font-bold text-slate-800">{{ v.capacidadToneladas }} Ton</span> / {{ v.capacidadM3 }} m³
            </div>
            <div>
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Odómetro</span>
              <span class="font-bold text-slate-800">{{ v.kilometrajeActual.toLocaleString('es-CO') }} km</span>
            </div>
            <div class="mt-1">
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Rendimiento Vacío</span>
              <span class="font-bold text-emerald-700">{{ v.rendimientoKmGalonVacio }} km/gal</span>
            </div>
            <div class="mt-1">
              <span class="text-slate-400 font-semibold block text-[10px] uppercase">Rendimiento Cargado</span>
              <span class="font-bold text-amber-700">{{ v.rendimientoKmGalonCargado }} km/gal</span>
            </div>
          </div>

          <!-- Costos Operativos por Km -->
          <div class="mt-4 space-y-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span>Mantenimiento & Aceite:</span>
              <span class="font-semibold">${{ v.costoMantenimientoKm }} COP/km</span>
            </div>
            <div class="flex justify-between">
              <span>Desgaste de Llantas:</span>
              <span class="font-semibold">${{ v.costoLlantasKm }} COP/km</span>
            </div>
            <div class="flex justify-between">
              <span>Depreciación de Vehículo:</span>
              <span class="font-semibold">${{ v.costoDepreciacionKm }} COP/km</span>
            </div>
            <div class="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-800">
              <span>Costo Desgaste Total:</span>
              <span class="text-brand-forest">${{ v.costoMantenimientoKm + v.costoLlantasKm + v.costoDepreciacionKm }} COP/km</span>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            @click="abrirModalEditar(v)"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition text-slate-700"
          >
            ✏️ Editar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRO / EDICIÓN -->
    <div
      v-if="mostrarModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-extrabold text-slate-800 text-lg">
            {{ vehiculoEditando?.id ? 'Editar Volqueta' : 'Registrar Nueva Volqueta' }}
          </h3>
          <button @click="mostrarModal = false" class="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <form @submit.prevent="guardarVehiculo" class="mt-4 space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Placa (Col)</label>
              <input
                v-model="form.placa"
                type="text"
                required
                placeholder="WZM-458"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest uppercase font-bold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Marca</label>
              <input
                v-model="form.marca"
                type="text"
                required
                placeholder="International / Kenworth"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Modelo / Línea</label>
              <input
                v-model="form.modelo"
                type="text"
                required
                placeholder="WorkStar 7600"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Año</label>
              <input
                v-model.number="form.anio"
                type="number"
                required
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 mb-1">Tipo de Volqueta</label>
              <select
                v-model="form.tipoVolqueta"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-forest"
              >
                <option value="SENCILLA_2_EJES">Volqueta Sencilla (2 Ejes - C2)</option>
                <option value="DOBLE_TROQUE_3_EJES">Doble Troque (3 Ejes - C3)</option>
                <option value="CUATRO_MANOS_4_EJES">Cuatro Manos (4 Ejes - C4)</option>
                <option value="MULA_TRACTO">Tractomula / Articulado (5+ Ejes)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Capacidad Máxima (Toneladas)</label>
              <input
                v-model.number="form.capacidadToneladas"
                type="number"
                step="0.1"
                required
                class="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Capacidad Volumétrica (m³)</label>
              <input
                v-model.number="form.capacidadM3"
                type="number"
                step="0.1"
                required
                class="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div>
              <label class="block font-bold text-emerald-900 mb-1">Rendimiento Vacío (km/galón)</label>
              <input
                v-model.number="form.rendimientoKmGalonVacio"
                type="number"
                step="0.1"
                required
                class="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
            <div>
              <label class="block font-bold text-amber-900 mb-1">Rendimiento Cargado (km/galón)</label>
              <input
                v-model.number="form.rendimientoKmGalonCargado"
                type="number"
                step="0.1"
                required
                class="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          </div>

          <!-- Costos por Kilómetro -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Mantenimiento ($/km)</label>
              <input
                v-model.number="form.costoMantenimientoKm"
                type="number"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Llantas ($/km)</label>
              <input
                v-model.number="form.costoLlantasKm"
                type="number"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Depreciación ($/km)</label>
              <input
                v-model.number="form.costoDepreciacionKm"
                type="number"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="mostrarModal = false"
              class="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-5 py-2 bg-brand-forest hover:bg-brand-emerald text-white rounded-xl font-bold shadow"
            >
              Guardar Volqueta
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
const vehiculos = ref<any[]>([]);
const mostrarModal = ref(false);
const vehiculoEditando = ref<any>(null);

const form = ref<any>({
  placa: '',
  marca: '',
  modelo: '',
  anio: 2022,
  tipoVolqueta: 'DOBLE_TROQUE_3_EJES',
  capacidadToneladas: 17.5,
  capacidadM3: 14.0,
  rendimientoKmGalonVacio: 8.5,
  rendimientoKmGalonCargado: 6.2,
  costoMantenimientoKm: 750,
  costoLlantasKm: 520,
  costoDepreciacionKm: 450,
  kilometrajeActual: 100000,
  estado: 'ACTIVO'
});

const formatTipo = (tipo: string) => {
  const map: Record<string, string> = {
    SENCILLA_2_EJES: 'Sencilla 2 Ejes (C2)',
    DOBLE_TROQUE_3_EJES: 'Doble Troque 3 Ejes (C3)',
    CUATRO_MANOS_4_EJES: 'Cuatro Manos 4 Ejes (C4)',
    MULA_TRACTO: 'Tractomula Articulada'
  };
  return map[tipo] || tipo;
};

const cargarVehiculos = async () => {
  try {
    const res = await api.get('/vehicles');
    vehiculos.value = res.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const abrirModalNuevo = () => {
  vehiculoEditando.value = null;
  form.value = {
    placa: '',
    marca: '',
    modelo: '',
    anio: 2022,
    tipoVolqueta: 'DOBLE_TROQUE_3_EJES',
    capacidadToneladas: 17.5,
    capacidadM3: 14.0,
    rendimientoKmGalonVacio: 8.5,
    rendimientoKmGalonCargado: 6.2,
    costoMantenimientoKm: 750,
    costoLlantasKm: 520,
    costoDepreciacionKm: 450,
    kilometrajeActual: 100000,
    estado: 'ACTIVO'
  };
  mostrarModal.value = true;
};

const abrirModalEditar = (v: any) => {
  vehiculoEditando.value = v;
  form.value = { ...v };
  mostrarModal.value = true;
};

const guardarVehiculo = async () => {
  try {
    if (vehiculoEditando.value?.id) {
      await api.put(`/vehicles/${vehiculoEditando.value.id}`, form.value);
      store.notify({ type: 'success', title: 'Actualizado', message: `Volqueta ${form.value.placa} actualizada.` });
    } else {
      await api.post('/vehicles', form.value);
      store.notify({ type: 'success', title: 'Registrado', message: `Volqueta ${form.value.placa} agregada a la flota.` });
    }
    mostrarModal.value = false;
    await cargarVehiculos();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error al guardar', message: e.response?.data?.error || e.message });
  }
};

onMounted(() => {
  cargarVehiculos();
});
</script>
