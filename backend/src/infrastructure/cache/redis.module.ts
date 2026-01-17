/**
 * @file redis.module.ts
 * @description Modulo de Redis para cache
 *
 * @references
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
