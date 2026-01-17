/**
 * @file auth.module.ts
 * @description Modulo de autenticacion completo
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 * - Roles: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: AUTH)
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Infrastructure
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';

// Strategies
import { JwtStrategy } from '../http/strategies/jwt.strategy';

// Guards
import { JwtAuthGuard } from '../http/guards/jwt-auth.guard';
import { TenantGuard } from '../http/guards/tenant.guard';
import { PermissionsGuard } from '../http/guards/permissions.guard';
import { RolesGuard } from '../http/guards/roles.guard';

// Services
import { AuthService } from '../../core/application/services/auth.service';

// Controllers
import { AuthController } from '../http/controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    // Strategies
    JwtStrategy,

    // Services
    AuthService,

    // Guards (disponibles para inyeccion, pero NO globales aqui)
    JwtAuthGuard,
    TenantGuard,
    PermissionsGuard,
    RolesGuard,
  ],
  exports: [JwtModule, AuthService, JwtAuthGuard, TenantGuard, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
