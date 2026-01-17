/**
 * @file cliente.module.ts
 * @description Módulo de gestión de clientes
 *
 * @references
 * - Controller: ver src/presentation/http/controllers/cliente.controller.ts
 * - Service: ver src/core/application/services/cliente.service.ts
 */

import { Module } from '@nestjs/common';
import { ClienteController } from '../http/controllers/cliente.controller';
import { ClienteService } from '../../core/application/services/cliente.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ClienteController],
  providers: [ClienteService],
  exports: [ClienteService],
})
export class ClienteModule {}
