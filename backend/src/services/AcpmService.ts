import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { AuditService } from './AuditService';

const prisma = new PrismaClient();

export class AcpmService {
  /**
   * Obtiene todos los precios vigentes en el sistema
   */
  public static async getPreciosVigentes() {
    return prisma.precioAcpm.findMany({
      where: { vigente: true },
      include: {
        municipio: {
          include: { departamento: true }
        }
      },
      orderBy: { ciudadNombre: 'asc' }
    });
  }

  /**
   * Obtiene el historial completo de precios con trazabilidad inmutable
   */
  public static async getHistorial(precioAcpmId?: number) {
    return prisma.historialPrecioAcpm.findMany({
      where: precioAcpmId ? { precioAcpmId } : {},
      include: {
        precioAcpm: true,
        usuario: {
          select: { id: true, nombre: true, email: true }
        }
      },
      orderBy: { fechaCambio: 'desc' },
      take: 100
    });
  }

  /**
   * Actualiza manualmente el precio de una ciudad/municipio
   */
  public static async updatePrecioManual(
    precioId: number,
    nuevoPrecioGalon: number,
    usuarioId: number,
    observaciones?: string,
    ip?: string
  ) {
    const precioActual = await prisma.precioAcpm.findUnique({ where: { id: precioId } });
    if (!precioActual) {
      throw new Error(`Registro de precio #${precioId} no encontrado.`);
    }

    const precioActualizado = await prisma.precioAcpm.update({
      where: { id: precioId },
      data: {
        precioGalon: nuevoPrecioGalon,
        fechaActualizacion: new Date(),
        fuente: 'INGRESO_MANUAL'
      }
    });

    // Registrar en historial inmutable
    await prisma.historialPrecioAcpm.create({
      data: {
        precioAcpmId: precioId,
        precioGalon: nuevoPrecioGalon,
        fuente: 'INGRESO_MANUAL',
        usuarioId,
        observaciones: observaciones || 'Ajuste manual de precio de ACPM por operador'
      }
    });

    // Auditoría
    await AuditService.log({
      usuarioId,
      tablaAfectada: 'precios_acpm',
      registroId: precioId,
      accion: 'UPDATE',
      valoresAnteriores: precioActual,
      valoresNuevos: precioActualizado,
      ip
    });

    return precioActualizado;
  }

  /**
   * Sincroniza desde la API oficial de MinMinas / SICOM en datos.gov.co
   */
  public static async syncFromOfficialSicomApi(usuarioId?: number) {
    try {
      console.log('🔄 Sincronizando precios de ACPM desde MinMinas/SICOM (datos.gov.co)...');
      // Consultamos el dataset oficial gjy9-tpph filtrando por producto BIODIESEL EXTRA / ACPM
      const url = 'https://www.datos.gov.co/resource/gjy9-tpph.json?$where=producto%20like%20%27%25BIODIESEL%25%27%20OR%20producto%20like%20%27%25ACPM%25%27&$limit=50&$order=periodo%20desc,mes%20desc';
      const response = await axios.get(url, { timeout: 8000 });

      if (Array.isArray(response.data) && response.data.length > 0) {
        let actualizados = 0;
        for (const item of response.data) {
          const precioNum = parseFloat(item.precio);
          const ciudadNombre = (item.municipio || '').trim().toUpperCase();
          const dptoNombre = (item.departamento || '').trim().toUpperCase();

          if (!isNaN(precioNum) && precioNum > 5000 && precioNum < 25000 && ciudadNombre) {
            const registroExistente = await prisma.precioAcpm.findFirst({
              where: {
                ciudadNombre: { contains: ciudadNombre }
              }
            });

            if (registroExistente && registroExistente.precioGalon !== precioNum) {
              await prisma.precioAcpm.update({
                where: { id: registroExistente.id },
                data: {
                  precioGalon: precioNum,
                  fechaActualizacion: new Date(),
                  fuente: 'OFICIAL_SICOM'
                }
              });

              await prisma.historialPrecioAcpm.create({
                data: {
                  precioAcpmId: registroExistente.id,
                  precioGalon: precioNum,
                  fuente: 'OFICIAL_SICOM',
                  usuarioId: usuarioId || null,
                  observaciones: `Actualizado automáticamente desde SICOM MinMinas estación: ${item.nombre_comercial || 'EDS'}`
                }
              });
              actualizados++;
            }
          }
        }
        return { success: true, count: response.data.length, actualizados, mensaje: 'Precios sincronizados con datos.gov.co' };
      }
      return { success: true, actualizados: 0, mensaje: 'No hubo variaciones de precio en la consulta' };
    } catch (e: any) {
      console.warn('⚠️ No fue posible consultar la API de datos.gov.co en este ciclo:', e.message);
      return { success: false, error: e.message, mensaje: 'Se mantienen precios de referencia regulados vigentes en base de datos' };
    }
  }
}
