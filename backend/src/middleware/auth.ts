import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_volqueta_pro_key_jwt_2026_colombia';

export interface AuthenticatedUser {
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Si no se provee token en desarrollo/demo, asignamos usuario default de flota
    req.user = { id: 1, email: 'admin@volquetapro.co', nombre: 'Administrador de Flota', rol: 'ADMIN' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token de autenticación inválido o expirado' });
    }
    req.user = user as AuthenticatedUser;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes para esta operación' });
    }
    next();
  };
};
