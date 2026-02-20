/**
 * @file proveedor.service.ts
 * @description Servicio para gestión de proveedores
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: proveedores)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PROVEEDORES)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateProveedorDto, UpdateProveedorDto } from '../dto/proveedor';

const CACHE_TTL = 3600;
const CACHE_PREFIX = 'proveedores';

@Injectable()
export class ProveedorService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /proveedores - Listar proveedores de la empresa
   */
  async findAll(empresaId: string, query?: { activo?: boolean; search?: string }) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    if (!query?.search) {
      const cached = await this.redis.get(cacheKey);
      if (cached && query?.activo === undefined) {
        return { success: true, data: cached };
      }
    }

    const where: any = { empresaId };
    if (query?.activo !== undefined) where.activo = query.activo;
    if (query?.search) {
      where.OR = [
        { razonSocial: { contains: query.search, mode: 'insensitive' } },
        { nombreComercial: { contains: query.search, mode: 'insensitive' } },
        { codigo: { contains: query.search, mode: 'insensitive' } },
        { ruc: { contains: query.search } },
      ];
    }

    const proveedores = await this.prisma.proveedor.findMany({
      where,
      orderBy: [{ razonSocial: 'asc' }],
      select: {
        id: true,
        codigo: true,
        razonSocial: true,
        nombreComercial: true,
        ruc: true,
        email: true,
        telefono: true,
        celular: true,
        direccion: true,
        contactoNombre: true,
        contactoCargo: true,
        contactoTelefono: true,
        contactoEmail: true,
        diasCredito: true,
        limiteCredito: true,
        activo: true,
        notas: true,
        createdAt: true,
      },
    });

    if (!query?.search && query?.activo === undefined) {
      await this.redis.set(cacheKey, proveedores, CACHE_TTL);
    }

    return { success: true, data: proveedores };
  }

  /**
   * GET /proveedores/:id - Obtener proveedor
   */
  async findOne(empresaId: string, id: string) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return { success: true, data: cached };

    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    await this.redis.set(cacheKey, proveedor, CACHE_TTL);
    return { success: true, data: proveedor };
  }

  /**
   * POST /proveedores - Crear proveedor
   */
  async create(empresaId: string, dto: CreateProveedorDto) {
    // Verificar código único
    const existing = await this.prisma.proveedor.findFirst({
      where: { empresaId, codigo: dto.codigo },
    });
    if (existing) {
      throw new ConflictException('Ya existe un proveedor con ese código');
    }

    const proveedor = await this.prisma.proveedor.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        razonSocial: dto.razonSocial,
        nombreComercial: dto.nombreComercial,
        ruc: dto.ruc,
        email: dto.email,
        telefono: dto.telefono,
        celular: dto.celular,
        direccion: dto.direccion,
        contactoNombre: dto.contactoNombre,
        contactoCargo: dto.contactoCargo,
        contactoTelefono: dto.contactoTelefono,
        contactoEmail: dto.contactoEmail,
        diasCredito: dto.diasCredito ?? 0,
        limiteCredito: dto.limiteCredito,
        activo: dto.activo ?? true,
        notas: dto.notas,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: proveedor,
      message: 'Proveedor creado correctamente',
    };
  }

  /**
   * PUT /proveedores/:id - Actualizar proveedor
   */
  async update(empresaId: string, id: string, dto: UpdateProveedorDto) {
    const existing = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Verificar código único si cambió
    if (dto.codigo && dto.codigo !== existing.codigo) {
      const conflict = await this.prisma.proveedor.findFirst({
        where: { empresaId, codigo: dto.codigo, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Ya existe un proveedor con ese código');
      }
    }

    const proveedor = await this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: proveedor,
      message: 'Proveedor actualizado correctamente',
    };
  }

  /**
   * DELETE /proveedores/:id - Eliminar proveedor
   */
  async delete(empresaId: string, id: string) {
    const existing = await this.prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Soft delete: solo desactivar
    await this.prisma.proveedor.update({
      where: { id },
      data: { activo: false },
    });

    await this.invalidateCache(empresaId);

    return { success: true, message: 'Proveedor eliminado correctamente' };
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async invalidateCache(empresaId: string) {
    await this.redis.delPattern(`${CACHE_PREFIX}:${empresaId}:*`);
  }
}
