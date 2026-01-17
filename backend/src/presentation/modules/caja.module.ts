/**
 * @file caja.module.ts
 * @description Módulo de gestión de cajas
 *
 * @references
 * - Controller: ver src/presentation/http/controllers/caja.controller.ts
 * - Service: ver src/core/application/services/caja.service.ts
 */

import { Module } from '@nestjs/common';
import { CajaController } from '../http/controllers/caja.controller';
import { CajaService } from '../../core/application/services/caja.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
