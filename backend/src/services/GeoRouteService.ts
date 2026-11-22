import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export interface RouteCalculationResult {
  origen: { id: number; nombre: string; lat: number; lon: number };
  destino: { id: number; nombre: string; lat: number; lon: number };
  distanciaKm: number;
  duracionMin: number;
  geometriaGeoJson: any;
  fuente: 'OSRM' | 'FALLBACK_VIRTUAL';
}

export class GeoRouteService {
  /**
   * Obtiene todos los municipios registrados, con prioridad en Santander, Boyacá y Antioquia
   */
  public static async getMunicipios(busqueda?: string, departamentoId?: number) {
    const where: any = {};
    if (departamentoId) {
      where.departamentoId = departamentoId;
    }
    if (busqueda && busqueda.trim()) {
      where.nombre = { contains: busqueda.trim().toUpperCase() };
    }

    return prisma.municipio.findMany({
      where,
      include: { departamento: true },
      orderBy: [{ departamento: { nombre: 'asc' } }, { nombre: 'asc' }]
    });
  }

  /**
   * Obtiene todos los departamentos
   */
  public static async getDepartamentos() {
    return prisma.departamento.findMany({
      include: {
        _count: { select: { municipios: true } }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  /**
   * Calcula la ruta real por carretera entre dos municipios usando OSRM
   */
  public static async calculateRoute(origenId: number, destinoId: number): Promise<RouteCalculationResult> {
    const origen = await prisma.municipio.findUnique({ where: { id: origenId } });
    const destino = await prisma.municipio.findUnique({ where: { id: destinoId } });

    if (!origen || !destino) {
      throw new Error('Municipio de origen o destino no encontrado.');
    }

    // Verificar si ya existe en caché de rutas
    const rutaExistente = await prisma.ruta.findUnique({
      where: { origenId_destinoId: { origenId, destinoId } }
    });

    if (rutaExistente && rutaExistente.distanciaKm > 0 && rutaExistente.geometriaGeoJson) {
      try {
        const geometria = JSON.parse(rutaExistente.geometriaGeoJson);
        return {
          origen: { id: origen.id, nombre: origen.nombre, lat: origen.latitud, lon: origen.longitud },
          destino: { id: destino.id, nombre: destino.nombre, lat: destino.latitud, lon: destino.longitud },
          distanciaKm: rutaExistente.distanciaKm,
          duracionMin: rutaExistente.duracionEstimadaMin,
          geometriaGeoJson: geometria,
          fuente: 'OSRM'
        };
      } catch (e) {
        // Si falló el parseo, se recalcula
      }
    }

    // Consultar OSRM en tiempo real
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origen.longitud},${origen.latitud};${destino.longitud},${destino.latitud}?overview=full&geometries=geojson&steps=false`;
      const response = await axios.get(osrmUrl, { timeout: 7000 });

      if (response.data && response.data.code === 'Ok' && response.data.routes?.length > 0) {
        const route = response.data.routes[0];
        const distanciaKm = parseFloat((route.distance / 1000).toFixed(2));
        const duracionMin = parseFloat((route.duration / 60).toFixed(1));
        const geometriaGeoJson = route.geometry;

        // Guardar en la tabla de rutas
        await prisma.ruta.upsert({
          where: { origenId_destinoId: { origenId, destinoId } },
          update: {
            distanciaKm,
            duracionEstimadaMin: duracionMin,
            geometriaGeoJson: JSON.stringify(geometriaGeoJson)
          },
          create: {
            origenId,
            destinoId,
            distanciaKm,
            duracionEstimadaMin: duracionMin,
            geometriaGeoJson: JSON.stringify(geometriaGeoJson)
          }
        });

        return {
          origen: { id: origen.id, nombre: origen.nombre, lat: origen.latitud, lon: origen.longitud },
          destino: { id: destino.id, nombre: destino.nombre, lat: destino.latitud, lon: destino.longitud },
          distanciaKm,
          duracionMin,
          geometriaGeoJson,
          fuente: 'OSRM'
        };
      }
    } catch (e: any) {
      console.warn('⚠️ OSRM API error o timeout, calculando con factor de curvatura vial Haversine:', e.message);
    }

    // Fallback con distancia Haversine corregida por factor de tortuosidad vial en Colombia (1.35x para cordillera andina)
    const distDirecta = this.calculateHaversineDistanceKm(
      origen.latitud,
      origen.longitud,
      destino.latitud,
      destino.longitud
    );
    const distanciaKmCorregida = parseFloat((distDirecta * 1.35).toFixed(2));
    const duracionMin = parseFloat(((distanciaKmCorregida / 45) * 60).toFixed(1)); // Velocidad promedio volqueta cargada 45 km/h

    const geometriaFallback = {
      type: 'LineString',
      coordinates: [
        [origen.longitud, origen.latitud],
        [destino.longitud, destino.latitud]
      ]
    };

    return {
      origen: { id: origen.id, nombre: origen.nombre, lat: origen.latitud, lon: origen.longitud },
      destino: { id: destino.id, nombre: destino.nombre, lat: destino.latitud, lon: destino.longitud },
      distanciaKm: distanciaKmCorregida,
      duracionMin,
      geometriaGeoJson: geometriaFallback,
      fuente: 'FALLBACK_VIRTUAL'
    };
  }

  public static calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
