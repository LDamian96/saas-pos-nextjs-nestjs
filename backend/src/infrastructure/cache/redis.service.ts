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
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379'),
      password: this.configService.get('REDIS_PASSWORD'),
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis: demasiados reintentos, operando sin cache');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 500, 3000);
        return delay;
      },
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Redis conectado');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      if (!error.message?.includes('WRONGPASS') || !this.client.listenerCount('error')) {
        console.warn('Redis no disponible, operando sin cache:', error.message);
      }
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });

    // Try to connect but don't block startup
    try {
      await this.client.connect();
    } catch {
      console.warn('Redis: no se pudo conectar, operando sin cache');
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.isConnected) {
        await this.client.quit();
        console.log('Redis desconectado');
      }
    } catch {
      // Ignore disconnect errors
    }
  }

  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Guardar valor en cache
   */
  async set(key: string, value: unknown, ttl = 300): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch {
      // Cache write failure is non-critical
    }
  }

  /**
   * Eliminar clave del cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch {
      // Cache delete failure is non-critical
    }
  }

  /**
   * Eliminar claves por patron
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // Cache pattern delete failure is non-critical
    }
  }

  /**
   * Verificar si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  /**
   * Obtener el cliente Redis directamente (para operaciones avanzadas)
   */
  getClient(): Redis {
    return this.client;
  }
}
