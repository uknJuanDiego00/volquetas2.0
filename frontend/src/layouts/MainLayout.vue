<template>
  <div class="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
    <!-- SIDEBAR -->
    <aside
      class="w-64 bg-brand-dark text-white flex flex-col justify-between shrink-0 shadow-2xl transition-all duration-300 z-30"
    >
      <div>
        <!-- Logo Brand -->
        <div class="p-5 border-b border-white/10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-forest to-brand-light flex items-center justify-center font-extrabold text-xl shadow-lg border border-white/20">
            🚚
          </div>
          <div>
            <h1 class="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              VOLQUETA <span class="text-brand-light font-black text-xs bg-brand-forest/60 px-1.5 py-0.5 rounded border border-brand-light/30">PRO</span>
            </h1>
            <p class="text-[11px] text-slate-300 font-medium tracking-wide">Transporte Pesado Colombia</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="p-3 space-y-1 text-sm font-medium">
          <router-link
            to="/"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/' }"
          >
            <span class="text-lg">📊</span>
            <span>Dashboard</span>
          </router-link>

          <router-link
            to="/cotizaciones"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path.startsWith('/cotizaciones') }"
          >
            <span class="text-lg">💰</span>
            <span>Calculadora & Cotizar</span>
          </router-link>

          <router-link
            to="/viajes"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/viajes' }"
          >
            <span class="text-lg">🛣️</span>
            <span>Control de Viajes</span>
          </router-link>

          <router-link
            to="/vehiculos"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/vehiculos' }"
          >
            <span class="text-lg">🚛</span>
            <span>Flota de Volquetas</span>
          </router-link>

          <router-link
            to="/acpm"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/acpm' }"
          >
            <span class="text-lg">⛽</span>
            <span>Monitor ACPM Oficial</span>
          </router-link>

          <router-link
            to="/rutas"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/rutas' }"
          >
            <span class="text-lg">🗺️</span>
            <span>Rutas & Mapa OSRM</span>
          </router-link>

          <router-link
            to="/peajes"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/peajes' }"
          >
            <span class="text-lg">🚧</span>
            <span>Tarifas Peajes INVÍAS</span>
          </router-link>

          <router-link
            to="/auditoria"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition group hover:bg-white/10"
            :class="{ 'bg-emerald-700/60 text-white font-semibold border-l-4 border-brand-light shadow-sm': $route.path === '/auditoria' }"
          >
            <span class="text-lg">📋</span>
            <span>Auditoría & Cambios</span>
          </router-link>
        </nav>
      </div>

      <!-- Footer Info del Sidebar -->
      <div class="p-4 border-t border-white/10 bg-black/20 text-xs">
        <div class="flex items-center justify-between text-slate-300 mb-2">
          <span>Precio ACPM Ref:</span>
          <span class="font-bold text-brand-light">${{ store.precioAcpmActual.toLocaleString('es-CO') }}/gal</span>
        </div>
        <div class="flex items-center gap-2 text-slate-400 text-[11px]">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CREG / MinMinas Activo</span>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- HEADER -->
      <header class="h-16 bg-white border-b border-slate-200 shadow-sm px-6 flex items-center justify-between z-20 shrink-0">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700">
            <span class="text-amber-500 font-bold">⛽ ACPM Hoy:</span>
            <span class="font-bold text-brand-forest">${{ store.precioAcpmActual.toLocaleString('es-CO') }} COP/galón</span>
          </div>
          <button
            @click="syncAcpm"
            :disabled="syncing"
            class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1.5"
            title="Sincronizar con API de datos.gov.co"
          >
            <span :class="{ 'animate-spin': syncing }">🔄</span>
            <span>{{ syncing ? 'Sincronizando...' : 'Sincronizar SICOM' }}</span>
          </button>
        </div>

        <!-- Usuario & Estado -->
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-xs font-bold text-slate-800 leading-tight">{{ store.usuario.nombre }}</p>
            <p class="text-[11px] text-emerald-700 font-semibold">{{ store.usuario.rol }} • Santander</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-brand-forest text-white flex items-center justify-center font-bold text-sm shadow">
            AD
          </div>
        </div>
      </header>

      <!-- VIEW CONTAINER -->
      <main class="flex-1 overflow-y-auto p-6 bg-slate-50">
        <router-view />
      </main>
    </div>

    <!-- TOAST NOTIFICATIONS (Esquina inferior derecha) -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppStore } from '../stores/useAppStore';
import ToastContainer from '../components/common/ToastContainer.vue';
import api from '../services/api';

const store = useAppStore();
const syncing = ref(false);

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
