/**
 * @file venta.module.ts
 * @description Modulo de ventas (POS)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: VENTAS)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { Module } from '@nestjs/common';
import { VentaController } from '../http/controllers/venta.controller';
import { VentaService } from '../../core/application/services/venta.service';
import { LoteService } from '../../core/application/services/lote.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [VentaController],
  providers: [VentaService, LoteService],
  exports: [VentaService],
})
export class VentaModule {}
