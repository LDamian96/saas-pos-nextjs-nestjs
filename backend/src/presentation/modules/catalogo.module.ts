/**
 * @file catalogo.module.ts
 * @description Módulo de Catálogos (Categorías, Marcas, Atributos)
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from '../../infrastructure/cache/redis.module';
import { AuthModule } from './auth.module';

// Services
import { CategoriaService } from '../../core/application/services/categoria.service';
import { MarcaService } from '../../core/application/services/marca.service';
import { AtributoService } from '../../core/application/services/atributo.service';
import { UnidadMedidaService } from '../../core/application/services/unidad-medida.service';

// Controllers
import { CategoriaController } from '../http/controllers/categoria.controller';
import { MarcaController } from '../http/controllers/marca.controller';
import { AtributoController } from '../http/controllers/atributo.controller';
import { UnidadMedidaController } from '../http/controllers/unidad-medida.controller';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule],
  providers: [CategoriaService, MarcaService, AtributoService, UnidadMedidaService],
  controllers: [CategoriaController, MarcaController, AtributoController, UnidadMedidaController],
  exports: [CategoriaService, MarcaService, AtributoService, UnidadMedidaService],
})
export class CatalogoModule {}
