<template>
  <div class="space-y-6">
    <!-- CABECERA -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Calculadora Inteligente & Cotizaciones</h2>
        <p class="text-sm text-slate-500">Cálculo reactivo de costos operativos, punto de equilibrio y precios de transporte en volqueta</p>
      </div>
      <button
        @click="scrollToCalculator"
        class="bg-brand-forest hover:bg-brand-emerald text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2 self-start"
      >
        <span>⚡</span>
        <span>Nueva Cotización Rápida</span>
      </button>
    </div>

    <!-- CALCULADORA INTELIGENTE REACTIVA -->
    <div id="calculator-section" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <h3 class="font-extrabold text-base text-slate-800 flex items-center gap-2">
          <span>🧮</span> Parámetros del Viaje & Volqueta
        </h3>
        <span class="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold self-start sm:self-auto">
          Motor Financiero Activo
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- COLUMNA 1: VEHÍCULO Y RUTA -->
        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Volqueta de la Flota</label>
            <select
              v-model="form.vehiculoId"
              @change="onVehiculoChange"
              class="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-brand-forest"
            >
              <option v-for="v in vehiculos" :key="v.id" :value="v.id">
                {{ v.placa }} – {{ v.marca }} ({{ v.capacidadToneladas }} Ton / {{ v.rendimientoKmGalonVacio }}-{{ v.rendimientoKmGalonCargado }} km/gal)
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Municipio Origen</label>
              <select
                v-model="form.origenId"
                @change="onRutaChange"
                class="w-full px-3 py-2 border rounded-xl"
              >
                <option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Municipio Destino</label>
              <select
                v-model="form.destinoId"
                @change="onRutaChange"
                class="w-full px-3 py-2 border rounded-xl"
              >
                <option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.nombre }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Distancia Carretera (km)</label>
              <input
                v-model.number="form.distanciaKm"
                @input="recalcular"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Modalidad de Viaje</label>
              <select
                v-model="form.tipoViaje"
                @change="recalcular"
                class="w-full px-3 py-2 border rounded-xl font-semibold"
              >
                <option value="IDA_Y_REGRESO">Ida y Regreso</option>
                <option value="SOLO_IDA">Solo Ida (Sencillo)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Cliente Solicitante</label>
            <select v-model="form.clienteId" class="w-full px-3 py-2 border rounded-xl">
              <option :value="null">Seleccionar cliente...</option>
              <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.razonSocial }}</option>
            </select>
          </div>
        </div>

        <!-- COLUMNA 2: CARGA, TERRENO Y COMBUSTIBLE -->
        <div class="space-y-4 text-xs">
          <!-- Peso transportado con alerta de sobrecarga -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-bold text-slate-700">Peso Transportado (Toneladas)</label>
              <span class="text-[10px] text-slate-400">Capacidad: {{ vehiculoSeleccionado?.capacidadToneladas || 17.5 }} Ton</span>
            </div>
            <input
              v-model.number="form.pesoToneladas"
              @input="recalcular"
              type="number"
              step="0.5"
              class="w-full px-3 py-2 border rounded-xl font-black text-sm"
              :class="calculo?.alertaSobrecarga ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-300'"
            />
            <!-- ALERTA DE SOBRECARGA -->
            <div v-if="calculo?.alertaSobrecarga" class="mt-1.5 p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
              <span>⚠️</span>
              <span>¡ALERTA DE SOBRECARGA! Excede la capacidad en {{ calculo.pesoExcedenteToneladas }} Toneladas. Riesgo mecánico y sanción vial.</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Topografía / Terreno</label>
              <select
                v-model="form.tipoTerreno"
                @change="recalcular"
                class="w-full px-3 py-2 border rounded-xl"
              >
                <option value="PLANO">Plano (1.0x)</option>
                <option value="ONDULADO">Ondulado (1.12x)</option>
                <option value="MONTANA">Montaña / Cordillera (1.28x)</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Tráfico / Espera (%)</label>
              <input
                v-model.number="form.factorTraficoEspera"
                @input="recalcular"
                type="number"
                min="0"
                max="30"
                class="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Precio ACPM ($/gal)</label>
              <input
                v-model.number="form.precioAcpmUsado"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl font-bold text-brand-forest"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">¿Regreso Cargado?</label>
              <select
                v-model="form.regresoCargado"
                @change="recalcular"
                class="w-full px-3 py-2 border rounded-xl"
              >
                <option :value="false">No (Regresa Vacío)</option>
                <option :value="true">Sí (Carga de Retorno)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Material a Transportar</label>
            <input
              v-model="form.materialTransportado"
              type="text"
              placeholder="Ej. Triturado 3/4, Base granular, Arena..."
              class="w-full px-3 py-2 border rounded-xl"
            />
          </div>
        </div>

        <!-- COLUMNA 3: CONDUCTOR, PEAJES Y UTILIDAD -->
        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Pago Conductor ($)</label>
              <input
                v-model.number="form.conductorTarifaBase"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Viáticos / Alimentación</label>
              <input
                v-model.number="form.conductorViaticos"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Peajes Ida ($)</label>
              <input
                v-model.number="form.costoPeajesIda"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Peajes Regreso ($)</label>
              <input
                v-model.number="form.costoPeajesRegreso"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl font-bold"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Otros Gastos (Cargue/Lavado)</label>
              <input
                v-model.number="form.otrosGastosTotal"
                @input="recalcular"
                type="number"
                class="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label class="block font-bold text-emerald-900 mb-1">Margen Ganancia Meta (%)</label>
              <input
                v-model.number="form.margenGananciaPct"
                @input="recalcular"
                type="number"
                min="5"
                max="100"
                class="w-full px-3 py-2 border rounded-xl font-black text-emerald-700 text-sm"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              @click="guardarCotizacion"
              :disabled="guardando"
              class="w-full bg-brand-forest hover:bg-brand-emerald text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>{{ guardando ? 'Guardando Snapshot...' : 'Guardar Cotización Oficial' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ESCENARIOS FINANCIEROS DE PRECIOS -->
      <div v-if="calculo" class="pt-4 border-t border-slate-200">
        <h4 class="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
          Escenarios Financieros de Precios Recomendados
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Escenario 1: Precio Mínimo -->
          <div class="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-500 uppercase">1. Precio Mínimo</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">Punto de Equilibrio</span>
            </div>
            <p class="text-2xl font-black text-slate-800 mt-2">
              ${{ calculo.precioMinimo.toLocaleString('es-CO') }}
            </p>
            <p class="text-xs text-slate-500 mt-1">Cubre el 100% de los costos sin margen de ganancia ($0 utilidad).</p>
          </div>

          <!-- Escenario 2: Precio Recomendado -->
          <div class="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 shadow-md relative overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-emerald-900 uppercase">2. Precio Recomendado</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-700 text-white">Óptimo ({{ form.margenGananciaPct }}% Margen)</span>
            </div>
            <p class="text-3xl font-black text-emerald-900 mt-2">
              ${{ calculo.precioRecomendado.toLocaleString('es-CO') }}
            </p>
            <div class="flex items-center justify-between text-xs text-emerald-800 font-bold mt-2 pt-2 border-t border-emerald-200">
              <span>Ganancia Neta:</span>
              <span>+${{ calculo.gananciaEsperadaRecomendada.toLocaleString('es-CO') }} COP</span>
            </div>
          </div>

          <!-- Escenario 3: Precio Competitivo -->
          <div class="p-4 rounded-2xl border border-amber-300 bg-amber-50/40">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-900 uppercase">3. Precio Competitivo</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Descuento Controlado</span>
            </div>
            <p class="text-2xl font-black text-slate-800 mt-2">
              ${{ calculo.precioCompetitivo.toLocaleString('es-CO') }}
            </p>
            <div class="flex items-center justify-between text-xs text-amber-900 font-semibold mt-2 pt-2 border-t border-amber-200">
              <span>Ganancia Ajustada:</span>
              <span>+${{ calculo.gananciaCompetitiva.toLocaleString('es-CO') }} COP</span>
            </div>
          </div>
        </div>

        <!-- DESGLOSE DETALLADO DE COSTOS -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4 text-center text-xs">
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Combustible ({{ calculo.galonesConsumidosTotal }} gal)</span>
            <span class="font-bold text-slate-800">${{ calculo.costoCombustibleTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Conductor & Viáticos</span>
            <span class="font-bold text-slate-800">${{ calculo.costoConductorTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Peajes</span>
            <span class="font-bold text-slate-800">${{ calculo.costoPeajesTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Mantenimiento</span>
            <span class="font-bold text-slate-800">${{ calculo.costoMantenimientoTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Llantas</span>
            <span class="font-bold text-slate-800">${{ calculo.costoLlantasTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span class="text-slate-400 block text-[10px]">Depreciación</span>
            <span class="font-bold text-slate-800">${{ calculo.costoDepreciacionTotal.toLocaleString('es-CO') }}</span>
          </div>
          <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <span class="text-emerald-800 block text-[10px] font-bold">Costo por Km</span>
            <span class="font-black text-emerald-900">${{ calculo.costoPorKm.toLocaleString('es-CO') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE COTIZACIONES GUARDADAS -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
          <span>📋</span> Historial de Cotizaciones Emitidas
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase">
            <tr>
              <th class="py-3 px-4">Código</th>
              <th class="py-3 px-4">Cliente</th>
              <th class="py-3 px-4">Volqueta</th>
              <th class="py-3 px-4">Ruta (Origen - Destino)</th>
              <th class="py-3 px-4">Distancia & Carga</th>
              <th class="py-3 px-4 text-right">Costo Total</th>
              <th class="py-3 px-4 text-right">Precio Sugerido</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr v-for="q in cotizaciones" :key="q.id" class="hover:bg-slate-50/80 transition">
              <td class="py-3 px-4 font-mono font-bold text-slate-900">{{ q.codigo }}</td>
              <td class="py-3 px-4 font-semibold text-slate-800">{{ q.cliente?.razonSocial || 'Cliente Ocasional' }}</td>
              <td class="py-3 px-4">{{ q.vehiculo?.placa }}</td>
              <td class="py-3 px-4">
                <span class="font-bold text-slate-800">{{ q.origen?.nombre }}</span> →
                <span class="font-bold text-slate-800">{{ q.destino?.nombre }}</span>
              </td>
              <td class="py-3 px-4">{{ q.distanciaKm }} km • {{ q.pesoToneladas }} Ton</td>
              <td class="py-3 px-4 text-right font-semibold">${{ q.costoTotal.toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4 text-right font-black text-brand-forest">${{ q.precioRecomendado.toLocaleString('es-CO') }}</td>
              <td class="py-3 px-4">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="q.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ q.estado }}
                </span>
              </td>
              <td class="py-3 px-4 text-center space-x-2">
                <router-link
                  :to="`/cotizaciones/${q.id}`"
                  class="text-brand-forest hover:text-brand-emerald font-bold"
                  title="Ver Detalle & PDF"
                >
                  📄 Ver
                </router-link>
                <button
                  @click="duplicarCotizacion(q.id)"
                  class="text-slate-600 hover:text-slate-800 font-semibold"
                  title="Duplicar"
                >
                  📑 Duplicar
                </button>
                <button
                  v-if="q.estado !== 'APROBADA'"
                  @click="convertirEnViaje(q)"
                  class="text-emerald-700 hover:text-emerald-900 font-bold"
                  title="Convertir en Viaje"
                >
                  🚚 Crear Viaje
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useAppStore } from '../stores/useAppStore';

const router = useRouter();
const store = useAppStore();

const vehiculos = ref<any[]>([]);
const municipios = ref<any[]>([]);
const clientes = ref<any[]>([]);
const cotizaciones = ref<any[]>([]);
const calculo = ref<any>(null);
const guardando = ref(false);

const form = ref<any>({
  vehiculoId: null,
  origenId: null,
  destinoId: null,
  clienteId: null,
  distanciaKm: 98.65,
  tipoViaje: 'IDA_Y_REGRESO',
  pesoToneladas: 15.0,
  tipoTerreno: 'MONTANA',
  factorTraficoEspera: 5,
  precioAcpmUsado: 10077,
  regresoCargado: false,
  materialTransportado: 'Piedra rajón y agregados de cantera',
  conductorTarifaBase: 130000,
  conductorViaticos: 35000,
  costoPeajesIda: 56300,
  costoPeajesRegreso: 56300,
  otrosGastosTotal: 50000,
  margenGananciaPct: 25
});

const vehiculoSeleccionado = computed(() => {
  return vehiculos.value.find(v => v.id === form.value.vehiculoId);
});

const cargarDatosIniciales = async () => {
  try {
    const [vRes, mRes, qRes] = await Promise.all([
      api.get('/vehicles'),
      api.get('/routes/municipios'),
      api.get('/quotes')
    ]);

    vehiculos.value = vRes.data;
    municipios.value = mRes.data;
    cotizaciones.value = qRes.data;

    // Default vehiculo
    if (vehiculos.value.length > 0) {
      form.value.vehiculoId = vehiculos.value[0].id;
    }

    // Default municipios (Bga y San Gil)
    const bga = municipios.value.find(m => m.nombre === 'BUCARAMANGA');
    const sanGil = municipios.value.find(m => m.nombre === 'SAN GIL');
    if (bga) form.value.origenId = bga.id;
    if (sanGil) form.value.destinoId = sanGil.id;

    await recalcular();
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const onVehiculoChange = () => {
  if (vehiculoSeleccionado.value) {
    form.value.precioAcpmUsado = vehiculoSeleccionado.value.precioGalonAcpm || store.precioAcpmActual;
  }
  recalcular();
};

const onRutaChange = async () => {
  if (form.value.origenId && form.value.destinoId) {
    try {
      const res = await api.post('/routes/calculate', {
        origenId: form.value.origenId,
        destinoId: form.value.destinoId,
        categoriaVehiculo: 'CAT_III'
      });
      form.value.distanciaKm = res.data.distanciaKm;
      form.value.costoPeajesIda = res.data.totalPeajesEstimado || 56300;
      form.value.costoPeajesRegreso = res.data.totalPeajesEstimado || 56300;
      await recalcular();
    } catch (e) {
      // Keep manual distance
    }
  }
};

const recalcular = async () => {
  if (!vehiculoSeleccionado.value) return;

  const payload = {
    distanciaKm: form.value.distanciaKm,
    tipoViaje: form.value.tipoViaje,
    pesoToneladas: form.value.pesoToneladas,
    tipoTerreno: form.value.tipoTerreno,
    factorTraficoEspera: form.value.factorTraficoEspera,
    regresoCargado: form.value.regresoCargado,
    precioAcpmGalon: form.value.precioAcpmUsado,
    vehiculo: {
      capacidadToneladas: vehiculoSeleccionado.value.capacidadToneladas,
      capacidadM3: vehiculoSeleccionado.value.capacidadM3,
      rendimientoKmGalonVacio: vehiculoSeleccionado.value.rendimientoKmGalonVacio,
      rendimientoKmGalonCargado: vehiculoSeleccionado.value.rendimientoKmGalonCargado,
      costoMantenimientoKm: vehiculoSeleccionado.value.costoMantenimientoKm,
      costoLlantasKm: vehiculoSeleccionado.value.costoLlantasKm,
      costoDepreciacionKm: vehiculoSeleccionado.value.costoDepreciacionKm
    },
    conductor: {
      tipoPago: 'VIAJE',
      tarifaBase: form.value.conductorTarifaBase,
      viaticosAlimentacion: form.value.conductorViaticos
    },
    peajesIda: form.value.costoPeajesIda,
    peajesRegreso: form.value.costoPeajesRegreso,
    otrosGastos: {
      adicionales: form.value.otrosGastosTotal
    },
    margenGananciaPct: form.value.margenGananciaPct,
    descuentoCompetitivoPct: 6
  };

  try {
    const res = await api.post('/quotes/calculate-preview', payload);
    calculo.value = res.data;
  } catch (e: any) {
    console.error('Error calculando:', e);
  }
};

const guardarCotizacion = async () => {
  guardando.value = true;
  try {
    const payload = {
      ...form.value,
      conductor: {
        tipoPago: 'VIAJE',
        tarifaBase: form.value.conductorTarifaBase,
        viaticosAlimentacion: form.value.conductorViaticos
      },
      otrosGastos: {
        adicionales: form.value.otrosGastosTotal
      }
    };
    const res = await api.post('/quotes', payload);
    store.notify({
      type: 'success',
      title: 'Cotización Guardada',
      message: `Código ${res.data.codigo} generado con snapshot inmutable.`
    });
    const qRes = await api.get('/quotes');
    cotizaciones.value = qRes.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error al guardar', message: e.message });
  } finally {
    guardando.value = false;
  }
};

const duplicarCotizacion = async (id: number) => {
  try {
    await api.post(`/quotes/${id}/duplicate`);
    store.notify({ type: 'success', title: 'Cotización Duplicada', message: 'Se ha creado una copia en borrador.' });
    const qRes = await api.get('/quotes');
    cotizaciones.value = qRes.data;
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const convertirEnViaje = async (cotizacion: any) => {
  try {
    await api.post('/trips', {
      cotizacionId: cotizacion.id,
      vehiculoId: cotizacion.vehiculoId,
      ingresoCobrado: cotizacion.precioRecomendado,
      costoTotalReal: cotizacion.costoTotal,
      estado: 'PROGRAMADO'
    });
    store.notify({
      type: 'success',
      title: 'Viaje Creado',
      message: `Viaje programado con base en la cotización ${cotizacion.codigo}.`
    });
    router.push('/viajes');
  } catch (e: any) {
    store.notify({ type: 'error', title: 'Error', message: e.message });
  }
};

const scrollToCalculator = () => {
  const el = document.getElementById('calculator-section');
  el?.scrollIntoView({ behavior: 'smooth' });
};

onMounted(() => {
  cargarDatosIniciales();
});
</script>
