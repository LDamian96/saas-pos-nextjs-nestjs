-- docker/postgres/init.sql
-- Script de inicializacion de la base de datos
-- @reference: docs/arquitectura/03-BASE-DATOS-COMPLETA.md

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Lima';

-- Log de inicializacion
DO $$
BEGIN
  RAISE NOTICE 'Base de datos POS inicializada correctamente';
  RAISE NOTICE 'Extensiones: uuid-ossp, pgcrypto';
  RAISE NOTICE 'Timezone: America/Lima';
END $$;
