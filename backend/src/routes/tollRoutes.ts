import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TollService } from '../services/TollService';

const router = Router();

// GET /api/v1/tolls
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const peajes = await TollService.getPeajes();
    res.json(peajes);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/tolls
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const peaje = await TollService.createPeaje(req.body);
    res.status(201).json(peaje);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
