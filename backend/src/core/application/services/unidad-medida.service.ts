/**
 * @file unidad-medida.service.ts
 * @description Service para gestión de unidades de medida
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: unidades_medida)
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateUnidadMedidaDto } from '../dto/unidad-medida/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from '../dto/unidad-medida/update-unidad-medida.dto';

const CACHE_TTL = 600; // 10 minutos

const ERROR_MESSAGES = {
  NOT_FOUND: 'Esta unidad de medida no existe',
  DUPLICATE: 'Ya existe una unidad de medida con esa abreviatura',
  IN_USE: 'No se puede eliminar, hay productos usando esta unidad',
};

@Injectable()
export class UnidadMedidaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Listar unidades de medida
  async findAll(empresaId: string, options: { activo?: boolean } = {}) {
    const cacheKey = `empresa_${empresaId}:unidades_medida:list`;

    // Buscar en cache si no hay filtros
    if (options.activo === undefined) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    }

    const where: any = { empresaId };
    if (options.activo !== undefined) where.activo = options.activo;

    const unidades = await this.prisma.unidadMedida.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    const data = unidades.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      abreviatura: u.abreviatura,
      activo: u.activo,
      createdAt: u.createdAt,
    }));

    // Guardar en cache si no hay filtros
    if (options.activo === undefined) {
      await this.redis.set(cacheKey, data, CACHE_TTL);
    }

    return data;
  }

  // Obtener por ID
  async findById(empresaId: string, id: string) {
    const unidad = await this.prisma.unidadMedida.findFirst({
      where: { id, empresaId },
    });

    if (!unidad) return null;

    return {
      id: unidad.id,
      nombre: unidad.nombre,
      abreviatura: unidad.abreviatura,
      activo: unidad.activo,
      createdAt: unidad.createdAt,
    };
  }

  // Crear unidad de medida
  async create(empresaId: string, dto: CreateUnidadMedidaDto) {
    // Verificar abreviatura única
    const exists = await this.prisma.unidadMedida.findFirst({
      where: { empresaId, abreviatura: dto.abreviatura },
    });

    if (exists) {
      throw new ConflictException(ERROR_MESSAGES.DUPLICATE);
    }

    const unidad = await this.prisma.unidadMedida.create({
      data: {
        ...dto,
        empresaId,
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return this.findById(empresaId, unidad.id);
  }

  // Actualizar unidad de medida
  async update(empresaId: string, id: string, dto: UpdateUnidadMedidaDto) {
    const existing = await this.findById(empresaId, id);
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    // Verificar abreviatura única si se cambia
    if (dto.abreviatura && dto.abreviatura !== existing.abreviatura) {
      const exists = await this.prisma.unidadMedida.findFirst({
        where: {
          empresaId,
          abreviatura: dto.abreviatura,
          id: { not: id },
        },
      });

      if (exists) {
        throw new ConflictException(ERROR_MESSAGES.DUPLICATE);
      }
    }

    await this.prisma.unidadMedida.update({
      where: { id },
      data: dto,
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return this.findById(empresaId, id);
  }

  // Eliminar unidad de medida
  async delete(empresaId: string, id: string) {
    const existing = await this.findById(empresaId, id);
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    // Verificar si está en uso
    const productosUsando = await this.prisma.producto.count({
      where: { unidadMedidaId: id },
    });

    if (productosUsando > 0) {
      throw new ConflictException(ERROR_MESSAGES.IN_USE);
    }

    await this.prisma.unidadMedida.delete({
      where: { id },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return { success: true };
  }

  // Invalidar cache
  private async invalidateCache(empresaId: string) {
    try {
      await this.redis.del(`empresa_${empresaId}:unidades_medida:list`);
    } catch {
      // Ignorar errores de cache
    }
  }
}
