import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/AuditService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/vehicles
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      orderBy: { placa: 'asc' },
      include: {
        _count: {
          select: { viajes: true, cotizaciones: true }
        }
      }
    });
    res.json(vehiculos);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/vehicles/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id },
      include: { viajes: { take: 5, orderBy: { createdAt: 'desc' } } }
    });
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehiculo);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/vehicles
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const nuevo = await prisma.vehiculo.create({
      data: {
        placa: data.placa.toUpperCase().trim(),
        marca: data.marca,
        modelo: data.modelo,
        anio: Number(data.anio),
        tipoVolqueta: data.tipoVolqueta,
        capacidadToneladas: Number(data.capacidadToneladas),
        capacidadM3: Number(data.capacidadM3),
        rendimientoKmGalonVacio: Number(data.rendimientoKmGalonVacio),
        rendimientoKmGalonCargado: Number(data.rendimientoKmGalonCargado),
        kilometrajeActual: Number(data.kilometrajeActual || 0),
        precioGalonAcpm: Number(data.precioGalonAcpm || 10077),
        costoMantenimientoKm: Number(data.costoMantenimientoKm || 0),
        costoLlantasKm: Number(data.costoLlantasKm || 0),
        costoDepreciacionKm: Number(data.costoDepreciacionKm || 0),
        estado: data.estado || 'ACTIVO'
      }
    });

    await AuditService.log({
      usuarioId: req.user?.id,
      tablaAfectada: 'vehiculos',
      registroId: nuevo.id,
      accion: 'CREATE',
      valoresNuevos: nuevo,
      ip: req.ip
    });

    res.status(201).json(nuevo);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/v1/vehicles/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const anterior = await prisma.vehiculo.findUnique({ where: { id } });
    if (!anterior) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const data = req.body;
    const actualizado = await prisma.vehiculo.update({
      where: { id },
      data: {
        marca: data.marca !== undefined ? data.marca : anterior.marca,
        modelo: data.modelo !== undefined ? data.modelo : anterior.modelo,
        anio: data.anio !== undefined ? Number(data.anio) : anterior.anio,
        tipoVolqueta: data.tipoVolqueta || anterior.tipoVolqueta,
        capacidadToneladas: data.capacidadToneladas !== undefined ? Number(data.capacidadToneladas) : anterior.capacidadToneladas,
        capacidadM3: data.capacidadM3 !== undefined ? Number(data.capacidadM3) : anterior.capacidadM3,
        rendimientoKmGalonVacio: data.rendimientoKmGalonVacio !== undefined ? Number(data.rendimientoKmGalonVacio) : anterior.rendimientoKmGalonVacio,
        rendimientoKmGalonCargado: data.rendimientoKmGalonCargado !== undefined ? Number(data.rendimientoKmGalonCargado) : anterior.rendimientoKmGalonCargado,
        kilometrajeActual: data.kilometrajeActual !== undefined ? Number(data.kilometrajeActual) : anterior.kilometrajeActual,
        precioGalonAcpm: data.precioGalonAcpm !== undefined ? Number(data.precioGalonAcpm) : anterior.precioGalonAcpm,
        costoMantenimientoKm: data.costoMantenimientoKm !== undefined ? Number(data.costoMantenimientoKm) : anterior.costoMantenimientoKm,
        costoLlantasKm: data.costoLlantasKm !== undefined ? Number(data.costoLlantasKm) : anterior.costoLlantasKm,
        costoDepreciacionKm: data.costoDepreciacionKm !== undefined ? Number(data.costoDepreciacionKm) : anterior.costoDepreciacionKm,
        estado: data.estado || anterior.estado
      }
    });

    await AuditService.log({
      usuarioId: req.user?.id,
      tablaAfectada: 'vehiculos',
      registroId: id,
      accion: 'UPDATE',
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      ip: req.ip
    });

    res.json(actualizado);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/v1/vehicles/:id (Soft delete a estado INACTIVO)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const anterior = await prisma.vehiculo.findUnique({ where: { id } });
    if (!anterior) return res.status(404).json({ error: 'Vehículo no encontrado' });

    const actualizado = await prisma.vehiculo.update({
      where: { id },
      data: { estado: 'INACTIVO' }
    });

    await AuditService.log({
      usuarioId: req.user?.id,
      tablaAfectada: 'vehiculos',
      registroId: id,
      accion: 'DELETE',
      valoresAnteriores: anterior,
      valoresNuevos: actualizado,
      ip: req.ip
    });

    res.json({ success: true, message: 'Vehículo marcado como inactivo' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
