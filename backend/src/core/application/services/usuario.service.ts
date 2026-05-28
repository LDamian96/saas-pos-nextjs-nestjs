/**
 * @file usuario.service.ts
 * @description Servicio para gestión de usuarios
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: USUARIOS)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from '../dto/usuario';
import * as bcrypt from 'bcrypt';

const CACHE_TTL = 1800; // 30 minutos
const CACHE_PREFIX = 'usuarios';

@Injectable()
export class UsuarioService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /usuarios - Listar usuarios de la empresa
   */
  async findAll(
    empresaId: string,
    query?: {
      activo?: boolean;
      rolId?: string;
      sucursalId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = { empresaId };
    if (query?.activo !== undefined) {
      where.activo = query.activo;
    }
    if (query?.rolId) {
      where.rolId = query.rolId;
    }
    if (query?.sucursalId) {
      where.OR = [
        { sucursalId: query.sucursalId },
        { todasSucursales: true },
      ];
    }
    if (query?.search) {
      where.OR = [
        { nombre: { contains: query.search, mode: 'insensitive' } },
        { apellido: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Ejecutar consultas en paralelo
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          avatar: true,
          todasSucursales: true,
          descuentoMaximo: true,
          puedeAnularVenta: true,
          puedeVerCostos: true,
          puedeVerUtilidades: true,
          puedeModificarPrecios: true,
          ultimoLogin: true,
          activo: true,
          createdAt: true,
          rol: {
            select: { id: true, codigo: true, nombre: true },
          },
          sucursal: {
            select: { id: true, nombre: true },
          },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      success: true,
      data: usuarios,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /usuarios/:id - Obtener usuario por ID
   */
  async findOne(empresaId: string, usuarioId: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        avatar: true,
        todasSucursales: true,
        descuentoMaximo: true,
        puedeAnularVenta: true,
        puedeVerCostos: true,
        puedeVerUtilidades: true,
        puedeModificarPrecios: true,
        ultimoLogin: true,
        activo: true,
        emailVerificado: true,
        createdAt: true,
        updatedAt: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            descripcion: true,
            permisos: {
              select: {
                permiso: {
                  select: { id: true, codigo: true, nombre: true, modulo: true },
                },
              },
            },
          },
        },
        sucursal: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('No encontramos este usuario');
    }

    return { success: true, data: usuario };
  }

  /**
   * POST /usuarios - Crear usuario
   */
  async create(empresaId: string, dto: CreateUsuarioDto, createdBy?: string) {
    // Verificar límite de usuarios del plan
    const [empresa, activeUserCount] = await Promise.all([
      this.prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { maxUsuarios: true },
      }),
      this.prisma.usuario.count({
        where: { empresaId, activo: true },
      }),
    ]);

    if (empresa && activeUserCount >= empresa.maxUsuarios) {
      throw new BadRequestException(
        `Has llegado al límite de usuarios permitidos. Tu plan permite máximo ${empresa.maxUsuarios} usuarios.`,
      );
    }

    // Verificar email único en la empresa
    const existingEmail = await this.prisma.usuario.findFirst({
      where: { email: dto.email, empresaId },
    });

    if (existingEmail) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Verificar que el rol existe y pertenece a la empresa
    const rol = await this.prisma.rol.findFirst({
      where: {
        id: dto.rolId,
        OR: [{ empresaId }, { empresaId: null }], // Roles de empresa o sistema
      },
    });

    if (!rol) {
      throw new BadRequestException('El rol seleccionado no existe');
    }

    // Verificar sucursal si se proporciona
    if (dto.sucursalId) {
      const sucursal = await this.prisma.sucursal.findFirst({
        where: { id: dto.sucursalId, empresaId },
      });
      if (!sucursal) {
        throw new BadRequestException('La sucursal seleccionada no existe');
      }
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Crear usuario
    const usuario = await this.prisma.usuario.create({
      data: {
        empresaId,
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        apellido: dto.apellido,
        telefono: dto.telefono,
        rolId: dto.rolId,
        sucursalId: dto.sucursalId,
        todasSucursales: dto.todasSucursales ?? false,
        descuentoMaximo: dto.descuentoMaximo ?? 0,
        puedeAnularVenta: dto.puedeAnularVenta ?? false,
        puedeVerCostos: dto.puedeVerCostos ?? false,
        puedeVerUtilidades: dto.puedeVerUtilidades ?? false,
        puedeModificarPrecios: dto.puedeModificarPrecios ?? false,
        activo: dto.activo ?? true,
        createdBy,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        rol: {
          select: { id: true, nombre: true },
        },
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: usuario,
      message: 'Usuario creado correctamente',
    };
  }

  /**
   * PUT /usuarios/:id - Actualizar usuario
   */
  async update(empresaId: string, usuarioId: string, dto: UpdateUsuarioDto) {
    // Verificar que el usuario existe
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId },
    });

    if (!usuario) {
      throw new NotFoundException('No encontramos este usuario');
    }

    // Verificar email único si se cambia
    if (dto.email && dto.email !== usuario.email) {
      const existingEmail = await this.prisma.usuario.findFirst({
        where: { email: dto.email, empresaId, id: { not: usuarioId } },
      });
      if (existingEmail) {
        throw new ConflictException('Ya existe un usuario con este email');
      }
    }

    // Verificar rol si se cambia
    if (dto.rolId) {
      const rol = await this.prisma.rol.findFirst({
        where: {
          id: dto.rolId,
          OR: [{ empresaId }, { empresaId: null }],
        },
      });
      if (!rol) {
        throw new BadRequestException('El rol seleccionado no existe');
      }
    }

    // Verificar sucursal si se cambia
    if (dto.sucursalId) {
      const sucursal = await this.prisma.sucursal.findFirst({
        where: { id: dto.sucursalId, empresaId },
      });
      if (!sucursal) {
        throw new BadRequestException('La sucursal seleccionada no existe');
      }
    }

    // Actualizar
    const updated = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.apellido && { apellido: dto.apellido }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.rolId && { rolId: dto.rolId }),
        ...(dto.sucursalId !== undefined && { sucursalId: dto.sucursalId }),
        ...(dto.todasSucursales !== undefined && { todasSucursales: dto.todasSucursales }),
        ...(dto.descuentoMaximo !== undefined && { descuentoMaximo: dto.descuentoMaximo }),
        ...(dto.puedeAnularVenta !== undefined && { puedeAnularVenta: dto.puedeAnularVenta }),
        ...(dto.puedeVerCostos !== undefined && { puedeVerCostos: dto.puedeVerCostos }),
        ...(dto.puedeVerUtilidades !== undefined && { puedeVerUtilidades: dto.puedeVerUtilidades }),
        ...(dto.puedeModificarPrecios !== undefined && { puedeModificarPrecios: dto.puedeModificarPrecios }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        rol: {
          select: { id: true, nombre: true },
        },
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Usuario actualizado correctamente',
    };
  }

  /**
   * DELETE /usuarios/:id - Eliminar usuario (soft delete)
   */
  async delete(empresaId: string, usuarioId: string, currentUserId: string) {
    // No puede eliminarse a sí mismo
    if (usuarioId === currentUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    // Verificar que el usuario existe
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId },
      include: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException('No encontramos este usuario');
    }

    // No permitir eliminar el único admin
    if (usuario.rol.codigo === 'admin') {
      const adminCount = await this.prisma.usuario.count({
        where: { empresaId, rol: { codigo: 'admin' }, activo: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('No puedes eliminar al único administrador');
      }
    }

    // Soft delete
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo: false },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      message: 'Usuario eliminado correctamente',
    };
  }

  /**
   * PUT /usuarios/:id/password - Cambiar contraseña
   */
  async changePassword(
    empresaId: string,
    usuarioId: string,
    dto: ChangePasswordDto,
    currentUserId: string,
    isAdmin: boolean,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, empresaId },
    });

    if (!usuario) {
      throw new NotFoundException('No encontramos este usuario');
    }

    // Si no es admin y no es el mismo usuario, denegar
    if (!isAdmin && usuarioId !== currentUserId) {
      throw new ForbiddenException('No tienes permisos para cambiar esta contraseña');
    }

    // Si es el mismo usuario, verificar contraseña actual
    if (usuarioId === currentUserId && dto.currentPassword) {
      const isValid = await bcrypt.compare(dto.currentPassword, usuario.passwordHash);
      if (!isValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }
    }

    // Hash nueva contraseña
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { passwordHash },
    });

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }

  /**
   * Invalidar cache de usuarios
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:all`);
  }
}
