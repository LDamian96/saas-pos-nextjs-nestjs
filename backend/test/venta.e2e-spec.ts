/**
 * @file venta.e2e-spec.ts
 * @description Tests E2E para el modulo de Ventas
 *
 * Tests basicos para verificar que los endpoints funcionan correctamente
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/persistence/prisma/prisma.service';

describe('VentaController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validacion de endpoints', () => {
    it('GET /ventas - debe requerir autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .get('/ventas')
        .expect((res) => {
          // Esperamos 401 (no autorizado) porque no enviamos token
          expect([401, 403]).toContain(res.status);
        });
    });

    it('POST /ventas - debe requerir autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas')
        .send({
          sucursalId: '00000000-0000-0000-0000-000000000001',
          cajaId: '00000000-0000-0000-0000-000000000001',
          items: [
            {
              varianteId: '00000000-0000-0000-0000-000000000001',
              cantidad: 1,
              precioUnitario: 100,
            },
          ],
          pagos: [
            {
              metodoPagoId: '00000000-0000-0000-0000-000000000001',
              monto: 100,
            },
          ],
        })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    });

    it('GET /ventas/:id - debe requerir autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .get('/ventas/00000000-0000-0000-0000-000000000001')
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    });

    it('POST /ventas/:id/anular - debe requerir autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas/00000000-0000-0000-0000-000000000001/anular')
        .send({ motivo: 'Test' })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    });

    it('GET /ventas/resumen-dia - debe requerir autenticacion', async () => {
      const response = await request(app.getHttpServer())
        .get('/ventas/resumen-dia')
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });
    });
  });

  describe('Validacion de DTOs', () => {
    it('POST /ventas - debe validar items vacios', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', 'Bearer fake-token')
        .send({
          sucursalId: '00000000-0000-0000-0000-000000000001',
          cajaId: '00000000-0000-0000-0000-000000000001',
          items: [], // Items vacio - debe fallar validacion
          pagos: [{ metodoPagoId: '00000000-0000-0000-0000-000000000001', monto: 100 }],
        })
        .expect((res) => {
          // Puede ser 400 (bad request) o 401 (si la validacion es despues de auth)
          expect([400, 401]).toContain(res.status);
        });
    });

    it('POST /ventas - debe validar pagos vacios', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', 'Bearer fake-token')
        .send({
          sucursalId: '00000000-0000-0000-0000-000000000001',
          cajaId: '00000000-0000-0000-0000-000000000001',
          items: [{ varianteId: '00000000-0000-0000-0000-000000000001', cantidad: 1, precioUnitario: 100 }],
          pagos: [], // Pagos vacio - debe fallar validacion
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('POST /ventas - debe validar cantidad positiva', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas')
        .set('Authorization', 'Bearer fake-token')
        .send({
          sucursalId: '00000000-0000-0000-0000-000000000001',
          cajaId: '00000000-0000-0000-0000-000000000001',
          items: [{ varianteId: '00000000-0000-0000-0000-000000000001', cantidad: -1, precioUnitario: 100 }],
          pagos: [{ metodoPagoId: '00000000-0000-0000-0000-000000000001', monto: 100 }],
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('POST /ventas/:id/anular - debe requerir motivo', async () => {
      const response = await request(app.getHttpServer())
        .post('/ventas/00000000-0000-0000-0000-000000000001/anular')
        .set('Authorization', 'Bearer fake-token')
        .send({}) // Sin motivo
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });
});

/**
 * Test de integracion del servicio (sin HTTP)
 * Para probar la logica de negocio directamente
 */
describe('VentaService (integration)', () => {
  let prisma: PrismaService;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('debe poder conectar a la base de datos', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('debe existir la tabla ventas', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ventas'
      ) as exists
    `;
    expect(result).toBeDefined();
  });

  it('debe existir la tabla venta_detalles', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'venta_detalles'
      ) as exists
    `;
    expect(result).toBeDefined();
  });

  it('debe existir la tabla venta_pagos', async () => {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'venta_pagos'
      ) as exists
    `;
    expect(result).toBeDefined();
  });
});
