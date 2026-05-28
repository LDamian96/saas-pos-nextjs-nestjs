/**
 * @file promocion.controller.ts
 * @description Controller para gestión de promociones
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: promociones)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROMOCIONES)
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
import { PromocionService } from '../../../core/application/services/promocion.service';
import { CreatePromocionDto, UpdatePromocionDto, CalcularDescuentoDto } from '../../../core/application/dto/promocion';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('promociones')
@UseGuards(JwtAuthGuard)
export class PromocionController {
  constructor(private readonly promocionService: PromocionService) {}

  /**
   * GET /promociones - Listar promociones
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('tipo') tipo?: string,
    @Query('search') search?: string,
  ) {
    return this.promocionService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      tipo,
      search,
    });
  }

  /**
   * GET /promociones/vigentes - Obtener promociones vigentes
   */
  @Get('vigentes')
  async findVigentes(
    @CurrentUser() user: JwtPayload,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.promocionService.findVigentes(user.empresaId, sucursalId);
  }

  /**
   * POST /promociones/evaluar - Evaluate promotions for cart items
   * Must be before :id routes to avoid param conflict
   */
  @Post('evaluar')
  async evaluateCart(
    @CurrentUser() user: JwtPayload,
    @Body() body: { items: Array<{ varianteId: string; productoId: string; cantidad: number; precioUnitario: number }>; sucursalId?: string },
  ) {
    return this.promocionService.evaluateCart(user.empresaId, body.items, body.sucursalId);
  }

  /**
   * GET /promociones/:id - Obtener promoción
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promocionService.findOne(user.empresaId, id);
  }

  /**
   * POST /promociones - Crear promoción
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePromocionDto,
  ) {
    return this.promocionService.create(user.empresaId, dto);
  }

  /**
   * PUT /promociones/:id - Actualizar promoción
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromocionDto,
  ) {
    return this.promocionService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /promociones/:id - Eliminar promoción
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promocionService.delete(user.empresaId, id);
  }

  /**
   * POST /promociones/:id/calcular - Calcular descuento
   */
  @Post(':id/calcular')
  async calcularDescuento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CalcularDescuentoDto,
  ) {
    return this.promocionService.calcularDescuento(id, dto.cantidad, dto.precioUnitario);
  }

}
