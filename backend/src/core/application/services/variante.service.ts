/**
 * @file variante.service.ts
 * @description Service para variantes de productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: variantes)
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';

const ERROR_MESSAGES = {
  VARIANT_NOT_FOUND: 'Esta variante no existe',
  UNAUTHORIZED: 'No tienes permiso para esta operacion',
};

@Injectable()
export class VarianteService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Obtener variantes de un producto
  async findByProductoId(productoId: string) {
    return this.prisma.variante.findMany({
      where: { productoId, activo: true },
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
  }

  // Obtener variante por ID
  async findById(id: string) {
    return this.prisma.variante.findUnique({
      where: { id },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            empresaId: true,
            precioVenta: true,
            precioCompra: true,
            imagenPrincipal: true,
          },
        },
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
    });
  }

  // Crear variante
  async create(
    empresaId: string,
    productoId: string,
    data: {
      sku: string;
      codigoBarras?: string;
      nombreVariante?: string;
      precioCompra?: number;
      precioVenta?: number;
      imagen?: string;
      stock?: number;
      activo?: boolean;
      valoresAtributoIds?: string[];
    },
  ) {
    const { valoresAtributoIds, ...varianteData } = data;

    // Generar nombre de variante basado en valores de atributos
    let nombreVariante = varianteData.nombreVariante;
    if (!nombreVariante && valoresAtributoIds && valoresAtributoIds.length > 0) {
      const valores = await this.prisma.valorAtributo.findMany({
        where: { id: { in: valoresAtributoIds } },
        select: { valor: true },
      });
      nombreVariante = valores.map((v) => v.valor).join(' - ');
    }

    // Crear variante
    const variante = await this.prisma.variante.create({
      data: {
        ...varianteData,
        nombreVariante,
        productoId,
      },
    });

    // Vincular valores de atributo
    if (valoresAtributoIds && valoresAtributoIds.length > 0) {
      await this.prisma.varianteValor.createMany({
        data: valoresAtributoIds.map((valorId) => ({
          varianteId: variante.id,
          valorAtributoId: valorId,
        })),
      });
    }

    return this.findById(variante.id);
  }

  // Actualizar variante
  async update(
    empresaId: string,
    id: string,
    data: {
      sku?: string;
      codigoBarras?: string;
      nombre?: string;
      precioCompra?: number;
      precioVenta?: number;
      imagen?: string;
      stock?: number;
      activo?: boolean;
      valoresAtributoIds?: string[];
    },
  ) {
    // Verificar que existe y pertenece a la empresa
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }
    if (existing.producto.empresaId !== empresaId) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const { valoresAtributoIds, ...varianteData } = data;

    // Actualizar variante
    await this.prisma.variante.update({
      where: { id },
      data: varianteData,
    });

    // Actualizar valores de atributo si se proporcionaron
    if (valoresAtributoIds !== undefined) {
      // Eliminar existentes
      await this.prisma.varianteValor.deleteMany({
        where: { varianteId: id },
      });

      // Crear nuevos
      if (valoresAtributoIds.length > 0) {
        await this.prisma.varianteValor.createMany({
          data: valoresAtributoIds.map((valorId) => ({
            varianteId: id,
            valorAtributoId: valorId,
          })),
        });
      }
    }

    return this.findById(id);
  }

  // Eliminar variante (soft delete)
  async delete(empresaId: string, id: string) {
    // Verificar que existe y pertenece a la empresa
    const existing = await this.findById(id);

    // Validar que exista Y que esté activa (no eliminada previamente)
    if (!existing || !existing.activo) {
      throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }
    if (existing.producto.empresaId !== empresaId) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    await this.prisma.variante.update({
      where: { id },
      data: { activo: false },
    });

    return { success: true };
  }

  // Actualizar stock
  async updateStock(id: string, cantidad: number, operacion: 'set' | 'increment' | 'decrement') {
    if (operacion === 'set') {
      return this.prisma.variante.update({
        where: { id },
        data: { stock: cantidad },
      });
    }

    return this.prisma.variante.update({
      where: { id },
      data: {
        stock: operacion === 'increment' ? { increment: cantidad } : { decrement: cantidad },
      },
    });
  }
}
