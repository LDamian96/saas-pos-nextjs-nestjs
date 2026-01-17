/**
 * @file reportes.controller.ts
 * @description Controlador REST para reportes
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: REPORTES)
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { ReportesService } from '../../../core/application/services/reportes.service';
import {
  ReporteVentasFiltersDto,
  ReporteProductosFiltersDto,
  ReporteInventarioFiltersDto,
  ReporteCajaFiltersDto,
  ReporteClientesFiltersDto,
  ReporteDashboardFiltersDto,
} from '../../../core/application/dto/reportes';

interface UserWithEmpresa {
  id: string;
  email: string;
  empresaId: string;
  sucursalId: string | null;
  rol: string;
  permisos: string[];
}

@Controller('reportes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
   * GET /reportes/ventas
   * Reporte completo de ventas con filtros
   */
  @Get('ventas')
  @Permissions('reportes.ver')
  async getReporteVentas(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteVentasFiltersDto,
  ) {
    return this.reportesService.getReporteVentas(user.empresaId, filters);
  }

  /**
   * GET /reportes/ventas/diario
   * Ventas del día actual
   */
  @Get('ventas/diario')
  @Permissions('ventas.ver')
  async getVentasDiario(
    @CurrentUser() user: UserWithEmpresa,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.reportesService.getVentasDiario(user.empresaId, sucursalId);
  }

  /**
   * GET /reportes/productos/mas-vendidos
   * Top productos más vendidos
   */
  @Get('productos/mas-vendidos')
  @Permissions('reportes.ver')
  async getProductosMasVendidos(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteProductosFiltersDto,
  ) {
    return this.reportesService.getProductosMasVendidos(user.empresaId, filters);
  }

  /**
   * GET /reportes/productos/sin-rotacion
   * Productos sin movimiento
   */
  @Get('productos/sin-rotacion')
  @Permissions('reportes.ver')
  async getProductosSinRotacion(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteProductosFiltersDto,
  ) {
    return this.reportesService.getProductosSinRotacion(user.empresaId, filters);
  }

  /**
   * GET /reportes/inventario/valorizado
   * Inventario valorizado
   */
  @Get('inventario/valorizado')
  @Permissions('reportes.ver')
  async getInventarioValorizado(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteInventarioFiltersDto,
  ) {
    return this.reportesService.getInventarioValorizado(user.empresaId, filters);
  }

  /**
   * GET /reportes/caja/resumen
   * Resumen de cajas
   */
  @Get('caja/resumen')
  @Permissions('reportes.ver')
  async getResumenCajas(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteCajaFiltersDto,
  ) {
    return this.reportesService.getResumenCajas(user.empresaId, filters);
  }

  /**
   * GET /reportes/clientes/frecuentes
   * Top clientes frecuentes
   */
  @Get('clientes/frecuentes')
  @Permissions('reportes.ver')
  async getClientesFrecuentes(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteClientesFiltersDto,
  ) {
    return this.reportesService.getClientesFrecuentes(user.empresaId, filters);
  }

  /**
   * GET /reportes/dashboard
   * KPIs para el dashboard principal
   */
  @Get('dashboard')
  @Permissions('dashboard.ver')
  async getDashboard(
    @CurrentUser() user: UserWithEmpresa,
    @Query() filters: ReporteDashboardFiltersDto,
  ) {
    return this.reportesService.getDashboard(user.empresaId, filters);
  }
}
