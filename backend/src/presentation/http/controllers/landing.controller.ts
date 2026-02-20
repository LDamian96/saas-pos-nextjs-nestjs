import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LandingService } from '../../../core/application/services/landing.service';
import { CreateLandingSeccionDto, UpdateLandingSeccionDto, ReorderSeccionesDto } from '../../../core/application/dto/landing';

@Controller('landing')
@UseGuards(JwtAuthGuard)
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get('secciones')
  async getSecciones(@Req() req) {
    const empresaId = req.user.empresaId;
    const data = await this.landingService.findSecciones(empresaId);
    return { success: true, data };
  }

  @Post('secciones')
  async createSeccion(@Req() req, @Body() body: CreateLandingSeccionDto) {
    const empresaId = req.user.empresaId;
    const data = await this.landingService.createSeccion(empresaId, body);
    return { success: true, data };
  }

  @Put('secciones/reorder')
  async reorderSecciones(@Req() req, @Body() body: ReorderSeccionesDto) {
    const empresaId = req.user.empresaId;
    const data = await this.landingService.reorderSecciones(empresaId, body.ids);
    return { success: true, data };
  }

  @Put('secciones/:id')
  async updateSeccion(@Req() req, @Param('id') id: string, @Body() body: UpdateLandingSeccionDto) {
    const empresaId = req.user.empresaId;
    const data = await this.landingService.updateSeccion(empresaId, id, body);
    return { success: true, data };
  }

  @Delete('secciones/:id')
  async deleteSeccion(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresaId;
    await this.landingService.deleteSeccion(empresaId, id);
    return { success: true, message: 'Seccion eliminada' };
  }

  @Get('contactos')
  async getContactos(@Req() req, @Query() query) {
    const empresaId = req.user.empresaId;
    const result = await this.landingService.findContactos(empresaId, query);
    return { success: true, ...result };
  }

  @Put('contactos/:id/leido')
  async marcarLeido(@Req() req, @Param('id') id: string) {
    const empresaId = req.user.empresaId;
    await this.landingService.marcarLeido(empresaId, id);
    return { success: true, message: 'Marcado como leido' };
  }
}
