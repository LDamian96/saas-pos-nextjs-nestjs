/**
 * @file cliente.controller.ts
 * @description Controller para gestión de clientes
 *
 * @references
 * - Service: ver src/core/application/services/cliente.service.ts
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
import { ClienteService } from '../../../core/application/services/cliente.service';
import { CreateClienteDto } from '../../../core/application/dto/cliente/create-cliente.dto';
import { UpdateClienteDto } from '../../../core/application/dto/cliente/update-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  /**
   * GET /clientes
   * Listar clientes con filtros
   */
  @Get()
  @Permissions('clientes.ver')
  async findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('tipoDocumento') tipoDocumento?: string,
    @Query('tipoCliente') tipoCliente?: string,
    @Query('activo') activo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('orden') orden?: string,
    @Query('direccion') direccion?: 'asc' | 'desc',
  ) {
    return this.clienteService.findAll(req.user.empresaId, {
      search,
      tipoDocumento,
      tipoCliente,
      activo: activo !== undefined ? activo === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      orden,
      direccion,
    });
  }

  /**
   * GET /clientes/estadisticas
   * Obtener estadísticas de clientes
   */
  @Get('estadisticas')
  @Permissions('clientes.ver')
  async getEstadisticas(@Request() req: any) {
    return this.clienteService.getEstadisticas(req.user.empresaId);
  }

  /**
   * GET /clientes/documento/:documento
   * Buscar cliente por documento
   */
  @Get('documento/:documento')
  @Permissions('clientes.ver')
  async findByDocumento(
    @Request() req: any,
    @Param('documento') documento: string,
  ) {
    const cliente = await this.clienteService.findByDocumento(
      req.user.empresaId,
      documento,
    );

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  /**
   * GET /clientes/:id
   * Obtener cliente por ID
   */
  @Get(':id')
  @Permissions('clientes.ver')
  async findById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const cliente = await this.clienteService.findById(req.user.empresaId, id);

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  /**
   * POST /clientes
   * Crear cliente
   */
  @Post()
  @Permissions('clientes.crear')
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() dto: CreateClienteDto) {
    return this.clienteService.create(req.user.empresaId, dto);
  }

  /**
   * PATCH /clientes/:id
   * Actualizar cliente
   */
  @Patch(':id')
  @Permissions('clientes.editar')
  async update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clienteService.update(req.user.empresaId, id, dto);
  }

  /**
   * DELETE /clientes/:id
   * Eliminar cliente (soft delete)
   */
  @Delete(':id')
  @Permissions('clientes.eliminar')
  async delete(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clienteService.delete(req.user.empresaId, id);
  }
}
