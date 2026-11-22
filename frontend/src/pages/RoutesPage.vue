<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Rutas Viales & Catálogo Geográfico</h2>
        <p class="text-sm text-slate-500">Cálculo de distancias viales reales por carretera (OSRM) en Santander, Boyacá, Antioquia y Colombia</p>
      </div>
    </div>

    <!-- SELECTOR DE RUTA -->
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Municipio de Origen (A)</label>
          <select
            v-model="origenId"
            class="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-forest"
          >
            <option :value="null">Seleccione municipio de origen...</option>
            <optgroup label="Santander">
              <option v-for="m in mpiosSantander" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Boyacá">
              <option v-for="m in mpiosBoyaca" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Antioquia">
              <option v-for="m in mpiosAntioquia" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Otras Regiones / Capitales">
              <option v-for="m in mpiosOtros" :key="m.id" :value="m.id">{{ m.nombre }} ({{ m.departamento?.nombre }})</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Municipio de Destino (B)</label>
          <select
            v-model="destinoId"
            class="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-forest"
          >
            <option :value="null">Seleccione municipio de destino...</option>
            <optgroup label="Santander">
              <option v-for="m in mpiosSantander" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Boyacá">
              <option v-for="m in mpiosBoyaca" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Antioquia">
              <option v-for="m in mpiosAntioquia" :key="m.id" :value="m.id">{{ m.nombre }}</option>
            </optgroup>
            <optgroup label="Otras Regiones / Capitales">
              <option v-for="m in mpiosOtros" :key="m.id" :value="m.id">{{ m.nombre }} ({{ m.departamento?.nombre }})</option>
            </optgroup>
          </select>
        </div>

        <div>
          <button
            @click="calcularRuta"
            :disabled="!origenId || !destinoId || calculando"
            class="w-full bg-brand-forest hover:bg-brand-emerald disabled:bg-slate-300 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            <span :class="{ 'animate-spin': calculando }">📍</span>
            <span>{{ calculando ? 'Trazando por OSRM...' : 'Calcular Ruta Vial Real' }}</span>
          </button>
        </div>
      </div>

      <!-- MÉTRICAS DE LA RUTA CALCULADA -->
      <div v-if="rutaData" class="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase">Distancia de Ida</p>
          <p class="text-xl font-black text-slate-800">{{ rutaData.distanciaKm }} km</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase">Distancia Ida y Vuelta</p>
          <p class="text-xl font-black text-emerald-800">{{ (rutaData.distanciaKm * 2).toFixed(1) }} km</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase">Tiempo Estimado (Volqueta)</p>
          <p class="text-xl font-black text-slate-800">{{ (rutaData.duracionMin / 60).toFixed(1) }} hrs</p>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase">Peajes en la Ruta</p>
          <p class="text-xl font-black text-amber-600">{{ rutaData.peajesDetectados?.length || 0 }} estaciones</p>
        </div>
      </div>
    </div>

    <!-- MAPA LEAFLET INTERACTIVO CON OSRM -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
        <div class="flex items-center gap-2">
          <span>🗺️</span>
          <span>Trazado Vial sobre OpenStreetMap (Curvatura real, no línea recta)</span>
        </div>
        <span v-if="rutaData?.fuente" class="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
          Motor: {{ rutaData.fuente }}
        </span>
      </div>

      <div class="h-[450px]">
        <LeafletMap
          :origen="rutaData?.origen ? { lat: rutaData.origen.lat, lon: rutaData.origen.lon, nombre: rutaData.origen.nombre } : null"
          :destino="rutaData?.destino ? { lat: rutaData.destino.lat, lon: rutaData.destino.lon, nombre: rutaData.destino.nombre } : null"
          :geometria-geo-json="rutaData?.geometriaGeoJson"
          :peajes="rutaData?.peajesDetectados"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import LeafletMap from '../components/map/LeafletMap.vue';
import { useAppStore } from '../stores/useAppStore';

const store = useAppStore();
const municipios = ref<any[]>([]);
const origenId = ref<number | null>(null);
const destinoId = ref<number | null>(null);
const calculando = ref(false);
const rutaData = ref<any>(null);

const mpiosSantander = computed(() => municipios.value.filter(m => m.departamento?.codigoDane === '68'));
const mpiosBoyaca = computed(() => municipios.value.filter(m => m.departamento?.codigoDane === '15'));
const mpiosAntioquia = computed(() => municipios.value.filter(m => m.departamento?.codigoDane === '05'));
const mpiosOtros = computed(() => municipios.value.filter(m => !['68', '15', '05'].includes(m.departamento?.codigoDane)));

const cargarMunicipios = async () => {
  try {
    const res = await api.get('/routes/municipios');
    municipios.value = res.data;

    // Seleccionar por defecto Bucaramanga y San Gil
    const bga = municipios.value.find(m => m.nombre === 'BUCARAMANGA');
    const sanGil = municipios.value.find(m => m.nombre === 'SAN GIL');
    if (bga) origenId.value = bga.id;
    if (sanGil) destinoId.value = sanGil.id;

    if (bga && sanGil) {
      await calcularRuta();
    }
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const calcularRuta = async () => {
  if (!origenId.value || !destinoId.value) return;
  calculando.value = true;
  try {
    const res = await api.post('/routes/calculate', {
      origenId: origenId.value,
      destinoId: destinoId.value,
      categoriaVehiculo: 'CAT_III'
    });
    rutaData.value = res.data;
    store.notify({
      type: 'success',
      title: 'Ruta Calculada',
      message: `Distancia real por carretera: ${res.data.distanciaKm} km.`
    });
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error al calcular ruta', message: e.message });
  } finally {
    calculando.value = false;
  }
};

onMounted(() => {
  cargarMunicipios();
});
</script>
