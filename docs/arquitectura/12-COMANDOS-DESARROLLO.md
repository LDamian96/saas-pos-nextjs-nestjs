# 🛠️ COMANDOS DE DESARROLLO

## 📋 FLUJO DE TRABAJO

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DESARROLLO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. docker-compose up -d     → Levantar PostgreSQL + Redis      │
│                                                                  │
│  2. cd backend               → Ir al backend                    │
│     npm run start:dev        → Iniciar NestJS (puerto 4000)     │
│                                                                  │
│  3. cd frontend              → Ir al frontend (nueva terminal)  │
│     npm run dev              → Iniciar NextJS (puerto 3000)     │
│                                                                  │
│  ⚠️  NO EJECUTAR: npm run build                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🐳 COMANDOS DOCKER

```bash
# ============================================
# INICIAR / DETENER SERVICIOS
# ============================================

# Iniciar PostgreSQL + Redis (en background)
docker-compose up -d

# Iniciar con logs visibles
docker-compose up

# Detener servicios
docker-compose down

# Detener y eliminar datos (¡CUIDADO!)
docker-compose down -v

# Reiniciar un servicio
docker-compose restart postgres
docker-compose restart redis

# ============================================
# VER ESTADO Y LOGS
# ============================================

# Ver estado de contenedores
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Ver logs de Redis
docker-compose logs -f redis

# ============================================
# ACCESO A CONTENEDORES
# ============================================

# Acceder a PostgreSQL (psql)
docker-compose exec postgres psql -U pos_user -d pos_database

# Acceder a Redis CLI
docker-compose exec redis redis-cli -a redis_password_2024

# ============================================
# HERRAMIENTAS OPCIONALES
# ============================================

# Iniciar con pgAdmin y Redis Commander
docker-compose --profile tools up -d

# Accesos:
# - pgAdmin: http://localhost:5050
# - Redis Commander: http://localhost:8081
```

---

## 🔧 COMANDOS BACKEND (NestJS)

```bash
# Navegar al backend
cd backend

# ============================================
# DESARROLLO
# ============================================

# Iniciar en modo desarrollo (watch mode) ⭐ USAR ESTE
npm run start:dev

# Iniciar sin watch
npm run start

# ============================================
# BASE DE DATOS (Prisma)
# ============================================

# Generar cliente Prisma (después de cambios en schema)
npx prisma generate

# Crear y ejecutar migración
npx prisma migrate dev --name NombreMigracion

# Solo crear migración sin ejecutar
npx prisma migrate dev --create-only

# Ejecutar migraciones pendientes (producción)
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Reset de base de datos (¡BORRA TODO!)
npx prisma migrate reset

# Verificar schema
npx prisma validate

# Formatear schema.prisma
npx prisma format

# Abrir Prisma Studio (UI visual de BD)
npx prisma studio

# ============================================
# SEEDS (Datos iniciales)
# ============================================

# Ejecutar seeds
npx prisma db seed

# ============================================
# TESTING
# ============================================

# Ejecutar todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e

# ============================================
# LINTING Y FORMATO
# ============================================

# Lint
npm run lint

# Lint con fix automático
npm run lint:fix

# Formatear código (Prettier)
npm run format

# ============================================
# ⚠️ NO USAR EN DESARROLLO
# ============================================

# NO ejecutar build en desarrollo
# npm run build         ❌ NO USAR

# NO ejecutar en modo producción
# npm run start:prod    ❌ NO USAR
```

---

## 🎨 COMANDOS FRONTEND (NextJS)

```bash
# Navegar al frontend
cd frontend

# ============================================
# DESARROLLO
# ============================================

# Iniciar en modo desarrollo ⭐ USAR ESTE
npm run dev

# ============================================
# SHADCN/UI (Componentes)
# ============================================

# Agregar componente de shadcn
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add alert

# Ver componentes disponibles
npx shadcn-ui@latest add --help

# ============================================
# LINTING Y FORMATO
# ============================================

# Lint
npm run lint

# Lint con fix
npm run lint:fix

# ============================================
# ⚠️ NO USAR EN DESARROLLO
# ============================================

# NO ejecutar build en desarrollo
# npm run build         ❌ NO USAR

# NO ejecutar start (producción)
# npm run start         ❌ NO USAR
```

---

## 📊 COMANDOS DE BASE DE DATOS

```bash
# ============================================
# ACCESO DIRECTO A POSTGRESQL
# ============================================

# Conectar a la base de datos
docker-compose exec postgres psql -U pos_user -d pos_database

# Comandos SQL útiles dentro de psql:
# \dt                  - Listar tablas
# \d nombre_tabla      - Describir tabla
# \l                   - Listar bases de datos
# \du                  - Listar usuarios
# \q                   - Salir

# ============================================
# BACKUP Y RESTORE
# ============================================

# Crear backup
docker-compose exec postgres pg_dump -U pos_user pos_database > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U pos_user pos_database < backup.sql

# ============================================
# COMANDOS REDIS
# ============================================

# Conectar a Redis CLI
docker-compose exec redis redis-cli -a redis_password_2024

# Comandos Redis útiles:
# KEYS *               - Ver todas las claves
# GET clave            - Obtener valor
# DEL clave            - Eliminar clave
# FLUSHALL             - Eliminar todo (¡cuidado!)
# INFO                 - Información del servidor
# QUIT                 - Salir
```

---

## 🔄 FLUJO DE DESARROLLO POR MÓDULOS

### Crear un nuevo módulo (ejemplo: Clientes)

```bash
# ============================================
# 1. BACKEND - Crear estructura
# ============================================

cd backend

# Crear carpetas del módulo (manualmente o con generador)
mkdir -p src/core/domain/entities
mkdir -p src/core/domain/repository-interfaces
mkdir -p src/core/application/use-cases/clientes
mkdir -p src/core/application/dto/cliente
mkdir -p src/infrastructure/persistence/typeorm/entities
mkdir -p src/infrastructure/persistence/typeorm/repositories
mkdir -p src/presentation/http/controllers
mkdir -p src/presentation/modules

# ============================================
# 2. BACKEND - Crear archivos (orden sugerido)
# ============================================

# 1. Domain Entity
# src/core/domain/entities/cliente.entity.ts

# 2. Repository Interface
# src/core/domain/repository-interfaces/cliente.repository.interface.ts

# 3. ORM Entity
# src/infrastructure/persistence/typeorm/entities/cliente.orm-entity.ts

# 4. Repository Implementation
# src/infrastructure/persistence/typeorm/repositories/cliente.repository.ts

# 5. DTOs
# src/core/application/dto/cliente/create-cliente.dto.ts
# src/core/application/dto/cliente/update-cliente.dto.ts

# 6. Use Cases
# src/core/application/use-cases/clientes/crear-cliente.use-case.ts
# src/core/application/use-cases/clientes/buscar-clientes.use-case.ts

# 7. Controller
# src/presentation/http/controllers/cliente.controller.ts

# 8. Module
# src/presentation/modules/cliente.module.ts

# 9. Registrar en app.module.ts

# ============================================
# 3. BACKEND - Crear migración (Prisma)
# ============================================

npx prisma migrate dev --name create_clientes_table

npx prisma generate

# ============================================
# 4. FRONTEND - Crear estructura
# ============================================

cd ../frontend

# Crear carpetas
mkdir -p src/core/domain/entities
mkdir -p src/application/services
mkdir -p src/application/hooks/queries
mkdir -p src/application/hooks/mutations
mkdir -p src/presentation/app/\(dashboard\)/clientes
mkdir -p src/presentation/components/features/clientes

# ============================================
# 5. FRONTEND - Crear archivos (orden sugerido)
# ============================================

# 1. Entity Type
# src/core/domain/entities/cliente.entity.ts

# 2. API Service
# src/application/services/cliente.service.ts

# 3. React Query Hooks
# src/application/hooks/queries/use-clientes.ts
# src/application/hooks/mutations/use-create-cliente.ts

# 4. Components
# src/presentation/components/features/clientes/cliente-table.tsx
# src/presentation/components/features/clientes/cliente-form.tsx

# 5. Pages
# src/presentation/app/(dashboard)/clientes/page.tsx
# src/presentation/app/(dashboard)/clientes/[id]/page.tsx

# ============================================
# 6. PROBAR
# ============================================

# Backend debe estar corriendo en puerto 4000
# Frontend debe estar corriendo en puerto 3000
# Probar en: http://localhost:3000/clientes
```

---

## 🧪 TESTING

```bash
# ============================================
# BACKEND TESTS
# ============================================

cd backend

# Unit tests
npm run test

# Unit tests en watch mode
npm run test:watch

# Test de un archivo específico
npm run test -- cliente.service.spec.ts

# Tests con coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# ============================================
# FRONTEND TESTS
# ============================================

cd frontend

# Tests con Jest
npm run test

# Tests en watch mode
npm run test:watch

# Tests con coverage
npm run test:cov
```

---

## 📝 SCRIPTS PACKAGE.JSON

### Backend (package.json)
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Frontend (package.json)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

---

## ⚠️ REGLAS IMPORTANTES

### NO HACER en Desarrollo

```bash
# ❌ NO ejecutar builds
npm run build                    # Backend - NO
npm run build                    # Frontend - NO

# ❌ NO ejecutar en modo producción
npm run start:prod               # Backend - NO
npm run start                    # Frontend - NO (este es producción)

# ❌ NO usar db push en producción
# Siempre usar migraciones con prisma migrate deploy
```

### SÍ HACER en Desarrollo

```bash
# ✅ Backend - modo desarrollo
cd backend && npm run start:dev

# ✅ Frontend - modo desarrollo
cd frontend && npm run dev

# ✅ Docker - solo para servicios
docker-compose up -d

# ✅ Migraciones para cambios en BD (Prisma)
npx prisma migrate dev --name NombreMigracion
```

---

## 🚀 INICIO RÁPIDO

```bash
# Terminal 1: Servicios Docker
docker-compose up -d

# Terminal 2: Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Terminal 3: Frontend
cd frontend
npm install
npm run dev

# Accesos:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000
# - Swagger (si habilitado): http://localhost:4000/api
```

---

## 🔍 TROUBLESHOOTING

### Error: Puerto en uso

```bash
# Ver qué proceso usa el puerto
netstat -ano | findstr :4000    # Windows
lsof -i :4000                    # Linux/Mac

# Matar proceso
taskkill /PID <pid> /F           # Windows
kill -9 <pid>                    # Linux/Mac
```

### Error: Conexión a PostgreSQL

```bash
# Verificar que Docker esté corriendo
docker-compose ps

# Verificar logs
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: Conexión a Redis

```bash
# Verificar Redis
docker-compose logs redis

# Probar conexión
docker-compose exec redis redis-cli -a redis_password_2024 ping
# Respuesta esperada: PONG
```

### Error: Migraciones

```bash
# Ver estado de migraciones
npx prisma migrate status

# Si hay problemas, resetear y volver a migrar (¡BORRA DATOS!)
npx prisma migrate reset

# O aplicar migraciones pendientes
npx prisma migrate dev
```

### Limpiar todo y empezar de nuevo

```bash
# Detener todo
docker-compose down -v

# Eliminar node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Reinstalar
cd backend && npm install
cd ../frontend && npm install

# Iniciar de nuevo
docker-compose up -d
cd backend && npm run migration:run && npm run start:dev
```
