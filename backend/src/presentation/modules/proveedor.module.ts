/**
 * @file proveedor.module.ts
 * @description Módulo de Proveedores (CRUD)
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

import { ProveedorService } from '../../core/application/services/proveedor.service';
import { ProveedorController } from '../http/controllers/proveedor.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [ProveedorService],
  controllers: [ProveedorController],
  exports: [ProveedorService],
})
export class ProveedorModule {}
