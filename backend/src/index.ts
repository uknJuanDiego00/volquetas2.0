import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import acpmRoutes from './routes/acpmRoutes';
import routeRoutes from './routes/routeRoutes';
import tollRoutes from './routes/tollRoutes';
import quoteRoutes from './routes/quoteRoutes';
import tripRoutes from './routes/tripRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import auditRoutes from './routes/auditRoutes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales de seguridad y logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VOLQUETA PRO API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas Públicas de Auth
app.use('/api/v1/auth', authRoutes);

// Rutas Protegidas de Negocio
app.use('/api/v1/vehicles', authenticateToken, vehicleRoutes);
app.use('/api/v1/acpm', authenticateToken, acpmRoutes);
app.use('/api/v1/routes', authenticateToken, routeRoutes);
app.use('/api/v1/tolls', authenticateToken, tollRoutes);
app.use('/api/v1/quotes', authenticateToken, quoteRoutes);
app.use('/api/v1/trips', authenticateToken, tripRoutes);
app.use('/api/v1/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/v1/audit', authenticateToken, auditRoutes);

// Manejo centralizado de errores
app.use(errorHandler);

// Servir frontend compilado en producción
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Sirviendo frontend desde ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 VOLQUETA PRO Backend activo en http://localhost:${PORT}`);
  console.log(`📡 Endpoints REST disponibles en /api/v1/...`);
});

export default app;
