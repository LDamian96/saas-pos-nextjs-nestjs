/**
 * @file pago-proveedor.controller.ts
 * @description Controller para gestión de pagos a proveedores
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PagoProveedorService } from '../../../core/application/services/pago-proveedor.service';
import { CreatePagoProveedorDto } from '../../../core/application/dto/pago-proveedor';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('pagos-proveedor')
@UseGuards(JwtAuthGuard)
export class PagoProveedorController {
  constructor(private readonly pagoProveedorService: PagoProveedorService) {}

  /**
   * GET /pagos-proveedor - Listar pagos
   */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('proveedorId') proveedorId?: string,
    @Query('compraId') compraId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.pagoProveedorService.findAll(user.empresaId, {
      proveedorId,
      compraId,
      fechaDesde,
      fechaHasta,
    });
  }

  /**
   * GET /pagos-proveedor/resumen - Resumen
   */
  @Get('resumen')
  async getResumen(@CurrentUser() user: JwtPayload) {
    return this.pagoProveedorService.getResumen(user.empresaId);
  }

  /**
   * GET /pagos-proveedor/:id - Obtener pago
   */
  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pagoProveedorService.findOne(user.empresaId, id);
  }

  /**
   * POST /pagos-proveedor - Registrar pago
   */
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePagoProveedorDto,
  ) {
    return this.pagoProveedorService.create(user.empresaId, user.sub, dto);
  }

  /**
   * DELETE /pagos-proveedor/:id - Anular pago
   */
  @Delete(':id')
  async anular(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pagoProveedorService.anular(user.empresaId, id);
  }
}
