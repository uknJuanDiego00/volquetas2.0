import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/AuditService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/trips
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const viajes = await prisma.viaje.findMany({
      include: {
        vehiculo: true,
        conductor: true,
        cliente: true,
        cotizacion: {
          include: { origen: true, destino: true }
        },
        gastos: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(viajes);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/trips/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const viaje = await prisma.viaje.findUnique({
      where: { id },
      include: {
        vehiculo: true,
        conductor: true,
        cliente: true,
        cotizacion: {
          include: { origen: true, destino: true }
        },
        gastos: { orderBy: { fecha: 'desc' } },
        creadoPor: { select: { id: true, nombre: true } }
      }
    });

    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json(viaje);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/trips (Crear viaje a partir de cotización o directo)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.viaje.count();
    const codigo = `VJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(data.vehiculoId) } });
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    let ingresoCobrado = Number(data.ingresoCobrado || 0);
    let costoTotalReal = Number(data.costoTotalReal || 0);

    if (data.cotizacionId) {
      const cot = await prisma.cotizacion.findUnique({ where: { id: Number(data.cotizacionId) } });
      if (cot) {
        ingresoCobrado = cot.precioFinalNegociado || cot.precioRecomendado;
        costoTotalReal = cot.costoTotal;
        await prisma.cotizacion.update({ where: { id: cot.id }, data: { estado: 'APROBADA' } });
      }
    }

    const gananciaNetaReal = ingresoCobrado - costoTotalReal;

    const viaje = await prisma.viaje.create({
      data: {
        codigo,
        cotizacionId: data.cotizacionId ? Number(data.cotizacionId) : null,
        vehiculoId: vehiculo.id,
        conductorId: data.conductorId ? Number(data.conductorId) : null,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
        kilometrajeInicial: Number(data.kilometrajeInicial || vehiculo.kilometrajeActual),
        kmRealesRecorridos: Number(data.kmRealesRecorridos || 0),
        galonesRealesCargados: Number(data.galonesRealesCargados || 0),
        costoAcpmReal: Number(data.costoAcpmReal || 0),
        pesoRealToneladas: Number(data.pesoRealToneladas || 0),
        estado: data.estado || 'PROGRAMADO',
        ingresoCobrado,
        costoTotalReal,
        gananciaNetaReal,
        creadoPorId: req.user?.id || 1
      }
    });

    await AuditService.log({
      usuarioId: req.user?.id,
      tablaAfectada: 'viajes',
      registroId: viaje.id,
      accion: 'CREATE',
      valoresNuevos: viaje,
      ip: req.ip
    });

    res.status(201).json(viaje);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/v1/trips/:id/gastos (Agregar gasto operativo al viaje)
router.post('/:id/gastos', async (req: AuthRequest, res: Response) => {
  try {
    const viajeId = parseInt(req.params.id);
    const { categoria, concepto, valor, soporteUrl } = req.body;

    const gasto = await prisma.gastoViaje.create({
      data: {
        viajeId,
        categoria: categoria || 'OTRO',
        concepto,
        valor: Number(valor),
        soporteUrl: soporteUrl || null
      }
    });

    // Recalcular costo real del viaje
    const gastosTotales = await prisma.gastoViaje.aggregate({
      where: { viajeId },
      _sum: { valor: true }
    });

    const viaje = await prisma.viaje.findUnique({ where: { id: viajeId } });
    if (viaje) {
      const nuevoCostoTotal = (viaje.costoAcpmReal || 0) + (gastosTotales._sum.valor || 0);
      const nuevaGanancia = viaje.ingresoCobrado - nuevoCostoTotal;
      await prisma.viaje.update({
        where: { id: viajeId },
        data: {
          costoTotalReal: nuevoCostoTotal,
          gananciaNetaReal: nuevaGanancia
        }
      });
    }

    res.status(201).json(gasto);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/v1/trips/:id/finalize
router.put('/:id/finalize', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { kilometrajeFinal, galonesRealesCargados, costoAcpmReal, ingresoCobrado } = req.body;

    const viaje = await prisma.viaje.findUnique({ where: { id } });
    if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });

    const kmRecorridos = Number(kilometrajeFinal) - viaje.kilometrajeInicial;

    // Actualizar odómetro del vehículo
    await prisma.vehiculo.update({
      where: { id: viaje.vehiculoId },
      data: { kilometrajeActual: Number(kilometrajeFinal) }
    });

    const gastosAgregados = await prisma.gastoViaje.aggregate({
      where: { viajeId: id },
      _sum: { valor: true }
    });

    const costoTotalReal = Number(costoAcpmReal || viaje.costoAcpmReal) + (gastosAgregados._sum.valor || 0);
    const ingreso = ingresoCobrado !== undefined ? Number(ingresoCobrado) : viaje.ingresoCobrado;
    const ganancia = ingreso - costoTotalReal;

    const finalizado = await prisma.viaje.update({
      where: { id },
      data: {
        estado: 'FINALIZADO',
        fechaFin: new Date(),
        kilometrajeFinal: Number(kilometrajeFinal),
        kmRealesRecorridos: kmRecorridos > 0 ? kmRecorridos : viaje.kmRealesRecorridos,
        galonesRealesCargados: Number(galonesRealesCargados || viaje.galonesRealesCargados),
        costoAcpmReal: Number(costoAcpmReal || viaje.costoAcpmReal),
        ingresoCobrado: ingreso,
        costoTotalReal,
        gananciaNetaReal: ganancia
      }
    });

    res.json(finalizado);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
