import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuditService } from '../services/AuditService';

const router = Router();

// GET /api/v1/audit
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await AuditService.getRecentLogs(limit);
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
