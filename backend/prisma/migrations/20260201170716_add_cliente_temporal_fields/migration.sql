/*
  Warnings:

  - You are about to drop the column `comision` on the `metodos_pago` table. All the data in the column will be lost.
  - You are about to alter the column `codigo` on the `metodos_pago` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(30)`.
  - You are about to alter the column `tipo` on the `metodos_pago` table. The data in that column could be lost. The data in that column will be cast from `VarChar(30)` to `VarChar(20)`.
  - You are about to alter the column `icono` on the `metodos_pago` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.
  - Added the required column `updated_at` to the `metodos_pago` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "metodos_pago" DROP COLUMN "comision",
ADD COLUMN     "color" VARCHAR(7),
ADD COLUMN     "comision_fija" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "comision_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "es_pasarela_integrada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pasarela_codigo" VARCHAR(50),
ADD COLUMN     "pasarela_config" JSONB,
ADD COLUMN     "requiere_referencia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visible_pos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visible_web" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "codigo" SET DATA TYPE VARCHAR(30),
ALTER COLUMN "tipo" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "icono" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "cliente_documento_temporal" VARCHAR(20),
ADD COLUMN     "cliente_nombre_temporal" VARCHAR(200);

-- CreateTable
CREATE TABLE "promociones" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(30) NOT NULL,
    "cantidad_comprar" INTEGER,
    "cantidad_beneficio" INTEGER,
    "descuento_porcentaje" DECIMAL(5,2),
    "descuento_monto" DECIMAL(12,2),
    "precio_fijo" DECIMAL(12,2),
    "monto_minimo_compra" DECIMAL(12,2),
    "aplica_a" VARCHAR(20) NOT NULL DEFAULT 'productos',
    "categorias_ids" UUID[],
    "productos_ids" UUID[],
    "marcas_ids" UUID[],
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "hora_inicio" VARCHAR(8),
    "hora_fin" VARCHAR(8),
    "dias_semana" INTEGER[],
    "limite_usos_total" INTEGER,
    "limite_usos_cliente" INTEGER,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "solo_clientes_registrados" BOOLEAN NOT NULL DEFAULT false,
    "todas_sucursales" BOOLEAN NOT NULL DEFAULT true,
    "sucursales_ids" UUID[],
    "acumulable" BOOLEAN NOT NULL DEFAULT false,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "visible_pos" BOOLEAN NOT NULL DEFAULT true,
    "visible_web" BOOLEAN NOT NULL DEFAULT true,
    "imagen" VARCHAR(500),
    "banner" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "razon_social" VARCHAR(200) NOT NULL,
    "nombre_comercial" VARCHAR(200),
    "ruc" VARCHAR(20),
    "email" VARCHAR(150),
    "telefono" VARCHAR(20),
    "celular" VARCHAR(20),
    "direccion" TEXT,
    "contacto_nombre" VARCHAR(150),
    "contacto_cargo" VARCHAR(100),
    "contacto_telefono" VARCHAR(20),
    "contacto_email" VARCHAR(150),
    "dias_credito" INTEGER NOT NULL DEFAULT 0,
    "limite_credito" DECIMAL(12,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" DATE,
    "tipo_documento_ref" VARCHAR(20),
    "numero_documento_ref" VARCHAR(50),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado_pago" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "monto_pagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_pendiente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'compra',
    "afecta_inventario" BOOLEAN NOT NULL DEFAULT true,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'recibida',
    "notas" TEXT,
    "registrado_por_ia" BOOLEAN NOT NULL DEFAULT false,
    "mensaje_original" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_detalles" (
    "id" UUID NOT NULL,
    "compra_id" UUID NOT NULL,
    "producto_id" UUID,
    "variante_id" UUID,
    "descripcion" VARCHAR(300) NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidad_medida" VARCHAR(20) NOT NULL DEFAULT 'UND',
    "precio_unitario" DECIMAL(12,4) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "producto_texto" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compra_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_proveedor" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "compra_id" UUID,
    "numero" VARCHAR(20) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" VARCHAR(50),
    "referencia" VARCHAR(100),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completado',
    "notas" TEXT,
    "registrado_por_ia" BOOLEAN NOT NULL DEFAULT false,
    "mensaje_original" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "pagos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_roles" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "accion" VARCHAR(30) NOT NULL,
    "rol_anterior_id" UUID,
    "rol_nuevo_id" UUID,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "motivo" TEXT,
    "realizado_por" UUID NOT NULL,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria_acciones" (
    "id" UUID NOT NULL,
    "empresa_id" UUID,
    "usuario_id" UUID NOT NULL,
    "usuario_nombre" VARCHAR(200),
    "usuario_rol" VARCHAR(50),
    "modulo" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(30) NOT NULL,
    "entidad_id" UUID,
    "entidad_tipo" VARCHAR(50),
    "descripcion" TEXT NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "sucursal_id" UUID,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "request_id" VARCHAR(100),
    "exitoso" BOOLEAN NOT NULL DEFAULT true,
    "error_mensaje" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_acciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_secciones" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(200),
    "subtitulo" VARCHAR(500),
    "contenido" JSONB,
    "imagen" VARCHAR(500),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "estilos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_secciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_contactos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "telefono" VARCHAR(20),
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_contactos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_config" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "pagina" VARCHAR(100) NOT NULL,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(500),
    "meta_keywords" VARCHAR(500),
    "og_image" VARCHAR(500),
    "og_title" VARCHAR(200),
    "og_description" VARCHAR(500),
    "canonical_url" VARCHAR(500),
    "robots_txt" TEXT,
    "sitemap_activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "precio_mensual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_anual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_sucursales" INTEGER NOT NULL DEFAULT 1,
    "max_usuarios" INTEGER NOT NULL DEFAULT 2,
    "max_productos" INTEGER NOT NULL DEFAULT 500,
    "features" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "es_popular" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'activa',
    "periodo_facturacion" VARCHAR(20) NOT NULL DEFAULT 'mensual',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "fecha_cancelacion" TIMESTAMP(3),
    "trial_hasta" TIMESTAMP(3),
    "precio_actual" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "pasarela_id" VARCHAR(200),
    "meta_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promociones_fecha_inicio_fecha_fin_idx" ON "promociones"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "promociones_activo_idx" ON "promociones"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "promociones_empresa_id_codigo_key" ON "promociones"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "proveedores_empresa_id_nombre_comercial_idx" ON "proveedores"("empresa_id", "nombre_comercial");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_empresa_id_codigo_key" ON "proveedores"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "compras_empresa_id_idx" ON "compras"("empresa_id");

-- CreateIndex
CREATE INDEX "compras_proveedor_id_idx" ON "compras"("proveedor_id");

-- CreateIndex
CREATE INDEX "compras_empresa_id_estado_pago_idx" ON "compras"("empresa_id", "estado_pago");

-- CreateIndex
CREATE INDEX "compras_empresa_id_fecha_idx" ON "compras"("empresa_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "compras_empresa_id_numero_key" ON "compras"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "compra_detalles_compra_id_idx" ON "compra_detalles"("compra_id");

-- CreateIndex
CREATE INDEX "pagos_proveedor_empresa_id_idx" ON "pagos_proveedor"("empresa_id");

-- CreateIndex
CREATE INDEX "pagos_proveedor_proveedor_id_idx" ON "pagos_proveedor"("proveedor_id");

-- CreateIndex
CREATE INDEX "pagos_proveedor_empresa_id_fecha_idx" ON "pagos_proveedor"("empresa_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_proveedor_empresa_id_numero_key" ON "pagos_proveedor"("empresa_id", "numero");

-- CreateIndex
CREATE INDEX "auditoria_roles_empresa_id_idx" ON "auditoria_roles"("empresa_id");

-- CreateIndex
CREATE INDEX "auditoria_roles_usuario_id_idx" ON "auditoria_roles"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_roles_created_at_idx" ON "auditoria_roles"("created_at");

-- CreateIndex
CREATE INDEX "auditoria_acciones_empresa_id_idx" ON "auditoria_acciones"("empresa_id");

-- CreateIndex
CREATE INDEX "auditoria_acciones_usuario_id_idx" ON "auditoria_acciones"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_acciones_modulo_idx" ON "auditoria_acciones"("modulo");

-- CreateIndex
CREATE INDEX "auditoria_acciones_created_at_idx" ON "auditoria_acciones"("created_at");

-- CreateIndex
CREATE INDEX "auditoria_acciones_entidad_tipo_entidad_id_idx" ON "auditoria_acciones"("entidad_tipo", "entidad_id");

-- CreateIndex
CREATE INDEX "landing_secciones_empresa_id_idx" ON "landing_secciones"("empresa_id");

-- CreateIndex
CREATE INDEX "landing_contactos_empresa_id_idx" ON "landing_contactos"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_config_empresa_id_pagina_key" ON "seo_config"("empresa_id", "pagina");

-- CreateIndex
CREATE UNIQUE INDEX "planes_codigo_key" ON "planes"("codigo");

-- CreateIndex
CREATE INDEX "suscripciones_empresa_id_idx" ON "suscripciones"("empresa_id");

-- CreateIndex
CREATE INDEX "suscripciones_estado_idx" ON "suscripciones"("estado");

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_secciones" ADD CONSTRAINT "landing_secciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_contactos" ADD CONSTRAINT "landing_contactos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_config" ADD CONSTRAINT "seo_config_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
