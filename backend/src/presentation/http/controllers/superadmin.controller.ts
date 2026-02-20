import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminService } from '../../../core/application/services/superadmin.service';
import { ToggleEmpresaDto, CreateEmpresaManualDto } from '../../../core/application/dto/superadmin';

@Controller('superadmin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.superAdminService.getDashboard();
    return { success: true, data };
  }

  @Get('planes')
  async getPlanes() {
    const data = await this.superAdminService.getPlanes();
    return { success: true, data };
  }

  @Get('empresas')
  async getEmpresas(@Query() query) {
    const result = await this.superAdminService.getEmpresas(query);
    return { success: true, ...result };
  }

  @Post('empresas')
  async createEmpresa(@Body() dto: CreateEmpresaManualDto) {
    const data = await this.superAdminService.createEmpresaManual(dto);
    return { success: true, data };
  }

  @Get('empresas/:id')
  async getEmpresaDetalle(@Param('id') id: string) {
    const data = await this.superAdminService.getEmpresaDetalle(id);
    return { success: true, data };
  }

  @Put('empresas/:id/toggle')
  async toggleEmpresa(@Param('id') id: string, @Body() body: ToggleEmpresaDto) {
    const data = await this.superAdminService.toggleEmpresa(id, body.activo);
    return { success: true, data };
  }
}
