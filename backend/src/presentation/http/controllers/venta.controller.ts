/**
 * @file venta.controller.ts
 * @description Controlador REST para ventas (POS)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: VENTAS)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { VentaService } from '../../../core/application/services/venta.service';
import {
  CreateVentaDto,
  VentaFiltersDto,
  AnularVentaDto,
} from '../../../core/application/dto/venta';

// Tipo local con empresaId garantizado (TenantGuard valida esto)
interface UserWithEmpresa {
  id: string;
  email: string;
  empresaId: string;
  sucursalId: string | null;
  rol: string;
  permisos: string[];
}

@Controller('ventas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  /**
   * GET /ventas
   * Listar ventas con filtros y paginacion
   */
  @Get()
  @Permissions('ventas.ver')
  async findAll(
    @CurrentUser() user: UserWithEmpresa,
    @Query() query: VentaFiltersDto,
  ) {
    return this.ventaService.findAll(user.empresaId, query);
  }

  /**
   * GET /ventas/metodos-pago
   * Obtener metodos de pago activos
   */
  @Get('metodos-pago')
  @Permissions('ventas.crear')
  async getMetodosPago(@CurrentUser() user: UserWithEmpresa) {
    return this.ventaService.getMetodosPago(user.empresaId);
  }

  /**
   * GET /ventas/resumen-dia
   * Obtener resumen de ventas del dia
   */
  @Get('resumen-dia')
  @Permissions('ventas.ver')
  async getResumenDia(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.ventaService.getResumenDia(user.empresaId, sucursalId);
  }

  /**
   * GET /ventas/estadisticas
   * Obtener estadisticas de ventas por periodo
   */
  @Get('estadisticas')
  @Permissions('ventas.ver')
  async getEstadisticas(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.ventaService.getEstadisticas(user.empresaId, sucursalId, fechaInicio, fechaFin);
  }

  /**
   * GET /ventas/:id
   * Obtener venta completa con detalles y pagos
   */
  @Get(':id')
  @Permissions('ventas.ver')
  async findOne(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ventaService.findOne(user.empresaId, id);
  }

  /**
   * POST /ventas
   * Crear una nueva venta (POS)
   */
  @Post()
  @Permissions('ventas.crear')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: CreateVentaDto,
  ) {
    return this.ventaService.create(user.empresaId, user.id, dto);
  }

  /**
   * POST /ventas/:id/anular
   * Anular una venta existente
   */
  @Post(':id/anular')
  @Permissions('ventas.anular')
  @HttpCode(HttpStatus.OK)
  async anular(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnularVentaDto,
  ) {
    return this.ventaService.anular(user.empresaId, id, user.id, dto);
  }
}
