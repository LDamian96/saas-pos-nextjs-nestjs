/**
 * @file empresa.controller.ts
 * @description Controlador de empresas (tenant)
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: EMPRESAS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 */

import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';

import { EmpresaService } from '../../../core/application/services/empresa.service';
import {
  UpdateEmpresaDto,
  UpdateEmpresaConfigDto,
  UpdateEmpresaBrandingDto,
  UpdateEmpresaNubefactDto,
} from '../../../core/application/dto/empresa';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';

@ApiTags('Empresas')
@Controller('empresas')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth()
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  /**
   * GET /empresas/me - Obtener mi empresa
   */
  @Get('me')
  @ApiOperation({ summary: 'Obtener datos de mi empresa' })
  @ApiResponse({ status: 200, description: 'Datos de la empresa' })
  async getMyEmpresa(@CurrentUser() user: UserPayload) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.getMyEmpresa(user.empresaId);
  }

  /**
   * PUT /empresas/me - Actualizar mi empresa
   */
  @Put('me')
  @Permissions('config.empresa')
  @ApiOperation({ summary: 'Actualizar datos de mi empresa' })
  @ApiResponse({ status: 200, description: 'Empresa actualizada' })
  async updateMyEmpresa(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateEmpresaDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.updateMyEmpresa(user.empresaId, dto);
  }

  /**
   * GET /empresas/me/config - Obtener configuracion
   */
  @Get('me/config')
  @ApiOperation({ summary: 'Obtener configuracion de mi empresa' })
  @ApiResponse({ status: 200, description: 'Configuracion de la empresa' })
  async getConfig(@CurrentUser() user: UserPayload) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.getConfig(user.empresaId);
  }

  /**
   * PUT /empresas/me/config - Actualizar configuracion
   */
  @Put('me/config')
  @Permissions('config.empresa')
  @ApiOperation({ summary: 'Actualizar configuracion de mi empresa' })
  @ApiResponse({ status: 200, description: 'Configuracion actualizada' })
  async updateConfig(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateEmpresaConfigDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.updateConfig(user.empresaId, dto);
  }

  /**
   * PUT /empresas/me/branding - Actualizar colores
   */
  @Put('me/branding')
  @Permissions('config.empresa')
  @ApiOperation({ summary: 'Actualizar branding de mi empresa' })
  @ApiResponse({ status: 200, description: 'Branding actualizado' })
  async updateBranding(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateEmpresaBrandingDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.updateBranding(user.empresaId, dto);
  }

  /**
   * GET /empresas/me/nubefact - Obtener configuracion Nubefact
   */
  @Get('me/nubefact')
  @Permissions('config.empresa')
  @ApiOperation({ summary: 'Obtener configuracion Nubefact de mi empresa' })
  @ApiResponse({ status: 200, description: 'Configuracion Nubefact (token enmascarado)' })
  async getNubefactConfig(@CurrentUser() user: UserPayload) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.getNubefactConfig(user.empresaId);
  }

  /**
   * PUT /empresas/me/nubefact - Actualizar credenciales Nubefact
   */
  @Put('me/nubefact')
  @Permissions('config.empresa')
  @ApiOperation({ summary: 'Actualizar credenciales Nubefact de mi empresa' })
  @ApiResponse({ status: 200, description: 'Configuracion Nubefact actualizada' })
  async updateNubefactConfig(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateEmpresaNubefactDto,
  ) {
    if (!user.empresaId) {
      throw new ForbiddenException('No tienes una empresa asignada');
    }
    return this.empresaService.updateNubefactConfig(user.empresaId, dto);
  }
}
