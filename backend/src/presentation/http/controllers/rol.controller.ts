/**
 * @file rol.controller.ts
 * @description Controlador HTTP para gestión de roles y permisos
 *
 * @references
 * - Service: ver src/core/application/services/rol.service.ts
 * - DTOs: ver src/core/application/dto/rol/
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ROLES Y PERMISOS)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { RolService } from '../../../core/application/services/rol.service';
import { CreateRolDto, UpdateRolDto } from '../../../core/application/dto/rol';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

interface UserWithEmpresa {
  id: string;
  empresaId: string;
}

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolController {
  constructor(private readonly rolService: RolService) {}

  /**
   * GET /roles
   * Listar roles disponibles
   */
  @Get()
  @Permissions('config.roles')
  async findAll(@CurrentUser() user: UserWithEmpresa) {
    return this.rolService.findAll(user.empresaId);
  }

  /**
   * GET /roles/:id
   * Obtener rol con permisos
   */
  @Get(':id')
  @Permissions('config.roles')
  async findOne(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rolService.findOne(user.empresaId, id);
  }

  /**
   * POST /roles
   * Crear rol personalizado
   */
  @Post()
  @Permissions('config.roles')
  async create(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: CreateRolDto,
  ) {
    return this.rolService.create(user.empresaId, dto);
  }

  /**
   * PUT /roles/:id
   * Actualizar rol
   */
  @Put(':id')
  @Permissions('config.roles')
  async update(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRolDto,
  ) {
    return this.rolService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /roles/:id
   * Eliminar rol
   */
  @Delete(':id')
  @Permissions('config.roles')
  async delete(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rolService.delete(user.empresaId, id);
  }

  /**
   * GET /permisos
   * Listar todos los permisos
   */
  @Get('/permisos/todos')
  @Permissions('config.roles')
  async getPermisos() {
    return this.rolService.getPermisos();
  }
}
