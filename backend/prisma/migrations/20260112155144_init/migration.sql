-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre_comercial" VARCHAR(200) NOT NULL,
    "razon_social" VARCHAR(200),
    "ruc" VARCHAR(20),
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "direccion_fiscal" TEXT,
    "logo" VARCHAR(500),
    "logo_secundario" VARCHAR(500),
    "favicon" VARCHAR(500),
    "color_primario" VARCHAR(7) DEFAULT '#3B82F6',
    "color_secundario" VARCHAR(7) DEFAULT '#1E40AF',
    "slogan" VARCHAR(200),
    "pais" VARCHAR(50) DEFAULT 'Peru',
    "moneda" VARCHAR(3) DEFAULT 'PEN',
    "simbolo_moneda" VARCHAR(5) DEFAULT 'S/.',
    "zona_horaria" VARCHAR(50) DEFAULT 'America/Lima',
    "formato_fecha" VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    "idioma" VARCHAR(5) DEFAULT 'es',
    "aplica_impuesto" BOOLEAN NOT NULL DEFAULT true,
    "porcentaje_impuesto" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "nombre_impuesto" VARCHAR(20) DEFAULT 'IGV',
    "precio_incluye_impuesto" BOOLEAN NOT NULL DEFAULT true,
    "plan" VARCHAR(20) DEFAULT 'basico',
    "fecha_inicio_plan" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento_plan" TIMESTAMP(3),
    "max_sucursales" INTEGER NOT NULL DEFAULT 1,
    "max_usuarios" INTEGER NOT NULL DEFAULT 2,
    "max_productos" INTEGER NOT NULL DEFAULT 500,
    "addon_facturacion" BOOLEAN NOT NULL DEFAULT false,
    "addon_facturacion_desde" TIMESTAMP(3),
    "addon_ecommerce" BOOLEAN NOT NULL DEFAULT false,
    "addon_ecommerce_desde" TIMESTAMP(3),
    "addon_multialmacen" BOOLEAN NOT NULL DEFAULT false,
    "addon_multialmacen_desde" TIMESTAMP(3),
    "subdominio" VARCHAR(100),
    "dominio_personalizado" VARCHAR(200),
    "ssl_activo" BOOLEAN NOT NULL DEFAULT false,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "direccion" TEXT,
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "horario_apertura" TIME,
    "horario_cierre" TIME,
    "dias_operacion" VARCHAR(50),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "es_almacen" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "empresa_id" UUID,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,
    "nivel" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "modulo" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "empresa_id" UUID,
    "sucursal_id" UUID,
    "rol_id" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "avatar" VARCHAR(500),
    "todas_sucursales" BOOLEAN NOT NULL DEFAULT false,
    "descuento_maximo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "puede_anular_venta" BOOLEAN NOT NULL DEFAULT false,
    "puede_ver_costos" BOOLEAN NOT NULL DEFAULT false,
    "puede_ver_utilidades" BOOLEAN NOT NULL DEFAULT false,
    "puede_modificar_precios" BOOLEAN NOT NULL DEFAULT false,
    "ultimo_login" TIMESTAMP(3),
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMP(3),
    "token_reset_password" VARCHAR(255),
    "token_reset_expira" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "email_verificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "categoria_padre_id" UUID,
    "nombre" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "descripcion" TEXT,
    "imagen" VARCHAR(500),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "visible_pos" BOOLEAN NOT NULL DEFAULT true,
    "visible_web" BOOLEAN NOT NULL DEFAULT true,
    "meta_titulo" VARCHAR(70),
    "meta_descripcion" VARCHAR(160),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(170) NOT NULL,
    "logo" VARCHAR(500),
    "sitio_web" VARCHAR(300),
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "meta_titulo" VARCHAR(70),
    "meta_descripcion" VARCHAR(160),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atributos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "tipo_visual" VARCHAR(20) NOT NULL DEFAULT 'select',
    "tipo_sistema" VARCHAR(30) NOT NULL DEFAULT 'dinamico',
    "config" JSONB DEFAULT '{}',
    "genera_variante" BOOLEAN NOT NULL DEFAULT true,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "visible_en_ficha" BOOLEAN NOT NULL DEFAULT true,
    "visible_en_pos" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_atributos" (
    "id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "atributo_id" UUID NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_atributos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valores_atributo" (
    "id" UUID NOT NULL,
    "atributo_id" UUID NOT NULL,
    "valor" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "codigo_color" VARCHAR(7),
    "imagen" VARCHAR(500),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valores_atributo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "abreviatura" VARCHAR(10) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "marca_id" UUID,
    "unidad_medida_id" UUID,
    "atributo_imagen_id" UUID,
    "codigo_interno" VARCHAR(50) NOT NULL,
    "sku" VARCHAR(100),
    "codigo_barras" VARCHAR(50),
    "nombre" VARCHAR(250) NOT NULL,
    "slug" VARCHAR(270) NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion_larga" TEXT,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'simple',
    "precio_compra" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(12,2) NOT NULL,
    "precio_mayorista" DECIMAL(12,2),
    "cantidad_minima_mayorista" INTEGER NOT NULL DEFAULT 1,
    "precio_oferta" DECIMAL(12,2),
    "descuento_porcentaje" DECIMAL(5,2),
    "oferta_desde" TIMESTAMP(3),
    "oferta_hasta" TIMESTAMP(3),
    "aplica_impuesto" BOOLEAN NOT NULL DEFAULT true,
    "maneja_stock" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "stock_maximo" INTEGER,
    "imagen_principal" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "visible_pos" BOOLEAN NOT NULL DEFAULT true,
    "visible_web" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "nuevo" BOOLEAN NOT NULL DEFAULT false,
    "meta_titulo" VARCHAR(70),
    "meta_descripcion" VARCHAR(160),
    "og_imagen" VARCHAR(500),
    "og_titulo" VARCHAR(100),
    "og_descripcion" VARCHAR(200),
    "peso" DECIMAL(10,3),
    "largo" DECIMAL(10,2),
    "ancho" DECIMAL(10,2),
    "alto" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "imagen" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(200),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "codigo_barras" VARCHAR(50),
    "nombre" VARCHAR(250),
    "precio_compra" DECIMAL(12,2),
    "precio_venta" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imagen" VARCHAR(500),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variante_valores" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "valor_atributo_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variante_valores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_sucursal" (
    "id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "stock_maximo" INTEGER,
    "ubicacion" VARCHAR(100),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL DEFAULT 'DNI',
    "numero_documento" VARCHAR(20),
    "nombre" VARCHAR(150) NOT NULL,
    "apellido" VARCHAR(150),
    "razon_social" VARCHAR(200),
    "email" VARCHAR(150),
    "telefono" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "direccion" TEXT,
    "fecha_nacimiento" DATE,
    "notas" TEXT,
    "tipo_cliente" VARCHAR(20) NOT NULL DEFAULT 'regular',
    "limite_credito" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "icono" VARCHAR(100),
    "comision" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "usuario_apertura_id" UUID,
    "usuario_cierre_id" UUID,
    "monto_apertura" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_cierre" DECIMAL(12,2),
    "monto_ventas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_efectivo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_tarjeta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_otros" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "diferencia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'abierta',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "sucursal_id" UUID NOT NULL,
    "caja_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "cliente_id" UUID,
    "numero_venta" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "tipo_comprobante" VARCHAR(20) NOT NULL DEFAULT 'boleta',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'completada',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalles" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "variante_id" UUID NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unidad" DECIMAL(12,2) NOT NULL,
    "descuento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_pagos" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "metodo_pago_id" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "referencia" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venta_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_codigo_key" ON "empresas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_subdominio_key" ON "empresas"("subdominio");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_empresa_id_codigo_key" ON "sucursales"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_empresa_id_codigo_key" ON "roles"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "rol_permisos_rol_id_permiso_id_key" ON "rol_permisos"("rol_id", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresa_id_email_key" ON "usuarios"("empresa_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresa_id_slug_key" ON "categorias"("empresa_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_empresa_id_slug_key" ON "marcas"("empresa_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "atributos_empresa_id_slug_key" ON "atributos"("empresa_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_atributos_categoria_id_atributo_id_key" ON "categoria_atributos"("categoria_id", "atributo_id");

-- CreateIndex
CREATE UNIQUE INDEX "valores_atributo_atributo_id_slug_key" ON "valores_atributo"("atributo_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_empresa_id_abreviatura_key" ON "unidades_medida"("empresa_id", "abreviatura");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresa_id_codigo_interno_key" ON "productos"("empresa_id", "codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "productos_empresa_id_slug_key" ON "productos"("empresa_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "variante_valores_variante_id_valor_atributo_id_key" ON "variante_valores"("variante_id", "valor_atributo_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_sucursal_variante_id_sucursal_id_key" ON "stock_sucursal"("variante_id", "sucursal_id");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_empresa_id_tipo_documento_numero_documento_key" ON "clientes"("empresa_id", "tipo_documento", "numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_empresa_id_codigo_key" ON "metodos_pago"("empresa_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_empresa_id_sucursal_id_numero_key" ON "cajas"("empresa_id", "sucursal_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_empresa_id_numero_venta_key" ON "ventas"("empresa_id", "numero_venta");

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marcas" ADD CONSTRAINT "marcas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atributos" ADD CONSTRAINT "atributos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_atributos" ADD CONSTRAINT "categoria_atributos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_atributos" ADD CONSTRAINT "categoria_atributos_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valores_atributo" ADD CONSTRAINT "valores_atributo_atributo_id_fkey" FOREIGN KEY ("atributo_id") REFERENCES "atributos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_medida" ADD CONSTRAINT "unidades_medida_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidad_medida_id_fkey" FOREIGN KEY ("unidad_medida_id") REFERENCES "unidades_medida"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_atributo_imagen_id_fkey" FOREIGN KEY ("atributo_imagen_id") REFERENCES "atributos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variante_valores" ADD CONSTRAINT "variante_valores_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variante_valores" ADD CONSTRAINT "variante_valores_valor_atributo_id_fkey" FOREIGN KEY ("valor_atributo_id") REFERENCES "valores_atributo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_sucursal" ADD CONSTRAINT "stock_sucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_pago" ADD CONSTRAINT "metodos_pago_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_usuario_apertura_id_fkey" FOREIGN KEY ("usuario_apertura_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_usuario_cierre_id_fkey" FOREIGN KEY ("usuario_cierre_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_pagos" ADD CONSTRAINT "venta_pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_pagos" ADD CONSTRAINT "venta_pagos_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodos_pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
