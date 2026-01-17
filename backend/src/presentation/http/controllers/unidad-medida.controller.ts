/**
 * @file unidad-medida.controller.ts
 * @description Controller para gestión de unidades de medida
 *
 * @references
 * - Service: ver src/core/application/services/unidad-medida.service.ts
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { UnidadMedidaService } from '../../../core/application/services/unidad-medida.service';
import { CreateUnidadMedidaDto } from '../../../core/application/dto/unidad-medida/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from '../../../core/application/dto/unidad-medida/update-unidad-medida.dto';

@Controller('unidades-medida')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnidadMedidaController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {}

  /**
   * GET /unidades-medida
   * Listar unidades de medida
   */
  @Get()
  @Permissions('catalogos.ver')
  async findAll(
    @Request() req: any,
    @Query('activo') activo?: string,
  ) {
    return this.unidadMedidaService.findAll(req.user.empresaId, {
      activo: activo !== undefined ? activo === 'true' : undefined,
    });
  }

  /**
   * GET /unidades-medida/:id
   * Obtener unidad de medida por ID
   */
  @Get(':id')
  @Permissions('catalogos.ver')
  async findById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const unidad = await this.unidadMedidaService.findById(req.user.empresaId, id);

    if (!unidad) {
      throw new NotFoundException('Unidad de medida no encontrada');
    }

    return unidad;
  }

  /**
   * POST /unidades-medida
   * Crear unidad de medida
   */
  @Post()
  @Permissions('catalogos.crear')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() dto: CreateUnidadMedidaDto) {
    return this.unidadMedidaService.create(req.user.empresaId, dto);
  }

  /**
   * PATCH /unidades-medida/:id
   * Actualizar unidad de medida
   */
  @Patch(':id')
  @Permissions('catalogos.editar')
  async update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnidadMedidaDto,
  ) {
    return this.unidadMedidaService.update(req.user.empresaId, id, dto);
  }

  /**
   * DELETE /unidades-medida/:id
   * Eliminar unidad de medida
   */
  @Delete(':id')
  @Permissions('catalogos.eliminar')
  async delete(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.unidadMedidaService.delete(req.user.empresaId, id);
  }
}
