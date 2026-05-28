/**
 * @file main.ts
 * @description Entry point de la aplicacion NestJS
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 * - Configuracion: ver docs/arquitectura/01-STACK-TECNOLOGICO.md
 */

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Seguridad: Helmet para headers HTTP seguros
  app.use(helmet());

  // Cookies para JWT HTTPOnly
  app.use(cookieParser(configService.get('COOKIE_SECRET')));

  // CORS configurado para frontend
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081', // Expo dev
    configService.get('FRONTEND_URL'),
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow expo tunnel URLs
      if (origin.includes('expo') || origin.includes('ngrok')) return callback(null, true);
      callback(null, true); // Allow all for now (mobile app uses Bearer tokens, not cookies)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // Servir archivos estaticos (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Prefijo global para API
  app.setGlobalPrefix('api/v1');

  // Validacion global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina campos no definidos en DTO
      forbidNonWhitelisted: true, // Error si hay campos extra
      transform: true, // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger - Solo en desarrollo
  if (configService.get('NODE_ENV') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('POS SaaS API')
      .setDescription('API del Sistema de Punto de Venta SaaS Multi-Tenant')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('access_token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║           POS SaaS Backend - NestJS                   ║
  ╠═══════════════════════════════════════════════════════╣
  ║  Server:      http://localhost:${port}                   ║
  ║  API:         http://localhost:${port}/api/v1            ║
  ║  Swagger:     http://localhost:${port}/api/docs          ║
  ║  Environment: ${configService.get('NODE_ENV') || 'development'}                        ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}
bootstrap();
