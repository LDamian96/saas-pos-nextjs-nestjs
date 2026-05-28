/**
 * @file promocion.service.ts
 * @description Servicio para gestión de promociones
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: promociones)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROMOCIONES)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreatePromocionDto, UpdatePromocionDto } from '../dto/promocion';

const CACHE_TTL = 1800; // 30 minutos
const CACHE_PREFIX = 'promociones';

@Injectable()
export class PromocionService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /promociones - Listar promociones de la empresa
   */
  async findAll(empresaId: string, query?: { activo?: boolean; tipo?: string; search?: string }) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    if (!query?.search && !query?.tipo) {
      const cached = await this.redis.get(cacheKey);
      if (cached && query?.activo === undefined) {
        return { success: true, data: cached };
      }
    }

    const where: any = { empresaId };
    if (query?.activo !== undefined) where.activo = query.activo;
    if (query?.tipo) where.tipo = query.tipo;
    if (query?.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { codigo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const promociones = await this.prisma.promocion.findMany({
      where,
      orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        tipo: true,
        cantidadComprar: true,
        cantidadBeneficio: true,
        descuentoPorcentaje: true,
        descuentoMonto: true,
        precioFijo: true,
        montoMinimoCompra: true,
        aplicaA: true,
        fechaInicio: true,
        fechaFin: true,
        horaInicio: true,
        horaFin: true,
        diasSemana: true,
        limiteUsosTotal: true,
        limiteUsosCliente: true,
        usosActuales: true,
        soloClientesRegistrados: true,
        todasSucursales: true,
        acumulable: true,
        prioridad: true,
        activo: true,
        visiblePos: true,
        visibleWeb: true,
        imagen: true,
        banner: true,
        createdAt: true,
      },
    });

    if (!query?.search && !query?.tipo && query?.activo === undefined) {
      await this.redis.set(cacheKey, promociones, CACHE_TTL);
    }

    return { success: true, data: promociones };
  }

  /**
   * GET /promociones/:id - Obtener promoción
   */
  async findOne(empresaId: string, id: string) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return { success: true, data: cached };

    const promocion = await this.prisma.promocion.findFirst({
      where: { id, empresaId },
    });

    if (!promocion) {
      throw new NotFoundException('Promoción no encontrada');
    }

    await this.redis.set(cacheKey, promocion, CACHE_TTL);
    return { success: true, data: promocion };
  }

  /**
   * POST /promociones - Crear promoción
   */
  async create(empresaId: string, dto: CreatePromocionDto) {
    // Verificar código único
    const existing = await this.prisma.promocion.findFirst({
      where: { empresaId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException('Ya existe una promoción con ese código');
    }

    const promocion = await this.prisma.promocion.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo: dto.tipo,
        cantidadComprar: dto.cantidadComprar,
        cantidadBeneficio: dto.cantidadBeneficio,
        descuentoPorcentaje: dto.descuentoPorcentaje,
        descuentoMonto: dto.descuentoMonto,
        precioFijo: dto.precioFijo,
        montoMinimoCompra: dto.montoMinimoCompra,
        aplicaA: dto.aplicaA ?? 'productos',
        categoriasIds: dto.categoriasIds ?? [],
        productosIds: dto.productosIds ?? [],
        marcasIds: dto.marcasIds ?? [],
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        diasSemana: dto.diasSemana ?? [],
        limiteUsosTotal: dto.limiteUsosTotal,
        limiteUsosCliente: dto.limiteUsosCliente,
        soloClientesRegistrados: dto.soloClientesRegistrados ?? false,
        todasSucursales: dto.todasSucursales ?? true,
        sucursalesIds: dto.sucursalesIds ?? [],
        acumulable: dto.acumulable ?? false,
        prioridad: dto.prioridad ?? 0,
        activo: dto.activo ?? true,
        visiblePos: dto.visiblePos ?? true,
        visibleWeb: dto.visibleWeb ?? true,
        imagen: dto.imagen,
        banner: dto.banner,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: promocion,
      message: 'Promoción creada correctamente',
    };
  }

  /**
   * PUT /promociones/:id - Actualizar promoción
   */
  async update(empresaId: string, id: string, dto: UpdatePromocionDto) {
    const existing = await this.prisma.promocion.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Promoción no encontrada');
    }

    // Verificar código único si cambió
    if (dto.codigo && dto.codigo !== existing.codigo) {
      const conflict = await this.prisma.promocion.findFirst({
        where: { empresaId, codigo: dto.codigo, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Ya existe una promoción con ese código');
      }
    }

    // Transformar fechas si se proveen
    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);

    const promocion = await this.prisma.promocion.update({
      where: { id },
      data,
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: promocion,
      message: 'Promoción actualizada correctamente',
    };
  }

  /**
   * DELETE /promociones/:id - Eliminar promoción
   */
  async delete(empresaId: string, id: string) {
    const existing = await this.prisma.promocion.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Promoción no encontrada');
    }

    await this.prisma.promocion.delete({ where: { id } });
    await this.invalidateCache(empresaId);

    return { success: true, message: 'Promoción eliminada correctamente' };
  }

  /**
   * GET /promociones/vigentes - Obtener promociones activas y vigentes
   */
  async findVigentes(empresaId: string, sucursalId?: string) {
    const now = new Date();

    const where: any = {
      empresaId,
      activo: true,
      fechaInicio: { lte: now },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: now } },
      ],
    };

    // Filtrar por sucursal si se provee
    if (sucursalId) {
      where.AND = [
        {
          OR: [
            { todasSucursales: true },
            { sucursalesIds: { has: sucursalId } },
          ],
        },
      ];
    }

    const promociones = await this.prisma.promocion.findMany({
      where,
      orderBy: [{ prioridad: 'desc' }],
    });

    // Filtrar por límite de usos
    const vigentes = promociones.filter((p) => {
      if (p.limiteUsosTotal && p.usosActuales >= p.limiteUsosTotal) return false;
      return true;
    });

    return { success: true, data: vigentes };
  }

  /**
   * Calcular descuento de una promoción para un item
   */
  async calcularDescuento(
    promocionId: string,
    cantidad: number,
    precioUnitario: number,
  ) {
    const promocion = await this.prisma.promocion.findUnique({
      where: { id: promocionId },
    });

    if (!promocion || !promocion.activo) {
      return { descuento: 0, aplicable: false };
    }

    const result = this.calcularDescuentoPromo(promocion, cantidad, precioUnitario);
    return result;
  }

  /**
   * Evaluate promotions for a set of cart items.
   * Returns an array of applicable promo results.
   */
  evaluatePromotions(
    items: Array<{ varianteId: string; productoId: string; cantidad: number; precioUnitario: number }>,
    activePromotions: any[],
  ) {
    const results: Array<{
      varianteId: string;
      productoId: string;
      descuento: number;
      promocionId: string;
      descripcion: string;
    }> = [];

    for (const promo of activePromotions) {
      for (const item of items) {
        // Check if promotion applies to this product
        if (!this.promoAppliesToProduct(promo, item.productoId)) {
          continue;
        }

        const result = this.calcularDescuentoPromo(promo, item.cantidad, item.precioUnitario);
        if (result.aplicable && result.descuento > 0) {
          results.push({
            varianteId: item.varianteId,
            productoId: item.productoId,
            descuento: result.descuento,
            promocionId: promo.id,
            descripcion: result.descripcion || promo.nombre,
          });
        }
      }
    }

    return results;
  }

  /**
   * POST /promociones/evaluar - Evaluate promotions for cart items
   */
  async evaluateCart(
    empresaId: string,
    items: Array<{ varianteId: string; productoId: string; cantidad: number; precioUnitario: number }>,
    sucursalId?: string,
  ) {
    const { data: activePromos } = await this.findVigentes(empresaId, sucursalId);
    const results = this.evaluatePromotions(items, activePromos);
    return { success: true, data: results };
  }

  /**
   * Check if a promotion applies to a specific product
   */
  private promoAppliesToProduct(promo: any, productoId: string): boolean {
    if (promo.aplicaA === 'todos') return true;
    if (promo.aplicaA === 'productos' && promo.productosIds?.length > 0) {
      return promo.productosIds.includes(productoId);
    }
    // For categories and marcas, we'd need to look up the product - for now, if no specific filter, apply to all
    if ((!promo.productosIds || promo.productosIds.length === 0) &&
        (!promo.categoriasIds || promo.categoriasIds.length === 0) &&
        (!promo.marcasIds || promo.marcasIds.length === 0)) {
      return true;
    }
    return false;
  }

  /**
   * Core discount calculation logic for a single promotion + item
   */
  private calcularDescuentoPromo(
    promocion: any,
    cantidad: number,
    precioUnitario: number,
  ): { descuento: number; aplicable: boolean; descripcion: string } {
    let descuento = 0;
    let aplicable = false;
    let descripcion = promocion.nombre || '';

    switch (promocion.tipo) {
      case 'cantidad_gratis':
        // Compra X lleva Y gratis
        if (promocion.cantidadComprar && promocion.cantidadBeneficio) {
          if (cantidad >= promocion.cantidadComprar) {
            const grupoSize = promocion.cantidadComprar + promocion.cantidadBeneficio;
            const grupos = Math.floor(cantidad / grupoSize);
            descuento = grupos * promocion.cantidadBeneficio * precioUnitario;
            aplicable = true;
            descripcion = `Lleva ${grupoSize}, paga ${promocion.cantidadComprar}`;
          }
        }
        break;

      case 'cantidad_descuento':
        // Compra X con Y% de descuento
        if (promocion.cantidadComprar && promocion.descuentoPorcentaje) {
          if (cantidad >= promocion.cantidadComprar) {
            descuento = (cantidad * precioUnitario * Number(promocion.descuentoPorcentaje)) / 100;
            aplicable = true;
            descripcion = `${Number(promocion.descuentoPorcentaje)}% dcto x ${promocion.cantidadComprar}+`;
          }
        }
        break;

      case 'descuento_porcentaje':
        // Simple percentage discount on product
        if (promocion.descuentoPorcentaje) {
          descuento = (cantidad * precioUnitario * Number(promocion.descuentoPorcentaje)) / 100;
          aplicable = true;
          descripcion = `${Number(promocion.descuentoPorcentaje)}% de descuento`;
        }
        break;

      case 'nth_precio':
        // Buy N, the (N+1)th at special price
        if (promocion.cantidadComprar && promocion.precioFijo !== null && promocion.precioFijo !== undefined) {
          const required = promocion.cantidadComprar;
          if (cantidad > required) {
            const extraItems = cantidad - required;
            const discountPerExtra = precioUnitario - Number(promocion.precioFijo);
            if (discountPerExtra > 0) {
              descuento = extraItems * discountPerExtra;
              aplicable = true;
              descripcion = `${required + 1}ra unidad a S/${Number(promocion.precioFijo).toFixed(2)}`;
            }
          }
        }
        break;

      case 'nth_gratis':
        // Buy N, get extra ones free
        if (promocion.cantidadComprar) {
          const required = promocion.cantidadComprar;
          if (cantidad > required) {
            const freeItems = cantidad - required;
            descuento = freeItems * precioUnitario;
            aplicable = true;
            descripcion = `${required + 1}ra unidad gratis`;
          }
        }
        break;

      case 'nxm':
        // Buy N pay M
        if (promocion.cantidadComprar && promocion.cantidadBeneficio) {
          const n = promocion.cantidadComprar; // e.g. 3 (buy 3)
          const m = promocion.cantidadBeneficio; // e.g. 2 (pay 2)
          if (cantidad >= n && m < n) {
            const grupos = Math.floor(cantidad / n);
            const resto = cantidad % n;
            const itemsPagados = grupos * m + resto;
            descuento = (cantidad - itemsPagados) * precioUnitario;
            aplicable = true;
            descripcion = `Lleva ${n} paga ${m}`;
          }
        }
        break;

      case 'precio_fijo':
        // Precio fijo por producto
        if (promocion.precioFijo) {
          descuento = cantidad * (precioUnitario - Number(promocion.precioFijo));
          if (descuento < 0) descuento = 0;
          aplicable = descuento > 0;
          descripcion = `Precio especial: S/${Number(promocion.precioFijo).toFixed(2)}`;
        }
        break;

      case 'monto_minimo':
        // Descuento si supera monto mínimo
        const subtotal = cantidad * precioUnitario;
        if (promocion.montoMinimoCompra && subtotal >= Number(promocion.montoMinimoCompra)) {
          if (promocion.descuentoPorcentaje) {
            descuento = (subtotal * Number(promocion.descuentoPorcentaje)) / 100;
          } else if (promocion.descuentoMonto) {
            descuento = Number(promocion.descuentoMonto);
          }
          aplicable = true;
          descripcion = `Dcto por compra +S/${Number(promocion.montoMinimoCompra).toFixed(2)}`;
        }
        break;

      case 'combo':
        aplicable = false;
        break;
    }

    return { descuento: Math.round(descuento * 100) / 100, aplicable, descripcion };
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
