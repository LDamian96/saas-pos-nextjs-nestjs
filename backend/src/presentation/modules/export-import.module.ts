/**
 * @file export-import.module.ts
 * @description Modulo para import/export de productos en Excel
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { ExportImportService } from '../../core/application/services/export-import.service';
import { ExportImportController } from '../http/controllers/export-import.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExportImportController],
  providers: [ExportImportService],
  exports: [ExportImportService],
})
export class ExportImportModule {}
