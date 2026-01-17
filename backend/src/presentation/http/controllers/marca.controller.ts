/**
 * @file marca.controller.ts
 * @description Controller para gestión de marcas
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: marcas)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
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
import { MarcaService } from '../../../core/application/services/marca.service';
import { CreateMarcaDto, UpdateMarcaDto } from '../../../core/application/dto/marca';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('marcas')
@UseGuards(JwtAuthGuard)
export class MarcaController {
  constructor(private readonly marcaService: MarcaService) {}

  /**
   * GET /marcas - Listar marcas
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('search') search?: string,
  ) {
    return this.marcaService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      search,
    });
  }

  /**
   * GET /marcas/:id - Obtener marca
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.marcaService.findOne(user.empresaId, id);
  }

  /**
   * POST /marcas - Crear marca
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMarcaDto,
  ) {
    return this.marcaService.create(user.empresaId, dto);
  }

  /**
   * PUT /marcas/:id - Actualizar marca
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMarcaDto,
  ) {
    return this.marcaService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /marcas/:id - Eliminar marca
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.marcaService.delete(user.empresaId, id);
  }
}
