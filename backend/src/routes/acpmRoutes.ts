import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AcpmService } from '../services/AcpmService';

const router = Router();

// GET /api/v1/acpm/vigentes
router.get('/vigentes', async (req: AuthRequest, res: Response) => {
  try {
    const precios = await AcpmService.getPreciosVigentes();
    res.json(precios);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/acpm/historial
router.get('/historial', async (req: AuthRequest, res: Response) => {
  try {
    const precioId = req.query.precioId ? Number(req.query.precioId) : undefined;
    const historial = await AcpmService.getHistorial(precioId);
    res.json(historial);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/acpm/manual-update
router.post('/manual-update', async (req: AuthRequest, res: Response) => {
  try {
    const { precioId, nuevoPrecioGalon, observaciones } = req.body;
    if (!precioId || !nuevoPrecioGalon || nuevoPrecioGalon <= 0) {
      return res.status(400).json({ error: 'precioId y nuevoPrecioGalon válidos son requeridos' });
    }

    const actualizado = await AcpmService.updatePrecioManual(
      Number(precioId),
      Number(nuevoPrecioGalon),
      req.user?.id || 1,
      observaciones,
      req.ip
    );

    res.json({ success: true, precio: actualizado });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/v1/acpm/sync-official
router.post('/sync-official', async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await AcpmService.syncFromOfficialSicomApi(req.user?.id);
    res.json(resultado);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
