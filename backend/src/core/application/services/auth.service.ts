/**
 * @file auth.service.ts
 * @description Servicio de autenticacion con JWT y HTTPOnly cookies
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: usuarios, empresas, roles)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: AUTH)
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';

import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { cookieConfig, securityConfig, jwtConfig } from '../../../config/jwt.config';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from '../dto/auth';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Login de usuario
   * @returns Usuario y setea cookies HTTPOnly
   */
  async login(dto: LoginDto, res: Response) {
    // 1. Buscar usuario por email
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true,
              },
            },
          },
        },
        empresa: true,
        sucursal: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // 2. Verificar si esta bloqueado
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Tu cuenta esta bloqueada. Intenta en ${minutosRestantes} minutos`,
      );
    }

    // 3. Verificar si esta activo
    if (!usuario.activo) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // 4. Verificar password
    const passwordValid = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValid) {
      await this.incrementarIntentosFallidos(usuario.id, usuario.intentosFallidos);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // 5. Resetear intentos fallidos y actualizar ultimo login
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoLogin: new Date(),
      },
    });

    // 6. Generar tokens
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      sucursalId: usuario.sucursalId,
      rol: usuario.rol.codigo,
      nivel: usuario.rol.nivel,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: jwtConfig.accessToken.expiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: usuario.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET') || jwtConfig.refreshToken.secret,
        expiresIn: jwtConfig.refreshToken.expiresIn,
      },
    );

    // 7. Guardar refresh token hasheado en BD
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { refreshToken: refreshTokenHash },
    });

    // 8. Setear cookies HTTPOnly
    res.cookie('access_token', accessToken, cookieConfig.accessToken);
    res.cookie('refresh_token', refreshToken, cookieConfig.refreshToken);

    // 9. Extraer permisos
    const permisos = usuario.rol.permisos.map((rp) => rp.permiso.codigo);

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          avatar: usuario.avatar,
          rol: {
            id: usuario.rol.id,
            codigo: usuario.rol.codigo,
            nombre: usuario.rol.nombre,
            nivel: usuario.rol.nivel,
          },
          empresa: usuario.empresa
            ? {
                id: usuario.empresa.id,
                nombre: usuario.empresa.nombreComercial,
                slug: usuario.empresa.subdominio,
              }
            : null,
          sucursal: usuario.sucursal
            ? {
                id: usuario.sucursal.id,
                nombre: usuario.sucursal.nombre,
              }
            : null,
          permisos,
        },
      },
    };
  }

  /**
   * Registro de empresa + usuario admin
   */
  async register(dto: RegisterDto, res: Response) {
    // 1. Verificar que el email no existe
    const existingUser = await this.prisma.usuario.findFirst({
      where: { email: dto.usuario.email },
    });

    if (existingUser) {
      throw new ConflictException(ERROR_MESSAGES.DUPLICATE_EMAIL);
    }

    // 2. Verificar que el RUC no existe (si se proporciono)
    if (dto.empresa.ruc) {
      const existingEmpresa = await this.prisma.empresa.findFirst({
        where: { ruc: dto.empresa.ruc },
      });

      if (existingEmpresa) {
        throw new ConflictException('Este RUC ya esta registrado');
      }
    }

    // 3. Obtener rol admin del sistema
    const rolAdmin = await this.prisma.rol.findFirst({
      where: { codigo: 'admin', esSistema: true },
    });

    if (!rolAdmin) {
      throw new BadRequestException('Error de configuracion del sistema');
    }

    // 4. Hashear password
    const passwordHash = await bcrypt.hash(dto.usuario.password, securityConfig.passwordSaltRounds);

    // 5. Crear empresa, sucursal y usuario en transaccion
    const result = await this.prisma.$transaction(async (prisma) => {
      // Generar codigo y subdominio para empresa
      const codigo = this.generateCodigo();
      const subdominio = this.generateSlug(dto.empresa.nombre);

      // Crear empresa
      const empresa = await prisma.empresa.create({
        data: {
          codigo,
          nombreComercial: dto.empresa.nombre,
          subdominio,
          ruc: dto.empresa.ruc,
          email: dto.empresa.email || dto.usuario.email,
          telefono: dto.empresa.telefono,
          plan: 'trial',
          activo: true,
        },
      });

      // Crear sucursal principal
      const sucursal = await prisma.sucursal.create({
        data: {
          empresaId: empresa.id,
          codigo: 'PRINCIPAL',
          nombre: 'Principal',
          esPrincipal: true,
          activo: true,
        },
      });

      // Crear usuario admin
      const usuario = await prisma.usuario.create({
        data: {
          empresaId: empresa.id,
          sucursalId: sucursal.id,
          rolId: rolAdmin.id,
          email: dto.usuario.email,
          passwordHash,
          nombre: dto.usuario.nombre,
          apellido: dto.usuario.apellido,
          todasSucursales: true,
          activo: true,
        },
        include: {
          rol: true,
        },
      });

      return { empresa, sucursal, usuario };
    });

    // 6. Hacer login automatico despues del registro
    const loginResult = await this.login(
      { email: dto.usuario.email, password: dto.usuario.password },
      res,
    );

    return {
      success: true,
      data: {
        empresa: {
          id: result.empresa.id,
          nombre: result.empresa.nombreComercial,
          slug: result.empresa.subdominio,
        },
        usuario: loginResult.data.usuario,
        sucursal: {
          id: result.sucursal.id,
          nombre: result.sucursal.nombre,
        },
      },
      message: 'Empresa registrada correctamente',
    };
  }

  /**
   * Refrescar access token usando refresh token de cookie
   */
  async refresh(refreshTokenFromCookie: string, res: Response) {
    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    try {
      // 1. Verificar refresh token
      const payload = this.jwtService.verify(refreshTokenFromCookie, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || jwtConfig.refreshToken.secret,
      });

      // 2. Buscar usuario
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        include: {
          rol: {
            include: {
              permisos: {
                include: {
                  permiso: true,
                },
              },
            },
          },
        },
      });

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // 3. Verificar que el refresh token coincide
      if (!usuario.refreshToken) {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
      }

      const tokenValid = await bcrypt.compare(refreshTokenFromCookie, usuario.refreshToken);
      if (!tokenValid) {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
      }

      // 4. Generar nuevo access token
      const newPayload = {
        sub: usuario.id,
        email: usuario.email,
        empresaId: usuario.empresaId,
        sucursalId: usuario.sucursalId,
        rol: usuario.rol.codigo,
        nivel: usuario.rol.nivel,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: jwtConfig.accessToken.expiresIn,
      });

      // 5. Setear nueva cookie
      res.cookie('access_token', accessToken, cookieConfig.accessToken);

      return {
        success: true,
        message: 'Token renovado correctamente',
      };
    } catch (error) {
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
  }

  /**
   * Logout - Limpiar cookies y refresh token
   */
  async logout(userId: string, res: Response) {
    // Limpiar refresh token en BD
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Limpiar cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });

    return {
      success: true,
      message: 'Sesion cerrada correctamente',
    };
  }

  /**
   * Logout simple - Solo limpia cookies (sin autenticacion requerida)
   */
  async logoutSimple(res: Response) {
    // Limpiar cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });

    return {
      success: true,
      message: 'Sesion cerrada correctamente',
    };
  }

  /**
   * Obtener usuario actual
   */
  async getMe(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: {
          include: {
            permisos: {
              include: {
                permiso: true,
              },
            },
          },
        },
        empresa: true,
        sucursal: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const permisos = usuario.rol.permisos.map((rp) => rp.permiso.codigo);

    return {
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          avatar: usuario.avatar,
          rol: {
            id: usuario.rol.id,
            codigo: usuario.rol.codigo,
            nombre: usuario.rol.nombre,
            nivel: usuario.rol.nivel,
          },
          empresa: usuario.empresa
            ? {
                id: usuario.empresa.id,
                nombre: usuario.empresa.nombreComercial,
                slug: usuario.empresa.subdominio,
              }
            : null,
          sucursal: usuario.sucursal
            ? {
                id: usuario.sucursal.id,
                nombre: usuario.sucursal.nombre,
              }
            : null,
          permisos,
          permisosEspeciales: {
            descuentoMaximo: usuario.descuentoMaximo,
            puedeAnularVenta: usuario.puedeAnularVenta,
            puedeVerCostos: usuario.puedeVerCostos,
            puedeVerUtilidades: usuario.puedeVerUtilidades,
            puedeModificarPrecios: usuario.puedeModificarPrecios,
          },
        },
      },
    };
  }

  /**
   * Solicitar reset de password
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email },
    });

    // Por seguridad, siempre retornamos exito aunque el email no exista
    if (!usuario) {
      return {
        success: true,
        message: 'Si el correo existe, recibiras instrucciones para recuperar tu contrasena',
      };
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(resetToken, 10);
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tokenResetPassword: tokenHash,
        tokenResetExpira: expira,
      },
    });

    // TODO: Enviar email con el token
    // En desarrollo, loguear el token
    if (this.configService.get('NODE_ENV') === 'development') {
      console.log(`Reset token para ${dto.email}: ${resetToken}`);
    }

    return {
      success: true,
      message: 'Si el correo existe, recibiras instrucciones para recuperar tu contrasena',
    };
  }

  /**
   * Cambiar password con token de reset
   */
  async resetPassword(dto: ResetPasswordDto) {
    // Verificar que las contrasenas coincidan
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contrasenas no coinciden');
    }

    // Buscar usuario con token valido
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        tokenResetExpira: {
          gt: new Date(),
        },
      },
    });

    // Verificar token
    let usuarioValido = null;
    for (const usuario of usuarios) {
      if (usuario.tokenResetPassword) {
        const tokenValid = await bcrypt.compare(dto.token, usuario.tokenResetPassword);
        if (tokenValid) {
          usuarioValido = usuario;
          break;
        }
      }
    }

    if (!usuarioValido) {
      throw new BadRequestException('El enlace ha expirado. Solicita uno nuevo');
    }

    // Actualizar password
    const passwordHash = await bcrypt.hash(dto.password, securityConfig.passwordSaltRounds);

    await this.prisma.usuario.update({
      where: { id: usuarioValido.id },
      data: {
        passwordHash,
        tokenResetPassword: null,
        tokenResetExpira: null,
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    });

    return {
      success: true,
      message: 'Contrasena actualizada correctamente',
    };
  }

  // =====================
  // Metodos privados
  // =====================

  private async incrementarIntentosFallidos(userId: string, intentosActuales: number) {
    const intentos = intentosActuales + 1;
    const bloqueadoHasta =
      intentos >= securityConfig.maxLoginAttempts
        ? new Date(Date.now() + securityConfig.lockoutDuration)
        : null;

    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta,
      },
    });
  }

  private generateSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y especiales por guiones
      .replace(/^-+|-+$/g, '') // Quitar guiones al inicio y final
      .substring(0, 50); // Limitar longitud
  }

  private generateCodigo(): string {
    // Generar codigo de empresa: EMP-XXXXXX
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EMP-${random}`;
  }
}
