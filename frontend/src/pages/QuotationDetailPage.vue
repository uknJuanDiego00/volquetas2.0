<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- BARRA DE ACCIONES SUPERIOR -->
    <div class="flex items-center justify-between no-print">
      <router-link to="/cotizaciones" class="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5">
        ← Volver a Cotizaciones
      </router-link>
      <div class="flex items-center gap-2">
        <button
          @click="imprimirCotizacion"
          class="bg-brand-forest hover:bg-brand-emerald text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition flex items-center gap-2"
        >
          <span>🖨️</span>
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>
    </div>

    <!-- DOCUMENTO FORMAL DE COTIZACIÓN (PRINTABLE) -->
    <div id="quotation-document" class="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8 print:shadow-none print:border-none print:p-0">
      <!-- HEADER CORPORATIVO -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-slate-900 pb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-brand-dark text-white flex items-center justify-center text-2xl font-black">
            🚚
          </div>
          <div>
            <h1 class="font-black text-xl tracking-tight text-slate-900">VOLQUETA PRO</h1>
            <p class="text-xs text-slate-500 font-medium">Soluciones Logísticas & Transporte Pesado en Colombia</p>
            <p class="text-[11px] text-slate-400">NIT: 901.458.789-2 • Bucaramanga, Santander</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">
            {{ cotizacion?.estado || 'COTIZACIÓN FORMAL' }}
          </span>
          <p class="text-2xl font-black text-slate-900 mt-2 font-mono">{{ cotizacion?.codigo }}</p>
          <p class="text-xs text-slate-500">Fecha: {{ new Date(cotizacion?.createdAt).toLocaleDateString('es-CO') }}</p>
        </div>
      </div>

      <!-- INFORMACIÓN DEL CLIENTE Y DEL SERVICIO -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-xs">
        <div class="space-y-1.5">
          <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Cliente / Contratante</p>
          <p class="font-black text-slate-900 text-sm">{{ cotizacion?.cliente?.razonSocial || 'Cliente General' }}</p>
          <p class="text-slate-600">NIT / C.C.: {{ cotizacion?.cliente?.nitCedula || 'No especificado' }}</p>
          <p class="text-slate-600">Contacto: {{ cotizacion?.cliente?.contacto || 'Gerencia de Compras' }}</p>
          <p class="text-slate-600">Teléfono: {{ cotizacion?.cliente?.telefono || '3104567890' }}</p>
        </div>
        <div class="space-y-1.5">
          <p class="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Detalle de Operación</p>
          <p><b class="text-slate-800">Origen:</b> {{ cotizacion?.origen?.nombre }} ({{ cotizacion?.origen?.departamento?.nombre }})</p>
          <p><b class="text-slate-800">Destino:</b> {{ cotizacion?.destino?.nombre }} ({{ cotizacion?.destino?.departamento?.nombre }})</p>
          <p><b class="text-slate-800">Distancia Vial:</b> {{ cotizacion?.distanciaKm }} km ({{ cotizacion?.tipoViaje === 'IDA_Y_REGRESO' ? 'Ida y Vuelta' : 'Sencillo' }})</p>
          <p><b class="text-slate-800">Volqueta Asignada:</b> {{ cotizacion?.vehiculo?.placa }} ({{ cotizacion?.vehiculo?.marca }} {{ cotizacion?.vehiculo?.modelo }})</p>
          <p><b class="text-slate-800">Carga Transportada:</b> {{ cotizacion?.pesoToneladas }} Toneladas • {{ cotizacion?.materialTransportado }}</p>
        </div>
      </div>

      <!-- TABLA DETALLADA DE COSTOS Y COMPONENTES -->
      <div class="space-y-3">
        <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Estructura & Desglose Contable del Servicio</h3>
        <table class="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead class="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
            <tr>
              <th class="py-3 px-4">Rubro Operativo</th>
              <th class="py-3 px-4">Descripción Técnica</th>
              <th class="py-3 px-4 text-right">Valor Estimado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr>
              <td class="py-3 px-4 font-bold text-slate-800">Combustible Diésel ACPM</td>
              <td class="py-3 px-4">{{ cotizacion?.consumoGalonesEstimado }} Galones a ${{ cotizacion?.precioAcpmUsado?.toLocaleString('es-CO') }}/gal</td>
              <td class="py-3 px-4 text-right font-semibold">${{ cotizacion?.costoCombustible?.toLocaleString('es-CO') }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-bold text-slate-800">Conductor & Viáticos</td>
              <td class="py-3 px-4">Honorarios de conducción, alimentación y seguridad en ruta</td>
              <td class="py-3 px-4 text-right font-semibold">${{ cotizacion?.costoConductor?.toLocaleString('es-CO') }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-bold text-slate-800">Peajes Nacionales</td>
              <td class="py-3 px-4">Tarifas oficiales INVÍAS / Concesiones de la ruta</td>
              <td class="py-3 px-4 text-right font-semibold">${{ cotizacion?.costoPeajes?.toLocaleString('es-CO') }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-bold text-slate-800">Mantenimiento y Llantas</td>
              <td class="py-3 px-4">Aceite, filtros, lubricación y desgaste de llantas por km</td>
              <td class="py-3 px-4 text-right font-semibold">${{ (cotizacion?.costoMantenimiento + cotizacion?.costoLlantas)?.toLocaleString('es-CO') }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-bold text-slate-800">Depreciación & Otros Operativos</td>
              <td class="py-3 px-4">Amortización de equipo pesado y gastos de cargue/descargue</td>
              <td class="py-3 px-4 text-right font-semibold">${{ (cotizacion?.costoDepreciacion + cotizacion?.costoOtros)?.toLocaleString('es-CO') }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50 font-bold border-t border-slate-200">
            <tr>
              <td colspan="2" class="py-3 px-4 text-slate-600">COSTO TOTAL OPERATIVO (Punto de Equilibrio):</td>
              <td class="py-3 px-4 text-right text-slate-800 font-mono">${{ cotizacion?.costoTotal?.toLocaleString('es-CO') }}</td>
            </tr>
            <tr class="bg-emerald-50 text-emerald-950 font-black text-sm">
              <td colspan="2" class="py-4 px-4">PRECIO TOTAL RECOMENDADO DEL SERVICIO:</td>
              <td class="py-4 px-4 text-right font-mono text-base text-emerald-800">
                ${{ (cotizacion?.precioFinalNegociado || cotizacion?.precioRecomendado)?.toLocaleString('es-CO') }} COP
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- CONDICIONES COMERCIALES Y FIRMAS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs text-slate-500">
        <div class="space-y-2">
          <p class="font-bold text-slate-800">Términos & Condiciones:</p>
          <ul class="list-disc list-inside space-y-1 text-[11px]">
            <li>Validez de la oferta: 15 días calendario a partir de su emisión.</li>
            <li>Tarifa sujeta a variaciones oficiales en precios del ACPM o peajes decretadas por el Gobierno Nacional.</li>
            <li>Tiempos de cargue y descargue pactados: máximo 2 horas. Horas adicionales según acuerdo contractual.</li>
            <li>No se admiten sobrecargas por encima del límite legal de la volqueta ({{ cotizacion?.vehiculo?.capacidadToneladas }} Ton).</li>
          </ul>
        </div>
        <div class="flex flex-col justify-end items-center sm:items-end">
          <div class="w-56 border-b border-slate-400 pb-1 text-center">
            <p class="font-bold text-slate-800 text-xs">{{ cotizacion?.creadoPor?.nombre || 'Administrador de Flota' }}</p>
            <p class="text-[10px] text-slate-400">Despacho & Logística VOLQUETA PRO</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';

const route = useRoute();
const store = useAppStore();
const cotizacion = ref<any>(null);

const cargarCotizacion = async () => {
  try {
    const id = route.params.id;
    const res = await api.get(`/quotes/${id}`);
    cotizacion.value = res.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const imprimirCotizacion = () => {
  window.print();
};

onMounted(() => {
  cargarCotizacion();
});
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: white !important;
  }
}
</style>
