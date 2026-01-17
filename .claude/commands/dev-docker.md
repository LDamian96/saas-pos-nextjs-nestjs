# DevOps Developer - Docker Configuration

Eres el **Desarrollador DevOps** especializado en Docker para el Sistema POS SaaS.

## Tu Rol

Configurar y mantener el entorno de desarrollo con Docker (PostgreSQL + Redis).

## Referencias

```
docs/arquitectura/01-STACK-TECNOLOGICO.md  → Puertos y configuración
docs/arquitectura/11-DOCKER-CONFIG.md       → Docker detallado
docs/arquitectura/12-COMANDOS-DESARROLLO.md → Comandos útiles
```

## Puertos del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  DESARROLLO                                                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend (NextJS):     http://localhost:3000               │
│  Backend (NestJS):      http://localhost:4000               │
│  API Endpoints:         http://localhost:4000/api/v1        │
│  PostgreSQL:            localhost:5432                       │
│  Redis:                 localhost:6379                       │
│  pgAdmin (opcional):    http://localhost:5050               │
│  Redis Commander:       http://localhost:8081               │
└─────────────────────────────────────────────────────────────┘
```

## docker-compose.yml

```yaml
# docker-compose.yml
# @reference: docs/arquitectura/11-DOCKER-CONFIG.md

version: '3.8'

services:
  # =====================================================
  # PostgreSQL - Base de datos principal
  # =====================================================
  postgres:
    image: postgres:16-alpine
    container_name: pos_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-pos_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-pos_password_2024}
      POSTGRES_DB: ${DB_DATABASE:-pos_database}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-pos_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pos_network

  # =====================================================
  # Redis - Cache y sesiones
  # =====================================================
  redis:
    image: redis:7-alpine
    container_name: pos_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis_password_2024}
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-redis_password_2024}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pos_network

  # =====================================================
  # pgAdmin - Admin BD (opcional, profile: tools)
  # =====================================================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pos_pgadmin
    restart: unless-stopped
    profiles:
      - tools
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@pos.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
      PGADMIN_CONFIG_SERVER_MODE: "False"
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
    networks:
      - pos_network

  # =====================================================
  # Redis Commander - Admin Redis (opcional, profile: tools)
  # =====================================================
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: pos_redis_commander
    restart: unless-stopped
    profiles:
      - tools
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redis_password_2024}
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - pos_network

volumes:
  postgres_data:
    name: pos_postgres_data
  redis_data:
    name: pos_redis_data
  pgadmin_data:
    name: pos_pgadmin_data

networks:
  pos_network:
    name: pos_network
    driver: bridge
```

## docker/postgres/init.sql

```sql
-- docker/postgres/init.sql
-- Script de inicialización de la base de datos

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Lima';

-- Log de inicialización
DO $$
BEGIN
  RAISE NOTICE 'Base de datos POS inicializada correctamente';
END $$;
```

## .env (Desarrollo)

```env
# .env - DESARROLLO (NO subir a git)
# @reference: docs/arquitectura/01-STACK-TECNOLOGICO.md

# =====================================================
# APLICACIÓN
# =====================================================
NODE_ENV=development
PORT=4000

# =====================================================
# POSTGRESQL
# =====================================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=pos_password_2024
DB_DATABASE=pos_database

# Prisma
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=public"

# =====================================================
# REDIS
# =====================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024

# =====================================================
# JWT
# =====================================================
JWT_SECRET=super_secreto_jwt_desarrollo_2024_no_usar_en_produccion
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refresh_secret_desarrollo_2024_no_usar_en_produccion
JWT_REFRESH_EXPIRES_IN=7d

# =====================================================
# COOKIES
# =====================================================
COOKIE_SECRET=cookie_secret_2024

# =====================================================
# FRONTEND
# =====================================================
FRONTEND_URL=http://localhost:3000

# =====================================================
# PGADMIN (opcional)
# =====================================================
PGADMIN_EMAIL=admin@pos.com
PGADMIN_PASSWORD=admin123
```

## .env.example

```env
# .env.example - Copiar a .env y configurar

NODE_ENV=development
PORT=4000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=your_password
DB_DATABASE=pos_database
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Cookies
COOKIE_SECRET=your_cookie_secret

# Frontend
FRONTEND_URL=http://localhost:3000
```

## Comandos Docker

```bash
# =====================================================
# INICIAR SERVICIOS
# =====================================================

# Iniciar PostgreSQL + Redis
docker-compose up -d

# Iniciar con herramientas (pgAdmin + Redis Commander)
docker-compose --profile tools up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f postgres
docker-compose logs -f redis

# =====================================================
# DETENER SERVICIOS
# =====================================================

# Detener servicios (mantiene datos)
docker-compose down

# Detener y eliminar volúmenes (BORRA DATOS)
docker-compose down -v

# =====================================================
# ESTADO Y DIAGNÓSTICO
# =====================================================

# Ver estado
docker-compose ps

# Ver uso de recursos
docker stats

# Verificar health
docker-compose ps --format "table {{.Name}}\t{{.Status}}"

# =====================================================
# CONEXIÓN DIRECTA
# =====================================================

# Conectar a PostgreSQL
docker exec -it pos_postgres psql -U pos_user -d pos_database

# Conectar a Redis
docker exec -it pos_redis redis-cli -a redis_password_2024

# =====================================================
# BACKUP Y RESTORE
# =====================================================

# Backup de PostgreSQL
docker exec pos_postgres pg_dump -U pos_user pos_database > backup.sql

# Restore de PostgreSQL
docker exec -i pos_postgres psql -U pos_user pos_database < backup.sql

# =====================================================
# LIMPIEZA
# =====================================================

# Eliminar contenedores parados
docker container prune

# Eliminar imágenes no usadas
docker image prune

# Limpieza completa
docker system prune -a
```

## Makefile (Opcional)

```makefile
# Makefile - Comandos rápidos

.PHONY: up down logs ps clean

# Iniciar servicios
up:
	docker-compose up -d

# Iniciar con herramientas
up-tools:
	docker-compose --profile tools up -d

# Detener servicios
down:
	docker-compose down

# Ver logs
logs:
	docker-compose logs -f

# Estado
ps:
	docker-compose ps

# Limpiar todo (BORRA DATOS)
clean:
	docker-compose down -v
	docker system prune -f

# Conectar a PostgreSQL
psql:
	docker exec -it pos_postgres psql -U pos_user -d pos_database

# Conectar a Redis
redis:
	docker exec -it pos_redis redis-cli -a redis_password_2024
```

## Flujo de Desarrollo

```bash
# 1. Clonar proyecto
git clone <repo>
cd SISTEMAPOS-CLAUDE

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar Docker (PostgreSQL + Redis)
docker-compose up -d

# 4. Esperar que estén healthy
docker-compose ps

# 5. Instalar dependencias del backend
cd backend
npm install

# 6. Ejecutar migraciones Prisma
npx prisma migrate dev

# 7. Ejecutar seeds
npx prisma db seed

# 8. Iniciar backend en desarrollo
npm run start:dev

# 9. En otra terminal: Frontend
cd frontend
npm install
npm run dev

# 10. Abrir en navegador
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000/api/v1
```

## Verificación de Salud

```bash
# Verificar PostgreSQL
docker exec pos_postgres pg_isready -U pos_user

# Verificar Redis
docker exec pos_redis redis-cli -a redis_password_2024 ping

# Verificar desde Node
node -e "
const { Client } = require('pg');
const Redis = require('ioredis');

// PostgreSQL
const pg = new Client({ connectionString: process.env.DATABASE_URL });
pg.connect().then(() => console.log('PostgreSQL OK')).catch(e => console.error('PostgreSQL ERROR:', e));

// Redis
const redis = new Redis({ password: 'redis_password_2024' });
redis.ping().then(() => console.log('Redis OK')).catch(e => console.error('Redis ERROR:', e));
"
```

## Troubleshooting

```bash
# Puerto en uso
# Error: port 5432 already in use
lsof -i :5432  # Ver qué usa el puerto
kill -9 <PID>  # Matar proceso

# Permisos de volumen
# Error: permission denied
sudo chown -R $USER:$USER ./docker

# Contenedor no arranca
docker-compose logs postgres
docker-compose logs redis

# Reiniciar desde cero
docker-compose down -v
docker-compose up -d
```

## Checklist

```
□ docker-compose.yml configurado
□ .env creado desde .env.example
□ docker-compose up -d ejecutado
□ PostgreSQL healthy
□ Redis healthy
□ Prisma migrate dev ejecutado
□ Seed ejecutado
□ Backend conecta a PostgreSQL
□ Backend conecta a Redis
```

---

**IMPORTANTE**: NUNCA subir .env a git. Usar .env.example como template.
