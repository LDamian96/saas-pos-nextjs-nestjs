/**
 * @file categoria.service.ts
 * @description Servicio para gestión de categorías
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
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
import {
  CreateCategoriaDto,
  UpdateCategoriaDto,
  VincularAtributoDto,
  VincularAtributosDto,
  UpdateVinculoAtributoDto,
} from '../dto/categoria';
import { slugify } from '../../../shared/utils/slugify.util';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'categorias';

@Injectable()
export class CategoriaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /categorias - Listar categorías de la empresa
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
      // Normalizar búsqueda para soportar acentos (ej: "electro" matchea "Electrónicos")
      const normalizedSearch = query.search
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: normalizedSearch, mode: 'insensitive' } },
      ];
    }

    // 3. Buscar en BD
    const categorias = await this.prisma.categoria.findMany({
      where,
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        imagen: true,
        categoriaPadreId: true,
        orden: true,
        activo: true,
        visiblePos: true,
        visibleWeb: true,
        metaTitulo: true,
        metaDescripcion: true,
        createdAt: true,
        categoriaPadre: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { productos: true, categoriasHijos: true },
        },
      },
    });

    // 4. Transformar respuesta
    const data = categorias.map((cat) => ({
      ...cat,
      productosCount: cat._count.productos,
      subcategoriasCount: cat._count.categoriasHijos,
      _count: undefined,
    }));

    // 5. Guardar en cache si no hay filtros
    if (!query?.search && !query?.activo) {
      await this.redis.set(cacheKey, data, CACHE_TTL);
    }

    return { success: true, data };
  }

  /**
   * GET /categorias/:id - Obtener categoría por ID
   */
  async findOne(empresaId: string, categoriaId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${categoriaId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        imagen: true,
        categoriaPadreId: true,
        orden: true,
        activo: true,
        visiblePos: true,
        visibleWeb: true,
        metaTitulo: true,
        metaDescripcion: true,
        createdAt: true,
        updatedAt: true,
        categoriaPadre: {
          select: { id: true, nombre: true },
        },
        categoriasHijos: {
          select: { id: true, nombre: true, slug: true, activo: true },
          orderBy: { orden: 'asc' },
        },
        atributos: {
          select: {
            id: true,
            obligatorio: true,
            orden: true,
            atributo: {
              select: { id: true, nombre: true, tipoVisual: true },
            },
          },
          orderBy: { orden: 'asc' },
        },
        _count: {
          select: { productos: true },
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 3. Transformar respuesta
    const data = {
      ...categoria,
      productosCount: categoria._count.productos,
      _count: undefined,
    };

    // 4. Guardar en cache
    await this.redis.set(cacheKey, data, CACHE_TTL);

    return { success: true, data };
  }

  /**
   * POST /categorias - Crear categoría
   */
  async create(empresaId: string, dto: CreateCategoriaDto) {
    // 1. Generar slug
    const slug = slugify(dto.nombre);

    // 2. Verificar slug único
    const existingSlug = await this.prisma.categoria.findFirst({
      where: { empresaId, slug },
    });

    if (existingSlug) {
      throw new ConflictException('Ya existe una categoría con este nombre');
    }

    // 3. Verificar categoría padre si se proporciona
    if (dto.categoriaPadreId) {
      const padre = await this.prisma.categoria.findFirst({
        where: { id: dto.categoriaPadreId, empresaId },
      });
      if (!padre) {
        throw new BadRequestException('La categoría padre no existe');
      }
    }

    // 4. Crear categoría
    const categoria = await this.prisma.categoria.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        slug,
        descripcion: dto.descripcion,
        imagen: dto.imagen,
        categoriaPadreId: dto.categoriaPadreId,
        orden: dto.orden || 0,
        activo: dto.activo !== undefined ? dto.activo : true,
        visiblePos: dto.visiblePos !== undefined ? dto.visiblePos : true,
        visibleWeb: dto.visibleWeb !== undefined ? dto.visibleWeb : true,
        metaTitulo: dto.metaTitulo,
        metaDescripcion: dto.metaDescripcion,
      },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: categoria,
      message: 'Categoría creada correctamente',
    };
  }

  /**
   * PUT /categorias/:id - Actualizar categoría
   */
  async update(empresaId: string, categoriaId: string, dto: UpdateCategoriaDto) {
    // 1. Verificar que existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Si cambia el nombre, generar nuevo slug
    let slug = categoria.slug;
    if (dto.nombre && dto.nombre !== categoria.nombre) {
      slug = slugify(dto.nombre);

      // Verificar que el nuevo slug no exista
      const existingSlug = await this.prisma.categoria.findFirst({
        where: {
          empresaId,
          slug,
          id: { not: categoriaId },
        },
      });

      if (existingSlug) {
        throw new ConflictException('Ya existe una categoría con este nombre');
      }
    }

    // 3. Verificar categoría padre si se proporciona
    if (dto.categoriaPadreId) {
      // No puede ser padre de sí misma
      if (dto.categoriaPadreId === categoriaId) {
        throw new BadRequestException('Una categoría no puede ser su propia padre');
      }

      const padre = await this.prisma.categoria.findFirst({
        where: { id: dto.categoriaPadreId, empresaId },
      });
      if (!padre) {
        throw new BadRequestException('La categoría padre no existe');
      }
    }

    // 4. Actualizar
    const updated = await this.prisma.categoria.update({
      where: { id: categoriaId },
      data: {
        ...(dto.nombre && { nombre: dto.nombre, slug }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.imagen !== undefined && { imagen: dto.imagen }),
        ...(dto.categoriaPadreId !== undefined && { categoriaPadreId: dto.categoriaPadreId }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
        ...(dto.visiblePos !== undefined && { visiblePos: dto.visiblePos }),
        ...(dto.visibleWeb !== undefined && { visibleWeb: dto.visibleWeb }),
        ...(dto.metaTitulo !== undefined && { metaTitulo: dto.metaTitulo }),
        ...(dto.metaDescripcion !== undefined && { metaDescripcion: dto.metaDescripcion }),
      },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      data: updated,
      message: 'Categoría actualizada correctamente',
    };
  }

  /**
   * DELETE /categorias/:id - Eliminar categoría
   */
  async delete(empresaId: string, categoriaId: string) {
    // 1. Verificar que existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
      include: {
        _count: {
          select: { productos: true, categoriasHijos: true },
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Verificar que no tenga productos
    if (categoria._count.productos > 0) {
      throw new BadRequestException(
        `Esta categoría tiene ${categoria._count.productos} productos. Muévelos a otra categoría primero`,
      );
    }

    // 3. Verificar que no tenga subcategorías
    if (categoria._count.categoriasHijos > 0) {
      throw new BadRequestException(
        `Esta categoría tiene ${categoria._count.categoriasHijos} subcategorías. Elimínalas primero`,
      );
    }

    // 4. Eliminar
    await this.prisma.categoria.delete({
      where: { id: categoriaId },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      message: 'Categoría eliminada correctamente',
    };
  }

  /**
   * Invalidar cache de categorías
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }

  // =====================================================
  // GESTIÓN DE ATRIBUTOS VINCULADOS
  // =====================================================

  /**
   * GET /categorias/:id/atributos - Listar atributos vinculados
   */
  async getAtributos(empresaId: string, categoriaId: string) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Buscar atributos vinculados
    const vinculos = await this.prisma.categoriaAtributo.findMany({
      where: { categoriaId },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        obligatorio: true,
        orden: true,
        createdAt: true,
        atributo: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            tipoVisual: true,
            tipoSistema: true,
            generaVariante: true,
            activo: true,
            valores: {
              select: { id: true, valor: true, slug: true, codigoColor: true, orden: true },
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: vinculos,
    };
  }

  /**
   * POST /categorias/:id/atributos - Vincular un atributo
   */
  async vincularAtributo(empresaId: string, categoriaId: string, dto: VincularAtributoDto) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Verificar que el atributo existe y pertenece a la empresa
    const atributo = await this.prisma.atributo.findFirst({
      where: { id: dto.atributoId, empresaId },
    });

    if (!atributo) {
      throw new NotFoundException('No encontramos este atributo');
    }

    // 3. Verificar que no exista ya el vínculo
    const existente = await this.prisma.categoriaAtributo.findFirst({
      where: { categoriaId, atributoId: dto.atributoId },
    });

    if (existente) {
      throw new ConflictException('Este atributo ya está vinculado a la categoría');
    }

    // 4. Crear vínculo
    const vinculo = await this.prisma.categoriaAtributo.create({
      data: {
        categoriaId,
        atributoId: dto.atributoId,
        obligatorio: dto.obligatorio ?? false,
        orden: dto.orden ?? 0,
      },
      include: {
        atributo: {
          select: { id: true, nombre: true, tipoVisual: true },
        },
      },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      data: vinculo,
      message: `Atributo "${atributo.nombre}" vinculado correctamente`,
    };
  }

  /**
   * POST /categorias/:id/atributos/batch - Vincular múltiples atributos
   */
  async vincularAtributos(empresaId: string, categoriaId: string, dto: VincularAtributosDto) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Verificar todos los atributos
    const atributoIds = dto.atributos.map((a) => a.atributoId);
    const atributos = await this.prisma.atributo.findMany({
      where: { id: { in: atributoIds }, empresaId },
    });

    if (atributos.length !== atributoIds.length) {
      throw new BadRequestException('Algunos atributos no existen o no pertenecen a tu empresa');
    }

    // 3. Obtener vínculos existentes
    const existentes = await this.prisma.categoriaAtributo.findMany({
      where: { categoriaId, atributoId: { in: atributoIds } },
      select: { atributoId: true },
    });
    const existentesIds = existentes.map((e) => e.atributoId);

    // 4. Filtrar solo los nuevos
    const nuevos = dto.atributos.filter((a) => !existentesIds.includes(a.atributoId));

    if (nuevos.length === 0) {
      return {
        success: true,
        data: [],
        message: 'Todos los atributos ya estaban vinculados',
      };
    }

    // 5. Crear vínculos
    await this.prisma.categoriaAtributo.createMany({
      data: nuevos.map((a) => ({
        categoriaId,
        atributoId: a.atributoId,
        obligatorio: a.obligatorio ?? false,
        orden: a.orden ?? 0,
      })),
    });

    // 6. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      data: { vinculados: nuevos.length, omitidos: existentesIds.length },
      message: `${nuevos.length} atributo(s) vinculado(s) correctamente`,
    };
  }

  /**
   * PUT /categorias/:id/atributos/:atributoId - Actualizar vínculo
   */
  async updateVinculo(
    empresaId: string,
    categoriaId: string,
    atributoId: string,
    dto: UpdateVinculoAtributoDto,
  ) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Buscar vínculo existente
    const vinculo = await this.prisma.categoriaAtributo.findFirst({
      where: { categoriaId, atributoId },
    });

    if (!vinculo) {
      throw new NotFoundException('Este atributo no está vinculado a la categoría');
    }

    // 3. Actualizar
    const updated = await this.prisma.categoriaAtributo.update({
      where: { id: vinculo.id },
      data: {
        ...(dto.obligatorio !== undefined && { obligatorio: dto.obligatorio }),
        ...(dto.orden !== undefined && { orden: dto.orden }),
      },
      include: {
        atributo: {
          select: { id: true, nombre: true, tipoVisual: true },
        },
      },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      data: updated,
      message: 'Vínculo actualizado correctamente',
    };
  }

  /**
   * DELETE /categorias/:id/atributos/:atributoId - Desvincular atributo
   */
  async desvincularAtributo(empresaId: string, categoriaId: string, atributoId: string) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Buscar vínculo existente
    const vinculo = await this.prisma.categoriaAtributo.findFirst({
      where: { categoriaId, atributoId },
      include: {
        atributo: { select: { nombre: true } },
      },
    });

    if (!vinculo) {
      throw new NotFoundException('Este atributo no está vinculado a la categoría');
    }

    // 3. Eliminar vínculo
    await this.prisma.categoriaAtributo.delete({
      where: { id: vinculo.id },
    });

    // 4. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${categoriaId}`);

    return {
      success: true,
      message: `Atributo "${vinculo.atributo.nombre}" desvinculado correctamente`,
    };
  }

  /**
   * GET /categorias/:id/atributos-disponibles - Atributos no vinculados
   */
  async getAtributosDisponibles(empresaId: string, categoriaId: string) {
    // 1. Verificar que la categoría existe
    const categoria = await this.prisma.categoria.findFirst({
      where: { id: categoriaId, empresaId },
    });

    if (!categoria) {
      throw new NotFoundException('No encontramos esta categoría');
    }

    // 2. Obtener atributos ya vinculados
    const vinculados = await this.prisma.categoriaAtributo.findMany({
      where: { categoriaId },
      select: { atributoId: true },
    });
    const vinculadosIds = vinculados.map((v) => v.atributoId);

    // 3. Buscar atributos NO vinculados
    const disponibles = await this.prisma.atributo.findMany({
      where: {
        empresaId,
        activo: true,
        ...(vinculadosIds.length > 0 && { id: { notIn: vinculadosIds } }),
      },
      orderBy: { nombre: 'asc' },
      select: {
        id: true,
        nombre: true,
        slug: true,
        tipoVisual: true,
        tipoSistema: true,
        generaVariante: true,
        _count: { select: { valores: true } },
      },
    });

    return {
      success: true,
      data: disponibles.map((a) => ({
        ...a,
        valoresCount: a._count.valores,
        _count: undefined,
      })),
    };
  }
}
