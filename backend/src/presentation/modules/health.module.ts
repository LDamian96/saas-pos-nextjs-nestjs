/**
 * @file health.module.ts
 * @description Modulo de health check para verificar estado del servidor
 */

import { Module } from '@nestjs/common';
import { HealthController } from '../http/controllers/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
