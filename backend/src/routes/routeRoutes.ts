import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GeoRouteService } from '../services/GeoRouteService';
import { TollService } from '../services/TollService';

const router = Router();

// GET /api/v1/routes/municipios
router.get('/municipios', async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    const dptoId = req.query.departamentoId ? Number(req.query.departamentoId) : undefined;
    const mpios = await GeoRouteService.getMunicipios(q, dptoId);
    res.json(mpios);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/v1/routes/departamentos
router.get('/departamentos', async (req: AuthRequest, res: Response) => {
  try {
    const dptos = await GeoRouteService.getDepartamentos();
    res.json(dptos);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v1/routes/calculate
router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const { origenId, destinoId, categoriaVehiculo = 'CAT_III' } = req.body;
    if (!origenId || !destinoId) {
      return res.status(400).json({ error: 'origenId y destinoId son requeridos' });
    }

    const routeData = await GeoRouteService.calculateRoute(Number(origenId), Number(destinoId));

    // Detección espacial de peajes sobre las coordenadas de la ruta
    let peajesCruzados: any[] = [];
    if (routeData.geometriaGeoJson?.coordinates) {
      peajesCruzados = await TollService.detectTollsAlongRoute(
        routeData.geometriaGeoJson.coordinates,
        categoriaVehiculo
      );
    }

    res.json({
      ...routeData,
      peajesDetectados: peajesCruzados,
      totalPeajesEstimado: peajesCruzados.reduce((sum, p) => sum + (p.tarifaCategoria || 0), 0)
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
