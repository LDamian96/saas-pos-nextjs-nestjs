/**
 * @file alerta-inventario.controller.ts
 * @description Controller para alertas de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AlertaInventarioService } from '../../../core/application/services/alerta-inventario.service';
import { CurrentUser, UserPayload } from '../decorators/current-user.decorator';

import { NormalizeSucursalIdPipe } from '../pipes/normalize-sucursal-id.pipe';
@ApiTags('Alertas de Inventario')
@Controller('alertas-inventario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertaInventarioController {
  constructor(private readonly alertaService: AlertaInventarioService) {}

  private getEmpresaId(user: UserPayload): string {
    if (!user.empresaId) {
      throw new ForbiddenException('Usuario sin empresa asignada');
    }
    return user.empresaId;
  }

  /**
   * GET /alertas-inventario/resumen - Resumen de alertas
   */
  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de todas las alertas' })
  async getResumen(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
  ) {
    return this.alertaService.getResumenAlertas(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /alertas-inventario/stock-bajo - Productos con stock bajo
   */
  @Get('stock-bajo')
  @ApiOperation({ summary: 'Obtener productos con stock bajo' })
  async getStockBajo(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
  ) {
    return this.alertaService.getAlertasStockBajo(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /alertas-inventario/vencimientos - Productos próximos a vencer
   */
  @Get('vencimientos')
  @ApiOperation({ summary: 'Obtener productos próximos a vencer' })
  async getVencimientos(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
    @Query('dias') dias?: number,
  ) {
    return this.alertaService.getAlertasVencimiento(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
      dias || 30,
    );
  }

  /**
   * GET /alertas-inventario/estancados - Productos sin movimiento
   */
  @Get('estancados')
  @ApiOperation({ summary: 'Obtener productos sin movimiento (estancados)' })
  async getEstancados(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
    @Query('dias') dias?: number,
  ) {
    return this.alertaService.getProductosEstancados(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
      dias || 30,
    );
  }
}
