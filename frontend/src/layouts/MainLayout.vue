<template>
  <div class="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
    <!-- BACKDROP PARA MÓVIL (Al abrir el menú lateral) -->
    <transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="menuMovilAbierto"
        @click="menuMovilAbierto = false"
        class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
        aria-hidden="true"
      ></div>
    </transition>

    <!-- SIDEBAR DE NAVEGACIÓN (DRAWER RESPONSIVE) -->
    <aside
      class="fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-brand-dark text-white flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0"
      :class="menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full overflow-y-auto">
        <!-- Logo Brand & Botón Cerrar en Móvil -->
        <div class="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-forest to-brand-light flex items-center justify-center font-extrabold text-xl shadow-lg border border-white/20">
              🚚
            </div>
            <div>
              <h1 class="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                VOLQUETA <span class="text-brand-light font-black text-xs bg-brand-forest/60 px-1.5 py-0.5 rounded border border-brand-light/30">PRO</span>
              </h1>
              <p class="text-[11px] text-slate-300 font-medium tracking-wide">Transporte Pesado Col</p>
            </div>
          </div>
          <!-- Botón Cerrar (Solo Móvil) -->
          <button
            @click="menuMovilAbierto = false"
            class="lg:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            aria-label="Cerrar menú"
          >
            <span class="text-xl font-bold">✕</span>
          </button>
        </div>

        <!-- Enlaces de Navegación -->
        <nav class="p-3 space-y-1 text-sm font-medium flex-1">
          <router-link
            to="/"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/' }"
          >
            <span class="text-lg">📊</span>
            <span>Dashboard</span>
          </router-link>

          <router-link
            to="/cotizaciones"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path.startsWith('/cotizaciones') }"
          >
            <span class="text-lg">💰</span>
            <span>Calculadora & Cotizar</span>
          </router-link>

          <router-link
            to="/viajes"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/viajes' }"
          >
            <span class="text-lg">🛣️</span>
            <span>Control de Viajes</span>
          </router-link>

          <router-link
            to="/vehiculos"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/vehiculos' }"
          >
            <span class="text-lg">🚛</span>
            <span>Flota de Volquetas</span>
          </router-link>

          <router-link
            to="/acpm"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/acpm' }"
          >
            <span class="text-lg">⛽</span>
            <span>Monitor ACPM Oficial</span>
          </router-link>

          <router-link
            to="/rutas"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/rutas' }"
          >
            <span class="text-lg">🗺️</span>
            <span>Rutas & Mapa OSRM</span>
          </router-link>

          <router-link
            to="/peajes"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/peajes' }"
          >
            <span class="text-lg">🚧</span>
            <span>Tarifas Peajes INVÍAS</span>
          </router-link>

          <router-link
            to="/auditoria"
            @click="menuMovilAbierto = false"
            class="flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/70 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/auditoria' }"
          >
            <span class="text-lg">📋</span>
            <span>Auditoría & Cambios</span>
          </router-link>
        </nav>

        <!-- Footer Info del Sidebar -->
        <div class="p-4 border-t border-white/10 bg-black/20 text-xs shrink-0">
          <div class="flex items-center justify-between text-slate-300 mb-1.5">
            <span>Precio ACPM Ref:</span>
            <span class="font-bold text-brand-light">${{ store.precioAcpmActual.toLocaleString('es-CO') }}/gal</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CREG / MinMinas Colombia</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ÁREA DE CONTENIDO PRINCIPAL -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- HEADER RESPONSIVE -->
      <header class="h-16 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <!-- Lado Izquierdo: Botón Hamburguesa + Logo en móvil + Badge ACPM -->
        <div class="flex items-center gap-3">
          <!-- BOTÓN MENÚ HAMBURGUESA (Visible en móviles y tablets) -->
          <button
            @click="menuMovilAbierto = !menuMovilAbierto"
            class="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-brand-forest"
            aria-label="Abrir menú de navegación"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Título en Móvil -->
          <div class="flex items-center gap-1.5 lg:hidden">
            <span class="text-lg">🚚</span>
            <span class="font-extrabold text-sm tracking-tight text-slate-900">VOLQUETA <span class="text-brand-forest">PRO</span></span>
          </div>

          <!-- Badge ACPM (Adaptable: texto corto en móvil, completo en desktop) -->
          <div class="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
            <span class="text-amber-500 font-bold">⛽ ACPM:</span>
            <span class="font-bold text-brand-forest">${{ store.precioAcpmActual.toLocaleString('es-CO') }} COP/gal</span>
          </div>
          <div class="sm:hidden flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-bold text-brand-forest">
            <span>⛽</span>
            <span>${{ store.precioAcpmActual.toLocaleString('es-CO') }}</span>
          </div>

          <!-- Botón Sincronizar SICOM -->
          <button
            @click="syncAcpm"
            :disabled="syncing"
            class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-300 transition flex items-center gap-1.5"
            title="Sincronizar con API de datos.gov.co"
          >
            <span :class="{ 'animate-spin': syncing }">🔄</span>
            <span class="hidden md:inline">{{ syncing ? 'Sincronizando...' : 'Sincronizar SICOM' }}</span>
          </button>
        </div>

        <!-- Lado Derecho: Usuario & Perfil -->
        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold text-slate-800 leading-tight">{{ store.usuario.nombre }}</p>
            <p class="text-[11px] text-emerald-700 font-semibold">{{ store.usuario.rol }} • Colombia</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-brand-forest text-white flex items-center justify-center font-bold text-sm shadow ring-2 ring-emerald-500/20">
            AD
          </div>
        </div>
      </header>

      <!-- VIEW CONTAINER (Flotante y adaptable de 320px hasta pantallas ultra-wide) -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
        <div class="max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full">
          <router-view />
        </div>
      </main>
    </div>

    <!-- TOAST NOTIFICATIONS (Esquina inferior derecha) -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/useAppStore';
import ToastContainer from '../components/common/ToastContainer.vue';
import api from '../services/api';

const store = useAppStore();
const route = useRoute();
const syncing = ref(false);
const menuMovilAbierto = ref(false);

// Cerrar el drawer móvil automáticamente al cambiar de ruta
watch(() => route.path, () => {
  menuMovilAbierto.value = false;
});

const syncAcpm = async () => {
  syncing.value = true;
  try {
    const res = await api.post('/acpm/sync-official');
    store.notify({
      type: 'success',
      title: 'Sincronización Completada',
      message: res.data.mensaje || 'Precios actualizados con la red oficial'
    });
    await store.fetchGlobalMetrics();
  } catch (e: any) {
    store.notify({
      type: 'warning',
      title: 'Información de API',
      message: 'Se mantienen precios de referencia regulados vigentes en base de datos'
    });
  } finally {
    syncing.value = false;
  }
};

onMounted(() => {
  store.fetchGlobalMetrics();
});
</script>
