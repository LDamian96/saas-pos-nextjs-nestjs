/**
 * @file pago-proveedor.module.ts
 * @description Módulo de Pagos a Proveedores
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

import { PagoProveedorService } from '../../core/application/services/pago-proveedor.service';
import { PagoProveedorController } from '../http/controllers/pago-proveedor.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [PagoProveedorService],
  controllers: [PagoProveedorController],
  exports: [PagoProveedorService],
})
export class PagoProveedorModule {}
