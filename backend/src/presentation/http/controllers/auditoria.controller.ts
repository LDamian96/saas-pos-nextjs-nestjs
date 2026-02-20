/**
 * @file auditoria.controller.ts
 * @description Controller para consulta de auditoria
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuditoriaService } from '../../../core/application/services/auditoria.service';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  /**
   * GET /auditoria - Listar acciones
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('modulo') modulo?: string,
    @Query('accion') accion?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditoriaService.findAll(user.empresaId, {
      modulo,
      accion,
      usuarioId,
      fechaDesde,
      fechaHasta,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * GET /auditoria/roles - Auditoria de roles
   */
  @Get('roles')
  async findRolesLog(
    @CurrentUser() user: JwtPayload,
    @Query('usuarioId') usuarioId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditoriaService.findRolesLog(user.empresaId, {
      usuarioId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * GET /auditoria/resumen - Resumen de actividad
   */
  @Get('resumen')
  async getResumen(@CurrentUser() user: JwtPayload) {
    return this.auditoriaService.getResumen(user.empresaId);
  }
}
