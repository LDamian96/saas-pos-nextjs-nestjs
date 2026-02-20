/**
 * @file promocion.module.ts
 * @description Módulo de Promociones (CRUD + cálculo automático)
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

import { PromocionService } from '../../core/application/services/promocion.service';
import { PromocionController } from '../http/controllers/promocion.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [PromocionService],
  controllers: [PromocionController],
  exports: [PromocionService],
})
export class PromocionModule {}
