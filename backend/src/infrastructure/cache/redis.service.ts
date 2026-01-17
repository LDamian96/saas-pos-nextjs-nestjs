/**
 * @file redis.service.ts
 * @description Servicio de Redis para cache y sesiones
 *
 * @references
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('Redis conectado');
    });

    this.client.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    console.log('Redis desconectado');
  }

  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  /**
   * Guardar valor en cache
   * @param key Clave
   * @param value Valor
   * @param ttl Tiempo de vida en segundos (default: 5 minutos)
   */
  async set(key: string, value: unknown, ttl = 300): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  /**
   * Eliminar clave del cache
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Eliminar claves por patron
   * Ejemplo: invalidar todo el cache de productos de una empresa
   * await redis.delPattern('empresa:123:productos:*');
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Obtener el cliente Redis directamente (para operaciones avanzadas)
   */
  getClient(): Redis {
    return this.client;
  }
}
