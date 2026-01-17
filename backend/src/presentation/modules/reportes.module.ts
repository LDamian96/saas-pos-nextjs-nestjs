/**
 * @file reportes.module.ts
 * @description Módulo de reportes
 */

import { Module } from '@nestjs/common';
import { ReportesController } from '../http/controllers/reportes.controller';
import { ReportesService } from '../../core/application/services/reportes.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
