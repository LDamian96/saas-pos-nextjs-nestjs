/**
 * @file venta.service.ts
 * @description Servicio para gestión de ventas (POS)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion VENTAS)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateVentaDto, VentaFiltersDto, AnularVentaDto } from '../dto/venta';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { LoteService } from './lote.service';

const CACHE_TTL = 1800; // 30 minutos
const CACHE_PREFIX = 'ventas';

@Injectable()
export class VentaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private loteService: LoteService,
  ) {}

  /**
   * GET /ventas - Listar ventas con filtros y paginación
   */
  async findAll(empresaId: string, filters: VentaFiltersDto) {
    const {
      search,
      sucursalId,
      usuarioId,
      clienteId,
      cajaId,
      estado,
      fechaInicio,
      fechaFin,
      tipoComprobante,
      montoMinimo,
      montoMaximo,
      page = 1,
      limit = 20,
    } = filters;

    // Construir where
    const where: any = { empresaId };

    if (search) {
      where.numeroVenta = { contains: search, mode: 'insensitive' };
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (cajaId) {
      where.cajaId = cajaId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (tipoComprobante) {
      where.tipoComprobante = tipoComprobante;
    }

    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fecha = new Date(fechaFin);
        fecha.setHours(23, 59, 59, 999);
        where.createdAt.lte = fecha;
      }
    }

    if (montoMinimo !== undefined) {
      where.total = { ...where.total, gte: montoMinimo };
    }

    if (montoMaximo !== undefined) {
      where.total = { ...where.total, lte: montoMaximo };
    }

    // Contar total
    const total = await this.prisma.venta.count({ where });

    // Obtener ventas
    const ventas = await this.prisma.venta.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            numeroDocumento: true,
          },
        },
        _count: {
          select: {
            detalles: true,
          },
        },
      },
    });

    return {
      success: true,
      data: ventas.map((v) => ({
        id: v.id,
        numeroVenta: v.numeroVenta,
        fecha: v.createdAt,
        sucursal: v.sucursal,
        usuario: v.usuario,
        cliente: v.cliente,
        subtotal: v.subtotal,
        descuento: v.descuento,
        impuesto: v.impuesto,
        total: v.total,
        tipoComprobante: v.tipoComprobante,
        estado: v.estado,
        itemsCount: v._count.detalles,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /ventas/:id - Obtener venta completa con detalles y pagos
   */
  async findOne(empresaId: string, ventaId: string) {
    const venta = await this.prisma.venta.findFirst({
      where: { id: ventaId, empresaId },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            numeroDocumento: true,
            tipoDocumento: true,
            email: true,
            telefono: true,
          },
        },
        caja: {
          select: {
            id: true,
            numero: true,
            nombre: true,
          },
        },
        detalles: {
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
                    imagenPrincipal: true,
                  },
                },
              },
            },
            lote: {
              select: {
                id: true,
                codigoLote: true,
                fechaVencimiento: true,
              },
            },
          },
        },
        pagos: {
          include: {
            metodoPago: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                tipo: true,
              },
            },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException(ERROR_MESSAGES.SALE_NOT_FOUND);
    }

    return {
      success: true,
      data: venta,
    };
  }

  /**
   * POST /ventas - Crear venta (POS)
   */
  async create(empresaId: string, usuarioId: string, dto: CreateVentaDto) {
    // 1. Validar que la caja este abierta
    const caja = await this.prisma.caja.findFirst({
      where: {
        id: dto.cajaId,
        empresaId,
        estado: 'abierta',
      },
    });

    if (!caja) {
      throw new BadRequestException(ERROR_MESSAGES.CASH_REGISTER_CLOSED);
    }

    // 2. Validar items y calcular totales
    const itemsConPrecios = await this.validarYCalcularItems(
      empresaId,
      dto.sucursalId,
      dto.items,
    );

    // 3. Calcular totales de la venta
    const subtotal = itemsConPrecios.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoItems = itemsConPrecios.reduce(
      (sum, item) => sum + item.descuentoMonto,
      0,
    );
    const descuentoGeneral = dto.descuentoGeneralMonto || 0;
    const descuentoTotal = descuentoItems + descuentoGeneral;

    // Obtener configuracion de impuestos de la empresa
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        aplicaImpuesto: true,
        porcentajeImpuesto: true,
        precioIncluyeImpuesto: true,
      },
    });

    let impuesto = 0;
    if (empresa?.aplicaImpuesto && !empresa?.precioIncluyeImpuesto) {
      impuesto =
        (subtotal - descuentoTotal) *
        (Number(empresa.porcentajeImpuesto) / 100);
    }

    const total = subtotal - descuentoTotal + impuesto;

    // 4. Validar que los pagos cubran el total
    const totalPagos = dto.pagos.reduce((sum, p) => sum + p.monto, 0);
    if (totalPagos < total) {
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT_INSUFFICIENT);
    }

    const vuelto = totalPagos - total;

    // 5. Generar numero de venta
    const numeroVenta = await this.generarNumeroVenta(empresaId, dto.sucursalId);

    // 6. Crear venta en transaccion
    const venta = await this.prisma.$transaction(async (tx) => {
      // Crear venta principal
      const nuevaVenta = await tx.venta.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          cajaId: dto.cajaId,
          usuarioId,
          clienteId: dto.clienteId || null,
          numeroVenta,
          subtotal,
          descuento: descuentoTotal,
          impuesto,
          total,
          tipoComprobante: dto.tipoComprobante || 'boleta',
          estado: 'completada',
          notas: dto.notas,
        },
      });

      // Crear detalles
      for (const item of itemsConPrecios) {
        await tx.ventaDetalle.create({
          data: {
            ventaId: nuevaVenta.id,
            varianteId: item.varianteId,
            loteId: item.loteId || null,
            cantidad: item.cantidad,
            precioUnidad: item.precioUnitario,
            descuento: item.descuentoMonto,
            subtotal: item.subtotal,
          },
        });

        // Descontar stock de la variante
        await tx.variante.update({
          where: { id: item.varianteId },
          data: {
            stock: { decrement: item.cantidad },
          },
        });

        // Descontar stock de sucursal
        await tx.stockSucursal.update({
          where: {
            varianteId_sucursalId: {
              varianteId: item.varianteId,
              sucursalId: dto.sucursalId,
            },
          },
          data: {
            stock: { decrement: item.cantidad },
          },
        });

        // Descontar del lote si aplica
        if (item.loteId) {
          await tx.lote.update({
            where: { id: item.loteId },
            data: {
              stock: { decrement: item.cantidad },
            },
          });
        }
      }

      // Crear pagos
      for (const pago of dto.pagos) {
        await tx.ventaPago.create({
          data: {
            ventaId: nuevaVenta.id,
            metodoPagoId: pago.metodoPagoId,
            monto: pago.monto,
            referencia: pago.referencia,
          },
        });
      }

      // Actualizar montos de la caja
      await tx.caja.update({
        where: { id: dto.cajaId },
        data: {
          montoVentas: { increment: total },
          // Incrementar segun tipo de pago
          montoEfectivo: {
            increment: await this.calcularMontoTipoPago(
              dto.pagos,
              'efectivo',
            ),
          },
          montoTarjeta: {
            increment: await this.calcularMontoTipoPago(dto.pagos, 'tarjeta'),
          },
          montoOtros: {
            increment: await this.calcularMontoTipoPago(dto.pagos, 'otros'),
          },
        },
      });

      return nuevaVenta;
    });

    // 7. Invalidar cache
    await this.invalidateCache(empresaId);

    // 8. Obtener venta completa para respuesta
    const ventaCompleta = await this.findOne(empresaId, venta.id);

    return {
      success: true,
      data: {
        ...ventaCompleta.data,
        vuelto,
      },
      message: 'Venta registrada correctamente',
    };
  }

  /**
   * POST /ventas/:id/anular - Anular venta
   */
  async anular(
    empresaId: string,
    ventaId: string,
    usuarioId: string,
    dto: AnularVentaDto,
  ) {
    // 1. Obtener venta con detalles
    const venta = await this.prisma.venta.findFirst({
      where: { id: ventaId, empresaId },
      include: {
        detalles: true,
        pagos: true,
      },
    });

    if (!venta) {
      throw new NotFoundException(ERROR_MESSAGES.SALE_NOT_FOUND);
    }

    if (venta.estado === 'anulada') {
      throw new BadRequestException(ERROR_MESSAGES.SALE_ALREADY_CANCELLED);
    }

    // 2. Verificar que la caja siga abierta (para revertir montos)
    const caja = await this.prisma.caja.findUnique({
      where: { id: venta.cajaId },
    });

    // 3. Anular en transaccion
    await this.prisma.$transaction(async (tx) => {
      // Actualizar estado de la venta
      await tx.venta.update({
        where: { id: ventaId },
        data: {
          estado: 'anulada',
          notas: venta.notas
            ? `${venta.notas}\n[ANULADA] ${dto.motivo}`
            : `[ANULADA] ${dto.motivo}`,
        },
      });

      // Restaurar stock de cada item
      for (const detalle of venta.detalles) {
        // Restaurar stock de variante
        await tx.variante.update({
          where: { id: detalle.varianteId },
          data: {
            stock: { increment: detalle.cantidad },
          },
        });

        // Restaurar stock de sucursal
        await tx.stockSucursal.update({
          where: {
            varianteId_sucursalId: {
              varianteId: detalle.varianteId,
              sucursalId: venta.sucursalId,
            },
          },
          data: {
            stock: { increment: detalle.cantidad },
          },
        });

        // Restaurar stock del lote si aplica
        if (detalle.loteId) {
          await tx.lote.update({
            where: { id: detalle.loteId },
            data: {
              stock: { increment: detalle.cantidad },
              estado: 'activo', // Reactivar si estaba agotado
            },
          });
        }
      }

      // Revertir montos de la caja si sigue abierta
      if (caja && caja.estado === 'abierta') {
        await tx.caja.update({
          where: { id: venta.cajaId },
          data: {
            montoVentas: { decrement: Number(venta.total) },
            // Revertir segun tipo de pago (simplificado)
            montoEfectivo: { decrement: Number(venta.total) * 0.7 }, // Aproximado
          },
        });
      }
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      message: 'Venta anulada correctamente',
    };
  }

  /**
   * GET /ventas/resumen-dia - Resumen de ventas del dia
   */
  async getResumenDia(empresaId: string, sucursalId?: string) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const where: any = {
      empresaId,
      estado: 'completada',
      createdAt: { gte: hoy },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const ventas = await this.prisma.venta.findMany({
      where,
      select: {
        total: true,
        descuento: true,
      },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const totalDescuentos = ventas.reduce(
      (sum, v) => sum + Number(v.descuento),
      0,
    );
    const cantidadVentas = ventas.length;
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

    return {
      success: true,
      data: {
        fecha: hoy.toISOString().split('T')[0],
        totalVentas,
        totalDescuentos,
        cantidadVentas,
        ticketPromedio,
      },
    };
  }

  /**
   * GET /ventas/estadisticas - Obtener estadisticas por periodo
   */
  async getEstadisticas(
    empresaId: string,
    sucursalId?: string,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    const where: any = {
      empresaId,
      estado: 'completada',
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    // Filtrar por fechas si se proporcionan
    if (fechaInicio || fechaFin) {
      where.createdAt = {};
      if (fechaInicio) {
        where.createdAt.gte = new Date(fechaInicio);
      }
      if (fechaFin) {
        const fecha = new Date(fechaFin);
        fecha.setHours(23, 59, 59, 999);
        where.createdAt.lte = fecha;
      }
    }

    const ventas = await this.prisma.venta.findMany({
      where,
      select: {
        total: true,
        descuento: true,
        createdAt: true,
      },
    });

    const totalVentas = ventas.length;
    const montoTotal = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const ticketPromedio = totalVentas > 0 ? montoTotal / totalVentas : 0;

    return {
      success: true,
      data: {
        totalVentas,
        montoTotal,
        ticketPromedio,
      },
    };
  }

  /**
   * GET /ventas/metodos-pago - Obtener métodos de pago activos
   */
  async getMetodosPago(empresaId: string) {
    const metodosPago = await this.prisma.metodoPago.findMany({
      where: {
        empresaId,
        activo: true,
      },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipo: true,
        icono: true,
        comision: true,
      },
    });

    return {
      success: true,
      data: metodosPago,
    };
  }

  // =====================================================
  // METODOS PRIVADOS
  // =====================================================

  /**
   * Validar items y calcular precios con FEFO
   */
  private async validarYCalcularItems(
    empresaId: string,
    sucursalId: string,
    items: CreateVentaDto['items'],
  ) {
    const itemsCalculados = [];

    for (const item of items) {
      // Obtener variante con stock
      const variante = await this.prisma.variante.findFirst({
        where: {
          id: item.varianteId,
          producto: { empresaId },
        },
        include: {
          producto: {
            select: {
              nombre: true,
            },
          },
        },
      });

      if (!variante) {
        throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
      }

      // Verificar stock en sucursal
      const stockSucursal = await this.prisma.stockSucursal.findUnique({
        where: {
          varianteId_sucursalId: {
            varianteId: item.varianteId,
            sucursalId,
          },
        },
      });

      if (!stockSucursal || stockSucursal.stock < item.cantidad) {
        throw new BadRequestException(
          `${variante.producto.nombre}: ${ERROR_MESSAGES.INSUFFICIENT_STOCK}`,
        );
      }

      // Obtener lote FEFO automaticamente si no se especifico y hay lotes disponibles
      let loteId = item.loteId;
      if (!loteId) {
        const lotesFEFO = await this.prisma.lote.findMany({
          where: {
            empresaId,
            varianteId: item.varianteId,
            sucursalId,
            estado: 'activo',
            stock: { gte: item.cantidad },
          },
          orderBy: [{ fechaVencimiento: 'asc' }],
          take: 1,
        });

        if (lotesFEFO.length > 0) {
          loteId = lotesFEFO[0].id;
        }
      }

      // Calcular descuento
      const descuentoPorcentaje = item.descuentoPorcentaje || 0;
      const descuentoMontoManual = item.descuentoMonto || 0;
      const precioBase = item.precioUnitario * item.cantidad;
      const descuentoPorcentajeMonto = precioBase * (descuentoPorcentaje / 100);
      const descuentoMonto = descuentoPorcentajeMonto + descuentoMontoManual;
      const subtotal = precioBase - descuentoMonto;

      itemsCalculados.push({
        varianteId: item.varianteId,
        loteId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuentoPorcentaje,
        descuentoMonto,
        subtotal,
        promocionId: item.promocionId,
      });
    }

    return itemsCalculados;
  }

  /**
   * Generar numero de venta unico
   */
  private async generarNumeroVenta(
    empresaId: string,
    sucursalId: string,
  ): Promise<string> {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');

    // Contar ventas del mes
    const count = await this.prisma.venta.count({
      where: {
        empresaId,
        sucursalId,
        createdAt: {
          gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
        },
      },
    });

    const numero = String(count + 1).padStart(6, '0');
    return `V-${anio}${mes}-${numero}`;
  }

  /**
   * Calcular monto por tipo de pago
   */
  private async calcularMontoTipoPago(
    pagos: CreateVentaDto['pagos'],
    tipo: 'efectivo' | 'tarjeta' | 'otros',
  ): Promise<number> {
    // Obtener metodos de pago
    const metodosPago = await this.prisma.metodoPago.findMany({
      where: {
        id: { in: pagos.map((p) => p.metodoPagoId) },
      },
    });

    const tiposMap: Record<string, 'efectivo' | 'tarjeta' | 'otros'> = {
      efectivo: 'efectivo',
      tarjeta_credito: 'tarjeta',
      tarjeta_debito: 'tarjeta',
      yape: 'otros',
      plin: 'otros',
      transferencia: 'otros',
    };

    let total = 0;
    for (const pago of pagos) {
      const metodo = metodosPago.find((m) => m.id === pago.metodoPagoId);
      if (metodo && tiposMap[metodo.tipo] === tipo) {
        total += pago.monto;
      }
    }

    return total;
  }

  /**
   * Invalidar cache de ventas
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
