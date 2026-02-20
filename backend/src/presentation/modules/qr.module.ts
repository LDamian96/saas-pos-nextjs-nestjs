/**
 * @file qr.module.ts
 * @description Modulo para generacion de QR de productos
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { QrService } from '../../core/application/services/qr.service';
import { QrController } from '../http/controllers/qr.controller';

@Module({
  imports: [PrismaModule],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
