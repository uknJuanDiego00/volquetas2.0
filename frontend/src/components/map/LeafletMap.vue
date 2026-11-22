<template>
  <div class="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
    <div ref="mapContainer" class="w-full h-full min-h-[350px] z-10"></div>

    <!-- Leyenda flotante responsive -->
    <div class="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-md border border-slate-200 text-[10px] sm:text-xs flex flex-wrap items-center gap-2 sm:gap-3 max-w-[90%]">
      <div class="flex items-center gap-1 sm:gap-1.5">
        <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-600 inline-block shadow"></span>
        <span class="font-medium text-slate-700">Origen</span>
      </div>
      <div class="flex items-center gap-1 sm:gap-1.5">
        <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-600 inline-block shadow"></span>
        <span class="font-medium text-slate-700">Destino</span>
      </div>
      <div class="flex items-center gap-1 sm:gap-1.5">
        <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 inline-block shadow"></span>
        <span class="font-medium text-slate-700">Peaje</span>
      </div>
      <div class="flex items-center gap-1 sm:gap-1.5">
        <span class="w-4 sm:w-6 h-1 rounded bg-emerald-700 inline-block"></span>
        <span class="font-medium text-slate-700">Ruta OSRM</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';

const props = defineProps<{
  origen?: { lat: number; lon: number; nombre: string } | null;
  destino?: { lat: number; lon: number; nombre: string } | null;
  geometriaGeoJson?: any | null;
  peajes?: Array<{ latitud: number; longitud: number; nombre: string; tarifaCategoria?: number }> | null;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let routeLayer: L.GeoJSON | null = null;
let markersLayer: L.LayerGroup | null = null;

const initMap = () => {
  if (!mapContainer.value) return;

  // Centro por defecto en Santander / Colombia
  map = L.map(mapContainer.value).setView([6.9, -73.1], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors | OSRM'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  updateLayers();
};

const updateLayers = () => {
  if (!map) return;

  if (markersLayer) {
    markersLayer.clearLayers();
  }

  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }

  const bounds = L.latLngBounds([]);

  // Marcador Origen
  if (props.origen) {
    const latLng = L.latLng(props.origen.lat, props.origen.lon);
    bounds.extend(latLng);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #166534; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">A</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    L.marker(latLng, { icon })
      .bindPopup(`<b>Origen:</b> ${props.origen.nombre}`)
      .addTo(markersLayer!);
  }

  // Marcador Destino
  if (props.destino) {
    const latLng = L.latLng(props.destino.lat, props.destino.lon);
    bounds.extend(latLng);

    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #dc2626; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">B</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    L.marker(latLng, { icon })
      .bindPopup(`<b>Destino:</b> ${props.destino.nombre}`)
      .addTo(markersLayer!);
  }

  // Peajes
  if (props.peajes && props.peajes.length > 0) {
    props.peajes.forEach(p => {
      const latLng = L.latLng(p.latitud, p.longitud);
      bounds.extend(latLng);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #f59e0b; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">💰</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const popupContent = `
        <div style="font-family: inherit;">
          <b style="color: #0e3a2f;">Peaje: ${p.nombre}</b><br/>
          Tarifa: $${(p.tarifaCategoria || 0).toLocaleString('es-CO')}
        </div>
      `;

      L.marker(latLng, { icon })
        .bindPopup(popupContent)
        .addTo(markersLayer!);
    });
  }

  // Dibujar GeoJSON de la ruta vial
  if (props.geometriaGeoJson) {
    routeLayer = L.geoJSON(props.geometriaGeoJson, {
      style: {
        color: '#0e3a2f',
        weight: 5,
        opacity: 0.85
      }
    }).addTo(map);

    const routeBounds = routeLayer.getBounds();
    if (routeBounds.isValid()) {
      map.fitBounds(routeBounds, { padding: [40, 40] });
      return;
    }
  }

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }
};

watch(() => [props.origen, props.destino, props.geometriaGeoJson, props.peajes], () => {
  updateLayers();
}, { deep: true });

const handleResize = () => {
  if (map) {
    map.invalidateSize();
  }
};

onMounted(() => {
  setTimeout(() => {
    initMap();
    handleResize();
  }, 100);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
