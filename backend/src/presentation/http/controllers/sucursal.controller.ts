/**
 * @file sucursal.controller.ts
 * @description Controlador de sucursales
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: SUCURSALES)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiParam } from '@nestjs/swagger';

import { SucursalService } from '../../../core/application/services/sucursal.service';
import { CreateSucursalDto, UpdateSucursalDto } from '../../../core/application/dto/sucursal';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';

@ApiTags('Sucursales')
@Controller('sucursales')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth()
export class SucursalController {
  constructor(private readonly sucursalService: SucursalService) {}

  /**
   * GET /sucursales - Listar sucursales de mi empresa
   */
  @Get()
  @ApiOperation({ summary: 'Listar sucursales de mi empresa' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  async findAll(@CurrentUser() user: UserPayload) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.sucursalService.findAll(user.empresaId);
  }

  /**
   * GET /sucursales/:id - Obtener sucursal por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener sucursal por ID' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Datos de la sucursal' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.sucursalService.findOne(user.empresaId, id);
  }

  /**
   * POST /sucursales - Crear sucursal
   */
  @Post()
  @Permissions('sucursales.crear')
  @ApiOperation({ summary: 'Crear nueva sucursal' })
  @ApiResponse({ status: 201, description: 'Sucursal creada' })
  @ApiResponse({ status: 400, description: 'Datos invalidos o limite alcanzado' })
  @ApiResponse({ status: 409, description: 'Codigo duplicado' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateSucursalDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.sucursalService.create(user.empresaId, dto);
  }

  /**
   * PUT /sucursales/:id - Actualizar sucursal
   */
  @Put(':id')
  @Permissions('sucursales.editar')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  @ApiResponse({ status: 409, description: 'Codigo duplicado' })
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSucursalDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.sucursalService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /sucursales/:id - Eliminar sucursal
   */
  @Delete(':id')
  @Permissions('sucursales.eliminar')
  @ApiOperation({ summary: 'Eliminar sucursal' })
  @ApiParam({ name: 'id', description: 'ID de la sucursal' })
  @ApiResponse({ status: 200, description: 'Sucursal eliminada' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar (principal o con datos)' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  async delete(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.sucursalService.delete(user.empresaId, id);
  }
}
