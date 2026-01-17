/**
 * @file marca.service.ts
 * @description Servicio para gestión de marcas
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: marcas)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: MARCAS)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateMarcaDto, UpdateMarcaDto } from '../dto/marca';
import { slugify } from '../../../shared/utils/slugify.util';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'marcas';

@Injectable()
export class MarcaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /marcas - Listar marcas de la empresa
   */
  async findAll(empresaId: string, query?: { activo?: boolean; search?: string }) {
    // 1. Buscar en cache (solo si no hay filtros)
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    if (!query?.search) {
      const cached = await this.redis.get(cacheKey);
      if (cached && !query?.activo) {
        return { success: true, data: cached };
      }
    }

    // 2. Construir filtros
    const where: any = { empresaId };
    if (query?.activo !== undefined) {
      where.activo = query.activo;
    }
    if (query?.search) {
      where.nombre = { contains: query.search, mode: 'insensitive' };
    }

    // 3. Buscar en BD
    const marcas = await this.prisma.marca.findMany({
      where,
      orderBy: [{ destacada: 'desc' }, { orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        logo: true,
        sitioWeb: true,
        descripcion: true,
        orden: true,
        destacada: true,
        activo: true,
        metaTitulo: true,
        metaDescripcion: true,
        createdAt: true,
        _count: {
          select: { productos: true },
        },
      },
    });

    // 4. Transformar respuesta
    const data = marcas.map((marca) => ({
      ...marca,
      productosCount: marca._count.productos,
      _count: undefined,
    }));

    // 5. Guardar en cache si no hay filtros
    if (!query?.search && !query?.activo) {
      await this.redis.set(cacheKey, data, CACHE_TTL);
    }

    return { success: true, data };
  }

  /**
   * GET /marcas/:id - Obtener marca por ID
   */
  async findOne(empresaId: string, marcaId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${marcaId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const marca = await this.prisma.marca.findFirst({
      where: { id: marcaId, empresaId },
      select: {
        id: true,
        nombre: true,
        slug: true,
        logo: true,
        sitioWeb: true,
        descripcion: true,
        orden: true,
        destacada: true,
        activo: true,
        metaTitulo: true,
        metaDescripcion: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { productos: true },
        },
      },
    });

    if (!marca) {
      throw new NotFoundException('No encontramos esta marca');
    }

    // 3. Transformar respuesta
    const data = {
      ...marca,
      productosCount: marca._count.productos,
      _count: undefined,
    };

    // 4. Guardar en cache
    await this.redis.set(cacheKey, data, CACHE_TTL);

    return { success: true, data };
  }

  /**
   * POST /marcas - Crear marca
   */
  async create(empresaId: string, dto: CreateMarcaDto) {
    // 1. Generar slug
    const slug = slugify(dto.nombre);

    // 2. Verificar slug único
    const existingSlug = await this.prisma.marca.findFirst({
      where: { empresaId, slug },
    });

    if (existingSlug) {
      throw new ConflictException('Ya existe una marca con este nombre');
    }

    // 3. Crear marca
    const marca = await this.prisma.marca.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        slug,
        logo: dto.logo,
        sitioWeb: dto.sitioWeb,
        descripcion: dto.descripcion,
        orden: dto.orden || 0,
        destacada: dto.destacada || false,
        activo: dto.activo !== undefined ? dto.activo : true,
        metaTitulo: dto.metaTitulo,
        metaDescripcion: dto.metaDescripcion,
      },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: marca,
      message: 'Marca creada correctamente',
    };
  }

  /**
   * PUT /marcas/:id - Actualizar marca
   */
  async update(empresaId: string, marcaId: string, dto: UpdateMarcaDto) {
    // 1. Verificar que existe
    const marca = await this.prisma.marca.findFirst({
      where: { id: marcaId, empresaId },
    });

    if (!marca) {
      throw new NotFoundException('No encontramos esta marca');
    }

    // 2. Si cambia el nombre, generar nuevo slug
    let slug = marca.slug;
    if (dto.nombre && dto.nombre !== marca.nombre) {
      slug = slugify(dto.nombre);

      // Verificar que el nuevo slug no exista
      const existingSlug = await this.prisma.marca.findFirst({
        where: {
          empresaId,
          slug,
          id: { not: marcaId },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Ya existe una marca con este nombre');
      }
    }

    // 3. Actualizar
    const updated = await this.prisma.marca.update({
      where: { id: marcaId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre, slug }),
        ...(dto.logo !== undefined && { logo: dto.logo }),
        ...(dto.sitioWeb !== undefined && { sitioWeb: dto.sitioWeb }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.destacada !== undefined && { destacada: dto.destacada }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.metaTitulo !== undefined && { metaTitulo: dto.metaTitulo }),
        ...(dto.metaDescripcion !== undefined && { metaDescripcion: dto.metaDescripcion }),
      },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${marcaId}`);

    return {
      success: true,
      data: updated,
      message: 'Marca actualizada correctamente',
    };
  }

  /**
   * DELETE /marcas/:id - Eliminar marca
   */
  async delete(empresaId: string, marcaId: string) {
    // 1. Verificar que existe
    const marca = await this.prisma.marca.findFirst({
      where: { id: marcaId, empresaId },
      include: {
        _count: {
          select: { productos: true },
        },
      },
    });

    if (!marca) {
      throw new NotFoundException('No encontramos esta marca');
    }

    // 2. Verificar que no tenga productos
    if (marca._count.productos > 0) {
      throw new ConflictException(
        `Esta marca tiene ${marca._count.productos} productos. Quita la marca de esos productos primero`,
      );
    }

    // 3. Eliminar
    await this.prisma.marca.delete({
      where: { id: marcaId },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${marcaId}`);

    return {
      success: true,
      message: 'Marca eliminada correctamente',
    };
  }

  /**
   * Invalidar cache de marcas
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }
}
