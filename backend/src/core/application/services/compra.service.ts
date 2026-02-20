/**
 * @file compra.service.ts
 * @description Servicio para gestión de compras/ordenes de compra
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: compras, compra_detalles)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: COMPRAS)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateCompraDto, UpdateCompraDto } from '../dto/compra';

const CACHE_TTL = 1800;
const CACHE_PREFIX = 'compras';

@Injectable()
export class CompraService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /compras - Listar compras de la empresa
   */
  async findAll(empresaId: string, query?: {
    estado?: string;
    estadoPago?: string;
    proveedorId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const where: any = { empresaId };
    if (query?.estado) where.estado = query.estado;
    if (query?.estadoPago) where.estadoPago = query.estadoPago;
    if (query?.proveedorId) where.proveedorId = query.proveedorId;
    if (query?.fechaDesde || query?.fechaHasta) {
      where.fecha = {};
      if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta);
    }

    const compras = await this.prisma.compra.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        proveedor: {
          select: { id: true, razonSocial: true, nombreComercial: true, codigo: true },
        },
        sucursal: {
          select: { id: true, nombre: true },
        },
        detalles: {
          select: {
            id: true,
            descripcion: true,
            cantidad: true,
            precioUnitario: true,
            subtotal: true,
          },
        },
        _count: { select: { detalles: true, pagos: true } },
      },
    });

    return { success: true, data: compras };
  }

  /**
   * GET /compras/:id - Obtener compra con detalles
   */
  async findOne(empresaId: string, id: string) {
    const compra = await this.prisma.compra.findFirst({
      where: { id, empresaId },
      include: {
        proveedor: true,
        sucursal: { select: { id: true, nombre: true } },
        detalles: {
          include: {
            producto: { select: { id: true, nombre: true, codigoInterno: true } },
            variante: { select: { id: true, sku: true, nombreVariante: true } },
          },
        },
        pagos: true,
        creador: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    return { success: true, data: compra };
  }

  /**
   * POST /compras - Crear compra
   */
  async create(empresaId: string, userId: string, dto: CreateCompraDto) {
    // Generar numero automatico si no se provee
    const numero = dto.numero || await this.generateNumero(empresaId);

    // Calcular totales de los detalles
    let subtotal = 0;
    const detallesData = dto.detalles.map((d) => {
      const lineSubtotal = Number(d.cantidad) * Number(d.precioUnitario);
      subtotal += lineSubtotal;
      return {
        productoId: d.productoId || null,
        varianteId: d.varianteId || null,
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        unidadMedida: d.unidadMedida || 'UND',
        precioUnitario: d.precioUnitario,
        subtotal: Number(lineSubtotal.toFixed(2)),
        productoTexto: d.productoTexto || null,
      };
    });

    const descuento = dto.descuento || 0;
    const total = subtotal - descuento;

    const compra = await this.prisma.compra.create({
      data: {
        empresaId,
        sucursalId: dto.sucursalId,
        proveedorId: dto.proveedorId,
        numero,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        tipoDocumentoRef: dto.tipoDocumentoRef || null,
        numeroDocumentoRef: dto.numeroDocumentoRef || null,
        subtotal,
        descuento,
        total,
        montoPendiente: total,
        tipo: dto.tipo || 'compra',
        afectaInventario: dto.afectaInventario ?? true,
        estado: dto.estado || 'recibida',
        notas: dto.notas || null,
        createdBy: userId,
        detalles: {
          create: detallesData,
        },
      },
      include: {
        proveedor: { select: { id: true, razonSocial: true, nombreComercial: true } },
        detalles: true,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: compra,
      message: 'Compra registrada correctamente',
    };
  }

  /**
   * PUT /compras/:id - Actualizar compra (solo borradores)
   */
  async update(empresaId: string, id: string, dto: UpdateCompraDto) {
    const existing = await this.prisma.compra.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Compra no encontrada');
    }
    if (existing.estado !== 'borrador') {
      throw new BadRequestException('Solo se pueden editar compras en estado borrador');
    }

    const updateData: any = {};
    if (dto.fechaVencimiento !== undefined) updateData.fechaVencimiento = dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null;
    if (dto.tipoDocumentoRef !== undefined) updateData.tipoDocumentoRef = dto.tipoDocumentoRef;
    if (dto.numeroDocumentoRef !== undefined) updateData.numeroDocumentoRef = dto.numeroDocumentoRef;
    if (dto.notas !== undefined) updateData.notas = dto.notas;
    if (dto.estado !== undefined) updateData.estado = dto.estado;
    if (dto.tipo !== undefined) updateData.tipo = dto.tipo;

    // Si vienen detalles nuevos, recalcular
    if (dto.detalles && dto.detalles.length > 0) {
      // Eliminar detalles anteriores
      await this.prisma.compraDetalle.deleteMany({ where: { compraId: id } });

      let subtotal = 0;
      const detallesData = dto.detalles.map((d) => {
        const lineSubtotal = Number(d.cantidad) * Number(d.precioUnitario);
        subtotal += lineSubtotal;
        return {
          compraId: id,
          productoId: d.productoId || null,
          varianteId: d.varianteId || null,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          unidadMedida: d.unidadMedida || 'UND',
          precioUnitario: d.precioUnitario,
          subtotal: Number(lineSubtotal.toFixed(2)),
          productoTexto: d.productoTexto || null,
        };
      });

      await this.prisma.compraDetalle.createMany({ data: detallesData });

      const descuento = dto.descuento ?? Number(existing.descuento);
      const total = subtotal - descuento;
      updateData.subtotal = subtotal;
      updateData.descuento = descuento;
      updateData.total = total;
      updateData.montoPendiente = total - Number(existing.montoPagado);
    }

    const compra = await this.prisma.compra.update({
      where: { id },
      data: updateData,
      include: {
        proveedor: { select: { id: true, razonSocial: true, nombreComercial: true } },
        detalles: true,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: compra,
      message: 'Compra actualizada correctamente',
    };
  }

  /**
   * DELETE /compras/:id - Anular compra
   */
  async delete(empresaId: string, id: string) {
    const existing = await this.prisma.compra.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Compra no encontrada');
    }

    await this.prisma.compra.update({
      where: { id },
      data: { estado: 'anulada' },
    });

    await this.invalidateCache(empresaId);

    return { success: true, message: 'Compra anulada correctamente' };
  }

  /**
   * GET /compras/resumen - Resumen de compras
   */
  async getResumen(empresaId: string) {
    const [totalCompras, pendientes, totalMonto] = await Promise.all([
      this.prisma.compra.count({ where: { empresaId, estado: { not: 'anulada' } } }),
      this.prisma.compra.count({ where: { empresaId, estadoPago: 'pendiente', estado: { not: 'anulada' } } }),
      this.prisma.compra.aggregate({
        where: { empresaId, estado: { not: 'anulada' } },
        _sum: { total: true, montoPagado: true, montoPendiente: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCompras,
        pendientesPago: pendientes,
        montoTotal: totalMonto._sum.total || 0,
        montoPagado: totalMonto._sum.montoPagado || 0,
        montoPendiente: totalMonto._sum.montoPendiente || 0,
      },
    };
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async generateNumero(empresaId: string): Promise<string> {
    const last = await this.prisma.compra.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      select: { numero: true },
    });

    if (!last) return 'CMP-001';

    const match = last.numero.match(/CMP-(\d+)/);
    if (match) {
      const next = parseInt(match[1]) + 1;
      return `CMP-${next.toString().padStart(3, '0')}`;
    }
    return `CMP-001`;
  }

  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
