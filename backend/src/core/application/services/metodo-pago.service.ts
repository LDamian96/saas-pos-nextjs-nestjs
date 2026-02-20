/**
 * @file metodo-pago.service.ts
 * @description Servicio para gestión de métodos de pago con integración Mercado Pago
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: metodos_pago)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MÉTODOS DE PAGO)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateMetodoPagoDto, UpdateMetodoPagoDto } from '../dto/metodo-pago';

const CACHE_TTL = 3600;
const CACHE_PREFIX = 'metodos-pago';

@Injectable()
export class MetodoPagoService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  /**
   * GET /metodos-pago - Listar métodos de pago de la empresa
   */
  async findAll(empresaId: string, query?: { activo?: boolean; tipo?: string }) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    if (!query?.tipo) {
      const cached = await this.redis.get(cacheKey);
      if (cached && query?.activo === undefined) {
        return { success: true, data: cached };
      }
    }

    const where: any = { empresaId };
    if (query?.activo !== undefined) where.activo = query.activo;
    if (query?.tipo) where.tipo = query.tipo;

    const metodosPago = await this.prisma.metodoPago.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        tipo: true,
        icono: true,
        color: true,
        requiereReferencia: true,
        comisionPorcentaje: true,
        comisionFija: true,
        esPasarelaIntegrada: true,
        pasarelaCodigo: true,
        orden: true,
        activo: true,
        visiblePos: true,
        visibleWeb: true,
        createdAt: true,
      },
    });

    if (!query?.tipo && query?.activo === undefined) {
      await this.redis.set(cacheKey, metodosPago, CACHE_TTL);
    }

    return { success: true, data: metodosPago };
  }

  /**
   * GET /metodos-pago/:id - Obtener método de pago
   */
  async findOne(empresaId: string, id: string) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return { success: true, data: cached };

    const metodoPago = await this.prisma.metodoPago.findFirst({
      where: { id, empresaId },
    });

    if (!metodoPago) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    // No exponer config de pasarela completa
    const result = {
      ...metodoPago,
      pasarelaConfig: metodoPago.pasarelaConfig ? { configured: true } : null,
    };

    await this.redis.set(cacheKey, result, CACHE_TTL);
    return { success: true, data: result };
  }

  /**
   * POST /metodos-pago - Crear método de pago
   */
  async create(empresaId: string, dto: CreateMetodoPagoDto) {
    // Verificar código único
    const existing = await this.prisma.metodoPago.findFirst({
      where: { empresaId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException('Ya existe un método de pago con ese código');
    }

    // Si es pasarela integrada, validar configuración
    if (dto.esPasarelaIntegrada && dto.pasarelaCodigo) {
      await this.validarPasarelaConfig(dto.pasarelaCodigo, dto.pasarelaConfig);
    }

    const metodoPago = await this.prisma.metodoPago.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipo: dto.tipo,
        icono: dto.icono,
        color: dto.color,
        requiereReferencia: dto.requiereReferencia ?? false,
        comisionPorcentaje: dto.comisionPorcentaje ?? 0,
        comisionFija: dto.comisionFija ?? 0,
        esPasarelaIntegrada: dto.esPasarelaIntegrada ?? false,
        pasarelaCodigo: dto.pasarelaCodigo,
        pasarelaConfig: dto.pasarelaConfig,
        orden: dto.orden ?? 0,
        activo: dto.activo ?? true,
        visiblePos: dto.visiblePos ?? true,
        visibleWeb: dto.visibleWeb ?? true,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: {
        ...metodoPago,
        pasarelaConfig: metodoPago.pasarelaConfig ? { configured: true } : null,
      },
      message: 'Método de pago creado correctamente',
    };
  }

  /**
   * PUT /metodos-pago/:id - Actualizar método de pago
   */
  async update(empresaId: string, id: string, dto: UpdateMetodoPagoDto) {
    const existing = await this.prisma.metodoPago.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    // Verificar código único si cambió
    if (dto.codigo && dto.codigo !== existing.codigo) {
      const conflict = await this.prisma.metodoPago.findFirst({
        where: { empresaId, codigo: dto.codigo, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Ya existe un método de pago con ese código');
      }
    }

    // Si se actualiza la pasarela, validar config
    if (dto.esPasarelaIntegrada && dto.pasarelaCodigo) {
      await this.validarPasarelaConfig(dto.pasarelaCodigo, dto.pasarelaConfig);
    }

    const metodoPago = await this.prisma.metodoPago.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: {
        ...metodoPago,
        pasarelaConfig: metodoPago.pasarelaConfig ? { configured: true } : null,
      },
      message: 'Método de pago actualizado correctamente',
    };
  }

  /**
   * DELETE /metodos-pago/:id - Eliminar método de pago
   */
  async delete(empresaId: string, id: string) {
    const existing = await this.prisma.metodoPago.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    // Verificar que no tenga ventas asociadas
    const ventasCount = await this.prisma.ventaPago.count({
      where: { metodoPagoId: id },
    });
    if (ventasCount > 0) {
      // Soft delete: solo desactivar
      await this.prisma.metodoPago.update({
        where: { id },
        data: { activo: false },
      });
      await this.invalidateCache(empresaId);
      return {
        success: true,
        message: 'Método de pago desactivado (tiene ventas asociadas)',
      };
    }

    await this.prisma.metodoPago.delete({ where: { id } });
    await this.invalidateCache(empresaId);

    return { success: true, message: 'Método de pago eliminado correctamente' };
  }

  // =====================================================
  // MERCADO PAGO INTEGRATION
  // =====================================================

  /**
   * POST /metodos-pago/mercadopago/preference - Crear preferencia de pago
   */
  async crearPreferenciaMercadoPago(
    empresaId: string,
    data: {
      items: Array<{ title: string; quantity: number; unit_price: number }>;
      external_reference: string;
    },
  ) {
    const config = await this.getPasarelaConfig(empresaId, 'mercadopago');
    if (!config) {
      throw new BadRequestException('Mercado Pago no está configurado');
    }

    const accessToken = config.access_token;

    const preference = {
      items: data.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'PEN',
      })),
      external_reference: data.external_reference,
      back_urls: {
        success: config.success_url || `${config.frontend_url}/pagos/exito`,
        failure: config.failure_url || `${config.frontend_url}/pagos/error`,
        pending: config.pending_url || `${config.frontend_url}/pagos/pendiente`,
      },
      auto_return: 'approved',
      notification_url: config.webhook_url,
    };

    // Llamar a la API de Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Error al crear preferencia: ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        preferenceId: result.id,
        initPoint: result.init_point,
        sandboxInitPoint: result.sandbox_init_point,
      },
    };
  }

  /**
   * POST /metodos-pago/mercadopago/webhook - Webhook de notificaciones
   */
  async procesarWebhookMercadoPago(body: any) {
    if (body.type !== 'payment') {
      return { success: true, message: 'Notificación ignorada' };
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return { success: true, message: 'Sin ID de pago' };
    }

    // Buscar el método de pago con config de MP para obtener el token
    const metodoPago = await this.prisma.metodoPago.findFirst({
      where: { pasarelaCodigo: 'mercadopago', activo: true },
    });

    if (!metodoPago || !metodoPago.pasarelaConfig) {
      return { success: false, message: 'Configuración no encontrada' };
    }

    const config = metodoPago.pasarelaConfig as any;
    const accessToken = config.access_token;

    // Consultar estado del pago en Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { success: false, message: 'Error consultando pago' };
    }

    const payment = await response.json();

    // Procesar según estado
    if (payment.status === 'approved') {
      // Buscar la venta por external_reference y actualizar estado
      const ventaId = payment.external_reference;
      if (ventaId) {
        await this.prisma.venta.update({
          where: { id: ventaId },
          data: { estado: 'completada' },
        });
      }
    }

    return {
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        externalReference: payment.external_reference,
      },
    };
  }

  /**
   * GET /metodos-pago/mercadopago/payment/:paymentId - Consultar pago
   */
  async consultarPagoMercadoPago(empresaId: string, paymentId: string) {
    const config = await this.getPasarelaConfig(empresaId, 'mercadopago');
    if (!config) {
      throw new BadRequestException('Mercado Pago no está configurado');
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${config.access_token}` },
    });

    if (!response.ok) {
      throw new BadRequestException('Error consultando pago en Mercado Pago');
    }

    const payment = await response.json();

    return {
      success: true,
      data: {
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        paymentMethod: payment.payment_method_id,
        externalReference: payment.external_reference,
        dateApproved: payment.date_approved,
        dateCreated: payment.date_created,
      },
    };
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  /**
   * Obtener configuración de pasarela para una empresa
   */
  private async getPasarelaConfig(empresaId: string, pasarelaCodigo: string) {
    const metodoPago = await this.prisma.metodoPago.findFirst({
      where: {
        empresaId,
        pasarelaCodigo,
        esPasarelaIntegrada: true,
        activo: true,
      },
      select: { pasarelaConfig: true },
    });

    return metodoPago?.pasarelaConfig as Record<string, any> | null;
  }

  /**
   * Validar configuración de pasarela
   */
  private async validarPasarelaConfig(
    pasarelaCodigo: string,
    config?: Record<string, any>,
  ) {
    if (!config) {
      throw new BadRequestException('La configuración de pasarela es requerida');
    }

    switch (pasarelaCodigo) {
      case 'mercadopago':
        if (!config.access_token || !config.public_key) {
          throw new BadRequestException(
            'Mercado Pago requiere access_token y public_key',
          );
        }
        // Validar credenciales haciendo un test call
        try {
          const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
            headers: { Authorization: `Bearer ${config.access_token}` },
          });
          if (!response.ok) {
            throw new BadRequestException('Credenciales de Mercado Pago inválidas');
          }
        } catch (error) {
          if (error instanceof BadRequestException) throw error;
          throw new BadRequestException('No se pudo conectar con Mercado Pago');
        }
        break;
      default:
        // Para otras pasarelas, solo verificar que haya config
        break;
    }
  }

  /**
   * Invalidar cache de métodos de pago
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
