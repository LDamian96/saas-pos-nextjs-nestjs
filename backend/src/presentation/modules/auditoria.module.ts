/**
 * @file auditoria.module.ts
 * @description Módulo de Auditoria
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { AuthModule } from './auth.module';

import { AuditoriaService } from '../../core/application/services/auditoria.service';
import { AuditoriaController } from '../http/controllers/auditoria.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AuditoriaService],
  controllers: [AuditoriaController],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
