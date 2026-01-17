/**
 * @file usuario.module.ts
 * @description Modulo de usuarios y roles
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: usuarios, roles, permisos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (secciones: USUARIOS, ROLES Y PERMISOS)
 * - RBAC: ver docs/arquitectura/17-ROLES-PERMISOS-RBAC.md
 */

import { Module } from '@nestjs/common';

// Infrastructure
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';

// Services
import { UsuarioService } from '../../core/application/services/usuario.service';
import { RolService } from '../../core/application/services/rol.service';

// Controllers
import { UsuarioController } from '../http/controllers/usuario.controller';
import { RolController } from '../http/controllers/rol.controller';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [UsuarioController, RolController],
  providers: [UsuarioService, RolService],
  exports: [UsuarioService, RolService],
})
export class UsuarioModule {}
