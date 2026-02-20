/**
 * @file pago-proveedor.service.ts
 * @description Servicio para gestión de pagos a proveedores
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: pagos_proveedor)
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreatePagoProveedorDto } from '../dto/pago-proveedor';

const CACHE_PREFIX = 'pagos-proveedor';

@Injectable()
export class PagoProveedorService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /pagos-proveedor - Listar pagos
   */
  async findAll(empresaId: string, query?: {
    proveedorId?: string;
    compraId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const where: any = { empresaId, estado: 'completado' };
    if (query?.proveedorId) where.proveedorId = query.proveedorId;
    if (query?.compraId) where.compraId = query.compraId;
    if (query?.fechaDesde || query?.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta);
    }

    const pagos = await this.prisma.pagoProveedor.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        proveedor: {
          select: { id: true, razonSocial: true, nombreComercial: true, codigo: true },
        },
        compra: {
          select: { id: true, numero: true, total: true },
        },
      },
    });

    return { success: true, data: pagos };
  }

  /**
   * GET /pagos-proveedor/:id - Obtener pago
   */
  async findOne(empresaId: string, id: string) {
    const pago = await this.prisma.pagoProveedor.findFirst({
      where: { id, empresaId },
      include: {
        proveedor: true,
        compra: { include: { detalles: true } },
        creador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return { success: true, data: pago };
  }

  /**
   * POST /pagos-proveedor - Registrar pago
   */
  async create(empresaId: string, userId: string, dto: CreatePagoProveedorDto) {
    const numero = dto.numero || await this.generateNumero(empresaId);

    // Validar que el proveedor existe
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: dto.proveedorId, empresaId },
    });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Si es pago a una compra especifica, validar
    if (dto.compraId) {
      const compra = await this.prisma.compra.findFirst({
        where: { id: dto.compraId, empresaId, proveedorId: dto.proveedorId },
      });
      if (!compra) {
        throw new NotFoundException('Compra no encontrada para este proveedor');
      }
      if (Number(compra.montoPendiente) < dto.monto) {
        throw new BadRequestException('El monto del pago excede el saldo pendiente de la compra');
      }
    }

    const pago = await this.prisma.pagoProveedor.create({
      data: {
        empresaId,
        proveedorId: dto.proveedorId,
        compraId: dto.compraId || null,
        numero,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        monto: dto.monto,
        metodoPago: dto.metodoPago || 'efectivo',
        referencia: dto.referencia || null,
        estado: 'completado',
        notas: dto.notas || null,
        createdBy: userId,
      },
      include: {
        proveedor: { select: { id: true, razonSocial: true, nombreComercial: true } },
      },
    });

    // Actualizar monto pagado/pendiente en la compra si aplica
    if (dto.compraId) {
      const compra = await this.prisma.compra.findUnique({ where: { id: dto.compraId } });
      if (compra) {
        const nuevoPagado = Number(compra.montoPagado) + dto.monto;
        const nuevoPendiente = Number(compra.total) - nuevoPagado;
        const nuevoEstadoPago = nuevoPendiente <= 0 ? 'pagado' : nuevoPagado > 0 ? 'parcial' : 'pendiente';

        await this.prisma.compra.update({
          where: { id: dto.compraId },
          data: {
            montoPagado: nuevoPagado,
            montoPendiente: Math.max(0, nuevoPendiente),
            estadoPago: nuevoEstadoPago,
          },
        });
      }
    }

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: pago,
      message: 'Pago registrado correctamente',
    };
  }

  /**
   * DELETE /pagos-proveedor/:id - Anular pago
   */
  async anular(empresaId: string, id: string) {
    const pago = await this.prisma.pagoProveedor.findFirst({
      where: { id, empresaId },
    });
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }
    if (pago.estado === 'anulado') {
      throw new BadRequestException('Este pago ya fue anulado');
    }

    await this.prisma.pagoProveedor.update({
      where: { id },
      data: { estado: 'anulado' },
    });

    // Revertir montos en la compra si aplica
    if (pago.compraId) {
      const compra = await this.prisma.compra.findUnique({ where: { id: pago.compraId } });
      if (compra) {
        const nuevoPagado = Math.max(0, Number(compra.montoPagado) - Number(pago.monto));
        const nuevoPendiente = Number(compra.total) - nuevoPagado;
        const nuevoEstadoPago = nuevoPagado <= 0 ? 'pendiente' : 'parcial';

        await this.prisma.compra.update({
          where: { id: pago.compraId },
          data: {
            montoPagado: nuevoPagado,
            montoPendiente: nuevoPendiente,
            estadoPago: nuevoEstadoPago,
          },
        });
      }
    }

    await this.invalidateCache(empresaId);

    return { success: true, message: 'Pago anulado correctamente' };
  }

  /**
   * GET /pagos-proveedor/resumen - Resumen de pagos
   */
  async getResumen(empresaId: string) {
    const [totalPagos, montoTotal] = await Promise.all([
      this.prisma.pagoProveedor.count({ where: { empresaId, estado: 'completado' } }),
      this.prisma.pagoProveedor.aggregate({
        where: { empresaId, estado: 'completado' },
        _sum: { monto: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalPagos,
        montoTotal: montoTotal._sum.monto || 0,
      },
    };
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async generateNumero(empresaId: string): Promise<string> {
    const last = await this.prisma.pagoProveedor.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    });

    if (!last) return 'PAG-001';

    const match = last.numero.match(/PAG-(\d+)/);
    if (match) {
      const next = parseInt(match[1]) + 1;
      return `PAG-${next.toString().padStart(3, '0')}`;
    }
    return `PAG-001`;
  }

  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
