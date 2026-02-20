/**
 * @file metodo-pago.module.ts
 * @description Módulo de Métodos de Pago (CRUD + Mercado Pago)
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

import { MetodoPagoService } from '../../core/application/services/metodo-pago.service';
import { MetodoPagoController } from '../http/controllers/metodo-pago.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, ConfigModule],
  providers: [MetodoPagoService],
  controllers: [MetodoPagoController],
  exports: [MetodoPagoService],
})
export class MetodoPagoModule {}
