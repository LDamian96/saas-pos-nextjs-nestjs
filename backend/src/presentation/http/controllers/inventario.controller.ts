/**
 * @file inventario.controller.ts
 * @description Controlador HTTP para gestión de inventario
 *
 * @references
 * - Service: ver src/core/application/services/inventario.service.ts
 * - DTOs: ver src/core/application/dto/inventario/
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
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
import { InventarioService } from '../../../core/application/services/inventario.service';
import {
  EntradaInventarioDto,
  SalidaInventarioDto,
  AjusteInventarioDto,
  TraspasoInventarioDto,
} from '../../../core/application/dto/inventario';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

interface UserWithEmpresa {
  id: string;
  empresaId: string;
}

@Controller('inventario')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * GET /inventario/stock
   * Obtener stock por sucursal
   */
  @Get('stock')
  @Permissions('inventario.ver')
  async getStock(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('stockBajo') stockBajo?: string,
    @Query('search') search?: string,
  ) {
    return this.inventarioService.getStock(user.empresaId, {
      sucursalId,
      categoriaId,
      stockBajo: stockBajo === 'true',
      search,
    });
  }

  /**
   * GET /inventario/stock/:varianteId
   * Stock de variante en todas las sucursales
   */
  @Get('stock/:varianteId')
  @Permissions('inventario.ver')
  async getStockVariante(
    @CurrentUser() user: UserWithEmpresa,
    @Param('varianteId', ParseUUIDPipe) varianteId: string,
  ) {
    return this.inventarioService.getStockVariante(user.empresaId, varianteId);
  }

  /**
   * POST /inventario/entrada
   * Registrar entrada de productos
   */
  @Post('entrada')
  @Permissions('inventario.entrada')
  async registrarEntrada(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: EntradaInventarioDto,
  ) {
    return this.inventarioService.registrarEntrada(user.empresaId, user.id, dto);
  }

  /**
   * POST /inventario/salida
   * Registrar salida de productos
   */
  @Post('salida')
  @Permissions('inventario.salida')
  async registrarSalida(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: SalidaInventarioDto,
  ) {
    return this.inventarioService.registrarSalida(user.empresaId, user.id, dto);
  }

  /**
   * POST /inventario/ajuste
   * Ajustar stock manualmente
   */
  @Post('ajuste')
  @Permissions('inventario.ajuste')
  async ajustarStock(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: AjusteInventarioDto,
  ) {
    return this.inventarioService.ajustarStock(user.empresaId, user.id, dto);
  }

  /**
   * POST /inventario/transferencia
   * Traspasar entre sucursales
   */
  @Post('transferencia')
  @Permissions('inventario.traspaso')
  async traspasar(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: TraspasoInventarioDto,
  ) {
    return this.inventarioService.traspasar(user.empresaId, user.id, dto);
  }

  /**
   * GET /inventario/kardex
   * Obtener kardex (movimientos de una variante)
   */
  @Get('kardex')
  @Permissions('inventario.ver')
  async getKardex(
    @CurrentUser() user: UserWithEmpresa,
    @Query('varianteId', ParseUUIDPipe) varianteId: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventarioService.getKardex(user.empresaId, {
      varianteId,
      sucursalId,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  /**
   * GET /inventario/stock-bajo
   * Productos con stock bajo
   */
  @Get('stock-bajo')
  @Permissions('inventario.ver')
  async getStockBajo(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.inventarioService.getStockBajo(user.empresaId, sucursalId);
  }

  /**
   * GET /inventario/movimientos
   * Historial de todos los movimientos
   */
  @Get('movimientos')
  @Permissions('inventario.ver')
  async getMovimientos(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
    @Query('tipo') tipo?: string,
    @Query('motivo') motivo?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventarioService.getMovimientos(user.empresaId, {
      sucursalId,
      tipo,
      motivo,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}
