/**
 * @file jwt.strategy.ts
 * @description Estrategia JWT para Passport - Extrae token de cookie HTTPOnly
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: usuarios)
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import { UserPayload } from '../decorators/current-user.decorator';

export interface JwtPayload {
  sub: string; // usuario id
  email: string;
  empresaId: string | null;
  sucursalId: string | null;
  rol: string;
  nivel: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      // Extraer token de cookie HTTPOnly
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
        // Fallback: tambien aceptar desde header Authorization (para testing/mobile)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    // Verificar que el usuario existe y esta activo
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

    if (!usuario) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Verificar si esta bloqueado
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Extraer permisos del rol
    const permisos = usuario.rol.permisos.map((rp) => rp.permiso.codigo);

    // Retornar payload del usuario
    return {
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      sucursalId: usuario.sucursalId,
      rol: usuario.rol.codigo,
      nivel: usuario.rol.nivel,
      permisos,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };
  }
}
