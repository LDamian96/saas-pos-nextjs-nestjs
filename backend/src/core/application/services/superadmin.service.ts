import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { CreateEmpresaManualDto } from '../dto/superadmin';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getEmpresas(query: any) {
    const where: any = {};
    if (query.estado) where.estado = query.estado;
    if (query.buscar) {
      where.OR = [
        { nombreComercial: { contains: query.buscar, mode: 'insensitive' } },
        { email: { contains: query.buscar, mode: 'insensitive' } },
        { ruc: { contains: query.buscar } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.empresa.findMany({
        where,
        select: {
          id: true,
          codigo: true,
          nombreComercial: true,
          email: true,
          ruc: true,
          plan: true,
          estado: true,
          activo: true,
          createdAt: true,
          _count: {
            select: { usuarios: true, productos: true, sucursales: true, ventas: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(query.limit) || 20,
        skip: ((Number(query.page) || 1) - 1) * (Number(query.limit) || 20),
      }),
      this.prisma.empresa.count({ where }),
    ]);

    return { data, total };
  }

  async getEmpresaDetalle(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        sucursales: { select: { id: true, nombre: true, activo: true } },
        _count: {
          select: { usuarios: true, productos: true, ventas: true, clientes: true },
        },
        suscripciones: {
          where: { estado: { in: ['activa', 'trial'] } },
          include: { plan: true },
          take: 1,
        },
      },
    });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async toggleEmpresa(id: string, activo: boolean) {
    return this.prisma.empresa.update({
      where: { id },
      data: { activo, estado: activo ? 'activo' : 'suspendido' },
    });
  }

  async getDashboard() {
    const [totalEmpresas, empresasActivas, totalUsuarios, totalVentas, ventasHoy, empresasNuevasMes] = await Promise.all([
      this.prisma.empresa.count(),
      this.prisma.empresa.count({ where: { activo: true } }),
      this.prisma.usuario.count(),
      this.prisma.venta.count(),
      this.prisma.venta.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.empresa.count({
        where: {
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      }),
    ]);

    return {
      totalEmpresas,
      empresasActivas,
      totalUsuarios,
      totalVentas,
      ventasHoy,
      empresasNuevasMes,
    };
  }

  /**
   * Listar planes disponibles para asignar al crear empresa
   */
  async getPlanes() {
    return this.prisma.plan.findMany({
      where: { activo: true },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precioMensual: true,
        precioAnual: true,
        maxSucursales: true,
        maxUsuarios: true,
        maxProductos: true,
        features: true,
        esPopular: true,
      },
      orderBy: { orden: 'asc' },
    });
  }

  /**
   * Crear empresa manualmente desde SuperAdmin
   * Para clientes que contactan por WhatsApp y pagan por Yape
   */
  async createEmpresaManual(dto: CreateEmpresaManualDto) {
    // Verificar email duplicado
    const emailExiste = await this.prisma.empresa.findFirst({
      where: { email: dto.email },
    });
    if (emailExiste) {
      throw new ConflictException('Ya existe una empresa con ese email');
    }

    // Si se especifica planId, verificar que exista
    let plan = null;
    if (dto.planId) {
      plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });
      if (!plan) {
        throw new NotFoundException('Plan no encontrado');
      }
    }

    // Generar codigo unico (EMP-XXXXX)
    const codigo = await this.generarCodigoEmpresa();

    // Generar contraseña temporal (8 caracteres alfanumericos)
    const passwordTemporal = this.generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);

    // Obtener rol admin
    const rolAdmin = await this.prisma.rol.findFirst({
      where: { codigo: 'admin' },
    });
    if (!rolAdmin) {
      throw new NotFoundException('Rol admin no encontrado');
    }

    // Crear empresa + sucursal + usuario + suscripcion en transaccion
    const resultado = await this.prisma.$transaction(async (tx) => {
      // 1. Crear empresa
      const empresa = await tx.empresa.create({
        data: {
          codigo,
          nombreComercial: dto.nombreComercial,
          email: dto.email,
          whatsapp: dto.whatsapp,
          telefono: dto.telefono,
          ruc: dto.ruc,
          plan: plan?.codigo || 'basico',
          estado: 'activo',
          activo: true,
          fechaInicioPlan: new Date(),
          maxSucursales: plan?.maxSucursales || 1,
          maxUsuarios: plan?.maxUsuarios || 2,
          // Configuracion por defecto Peru
          pais: 'Peru',
          moneda: 'PEN',
          simboloMoneda: 'S/.',
          zonaHoraria: 'America/Lima',
        },
      });

      // 1.5 Crear suscripcion si hay plan
      if (plan) {
        await tx.suscripcion.create({
          data: {
            empresaId: empresa.id,
            planId: plan.id,
            estado: 'activa',
            periodoFacturacion: 'mensual',
            fechaInicio: new Date(),
          },
        });
      }

      // 2. Crear sucursal principal
      const sucursal = await tx.sucursal.create({
        data: {
          empresaId: empresa.id,
          codigo: 'SUC-001',
          nombre: 'Sucursal Principal',
          esPrincipal: true,
          activo: true,
        },
      });

      // 3. Crear usuario admin
      const usuario = await tx.usuario.create({
        data: {
          empresaId: empresa.id,
          sucursalId: sucursal.id,
          rolId: rolAdmin.id,
          email: dto.email,
          passwordHash,
          nombre: dto.nombreComercial.split(' ')[0], // Primer nombre del negocio
          apellido: 'Admin',
          todasSucursales: true,
          activo: true,
        },
      });

      return { empresa, sucursal, usuario };
    });

    // Retornar datos para enviar por WhatsApp
    return {
      empresa: {
        id: resultado.empresa.id,
        codigo: resultado.empresa.codigo,
        nombreComercial: resultado.empresa.nombreComercial,
      },
      credenciales: {
        email: dto.email,
        password: passwordTemporal, // Solo se muestra una vez
        urlLogin: 'https://pos-saas.com/login', // Cambiar por URL real
      },
      mensajeWhatsApp: this.generarMensajeWhatsApp(
        dto.nombreComercial,
        dto.email,
        passwordTemporal,
      ),
    };
  }

  private async generarCodigoEmpresa(): Promise<string> {
    const ultima = await this.prisma.empresa.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { codigo: true },
    });

    let numero = 1;
    if (ultima?.codigo) {
      const match = ultima.codigo.match(/EMP-(\d+)/);
      if (match) {
        numero = parseInt(match[1], 10) + 1;
      }
    }

    return `EMP-${numero.toString().padStart(5, '0')}`;
  }

  private generarPasswordTemporal(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private generarMensajeWhatsApp(
    nombreEmpresa: string,
    email: string,
    password: string,
  ): string {
    return `🎉 ¡Bienvenido a POS SaaS, ${nombreEmpresa}!

Tus credenciales de acceso:
📧 Email: ${email}
🔑 Contraseña: ${password}

🔗 Ingresa aquí: https://pos-saas.com/login

⚠️ Por seguridad, cambia tu contraseña después del primer ingreso.

¿Necesitas ayuda? Responde a este mensaje y te asistimos. 💪`;
  }
}
