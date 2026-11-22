<template>
  <div class="space-y-6">
    <!-- TITULO Y ACCIONES -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Panel de Control & Indicadores</h2>
        <p class="text-sm text-slate-500">Gestión de costos, rentabilidad y consumo operativo de transporte pesado</p>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          to="/cotizaciones"
          class="bg-brand-forest hover:bg-brand-emerald text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
        >
          <span>➕</span>
          <span>Nueva Cotización</span>
        </router-link>
      </div>
    </div>

    <!-- TARJETAS ESTADÍSTICAS (KPIs) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Ingresos Totales -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales</span>
          <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">💵</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">
          ${{ (metrics.resumen?.ingresosTotales || 0).toLocaleString('es-CO') }}
        </p>
        <p class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
          <span>↑</span> Facturación acumulada
        </p>
      </div>

      <!-- 2. Costos Operativos -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos Totales</span>
          <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">📉</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">
          ${{ (metrics.resumen?.costosTotales || 0).toLocaleString('es-CO') }}
        </p>
        <p class="text-[11px] text-slate-500 font-medium mt-1">
          Combustible, peajes y nómina
        </p>
      </div>

      <!-- 3. Ganancia Neta -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ganancia Neta</span>
          <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">📈</span>
        </div>
        <p class="text-2xl font-black text-emerald-700 mt-2">
          ${{ (metrics.resumen?.gananciaNeta || 0).toLocaleString('es-CO') }}
        </p>
        <p class="text-[11px] text-emerald-600 font-bold mt-1">
          Margen: {{ metrics.resumen?.rentabilidadPromedioPct || 25 }}%
        </p>
      </div>

      <!-- 4. Precio ACPM Oficial Vigente -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Galón ACPM</span>
          <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">⛽</span>
        </div>
        <p class="text-2xl font-black text-slate-800 mt-2">
          ${{ (metrics.resumen?.precioAcpmActual || 10077).toLocaleString('es-CO') }}
        </p>
        <p class="text-[11px] text-amber-600 font-semibold mt-1">
          Referencia CREG / MinMinas
        </p>
      </div>
    </div>

    <!-- SEGUNDA FILA DE MÉTRICAS OPERATIVAS -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p class="text-xs text-slate-400 font-semibold">Viajes Realizados</p>
        <p class="text-xl font-extrabold text-slate-800 mt-1">{{ metrics.resumen?.totalViajes || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p class="text-xs text-slate-400 font-semibold">Cotizaciones Registradas</p>
        <p class="text-xl font-extrabold text-slate-800 mt-1">{{ metrics.resumen?.totalCotizaciones || 0 }}</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p class="text-xs text-slate-400 font-semibold">Costo Promedio / Km</p>
        <p class="text-xl font-extrabold text-slate-800 mt-1">
          ${{ (metrics.resumen?.costoPromedioKm || 5460).toLocaleString('es-CO') }}
        </p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 text-center">
        <p class="text-xs text-slate-400 font-semibold">Ingreso Promedio / Km</p>
        <p class="text-xl font-extrabold text-emerald-700 mt-1">
          ${{ (metrics.resumen?.ingresoPromedioKm || 6835).toLocaleString('es-CO') }}
        </p>
      </div>
    </div>

    <!-- GRÁFICOS INTERACTIVOS (CHART.JS) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Gráfico 1: Precios de ACPM en Principales Ciudades -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>⛽</span> Precios Vigentes de ACPM por Ciudad (COP/galón)
          </h3>
          <span class="text-xs text-slate-400 font-medium">Resolución CREG</span>
        </div>
        <div class="h-64">
          <Bar v-if="acpmChartData.labels.length" :data="acpmChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Gráfico 2: Desglose Típico de Costos por Categoría -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>📊</span> Estructura de Costos Operativos de Volqueta
          </h3>
          <span class="text-xs text-slate-400 font-medium">% de Participación</span>
        </div>
        <div class="h-64 flex items-center justify-center">
          <Doughnut :data="costsStructureData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <!-- VOLQUETAS DE LA FLOTA -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>🚛</span> Estado de la Flota de Volquetas
        </h3>
        <router-link to="/vehiculos" class="text-xs font-semibold text-brand-forest hover:underline">
          Ver todas las volquetas →
        </router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
            <tr>
              <th class="py-3 px-4">Placa</th>
              <th class="py-3 px-4">Tipo & Modelo</th>
              <th class="py-3 px-4">Capacidad</th>
              <th class="py-3 px-4">Rendimiento (km/gal)</th>
              <th class="py-3 px-4">Odómetro</th>
              <th class="py-3 px-4">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="v in vehiculos" :key="v.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 font-bold text-slate-900">{{ v.placa }}</td>
              <td class="py-3 px-4">{{ v.marca }} {{ v.modelo }}</td>
              <td class="py-3 px-4">{{ v.capacidadToneladas }} Ton / {{ v.capacidadM3 }} m³</td>
              <td class="py-3 px-4">
                <span class="text-emerald-700 font-semibold">{{ v.rendimientoKmGalonVacio }}</span> vacío /
                <span class="text-amber-700 font-semibold">{{ v.rendimientoKmGalonCargado }}</span> cargado
              </td>
              <td class="py-3 px-4">{{ v.kilometrajeActual.toLocaleString('es-CO') }} km</td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="v.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                >
                  {{ v.estado }}
                </span>
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
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';
import api from '../services/api';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const metrics = ref<any>({});
const vehiculos = ref<any[]>([]);

const acpmChartData = ref<any>({
  labels: [],
  datasets: [{
    label: 'Precio ACPM (COP/galón)',
    data: [],
    backgroundColor: '#166534',
    borderRadius: 6
  }]
});

const costsStructureData = ref<any>({
  labels: ['Combustible ACPM', 'Conductor & Viáticos', 'Peajes', 'Mantenimiento & Aceite', 'Llantas', 'Depreciación'],
  datasets: [{
    data: [35, 18, 12, 14, 11, 10],
    backgroundColor: ['#166534', '#0e3a2f', '#f59e0b', '#3b82f6', '#64748b', '#94a3b8']
  }]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      min: 9000,
      ticks: {
        callback: (value: any) => '$' + Number(value).toLocaleString('es-CO')
      }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' as const }
  }
};

onMounted(async () => {
  try {
    const res = await api.get('/dashboard/metrics');
    metrics.value = res.data;

    if (res.data?.preciosCiudades?.length) {
      acpmChartData.value = {
        labels: res.data.preciosCiudades.map((p: any) => p.ciudad),
        datasets: [{
          label: 'Precio ACPM (COP/galón)',
          data: res.data.preciosCiudades.map((p: any) => p.precio),
          backgroundColor: '#14532d',
          borderRadius: 6
        }]
      };
    }

    const vRes = await api.get('/vehicles');
    vehiculos.value = vRes.data;
  } catch (e) {
    console.error('Error cargando dashboard:', e);
  }
});
</script>
