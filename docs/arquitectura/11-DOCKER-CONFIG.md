# 🐳 CONFIGURACIÓN DOCKER

## 📋 DESCRIPCIÓN

Docker se usa para levantar los servicios de infraestructura en desarrollo:
- **PostgreSQL** - Base de datos
- **Redis** - Cache y sesiones

> **IMPORTANTE:** NO se usa Docker para el backend/frontend en desarrollo. Solo para servicios de infraestructura.

---

## 📁 ARCHIVOS DE CONFIGURACIÓN

### docker-compose.yml (Raíz del proyecto)
```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # PostgreSQL - Base de datos principal
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: pos_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USERNAME:-pos_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-pos_password_2024}
      POSTGRES_DB: ${DB_DATABASE:-pos_database}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-pos_user} -d ${DB_DATABASE:-pos_database}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - pos_network

  # ============================================
  # Redis - Cache y sesiones
  # ============================================
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

  # ============================================
  # pgAdmin - Administrador de PostgreSQL (opcional)
  # ============================================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pos_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@pos.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin123}
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pos_network
    profiles:
      - tools

  # ============================================
  # Redis Commander - UI para Redis (opcional)
  # ============================================
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: pos_redis_commander
    restart: unless-stopped
    environment:
      REDIS_HOSTS: local:redis:6379:0:${REDIS_PASSWORD:-redis_password_2024}
    ports:
      - "${REDIS_COMMANDER_PORT:-8081}:8081"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - pos_network
    profiles:
      - tools

# ============================================
# Volúmenes persistentes
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local

# ============================================
# Red interna
# ============================================
networks:
  pos_network:
    driver: bridge
```

### Script de Inicialización PostgreSQL
```sql
-- docker/postgres/init.sql
-- Este script se ejecuta automáticamente al crear el contenedor por primera vez

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configuraciones de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente';
END $$;
```

---

## 🔧 ARCHIVO .env (Raíz)

```env
# .env - Variables de entorno para Docker

# ============================================
# PostgreSQL
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=pos_password_2024
DB_DATABASE=pos_database

# ============================================
# Redis
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024

# ============================================
# pgAdmin (opcional)
# ============================================
PGADMIN_EMAIL=admin@pos.local
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050

# ============================================
# Redis Commander (opcional)
# ============================================
REDIS_COMMANDER_PORT=8081
```

---

## 📜 COMANDOS DOCKER

### Comandos Básicos

```bash
# Iniciar servicios (PostgreSQL + Redis)
docker-compose up -d

# Iniciar con logs visibles
docker-compose up

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡BORRA DATOS!)
docker-compose down -v

# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Comandos con Herramientas Opcionales

```bash
# Iniciar con pgAdmin y Redis Commander
docker-compose --profile tools up -d

# Iniciar solo herramientas
docker-compose --profile tools up -d pgadmin redis-commander
```

### Comandos de Mantenimiento

```bash
# Reiniciar un servicio
docker-compose restart postgres
docker-compose restart redis

# Ejecutar comando en contenedor
docker-compose exec postgres psql -U pos_user -d pos_database

# Backup de PostgreSQL
docker-compose exec postgres pg_dump -U pos_user pos_database > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U pos_user pos_database < backup.sql

# Limpiar cache de Redis
docker-compose exec redis redis-cli -a redis_password_2024 FLUSHALL
```

---

## 🌐 PUERTOS Y ACCESO

| Servicio | Puerto | URL de Acceso |
|----------|--------|---------------|
| PostgreSQL | 5432 | `localhost:5432` |
| Redis | 6379 | `localhost:6379` |
| pgAdmin | 5050 | http://localhost:5050 |
| Redis Commander | 8081 | http://localhost:8081 |
| Backend (NestJS) | 4000 | http://localhost:4000 |
| Frontend (NextJS) | 3000 | http://localhost:3000 |

---

## 🔌 CONEXIÓN DESDE APLICACIONES

### Backend (.env)
```env
# backend/.env

# PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=pos_password_2024
DB_DATABASE=pos_database
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024
REDIS_DB=0
```

### Conexión TypeORM
```typescript
// backend/src/infrastructure/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'pos_user'),
  password: configService.get('DB_PASSWORD', 'pos_password_2024'),
  database: configService.get('DB_DATABASE', 'pos_database'),
  entities: [__dirname + '/../persistence/typeorm/entities/*.orm-entity{.ts,.js}'],
  migrations: [__dirname + '/../persistence/typeorm/migrations/*{.ts,.js}'],
  synchronize: false, // NUNCA true en producción
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
```

### Conexión Redis
```typescript
// backend/src/infrastructure/config/redis.config.ts
import { ConfigService } from '@nestjs/config';
import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const getRedisConfig = (configService: ConfigService): RedisModuleOptions => ({
  type: 'single',
  options: {
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
    password: configService.get('REDIS_PASSWORD', 'redis_password_2024'),
    db: configService.get('REDIS_DB', 0),
  },
});
```

---

## 📊 MONITOREO Y HEALTH CHECKS

### Health Check Endpoint (Backend)
```typescript
// backend/src/presentation/http/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRedis() private redis: Redis,
  ) {}

  @Get()
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
      },
    };

    const allHealthy = Object.values(checks.services).every(s => s.status === 'healthy');
    checks.status = allHealthy ? 'ok' : 'degraded';

    return checks;
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
```

---

## 🚀 SCRIPTS DE AUTOMATIZACIÓN

### Script de Inicio Rápido
```bash
#!/bin/bash
# scripts/start-dev.sh

echo "🚀 Iniciando entorno de desarrollo..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Iniciar servicios Docker
echo "📦 Iniciando PostgreSQL y Redis..."
docker-compose up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando servicios..."
sleep 5

# Verificar servicios
echo "🔍 Verificando servicios..."
docker-compose ps

# Verificar conexión PostgreSQL
if docker-compose exec -T postgres pg_isready -U pos_user -d pos_database > /dev/null 2>&1; then
    echo "✅ PostgreSQL listo"
else
    echo "❌ PostgreSQL no responde"
fi

# Verificar conexión Redis
if docker-compose exec -T redis redis-cli -a redis_password_2024 ping > /dev/null 2>&1; then
    echo "✅ Redis listo"
else
    echo "❌ Redis no responde"
fi

echo ""
echo "🎉 Entorno listo!"
echo ""
echo "Servicios disponibles:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "Para iniciar el backend: cd backend && npm run start:dev"
echo "Para iniciar el frontend: cd frontend && npm run dev"
```

### Script de Reset de Base de Datos
```bash
#!/bin/bash
# scripts/reset-db.sh

echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos"
read -p "¿Estás seguro? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Operación cancelada"
    exit 0
fi

echo "🗑️  Eliminando base de datos..."

# Detener contenedores
docker-compose down

# Eliminar volumen de PostgreSQL
docker volume rm sistemapos-claude_postgres_data 2>/dev/null || true

# Reiniciar
docker-compose up -d

echo "⏳ Esperando que PostgreSQL inicie..."
sleep 10

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
cd backend && npm run migration:run

echo "✅ Base de datos reseteada y migraciones aplicadas"
```

---

## 📋 ESTRUCTURA DE CARPETAS DOCKER

```
SISTEMAPOS-CLAUDE/
├── docker-compose.yml          # Configuración principal
├── .env                        # Variables de entorno
├── docker/
│   ├── postgres/
│   │   └── init.sql            # Script de inicialización
│   └── redis/
│       └── redis.conf          # Configuración Redis (opcional)
├── scripts/
│   ├── start-dev.sh            # Iniciar entorno
│   ├── stop-dev.sh             # Detener entorno
│   └── reset-db.sh             # Resetear BD
├── backend/
│   └── .env                    # Variables backend
└── frontend/
    └── .env.local              # Variables frontend
```

---

## ⚠️ NOTAS IMPORTANTES

1. **NO usar `DB_SYNCHRONIZE=true`** en producción - siempre usar migraciones

2. **Cambiar contraseñas** antes de desplegar a producción

3. **Los volúmenes persisten datos** - usar `docker-compose down -v` para eliminarlos

4. **pgAdmin y Redis Commander** son opcionales y solo para desarrollo

5. **Verificar permisos** de los scripts bash: `chmod +x scripts/*.sh`

6. **En Windows** usar los comandos directamente o PowerShell equivalentes
