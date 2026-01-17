/**
 * @file prisma.service.ts
 * @description Servicio de Prisma para conexion a base de datos
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma conectado a PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma desconectado');
  }

  /**
   * Limpia la base de datos (solo para testing)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase solo disponible en entorno de test');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      const keyStr = String(key);
      return !keyStr.startsWith('_') && !keyStr.startsWith('$');
    });

    return Promise.all(
      models.map((modelKey) => {
        // @ts-ignore
        if (this[modelKey]?.deleteMany) {
          // @ts-ignore
          return this[modelKey].deleteMany();
        }
      }),
    );
  }
}
