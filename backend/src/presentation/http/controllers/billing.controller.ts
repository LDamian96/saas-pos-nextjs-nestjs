import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { BillingService } from '../../../core/application/services/billing.service';
import { CreatePlanDto, UpdatePlanDto, CreateSuscripcionDto } from '../../../core/application/dto/billing';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // === PLANES (publico para ver, admin para CRUD) ===
  @Get('planes')
  async getPlanes() {
    const data = await this.billingService.findPlanes();
    return { success: true, data };
  }

  @Get('planes/admin')
  async getAllPlanes() {
    const data = await this.billingService.findAllPlanes();
    return { success: true, data };
  }

  @Post('planes')
  async createPlan(@Body() body: CreatePlanDto) {
    const data = await this.billingService.createPlan(body);
    return { success: true, data };
  }

  @Put('planes/:id')
  async updatePlan(@Param('id') id: string, @Body() body: UpdatePlanDto) {
    const data = await this.billingService.updatePlan(id, body);
    return { success: true, data };
  }

  @Delete('planes/:id')
  async deletePlan(@Param('id') id: string) {
    await this.billingService.deletePlan(id);
    return { success: true, message: 'Plan eliminado' };
  }

  // === SUSCRIPCION (del tenant actual) ===
  @Get('mi-suscripcion')
  async getMiSuscripcion(@Req() req) {
    const empresaId = req.user.empresaId;
    const data = await this.billingService.findSuscripcion(empresaId);
    return { success: true, data };
  }

  @Post('suscribir')
  async suscribir(@Req() req, @Body() body: CreateSuscripcionDto) {
    const empresaId = req.user.empresaId;
    const data = await this.billingService.createSuscripcion(empresaId, body);
    return { success: true, data };
  }

  @Post('cancelar')
  async cancelar(@Req() req) {
    const empresaId = req.user.empresaId;
    await this.billingService.cancelarSuscripcion(empresaId);
    return { success: true, message: 'Suscripcion cancelada' };
  }

  // === ADMIN ===
  @Get('suscripciones')
  async getAllSuscripciones(@Query() query) {
    const result = await this.billingService.findAllSuscripciones(query);
    return { success: true, ...result };
  }

  @Get('resumen')
  async getResumen() {
    const data = await this.billingService.getResumenBilling();
    return { success: true, data };
  }
}
