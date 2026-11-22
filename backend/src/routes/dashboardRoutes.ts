import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/dashboard/metrics
router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const totalViajes = await prisma.viaje.count();
    const totalCotizaciones = await prisma.cotizacion.count();
    const vehiculosActivos = await prisma.vehiculo.count({ where: { estado: 'ACTIVO' } });

    // Agregados financieros de viajes
    const viajesAgg = await prisma.viaje.aggregate({
      _sum: {
        ingresoCobrado: true,
        costoTotalReal: true,
        gananciaNetaReal: true,
        kmRealesRecorridos: true,
        galonesRealesCargados: true
      }
    });

    // Si los viajes aún no han acumulado datos, sumar también de cotizaciones aprobadas
    const ingresos = viajesAgg._sum.ingresoCobrado || 0;
    const costos = viajesAgg._sum.costoTotalReal || 0;
    const gananciaNeta = viajesAgg._sum.gananciaNetaReal || (ingresos - costos);
    const kmTotales = viajesAgg._sum.kmRealesRecorridos || 0;
    const galonesTotales = viajesAgg._sum.galonesRealesCargados || 0;

    const rentabilidadPromedioPct = ingresos > 0
      ? parseFloat(((gananciaNeta / ingresos) * 100).toFixed(2))
      : 0;

    const costoPromedioKm = kmTotales > 0
      ? Math.round(costos / kmTotales)
      : 0;

    const ingresoPromedioKm = kmTotales > 0
      ? Math.round(ingresos / kmTotales)
      : 0;

    // Precio actual del ACPM (ej. Bucaramanga o promedio)
    const precioAcpmActual = await prisma.precioAcpm.findFirst({
      where: { ciudadNombre: 'BUCARAMANGA', vigente: true }
    });

    // Gastos por categoría
    const gastosPorCategoria = await prisma.gastoViaje.groupBy({
      by: ['categoria'],
      _sum: { valor: true }
    });

    // Precios ACPM vigentes en ciudades principales para gráfica comparativa
    const preciosCiudades = await prisma.precioAcpm.findMany({
      where: { vigente: true },
      take: 6,
      orderBy: { precioGalon: 'asc' }
    });

    res.json({
      resumen: {
        totalViajes,
        totalCotizaciones,
        vehiculosActivos,
        ingresosTotales: ingresos,
        costosTotales: costos,
        gananciaNeta,
        kmTotales,
        galonesTotales,
        rentabilidadPromedioPct,
        costoPromedioKm,
        ingresoPromedioKm,
        precioAcpmActual: precioAcpmActual?.precioGalon || 10077
      },
      gastosPorCategoria: gastosPorCategoria.map(g => ({
        categoria: g.categoria,
        total: g._sum.valor || 0
      })),
      preciosCiudades: preciosCiudades.map(p => ({
        ciudad: p.ciudadNombre,
        precio: p.precioGalon,
        departamento: p.departamentoNombre
      }))
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
