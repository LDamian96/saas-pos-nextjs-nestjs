# CLAUDE.md - Sistema POS SaaS Multi-Tenant

## Proyecto

Sistema de Punto de Venta (POS) SaaS multi-tenant con arquitectura Clean Architecture + DDD.

## Stack Tecnológico

- **Backend**: NestJS (puerto 4000)
- **Frontend**: NextJS 14 App Router (puerto 3000)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **UI**: Shadcn/UI + Tailwind CSS
- **Animaciones**: Framer Motion
- **State**: Zustand (cliente) + React Query (servidor)

## Comandos Disponibles (Skills)

Invocar con `/comando`:

| Comando | Descripción |
|---------|-------------|
| `/architect` | Arquitecto orquestador - Planifica y dirige el desarrollo |
| `/dev-backend` | Desarrollador Backend - NestJS endpoints y services |
| `/dev-frontend` | Desarrollador Frontend - NextJS páginas y componentes |
| `/dev-database` | Desarrollador BD - Prisma schema y migraciones |
| `/dev-testing` | Desarrollador QA - Pruebas backend y frontend |
| `/dev-docker` | DevOps - Docker, PostgreSQL, Redis |

## Flujo de Desarrollo Obligatorio

```
1. /dev-database   → Crear/verificar schema Prisma
2. /dev-backend    → Crear endpoint (Use Case + Controller + DTO)
3. /dev-testing    → Crear pruebas del endpoint
4. /dev-frontend   → Crear página/componente que consume el endpoint
5. /dev-testing    → Crear pruebas del componente
```

## Documentación de Referencia

SIEMPRE consultar antes de escribir código:

```
docs/arquitectura/03-BASE-DATOS-COMPLETA.md  → FUENTE DE VERDAD de campos
docs/arquitectura/06-API-ENDPOINTS.md        → Endpoints definidos
docs/arquitectura/07-FRONTEND-RUTAS.md       → Rutas del frontend
docs/arquitectura/04-SEGURIDAD-OWASP.md      → Seguridad obligatoria
docs/arquitectura/05-REDIS-CACHE.md          → Estrategia de cache
```

## Reglas Inquebrantables

1. **NUNCA inventar campos** - Solo usar los de 03-BASE-DATOS-COMPLETA.md
2. **NUNCA npm run build** en desarrollo - Solo npm run dev
3. **NUNCA especificar versiones** - npm install sin @version
4. **SIEMPRE HTTPOnly cookies** para JWT
5. **SIEMPRE Redis cache** para consultas frecuentes
6. **SIEMPRE validar** DTOs con class-validator
7. **SIEMPRE sanitizar** inputs contra XSS
8. **SIEMPRE usar referencias** cruzadas entre BD, Backend y Frontend

## Estructura del Proyecto

```
SISTEMAPOS-CLAUDE/
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/entities/
│   │   │   └── application/
│   │   │       ├── use-cases/
│   │   │       └── dto/
│   │   ├── infrastructure/
│   │   │   └── persistence/prisma/
│   │   └── presentation/
│   │       └── http/controllers/
│   └── prisma/
│       └── schema.prisma
├── frontend/                    # NextJS
│   └── src/
│       ├── application/
│       │   ├── services/        # API calls
│       │   ├── hooks/queries/   # React Query
│       │   └── stores/          # Zustand
│       └── presentation/
│           ├── app/             # App Router
│           └── components/
│               ├── ui/          # Shadcn
│               └── features/    # Por módulo
└── docs/arquitectura/           # Documentación técnica
```

## Verificación de Coherencia

Antes de terminar cualquier tarea, verificar:

```
□ Campos del DTO = Campos de tabla en 03-BASE-DATOS-COMPLETA.md
□ Endpoint = Definido en 06-API-ENDPOINTS.md
□ Ruta frontend = Definida en 07-FRONTEND-RUTAS.md
□ Formulario frontend = Mismos campos que DTO backend
□ Cache Redis implementado en queries frecuentes
□ Sanitización XSS en strings
□ Validación con class-validator/zod
```

## Comandos de Desarrollo

```bash
# Docker
docker-compose up -d              # Iniciar PostgreSQL + Redis

# Backend
cd backend
npm run start:dev                 # Desarrollo con hot reload

# Frontend
cd frontend
npm run dev                       # Desarrollo

# Prisma
npx prisma generate               # Generar cliente
npx prisma migrate dev            # Crear migración
npx prisma db seed                # Ejecutar seeds
npx prisma studio                 # Ver BD en browser
```
