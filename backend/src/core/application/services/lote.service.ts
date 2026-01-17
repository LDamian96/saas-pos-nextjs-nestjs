/**
 * @file lote.service.ts
 * @description Servicio para gestión de lotes (FEFO)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: lotes)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateLoteDto, UpdateLoteDto, LoteFiltersDto } from '../dto/lote';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';

const CACHE_TTL = 1800; // 30 minutos (lotes cambian más frecuente)
const CACHE_PREFIX = 'lotes';

@Injectable()
export class LoteService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /lotes - Listar lotes con filtros y paginación
   */
  async findAll(empresaId: string, filters: LoteFiltersDto) {
    const {
      search,
      varianteId,
      productoId,
      sucursalId,
      estado,
      diasVencimiento,
      conStock,
      page = 1,
      limit = 20,
    } = filters;

    // Construir where
    const where: any = { empresaId };

    if (varianteId) {
      where.varianteId = varianteId;
    }

    if (productoId) {
      where.variante = { productoId };
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.codigoLote = { contains: search, mode: 'insensitive' };
    }

    if (diasVencimiento) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasVencimiento);
      where.fechaVencimiento = {
        lte: fechaLimite,
        gte: new Date(), // No incluir vencidos
      };
    }

    if (conStock) {
      where.stock = { gt: 0 };
    }

    // Contar total
    const total = await this.prisma.lote.count({ where });

    // Obtener lotes
    const lotes = await this.prisma.lote.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { fechaVencimiento: 'asc' }, // FEFO: primero los que vencen antes
        { createdAt: 'desc' },
      ],
      include: {
        variante: {
          select: {
            id: true,
            sku: true,
            nombreVariante: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                sku: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    // Calcular días restantes para cada lote
    const data = lotes.map((lote) => ({
      ...lote,
      diasRestantes: lote.fechaVencimiento
        ? Math.ceil(
            (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    }));

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /lotes/:id - Obtener lote por ID
   */
  async findOne(empresaId: string, loteId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, empresaId },
      include: {
        variante: {
          select: {
            id: true,
            sku: true,
            nombreVariante: true,
            producto: {
              select: {
                id: true,
                nombre: true,
                sku: true,
                imagenPrincipal: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        movimientosInventario: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            tipo: true,
            motivo: true,
            cantidad: true,
            stockAnterior: true,
            stockNuevo: true,
            createdAt: true,
          },
        },
      },
    });

    if (!lote) {
      throw new NotFoundException(ERROR_MESSAGES.LOTE_NOT_FOUND);
    }

    // Calcular días restantes
    const diasRestantes = lote.fechaVencimiento
      ? Math.ceil(
          (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      success: true,
      data: {
        ...lote,
        diasRestantes,
      },
    };
  }

  /**
   * GET /lotes/variante/:varianteId - Obtener lotes FEFO de una variante
   */
  async findByVarianteFEFO(
    empresaId: string,
    varianteId: string,
    sucursalId?: string,
  ) {
    const where: any = {
      empresaId,
      varianteId,
      estado: 'activo',
      stock: { gt: 0 },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const lotes = await this.prisma.lote.findMany({
      where,
      orderBy: [
        { fechaVencimiento: 'asc' }, // FEFO
      ],
      select: {
        id: true,
        codigoLote: true,
        fechaVencimiento: true,
        stock: true,
        costoUnitario: true,
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Calcular días restantes
    const data = lotes.map((lote) => ({
      ...lote,
      diasRestantes: lote.fechaVencimiento
        ? Math.ceil(
            (new Date(lote.fechaVencimiento).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    }));

    return { success: true, data };
  }

  /**
   * GET /lotes/proximos-vencer - Lotes próximos a vencer
   */
  async findProximosVencer(empresaId: string, dias: number = 30, sucursalId?: string) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    const where: any = {
      empresaId,
      estado: 'activo',
      stock: { gt: 0 },
      fechaVencimiento: {
        lte: fechaLimite,
        gte: new Date(),
      },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const lotes = await this.prisma.lote.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        variante: {
          select: {
            sku: true,
            nombreVariante: true,
            producto: {
              select: {
                nombre: true,
                imagenPrincipal: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Calcular días restantes y agrupar por urgencia
    const data = lotes.map((lote) => {
      const diasRestantes = Math.ceil(
        (new Date(lote.fechaVencimiento!).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        ...lote,
        diasRestantes,
        urgencia:
          diasRestantes <= 7 ? 'critico' : diasRestantes <= 15 ? 'alerta' : 'proximo',
      };
    });

    return {
      success: true,
      data,
      resumen: {
        criticos: data.filter((l) => l.urgencia === 'critico').length,
        alertas: data.filter((l) => l.urgencia === 'alerta').length,
        proximos: data.filter((l) => l.urgencia === 'proximo').length,
      },
    };
  }

  /**
   * GET /lotes/vencidos - Lotes vencidos
   */
  async findVencidos(empresaId: string, sucursalId?: string) {
    const where: any = {
      empresaId,
      estado: { in: ['activo', 'vencido'] },
      stock: { gt: 0 },
      fechaVencimiento: { lt: new Date() },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const lotes = await this.prisma.lote.findMany({
      where,
      orderBy: { fechaVencimiento: 'asc' },
      include: {
        variante: {
          select: {
            sku: true,
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // Marcar como vencidos si aún no lo están
    const lotesParaActualizar = lotes
      .filter((l) => l.estado === 'activo')
      .map((l) => l.id);

    if (lotesParaActualizar.length > 0) {
      await this.prisma.lote.updateMany({
        where: { id: { in: lotesParaActualizar } },
        data: { estado: 'vencido' },
      });
    }

    return {
      success: true,
      data: lotes.map((l) => ({ ...l, estado: 'vencido' })),
      total: lotes.length,
    };
  }

  /**
   * POST /lotes - Crear lote
   */
  async create(empresaId: string, dto: CreateLoteDto, usuarioId: string) {
    // 1. Verificar que la variante existe
    const variante = await this.prisma.variante.findFirst({
      where: {
        id: dto.varianteId,
        producto: { empresaId },
      },
    });

    if (!variante) {
      throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }

    // 2. Verificar que el código de lote no exista
    const existingLote = await this.prisma.lote.findFirst({
      where: {
        empresaId,
        varianteId: dto.varianteId,
        sucursalId: dto.sucursalId,
        codigoLote: dto.codigoLote,
      },
    });

    if (existingLote) {
      throw new ConflictException(ERROR_MESSAGES.LOTE_DUPLICATE);
    }

    // 3. Crear lote
    const lote = await this.prisma.lote.create({
      data: {
        empresaId,
        varianteId: dto.varianteId,
        sucursalId: dto.sucursalId,
        codigoLote: dto.codigoLote,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        fechaFabricacion: dto.fechaFabricacion ? new Date(dto.fechaFabricacion) : null,
        fechaIngreso: dto.fechaIngreso ? new Date(dto.fechaIngreso) : new Date(),
        stock: dto.stock,
        stockInicial: dto.stock,
        costoUnitario: dto.costoUnitario,
        notas: dto.notas,
        createdBy: usuarioId,
      },
      include: {
        variante: {
          select: {
            sku: true,
            producto: {
              select: {
                nombre: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            nombre: true,
          },
        },
      },
    });

    // 4. Actualizar stock de la variante
    await this.prisma.variante.update({
      where: { id: dto.varianteId },
      data: {
        stock: { increment: dto.stock },
      },
    });

    // 5. Actualizar o crear stock_sucursal
    await this.prisma.stockSucursal.upsert({
      where: {
        varianteId_sucursalId: {
          varianteId: dto.varianteId,
          sucursalId: dto.sucursalId,
        },
      },
      update: {
        stock: { increment: dto.stock },
      },
      create: {
        varianteId: dto.varianteId,
        sucursalId: dto.sucursalId,
        stock: dto.stock,
      },
    });

    // 6. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: lote,
      message: 'Lote creado correctamente',
    };
  }

  /**
   * PATCH /lotes/:id - Actualizar lote
   */
  async update(empresaId: string, loteId: string, dto: UpdateLoteDto) {
    // 1. Verificar que existe
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, empresaId },
    });

    if (!lote) {
      throw new NotFoundException(ERROR_MESSAGES.LOTE_NOT_FOUND);
    }

    // 2. Si cambia el código, verificar que no exista
    if (dto.codigoLote && dto.codigoLote !== lote.codigoLote) {
      const existingLote = await this.prisma.lote.findFirst({
        where: {
          empresaId,
          varianteId: lote.varianteId,
          sucursalId: lote.sucursalId,
          codigoLote: dto.codigoLote,
          id: { not: loteId },
        },
      });

      if (existingLote) {
        throw new ConflictException(ERROR_MESSAGES.LOTE_DUPLICATE);
      }
    }

    // 3. Actualizar
    const updated = await this.prisma.lote.update({
      where: { id: loteId },
      data: {
        ...(dto.codigoLote && { codigoLote: dto.codigoLote }),
        ...(dto.fechaVencimiento !== undefined && {
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        }),
        ...(dto.fechaFabricacion !== undefined && {
          fechaFabricacion: dto.fechaFabricacion ? new Date(dto.fechaFabricacion) : null,
        }),
        ...(dto.costoUnitario !== undefined && { costoUnitario: dto.costoUnitario }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
        ...(dto.estado && { estado: dto.estado }),
      },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Lote actualizado correctamente',
    };
  }

  /**
   * POST /lotes/:id/bloquear - Bloquear lote
   */
  async bloquear(empresaId: string, loteId: string, motivo?: string) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, empresaId },
    });

    if (!lote) {
      throw new NotFoundException(ERROR_MESSAGES.LOTE_NOT_FOUND);
    }

    if (lote.estado === 'bloqueado') {
      throw new BadRequestException('Este lote ya está bloqueado');
    }

    const updated = await this.prisma.lote.update({
      where: { id: loteId },
      data: {
        estado: 'bloqueado',
        notas: motivo ? `${lote.notas || ''}\n[BLOQUEADO] ${motivo}`.trim() : lote.notas,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Lote bloqueado correctamente',
    };
  }

  /**
   * POST /lotes/:id/desbloquear - Desbloquear lote
   */
  async desbloquear(empresaId: string, loteId: string) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, empresaId },
    });

    if (!lote) {
      throw new NotFoundException(ERROR_MESSAGES.LOTE_NOT_FOUND);
    }

    if (lote.estado !== 'bloqueado') {
      throw new BadRequestException('Este lote no está bloqueado');
    }

    // Verificar si está vencido
    const nuevoEstado =
      lote.fechaVencimiento && new Date(lote.fechaVencimiento) < new Date()
        ? 'vencido'
        : lote.stock > 0
        ? 'activo'
        : 'agotado';

    const updated = await this.prisma.lote.update({
      where: { id: loteId },
      data: { estado: nuevoEstado },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Lote desbloqueado correctamente',
    };
  }

  /**
   * Descontar stock de un lote (usado en ventas)
   */
  async descontarStock(loteId: string, cantidad: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { id: loteId },
    });

    if (!lote) {
      throw new NotFoundException(ERROR_MESSAGES.LOTE_NOT_FOUND);
    }

    if (lote.estado !== 'activo') {
      throw new BadRequestException(
        lote.estado === 'vencido'
          ? ERROR_MESSAGES.LOTE_EXPIRED
          : ERROR_MESSAGES.LOTE_BLOCKED,
      );
    }

    if (lote.stock < cantidad) {
      throw new BadRequestException(ERROR_MESSAGES.INSUFFICIENT_STOCK);
    }

    const nuevoStock = lote.stock - cantidad;

    const updated = await this.prisma.lote.update({
      where: { id: loteId },
      data: {
        stock: nuevoStock,
        estado: nuevoStock === 0 ? 'agotado' : 'activo',
      },
    });

    return updated;
  }

  /**
   * Invalidar cache de lotes
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
