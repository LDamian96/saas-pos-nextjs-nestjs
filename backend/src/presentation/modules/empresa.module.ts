/**
 * @file empresa.module.ts
 * @description Modulo de empresas (tenants) y sucursales
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: empresas, sucursales)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (secciones: EMPRESAS, SUCURSALES)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Module } from '@nestjs/common';

// Infrastructure
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

// Services
import { EmpresaService } from '../../core/application/services/empresa.service';
import { SucursalService } from '../../core/application/services/sucursal.service';

// Controllers
import { EmpresaController } from '../http/controllers/empresa.controller';
import { SucursalController } from '../http/controllers/sucursal.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [EmpresaController, SucursalController],
  providers: [EmpresaService, SucursalService],
  exports: [EmpresaService, SucursalService],
})
export class EmpresaModule {}
