/**
 * @file compra.module.ts
 * @description Módulo de Compras/Ordenes de Compra (CRUD)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

import { CompraService } from '../../core/application/services/compra.service';
import { CompraController } from '../http/controllers/compra.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [CompraService],
  controllers: [CompraController],
  exports: [CompraService],
})
export class CompraModule {}
