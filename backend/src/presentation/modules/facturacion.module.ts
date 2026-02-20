/**
 * @file facturacion.module.ts
 * @description Modulo de facturacion electronica SUNAT
 *
 * Soporta multiples proveedores:
 * - Nubefact (recomendado para pruebas - sandbox gratis)
 * - Facturalo (open source, requiere infraestructura propia)
 * - Modo BETA (simulacion local sin conexion a SUNAT)
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FacturacionController } from '../http/controllers/facturacion.controller';
import { FacturacionService } from '../../core/application/services/facturacion.service';
import { NubefactService } from '../../core/application/services/nubefact.service';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FacturacionController],
  providers: [FacturacionService, NubefactService],
  exports: [FacturacionService, NubefactService],
})
export class FacturacionModule {}
