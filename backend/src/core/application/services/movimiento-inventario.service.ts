/**
 * @file movimiento-inventario.service.ts
 * @description Servicio para gestión de movimientos de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateMovimientoDto, MovimientoFiltersDto } from '../dto/movimiento-inventario';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';

@Injectable()
export class MovimientoInventarioService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Listar movimientos con filtros y paginación
   */
  async findAll(empresaId: string, filters: MovimientoFiltersDto) {
    const {
      search,
      varianteId,
      productoId,
      sucursalId,
      loteId,
      tipo,
      motivo,
      fechaDesde,
      fechaHasta,
      limit = 20,
      offset = 0,
    } = filters;

    const where: any = {
      empresaId,
    };

    if (varianteId) {
      where.varianteId = varianteId;
    }

    if (productoId) {
      where.variante = {
        productoId,
      };
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (loteId) {
      where.loteId = loteId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (motivo) {
      where.motivo = motivo;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.createdAt.lte = new Date(fechaHasta);
      }
    }

    if (search) {
      where.OR = [
        { documentoNumero: { contains: search, mode: 'insensitive' } },
        { notas: { contains: search, mode: 'insensitive' } },
        {
          variante: {
            producto: {
              nombre: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          sucursal: {
            select: { id: true, nombre: true },
          },
          variante: {
            select: {
              id: true,
              sku: true,
              producto: {
                select: { id: true, nombre: true },
              },
            },
          },
          usuario: {
            select: { id: true, nombre: true },
          },
          lote: {
            select: { id: true, codigoLote: true, fechaVencimiento: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    };
  }

  /**
   * Obtener un movimiento por ID
   */
  async findOne(empresaId: string, id: string) {
    const movimiento = await this.prisma.movimientoInventario.findFirst({
      where: { id, empresaId },
      include: {
        sucursal: {
          select: { id: true, nombre: true, codigo: true },
        },
        variante: {
          select: {
            id: true,
            sku: true,
            producto: {
              select: { id: true, nombre: true },
            },
          },
        },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        lote: true,
        sucursalOrigen: {
          select: { id: true, nombre: true },
        },
        sucursalDestino: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!movimiento) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    return movimiento;
  }

  /**
   * Crear movimiento de inventario
   * IMPORTANTE: Actualiza stock en variante y stock_sucursal
   */
  async create(empresaId: string, dto: CreateMovimientoDto, usuarioId: string) {
    // Validar variante existe
    const variante = await this.prisma.variante.findFirst({
      where: { id: dto.varianteId },
      include: {
        producto: { select: { empresaId: true } },
      },
    });

    if (!variante || variante.producto.empresaId !== empresaId) {
      throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }

    // Obtener stock actual de la sucursal
    let stockSucursal = await this.prisma.stockSucursal.findUnique({
      where: {
        varianteId_sucursalId: {
          varianteId: dto.varianteId,
          sucursalId: dto.sucursalId,
        },
      },
    });

    const stockAnterior = stockSucursal?.stock || 0;

    // Calcular nuevo stock según tipo de movimiento
    let cantidadDelta = dto.cantidad;
    if (dto.tipo === 'salida' || dto.motivo === 'venta' || dto.motivo === 'merma') {
      cantidadDelta = -Math.abs(dto.cantidad);
    } else if (dto.tipo === 'ajuste') {
      cantidadDelta = dto.motivo === 'ajuste_negativo'
        ? -Math.abs(dto.cantidad)
        : Math.abs(dto.cantidad);
    }

    const stockNuevo = stockAnterior + cantidadDelta;

    // Validar que no quede stock negativo
    if (stockNuevo < 0) {
      throw new BadRequestException(ERROR_MESSAGES.INSUFFICIENT_STOCK);
    }

    // Calcular costo total
    const costoTotal = dto.costoUnitario
      ? dto.costoUnitario * Math.abs(dto.cantidad)
      : null;

    // Usar transacción para asegurar consistencia
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Crear el movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          varianteId: dto.varianteId,
          usuarioId,
          loteId: dto.loteId,
          tipo: dto.tipo,
          motivo: dto.motivo,
          cantidad: cantidadDelta,
          stockAnterior,
          stockNuevo,
          costoUnitario: dto.costoUnitario,
          costoTotal,
          documentoTipo: dto.documentoTipo,
          documentoNumero: dto.documentoNumero,
          documentoId: dto.documentoId,
          sucursalOrigenId: dto.sucursalOrigenId,
          sucursalDestinoId: dto.sucursalDestinoId,
          notas: dto.notas,
        },
        include: {
          sucursal: { select: { id: true, nombre: true } },
          variante: {
            select: {
              id: true,
              sku: true,
              producto: { select: { id: true, nombre: true } },
            },
          },
        },
      });

      // 2. Actualizar stock_sucursal
      if (stockSucursal) {
        await tx.stockSucursal.update({
          where: {
            varianteId_sucursalId: {
              varianteId: dto.varianteId,
              sucursalId: dto.sucursalId,
            },
          },
          data: {
            stock: stockNuevo,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.stockSucursal.create({
          data: {
            varianteId: dto.varianteId,
            sucursalId: dto.sucursalId,
            stock: stockNuevo,
          },
        });
      }

      // 3. Actualizar stock total en variante
      const stockTotal = await tx.stockSucursal.aggregate({
        where: { varianteId: dto.varianteId },
        _sum: { stock: true },
      });

      await tx.variante.update({
        where: { id: dto.varianteId },
        data: { stock: stockTotal._sum.stock || 0 },
      });

      // 4. Si hay lote, actualizar stock del lote
      if (dto.loteId) {
        await tx.lote.update({
          where: { id: dto.loteId },
          data: {
            stock: { increment: cantidadDelta },
          },
        });
      }

      return movimiento;
    });

    // Invalidar caches
    await this.invalidateCache(empresaId, dto.sucursalId);

    return result;
  }

  /**
   * Crear traspaso entre sucursales
   * Genera dos movimientos: salida de origen y entrada en destino
   */
  async createTraspaso(
    empresaId: string,
    dto: {
      varianteId: string;
      sucursalOrigenId: string;
      sucursalDestinoId: string;
      cantidad: number;
      loteId?: string;
      notas?: string;
    },
    usuarioId: string,
  ) {
    // Validar sucursales diferentes
    if (dto.sucursalOrigenId === dto.sucursalDestinoId) {
      throw new BadRequestException('Las sucursales de origen y destino deben ser diferentes');
    }

    // Crear movimiento de salida en origen
    await this.create(
      empresaId,
      {
        sucursalId: dto.sucursalOrigenId,
        varianteId: dto.varianteId,
        loteId: dto.loteId,
        tipo: 'traspaso',
        motivo: 'traspaso_salida',
        cantidad: dto.cantidad,
        sucursalOrigenId: dto.sucursalOrigenId,
        sucursalDestinoId: dto.sucursalDestinoId,
        notas: dto.notas,
      },
      usuarioId,
    );

    // Crear movimiento de entrada en destino
    const movimientoDestino = await this.create(
      empresaId,
      {
        sucursalId: dto.sucursalDestinoId,
        varianteId: dto.varianteId,
        loteId: dto.loteId,
        tipo: 'traspaso',
        motivo: 'traspaso_entrada',
        cantidad: dto.cantidad,
        sucursalOrigenId: dto.sucursalOrigenId,
        sucursalDestinoId: dto.sucursalDestinoId,
        notas: dto.notas,
      },
      usuarioId,
    );

    return movimientoDestino;
  }

  /**
   * Obtener resumen de movimientos por tipo
   */
  async getResumen(empresaId: string, sucursalId?: string, fechaDesde?: string, fechaHasta?: string) {
    const where: any = { empresaId };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) where.createdAt.gte = new Date(fechaDesde);
      if (fechaHasta) where.createdAt.lte = new Date(fechaHasta);
    }

    const [entradas, salidas, ajustes, traspasos] = await Promise.all([
      this.prisma.movimientoInventario.aggregate({
        where: { ...where, tipo: 'entrada' },
        _sum: { cantidad: true },
        _count: true,
      }),
      this.prisma.movimientoInventario.aggregate({
        where: { ...where, tipo: 'salida' },
        _sum: { cantidad: true },
        _count: true,
      }),
      this.prisma.movimientoInventario.aggregate({
        where: { ...where, tipo: 'ajuste' },
        _sum: { cantidad: true },
        _count: true,
      }),
      this.prisma.movimientoInventario.aggregate({
        where: { ...where, tipo: 'traspaso' },
        _count: true,
      }),
    ]);

    return {
      entradas: {
        cantidad: entradas._sum.cantidad || 0,
        total: entradas._count,
      },
      salidas: {
        cantidad: Math.abs(salidas._sum.cantidad || 0),
        total: salidas._count,
      },
      ajustes: {
        cantidad: ajustes._sum.cantidad || 0,
        total: ajustes._count,
      },
      traspasos: {
        total: traspasos._count,
      },
    };
  }

  /**
   * Obtener kardex de una variante (historial completo)
   */
  async getKardex(empresaId: string, varianteId: string, sucursalId?: string) {
    const where: any = {
      empresaId,
      varianteId,
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where,
      include: {
        sucursal: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
        lote: { select: { id: true, codigoLote: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return movimientos;
  }

  /**
   * Invalidar cache relacionada
   */
  private async invalidateCache(empresaId: string, sucursalId: string) {
    await Promise.all([
      this.redis.delPattern(`empresa_${empresaId}:movimientos:*`),
      this.redis.delPattern(`empresa_${empresaId}:stock:*`),
      this.redis.delPattern(`empresa_${empresaId}:variantes:*`),
      this.redis.delPattern(`sucursal_${sucursalId}:stock:*`),
    ]);
  }
}
