/**
 * @file rol.service.ts
 * @description Servicio para gestión de roles y permisos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: roles, permisos, rol_permisos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ROLES Y PERMISOS)
 * - RBAC: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateRolDto, UpdateRolDto } from '../dto/rol';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'roles';

// Función para generar código desde nombre
function generateCodigo(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

@Injectable()
export class RolService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /roles - Listar roles disponibles
   */
  async findAll(empresaId: string) {
    // Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:all`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // Buscar roles de la empresa + roles del sistema
    const roles = await this.prisma.rol.findMany({
      where: {
        OR: [{ empresaId }, { empresaId: null }],
        activo: true,
      },
      orderBy: [{ nivel: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        esSistema: true,
        nivel: true,
        activo: true,
        createdAt: true,
        _count: {
          select: { usuarios: true, permisos: true },
        },
      },
    });

    const data = roles.map((rol) => ({
      ...rol,
      usuariosCount: rol._count.usuarios,
      permisosCount: rol._count.permisos,
      _count: undefined,
    }));

    // Guardar en cache
    await this.redis.set(cacheKey, data, CACHE_TTL);

    return { success: true, data };
  }

  /**
   * GET /roles/:id - Obtener rol con permisos
   */
  async findOne(empresaId: string, rolId: string) {
    const rol = await this.prisma.rol.findFirst({
      where: {
        id: rolId,
        OR: [{ empresaId }, { empresaId: null }],
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        esSistema: true,
        nivel: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        permisos: {
          select: {
            permiso: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                modulo: true,
              },
            },
          },
        },
        _count: {
          select: { usuarios: true },
        },
      },
    });

    if (!rol) {
      throw new NotFoundException('No encontramos este rol');
    }

    // Agrupar permisos por módulo
    const permisosPorModulo: Record<string, any[]> = {};
    rol.permisos.forEach((rp) => {
      const modulo = rp.permiso.modulo;
      if (!permisosPorModulo[modulo]) {
        permisosPorModulo[modulo] = [];
      }
      permisosPorModulo[modulo].push(rp.permiso);
    });

    return {
      success: true,
      data: {
        ...rol,
        permisos: rol.permisos.map((rp) => rp.permiso),
        permisosPorModulo,
        usuariosCount: rol._count.usuarios,
        _count: undefined,
      },
    };
  }

  /**
   * POST /roles - Crear rol personalizado
   */
  async create(empresaId: string, dto: CreateRolDto) {
    // Generar código
    const codigo = generateCodigo(dto.nombre);

    // Verificar código único
    const existingCodigo = await this.prisma.rol.findFirst({
      where: { empresaId, codigo },
    });

    if (existingCodigo) {
      throw new ConflictException('Ya existe un rol con este nombre');
    }

    // Crear rol con permisos
    const rol = await this.prisma.rol.create({
      data: {
        empresaId,
        codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        esSistema: false,
        nivel: 50, // Nivel medio por defecto
        activo: true,
        ...(dto.permisoIds &&
          dto.permisoIds.length > 0 && {
            permisos: {
              createMany: {
                data: dto.permisoIds.map((permisoId) => ({ permisoId })),
              },
            },
          }),
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        permisos: {
          select: {
            permiso: {
              select: { id: true, codigo: true, nombre: true },
            },
          },
        },
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: {
        ...rol,
        permisos: rol.permisos.map((rp) => rp.permiso),
      },
      message: 'Rol creado correctamente',
    };
  }

  /**
   * PUT /roles/:id - Actualizar rol
   */
  async update(empresaId: string, rolId: string, dto: UpdateRolDto) {
    // Verificar que existe y no es de sistema
    const rol = await this.prisma.rol.findFirst({
      where: { id: rolId, empresaId },
    });

    if (!rol) {
      throw new NotFoundException('No encontramos este rol');
    }

    if (rol.esSistema) {
      throw new ForbiddenException('No puedes modificar roles del sistema');
    }

    // Actualizar rol
    const updated = await this.prisma.$transaction(async (tx) => {
      // Si se actualizan permisos, eliminar los anteriores
      if (dto.permisoIds !== undefined) {
        await tx.rolPermiso.deleteMany({ where: { rolId } });

        if (dto.permisoIds.length > 0) {
          await tx.rolPermiso.createMany({
            data: dto.permisoIds.map((permisoId) => ({ rolId, permisoId })),
          });
        }
      }

      // Actualizar datos del rol
      return tx.rol.update({
        where: { id: rolId },
        data: {
          ...(dto.nombre && { nombre: dto.nombre }),
          ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
          ...(dto.activo !== undefined && { activo: dto.activo }),
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          descripcion: true,
          activo: true,
          permisos: {
            select: {
              permiso: {
                select: { id: true, codigo: true, nombre: true },
              },
            },
          },
        },
      });
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: {
        ...updated,
        permisos: updated.permisos.map((rp) => rp.permiso),
      },
      message: 'Rol actualizado correctamente',
    };
  }

  /**
   * DELETE /roles/:id - Eliminar rol
   */
  async delete(empresaId: string, rolId: string) {
    const rol = await this.prisma.rol.findFirst({
      where: { id: rolId, empresaId },
      include: { _count: { select: { usuarios: true } } },
    });

    if (!rol) {
      throw new NotFoundException('No encontramos este rol');
    }

    if (rol.esSistema) {
      throw new ForbiddenException('No puedes eliminar roles del sistema');
    }

    if (rol._count.usuarios > 0) {
      throw new ForbiddenException(
        `Este rol tiene ${rol._count.usuarios} usuario(s) asignado(s). Reasígnalos primero.`,
      );
    }

    // Eliminar rol y sus permisos
    await this.prisma.$transaction([
      this.prisma.rolPermiso.deleteMany({ where: { rolId } }),
      this.prisma.rol.delete({ where: { id: rolId } }),
    ]);

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      message: 'Rol eliminado correctamente',
    };
  }

  /**
   * GET /permisos - Listar todos los permisos
   */
  async getPermisos() {
    const permisos = await this.prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        modulo: true,
      },
    });

    // Agrupar por módulo
    const porModulo: Record<string, any[]> = {};
    permisos.forEach((p) => {
      if (!porModulo[p.modulo]) {
        porModulo[p.modulo] = [];
      }
      porModulo[p.modulo].push(p);
    });

    return {
      success: true,
      data: permisos,
      porModulo,
    };
  }

  /**
   * Invalidar cache de roles
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }
}
