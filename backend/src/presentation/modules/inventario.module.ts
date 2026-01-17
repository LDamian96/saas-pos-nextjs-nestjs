/**
 * @file inventario.module.ts
 * @description Modulo de inventario (lotes, movimientos, alertas)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: lotes, movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { Module } from '@nestjs/common';
import { LoteController } from '../http/controllers/lote.controller';
import { MovimientoInventarioController } from '../http/controllers/movimiento-inventario.controller';
import { AlertaInventarioController } from '../http/controllers/alerta-inventario.controller';
import { InventarioController } from '../http/controllers/inventario.controller';
import { LoteService } from '../../core/application/services/lote.service';
import { MovimientoInventarioService } from '../../core/application/services/movimiento-inventario.service';
import { AlertaInventarioService } from '../../core/application/services/alerta-inventario.service';
import { InventarioService } from '../../core/application/services/inventario.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  controllers: [
    LoteController,
    MovimientoInventarioController,
    AlertaInventarioController,
    InventarioController,
  ],
  providers: [
    LoteService,
    MovimientoInventarioService,
    AlertaInventarioService,
    InventarioService,
  ],
  exports: [
    LoteService,
    MovimientoInventarioService,
    AlertaInventarioService,
    InventarioService,
  ],
})
export class InventarioModule {}
