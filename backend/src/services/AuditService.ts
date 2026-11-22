import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditParams {
  usuarioId?: number;
  tablaAfectada: string;
  registroId: number;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  valoresAnteriores?: any;
  valoresNuevos?: any;
  ip?: string;
}

export class AuditService {
  public static async log(params: AuditParams) {
    try {
      await prisma.auditoriaCambio.create({
        data: {
          usuarioId: params.usuarioId || null,
          tablaAfectada: params.tablaAfectada,
          registroId: params.registroId,
          accion: params.accion,
          valoresAnteriores: params.valoresAnteriores ? JSON.stringify(params.valoresAnteriores) : null,
          valoresNuevos: params.valoresNuevos ? JSON.stringify(params.valoresNuevos) : null,
          ip: params.ip || '127.0.0.1'
        }
      });
    } catch (e: any) {
      console.error('Error registrando auditoría:', e.message);
    }
  }

  public static async getRecentLogs(limit = 50) {
    return prisma.auditoriaCambio.findMany({
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true }
        }
      }
    });
  }
}
