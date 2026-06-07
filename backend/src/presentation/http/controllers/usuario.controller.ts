/**
 * @file usuario.controller.ts
 * @description Controlador HTTP para gestión de usuarios
 *
 * @references
 * - Service: ver src/core/application/services/usuario.service.ts
 * - DTOs: ver src/core/application/dto/usuario/
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: USUARIOS)
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
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UsuarioService } from '../../../core/application/services/usuario.service';
import { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from '../../../core/application/dto/usuario';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

import { NormalizeSucursalIdPipe } from '../pipes/normalize-sucursal-id.pipe';
interface UserWithEmpresa {
  id: string;
  empresaId: string;
  rol: { codigo: string };
}

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  /**
   * GET /usuarios
   * Listar usuarios de la empresa
   */
  @Get()
  @Permissions('config.usuarios')
  async findAll(
    @CurrentUser() user: UserWithEmpresa,
    @Query('activo') activo?: string,
    @Query('rolId') rolId?: string,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usuarioService.findAll(user.empresaId, {
      activo: activo !== undefined ? activo === 'true' : undefined,
      rolId,
      sucursalId,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /usuarios/:id
   * Obtener usuario por ID
   */
  @Get(':id')
  @Permissions('config.usuarios')
  async findOne(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usuarioService.findOne(user.empresaId, id);
  }

  /**
   * POST /usuarios
   * Crear nuevo usuario
   */
  @Post()
  @Permissions('config.usuarios')
  async create(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: CreateUsuarioDto,
  ) {
    return this.usuarioService.create(user.empresaId, dto, user.id);
  }

  /**
   * PUT /usuarios/:id
   * Actualizar usuario
   */
  @Put(':id')
  @Permissions('config.usuarios')
  async update(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuarioService.update(user.empresaId, id, dto);
  }

  /**
   * DELETE /usuarios/:id
   * Eliminar usuario (soft delete)
   */
  @Delete(':id')
  @Permissions('config.usuarios')
  async delete(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usuarioService.delete(user.empresaId, id, user.id);
  }

  /**
   * PUT /usuarios/:id/password
   * Cambiar contraseña de usuario
   */
  @Put(':id/password')
  @Permissions('config.usuarios')
  async changePassword(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const isAdmin = user.rol.codigo === 'admin';
    return this.usuarioService.changePassword(user.empresaId, id, dto, user.id, isAdmin);
  }
}
