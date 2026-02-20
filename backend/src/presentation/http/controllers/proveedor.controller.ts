/**
 * @file proveedor.controller.ts
 * @description Controller para gestión de proveedores
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: proveedores)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROVEEDORES)
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
import { ProveedorService } from '../../../core/application/services/proveedor.service';
import { CreateProveedorDto, UpdateProveedorDto } from '../../../core/application/dto/proveedor';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  /**
   * GET /proveedores - Listar proveedores
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activo') activo?: string,
    @Query('search') search?: string,
  ) {
    return this.proveedorService.findAll(user.empresaId, {
      activo: activo ? activo === 'true' : undefined,
      search,
    });
  }

  /**
   * GET /proveedores/:id - Obtener proveedor
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proveedorService.findOne(user.empresaId, id);
  }

  /**
   * POST /proveedores - Crear proveedor
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProveedorDto,
  ) {
    return this.proveedorService.create(user.empresaId, dto);
  }

  /**
   * PUT /proveedores/:id - Actualizar proveedor
   */
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /proveedores/:id - Eliminar proveedor
   */
  @Delete(':id')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.proveedorService.delete(user.empresaId, id);
  }
}
