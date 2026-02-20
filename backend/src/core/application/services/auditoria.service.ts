/**
 * @file auditoria.service.ts
 * @description Servicio para gestión de auditoria del sistema
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: auditoria_acciones, auditoria_roles)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

export interface CreateAuditoriaAccionDto {
  empresaId?: string;
  usuarioId: string;
  usuarioNombre?: string;
  usuarioRol?: string;
  modulo: string;
  accion: string;
  entidadId?: string;
  entidadTipo?: string;
  descripcion: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  sucursalId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  exitoso?: boolean;
  errorMensaje?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registrar una accion en el log de auditoria
   */
  async registrarAccion(dto: CreateAuditoriaAccionDto) {
    return this.prisma.auditoriaAccion.create({
      data: {
        empresaId: dto.empresaId || null,
        usuarioId: dto.usuarioId,
        usuarioNombre: dto.usuarioNombre || null,
        usuarioRol: dto.usuarioRol || null,
        modulo: dto.modulo,
        accion: dto.accion,
        entidadId: dto.entidadId || null,
        entidadTipo: dto.entidadTipo || null,
        descripcion: dto.descripcion,
        datosAnteriores: dto.datosAnteriores || null,
        datosNuevos: dto.datosNuevos || null,
        sucursalId: dto.sucursalId || null,
        ipAddress: dto.ipAddress || null,
        userAgent: dto.userAgent || null,
        requestId: dto.requestId || null,
        exitoso: dto.exitoso ?? true,
        errorMensaje: dto.errorMensaje || null,
      },
    });
  }

  /**
   * GET /auditoria - Listar acciones de auditoria
   */
  async findAll(empresaId: string, query?: {
    modulo?: string;
    accion?: string;
    usuarioId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { empresaId };
    if (query?.modulo) where.modulo = query.modulo;
    if (query?.accion) where.accion = query.accion;
    if (query?.usuarioId) where.usuarioId = query.usuarioId;
    if (query?.fechaDesde || query?.fechaHasta) {
      where.createdAt = {};
      if (query.fechaDesde) where.createdAt.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) where.createdAt.lte = new Date(query.fechaHasta);
    }

    const [acciones, total] = await Promise.all([
      this.prisma.auditoriaAccion.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.auditoriaAccion.count({ where }),
    ]);

    return {
      success: true,
      data: acciones,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /auditoria/roles - Listar auditoria de roles
   */
  async findRolesLog(empresaId: string, query?: {
    usuarioId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { empresaId };
    if (query?.usuarioId) where.usuarioId = query.usuarioId;

    const [logs, total] = await Promise.all([
      this.prisma.auditoriaRol.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.auditoriaRol.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * GET /auditoria/resumen - Resumen de actividad
   */
  async getResumen(empresaId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalHoy, totalSemana, porModulo] = await Promise.all([
      this.prisma.auditoriaAccion.count({
        where: { empresaId, createdAt: { gte: today } },
      }),
      this.prisma.auditoriaAccion.count({
        where: {
          empresaId,
          createdAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.auditoriaAccion.groupBy({
        by: ['modulo'],
        where: { empresaId, createdAt: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        _count: true,
        orderBy: { _count: { modulo: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      success: true,
      data: {
        accionesHoy: totalHoy,
        accionesSemana: totalSemana,
        porModulo: porModulo.map((m) => ({ modulo: m.modulo, total: m._count })),
      },
    };
  }
}
