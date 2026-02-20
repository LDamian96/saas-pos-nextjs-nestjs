/**
 * @file compra.controller.ts
 * @description Controller para gestión de compras/ordenes de compra
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: compras)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: COMPRAS)
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
import { CompraService } from '../../../core/application/services/compra.service';
import { CreateCompraDto, UpdateCompraDto } from '../../../core/application/dto/compra';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('compras')
@UseGuards(JwtAuthGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  /**
   * GET /compras - Listar compras
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('proveedorId') proveedorId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.compraService.findAll(user.empresaId, {
      estado,
      estadoPago,
      proveedorId,
      fechaDesde,
      fechaHasta,
    });
  }

  /**
   * GET /compras/resumen - Resumen de compras
   */
  @Get('resumen')
  async getResumen(@CurrentUser() user: JwtPayload) {
    return this.compraService.getResumen(user.empresaId);
  }

  /**
   * GET /compras/:id - Obtener compra
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.compraService.findOne(user.empresaId, id);
  }

  /**
   * POST /compras - Crear compra
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCompraDto,
  ) {
    return this.compraService.create(user.empresaId, user.sub, dto);
  }

  /**
   * PUT /compras/:id - Actualizar compra
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompraDto,
  ) {
    return this.compraService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /compras/:id - Anular compra
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.compraService.delete(user.empresaId, id);
  }
}
