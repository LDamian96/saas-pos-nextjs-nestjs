# Makefile - Comandos rapidos
# @reference: docs/arquitectura/12-COMANDOS-DESARROLLO.md

.PHONY: up down logs ps clean psql redis dev-backend dev-frontend

# =====================================================
# DOCKER
# =====================================================

# Iniciar PostgreSQL + Redis
up:
	docker-compose up -d

# Iniciar con herramientas (pgAdmin + Redis Commander)
up-tools:
	docker-compose --profile tools up -d

# Detener servicios
down:
	docker-compose down

# Ver logs
logs:
	docker-compose logs -f

# Ver logs de un servicio
logs-postgres:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

# Estado de servicios
ps:
	docker-compose ps

# Limpiar todo (BORRA DATOS)
clean:
	docker-compose down -v
	docker system prune -f

# =====================================================
# CONEXIONES DIRECTAS
# =====================================================

# Conectar a PostgreSQL
psql:
	docker exec -it pos_postgres psql -U pos_user -d pos_database

# Conectar a Redis
redis:
	docker exec -it pos_redis redis-cli -a redis_password_2024

# =====================================================
# DESARROLLO
# =====================================================

# Backend NestJS
dev-backend:
	cd backend && npm run start:dev

# Frontend NextJS
dev-frontend:
	cd frontend && npm run dev

# Ambos (requiere 2 terminales)
dev:
	@echo "Ejecutar en terminales separadas:"
	@echo "  Terminal 1: make dev-backend"
	@echo "  Terminal 2: make dev-frontend"

# =====================================================
# PRISMA
# =====================================================

# Generar cliente Prisma
prisma-generate:
	cd backend && npx prisma generate

# Crear migracion
prisma-migrate:
	cd backend && npx prisma migrate dev

# Ejecutar seeds
prisma-seed:
	cd backend && npx prisma db seed

# Abrir Prisma Studio
prisma-studio:
	cd backend && npx prisma studio

# =====================================================
# INSTALACION
# =====================================================

# Instalar dependencias
install:
	cd backend && npm install
	cd frontend && npm install

# Setup inicial completo
setup: up install prisma-generate prisma-migrate prisma-seed
	@echo "Setup completado!"
	@echo "Backend: http://localhost:4000"
	@echo "Frontend: http://localhost:3000"
