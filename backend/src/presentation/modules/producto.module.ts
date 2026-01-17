/**
 * @file producto.module.ts
 * @description Modulo de productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 */

import { Module } from '@nestjs/common';
import { ProductoController } from '../http/controllers/producto.controller';
import { VarianteController } from '../http/controllers/variante.controller';
import { ProductoService } from '../../core/application/services/producto.service';
import { VarianteService } from '../../core/application/services/variante.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [ProductoController, VarianteController],
  providers: [ProductoService, VarianteService],
  exports: [ProductoService, VarianteService],
})
export class ProductoModule {}
