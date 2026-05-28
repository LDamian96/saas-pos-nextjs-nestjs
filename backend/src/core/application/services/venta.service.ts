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
import { CreateVentaDto, VentaFiltersDto, AnularVentaDto, DevolucionVentaDto } from '../dto/venta';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { LoteService } from './lote.service';
import { NotificacionService } from './notificacion.service';

const CACHE_TTL = 1800; // 30 minutos
const CACHE_PREFIX = 'ventas';

@Injectable()
export class VentaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private loteService: LoteService,
    private notificacionService: NotificacionService,
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
        numero: v.numeroVenta,
        numeroVenta: v.numeroVenta,
        createdAt: v.createdAt,
        fecha: v.createdAt,
        sucursal: v.sucursal,
        usuario: v.usuario,
        cliente: v.cliente,
        clienteNombre: v.cliente?.nombre || null,
        subtotal: v.subtotal,
        descuento: v.descuento,
        impuesto: v.impuesto,
        total: v.total,
        tipoComprobante: v.tipoComprobante,
        estado: v.estado,
        itemsCount: v._count.detalles,
        items: Array(v._count.detalles).fill({}), // Para compatibilidad con items.length
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

    // Transformar datos al formato que espera el frontend
    return {
      success: true,
      data: {
        id: venta.id,
        numero: venta.numeroVenta,
        numeroVenta: venta.numeroVenta,
        sucursalId: venta.sucursalId,
        sucursalNombre: venta.sucursal?.nombre,
        cajaId: venta.cajaId,
        cajaNombre: venta.caja?.nombre,
        clienteId: venta.clienteId,
        clienteNombre: venta.cliente?.nombre || (venta as any).clienteNombreTemporal,
        clienteDocumento: venta.cliente?.numeroDocumento || (venta as any).clienteDocumentoTemporal,
        usuarioId: venta.usuarioId,
        usuarioNombre: venta.usuario?.nombre,
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        descuentoTotal: venta.descuento,
        impuesto: venta.impuesto,
        impuestoTotal: venta.impuesto,
        total: venta.total,
        estado: venta.estado,
        tipoComprobante: venta.tipoComprobante,
        serieComprobante: null,
        numeroComprobante: null,
        observaciones: venta.notas,
        motivoAnulacion: null,
        createdAt: venta.createdAt,
        updatedAt: venta.updatedAt,
        // Items transformados
        items: venta.detalles?.map((d: any) => ({
          id: d.id,
          varianteId: d.varianteId,
          productoNombre: d.variante?.producto?.nombre || 'Producto',
          varianteSku: d.variante?.sku || '',
          cantidad: d.cantidad,
          precioUnitario: d.precioUnidad,
          descuento: d.descuento || 0,
          subtotal: d.subtotal,
          loteId: d.loteId,
          loteNumero: d.lote?.codigoLote,
        })) || [],
        // Pagos transformados
        pagos: venta.pagos?.map((p: any) => ({
          id: p.id,
          metodoPagoId: p.metodoPagoId,
          metodoPagoNombre: p.metodoPago?.nombre || 'Método de pago',
          monto: p.monto,
          referencia: p.referencia,
        })) || [],
      },
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

    // 2. Verificar si el cliente es mayorista
    let clienteData: any = null;
    let esMayorista = false;
    if (dto.clienteId) {
      clienteData = await this.prisma.cliente.findFirst({
        where: { id: dto.clienteId, empresaId },
        select: { id: true, nombre: true, apellido: true, email: true, tipoCliente: true },
      });
      esMayorista = clienteData?.tipoCliente === 'mayorista';
    }

    // 3. Validar items y calcular totales (con precios mayoristas si aplica)
    const itemsConPrecios = await this.validarYCalcularItems(
      empresaId,
      dto.sucursalId,
      dto.items,
      esMayorista,
    );

    // 4. Calcular totales de la venta
    const subtotal = itemsConPrecios.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoItems = itemsConPrecios.reduce(
      (sum, item) => sum + item.descuentoMonto,
      0,
    );
    const descuentoGeneral = dto.descuentoGeneralMonto || 0;
    const descuentoTotal = descuentoItems + descuentoGeneral;

    // 5. Obtener configuracion de impuestos de la empresa
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

    // 6. Validar que los pagos cubran el total
    const totalPagos = dto.pagos.reduce((sum, p) => sum + p.monto, 0);
    if (totalPagos < total) {
      throw new BadRequestException(ERROR_MESSAGES.PAYMENT_INSUFFICIENT);
    }

    const vuelto = totalPagos - total;

    // 7. Generar numero de venta
    const numeroVenta = await this.generarNumeroVenta(empresaId, dto.sucursalId);

    // 8. Crear venta en transaccion
    const venta = await this.prisma.$transaction(async (tx) => {
      // Crear venta principal
      const nuevaVenta = await tx.venta.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          cajaId: dto.cajaId,
          usuarioId,
          clienteId: dto.clienteId || null,
          clienteNombreTemporal: dto.clienteId ? null : dto.clienteNombre || null,
          clienteDocumentoTemporal: dto.clienteId ? null : dto.clienteDocumento || null,
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

    // 9. Invalidar cache
    await this.invalidateCache(empresaId);

    // 10. Obtener venta completa para respuesta
    const ventaCompleta = await this.findOne(empresaId, venta.id);

    // 11. Enviar notificacion a cliente mayorista (async, no bloquea)
    if (esMayorista && clienteData?.email) {
      const empresaInfo = await this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { nombreComercial: true },
      });
      const vendedor = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { nombre: true },
      });

      this.notificacionService
        .enviarNotificacionVentaMayorista({
          clienteNombre: clienteData.apellido
            ? `${clienteData.nombre} ${clienteData.apellido}`
            : clienteData.nombre,
          clienteEmail: clienteData.email,
          numeroVenta: numeroVenta,
          items: itemsConPrecios.map((item) => ({
            nombre: item.productoNombre || 'Producto',
            cantidad: item.cantidad,
            precioOriginal: item.precioOriginal || item.precioUnitario,
            precioMayorista: item.precioUnitario,
          })),
          subtotalOriginal: itemsConPrecios.reduce(
            (sum, item) => sum + (item.precioOriginal || item.precioUnitario) * item.cantidad,
            0,
          ),
          subtotalMayorista: subtotal,
          ahorro: itemsConPrecios.reduce(
            (sum, item) =>
              sum + ((item.precioOriginal || item.precioUnitario) - item.precioUnitario) * item.cantidad,
            0,
          ),
          total,
          vendedorNombre: vendedor?.nombre || 'Vendedor',
          empresaNombre: empresaInfo?.nombreComercial || 'Empresa',
          fecha: new Date(),
        })
        .catch(() => {}); // No bloquear si falla el email
    }

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
        // Calcular montos reales por tipo de pago
        const montoEfectivo = await this.calcularMontoTipoPagoFromPagos(venta.pagos, 'efectivo');
        const montoTarjeta = await this.calcularMontoTipoPagoFromPagos(venta.pagos, 'tarjeta');
        const montoOtros = await this.calcularMontoTipoPagoFromPagos(venta.pagos, 'otros');

        await tx.caja.update({
          where: { id: venta.cajaId },
          data: {
            montoVentas: { decrement: Number(venta.total) },
            montoEfectivo: { decrement: montoEfectivo },
            montoTarjeta: { decrement: montoTarjeta },
            montoOtros: { decrement: montoOtros },
          },
        });
      }
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      message: 'Venta anulada correctamente',
      data: {
        id: ventaId,
        numero: venta.numeroVenta,
      },
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
   * GET /ventas/metodos-pago - Obtener métodos de pago activos (incluye pasarelas)
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
        comisionPorcentaje: true,
        comisionFija: true,
        requiereReferencia: true,
        esPasarelaIntegrada: true,
        pasarelaCodigo: true,
      },
    });

    return {
      success: true,
      data: metodosPago,
    };
  }

  /**
   * POST /ventas/:id/devolucion - Procesar devolucion parcial o total
   */
  async procesarDevolucion(
    empresaId: string,
    ventaId: string,
    usuarioId: string,
    dto: DevolucionVentaDto,
  ) {
    // 1. Obtener venta con detalles
    const venta = await this.prisma.venta.findFirst({
      where: { id: ventaId, empresaId },
      include: {
        detalles: {
          include: {
            variante: {
              select: {
                id: true,
                sku: true,
                producto: { select: { nombre: true } },
              },
            },
          },
        },
        pagos: true,
      },
    });

    if (!venta) {
      throw new NotFoundException(ERROR_MESSAGES.SALE_NOT_FOUND);
    }

    if (venta.estado !== 'completada') {
      throw new BadRequestException(
        'Solo se pueden devolver ventas completadas',
      );
    }

    // 2. Validar items de devolucion
    let montoDevolucion = 0;
    const itemsValidados = [];

    for (const item of dto.items) {
      const detalle = venta.detalles.find((d) => d.id === item.detalleId);
      if (!detalle) {
        throw new NotFoundException(
          `Detalle de venta ${item.detalleId} no encontrado`,
        );
      }

      if (item.cantidad <= 0) {
        throw new BadRequestException(
          'La cantidad a devolver debe ser mayor a 0',
        );
      }

      if (item.cantidad > detalle.cantidad) {
        throw new BadRequestException(
          `No se puede devolver mas de ${detalle.cantidad} unidades de ${detalle.variante?.producto?.nombre || 'producto'}`,
        );
      }

      const montoItem =
        (Number(detalle.precioUnidad) * item.cantidad) -
        (Number(detalle.descuento || 0) * (item.cantidad / detalle.cantidad));

      itemsValidados.push({
        detalle,
        cantidadDevolver: item.cantidad,
        montoDevolucion: montoItem,
      });

      montoDevolucion += montoItem;
    }

    // 3. Verificar si es devolucion total (todos los items, cantidades completas)
    const totalItemsVenta = venta.detalles.length;
    const esDevolucionTotal =
      itemsValidados.length === totalItemsVenta &&
      itemsValidados.every(
        (iv) => iv.cantidadDevolver === iv.detalle.cantidad,
      );

    // 4. Procesar en transaccion
    await this.prisma.$transaction(async (tx) => {
      for (const iv of itemsValidados) {
        // Restaurar stock de variante
        await tx.variante.update({
          where: { id: iv.detalle.varianteId },
          data: {
            stock: { increment: iv.cantidadDevolver },
          },
        });

        // Restaurar stock de sucursal
        await tx.stockSucursal.update({
          where: {
            varianteId_sucursalId: {
              varianteId: iv.detalle.varianteId,
              sucursalId: venta.sucursalId,
            },
          },
          data: {
            stock: { increment: iv.cantidadDevolver },
          },
        });

        // Restaurar stock del lote si aplica
        if (iv.detalle.loteId) {
          await tx.lote.update({
            where: { id: iv.detalle.loteId },
            data: {
              stock: { increment: iv.cantidadDevolver },
              estado: 'activo',
            },
          });
        }

        // Actualizar cantidad del detalle si es devolucion parcial del item
        if (iv.cantidadDevolver < iv.detalle.cantidad) {
          const nuevaCantidad = iv.detalle.cantidad - iv.cantidadDevolver;
          const nuevoSubtotal =
            Number(iv.detalle.precioUnidad) * nuevaCantidad -
            Number(iv.detalle.descuento || 0) * (nuevaCantidad / iv.detalle.cantidad);

          await tx.ventaDetalle.update({
            where: { id: iv.detalle.id },
            data: {
              cantidad: nuevaCantidad,
              subtotal: nuevoSubtotal,
            },
          });
        } else {
          // Devolucion completa del item: marcar cantidad en 0
          await tx.ventaDetalle.update({
            where: { id: iv.detalle.id },
            data: {
              cantidad: 0,
              subtotal: 0,
            },
          });
        }
      }

      // Actualizar venta
      const nuevoTotal = Number(venta.total) - montoDevolucion;
      const notaDevolucion = `[DEVOLUCION ${new Date().toLocaleDateString()}] ${dto.motivo || 'Devolucion parcial'} - Monto: ${montoDevolucion.toFixed(2)}`;

      await tx.venta.update({
        where: { id: ventaId },
        data: {
          estado: esDevolucionTotal ? 'anulada' : 'completada',
          total: esDevolucionTotal ? venta.total : nuevoTotal,
          notas: venta.notas
            ? `${venta.notas}\n${notaDevolucion}`
            : notaDevolucion,
        },
      });

      // Revertir montos de la caja si sigue abierta
      const caja = await tx.caja.findUnique({
        where: { id: venta.cajaId },
      });

      if (caja && caja.estado === 'abierta') {
        await tx.caja.update({
          where: { id: venta.cajaId },
          data: {
            montoVentas: { decrement: montoDevolucion },
          },
        });
      }
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      message: esDevolucionTotal
        ? 'Devolucion total procesada. La venta fue anulada.'
        : 'Devolucion parcial procesada correctamente.',
      data: {
        ventaId,
        montoDevolucion,
        esDevolucionTotal,
        itemsDevueltos: itemsValidados.map((iv) => ({
          detalleId: iv.detalle.id,
          productoNombre: iv.detalle.variante?.producto?.nombre,
          cantidadDevuelta: iv.cantidadDevolver,
          montoDevuelto: iv.montoDevolucion,
        })),
      },
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
    esMayorista = false,
  ) {
    const itemsCalculados = [];

    for (const item of items) {
      // Obtener variante con stock y precios
      const variante = await this.prisma.variante.findFirst({
        where: {
          id: item.varianteId,
          producto: { empresaId },
        },
        include: {
          producto: {
            select: {
              nombre: true,
              precioVenta: true,
              precioMayorista: true,
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

      // Determinar precio: si es mayorista, usar precioMayorista si existe
      const precioVentaNormal = Number(variante.precioVenta) || Number(variante.producto.precioVenta);
      let precioUnitarioFinal = item.precioUnitario;
      let precioOriginal = precioVentaNormal;

      if (esMayorista) {
        const precioMayorista =
          Number(variante.precioMayorista) || Number(variante.producto.precioMayorista) || 0;
        if (precioMayorista > 0) {
          precioUnitarioFinal = precioMayorista;
          precioOriginal = precioVentaNormal;
        }
      }

      // Calcular descuento
      const descuentoPorcentaje = item.descuentoPorcentaje || 0;
      const descuentoMontoManual = item.descuentoMonto || 0;
      const precioBase = precioUnitarioFinal * item.cantidad;
      const descuentoPorcentajeMonto = precioBase * (descuentoPorcentaje / 100);
      const descuentoMonto = descuentoPorcentajeMonto + descuentoMontoManual;
      const subtotal = precioBase - descuentoMonto;

      itemsCalculados.push({
        varianteId: item.varianteId,
        loteId,
        cantidad: item.cantidad,
        precioUnitario: precioUnitarioFinal,
        precioOriginal,
        productoNombre: variante.producto.nombre,
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
   * Calcular monto por tipo de pago desde pagos existentes (para anulaciones)
   */
  private async calcularMontoTipoPagoFromPagos(
    pagos: any[],
    tipo: 'efectivo' | 'tarjeta' | 'otros',
  ): Promise<number> {
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
        total += Number(pago.monto);
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
