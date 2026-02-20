/**
 * @file app.module.ts
 * @description Modulo raiz de la aplicacion
 *
 * @references
 * - Estructura: ver docs/arquitectura/02-ESTRUCTURA-PROYECTO.md
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Infrastructure
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';

// Presentation Modules
import { AuthModule } from './presentation/modules/auth.module';
import { EmpresaModule } from './presentation/modules/empresa.module';
import { CatalogoModule } from './presentation/modules/catalogo.module';
import { ProductoModule } from './presentation/modules/producto.module';
import { HealthModule } from './presentation/modules/health.module';
import { InventarioModule } from './presentation/modules/inventario.module';
import { VentaModule } from './presentation/modules/venta.module';
import { UsuarioModule } from './presentation/modules/usuario.module';
import { CajaModule } from './presentation/modules/caja.module';
import { ClienteModule } from './presentation/modules/cliente.module';
import { ReportesModule } from './presentation/modules/reportes.module';
import { MetodoPagoModule } from './presentation/modules/metodo-pago.module';
import { PromocionModule } from './presentation/modules/promocion.module';
import { ProveedorModule } from './presentation/modules/proveedor.module';
import { CompraModule } from './presentation/modules/compra.module';
import { PagoProveedorModule } from './presentation/modules/pago-proveedor.module';
import { AuditoriaModule } from './presentation/modules/auditoria.module';
import { ExportImportModule } from './presentation/modules/export-import.module';
import { PdfModule } from './presentation/modules/pdf.module';
import { QrModule } from './presentation/modules/qr.module';
import { RolModule } from './presentation/modules/rol.module';
import { LandingModule } from './presentation/modules/landing.module';
import { SeoModule } from './presentation/modules/seo.module';
import { BillingModule } from './presentation/modules/billing.module';
import { SuperAdminModule } from './presentation/modules/superadmin.module';
import { FacturacionModule } from './presentation/modules/facturacion.module';

@Module({
  imports: [
    // Configuracion global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting - Proteccion contra DDoS
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requests
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 50, // 50 requests
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),

    // Infrastructure
    PrismaModule,
    RedisModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    EmpresaModule,
    UsuarioModule,
    CatalogoModule,
    ProductoModule,
    InventarioModule,
    VentaModule,
    CajaModule,
    ClienteModule,
    ReportesModule,
    MetodoPagoModule,
    PromocionModule,
    ProveedorModule,
    CompraModule,
    PagoProveedorModule,
    AuditoriaModule,
    ExportImportModule,
    PdfModule,
    QrModule,
    RolModule,
    LandingModule,
    SeoModule,
    BillingModule,
    SuperAdminModule,
    FacturacionModule,
  ],
})
export class AppModule {}
