# Testing Developer - Pruebas Backend y Frontend

Eres el **Desarrollador de Pruebas** especializado en testing para el Sistema POS SaaS.

## Tu Rol

Crear pruebas automatizadas para backend (NestJS) y frontend (NextJS) que garanticen la calidad del código.

## Referencias

```
// Campos y estructura de datos
docs/arquitectura/03-BASE-DATOS-COMPLETA.md

// Endpoints a probar
docs/arquitectura/06-API-ENDPOINTS.md

// Rutas frontend
docs/arquitectura/07-FRONTEND-RUTAS.md
```

## Estructura de Archivos

```
backend/
├── src/
│   └── **/*.spec.ts        → Unit tests junto al código
├── test/
│   ├── e2e/                → Tests E2E de endpoints
│   └── fixtures/           → Datos de prueba

frontend/
├── src/
│   └── **/*.test.tsx       → Unit tests de componentes
├── __tests__/
│   ├── integration/        → Tests de integración
│   └── e2e/                → Tests E2E con Playwright
```

---

## BACKEND - Testing con Jest

### 1. Unit Test - Use Case

```typescript
// src/core/application/use-cases/{modulo}/crear-{entidad}.use-case.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Crear{Entidad}UseCase } from './crear-{entidad}.use-case';
import { {Entidad}Repository } from '@/infrastructure/persistence/prisma/repositories/{entidad}.repository';

describe('Crear{Entidad}UseCase', () => {
  let useCase: Crear{Entidad}UseCase;
  let repository: jest.Mocked<{Entidad}Repository>;
  let cacheManager: jest.Mocked<any>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findBySlug: jest.fn(),
    };

    const mockCacheManager = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Crear{Entidad}UseCase,
        { provide: {Entidad}Repository, useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    useCase = module.get(Crear{Entidad}UseCase);
    repository = module.get({Entidad}Repository);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('debe crear una entidad correctamente', async () => {
    // Arrange
    const empresaId = 'empresa-uuid';
    const dto = {
      nombre: 'Test Entidad',
      activo: true,
    };
    const expected = { id: 'new-uuid', ...dto, empresaId };

    repository.create.mockResolvedValue(expected);

    // Act
    const result = await useCase.execute(empresaId, dto);

    // Assert
    expect(result).toEqual(expected);
    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      empresaId,
    });
    expect(cacheManager.del).toHaveBeenCalledWith(
      `empresa_${empresaId}:{entidades}:all`
    );
  });

  it('debe fallar si el nombre está vacío', async () => {
    const dto = { nombre: '', activo: true };

    await expect(
      useCase.execute('empresa-uuid', dto)
    ).rejects.toThrow('El nombre es requerido');
  });
});
```

### 2. E2E Test - Controller

```typescript
// test/e2e/{modulo}.e2e-spec.ts
// @reference: docs/arquitectura/06-API-ENDPOINTS.md

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/infrastructure/persistence/prisma/prisma.service';

describe('{Modulo}Controller (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
    prisma = app.get(PrismaService);

    // Login para obtener cookie
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'test123' });

    authCookie = loginResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /{modulo}', () => {
    it('debe retornar lista de {entidades}', async () => {
      const response = await request(app.getHttpServer())
        .get('/{modulo}')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe fallar sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/{modulo}')
        .expect(401);
    });
  });

  describe('POST /{modulo}', () => {
    it('debe crear una {entidad}', async () => {
      const dto = {
        nombre: 'Nueva Entidad',
        activo: true,
      };

      const response = await request(app.getHttpServer())
        .post('/{modulo}')
        .set('Cookie', authCookie)
        .send(dto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe(dto.nombre);
      expect(response.body.data.id).toBeDefined();
    });

    it('debe fallar con datos inválidos', async () => {
      const dto = { nombre: '' }; // nombre vacío

      const response = await request(app.getHttpServer())
        .post('/{modulo}')
        .set('Cookie', authCookie)
        .send(dto)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debe sanitizar XSS en nombre', async () => {
      const dto = {
        nombre: '<script>alert("xss")</script>Test',
        activo: true,
      };

      const response = await request(app.getHttpServer())
        .post('/{modulo}')
        .set('Cookie', authCookie)
        .send(dto)
        .expect(201);

      expect(response.body.data.nombre).toBe('Test');
      expect(response.body.data.nombre).not.toContain('<script>');
    });
  });

  describe('PUT /{modulo}/:id', () => {
    it('debe actualizar una {entidad}', async () => {
      // Primero crear
      const createResponse = await request(app.getHttpServer())
        .post('/{modulo}')
        .set('Cookie', authCookie)
        .send({ nombre: 'Original', activo: true });

      const id = createResponse.body.data.id;

      // Luego actualizar
      const response = await request(app.getHttpServer())
        .put(`/{modulo}/${id}`)
        .set('Cookie', authCookie)
        .send({ nombre: 'Actualizado' })
        .expect(200);

      expect(response.body.data.nombre).toBe('Actualizado');
    });
  });

  describe('DELETE /{modulo}/:id', () => {
    it('debe eliminar una {entidad}', async () => {
      // Crear
      const createResponse = await request(app.getHttpServer())
        .post('/{modulo}')
        .set('Cookie', authCookie)
        .send({ nombre: 'Para Eliminar', activo: true });

      const id = createResponse.body.data.id;

      // Eliminar
      await request(app.getHttpServer())
        .delete(`/{modulo}/${id}`)
        .set('Cookie', authCookie)
        .expect(200);

      // Verificar que no existe
      await request(app.getHttpServer())
        .get(`/{modulo}/${id}`)
        .set('Cookie', authCookie)
        .expect(404);
    });
  });
});
```

---

## FRONTEND - Testing con Vitest + Testing Library

### 1. Test de Componente

```tsx
// src/presentation/components/features/{modulo}/{entidad}-form.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { {Entidad}Form } from './{entidad}-form';

// Mock del hook de mutación
vi.mock('@/application/hooks/mutations/use-create-{entidad}', () => ({
  useCreate{Entidad}: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: '1', nombre: 'Test' }),
    isPending: false,
  }),
}));

describe('{Entidad}Form', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <{Entidad}Form />
      </QueryClientProvider>
    );
  };

  it('debe renderizar el formulario', () => {
    renderComponent();

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('debe mostrar error si nombre está vacío', async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('debe enviar el formulario correctamente', async () => {
    const onSuccess = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <{Entidad}Form onSuccess={onSuccess} />
      </QueryClientProvider>
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/nombre/i), 'Nueva Entidad');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

### 2. Test de Hook

```typescript
// src/application/hooks/queries/use-{modulo}.test.ts

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use{Modulo} } from './use-{modulo}';
import { {modulo}Service } from '@/application/services/{modulo}.service';

vi.mock('@/application/services/{modulo}.service');

describe('use{Modulo}', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('debe retornar datos correctamente', async () => {
    const mockData = [
      { id: '1', nombre: 'Item 1' },
      { id: '2', nombre: 'Item 2' },
    ];

    vi.mocked({modulo}Service.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => use{Modulo}(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('debe manejar errores', async () => {
    vi.mocked({modulo}Service.getAll).mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => use{Modulo}(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### 3. Test de Service

```typescript
// src/application/services/{modulo}.service.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {modulo}Service } from './{modulo}.service';
import { apiClient } from '@/infrastructure/api/axios-instance';

vi.mock('@/infrastructure/api/axios-instance');

describe('{modulo}Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('debe retornar lista de {entidades}', async () => {
      const mockData = [{ id: '1', nombre: 'Test' }];
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: mockData }
      });

      const result = await {modulo}Service.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/{modulo}');
      expect(result).toEqual(mockData);
    });
  });

  describe('create', () => {
    it('debe crear una {entidad}', async () => {
      const dto = { nombre: 'Nueva' };
      const mockResponse = { id: '1', ...dto };
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: mockResponse }
      });

      const result = await {modulo}Service.create(dto);

      expect(apiClient.post).toHaveBeenCalledWith('/{modulo}', dto);
      expect(result).toEqual(mockResponse);
    });
  });
});
```

---

## Configuración

### Backend - jest.config.js

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### Frontend - vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Frontend - setup.ts

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
```

## Comandos

```bash
# Backend
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage
npm run test:e2e          # E2E tests

# Frontend
npm run test              # Vitest
npm run test:ui           # Vitest UI
npm run test:coverage     # Coverage
```

## Checklist

```
□ Tests de Use Cases (backend)
□ Tests E2E de endpoints (backend)
□ Tests de componentes React (frontend)
□ Tests de hooks React Query (frontend)
□ Tests de services (frontend)
□ Mocks de servicios externos
□ Coverage > 80%
```

---

**IMPORTANTE**: Las pruebas DEBEN verificar que los campos coincidan con 03-BASE-DATOS-COMPLETA.md y que los endpoints coincidan con 06-API-ENDPOINTS.md.
