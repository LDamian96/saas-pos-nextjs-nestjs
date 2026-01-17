/**
 * @file cliente.service.ts
 * @description Service para gestión de clientes
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: clientes)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { CreateClienteDto } from '../dto/cliente/create-cliente.dto';
import { UpdateClienteDto } from '../dto/cliente/update-cliente.dto';
import { Prisma } from '@prisma/client';

const CACHE_TTL = {
  LIST: 300, // 5 minutos
  SINGLE: 600, // 10 minutos
};

const ERROR_MESSAGES = {
  NOT_FOUND: 'Este cliente no existe',
  DOCUMENT_EXISTS: 'Ya existe un cliente con ese numero de documento',
};

@Injectable()
export class ClienteService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Listar clientes con filtros y paginación
  async findAll(
    empresaId: string,
    options: {
      search?: string;
      tipoDocumento?: string;
      tipoCliente?: string;
      activo?: boolean;
      page?: number;
      limit?: number;
      orden?: string;
      direccion?: 'asc' | 'desc';
    },
  ) {
    const {
      search,
      tipoDocumento,
      tipoCliente,
      activo,
      page = 1,
      limit = 20,
      orden = 'nombre',
      direccion = 'asc',
    } = options;

    // Construir where
    const where: Prisma.ClienteWhereInput = {
      empresaId,
    };

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { numeroDocumento: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { whatsapp: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { razonSocial: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tipoDocumento) where.tipoDocumento = tipoDocumento;
    if (tipoCliente) where.tipoCliente = tipoCliente;
    if (activo !== undefined) where.activo = activo;

    // Contar total
    const total = await this.prisma.cliente.count({ where });

    // Obtener clientes
    const clientes = await this.prisma.cliente.findMany({
      where,
      orderBy: { [orden]: direccion },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Formatear respuesta
    const data = clientes.map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      nombreCompleto: cliente.apellido
        ? `${cliente.nombre} ${cliente.apellido}`
        : cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      razonSocial: cliente.razonSocial,
      email: cliente.email,
      telefono: cliente.telefono,
      whatsapp: cliente.whatsapp,
      direccion: cliente.direccion,
      tipoCliente: cliente.tipoCliente,
      limiteCredito: cliente.limiteCredito,
      saldoPendiente: cliente.saldoPendiente,
      activo: cliente.activo,
      createdAt: cliente.createdAt,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Obtener cliente por ID
  async findById(empresaId: string, id: string) {
    const cacheKey = `empresa_${empresaId}:clientes:${id}`;

    // Buscar en cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId },
    });

    if (!cliente) return null;

    const response = {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      nombreCompleto: cliente.apellido
        ? `${cliente.nombre} ${cliente.apellido}`
        : cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      razonSocial: cliente.razonSocial,
      email: cliente.email,
      telefono: cliente.telefono,
      whatsapp: cliente.whatsapp,
      direccion: cliente.direccion,
      fechaNacimiento: cliente.fechaNacimiento,
      tipoCliente: cliente.tipoCliente,
      limiteCredito: cliente.limiteCredito,
      saldoPendiente: cliente.saldoPendiente,
      notas: cliente.notas,
      activo: cliente.activo,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };

    // Guardar en cache
    await this.redis.set(cacheKey, response, CACHE_TTL.SINGLE);

    return response;
  }

  // Buscar por documento
  async findByDocumento(empresaId: string, numeroDocumento: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { empresaId, numeroDocumento, activo: true },
    });

    if (!cliente) return null;

    return {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      nombreCompleto: cliente.apellido
        ? `${cliente.nombre} ${cliente.apellido}`
        : cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      razonSocial: cliente.razonSocial,
      email: cliente.email,
      telefono: cliente.telefono,
      whatsapp: cliente.whatsapp,
      direccion: cliente.direccion,
    };
  }

  // Crear cliente
  async create(empresaId: string, dto: CreateClienteDto) {
    // Verificar documento único si se proporciona
    if (dto.numeroDocumento) {
      const exists = await this.prisma.cliente.findFirst({
        where: {
          empresaId,
          numeroDocumento: dto.numeroDocumento,
        },
      });

      if (exists) {
        throw new ConflictException(ERROR_MESSAGES.DOCUMENT_EXISTS);
      }
    }

    // Crear cliente
    const cliente = await this.prisma.cliente.create({
      data: {
        ...dto,
        empresaId,
        fechaNacimiento: dto.fechaNacimiento
          ? new Date(dto.fechaNacimiento)
          : null,
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);

    return this.findById(empresaId, cliente.id);
  }

  // Actualizar cliente
  async update(empresaId: string, id: string, dto: UpdateClienteDto) {
    const existing = await this.findById(empresaId, id);
    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    // Verificar documento único si se cambia
    if (dto.numeroDocumento && dto.numeroDocumento !== (existing as any).numeroDocumento) {
      const exists = await this.prisma.cliente.findFirst({
        where: {
          empresaId,
          numeroDocumento: dto.numeroDocumento,
          id: { not: id },
        },
      });

      if (exists) {
        throw new ConflictException(ERROR_MESSAGES.DOCUMENT_EXISTS);
      }
    }

    // Actualizar
    await this.prisma.cliente.update({
      where: { id },
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento
          ? new Date(dto.fechaNacimiento)
          : undefined,
      },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`empresa_${empresaId}:clientes:${id}`);

    return this.findById(empresaId, id);
  }

  // Eliminar cliente (soft delete)
  async delete(empresaId: string, id: string) {
    const existing = (await this.findById(empresaId, id)) as { activo?: boolean } | null;

    if (!existing || !existing.activo) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    await this.prisma.cliente.update({
      where: { id },
      data: { activo: false },
    });

    // Invalidar cache
    await this.invalidateCache(empresaId);
    await this.redis.del(`empresa_${empresaId}:clientes:${id}`);

    return { success: true };
  }

  // Obtener estadísticas de clientes
  async getEstadisticas(empresaId: string) {
    const [total, activos, porTipo] = await Promise.all([
      this.prisma.cliente.count({ where: { empresaId } }),
      this.prisma.cliente.count({ where: { empresaId, activo: true } }),
      this.prisma.cliente.groupBy({
        by: ['tipoCliente'],
        where: { empresaId, activo: true },
        _count: { id: true },
      }),
    ]);

    // Contar clientes con crédito (limiteCredito > 0)
    const conCredito = await this.prisma.cliente.count({
      where: { empresaId, limiteCredito: { gt: 0 }, activo: true },
    });

    return {
      total,
      activos,
      inactivos: total - activos,
      conCredito,
      porTipo: porTipo.map((n) => ({
        tipo: n.tipoCliente,
        cantidad: n._count.id,
      })),
    };
  }

  // Invalidar cache
  private async invalidateCache(empresaId: string) {
    try {
      await this.redis.delPattern(`empresa_${empresaId}:clientes:*`);
    } catch {
      // Ignorar errores de cache
    }
  }
}
