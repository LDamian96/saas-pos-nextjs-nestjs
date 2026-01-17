/**
 * @file inventario.service.ts
 * @description Servicio para gestión de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: movimientos_inventario, stock_sucursal)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import {
  EntradaInventarioDto,
  SalidaInventarioDto,
  AjusteInventarioDto,
  TraspasoInventarioDto,
} from '../dto/inventario';

interface StockFilters {
  sucursalId?: string;
  categoriaId?: string;
  stockBajo?: boolean;
  search?: string;
}

interface KardexFilters {
  varianteId: string;
  sucursalId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventarioService {
  private readonly CACHE_PREFIX = 'inventario';
  private readonly CACHE_TTL = 60; // 1 minuto

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Obtener stock por sucursal
   */
  async getStock(empresaId: string, filters: StockFilters) {
    const { sucursalId, categoriaId, stockBajo, search } = filters;

    const cacheKey = `${this.CACHE_PREFIX}:stock:${empresaId}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const where: any = {
      producto: {
        empresaId,
        activo: true,
      },
    };

    if (sucursalId) {
      where.stockSucursal = {
        some: { sucursalId },
      };
    }

    if (categoriaId) {
      where.producto.categoriaId = categoriaId;
    }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { producto: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const variantes = await this.prisma.variante.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            categoria: { select: { id: true, nombre: true } },
          },
        },
        stockSucursal: sucursalId
          ? { where: { sucursalId } }
          : true,
        valores: {
          include: {
            valorAtributo: {
              include: { atributo: true },
            },
          },
        },
      },
    });

    let result = variantes.map((v) => {
      const stockTotal = v.stockSucursal.reduce((sum: number, s: { stock: number }) => sum + s.stock, 0);
      const stockMin = v.stockSucursal.length > 0 ? v.stockSucursal[0].stockMinimo : 0;
      return {
        id: v.id,
        sku: v.sku,
        producto: v.producto,
        valores: v.valores.map((vv) => ({
          atributo: vv.valorAtributo.atributo.nombre,
          valor: vv.valorAtributo.valor,
        })),
        stock: stockTotal,
        stockPorSucursal: v.stockSucursal,
        stockMinimo: stockMin,
      };
    });

    if (stockBajo) {
      result = result.filter((item) => item.stock <= item.stockMinimo);
    }

    await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

    return result;
  }

  /**
   * Obtener stock de una variante en todas las sucursales
   */
  async getStockVariante(empresaId: string, varianteId: string) {
    const variante = await this.prisma.variante.findFirst({
      where: {
        id: varianteId,
        producto: { empresaId },
      },
      include: {
        producto: { select: { nombre: true } },
        stockSucursal: {
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!variante) {
      throw new NotFoundException('Variante no encontrada');
    }

    return {
      varianteId: variante.id,
      sku: variante.sku,
      producto: variante.producto.nombre,
      stockTotal: variante.stockSucursal.reduce((sum, s) => sum + s.stock, 0),
      stockPorSucursal: variante.stockSucursal.map((s) => ({
        sucursalId: s.sucursal.id,
        sucursal: s.sucursal.nombre,
        stock: s.stock,
        stockMinimo: s.stockMinimo,
        stockMaximo: s.stockMaximo,
        ubicacion: s.ubicacion,
      })),
    };
  }

  /**
   * Registrar entrada de inventario
   */
  async registrarEntrada(empresaId: string, usuarioId: string, dto: EntradaInventarioDto) {
    const { sucursalId, motivo, detalles, documentoTipo, documentoNumero, notas } = dto;

    // Validar sucursal pertenece a la empresa
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id: sucursalId, empresaId },
    });
    if (!sucursal) {
      throw new BadRequestException('Sucursal no valida');
    }

    const movimientos = await this.prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const detalle of detalles) {
        // Obtener o crear stock_sucursal
        let stockSucursal = await tx.stockSucursal.findUnique({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId,
            },
          },
        });

        const stockAnterior = stockSucursal?.stock || 0;
        const stockNuevo = stockAnterior + detalle.cantidad;

        if (!stockSucursal) {
          stockSucursal = await tx.stockSucursal.create({
            data: {
              varianteId: detalle.varianteId,
              sucursalId,
              stock: detalle.cantidad,
            },
          });
        } else {
          await tx.stockSucursal.update({
            where: { id: stockSucursal.id },
            data: { stock: stockNuevo },
          });
        }

        // Crear movimiento
        const movimiento = await tx.movimientoInventario.create({
          data: {
            empresaId,
            sucursalId,
            varianteId: detalle.varianteId,
            usuarioId,
            tipo: 'entrada',
            motivo,
            cantidad: detalle.cantidad,
            stockAnterior,
            stockNuevo,
            costoUnitario: detalle.costoUnitario,
            costoTotal: detalle.costoUnitario
              ? detalle.costoUnitario * detalle.cantidad
              : null,
            documentoTipo,
            documentoNumero,
            notas,
          },
        });

        resultados.push(movimiento);
      }

      return resultados;
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      mensaje: `Se registraron ${movimientos.length} entradas correctamente`,
      movimientos,
    };
  }

  /**
   * Registrar salida de inventario
   */
  async registrarSalida(empresaId: string, usuarioId: string, dto: SalidaInventarioDto) {
    const { sucursalId, motivo, detalles, documentoTipo, documentoNumero, notas } = dto;

    // Validar sucursal pertenece a la empresa
    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id: sucursalId, empresaId },
    });
    if (!sucursal) {
      throw new BadRequestException('Sucursal no valida');
    }

    const movimientos = await this.prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const detalle of detalles) {
        const stockSucursal = await tx.stockSucursal.findUnique({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId,
            },
          },
        });

        const stockAnterior = stockSucursal?.stock || 0;

        if (stockAnterior < detalle.cantidad) {
          const variante = await tx.variante.findUnique({
            where: { id: detalle.varianteId },
            select: { sku: true },
          });
          throw new BadRequestException(
            `Stock insuficiente para ${variante?.sku || detalle.varianteId}. Disponible: ${stockAnterior}`,
          );
        }

        const stockNuevo = stockAnterior - detalle.cantidad;

        await tx.stockSucursal.update({
          where: { id: stockSucursal!.id },
          data: { stock: stockNuevo },
        });

        const movimiento = await tx.movimientoInventario.create({
          data: {
            empresaId,
            sucursalId,
            varianteId: detalle.varianteId,
            usuarioId,
            tipo: 'salida',
            motivo,
            cantidad: -detalle.cantidad,
            stockAnterior,
            stockNuevo,
            documentoTipo,
            documentoNumero,
            notas,
          },
        });

        resultados.push(movimiento);
      }

      return resultados;
    });

    await this.invalidateCache(empresaId);

    return {
      mensaje: `Se registraron ${movimientos.length} salidas correctamente`,
      movimientos,
    };
  }

  /**
   * Ajustar stock de inventario
   */
  async ajustarStock(empresaId: string, usuarioId: string, dto: AjusteInventarioDto) {
    const { sucursalId, detalles, notas } = dto;

    const sucursal = await this.prisma.sucursal.findFirst({
      where: { id: sucursalId, empresaId },
    });
    if (!sucursal) {
      throw new BadRequestException('Sucursal no valida');
    }

    const movimientos = await this.prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const detalle of detalles) {
        let stockSucursal = await tx.stockSucursal.findUnique({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId,
            },
          },
        });

        const stockAnterior = stockSucursal?.stock || 0;
        const diferencia = detalle.stockNuevo - stockAnterior;

        if (diferencia === 0) continue;

        if (!stockSucursal) {
          stockSucursal = await tx.stockSucursal.create({
            data: {
              varianteId: detalle.varianteId,
              sucursalId,
              stock: detalle.stockNuevo,
            },
          });
        } else {
          await tx.stockSucursal.update({
            where: { id: stockSucursal.id },
            data: { stock: detalle.stockNuevo },
          });
        }

        const movimiento = await tx.movimientoInventario.create({
          data: {
            empresaId,
            sucursalId,
            varianteId: detalle.varianteId,
            usuarioId,
            tipo: 'ajuste',
            motivo: diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
            cantidad: diferencia,
            stockAnterior,
            stockNuevo: detalle.stockNuevo,
            notas,
          },
        });

        resultados.push(movimiento);
      }

      return resultados;
    });

    await this.invalidateCache(empresaId);

    return {
      mensaje: `Se ajustaron ${movimientos.length} items correctamente`,
      movimientos,
    };
  }

  /**
   * Traspasar stock entre sucursales
   */
  async traspasar(empresaId: string, usuarioId: string, dto: TraspasoInventarioDto) {
    const { sucursalOrigenId, sucursalDestinoId, detalles, notas } = dto;

    if (sucursalOrigenId === sucursalDestinoId) {
      throw new BadRequestException('La sucursal origen y destino no pueden ser iguales');
    }

    // Validar ambas sucursales
    const sucursales = await this.prisma.sucursal.findMany({
      where: {
        id: { in: [sucursalOrigenId, sucursalDestinoId] },
        empresaId,
      },
    });

    if (sucursales.length !== 2) {
      throw new BadRequestException('Sucursales no validas');
    }

    const movimientos = await this.prisma.$transaction(async (tx) => {
      const resultados = [];

      for (const detalle of detalles) {
        // Salida de origen
        const stockOrigen = await tx.stockSucursal.findUnique({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId: sucursalOrigenId,
            },
          },
        });

        const stockAnteriorOrigen = stockOrigen?.stock || 0;

        if (stockAnteriorOrigen < detalle.cantidad) {
          const variante = await tx.variante.findUnique({
            where: { id: detalle.varianteId },
            select: { sku: true },
          });
          throw new BadRequestException(
            `Stock insuficiente en origen para ${variante?.sku || detalle.varianteId}. Disponible: ${stockAnteriorOrigen}`,
          );
        }

        const stockNuevoOrigen = stockAnteriorOrigen - detalle.cantidad;

        await tx.stockSucursal.update({
          where: { id: stockOrigen!.id },
          data: { stock: stockNuevoOrigen },
        });

        // Movimiento de salida
        const movSalida = await tx.movimientoInventario.create({
          data: {
            empresaId,
            sucursalId: sucursalOrigenId,
            varianteId: detalle.varianteId,
            usuarioId,
            tipo: 'traspaso',
            motivo: 'traspaso_salida',
            cantidad: -detalle.cantidad,
            stockAnterior: stockAnteriorOrigen,
            stockNuevo: stockNuevoOrigen,
            sucursalDestinoId,
            notas,
          },
        });

        // Entrada en destino
        let stockDestino = await tx.stockSucursal.findUnique({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId: sucursalDestinoId,
            },
          },
        });

        const stockAnteriorDestino = stockDestino?.stock || 0;
        const stockNuevoDestino = stockAnteriorDestino + detalle.cantidad;

        if (!stockDestino) {
          stockDestino = await tx.stockSucursal.create({
            data: {
              varianteId: detalle.varianteId,
              sucursalId: sucursalDestinoId,
              stock: detalle.cantidad,
            },
          });
        } else {
          await tx.stockSucursal.update({
            where: { id: stockDestino.id },
            data: { stock: stockNuevoDestino },
          });
        }

        // Movimiento de entrada
        const movEntrada = await tx.movimientoInventario.create({
          data: {
            empresaId,
            sucursalId: sucursalDestinoId,
            varianteId: detalle.varianteId,
            usuarioId,
            tipo: 'traspaso',
            motivo: 'traspaso_entrada',
            cantidad: detalle.cantidad,
            stockAnterior: stockAnteriorDestino,
            stockNuevo: stockNuevoDestino,
            sucursalOrigenId,
            notas,
          },
        });

        resultados.push({ salida: movSalida, entrada: movEntrada });
      }

      return resultados;
    });

    await this.invalidateCache(empresaId);

    return {
      mensaje: `Se traspasaron ${movimientos.length} items correctamente`,
      movimientos,
    };
  }

  /**
   * Obtener kardex (movimientos) de una variante
   */
  async getKardex(empresaId: string, filters: KardexFilters) {
    const { varianteId, sucursalId, fechaInicio, fechaFin, page = 1, limit = 50 } = filters;

    const where: any = {
      empresaId,
      varianteId,
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = fechaInicio;
      if (fechaFin) where.createdAt.lte = fechaFin;
    }

    const [total, movimientos] = await Promise.all([
      this.prisma.movimientoInventario.count({ where }),
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          sucursal: { select: { nombre: true } },
          usuario: { select: { nombre: true, apellido: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: movimientos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener productos con stock bajo
   */
  async getStockBajo(empresaId: string, sucursalId?: string) {
    return this.getStock(empresaId, { sucursalId, stockBajo: true });
  }

  /**
   * Obtener todos los movimientos con filtros
   */
  async getMovimientos(
    empresaId: string,
    filters: {
      sucursalId?: string;
      tipo?: string;
      motivo?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { sucursalId, tipo, motivo, fechaInicio, fechaFin, search, page = 1, limit = 50 } = filters;

    const where: any = { empresaId };

    if (sucursalId) where.sucursalId = sucursalId;
    if (tipo) where.tipo = tipo;
    if (motivo) where.motivo = motivo;

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) where.createdAt.gte = fechaInicio;
      if (fechaFin) where.createdAt.lte = fechaFin;
    }

    if (search) {
      where.OR = [
        { documentoNumero: { contains: search, mode: 'insensitive' } },
        { variante: { sku: { contains: search, mode: 'insensitive' } } },
        { variante: { producto: { nombre: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [total, movimientos] = await Promise.all([
      this.prisma.movimientoInventario.count({ where }),
      this.prisma.movimientoInventario.findMany({
        where,
        include: {
          sucursal: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true, apellido: true } },
          variante: {
            select: {
              id: true,
              sku: true,
              producto: { select: { id: true, nombre: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: movimientos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async invalidateCache(empresaId: string) {
    const pattern = `${this.CACHE_PREFIX}:*:${empresaId}:*`;
    await this.redis.delPattern(pattern);
  }
}
