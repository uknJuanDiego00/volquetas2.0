import { PrismaClient } from '@prisma/client';
import { GeoRouteService } from './GeoRouteService';

const prisma = new PrismaClient();

export interface DetectedToll {
  id: number;
  nombre: string;
  sector: string | null;
  responsable: string;
  latitud: number;
  longitud: number;
  tarifaCategoria: number;
  categoriaVehiculo: string;
}

export class TollService {
  /**
   * Obtiene todos los peajes activos con sus tarifas
   */
  public static async getPeajes() {
    return prisma.peaje.findMany({
      where: { activo: true },
      include: {
        tarifas: {
          orderBy: { categoria: 'asc' }
        }
      },
      orderBy: { nombre: 'asc' }
    });
  }

  /**
   * Detecta peajes a lo largo de una polilínea de coordenadas viales (OSRM)
   * utilizando un radio de proximidad geográfico (geofencing buffer de ~1.5 km de tolerancia sobre el eje vial)
   */
  public static async detectTollsAlongRoute(
    coordinates: [number, number][], // [lon, lat]
    categoriaVehiculo: 'CAT_I' | 'CAT_II' | 'CAT_III' | 'CAT_IV' | 'CAT_V' = 'CAT_III'
  ): Promise<DetectedToll[]> {
    if (!coordinates || coordinates.length === 0) {
      return [];
    }

    const peajes = await prisma.peaje.findMany({
      where: { activo: true },
      include: {
        tarifas: {
          where: { categoria: categoriaVehiculo }
        }
      }
    });

    const peajesDetectados: DetectedToll[] = [];
    const TOLERANCIA_KM = 2.5; // Distancia máxima al eje de la carretera para considerar que la cruza

    for (const peaje of peajes) {
      // Revisar la distancia mínima a los puntos muestreados de la ruta
      // Para optimizar muestreamos cada 5 puntos si hay miles
      const step = Math.max(1, Math.floor(coordinates.length / 200));
      let cruzado = false;

      for (let i = 0; i < coordinates.length; i += step) {
        const [lon, lat] = coordinates[i];
        const dist = GeoRouteService.calculateHaversineDistanceKm(lat, lon, peaje.latitud, peaje.longitud);

        if (dist <= TOLERANCIA_KM) {
          cruzado = true;
          break;
        }
      }

      if (cruzado) {
        const tarifa = peaje.tarifas[0]?.valor || 28000;
        peajesDetectados.push({
          id: peaje.id,
          nombre: peaje.nombre,
          sector: peaje.sector,
          responsable: peaje.responsable,
          latitud: peaje.latitud,
          longitud: peaje.longitud,
          tarifaCategoria: tarifa,
          categoriaVehiculo
        });
      }
    }

    return peajesDetectados;
  }

  /**
   * Registra un nuevo peaje manualmente
   */
  public static async createPeaje(data: {
    nombre: string;
    sector?: string;
    responsable?: string;
    latitud: number;
    longitud: number;
    tarifas: Record<string, number>;
  }) {
    const peaje = await prisma.peaje.create({
      data: {
        nombre: data.nombre,
        sector: data.sector || null,
        responsable: data.responsable || 'INVIAS',
        latitud: data.latitud,
        longitud: data.longitud,
        activo: true
      }
    });

    for (const [cat, val] of Object.entries(data.tarifas)) {
      await prisma.tarifaPeaje.create({
        data: {
          peajeId: peaje.id,
          categoria: cat,
          valor: val,
          fuente: 'MANUAL_USUARIO'
        }
      });
    }

    return peaje;
  }
}
