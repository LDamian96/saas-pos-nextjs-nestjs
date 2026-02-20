/**
 * @file pdf.module.ts
 * @description Modulo para generacion de PDFs
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { PdfService } from '../../core/application/services/pdf.service';
import { PdfController } from '../http/controllers/pdf.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
