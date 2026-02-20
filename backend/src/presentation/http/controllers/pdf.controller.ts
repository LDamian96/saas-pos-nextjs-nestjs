/**
 * @file pdf.controller.ts
 * @description Controller para generacion de PDFs
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PdfService } from '../../../core/application/services/pdf.service';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  /**
   * GET /pdf/venta/:id - Generar ticket de venta
   */
  @Get('venta/:id')
  async ticketVenta(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generarTicketVenta(user.empresaId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${id}.pdf`);
    res.send(buffer);
  }

  /**
   * GET /pdf/compra/:id - Generar reporte de compra
   */
  @Get('compra/:id')
  async reporteCompra(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.pdfService.generarReporteCompra(user.empresaId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=compra-${id}.pdf`);
    res.send(buffer);
  }
}
