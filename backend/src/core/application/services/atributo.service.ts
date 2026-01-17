/**
 * @file atributo.service.ts
 * @description Servicio para gestión de atributos y valores
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: atributos, valores_atributo)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateAtributoDto, UpdateAtributoDto } from '../dto/atributo';
import { AddValorAtributoDto, UpdateValorAtributoDto } from '../dto/atributo';
import { slugify } from '../../../shared/utils/slugify.util';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'atributos';

@Injectable()
export class AtributoService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /atributos - Listar atributos de la empresa
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
    const atributos = await this.prisma.atributo.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        tipoVisual: true,
        tipoSistema: true,
        config: true,
        generaVariante: true,
        obligatorio: true,
        visibleEnFicha: true,
        visibleEnPos: true,
        orden: true,
        activo: true,
        createdAt: true,
        _count: {
          select: { valores: true, categorias: true },
        },
      },
    });

    // 4. Transformar respuesta
    const data = atributos.map((attr) => ({
      ...attr,
      valoresCount: attr._count.valores,
      categoriasCount: attr._count.categorias,
      _count: undefined,
    }));

    // 5. Guardar en cache si no hay filtros
    if (!query?.search && !query?.activo) {
      await this.redis.set(cacheKey, data, CACHE_TTL);
    }

    return { success: true, data };
  }

  /**
   * GET /atributos/:id - Obtener atributo por ID con valores
   */
  async findOne(empresaId: string, atributoId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${atributoId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
      select: {
        id: true,
        nombre: true,
        slug: true,
        tipoVisual: true,
        tipoSistema: true,
        config: true,
        generaVariante: true,
        obligatorio: true,
        visibleEnFicha: true,
        visibleEnPos: true,
        orden: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        valores: {
          select: {
            id: true,
            valor: true,
            slug: true,
            codigoColor: true,
            imagen: true,
            orden: true,
            activo: true,
          },
          orderBy: { orden: 'asc' },
        },
        categorias: {
          select: {
            id: true,
            obligatorio: true,
            categoria: {
              select: { id: true, nombre: true },
            },
          },
        },
      },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 3. Guardar en cache
    await this.redis.set(cacheKey, atributo, CACHE_TTL);

    return { success: true, data: atributo };
  }

  /**
   * POST /atributos - Crear atributo
   */
  async create(empresaId: string, dto: CreateAtributoDto) {
    // 1. Generar slug
    const slug = slugify(dto.nombre);

    // 2. Verificar slug único
    const existingSlug = await this.prisma.atributo.findFirst({
      where: { empresaId, slug },
    });

    if (existingSlug) {
      throw new ConflictException('Ya existe un atributo con este nombre');
    }

    // 3. Crear atributo con valores (transacción)
    const atributo = await this.prisma.$transaction(async (tx) => {
      // Crear atributo
      const newAtributo = await tx.atributo.create({
        data: {
          empresaId,
          nombre: dto.nombre,
          slug,
          tipoVisual: dto.tipoVisual || 'select',
          tipoSistema: dto.tipoSistema || 'dinamico',
          config: dto.config || {},
          generaVariante: dto.generaVariante !== undefined ? dto.generaVariante : true,
          obligatorio: dto.obligatorio || false,
          visibleEnFicha: dto.visibleEnFicha !== undefined ? dto.visibleEnFicha : true,
          visibleEnPos: dto.visibleEnPos !== undefined ? dto.visibleEnPos : true,
          orden: dto.orden || 0,
          activo: dto.activo !== undefined ? dto.activo : true,
        },
      });

      // Crear valores si se proporcionan
      if (dto.valores && dto.valores.length > 0) {
        for (let i = 0; i < dto.valores.length; i++) {
          const valorDto = dto.valores[i];
          const valorSlug = slugify(valorDto.valor);

          await tx.valorAtributo.create({
            data: {
              atributoId: newAtributo.id,
              valor: valorDto.valor,
              slug: valorSlug,
              codigoColor: valorDto.codigoColor,
              imagen: valorDto.imagen,
              orden: valorDto.orden !== undefined ? valorDto.orden : i,
            },
          });
        }
      }

      return newAtributo;
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: atributo,
      message: 'Atributo creado correctamente',
    };
  }

  /**
   * PUT /atributos/:id - Actualizar atributo
   */
  async update(empresaId: string, atributoId: string, dto: UpdateAtributoDto) {
    // 1. Verificar que existe
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 2. Si cambia el nombre, generar nuevo slug
    let slug = atributo.slug;
    if (dto.nombre && dto.nombre !== atributo.nombre) {
      slug = slugify(dto.nombre);

      // Verificar que el nuevo slug no exista
      const existingSlug = await this.prisma.atributo.findFirst({
        where: {
          empresaId,
          slug,
          id: { not: atributoId },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Ya existe un atributo con este nombre');
      }
    }

    // 3. Actualizar
    const updated = await this.prisma.atributo.update({
      where: { id: atributoId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre, slug }),
        ...(dto.tipoVisual !== undefined && { tipoVisual: dto.tipoVisual }),
        ...(dto.tipoSistema !== undefined && { tipoSistema: dto.tipoSistema }),
        ...(dto.config !== undefined && { config: dto.config }),
        ...(dto.generaVariante !== undefined && { generaVariante: dto.generaVariante }),
        ...(dto.obligatorio !== undefined && { obligatorio: dto.obligatorio }),
        ...(dto.visibleEnFicha !== undefined && { visibleEnFicha: dto.visibleEnFicha }),
        ...(dto.visibleEnPos !== undefined && { visibleEnPos: dto.visibleEnPos }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${atributoId}`);

    return {
      success: true,
      data: updated,
      message: 'Atributo actualizado correctamente',
    };
  }

  /**
   * DELETE /atributos/:id - Eliminar atributo
   */
  async delete(empresaId: string, atributoId: string) {
    // 1. Verificar que existe
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
      include: {
        _count: {
          select: { categorias: true },
        },
        valores: {
          include: {
            _count: {
              select: { varianteValores: true },
            },
          },
        },
      },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 2. Verificar que no esté siendo usado en variantes
    const variantesUsando = atributo.valores.reduce(
      (sum, v) => sum + v._count.varianteValores,
      0,
    );

    if (variantesUsando > 0) {
      throw new BadRequestException(
        `Este atributo está siendo usado en ${variantesUsando} variantes. Elimina las variantes primero`,
      );
    }

    // 3. Eliminar (cascade eliminará valores y categoria_atributos)
    await this.prisma.atributo.delete({
      where: { id: atributoId },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${atributoId}`);

    return {
      success: true,
      message: 'Atributo eliminado correctamente',
    };
  }

  /**
   * POST /atributos/:id/valores - Agregar valor al atributo
   */
  async addValor(empresaId: string, atributoId: string, dto: AddValorAtributoDto) {
    // 1. Verificar que el atributo existe y pertenece a la empresa
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 2. Generar slug
    const slug = slugify(dto.valor);

    // 3. Verificar slug único dentro del atributo
    const existingSlug = await this.prisma.valorAtributo.findFirst({
      where: { atributoId, slug },
    });

    if (existingSlug) {
      throw new ConflictException('Ya existe este valor en el atributo');
    }

    // 4. Crear valor
    const valor = await this.prisma.valorAtributo.create({
      data: {
        atributoId,
        valor: dto.valor,
        slug,
        codigoColor: dto.codigoColor,
        imagen: dto.imagen,
        orden: dto.orden || 0,
      },
    });

    // 5. Invalidar cache
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${atributoId}`);

    return {
      success: true,
      data: valor,
      message: 'Valor agregado correctamente',
    };
  }

  /**
   * PUT /atributos/:id/valores/:valorId - Actualizar valor
   */
  async updateValor(
    empresaId: string,
    atributoId: string,
    valorId: string,
    dto: UpdateValorAtributoDto,
  ) {
    // 1. Verificar que el atributo existe y pertenece a la empresa
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 2. Verificar que el valor existe
    const valor = await this.prisma.valorAtributo.findFirst({
      where: { id: valorId, atributoId },
    });

    if (!valor) {
      throw new NotFoundException('No encontramos este valor');
    }

    // 3. Si cambia el valor, generar nuevo slug
    let slug = valor.slug;
    if (dto.valor && dto.valor !== valor.valor) {
      slug = slugify(dto.valor);

      // Verificar slug único
      const existingSlug = await this.prisma.valorAtributo.findFirst({
        where: {
          atributoId,
          slug,
          id: { not: valorId },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Ya existe este valor en el atributo');
      }
    }

    // 4. Actualizar
    const updated = await this.prisma.valorAtributo.update({
      where: { id: valorId },
      data: {
        ...(dto.valor && { valor: dto.valor, slug }),
        ...(dto.codigoColor !== undefined && { codigoColor: dto.codigoColor }),
        ...(dto.imagen !== undefined && { imagen: dto.imagen }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    // 5. Invalidar cache
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${atributoId}`);

    return {
      success: true,
      data: updated,
      message: 'Valor actualizado correctamente',
    };
  }

  /**
   * DELETE /atributos/:id/valores/:valorId - Eliminar valor
   */
  async deleteValor(empresaId: string, atributoId: string, valorId: string) {
    // 1. Verificar que el atributo existe y pertenece a la empresa
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: atributoId, empresaId },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 2. Verificar que el valor existe
    const valor = await this.prisma.valorAtributo.findFirst({
      where: { id: valorId, atributoId },
      include: {
        _count: {
          select: { varianteValores: true },
        },
      },
    });

    if (!valor) {
      throw new NotFoundException('No encontramos este valor');
    }

    // 3. Verificar que no esté siendo usado en variantes
    if (valor._count.varianteValores > 0) {
      throw new BadRequestException(
        `Este valor está siendo usado en ${valor._count.varianteValores} variantes`,
      );
    }

    // 4. Eliminar
    await this.prisma.valorAtributo.delete({
      where: { id: valorId },
    });

    // 5. Invalidar cache
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${atributoId}`);

    return {
      success: true,
      message: 'Valor eliminado correctamente',
    };
  }

  /**
   * Invalidar cache de atributos
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }
}
