/**
 * @file qr.controller.ts
 * @description Controller para generacion de QR de productos
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { QrService } from '../../../core/application/services/qr.service';
import { CreateQrBatchDto } from '../../../core/application/dto/qr';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('qr')
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  /**
   * GET /qr/producto/:id - Generar QR de un producto (imagen PNG)
   */
  @Get('producto/:id')
  async qrProducto(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.qrService.generarQrProducto(user.empresaId, id);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename=qr-${id}.png`);
    res.send(buffer);
  }

  /**
   * GET /qr/producto/:id/dataurl - Generar QR como base64 data URL
   */
  @Get('producto/:id/dataurl')
  async qrDataUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const dataUrl = await this.qrService.generarQrDataUrl(user.empresaId, id);
    return { success: true, data: { dataUrl } };
  }

  /**
   * POST /qr/batch - Generar QR en batch para multiples productos
   */
  @Post('batch')
  async qrBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQrBatchDto,
  ) {
    const results = await this.qrService.generarQrBatch(user.empresaId, dto.productoIds);
    return { success: true, data: results };
  }
}
