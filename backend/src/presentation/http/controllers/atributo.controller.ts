/**
 * @file atributo.controller.ts
 * @description Controller para gestión de atributos y valores
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: atributos, valores_atributo)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
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
import { AtributoService } from '../../../core/application/services/atributo.service';
import { CreateAtributoDto, UpdateAtributoDto } from '../../../core/application/dto/atributo';
import { AddValorAtributoDto, UpdateValorAtributoDto } from '../../../core/application/dto/atributo';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('atributos')
@UseGuards(JwtAuthGuard)
export class AtributoController {
  constructor(private readonly atributoService: AtributoService) {}

  /**
   * GET /atributos - Listar atributos
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('search') search?: string,
  ) {
    return this.atributoService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      search,
    });
  }

  /**
   * GET /atributos/:id - Obtener atributo con valores
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.atributoService.findOne(user.empresaId, id);
  }

  /**
   * POST /atributos - Crear atributo
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAtributoDto,
  ) {
    return this.atributoService.create(user.empresaId, dto);
  }

  /**
   * PUT /atributos/:id - Actualizar atributo
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAtributoDto,
  ) {
    return this.atributoService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /atributos/:id - Eliminar atributo
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.atributoService.delete(user.empresaId, id);
  }

  // =========================================
  // VALORES DE ATRIBUTO
  // =========================================

  /**
   * POST /atributos/:id/valores - Agregar valor
   */
  @Post(':id/valores')
  async addValor(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) atributoId: string,
    @Body() dto: AddValorAtributoDto,
  ) {
    return this.atributoService.addValor(user.empresaId, atributoId, dto);
  }

  /**
   * PUT /atributos/:id/valores/:valorId - Actualizar valor
   */
  @Put(':id/valores/:valorId')
  async updateValor(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) atributoId: string,
    @Param('valorId', ParseUUIDPipe) valorId: string,
    @Body() dto: UpdateValorAtributoDto,
  ) {
    return this.atributoService.updateValor(user.empresaId, atributoId, valorId, dto);
  }

  /**
   * DELETE /atributos/:id/valores/:valorId - Eliminar valor
   */
  @Delete(':id/valores/:valorId')
  async deleteValor(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) atributoId: string,
    @Param('valorId', ParseUUIDPipe) valorId: string,
  ) {
    return this.atributoService.deleteValor(user.empresaId, atributoId, valorId);
  }
}
