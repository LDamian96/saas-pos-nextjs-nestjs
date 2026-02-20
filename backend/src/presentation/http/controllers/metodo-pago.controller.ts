/**
 * @file metodo-pago.controller.ts
 * @description Controller para gestión de métodos de pago
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: metodos_pago)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MÉTODOS DE PAGO)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { MetodoPagoService } from '../../../core/application/services/metodo-pago.service';
import { CreateMetodoPagoDto, UpdateMetodoPagoDto, CreatePreferenceDto, WebhookMercadoPagoDto } from '../../../core/application/dto/metodo-pago';
import { Public } from '../decorators/public.decorator';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('metodos-pago')
@UseGuards(JwtAuthGuard)
export class MetodoPagoController {
  constructor(private readonly metodoPagoService: MetodoPagoService) {}

  /**
   * GET /metodos-pago - Listar métodos de pago
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.metodoPagoService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      tipo,
    });
  }

  /**
   * GET /metodos-pago/:id - Obtener método de pago
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.metodoPagoService.findOne(user.empresaId, id);
  }

  /**
   * POST /metodos-pago - Crear método de pago
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMetodoPagoDto,
  ) {
    return this.metodoPagoService.create(user.empresaId, dto);
  }

  /**
   * PUT /metodos-pago/:id - Actualizar método de pago
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMetodoPagoDto,
  ) {
    return this.metodoPagoService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /metodos-pago/:id - Eliminar método de pago
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.metodoPagoService.delete(user.empresaId, id);
  }

  // =====================================================
  // MERCADO PAGO ENDPOINTS
  // =====================================================

  /**
   * POST /metodos-pago/mercadopago/preference - Crear preferencia de pago
   */
  @Post('mercadopago/preference')
  async crearPreferencia(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePreferenceDto,
  ) {
    return this.metodoPagoService.crearPreferenciaMercadoPago(user.empresaId, dto);
  }

  /**
   * POST /metodos-pago/mercadopago/webhook - Webhook (público, sin auth)
   */
  @Public()
  @Post('mercadopago/webhook')
  async webhook(@Body() dto: WebhookMercadoPagoDto) {
    return this.metodoPagoService.procesarWebhookMercadoPago(dto);
  }

  /**
   * GET /metodos-pago/mercadopago/payment/:paymentId - Consultar pago
   */
  @Get('mercadopago/payment/:paymentId')
  async consultarPago(
    @CurrentUser() user: JwtPayload,
    @Param('paymentId') paymentId: string,
  ) {
    return this.metodoPagoService.consultarPagoMercadoPago(user.empresaId, paymentId);
  }
}
