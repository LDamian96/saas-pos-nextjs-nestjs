import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class LandingService {
  constructor(private prisma: PrismaService) {}

  async findSecciones(empresaId: string) {
    return this.prisma.landingSeccion.findMany({
      where: { empresaId },
      orderBy: { orden: 'asc' },
    });
  }

  async createSeccion(empresaId: string, data: any) {
    const count = await this.prisma.landingSeccion.count({ where: { empresaId } });
    return this.prisma.landingSeccion.create({
      data: {
        empresaId,
        tipo: data.tipo,
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        contenido: data.contenido,
        imagen: data.imagen,
        orden: data.orden ?? count,
        activo: data.activo ?? true,
        estilos: data.estilos,
      },
    });
  }

  async updateSeccion(empresaId: string, id: string, data: any) {
    const seccion = await this.prisma.landingSeccion.findFirst({
      where: { id, empresaId },
    });
    if (!seccion) throw new NotFoundException('Seccion no encontrada');

    return this.prisma.landingSeccion.update({
      where: { id },
      data: {
        tipo: data.tipo,
        titulo: data.titulo,
        subtitulo: data.subtitulo,
        contenido: data.contenido,
        imagen: data.imagen,
        orden: data.orden,
        activo: data.activo,
        estilos: data.estilos,
      },
    });
  }

  async deleteSeccion(empresaId: string, id: string) {
    const seccion = await this.prisma.landingSeccion.findFirst({
      where: { id, empresaId },
    });
    if (!seccion) throw new NotFoundException('Seccion no encontrada');
    return this.prisma.landingSeccion.delete({ where: { id } });
  }

  async reorderSecciones(empresaId: string, ids: string[]) {
    const updates = ids.map((id, index) =>
      this.prisma.landingSeccion.updateMany({
        where: { id, empresaId },
        data: { orden: index },
      })
    );
    await this.prisma.$transaction(updates);
    return this.findSecciones(empresaId);
  }

  // Contactos
  async findContactos(empresaId: string, query: any) {
    const where: any = { empresaId };
    if (query.leido !== undefined) where.leido = query.leido === 'true';

    const [data, total] = await Promise.all([
      this.prisma.landingContacto.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(query.limit) || 20,
        skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20),
      }),
      this.prisma.landingContacto.count({ where }),
    ]);

    return { data, total };
  }

  async marcarLeido(empresaId: string, id: string) {
    return this.prisma.landingContacto.updateMany({
      where: { id, empresaId },
      data: { leido: true },
    });
  }
}
