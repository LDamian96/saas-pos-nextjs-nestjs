-- Agregar configuracion Nubefact por empresa. Si todas estan null/false,
-- el sistema usa las env vars del proveedor (modo prueba global por defecto).
ALTER TABLE "empresas"
  ADD COLUMN "nubefact_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "nubefact_demo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "nubefact_api_url" VARCHAR(500),
  ADD COLUMN "nubefact_token" VARCHAR(500),
  ADD COLUMN "nubefact_ruc" VARCHAR(20);
