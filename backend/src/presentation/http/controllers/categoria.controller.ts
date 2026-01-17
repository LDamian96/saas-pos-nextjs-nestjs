/**
 * @file categoria.controller.ts
 * @description Controller para gestión de categorías
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
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
import { CategoriaService } from '../../../core/application/services/categoria.service';
import {
  CreateCategoriaDto,
  UpdateCategoriaDto,
  VincularAtributoDto,
  VincularAtributosDto,
  UpdateVinculoAtributoDto,
} from '../../../core/application/dto/categoria';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  /**
   * GET /categorias - Listar categorías
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('search') search?: string,
  ) {
    return this.categoriaService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      search,
    });
  }

  /**
   * GET /categorias/:id - Obtener categoría
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.findOne(user.empresaId, id);
  }

  /**
   * POST /categorias - Crear categoría
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoriaDto,
  ) {
    return this.categoriaService.create(user.empresaId, dto);
  }

  /**
   * PUT /categorias/:id - Actualizar categoría
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    return this.categoriaService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /categorias/:id - Eliminar categoría
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.delete(user.empresaId, id);
  }

  // =====================================================
  // GESTIÓN DE ATRIBUTOS VINCULADOS
  // =====================================================

  /**
   * GET /categorias/:id/atributos - Listar atributos vinculados
   */
  @Get(':id/atributos')
  async getAtributos(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.getAtributos(user.empresaId, id);
  }

  /**
   * GET /categorias/:id/atributos-disponibles - Atributos no vinculados
   */
  @Get(':id/atributos-disponibles')
  async getAtributosDisponibles(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriaService.getAtributosDisponibles(user.empresaId, id);
  }

  /**
   * POST /categorias/:id/atributos - Vincular un atributo
   */
  @Post(':id/atributos')
  async vincularAtributo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VincularAtributoDto,
  ) {
    return this.categoriaService.vincularAtributo(user.empresaId, id, dto);
  }

  /**
   * POST /categorias/:id/atributos/batch - Vincular múltiples atributos
   */
  @Post(':id/atributos/batch')
  async vincularAtributos(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VincularAtributosDto,
  ) {
    return this.categoriaService.vincularAtributos(user.empresaId, id, dto);
  }

  /**
   * PUT /categorias/:id/atributos/:atributoId - Actualizar vínculo
   */
  @Put(':id/atributos/:atributoId')
  async updateVinculo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('atributoId', ParseUUIDPipe) atributoId: string,
    @Body() dto: UpdateVinculoAtributoDto,
  ) {
    return this.categoriaService.updateVinculo(user.empresaId, id, atributoId, dto);
  }

  /**
   * DELETE /categorias/:id/atributos/:atributoId - Desvincular atributo
   */
  @Delete(':id/atributos/:atributoId')
  async desvincularAtributo(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('atributoId', ParseUUIDPipe) atributoId: string,
  ) {
    return this.categoriaService.desvincularAtributo(user.empresaId, id, atributoId);
  }
}
