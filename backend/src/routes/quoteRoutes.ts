import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { FinancialEngine, CalculationInput } from '../domain/FinancialEngine';
import { AuditService } from '../services/AuditService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/quotes/calculate-preview (Cálculo instantáneo sin persistencia)
router.post('/calculate-preview', (req: AuthRequest, res: Response) => {
  try {
    const input: CalculationInput = req.body;
    const output = FinancialEngine.calculate(input);
    res.json(output);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/v1/quotes
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      include: {
        cliente: true,
        vehiculo: true,
        origen: true,
        destino: true,
        creadoPor: { select: { id: true, nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(cotizaciones);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/quotes/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        vehiculo: true,
        origen: { include: { departamento: true } },
        destino: { include: { departamento: true } },
        viaje: true,
        creadoPor: { select: { id: true, nombre: true, email: true } }
      }
    });

    if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json(cotizacion);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/quotes (Guardar cotización con snapshot inmutable)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(data.vehiculoId) } });
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' });

    // Ejecutar motor financiero centralizado en backend
    const calcInput: CalculationInput = {
      distanciaKm: Number(data.distanciaKm),
      tipoViaje: data.tipoViaje || 'IDA_Y_REGRESO',
      pesoToneladas: Number(data.pesoToneladas),
      tipoTerreno: data.tipoTerreno || 'ONDULADO',
      factorTraficoEspera: Number(data.factorTraficoEspera || 0),
      regresoCargado: Boolean(data.regresoCargado),
      precioAcpmGalon: Number(data.precioAcpmUsado || vehiculo.precioGalonAcpm || 10077),
      vehiculo: {
        capacidadToneladas: vehiculo.capacidadToneladas,
        capacidadM3: vehiculo.capacidadM3,
        rendimientoKmGalonVacio: vehiculo.rendimientoKmGalonVacio,
        rendimientoKmGalonCargado: vehiculo.rendimientoKmGalonCargado,
        costoMantenimientoKm: vehiculo.costoMantenimientoKm,
        costoLlantasKm: vehiculo.costoLlantasKm,
        costoDepreciacionKm: vehiculo.costoDepreciacionKm
      },
      conductor: {
        tipoPago: data.conductor?.tipoPago || 'VIAJE',
        tarifaBase: Number(data.conductor?.tarifaBase || 120000),
        viaticosAlimentacion: Number(data.conductor?.viaticosAlimentacion || 0),
        viaticosHospedaje: Number(data.conductor?.viaticosHospedaje || 0)
      },
      peajesIda: Number(data.costoPeajesIda || 0),
      peajesRegreso: Number(data.costoPeajesRegreso || 0),
      otrosGastos: data.otrosGastos || {},
      margenGananciaPct: Number(data.margenGananciaPct || 25),
      gananciaFijaDeseada: Number(data.gananciaFijaDeseada || 0),
      gananciaDeseadaPorKm: Number(data.gananciaDeseadaPorKm || 0),
      tipoCalculoGanancia: data.tipoCalculoGanancia || 'PORCENTAJE',
      descuentoCompetitivoPct: Number(data.descuentoCompetitivoPct || 6)
    };

    const fin = FinancialEngine.calculate(calcInput);

    // Generar código único correlativo
    const count = await prisma.cotizacion.count();
    const codigo = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const snapshot = {
      calcInput,
      fin,
      vehiculoSnapshot: vehiculo,
      peajesDetalle: data.peajesDetalle || [],
      fechaCalculo: new Date()
    };

    const nuevaCotizacion = await prisma.cotizacion.create({
      data: {
        codigo,
        clienteId: data.clienteId ? Number(data.clienteId) : null,
        vehiculoId: vehiculo.id,
        origenId: Number(data.origenId),
        destinoId: Number(data.destinoId),
        tipoViaje: data.tipoViaje || 'IDA_Y_REGRESO',
        distanciaKm: Number(data.distanciaKm),
        pesoToneladas: Number(data.pesoToneladas),
        materialTransportado: data.materialTransportado || 'Material de construcción / Agregados',
        consumoGalonesEstimado: fin.galonesConsumidosTotal,
        precioAcpmUsado: calcInput.precioAcpmGalon,
        costoCombustible: fin.costoCombustibleTotal,
        costoConductor: fin.costoConductorTotal,
        costoPeajes: fin.costoPeajesTotal,
        costoMantenimiento: fin.costoMantenimientoTotal,
        costoLlantas: fin.costoLlantasTotal,
        costoDepreciacion: fin.costoDepreciacionTotal,
        costoOtros: fin.costoOtrosGastosTotal,
        costoTotal: fin.costoTotalViaje,
        margenGananciaPct: fin.margenRentabilidadPct,
        gananciaEsperada: fin.gananciaEsperadaRecomendada,
        precioMinimo: fin.precioMinimo,
        precioRecomendado: fin.precioRecomendado,
        precioCompetitivo: fin.precioCompetitivo,
        precioFinalNegociado: data.precioFinalNegociado ? Number(data.precioFinalNegociado) : fin.precioRecomendado,
        estado: 'ENVIADA',
        snapshotDatos: JSON.stringify(snapshot),
        creadoPorId: req.user?.id || 1
      }
    });

    await AuditService.log({
      usuarioId: req.user?.id,
      tablaAfectada: 'cotizaciones',
      registroId: nuevaCotizacion.id,
      accion: 'CREATE',
      valoresNuevos: nuevaCotizacion,
      ip: req.ip
    });

    res.status(201).json(nuevaCotizacion);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/v1/quotes/:id/duplicate
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const original = await prisma.cotizacion.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ error: 'Cotización original no encontrada' });

    const count = await prisma.cotizacion.count();
    const nuevoCodigo = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const duplicada = await prisma.cotizacion.create({
      data: {
        ...original,
        id: undefined,
        codigo: nuevoCodigo,
        estado: 'BORRADOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        creadoPorId: req.user?.id || 1
      }
    });

    res.status(201).json(duplicada);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
