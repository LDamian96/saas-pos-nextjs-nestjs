import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ====== PLANES ======
  async findPlanes() {
    return this.prisma.plan.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  }

  async findAllPlanes() {
    return this.prisma.plan.findMany({ orderBy: { orden: 'asc' } });
  }

  async createPlan(data: any) {
    return this.prisma.plan.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioMensual: data.precioMensual || 0,
        precioAnual: data.precioAnual || 0,
        maxSucursales: data.maxSucursales || 1,
        maxUsuarios: data.maxUsuarios || 2,
        maxProductos: data.maxProductos || 500,
        features: data.features,
        activo: data.activo ?? true,
        esPopular: data.esPopular ?? false,
        orden: data.orden || 0,
      },
    });
  }

  async updatePlan(id: string, data: any) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    return this.prisma.plan.update({
      where: { id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioMensual: data.precioMensual,
        precioAnual: data.precioAnual,
        maxSucursales: data.maxSucursales,
        maxUsuarios: data.maxUsuarios,
        maxProductos: data.maxProductos,
        features: data.features,
        activo: data.activo,
        esPopular: data.esPopular,
        orden: data.orden,
      },
    });
  }

  async deletePlan(id: string) {
    const subs = await this.prisma.suscripcion.count({
      where: { planId: id, estado: 'activa' },
    });
    if (subs > 0) throw new BadRequestException('No se puede eliminar un plan con suscripciones activas');
    return this.prisma.plan.delete({ where: { id } });
  }

  // ====== SUSCRIPCIONES ======
  async findSuscripcion(empresaId: string) {
    return this.prisma.suscripcion.findFirst({
      where: { empresaId, estado: { in: ['activa', 'trial'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllSuscripciones(query: any) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;

    const [data, total] = await Promise.all([
      this.prisma.suscripcion.findMany({
        where,
        include: { plan: true, empresa: { select: { id: true, nombreComercial: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: Number(query.limit) || 20,
        skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20),
      }),
      this.prisma.suscripcion.count({ where }),
    ]);

    return { data, total };
  }

  async createSuscripcion(empresaId: string, data: any) {
    const plan = await this.prisma.plan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Cancel existing subscription
    await this.prisma.suscripcion.updateMany({
      where: { empresaId, estado: { in: ['activa', 'trial'] } },
      data: { estado: 'cancelada', fechaCancelacion: new Date() },
    });

    const precio = data.periodoFacturacion === 'anual' ? plan.precioAnual : plan.precioMensual;

    return this.prisma.suscripcion.create({
      data: {
        empresaId,
        planId: data.planId,
        estado: data.trial ? 'trial' : 'activa',
        periodoFacturacion: data.periodoFacturacion || 'mensual',
        fechaInicio: new Date(),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        trialHasta: data.trial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        precioActual: precio,
        moneda: data.moneda || 'PEN',
      },
      include: { plan: true },
    });
  }

  async cancelarSuscripcion(empresaId: string) {
    return this.prisma.suscripcion.updateMany({
      where: { empresaId, estado: { in: ['activa', 'trial'] } },
      data: { estado: 'cancelada', fechaCancelacion: new Date() },
    });
  }

  // ====== RESUMEN ADMIN ======
  async getResumenBilling() {
    const [totalActivas, totalTrial, totalCanceladas, totalEmpresas, ingresoPorPlan] = await Promise.all([
      this.prisma.suscripcion.count({ where: { estado: 'activa' } }),
      this.prisma.suscripcion.count({ where: { estado: 'trial' } }),
      this.prisma.suscripcion.count({ where: { estado: 'cancelada' } }),
      this.prisma.empresa.count(),
      this.prisma.suscripcion.groupBy({
        by: ['planId'],
        where: { estado: 'activa' },
        _count: true,
        _sum: { precioActual: true },
      }),
    ]);

    return {
      totalActivas,
      totalTrial,
      totalCanceladas,
      totalEmpresas,
      ingresoPorPlan,
    };
  }
}
