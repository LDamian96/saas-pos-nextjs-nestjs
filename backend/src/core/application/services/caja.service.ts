/**
 * @file caja.service.ts
 * @description Service para gestión de cajas
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: cajas)
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { AperturaCajaDto, CierreCajaDto, MovimientoCajaDto } from '../dto/caja';

const ERROR_MESSAGES = {
  CAJA_NOT_FOUND: 'Caja no encontrada',
  CAJA_ALREADY_OPEN: 'Ya tienes una caja abierta en esta sucursal',
  CAJA_NOT_OPEN: 'La caja no está abierta',
  CAJA_ALREADY_CLOSED: 'La caja ya está cerrada',
  INVALID_CLOSE_AMOUNT: 'El monto de cierre no puede ser negativo',
};

@Injectable()
export class CajaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Obtener caja abierta del usuario actual
   */
  async getCajaAbierta(empresaId: string, usuarioId: string) {
    const caja = await this.prisma.caja.findFirst({
      where: {
        empresaId,
        usuarioAperturaId: usuarioId,
        estado: 'abierta',
      },
      include: {
        sucursal: {
          select: { id: true, nombre: true },
        },
        usuarioApertura: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    return caja;
  }

  /**
   * Abrir nueva caja
   */
  async abrirCaja(empresaId: string, usuarioId: string, dto: AperturaCajaDto) {
    // Verificar si ya tiene caja abierta
    const cajaAbierta = await this.getCajaAbierta(empresaId, usuarioId);
    if (cajaAbierta) {
      throw new ConflictException(ERROR_MESSAGES.CAJA_ALREADY_OPEN);
    }

    // Generar número de caja
    const count = await this.prisma.caja.count({
      where: { empresaId, sucursalId: dto.sucursalId },
    });
    const numero = `CAJA-${String(count + 1).padStart(5, '0')}`;

    // Crear caja con movimiento de apertura en transacción
    const caja = await this.prisma.$transaction(async (tx) => {
      const nuevaCaja = await tx.caja.create({
        data: {
          empresaId,
          sucursalId: dto.sucursalId,
          numero,
          nombre: `Caja ${new Date().toLocaleDateString('es-PE')}`,
          usuarioAperturaId: usuarioId,
          montoApertura: dto.montoApertura,
          montoEfectivo: dto.montoApertura,
          observaciones: dto.observaciones,
          estado: 'abierta',
          fechaApertura: new Date(),
        },
        include: {
          sucursal: {
            select: { id: true, nombre: true },
          },
          usuarioApertura: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      });

      // Crear movimiento de apertura
      if (dto.montoApertura > 0) {
        await tx.movimientoCaja.create({
          data: {
            cajaId: nuevaCaja.id,
            usuarioId,
            tipo: 'entrada',
            motivo: 'apertura',
            monto: dto.montoApertura,
            descripcion: 'Monto inicial de apertura',
          },
        });
      }

      return nuevaCaja;
    });

    return caja;
  }

  /**
   * Cerrar caja
   */
  async cerrarCaja(empresaId: string, usuarioId: string, cajaId: string, dto: CierreCajaDto) {
    const caja = await this.prisma.caja.findFirst({
      where: { id: cajaId, empresaId },
    });

    if (!caja) {
      throw new NotFoundException(ERROR_MESSAGES.CAJA_NOT_FOUND);
    }

    if (caja.estado !== 'abierta') {
      throw new BadRequestException(ERROR_MESSAGES.CAJA_ALREADY_CLOSED);
    }

    // Calcular diferencia
    const montoEsperado = (caja.montoApertura?.toNumber() || 0) + (caja.montoVentas?.toNumber() || 0);
    const diferencia = dto.montoCierre - montoEsperado;

    // Actualizar caja y crear movimiento de cierre en transacción
    const cajaActualizada = await this.prisma.$transaction(async (tx) => {
      // Crear movimiento de cierre
      await tx.movimientoCaja.create({
        data: {
          cajaId,
          usuarioId,
          tipo: 'salida',
          motivo: 'cierre',
          monto: dto.montoCierre,
          descripcion: `Cierre de caja. Esperado: S/.${montoEsperado.toFixed(2)}, Contado: S/.${dto.montoCierre.toFixed(2)}, Diferencia: S/.${diferencia.toFixed(2)}`,
        },
      });

      // Actualizar caja
      return tx.caja.update({
        where: { id: cajaId },
        data: {
          usuarioCierreId: usuarioId,
          montoCierre: dto.montoCierre,
          montoEfectivo: dto.montoEfectivo || caja.montoEfectivo,
          montoTarjeta: dto.montoTarjeta || caja.montoTarjeta,
          montoOtros: dto.montoOtros || caja.montoOtros,
          diferencia,
          observaciones: dto.observaciones || caja.observaciones,
          estado: 'cerrada',
          fechaCierre: new Date(),
        },
        include: {
          sucursal: {
            select: { id: true, nombre: true },
          },
          usuarioApertura: {
            select: { id: true, nombre: true, apellido: true },
          },
          usuarioCierre: {
            select: { id: true, nombre: true, apellido: true },
          },
        },
      });
    });

    return cajaActualizada;
  }

  /**
   * Registrar movimiento de caja (entrada/salida de efectivo)
   */
  async registrarMovimiento(
    empresaId: string,
    usuarioId: string,
    cajaId: string,
    dto: MovimientoCajaDto,
  ) {
    const caja = await this.prisma.caja.findFirst({
      where: { id: cajaId, empresaId, estado: 'abierta' },
    });

    if (!caja) {
      throw new BadRequestException(ERROR_MESSAGES.CAJA_NOT_OPEN);
    }

    // Actualizar monto de efectivo según tipo de movimiento
    const currentEfectivo = caja.montoEfectivo?.toNumber() || 0;
    const nuevoMontoEfectivo =
      dto.tipo === 'entrada'
        ? currentEfectivo + dto.monto
        : currentEfectivo - dto.monto;

    if (nuevoMontoEfectivo < 0) {
      throw new BadRequestException('No hay suficiente efectivo en caja');
    }

    // Determinar el motivo según el tipo
    const motivo = dto.tipo === 'entrada' ? 'ajuste' : 'retiro';

    // Crear registro de movimiento y actualizar caja en transacción
    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoCaja.create({
        data: {
          cajaId,
          usuarioId,
          tipo: dto.tipo,
          motivo,
          monto: dto.monto,
          descripcion: dto.motivo,
          referencia: dto.referencia,
        },
      }),
      this.prisma.caja.update({
        where: { id: cajaId },
        data: {
          montoEfectivo: nuevoMontoEfectivo,
        },
      }),
    ]);

    return {
      success: true,
      movimientoId: movimiento.id,
      tipo: dto.tipo,
      monto: dto.monto,
      motivo: dto.motivo,
      nuevoSaldo: nuevoMontoEfectivo,
    };
  }

  /**
   * Obtener movimientos de una caja
   */
  async getMovimientosCaja(empresaId: string, cajaId: string) {
    // Verificar que la caja pertenece a la empresa
    const caja = await this.prisma.caja.findFirst({
      where: { id: cajaId, empresaId },
    });

    if (!caja) {
      throw new NotFoundException(ERROR_MESSAGES.CAJA_NOT_FOUND);
    }

    const movimientos = await this.prisma.movimientoCaja.findMany({
      where: { cajaId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return movimientos;
  }

  /**
   * Obtener historial de cajas
   */
  async getHistorial(
    empresaId: string,
    options: {
      sucursalId?: string;
      estado?: string;
      fechaInicio?: Date;
      fechaFin?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const { sucursalId, estado, fechaInicio, fechaFin, page = 1, limit = 20 } = options;

    const where: any = { empresaId };

    if (sucursalId) where.sucursalId = sucursalId;
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.fechaApertura = {};
      if (fechaInicio) where.fechaApertura.gte = fechaInicio;
      if (fechaFin) where.fechaApertura.lte = fechaFin;
    }

    const [total, cajas] = await Promise.all([
      this.prisma.caja.count({ where }),
      this.prisma.caja.findMany({
        where,
        include: {
          sucursal: {
            select: { id: true, nombre: true },
          },
          usuarioApertura: {
            select: { id: true, nombre: true, apellido: true },
          },
          usuarioCierre: {
            select: { id: true, nombre: true, apellido: true },
          },
          _count: {
            select: { ventas: true },
          },
        },
        orderBy: { fechaApertura: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: cajas,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener detalle de caja con ventas
   */
  async getCajaById(empresaId: string, cajaId: string) {
    const caja = await this.prisma.caja.findFirst({
      where: { id: cajaId, empresaId },
      include: {
        sucursal: {
          select: { id: true, nombre: true },
        },
        usuarioApertura: {
          select: { id: true, nombre: true, apellido: true },
        },
        usuarioCierre: {
          select: { id: true, nombre: true, apellido: true },
        },
        ventas: {
          select: {
            id: true,
            numeroVenta: true,
            total: true,
            estado: true,
            tipoComprobante: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caja) {
      throw new NotFoundException(ERROR_MESSAGES.CAJA_NOT_FOUND);
    }

    return caja;
  }

  /**
   * Obtener resumen de caja actual
   */
  async getResumenCaja(empresaId: string, cajaId: string) {
    const caja = await this.prisma.caja.findFirst({
      where: { id: cajaId, empresaId },
      include: {
        ventas: {
          where: { estado: 'completada' },
          select: {
            total: true,
            pagos: {
              include: {
                metodoPago: {
                  select: { tipo: true, nombre: true },
                },
              },
            },
          },
        },
      },
    });

    if (!caja) {
      throw new NotFoundException(ERROR_MESSAGES.CAJA_NOT_FOUND);
    }

    // Calcular totales por método de pago
    let totalEfectivo = caja.montoApertura?.toNumber() || 0;
    let totalTarjeta = 0;
    let totalOtros = 0;
    let totalVentas = 0;

    caja.ventas.forEach((venta) => {
      totalVentas += venta.total.toNumber();
      venta.pagos.forEach((pago) => {
        if (pago.metodoPago.tipo === 'efectivo') {
          totalEfectivo += pago.monto.toNumber();
        } else if (pago.metodoPago.tipo === 'tarjeta') {
          totalTarjeta += pago.monto.toNumber();
        } else {
          totalOtros += pago.monto.toNumber();
        }
      });
    });

    return {
      montoApertura: caja.montoApertura,
      totalVentas,
      cantidadVentas: caja.ventas.length,
      totalEfectivo,
      totalTarjeta,
      totalOtros,
      totalEnCaja: totalEfectivo + totalTarjeta + totalOtros,
      estado: caja.estado,
      fechaApertura: caja.fechaApertura,
    };
  }
}
