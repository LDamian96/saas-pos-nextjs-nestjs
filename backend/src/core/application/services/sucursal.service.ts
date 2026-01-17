/**
 * @file sucursal.service.ts
 * @description Servicio para gestion de sucursales
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: SUCURSALES)
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
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { CreateSucursalDto, UpdateSucursalDto } from '../dto/sucursal';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'sucursales';

@Injectable()
export class SucursalService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /sucursales - Listar sucursales de la empresa
   */
  async findAll(empresaId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const sucursales = await this.prisma.sucursal.findMany({
      where: { empresaId },
      orderBy: [{ esPrincipal: 'desc' }, { nombre: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        direccion: true,
        telefono: true,
        email: true,
        latitud: true,
        longitud: true,
        horarioApertura: true,
        horarioCierre: true,
        diasOperacion: true,
        esPrincipal: true,
        esAlmacen: true,
        activo: true,
        createdAt: true,
      },
    });

    // 3. Guardar en cache
    await this.redis.set(cacheKey, sucursales, CACHE_TTL);

    return { success: true, data: sucursales };
  }

  /**
   * GET /sucursales/:id - Obtener sucursal por ID
   */
  async findOne(empresaId: string, sucursalId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:${sucursalId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const sucursal = await this.prisma.sucursal.findFirst({
      where: {
        id: sucursalId,
        empresaId,
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        direccion: true,
        telefono: true,
        email: true,
        latitud: true,
        longitud: true,
        horarioApertura: true,
        horarioCierre: true,
        diasOperacion: true,
        esPrincipal: true,
        esAlmacen: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!sucursal) {
      throw new NotFoundException('No encontramos esta sucursal');
    }

    // 3. Guardar en cache
    await this.redis.set(cacheKey, sucursal, CACHE_TTL);

    return { success: true, data: sucursal };
  }

  /**
   * POST /sucursales - Crear sucursal
   */
  async create(empresaId: string, dto: CreateSucursalDto) {
    // 1. Verificar limite del plan
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { maxSucursales: true },
    });

    const countSucursales = await this.prisma.sucursal.count({
      where: { empresaId },
    });

    if (empresa && countSucursales >= empresa.maxSucursales) {
      throw new BadRequestException(
        `Tu plan permite maximo ${empresa.maxSucursales} sucursales. Mejora tu plan para agregar mas`,
      );
    }

    // 2. Verificar codigo unico
    const existingCodigo = await this.prisma.sucursal.findFirst({
      where: {
        empresaId,
        codigo: dto.codigo,
      },
    });

    if (existingCodigo) {
      throw new ConflictException('Este codigo ya existe. Usa otro diferente');
    }

    // 3. Si es principal, quitar el flag de otras
    if (dto.esPrincipal) {
      await this.prisma.sucursal.updateMany({
        where: { empresaId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    // 4. Crear sucursal
    const sucursal = await this.prisma.sucursal.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono,
        email: dto.email,
        latitud: dto.latitud,
        longitud: dto.longitud,
        diasOperacion: dto.diasOperacion,
        esPrincipal: dto.esPrincipal || false,
        esAlmacen: dto.esAlmacen || false,
        activo: dto.activo !== undefined ? dto.activo : true,
      },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: sucursal,
      message: 'Sucursal creada correctamente',
    };
  }

  /**
   * PUT /sucursales/:id - Actualizar sucursal
   */
  async update(empresaId: string, sucursalId: string, dto: UpdateSucursalDto) {
    // 1. Verificar que existe
    const sucursal = await this.prisma.sucursal.findFirst({
      where: {
        id: sucursalId,
        empresaId,
      },
    });

    if (!sucursal) {
      throw new NotFoundException('No encontramos esta sucursal');
    }

    // 2. Verificar codigo unico si se esta cambiando
    if (dto.codigo && dto.codigo !== sucursal.codigo) {
      const existingCodigo = await this.prisma.sucursal.findFirst({
        where: {
          empresaId,
          codigo: dto.codigo,
          id: { not: sucursalId },
        },
      });

      if (existingCodigo) {
        throw new ConflictException('Este codigo ya existe. Usa otro diferente');
      }
    }

    // 3. Si se marca como principal, quitar el flag de otras
    if (dto.esPrincipal && !sucursal.esPrincipal) {
      await this.prisma.sucursal.updateMany({
        where: { empresaId, esPrincipal: true },
        data: { esPrincipal: false },
      });
    }

    // 4. Actualizar
    const updated = await this.prisma.sucursal.update({
      where: { id: sucursalId },
      data: {
        ...(dto.codigo && { codigo: dto.codigo }),
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.direccion !== undefined && { direccion: dto.direccion }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.latitud !== undefined && { latitud: dto.latitud }),
        ...(dto.longitud !== undefined && { longitud: dto.longitud }),
        ...(dto.diasOperacion !== undefined && { diasOperacion: dto.diasOperacion }),
        ...(dto.esPrincipal !== undefined && { esPrincipal: dto.esPrincipal }),
        ...(dto.esAlmacen !== undefined && { esAlmacen: dto.esAlmacen }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    // 5. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${sucursalId}`);

    return {
      success: true,
      data: updated,
      message: 'Sucursal actualizada correctamente',
    };
  }

  /**
   * DELETE /sucursales/:id - Eliminar sucursal
   */
  async delete(empresaId: string, sucursalId: string) {
    // 1. Verificar que existe
    const sucursal = await this.prisma.sucursal.findFirst({
      where: {
        id: sucursalId,
        empresaId,
      },
    });

    if (!sucursal) {
      throw new NotFoundException('No encontramos esta sucursal');
    }

    // 2. No permitir eliminar la principal
    if (sucursal.esPrincipal) {
      throw new BadRequestException('No puedes eliminar la sucursal principal');
    }

    // 3. Verificar que no tenga usuarios asignados
    const usuariosAsignados = await this.prisma.usuario.count({
      where: { sucursalId },
    });

    if (usuariosAsignados > 0) {
      throw new BadRequestException(
        `Esta sucursal tiene ${usuariosAsignados} usuarios asignados. Reasignalos primero`,
      );
    }

    // 4. Verificar que no tenga stock
    const stockItems = await this.prisma.stockSucursal.count({
      where: {
        sucursalId,
        stock: { gt: 0 },
      },
    });

    if (stockItems > 0) {
      throw new BadRequestException(
        'Esta sucursal tiene productos con stock. Transfierelos primero',
      );
    }

    // 5. Eliminar (soft delete via activo = false, o hard delete)
    await this.prisma.sucursal.delete({
      where: { id: sucursalId },
    });

    // 6. Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:${sucursalId}`);

    return {
      success: true,
      message: 'Sucursal eliminada correctamente',
    };
  }

  /**
   * Invalidar cache de sucursales
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }
}
