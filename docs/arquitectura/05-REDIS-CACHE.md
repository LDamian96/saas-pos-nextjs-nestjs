# 🚀 REDIS CACHE - ESTRATEGIA

## ⚠️ NOTA DE DESARROLLO

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Redis se usa para:                                                      │
│  ├── Cache de consultas frecuentes                                      │
│  ├── Sesiones de usuario                                                │
│  ├── Rate limiting                                                       │
│  ├── Colas de trabajo                                                   │
│  └── Datos temporales (carrito POS)                                    │
│                                                                          │
│  ⚠️ DESARROLLO: Redis en localhost:6379                                │
│  ⚠️ PRODUCCIÓN: Se configurará al final                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN

### Conexión a Redis

```typescript
// src/config/redis.config.ts

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ttl: parseInt(process.env.REDIS_TTL, 10) || 3600, // 1 hora default
};
```

### Módulo de Cache

```typescript
// src/app.module.ts

import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
          ttl: 3600, // 1 hora default
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

---

## 🎯 ESTRATEGIA DE CACHE

### Qué cachear

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ALTA PRIORIDAD (Cache largo - 1 hora+)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ├── Catálogos (categorías, marcas, atributos)                         │
│  ├── Productos con variantes                                           │
│  ├── Configuración de empresa                                          │
│  ├── Métodos de pago                                                   │
│  └── Roles y permisos                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  MEDIA PRIORIDAD (Cache medio - 5-15 min)                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ├── Lista de productos (paginado)                                     │
│  ├── Promociones activas                                               │
│  ├── Stock de productos populares                                      │
│  └── Datos de usuarios                                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  BAJA PRIORIDAD (Cache corto - 1-5 min)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ├── Búsquedas recientes                                               │
│  ├── Contadores (ventas del día)                                       │
│  └── Reportes rápidos                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NO CACHEAR                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ├── Carrito de compras (usar Redis directo, no cache)                │
│  ├── Datos de ventas en tiempo real                                    │
│  ├── Estados de caja                                                   │
│  └── Datos sensibles de usuarios                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ KEYS NAMING CONVENTION

```
Formato: {tenant}:{modulo}:{entidad}:{id}

Ejemplos:
├── empresa_abc:categorias:all              # Todas las categorías
├── empresa_abc:categorias:uuid-123         # Categoría específica
├── empresa_abc:productos:list:page_1       # Lista paginada
├── empresa_abc:productos:uuid-456          # Producto específico
├── empresa_abc:productos:uuid-456:variantes # Variantes de producto
├── empresa_abc:stock:variante_uuid         # Stock de variante
├── empresa_abc:config                       # Configuración empresa
├── empresa_abc:metodos_pago:all            # Métodos de pago
├── empresa_abc:promociones:activas         # Promociones activas
│
├── pos:carrito:usuario_uuid                # Carrito temporal
├── pos:caja:sucursal_uuid                  # Estado caja
│
├── session:usuario_uuid                     # Sesión de usuario
├── ratelimit:ip_address                    # Rate limiting
```

---

## 💻 IMPLEMENTACIÓN

### Servicio de Cache

```typescript
// src/common/services/cache.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Obtener del cache
  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  // Guardar en cache
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  // Eliminar del cache
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Eliminar por patrón (usando SCAN)
  async delByPattern(pattern: string): Promise<void> {
    // Implementar con ioredis directamente para SCAN
    const redis = (this.cacheManager as any).store.getClient();
    let cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  // Generar key con tenant
  generateKey(empresaId: string, ...parts: string[]): string {
    return `empresa_${empresaId}:${parts.join(':')}`;
  }
}
```

### Decoradores de Cache

```typescript
// src/common/decorators/cache.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);
```

### Interceptor de Cache

```typescript
// src/common/interceptors/cache.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY, CACHE_TTL } from '../decorators/cache.decorator';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Solo cachear GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Obtener configuración del decorador
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL, context.getHandler()) || 3600;

    if (!cacheKey) {
      return next.handle();
    }

    // Construir key con empresa_id del usuario
    const user = request.user;
    const fullKey = user?.empresa_id
      ? `empresa_${user.empresa_id}:${cacheKey}:${request.url}`
      : `${cacheKey}:${request.url}`;

    // Buscar en cache
    const cachedData = await this.cacheManager.get(fullKey);
    if (cachedData) {
      return of(cachedData);
    }

    // Si no hay cache, ejecutar y guardar
    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheManager.set(fullKey, data, cacheTTL);
      }),
    );
  }
}
```

---

## 📦 EJEMPLOS DE USO

### Servicio de Categorías con Cache (Prisma)

```typescript
// src/modules/categorias/categorias.service.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (tabla: categorias)

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';
import { Categoria } from '@prisma/client';

const CACHE_TTL = {
  CATEGORIAS_ALL: 3600,      // 1 hora
  CATEGORIA_SINGLE: 3600,    // 1 hora
};

@Injectable()
export class CategoriasService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findAll(empresaId: string): Promise<Categoria[]> {
    const cacheKey = `empresa_${empresaId}:categorias:all`;

    // Buscar en cache
    const cached = await this.cacheManager.get<Categoria[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Consultar BD con Prisma
    const categorias = await this.prisma.categoria.findMany({
      where: { empresaId, activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    // Guardar en cache
    await this.cacheManager.set(cacheKey, categorias, CACHE_TTL.CATEGORIAS_ALL);

    return categorias;
  }

  async findOne(id: string, empresaId: string): Promise<Categoria | null> {
    const cacheKey = `empresa_${empresaId}:categorias:${id}`;

    // Buscar en cache
    const cached = await this.cacheManager.get<Categoria>(cacheKey);
    if (cached) {
      return cached;
    }

    // Consultar BD con Prisma
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, empresaId },
    });

    if (categoria) {
      await this.cacheManager.set(cacheKey, categoria, CACHE_TTL.CATEGORIA_SINGLE);
    }

    return categoria;
  }

  async create(empresaId: string, dto: CreateCategoriaDto): Promise<Categoria> {
    const categoria = await this.prisma.categoria.create({
      data: {
        ...dto,
        empresaId,
      },
    });

    // Invalidar cache de lista
    await this.invalidateCache(empresaId);

    return categoria;
  }

  async update(id: string, empresaId: string, dto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.prisma.categoria.update({
      where: { id },
      data: dto,
    });

    // Invalidar cache
    await this.invalidateCache(empresaId, id);

    return categoria;
  }

  async remove(id: string, empresaId: string): Promise<void> {
    await this.prisma.categoria.delete({
      where: { id },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId, id);
  }

  private async invalidateCache(empresaId: string, id?: string): Promise<void> {
    // Invalidar lista
    await this.cacheManager.del(`empresa_${empresaId}:categorias:all`);

    // Invalidar específico si se proporciona
    if (id) {
      await this.cacheManager.del(`empresa_${empresaId}:categorias:${id}`);
    }
  }
}
```

### Servicio de Productos con Cache Complejo (Prisma)

```typescript
// src/modules/productos/productos.service.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)

@Injectable()
export class ProductosService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(empresaId: string, options: BuscarProductosDto): Promise<PaginatedResult<Producto>> {
    // Generar key única basada en los filtros
    const cacheKey = this.generateCacheKey(empresaId, 'productos', 'list', options);

    const cached = await this.cacheManager.get<PaginatedResult<Producto>>(cacheKey);
    if (cached) {
      return cached;
    }

    // Construir where con Prisma
    const where: any = {
      empresaId,
      activo: true,
    };

    // Aplicar filtros
    if (options.categoria_id) {
      where.categoriaId = options.categoria_id;
    }

    if (options.marca_id) {
      where.marcaId = options.marca_id;
    }

    if (options.busqueda) {
      where.OR = [
        { nombre: { contains: options.busqueda, mode: 'insensitive' } },
        { codigoInterno: { contains: options.busqueda, mode: 'insensitive' } },
      ];
    }

    // Paginación
    const page = options.page || 1;
    const limit = options.limit || 20;

    // Query con Prisma
    const [items, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        include: {
          categoria: true,
          marca: true,
          variantes: true,
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.producto.count({ where }),
    ]);

    const result: PaginatedResult<Producto> = {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache por 5 minutos (lista puede cambiar más frecuentemente)
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findByCodigoBarras(codigo: string, empresaId: string): Promise<Variante | null> {
    const cacheKey = `empresa_${empresaId}:variantes:barcode:${codigo}`;

    const cached = await this.cacheManager.get<Variante>(cacheKey);
    if (cached) {
      return cached;
    }

    const variante = await this.prisma.variante.findFirst({
      where: {
        codigoBarras: codigo,
        producto: { empresaId },
      },
      include: {
        producto: {
          include: { categoria: true },
        },
        valores: {
          include: { valorAtributo: true },
        },
      },
    });

    if (variante) {
      // Cache largo para búsquedas de código de barras (no cambian)
      await this.cacheManager.set(cacheKey, variante, 3600);
    }

    return variante;
  }

  private generateCacheKey(empresaId: string, ...parts: (string | object)[]): string {
    const keyParts = parts.map((part) =>
      typeof part === 'object' ? JSON.stringify(part) : part,
    );
    return `empresa_${empresaId}:${keyParts.join(':')}`;
  }
}
```

---

## 🛒 CARRITO POS CON REDIS

```typescript
// src/modules/pos/pos-cart.service.ts

import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface CartItem {
  variante_id: string;
  producto_id: string;
  nombre: string;
  variante_nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  descuento_total: number;
  total: number;
  updated_at: string;
}

@Injectable()
export class PosCartService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    });
  }

  private getCartKey(usuarioId: string, sucursalId: string): string {
    return `pos:carrito:${usuarioId}:${sucursalId}`;
  }

  async getCart(usuarioId: string, sucursalId: string): Promise<Cart> {
    const key = this.getCartKey(usuarioId, sucursalId);
    const data = await this.redis.get(key);

    if (data) {
      return JSON.parse(data);
    }

    return {
      items: [],
      subtotal: 0,
      descuento_total: 0,
      total: 0,
      updated_at: new Date().toISOString(),
    };
  }

  async addItem(
    usuarioId: string,
    sucursalId: string,
    item: Omit<CartItem, 'subtotal'>,
  ): Promise<Cart> {
    const cart = await this.getCart(usuarioId, sucursalId);

    // Buscar si ya existe el item
    const existingIndex = cart.items.findIndex(
      (i) => i.variante_id === item.variante_id,
    );

    if (existingIndex >= 0) {
      // Incrementar cantidad
      cart.items[existingIndex].cantidad += item.cantidad;
      cart.items[existingIndex].subtotal =
        cart.items[existingIndex].cantidad *
        cart.items[existingIndex].precio_unitario *
        (1 - cart.items[existingIndex].descuento_porcentaje / 100);
    } else {
      // Agregar nuevo
      const subtotal =
        item.cantidad * item.precio_unitario * (1 - item.descuento_porcentaje / 100);
      cart.items.push({ ...item, subtotal });
    }

    // Recalcular totales
    this.recalcularTotales(cart);

    // Guardar en Redis (expira en 24 horas)
    await this.saveCart(usuarioId, sucursalId, cart);

    return cart;
  }

  async updateItemQuantity(
    usuarioId: string,
    sucursalId: string,
    varianteId: string,
    cantidad: number,
  ): Promise<Cart> {
    const cart = await this.getCart(usuarioId, sucursalId);

    const item = cart.items.find((i) => i.variante_id === varianteId);
    if (item) {
      if (cantidad <= 0) {
        // Eliminar item
        cart.items = cart.items.filter((i) => i.variante_id !== varianteId);
      } else {
        item.cantidad = cantidad;
        item.subtotal =
          item.cantidad * item.precio_unitario * (1 - item.descuento_porcentaje / 100);
      }
    }

    this.recalcularTotales(cart);
    await this.saveCart(usuarioId, sucursalId, cart);

    return cart;
  }

  async applyDiscount(
    usuarioId: string,
    sucursalId: string,
    varianteId: string,
    descuentoPorcentaje: number,
  ): Promise<Cart> {
    const cart = await this.getCart(usuarioId, sucursalId);

    const item = cart.items.find((i) => i.variante_id === varianteId);
    if (item) {
      item.descuento_porcentaje = descuentoPorcentaje;
      item.subtotal =
        item.cantidad * item.precio_unitario * (1 - descuentoPorcentaje / 100);
    }

    this.recalcularTotales(cart);
    await this.saveCart(usuarioId, sucursalId, cart);

    return cart;
  }

  async clearCart(usuarioId: string, sucursalId: string): Promise<void> {
    const key = this.getCartKey(usuarioId, sucursalId);
    await this.redis.del(key);
  }

  private recalcularTotales(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
    cart.descuento_total = cart.items.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario * (item.descuento_porcentaje / 100),
      0,
    );
    cart.total = cart.subtotal - cart.descuento_total;
    cart.updated_at = new Date().toISOString();
  }

  private async saveCart(usuarioId: string, sucursalId: string, cart: Cart): Promise<void> {
    const key = this.getCartKey(usuarioId, sucursalId);
    await this.redis.setex(key, 86400, JSON.stringify(cart)); // 24 horas
  }
}
```

---

## 📊 MONITOREO DE CACHE

```typescript
// src/common/services/cache-stats.service.ts

@Injectable()
export class CacheStatsService {
  private redis: Redis;

  async getStats(): Promise<any> {
    const info = await this.redis.info();
    const dbSize = await this.redis.dbsize();

    return {
      keys_count: dbSize,
      memory: this.parseRedisInfo(info, 'used_memory_human'),
      hits: this.parseRedisInfo(info, 'keyspace_hits'),
      misses: this.parseRedisInfo(info, 'keyspace_misses'),
      hit_rate: this.calculateHitRate(info),
    };
  }

  private parseRedisInfo(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:(.*)`));
    return match ? match[1].trim() : 'N/A';
  }

  private calculateHitRate(info: string): string {
    const hits = parseInt(this.parseRedisInfo(info, 'keyspace_hits'), 10) || 0;
    const misses = parseInt(this.parseRedisInfo(info, 'keyspace_misses'), 10) || 0;
    const total = hits + misses;
    if (total === 0) return '0%';
    return `${((hits / total) * 100).toFixed(2)}%`;
  }
}
```

---

## 📋 TTL RECOMENDADOS

| Tipo de Dato | TTL | Justificación |
|--------------|-----|---------------|
| Catálogos (categorías, marcas) | 1 hora | Cambian poco |
| Atributos y valores | 1 hora | Cambian poco |
| Productos (lista) | 5 min | Pueden cambiar precios |
| Producto individual | 15 min | Balance actualización |
| Stock | 1 min | Cambia frecuentemente |
| Métodos de pago | 1 hora | Cambian poco |
| Promociones activas | 5 min | Pueden expirar |
| Config empresa | 1 hora | Cambia poco |
| SEO config | 1 hora | Cambia poco |
| Carrito POS | 24 horas | Sesión de trabajo |
| Sesión usuario | 7 días | Según JWT refresh |
