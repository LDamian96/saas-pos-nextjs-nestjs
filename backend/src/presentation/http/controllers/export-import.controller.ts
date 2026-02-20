/**
 * @file export-import.controller.ts
 * @description Controller para importar/exportar productos en Excel
 */

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ExportImportService } from '../../../core/application/services/export-import.service';

interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string;
  rolId: string;
}

@Controller('excel')
@UseGuards(JwtAuthGuard)
export class ExportImportController {
  constructor(private readonly exportImportService: ExportImportService) {}

  /**
   * GET /productos/exportar - Exportar productos a Excel
   */
  @Get('exportar')
  async exportar(
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.exportImportService.exportProductos(user.empresaId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
    res.send(buffer);
  }

  /**
   * GET /productos/plantilla - Descargar plantilla Excel vacia
   */
  @Get('plantilla')
  async plantilla(@Res() res: Response) {
    const buffer = await this.exportImportService.exportPlantilla();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla-productos.xlsx');
    res.send(buffer);
  }

  /**
   * POST /productos/importar - Importar productos desde Excel
   */
  @Post('importar')
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { success: false, message: 'No se recibio archivo' };
    }
    const result = await this.exportImportService.importProductos(user.empresaId, file.buffer, user.sub);
    return {
      success: true,
      data: result,
      message: `Importacion completada: ${result.importados} nuevos, ${result.actualizados} actualizados`,
    };
  }
}
