/**
 * @file caja.controller.ts
 * @description Controlador HTTP para gestión de cajas
 *
 * @references
 * - Service: ver src/core/application/services/caja.service.ts
 * - DTOs: ver src/core/application/dto/caja/
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CajaService } from '../../../core/application/services/caja.service';
import { AperturaCajaDto, CierreCajaDto, MovimientoCajaDto } from '../../../core/application/dto/caja';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

import { NormalizeSucursalIdPipe } from '../pipes/normalize-sucursal-id.pipe';
interface UserWithEmpresa {
  id: string;
  empresaId: string;
}

@Controller('caja')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  /**
   * GET /caja/actual
   * Obtener caja abierta del usuario actual
   */
  @Get('actual')
  @Permissions('caja.ver')
  async getCajaActual(@CurrentUser() user: UserWithEmpresa) {
    return this.cajaService.getCajaAbierta(user.empresaId, user.id);
  }

  /**
   * POST /caja/abrir
   * Abrir nueva caja
   */
  @Post('abrir')
  @Permissions('caja.abrir')
  async abrirCaja(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: AperturaCajaDto,
  ) {
    return this.cajaService.abrirCaja(user.empresaId, user.id, dto);
  }

  /**
   * POST /caja/:id/cerrar
   * Cerrar caja
   */
  @Post(':id/cerrar')
  @Permissions('caja.cerrar')
  async cerrarCaja(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CierreCajaDto,
  ) {
    return this.cajaService.cerrarCaja(user.empresaId, user.id, id, dto);
  }

  /**
   * POST /caja/:id/movimiento
   * Registrar entrada/salida de efectivo
   */
  @Post(':id/movimiento')
  @Permissions('caja.movimiento')
  async registrarMovimiento(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MovimientoCajaDto,
  ) {
    return this.cajaService.registrarMovimiento(user.empresaId, user.id, id, dto);
  }

  /**
   * GET /caja/historial
   * Obtener historial de cajas
   */
  @Get('historial')
  @Permissions('caja.historial')
  async getHistorial(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cajaService.getHistorial(user.empresaId, {
      sucursalId,
      estado,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  /**
   * GET /caja/:id
   * Obtener detalle de caja
   */
  @Get(':id')
  @Permissions('caja.ver')
  async getCaja(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cajaService.getCajaById(user.empresaId, id);
  }

  /**
   * GET /caja/:id/resumen
   * Obtener resumen de caja
   */
  @Get(':id/resumen')
  @Permissions('caja.ver')
  async getResumen(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cajaService.getResumenCaja(user.empresaId, id);
  }

  /**
   * GET /caja/:id/movimientos
   * Obtener movimientos de caja (entradas/salidas)
   */
  @Get(':id/movimientos')
  @Permissions('caja.ver')
  async getMovimientos(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cajaService.getMovimientosCaja(user.empresaId, id);
  }
}
