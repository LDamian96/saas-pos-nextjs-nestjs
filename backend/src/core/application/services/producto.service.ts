/**
 * @file producto.service.ts
 * @description Service para productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { Prisma } from '@prisma/client';

const CACHE_TTL = {
  LIST: 300, // 5 minutos para listas
  SINGLE: 600, // 10 minutos para item individual
};

const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Este producto no existe',
  DUPLICATE_CODE: 'Ya existe un producto con ese codigo',
};

@Injectable()
export class ProductoService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Listar productos con filtros y paginación
  async findAll(
    empresaId: string,
    options: {
      search?: string;
      categoriaId?: string;
      marcaId?: string;
      tipo?: string;
      activo?: boolean;
      stockBajo?: boolean;
      visiblePos?: boolean;
      visibleWeb?: boolean;
      page?: number;
      limit?: number;
      orden?: string;
      direccion?: 'asc' | 'desc';
    },
  ) {
    const {
      search,
      categoriaId,
      marcaId,
      tipo,
      activo,
      stockBajo,
      visiblePos,
      visibleWeb,
      page = 1,
      limit = 20,
      orden = 'nombre',
      direccion = 'asc',
    } = options;

    // Construir where
    const where: Prisma.ProductoWhereInput = {
      empresaId,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { codigoInterno: { contains: search, mode: 'insensitive' } },
        { codigoBarras: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoriaId) where.categoriaId = categoriaId;
    if (marcaId) where.marcaId = marcaId;
    if (tipo) where.tipo = tipo;
    if (activo !== undefined) where.activo = activo;
    if (visiblePos !== undefined) where.visiblePos = visiblePos;
    if (visibleWeb !== undefined) where.visibleWeb = visibleWeb;

    // Stock bajo - productos simples con stock < stockMinimo
    if (stockBajo) {
      where.tipo = 'simple';
      where.manejaStock = true;
      where.stock = { lt: 10 };
    }

    // Contar total
    const total = await this.prisma.producto.count({ where });

    // Obtener productos con includes
    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: { id: true, nombre: true },
        },
        marca: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { variantes: true },
        },
        variantes: {
          where: { activo: true },
          select: {
            id: true,
            sku: true,
            precioVenta: true,
            precioMayorista: true,
            stock: true,
            codigoBarras: true,
          },
          take: 10,
        },
      },
      orderBy: { [orden]: direccion },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calcular stock total para productos variables
    const productosConStock = await Promise.all(
      productos.map(async (producto: any) => {
        let stockTotal = producto.stock || 0;

        if (producto.tipo === 'variable') {
          const variantesSum = await this.prisma.variante.aggregate({
            where: { productoId: producto.id },
            _sum: { stock: true },
          });
          stockTotal = variantesSum._sum.stock || 0;
        }

        return {
          id: producto.id,
          nombre: producto.nombre,
          slug: producto.slug,
          sku: producto.sku,
          codigoInterno: producto.codigoInterno,
          tipo: producto.tipo,
          categoria: producto.categoria,
          marca: producto.marca,
          precioVenta: producto.precioVenta,
          precioMayorista: producto.precioMayorista,
          precioOferta: producto.precioOferta,
          descuentoPorcentaje: producto.descuentoPorcentaje,
          imagenPrincipal: producto.imagenPrincipal,
          stockTotal,
          variantesCount: producto._count?.variantes || 0,
          activo: producto.activo,
          visiblePos: producto.visiblePos,
          visibleWeb: producto.visibleWeb,
          variantes: producto.variantes || [], // always include variantes
        };
      }),
    );

    return {
      data: productosConStock,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Obtener producto por ID
  async findById(empresaId: string, id: string) {
    const cacheKey = `empresa_${empresaId}:productos:${id}`;

    // Buscar en cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId },
      include: {
        categoria: {
          select: { id: true, nombre: true },
        },
        marca: {
          select: { id: true, nombre: true },
        },
        unidadMedida: {
          select: { id: true, nombre: true },
        },
        imagenes: {
          orderBy: { orden: 'asc' },
        },
        variantes: {
          where: { activo: true },
          include: {
            valores: {
              include: {
                valorAtributo: {
                  include: {
                    atributo: {
                      select: { id: true, nombre: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!producto) return null;

    // Formatear variantes
    const formattedVariantes = producto.variantes.map((v) => ({
      id: v.id,
      sku: v.sku,
      codigoBarras: v.codigoBarras,
      nombre: v.nombreVariante || v.valores.map((vv) => vv.valorAtributo.valor).join(' / ') || v.sku,
      nombreVariante: v.nombreVariante,
      precioCompra: v.precioCompra,
      precioVenta: v.precioVenta,
      imagen: v.imagen,
      stock: v.stock,
      activo: v.activo,
      valores: v.valores.map((vv) => ({
        atributo: vv.valorAtributo.atributo.nombre,
        valor: vv.valorAtributo.valor,
        codigoColor: vv.valorAtributo.codigoColor,
      })),
    }));

    const response = {
      ...producto,
      variantes: formattedVariantes,
    };

    // Guardar en cache
    await this.redis.set(cacheKey, response, CACHE_TTL.SINGLE);

    return response;
  }

  // Buscar por código de barras
  async findByBarcode(empresaId: string, codigoBarras: string) {
    // Buscar en productos simples
    const producto = await this.prisma.producto.findFirst({
      where: { empresaId, codigoBarras, tipo: 'simple' },
      include: {
        categoria: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
      },
    });

    if (producto) return { tipo: 'producto', data: producto };

    // Buscar en variantes
    const variante = await this.prisma.variante.findFirst({
      where: { codigoBarras },
      include: {
        producto: {
          include: {
            categoria: { select: { id: true, nombre: true } },
            marca: { select: { id: true, nombre: true } },
          },
        },
        valores: {
          include: {
            valorAtributo: {
              include: {
                atributo: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    if (variante && variante.producto.empresaId === empresaId) {
      return { tipo: 'variante', data: variante };
    }

    return null;
  }

  // Crear producto
  async create(empresaId: string, data: any) {
    const { variantes, stockPorSucursal, ...productoData } = data;

    // Generar código interno si no existe
    if (!productoData.codigoInterno) {
      const count = await this.prisma.producto.count({ where: { empresaId } });
      productoData.codigoInterno = `PROD-${String(count + 1).padStart(5, '0')}`;
    }

    // Generar slug
    productoData.slug = this.generateSlug(productoData.nombre);

    // Verificar slug único
    let slugBase = productoData.slug;
    let counter = 1;
    while (
      await this.prisma.producto.findFirst({
        where: { empresaId, slug: productoData.slug },
      })
    ) {
      productoData.slug = `${slugBase}-${counter}`;
      counter++;
    }

    // Crear producto
    const producto = await this.prisma.producto.create({
      data: {
        ...productoData,
        empresaId,
      },
    });

    // Obtener sucursales activas para crear stockSucursal
    const sucursales = await this.prisma.sucursal.findMany({
      where: { empresaId, activo: true },
      select: { id: true },
    });

    // Crear variantes si se proporcionaron
    if (variantes && variantes.length > 0) {
      for (const varianteData of variantes) {
        const { valoresAtributoIds, ...vData } = varianteData;

        const variante = await this.prisma.variante.create({
          data: {
            ...vData,
            productoId: producto.id,
          },
        });

        // Vincular valores de atributo a la variante
        if (valoresAtributoIds && valoresAtributoIds.length > 0) {
          await this.prisma.varianteValor.createMany({
            data: valoresAtributoIds.map((valorId: string) => ({
              varianteId: variante.id,
              valorAtributoId: valorId,
            })),
          });
        }

        // Crear stockSucursal:
        // - Si vino stockPorSucursal explícito, usarlo para ESTA variante.
        // - Sino, distribuir stock de la variante en todas las sucursales.
        if (Array.isArray(stockPorSucursal) && stockPorSucursal.length > 0) {
          const sucursalIdsValidas = new Set(sucursales.map((s) => s.id));
          const entries = stockPorSucursal.filter((e: any) =>
            e && typeof e.sucursalId === 'string' && sucursalIdsValidas.has(e.sucursalId),
          );
          if (entries.length > 0) {
            await this.prisma.stockSucursal.createMany({
              data: entries.map((e: any) => ({
                varianteId: variante.id,
                sucursalId: e.sucursalId,
                stock: Number(e.stock) || 0,
                stockMinimo: Number(e.stockMinimo) || 0,
                stockMaximo: Number(e.stockMaximo) || 0,
              })),
            });
          }
        } else if (sucursales.length > 0) {
          await this.prisma.stockSucursal.createMany({
            data: sucursales.map((s) => ({
              varianteId: variante.id,
              sucursalId: s.id,
              stock: vData.stock || 0,
            })),
          });
        }
      }
    } else if (producto.tipo === 'simple') {
      // Crear variante por defecto para productos simples
      const defaultVariante = await this.prisma.variante.create({
        data: {
          productoId: producto.id,
          sku: producto.sku || producto.codigoInterno,
          nombreVariante: 'Default',
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          stock: producto.stock || 0,
          codigoBarras: producto.codigoBarras,
          activo: true,
        },
      });

      // Crear stockSucursal:
      // - Si vino stockPorSucursal explícito, usarlo (asignar a la variante default).
      // - Sino, distribuir stock simple en TODAS las sucursales.
      if (Array.isArray(stockPorSucursal) && stockPorSucursal.length > 0) {
        const sucursalIdsValidas = new Set(sucursales.map((s) => s.id));
        const entries = stockPorSucursal.filter((e: any) =>
          e && typeof e.sucursalId === 'string' && sucursalIdsValidas.has(e.sucursalId),
        );
        if (entries.length > 0) {
          await this.prisma.stockSucursal.createMany({
            data: entries.map((e: any) => ({
              varianteId: defaultVariante.id,
              sucursalId: e.sucursalId,
              stock: Number(e.stock) || 0,
              stockMinimo: Number(e.stockMinimo) || 0,
              stockMaximo: Number(e.stockMaximo) || 0,
            })),
          });
        }
      } else if (sucursales.length > 0) {
        await this.prisma.stockSucursal.createMany({
          data: sucursales.map((s) => ({
            varianteId: defaultVariante.id,
            sucursalId: s.id,
            stock: producto.stock || 0,
          })),
        });
      }
    }

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return this.findById(empresaId, producto.id);
  }

  // Actualizar producto
  async update(empresaId: string, id: string, data: any) {
    const existing = await this.findById(empresaId, id);
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const { variantes, ...productoData } = data;

    // Actualizar slug si cambió el nombre
    if (productoData.nombre) {
      productoData.slug = this.generateSlug(productoData.nombre);

      // Verificar slug único (excluyendo el actual)
      let slugBase = productoData.slug;
      let counter = 1;
      while (
        await this.prisma.producto.findFirst({
          where: { empresaId, slug: productoData.slug, id: { not: id } },
        })
      ) {
        productoData.slug = `${slugBase}-${counter}`;
        counter++;
      }
    }

    // Actualizar producto
    await this.prisma.producto.update({
      where: { id },
      data: productoData,
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`empresa_${empresaId}:productos:${id}`);

    return this.findById(empresaId, id);
  }

  // Eliminar producto (soft delete)
  async delete(empresaId: string, id: string) {
    const existing = await this.findById(empresaId, id) as { activo?: boolean } | null;

    // Validar que exista Y que esté activo (no eliminado previamente)
    if (!existing || !existing.activo) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    await this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`empresa_${empresaId}:productos:${id}`);

    return { success: true };
  }

  // Obtener variantes de un producto
  async findVariantes(empresaId: string, productoId: string) {
    // Verificar que el producto pertenece a la empresa
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
    });

    if (!producto) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const variantes = await this.prisma.variante.findMany({
      where: { productoId },
      include: {
        valores: {
          include: {
            valorAtributo: {
              include: {
                atributo: {
                  select: { id: true, nombre: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Formatear respuesta
    return variantes.map((v) => ({
      id: v.id,
      productoId: v.productoId,
      sku: v.sku,
      codigoBarras: v.codigoBarras,
      nombre: v.nombreVariante || v.valores.map((vv) => vv.valorAtributo.valor).join(' / ') || v.sku,
      nombreVariante: v.nombreVariante,
      precioCompra: v.precioCompra,
      precioVenta: v.precioVenta,
      precioMayorista: v.precioMayorista,
      precioOferta: v.precioOferta,
      imagen: v.imagen,
      stock: v.stock,
      stockMinimo: v.stockMinimo,
      activo: v.activo,
      valores: v.valores.map((vv) => ({
        atributo: vv.valorAtributo.atributo.nombre,
        valor: vv.valorAtributo.valor,
        codigoColor: vv.valorAtributo.codigoColor,
      })),
    }));
  }

  // Actualizar una variante
  async updateVariante(
    empresaId: string,
    productoId: string,
    varianteId: string,
    data: {
      precioVenta?: number;
      precioCompra?: number;
      stock?: number;
      activo?: boolean;
      sku?: string;
      codigoBarras?: string;
    },
  ) {
    // Verificar que el producto pertenece a la empresa
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
    });

    if (!producto) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Verificar que la variante pertenece al producto
    const variante = await this.prisma.variante.findFirst({
      where: { id: varianteId, productoId },
    });

    if (!variante) {
      throw new NotFoundException('Esta variante no existe');
    }

    // Actualizar variante
    const updated = await this.prisma.variante.update({
      where: { id: varianteId },
      data,
    });

    // Invalidar cache del producto
    await this.redis.del(`empresa_${empresaId}:productos:${productoId}`);

    return updated;
  }

  // Generar slug
  private generateSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Invalidar cache
  private async invalidateCache(empresaId: string) {
    try {
      await this.redis.delPattern(`empresa_${empresaId}:productos:*`);
    } catch {
      // Ignorar errores de cache
    }
  }
}
