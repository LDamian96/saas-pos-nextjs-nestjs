# 🗄️ BASE DE DATOS COMPLETA

## ⚠️ IMPORTANTE - REGLAS

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ESTE ARCHIVO ES LA FUENTE DE VERDAD                                    │
│                                                                          │
│  ✅ Todos los campos aquí DEBEN existir en las entidades               │
│  ✅ Todos los DTOs deben usar SOLO campos de aquí                      │
│  ✅ El frontend debe usar los MISMOS nombres de campos                 │
│  ✅ NO inventar campos que no estén aquí                               │
│                                                                          │
│  Antes de crear cualquier endpoint o componente, REVISAR este archivo  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DIAGRAMA DE RELACIONES

```
empresas (tenant)
    │
    ├── sucursales
    ├── usuarios ─── roles ─── permisos
    ├── categorias ─── categoria_atributos
    ├── marcas
    ├── atributos ─── valores_atributo
    ├── unidades_medida
    ├── productos ─── variantes ─── variante_valores
    │       │              └── stock_sucursal
    │       ├── producto_imagenes
    │       ├── producto_atributos
    │       └── producto_atributo_imagenes
    ├── proveedores
    ├── clientes ─── cliente_creditos
    ├── promociones
    ├── metodos_pago
    ├── cajas ─── movimientos_caja
    ├── ventas ─── venta_detalles ─── comprobantes ─── comprobante_detalles
    │       └── venta_pagos
    ├── movimientos_inventario
    ├── empresa_config
    ├── empresa_seo
    │
    │   ═══════════ NUEVAS TABLAS ═══════════
    │
    ├── integraciones_whatsapp (Agente IA N8N)
    ├── uso_agente_ia (Tracking IA)
    ├── landing_secciones (Landing Page)
    ├── landing_testimonios
    ├── landing_contactos (Leads)
    └── suscripciones ─── suscripcion_addons
            │                   └── addons
            └── pagos

plantillas_nicho (sistema)
    └── plantilla_atributos

planes (sistema)
    └── suscripciones

facturacion_config (addon)
    └── facturacion_log
    └── resumenes_diarios
```

---

## 🏢 TABLA: empresas

```sql
-- Tabla principal de tenants (multi-empresa)
CREATE TABLE empresas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información básica
    codigo                  VARCHAR(20) UNIQUE NOT NULL,        -- EMP-001
    nombre_comercial        VARCHAR(200) NOT NULL,
    razon_social            VARCHAR(200),
    ruc                     VARCHAR(20),                         -- RUC/NIT/RFC

    -- Contacto
    email                   VARCHAR(150) NOT NULL,
    telefono                VARCHAR(20),
    whatsapp                VARCHAR(20),
    direccion_fiscal        TEXT,

    -- Branding
    logo                    VARCHAR(500),                        -- URL imagen
    logo_secundario         VARCHAR(500),
    favicon                 VARCHAR(500),
    color_primario          VARCHAR(7) DEFAULT '#3B82F6',        -- Hex
    color_secundario        VARCHAR(7) DEFAULT '#1E40AF',
    slogan                  VARCHAR(200),

    -- Configuración regional
    pais                    VARCHAR(50) DEFAULT 'Perú',
    moneda                  VARCHAR(3) DEFAULT 'PEN',            -- ISO 4217
    simbolo_moneda          VARCHAR(5) DEFAULT 'S/.',
    zona_horaria            VARCHAR(50) DEFAULT 'America/Lima',
    formato_fecha           VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    idioma                  VARCHAR(5) DEFAULT 'es',

    -- Configuración fiscal
    aplica_impuesto         BOOLEAN DEFAULT true,
    porcentaje_impuesto     DECIMAL(5,2) DEFAULT 18.00,          -- IGV 18%
    nombre_impuesto         VARCHAR(20) DEFAULT 'IGV',
    precio_incluye_impuesto BOOLEAN DEFAULT true,

    -- Nicho (onboarding)
    plantilla_nicho_id      UUID,                                -- FK a plantillas_nicho (puede ser NULL)
    -- Se usa en onboarding para pre-crear atributos sugeridos

    -- Plan SaaS
    plan                    VARCHAR(20) DEFAULT 'basico',        -- basico, pro, enterprise
    fecha_inicio_plan       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento_plan  TIMESTAMP,
    max_sucursales          INTEGER DEFAULT 1,
    max_usuarios            INTEGER DEFAULT 2,
    max_productos           INTEGER DEFAULT 500,

    -- Addons (módulos adicionales de pago)
    addon_facturacion       BOOLEAN DEFAULT false,               -- Facturación electrónica SUNAT (+$5 USD/mes)
    addon_facturacion_desde TIMESTAMP,                           -- Fecha activación
    addon_ecommerce         BOOLEAN DEFAULT false,               -- Tienda online (+$10 USD/mes)
    addon_ecommerce_desde   TIMESTAMP,
    addon_multialmacen      BOOLEAN DEFAULT false,               -- Multi-almacén (+$5 USD/mes)
    addon_multialmacen_desde TIMESTAMP,

    -- Dominios
    subdominio              VARCHAR(100) UNIQUE,                 -- tiendajuan (para tiendajuan.tupos.com)
    dominio_personalizado   VARCHAR(200),                        -- www.tiendajuan.com
    ssl_activo              BOOLEAN DEFAULT false,

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'activo',        -- activo, suspendido, cancelado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,

    CONSTRAINT chk_plan CHECK (plan IN ('basico', 'pro', 'enterprise')),
    CONSTRAINT chk_estado CHECK (estado IN ('activo', 'suspendido', 'cancelado'))
);

CREATE INDEX idx_empresas_codigo ON empresas(codigo);
CREATE INDEX idx_empresas_subdominio ON empresas(subdominio);
CREATE INDEX idx_empresas_estado ON empresas(estado);
```

### Campos empresas
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| codigo | VARCHAR(20) | Sí | Código único EMP-001 |
| nombre_comercial | VARCHAR(200) | Sí | Nombre de la empresa |
| razon_social | VARCHAR(200) | No | Razón social legal |
| ruc | VARCHAR(20) | No | RUC/NIT/RFC |
| email | VARCHAR(150) | Sí | Email principal |
| telefono | VARCHAR(20) | No | Teléfono |
| whatsapp | VARCHAR(20) | No | WhatsApp |
| direccion_fiscal | TEXT | No | Dirección |
| logo | VARCHAR(500) | No | URL logo |
| logo_secundario | VARCHAR(500) | No | URL logo secundario |
| favicon | VARCHAR(500) | No | URL favicon |
| color_primario | VARCHAR(7) | No | Color hex #XXXXXX |
| color_secundario | VARCHAR(7) | No | Color hex #XXXXXX |
| slogan | VARCHAR(200) | No | Slogan empresa |
| pais | VARCHAR(50) | No | País |
| moneda | VARCHAR(3) | No | ISO 4217 (PEN, USD) |
| simbolo_moneda | VARCHAR(5) | No | S/., $ |
| zona_horaria | VARCHAR(50) | No | Zona horaria |
| formato_fecha | VARCHAR(20) | No | Formato fecha |
| idioma | VARCHAR(5) | No | Código idioma |
| aplica_impuesto | BOOLEAN | No | ¿Aplica impuesto? |
| porcentaje_impuesto | DECIMAL(5,2) | No | % impuesto |
| nombre_impuesto | VARCHAR(20) | No | Nombre impuesto |
| precio_incluye_impuesto | BOOLEAN | No | ¿Precio incluye? |
| plantilla_nicho_id | UUID | No | FK plantilla nicho (onboarding) |
| plan | VARCHAR(20) | No | Plan SaaS |
| fecha_inicio_plan | TIMESTAMP | No | Inicio plan |
| fecha_vencimiento_plan | TIMESTAMP | No | Vencimiento |
| max_sucursales | INTEGER | No | Máx sucursales |
| max_usuarios | INTEGER | No | Máx usuarios |
| max_productos | INTEGER | No | Máx productos |
| **addon_facturacion** | BOOLEAN | No | **Facturación SUNAT (+$5/mes)** |
| addon_facturacion_desde | TIMESTAMP | No | Fecha activación |
| addon_ecommerce | BOOLEAN | No | Tienda online (+$10/mes) |
| addon_ecommerce_desde | TIMESTAMP | No | Fecha activación |
| addon_multialmacen | BOOLEAN | No | Multi-almacén (+$5/mes) |
| addon_multialmacen_desde | TIMESTAMP | No | Fecha activación |
| subdominio | VARCHAR(100) | No | Subdominio único |
| dominio_personalizado | VARCHAR(200) | No | Dominio propio |
| ssl_activo | BOOLEAN | No | SSL activo |
| estado | VARCHAR(20) | No | Estado cuenta |
| activo | BOOLEAN | No | ¿Activo? |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |
| created_by | UUID | No | Usuario creador |

---

## 🌎 TABLA: paises_config (Sistema - Referencia)

```sql
-- Tabla de referencia para configuración por país (NO es multi-tenant)
-- Se usa en onboarding para precargar valores según el país seleccionado
CREATE TABLE paises_config (
    codigo                  VARCHAR(2) PRIMARY KEY,              -- ISO 3166-1 alpha-2: PE, MX, CO, US
    nombre                  VARCHAR(100) NOT NULL,               -- Perú, México, Colombia, USA
    nombre_en               VARCHAR(100) NOT NULL,               -- Peru, Mexico, Colombia, USA

    -- Moneda
    moneda                  VARCHAR(3) NOT NULL,                 -- ISO 4217: PEN, MXN, COP, USD
    simbolo_moneda          VARCHAR(5) NOT NULL,                 -- S/., $, $, $
    posicion_simbolo        VARCHAR(10) DEFAULT 'antes',         -- antes, despues
    decimales_moneda        INTEGER DEFAULT 2,
    separador_miles         VARCHAR(1) DEFAULT ',',
    separador_decimal       VARCHAR(1) DEFAULT '.',

    -- Regional
    zona_horaria            VARCHAR(50) NOT NULL,                -- America/Lima, America/Mexico_City
    formato_fecha           VARCHAR(20) DEFAULT 'DD/MM/YYYY',    -- DD/MM/YYYY, MM/DD/YYYY
    idioma                  VARCHAR(5) DEFAULT 'es',             -- es, en
    locale                  VARCHAR(10) NOT NULL,                -- es-PE, es-MX, en-US

    -- Fiscal
    nombre_documento_fiscal VARCHAR(20) NOT NULL,                -- RUC, RFC, NIT, EIN
    regex_documento_fiscal  VARCHAR(100),                        -- Validación regex
    nombre_impuesto         VARCHAR(20) NOT NULL,                -- IGV, IVA, Sales Tax
    porcentaje_impuesto     DECIMAL(5,2) NOT NULL,               -- 18.00, 16.00, 19.00, 0.00
    impuesto_variable       BOOLEAN DEFAULT false,               -- true para USA (varía por estado)

    -- Facturación electrónica
    tiene_facturacion_e     BOOLEAN DEFAULT false,
    proveedor_facturacion   VARCHAR(50),                         -- nubefact, sat, dian, null

    -- Estado
    activo                  BOOLEAN DEFAULT true,
    orden                   INTEGER DEFAULT 0
);

-- Datos iniciales
INSERT INTO paises_config VALUES
('PE', 'Perú', 'Peru', 'PEN', 'S/.', 'antes', 2, ',', '.', 'America/Lima', 'DD/MM/YYYY', 'es', 'es-PE', 'RUC', '^(10|20)\d{9}$', 'IGV', 18.00, false, true, 'nubefact', true, 1),
('MX', 'México', 'Mexico', 'MXN', '$', 'antes', 2, ',', '.', 'America/Mexico_City', 'DD/MM/YYYY', 'es', 'es-MX', 'RFC', '^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$', 'IVA', 16.00, false, true, 'sat', true, 2),
('CO', 'Colombia', 'Colombia', 'COP', '$', 'antes', 0, '.', ',', 'America/Bogota', 'DD/MM/YYYY', 'es', 'es-CO', 'NIT', '^\d{9}-\d{1}$', 'IVA', 19.00, false, true, 'dian', true, 3),
('CL', 'Chile', 'Chile', 'CLP', '$', 'antes', 0, '.', ',', 'America/Santiago', 'DD/MM/YYYY', 'es', 'es-CL', 'RUT', '^\d{7,8}-[\dkK]$', 'IVA', 19.00, false, true, 'sii', true, 4),
('AR', 'Argentina', 'Argentina', 'ARS', '$', 'antes', 2, '.', ',', 'America/Buenos_Aires', 'DD/MM/YYYY', 'es', 'es-AR', 'CUIT', '^\d{2}-\d{8}-\d{1}$', 'IVA', 21.00, false, true, 'afip', true, 5),
('US', 'Estados Unidos', 'United States', 'USD', '$', 'antes', 2, ',', '.', 'America/New_York', 'MM/DD/YYYY', 'en', 'en-US', 'EIN', '^\d{2}-\d{7}$', 'Sales Tax', 0.00, true, false, null, true, 6),
('EC', 'Ecuador', 'Ecuador', 'USD', '$', 'antes', 2, ',', '.', 'America/Guayaquil', 'DD/MM/YYYY', 'es', 'es-EC', 'RUC', '^\d{13}$', 'IVA', 12.00, false, true, 'sri', true, 7);
```

### Configuración por País
| País | Moneda | Impuesto | Doc. Fiscal | Facturación-e |
|------|--------|----------|-------------|---------------|
| 🇵🇪 Perú | PEN (S/.) | IGV 18% | RUC | Nubefact |
| 🇲🇽 México | MXN ($) | IVA 16% | RFC | SAT |
| 🇨🇴 Colombia | COP ($) | IVA 19% | NIT | DIAN |
| 🇨🇱 Chile | CLP ($) | IVA 19% | RUT | SII |
| 🇦🇷 Argentina | ARS ($) | IVA 21% | CUIT | AFIP |
| 🇺🇸 USA | USD ($) | Sales Tax (variable) | EIN | No |
| 🇪🇨 Ecuador | USD ($) | IVA 12% | RUC | SRI |

---

## 🏪 TABLA: sucursales

```sql
CREATE TABLE sucursales (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    codigo                  VARCHAR(20) NOT NULL,                -- SUC-001
    nombre                  VARCHAR(150) NOT NULL,
    direccion               TEXT,
    telefono                VARCHAR(20),
    email                   VARCHAR(150),

    -- Ubicación
    latitud                 DECIMAL(10, 8),
    longitud                DECIMAL(11, 8),

    -- Horario
    horario_apertura        TIME,
    horario_cierre          TIME,
    dias_operacion          VARCHAR(50),                         -- L,M,X,J,V,S,D

    -- Configuración
    es_principal            BOOLEAN DEFAULT false,
    es_almacen              BOOLEAN DEFAULT false,               -- Solo almacén, no vende

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_sucursal_codigo UNIQUE (empresa_id, codigo)
);

CREATE INDEX idx_sucursales_empresa ON sucursales(empresa_id);
```

### Campos sucursales
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| codigo | VARCHAR(20) | Sí | Código SUC-001 |
| nombre | VARCHAR(150) | Sí | Nombre sucursal |
| direccion | TEXT | No | Dirección |
| telefono | VARCHAR(20) | No | Teléfono |
| email | VARCHAR(150) | No | Email |
| latitud | DECIMAL(10,8) | No | Latitud mapa |
| longitud | DECIMAL(11,8) | No | Longitud mapa |
| horario_apertura | TIME | No | Hora apertura |
| horario_cierre | TIME | No | Hora cierre |
| dias_operacion | VARCHAR(50) | No | Días operación |
| es_principal | BOOLEAN | No | ¿Es principal? |
| es_almacen | BOOLEAN | No | ¿Solo almacén? |
| activo | BOOLEAN | No | ¿Activo? |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |

---

## 👥 TABLA: roles

```sql
CREATE TABLE roles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID REFERENCES empresas(id) ON DELETE CASCADE,  -- NULL = rol del sistema

    -- Información
    codigo                  VARCHAR(50) NOT NULL,                -- admin, supervisor, cajero
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Configuración
    es_sistema              BOOLEAN DEFAULT false,               -- Roles predefinidos
    nivel                   INTEGER DEFAULT 0,                   -- Jerarquía

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_rol_codigo UNIQUE (empresa_id, codigo)
);

-- Roles del sistema (empresa_id = NULL)
INSERT INTO roles (id, codigo, nombre, descripcion, es_sistema, nivel) VALUES
    (gen_random_uuid(), 'super_admin', 'Super Administrador', 'Control total del SaaS', true, 100),
    (gen_random_uuid(), 'admin', 'Administrador', 'Administrador de empresa', true, 90),
    (gen_random_uuid(), 'supervisor', 'Supervisor', 'Supervisor de tienda', true, 70),
    (gen_random_uuid(), 'cajero', 'Cajero', 'Cajero punto de venta', true, 50),
    (gen_random_uuid(), 'almacenero', 'Almacenero', 'Gestión de inventario', true, 50),
    (gen_random_uuid(), 'vendedor', 'Vendedor', 'Solo ventas', true, 40);
```

---

## 🔐 TABLA: permisos

```sql
CREATE TABLE permisos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información
    codigo                  VARCHAR(100) UNIQUE NOT NULL,        -- productos.crear
    nombre                  VARCHAR(150) NOT NULL,
    descripcion             TEXT,
    modulo                  VARCHAR(50) NOT NULL,                -- productos, ventas, etc.

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permisos por módulo
INSERT INTO permisos (id, codigo, nombre, modulo) VALUES
    -- Productos
    (gen_random_uuid(), 'productos.ver', 'Ver productos', 'productos'),
    (gen_random_uuid(), 'productos.crear', 'Crear productos', 'productos'),
    (gen_random_uuid(), 'productos.editar', 'Editar productos', 'productos'),
    (gen_random_uuid(), 'productos.eliminar', 'Eliminar productos', 'productos'),
    (gen_random_uuid(), 'productos.importar', 'Importar productos', 'productos'),
    (gen_random_uuid(), 'productos.exportar', 'Exportar productos', 'productos'),

    -- Ventas
    (gen_random_uuid(), 'ventas.crear', 'Crear ventas', 'ventas'),
    (gen_random_uuid(), 'ventas.ver', 'Ver ventas', 'ventas'),
    (gen_random_uuid(), 'ventas.anular', 'Anular ventas', 'ventas'),
    (gen_random_uuid(), 'ventas.descuento', 'Aplicar descuentos', 'ventas'),

    -- Inventario
    (gen_random_uuid(), 'inventario.ver', 'Ver inventario', 'inventario'),
    (gen_random_uuid(), 'inventario.entrada', 'Registrar entradas', 'inventario'),
    (gen_random_uuid(), 'inventario.salida', 'Registrar salidas', 'inventario'),
    (gen_random_uuid(), 'inventario.ajuste', 'Ajustar inventario', 'inventario'),

    -- Caja
    (gen_random_uuid(), 'caja.apertura', 'Apertura de caja', 'caja'),
    (gen_random_uuid(), 'caja.cierre', 'Cierre de caja', 'caja'),
    (gen_random_uuid(), 'caja.movimientos', 'Movimientos de caja', 'caja'),

    -- Reportes
    (gen_random_uuid(), 'reportes.ventas', 'Ver reportes de ventas', 'reportes'),
    (gen_random_uuid(), 'reportes.inventario', 'Ver reportes de inventario', 'reportes'),
    (gen_random_uuid(), 'reportes.financiero', 'Ver reportes financieros', 'reportes'),

    -- Configuración
    (gen_random_uuid(), 'config.empresa', 'Configurar empresa', 'configuracion'),
    (gen_random_uuid(), 'config.usuarios', 'Gestionar usuarios', 'configuracion'),
    (gen_random_uuid(), 'config.sucursales', 'Gestionar sucursales', 'configuracion');
```

---

## 🔗 TABLA: rol_permisos

```sql
CREATE TABLE rol_permisos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_id                  UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id              UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_rol_permiso UNIQUE (rol_id, permiso_id)
);

CREATE INDEX idx_rol_permisos_rol ON rol_permisos(rol_id);
```

---

## 👤 TABLA: usuarios

```sql
CREATE TABLE usuarios (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID REFERENCES empresas(id) ON DELETE CASCADE,  -- NULL = super admin
    sucursal_id             UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    rol_id                  UUID NOT NULL REFERENCES roles(id),

    -- Credenciales
    email                   VARCHAR(150) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,

    -- Información personal
    nombre                  VARCHAR(100) NOT NULL,
    apellido                VARCHAR(100) NOT NULL,
    telefono                VARCHAR(20),
    avatar                  VARCHAR(500),

    -- Acceso a sucursales
    todas_sucursales        BOOLEAN DEFAULT false,               -- Acceso a TODAS las sucursales
    -- Si todas_sucursales=false, revisar tabla usuario_sucursales

    -- Permisos especiales (override rol)
    descuento_maximo        DECIMAL(5,2) DEFAULT 0,              -- % máximo descuento
    puede_anular_venta      BOOLEAN DEFAULT false,
    puede_ver_costos        BOOLEAN DEFAULT false,
    puede_ver_utilidades    BOOLEAN DEFAULT false,
    puede_modificar_precios BOOLEAN DEFAULT false,

    -- Seguridad
    ultimo_login            TIMESTAMP,
    intentos_fallidos       INTEGER DEFAULT 0,
    bloqueado_hasta         TIMESTAMP,
    token_reset_password    VARCHAR(255),
    token_reset_expira      TIMESTAMP,

    -- Estado
    activo                  BOOLEAN DEFAULT true,
    email_verificado        BOOLEAN DEFAULT false,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID,

    CONSTRAINT uk_usuario_email UNIQUE (empresa_id, email)
);

CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
```

### Campos usuarios
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | No | FK empresa (NULL=super admin) |
| sucursal_id | UUID | No | FK sucursal asignada (principal) |
| todas_sucursales | BOOLEAN | No | ¿Acceso a TODAS las sucursales? |
| rol_id | UUID | Sí | FK rol |
| email | VARCHAR(150) | Sí | Email único |
| password_hash | VARCHAR(255) | Sí | Password hasheado |
| nombre | VARCHAR(100) | Sí | Nombre |
| apellido | VARCHAR(100) | Sí | Apellido |
| telefono | VARCHAR(20) | No | Teléfono |
| avatar | VARCHAR(500) | No | URL avatar |
| descuento_maximo | DECIMAL(5,2) | No | % descuento máximo |
| puede_anular_venta | BOOLEAN | No | Permiso especial |
| puede_ver_costos | BOOLEAN | No | Permiso especial |
| puede_ver_utilidades | BOOLEAN | No | Permiso especial |
| puede_modificar_precios | BOOLEAN | No | Permiso especial |
| ultimo_login | TIMESTAMP | No | Último acceso |
| intentos_fallidos | INTEGER | No | Intentos fallidos |
| bloqueado_hasta | TIMESTAMP | No | Bloqueado hasta |
| token_reset_password | VARCHAR(255) | No | Token reset |
| token_reset_expira | TIMESTAMP | No | Expira token |
| activo | BOOLEAN | No | ¿Activo? |
| email_verificado | BOOLEAN | No | ¿Email verificado? |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |
| created_by | UUID | No | Usuario creador |

---

## 👤🏪 TABLA: usuario_sucursales (Multi-Sucursal)

> Permite asignar **múltiples sucursales** a un usuario. Útil para supervisores regionales o empleados que rotan.

```sql
CREATE TABLE usuario_sucursales (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- Rol en esta sucursal (puede variar)
    es_principal            BOOLEAN DEFAULT false,               -- Sucursal principal/default
    rol_sucursal            VARCHAR(50),                         -- supervisor, cajero, etc. (override)

    -- Permisos específicos para esta sucursal
    puede_ver_reportes      BOOLEAN DEFAULT true,
    puede_gestionar_caja    BOOLEAN DEFAULT true,
    puede_gestionar_stock   BOOLEAN DEFAULT true,

    -- Horario asignado (opcional)
    dias_asignados          VARCHAR(20)[],                       -- ['lunes', 'martes', 'miercoles']
    hora_inicio             TIME,
    hora_fin                TIME,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asignado_por            UUID REFERENCES usuarios(id),

    CONSTRAINT uk_usuario_sucursal UNIQUE (usuario_id, sucursal_id)
);

CREATE INDEX idx_usuario_sucursales_usuario ON usuario_sucursales(usuario_id);
CREATE INDEX idx_usuario_sucursales_sucursal ON usuario_sucursales(sucursal_id);
```

### Campos usuario_sucursales

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| usuario_id | UUID | Sí | FK usuario |
| sucursal_id | UUID | Sí | FK sucursal |
| es_principal | BOOLEAN | No | ¿Es su sucursal default? |
| rol_sucursal | VARCHAR(50) | No | Rol específico en esta sucursal |
| puede_ver_reportes | BOOLEAN | No | Ver reportes de esta sucursal |
| puede_gestionar_caja | BOOLEAN | No | Gestionar caja de esta sucursal |
| puede_gestionar_stock | BOOLEAN | No | Gestionar stock de esta sucursal |
| dias_asignados | VARCHAR(20)[] | No | Días que trabaja aquí |
| hora_inicio | TIME | No | Hora entrada |
| hora_fin | TIME | No | Hora salida |
| activo | BOOLEAN | No | ¿Asignación activa? |
| created_at | TIMESTAMP | Auto | Fecha asignación |
| asignado_por | UUID | No | Quién lo asignó |

### Ejemplos de Uso Multi-Sucursal

```sql
-- Supervisor regional: acceso a 3 sucursales
INSERT INTO usuario_sucursales (usuario_id, sucursal_id, es_principal, rol_sucursal) VALUES
('uuid-supervisor', 'uuid-sucursal-norte', true, 'supervisor'),
('uuid-supervisor', 'uuid-sucursal-sur', false, 'supervisor'),
('uuid-supervisor', 'uuid-sucursal-centro', false, 'supervisor');

-- Cajero que rota entre 2 sucursales por días
INSERT INTO usuario_sucursales (usuario_id, sucursal_id, es_principal, dias_asignados) VALUES
('uuid-cajero', 'uuid-sucursal-1', true, ARRAY['lunes', 'martes', 'miercoles']),
('uuid-cajero', 'uuid-sucursal-2', false, ARRAY['jueves', 'viernes', 'sabado']);

-- Consultar sucursales de un usuario
SELECT s.nombre, us.es_principal, us.rol_sucursal
FROM usuario_sucursales us
JOIN sucursales s ON s.id = us.sucursal_id
WHERE us.usuario_id = 'uuid-usuario' AND us.activo = true;
```

---

## 📂 TABLA: categorias

```sql
CREATE TABLE categorias (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    categoria_padre_id      UUID REFERENCES categorias(id) ON DELETE SET NULL,

    -- Información
    nombre                  VARCHAR(150) NOT NULL,
    slug                    VARCHAR(170) NOT NULL,
    descripcion             TEXT,
    imagen                  VARCHAR(500),

    -- Orden y visualización
    orden                   INTEGER DEFAULT 0,

    -- Visibilidad
    activo                  BOOLEAN DEFAULT true,
    visible_pos             BOOLEAN DEFAULT true,
    visible_web             BOOLEAN DEFAULT true,

    -- SEO
    meta_titulo             VARCHAR(70),
    meta_descripcion        VARCHAR(160),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_categoria_slug UNIQUE (empresa_id, slug)
);

CREATE INDEX idx_categorias_empresa ON categorias(empresa_id);
CREATE INDEX idx_categorias_padre ON categorias(categoria_padre_id);
CREATE INDEX idx_categorias_slug ON categorias(slug);
```

### Campos categorias
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| categoria_padre_id | UUID | No | FK categoría padre |
| nombre | VARCHAR(150) | Sí | Nombre categoría |
| slug | VARCHAR(170) | Sí | URL amigable |
| descripcion | TEXT | No | Descripción |
| imagen | VARCHAR(500) | No | URL imagen |
| orden | INTEGER | No | Orden visualización |
| activo | BOOLEAN | No | ¿Activo? |
| visible_pos | BOOLEAN | No | ¿Visible en POS? |
| visible_web | BOOLEAN | No | ¿Visible en web? |
| meta_titulo | VARCHAR(70) | No | SEO título |
| meta_descripcion | VARCHAR(160) | No | SEO descripción |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |

---

## 🏷️ TABLA: marcas

```sql
CREATE TABLE marcas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    nombre                  VARCHAR(150) NOT NULL,
    slug                    VARCHAR(170) NOT NULL,
    logo                    VARCHAR(500),
    sitio_web               VARCHAR(300),
    descripcion             TEXT,

    -- Visualización
    orden                   INTEGER DEFAULT 0,
    destacada               BOOLEAN DEFAULT false,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- SEO
    meta_titulo             VARCHAR(70),
    meta_descripcion        VARCHAR(160),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_marca_slug UNIQUE (empresa_id, slug)
);

CREATE INDEX idx_marcas_empresa ON marcas(empresa_id);
CREATE INDEX idx_marcas_slug ON marcas(slug);
```

### Campos marcas
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| nombre | VARCHAR(150) | Sí | Nombre marca |
| slug | VARCHAR(170) | Sí | URL amigable |
| logo | VARCHAR(500) | No | URL logo |
| sitio_web | VARCHAR(300) | No | Sitio web |
| descripcion | TEXT | No | Descripción |
| orden | INTEGER | No | Orden visualización |
| destacada | BOOLEAN | No | ¿Destacada? |
| activo | BOOLEAN | No | ¿Activo? |
| meta_titulo | VARCHAR(70) | No | SEO título |
| meta_descripcion | VARCHAR(160) | No | SEO descripción |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |

---

## 🎨 TABLA: atributos (⭐ ACTUALIZADA)

```sql
CREATE TABLE atributos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    nombre                  VARCHAR(100) NOT NULL,               -- Talla, Color, Vencimiento
    slug                    VARCHAR(120) NOT NULL,

    -- Tipo de visualización (UI)
    tipo_visual             VARCHAR(20) DEFAULT 'select',        -- select, color, button, image, date, text

    -- Tipo de sistema (comportamiento especial)
    tipo_sistema            VARCHAR(30) DEFAULT 'dinamico',
    -- dinamico: Atributos normales creados por usuario (Talla, Color, Material)
    -- fecha_vencimiento: Atributo con alertas automáticas (30, 60, 90 días)
    -- lote: Para trazabilidad de lotes
    -- numero_serie: Para productos únicos con serie

    -- Configuración avanzada (JSONB)
    config                  JSONB DEFAULT '{}',
    -- Para fecha_vencimiento: {"alertas_dias": [30, 60, 90], "fefo": true}
    -- Para lote: {"trazabilidad": true}
    -- Para color: {"mostrar_codigo_hex": true}
    -- Para talla: {"orden_personalizado": ["XS","S","M","L","XL","XXL"]}

    -- Configuración
    genera_variante         BOOLEAN DEFAULT true,                -- ¿Genera variantes? (Talla/Color sí, Vencimiento no)
    obligatorio             BOOLEAN DEFAULT false,               -- ¿Obligatorio al crear producto?
    visible_en_ficha        BOOLEAN DEFAULT true,
    visible_en_pos          BOOLEAN DEFAULT true,

    -- Orden
    orden                   INTEGER DEFAULT 0,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_atributo_slug UNIQUE (empresa_id, slug),
    CONSTRAINT chk_tipo_visual CHECK (tipo_visual IN ('select', 'color', 'button', 'image', 'date', 'text')),
    CONSTRAINT chk_tipo_sistema CHECK (tipo_sistema IN ('dinamico', 'fecha_vencimiento', 'lote', 'numero_serie'))
);

CREATE INDEX idx_atributos_empresa ON atributos(empresa_id);
CREATE INDEX idx_atributos_tipo_sistema ON atributos(tipo_sistema);
```

### Campos atributos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| nombre | VARCHAR(100) | Sí | Nombre atributo |
| slug | VARCHAR(120) | Sí | URL amigable |
| tipo_visual | VARCHAR(20) | No | Tipo visualización UI |
| tipo_sistema | VARCHAR(30) | No | Comportamiento especial |
| config | JSONB | No | Configuración avanzada |
| genera_variante | BOOLEAN | No | ¿Genera variantes? |
| obligatorio | BOOLEAN | No | ¿Obligatorio? |
| visible_en_ficha | BOOLEAN | No | ¿Visible en ficha? |
| visible_en_pos | BOOLEAN | No | ¿Visible en POS? |
| orden | INTEGER | No | Orden visualización |
| activo | BOOLEAN | No | ¿Activo? |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |

---

## 🔗 TABLA: categoria_atributos (⭐ NUEVA)

```sql
-- Vincula categorías con atributos
-- Permite definir qué atributos aplican a cada categoría
-- Al crear un producto de una categoría, solo se muestran sus atributos vinculados
CREATE TABLE categoria_atributos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id            UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
    atributo_id             UUID NOT NULL REFERENCES atributos(id) ON DELETE CASCADE,

    -- Configuración por categoría
    obligatorio             BOOLEAN DEFAULT false,               -- ¿Obligatorio para esta categoría?
    orden                   INTEGER DEFAULT 0,                   -- Orden en el formulario

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_categoria_atributo UNIQUE (categoria_id, atributo_id)
);

CREATE INDEX idx_categoria_atributos_categoria ON categoria_atributos(categoria_id);
CREATE INDEX idx_categoria_atributos_atributo ON categoria_atributos(atributo_id);
```

### Campos categoria_atributos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| categoria_id | UUID | Sí | FK categoría |
| atributo_id | UUID | Sí | FK atributo |
| obligatorio | BOOLEAN | No | ¿Obligatorio en esta categoría? |
| orden | INTEGER | No | Orden en formulario |
| created_at | TIMESTAMP | Auto | Fecha creación |

### Ejemplo de uso: Gestión desde Categoría
```sql
-- FLUJO: Al editar categoría "Zapatillas"
-- 1. Se muestran atributos YA vinculados: Talla, Color
-- 2. Se muestran OTROS atributos disponibles para agregar
-- 3. Se puede CREAR nuevo atributo desde ahí

-- Categoría "Zapatillas" tiene atributos: Talla, Color, Material
INSERT INTO categoria_atributos (categoria_id, atributo_id, obligatorio, orden) VALUES
    ('uuid-zapatillas', 'uuid-talla', true, 1),
    ('uuid-zapatillas', 'uuid-color', true, 2),
    ('uuid-zapatillas', 'uuid-material', false, 3);

-- Categoría "Medicamentos" tiene atributos: Vencimiento, Lote
INSERT INTO categoria_atributos (categoria_id, atributo_id, obligatorio, orden) VALUES
    ('uuid-medicamentos', 'uuid-vencimiento', true, 1),
    ('uuid-medicamentos', 'uuid-lote', true, 2);

-- Un usuario de "Zapatillas" puede agregar "Vencimiento" si importa productos
-- No está limitado, solo son sugerencias/defaults por categoría
```

---

## 🔢 TABLA: valores_atributo

```sql
CREATE TABLE valores_atributo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atributo_id             UUID NOT NULL REFERENCES atributos(id) ON DELETE CASCADE,

    -- Información
    valor                   VARCHAR(100) NOT NULL,               -- S, M, L, Rojo, Azul
    slug                    VARCHAR(120) NOT NULL,

    -- Visual (para tipo color)
    codigo_color            VARCHAR(7),                          -- #FF0000

    -- Visual (para tipo image)
    imagen                  VARCHAR(500),

    -- Orden
    orden                   INTEGER DEFAULT 0,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_valor_atributo UNIQUE (atributo_id, slug)
);

CREATE INDEX idx_valores_atributo ON valores_atributo(atributo_id);
```

### Campos valores_atributo
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| atributo_id | UUID | Sí | FK atributo |
| valor | VARCHAR(100) | Sí | Valor (S, Rojo, etc) |
| slug | VARCHAR(120) | Sí | URL amigable |
| codigo_color | VARCHAR(7) | No | Color hex #XXXXXX |
| imagen | VARCHAR(500) | No | URL imagen |
| orden | INTEGER | No | Orden visualización |
| activo | BOOLEAN | No | ¿Activo? |
| created_at | TIMESTAMP | Auto | Fecha creación |

---

## 📏 TABLA: unidades_medida

```sql
CREATE TABLE unidades_medida (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    nombre                  VARCHAR(50) NOT NULL,                -- Unidad, Kilogramo
    abreviatura             VARCHAR(10) NOT NULL,                -- und, kg, lt

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_unidad_abreviatura UNIQUE (empresa_id, abreviatura)
);

CREATE INDEX idx_unidades_empresa ON unidades_medida(empresa_id);
```

---

## 📦 TABLA: productos (⭐ PRINCIPAL)

```sql
CREATE TABLE productos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    categoria_id            UUID NOT NULL REFERENCES categorias(id),
    marca_id                UUID REFERENCES marcas(id) ON DELETE SET NULL,
    unidad_medida_id        UUID REFERENCES unidades_medida(id) ON DELETE SET NULL,
    atributo_imagen_id      UUID REFERENCES atributos(id) ON DELETE SET NULL,

    -- Identificadores
    codigo_interno          VARCHAR(50) NOT NULL,                -- PROD-00001
    sku                     VARCHAR(100),                        -- SKU único
    codigo_barras           VARCHAR(50),                         -- EAN-13 (para productos simples)

    -- Información
    nombre                  VARCHAR(250) NOT NULL,
    slug                    VARCHAR(270) NOT NULL,
    descripcion_corta       TEXT,
    descripcion_larga       TEXT,

    -- Tipo de producto
    tipo                    VARCHAR(20) DEFAULT 'simple',        -- simple, variable

    -- Precios
    precio_compra           DECIMAL(12,2) DEFAULT 0,             -- Costo
    precio_venta            DECIMAL(12,2) NOT NULL,              -- Precio público
    precio_mayorista        DECIMAL(12,2),                       -- Precio mayorista
    cantidad_minima_mayorista INTEGER DEFAULT 1,

    -- Descuento/Oferta
    precio_oferta           DECIMAL(12,2),                       -- Precio con descuento
    descuento_porcentaje    DECIMAL(5,2),                        -- % descuento
    oferta_desde            TIMESTAMP,                           -- Inicio oferta
    oferta_hasta            TIMESTAMP,                           -- Fin oferta

    -- Impuestos
    aplica_impuesto         BOOLEAN DEFAULT true,

    -- Inventario (solo para tipo simple)
    maneja_stock            BOOLEAN DEFAULT true,
    stock                   INTEGER DEFAULT 0,                   -- Stock (simple)
    stock_minimo            INTEGER DEFAULT 0,
    stock_maximo            INTEGER,                             -- Alerta stock alto

    -- Imágenes
    imagen_principal        VARCHAR(500),

    -- Visibilidad
    activo                  BOOLEAN DEFAULT true,
    visible_pos             BOOLEAN DEFAULT true,
    visible_web             BOOLEAN DEFAULT true,
    destacado               BOOLEAN DEFAULT false,
    nuevo                   BOOLEAN DEFAULT false,

    -- SEO
    meta_titulo             VARCHAR(70),
    meta_descripcion        VARCHAR(160),

    -- Open Graph
    og_imagen               VARCHAR(500),
    og_titulo               VARCHAR(100),
    og_descripcion          VARCHAR(200),

    -- Peso y dimensiones (opcional)
    peso                    DECIMAL(10,3),                       -- kg
    largo                   DECIMAL(10,2),                       -- cm
    ancho                   DECIMAL(10,2),                       -- cm
    alto                    DECIMAL(10,2),                       -- cm

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES usuarios(id),

    CONSTRAINT uk_producto_codigo UNIQUE (empresa_id, codigo_interno),
    CONSTRAINT uk_producto_slug UNIQUE (empresa_id, slug),
    CONSTRAINT chk_producto_tipo CHECK (tipo IN ('simple', 'variable'))
);

CREATE INDEX idx_productos_empresa ON productos(empresa_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_codigo ON productos(codigo_interno);
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_activo ON productos(activo);
```

### Campos productos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| categoria_id | UUID | Sí | FK categoría |
| marca_id | UUID | No | FK marca |
| unidad_medida_id | UUID | No | FK unidad medida |
| atributo_imagen_id | UUID | No | Atributo que define imagen |
| codigo_interno | VARCHAR(50) | Sí | Código interno único |
| sku | VARCHAR(100) | No | SKU producto |
| codigo_barras | VARCHAR(50) | No | Código de barras (productos simples) |
| nombre | VARCHAR(250) | Sí | Nombre producto |
| slug | VARCHAR(270) | Sí | URL amigable |
| descripcion_corta | TEXT | No | Descripción breve |
| descripcion_larga | TEXT | No | Descripción completa |
| tipo | VARCHAR(20) | No | simple o variable |
| precio_compra | DECIMAL(12,2) | No | Precio costo |
| precio_venta | DECIMAL(12,2) | Sí | Precio venta |
| precio_mayorista | DECIMAL(12,2) | No | Precio mayorista |
| cantidad_minima_mayorista | INTEGER | No | Mínimo mayorista |
| precio_oferta | DECIMAL(12,2) | No | Precio oferta |
| descuento_porcentaje | DECIMAL(5,2) | No | % descuento |
| oferta_desde | TIMESTAMP | No | Inicio oferta |
| oferta_hasta | TIMESTAMP | No | Fin oferta |
| aplica_impuesto | BOOLEAN | No | ¿Aplica impuesto? |
| maneja_stock | BOOLEAN | No | ¿Controla stock? |
| stock | INTEGER | No | Stock (simple) |
| stock_minimo | INTEGER | No | Stock mínimo |
| stock_maximo | INTEGER | No | Stock máximo |
| imagen_principal | VARCHAR(500) | No | URL imagen principal |
| activo | BOOLEAN | No | ¿Activo? |
| visible_pos | BOOLEAN | No | ¿Visible POS? |
| visible_web | BOOLEAN | No | ¿Visible web? |
| destacado | BOOLEAN | No | ¿Destacado? |
| nuevo | BOOLEAN | No | ¿Es nuevo? |
| meta_titulo | VARCHAR(70) | No | SEO título |
| meta_descripcion | VARCHAR(160) | No | SEO descripción |
| og_imagen | VARCHAR(500) | No | Open Graph imagen |
| og_titulo | VARCHAR(100) | No | Open Graph título |
| og_descripcion | VARCHAR(200) | No | Open Graph desc |
| peso | DECIMAL(10,3) | No | Peso kg |
| largo | DECIMAL(10,2) | No | Largo cm |
| ancho | DECIMAL(10,2) | No | Ancho cm |
| alto | DECIMAL(10,2) | No | Alto cm |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |
| created_by | UUID | No | Usuario creador |

---

## 🖼️ TABLA: producto_imagenes

```sql
CREATE TABLE producto_imagenes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- Imagen
    imagen                  VARCHAR(500) NOT NULL,
    alt_text                VARCHAR(200),

    -- Orden
    orden                   INTEGER DEFAULT 0,
    es_principal            BOOLEAN DEFAULT false,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_producto_imagenes ON producto_imagenes(producto_id);
```

---

## 🔗 TABLA: producto_atributos

```sql
-- Qué atributos usa un producto variable
CREATE TABLE producto_atributos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    atributo_id             UUID NOT NULL REFERENCES atributos(id) ON DELETE CASCADE,

    -- Orden
    orden                   INTEGER DEFAULT 0,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_producto_atributo UNIQUE (producto_id, atributo_id)
);

CREATE INDEX idx_producto_atributos_producto ON producto_atributos(producto_id);
```

---

## 🖼️ TABLA: producto_atributo_imagenes

```sql
-- Imágenes por valor de atributo (ej: imagen por color)
CREATE TABLE producto_atributo_imagenes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    valor_atributo_id       UUID NOT NULL REFERENCES valores_atributo(id) ON DELETE CASCADE,

    -- Imagen
    imagen                  VARCHAR(500) NOT NULL,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_producto_atributo_imagen UNIQUE (producto_id, valor_atributo_id)
);

CREATE INDEX idx_producto_atributo_imagenes ON producto_atributo_imagenes(producto_id);
```

---

## 📦 TABLA: variantes (⭐ PRINCIPAL)

```sql
CREATE TABLE variantes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- Identificadores
    sku                     VARCHAR(100) NOT NULL,               -- NIKE-40-ROJO
    codigo_barras           VARCHAR(50),                         -- EAN-13

    -- Nombre generado
    nombre_variante         VARCHAR(200),                        -- "40 - Rojo"

    -- Descripciones (heredan si son NULL)
    descripcion_corta       TEXT,
    descripcion_larga       TEXT,

    -- Precios (heredan del padre si son NULL)
    precio_compra           DECIMAL(12,2),
    precio_venta            DECIMAL(12,2),
    precio_mayorista        DECIMAL(12,2),

    -- Descuento/Oferta
    precio_oferta           DECIMAL(12,2),
    descuento_porcentaje    DECIMAL(5,2),
    oferta_desde            TIMESTAMP,
    oferta_hasta            TIMESTAMP,

    -- Imagen (hereda si es NULL)
    imagen                  VARCHAR(500),

    -- Inventario
    stock                   INTEGER DEFAULT 0,
    stock_minimo            INTEGER DEFAULT 0,

    -- Peso y dimensiones
    peso                    DECIMAL(10,3),
    largo                   DECIMAL(10,2),
    ancho                   DECIMAL(10,2),
    alto                    DECIMAL(10,2),

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_variante_sku UNIQUE (producto_id, sku)
);

CREATE INDEX idx_variantes_producto ON variantes(producto_id);
CREATE INDEX idx_variantes_sku ON variantes(sku);
CREATE INDEX idx_variantes_codigo_barras ON variantes(codigo_barras);
```

### Campos variantes
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| producto_id | UUID | Sí | FK producto padre |
| sku | VARCHAR(100) | Sí | SKU único variante |
| codigo_barras | VARCHAR(50) | No | Código de barras |
| nombre_variante | VARCHAR(200) | No | Nombre generado |
| descripcion_corta | TEXT | No | Desc (hereda si NULL) |
| descripcion_larga | TEXT | No | Desc (hereda si NULL) |
| precio_compra | DECIMAL(12,2) | No | Precio (hereda si NULL) |
| precio_venta | DECIMAL(12,2) | No | Precio (hereda si NULL) |
| precio_mayorista | DECIMAL(12,2) | No | Precio (hereda si NULL) |
| precio_oferta | DECIMAL(12,2) | No | Precio oferta |
| descuento_porcentaje | DECIMAL(5,2) | No | % descuento |
| oferta_desde | TIMESTAMP | No | Inicio oferta |
| oferta_hasta | TIMESTAMP | No | Fin oferta |
| imagen | VARCHAR(500) | No | Imagen (hereda si NULL) |
| stock | INTEGER | No | Stock actual |
| stock_minimo | INTEGER | No | Stock mínimo |
| peso | DECIMAL(10,3) | No | Peso kg |
| largo | DECIMAL(10,2) | No | Largo cm |
| ancho | DECIMAL(10,2) | No | Ancho cm |
| alto | DECIMAL(10,2) | No | Alto cm |
| activo | BOOLEAN | No | ¿Activo? |
| created_at | TIMESTAMP | Auto | Fecha creación |
| updated_at | TIMESTAMP | Auto | Última actualización |

---

## 🔗 TABLA: variante_valores

```sql
-- Qué valores de atributo tiene cada variante
CREATE TABLE variante_valores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id             UUID NOT NULL REFERENCES variantes(id) ON DELETE CASCADE,
    valor_atributo_id       UUID NOT NULL REFERENCES valores_atributo(id) ON DELETE CASCADE,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_variante_valor UNIQUE (variante_id, valor_atributo_id)
);

CREATE INDEX idx_variante_valores_variante ON variante_valores(variante_id);
CREATE INDEX idx_variante_valores_valor ON variante_valores(valor_atributo_id);
```

---

## 📊 TABLA: stock_sucursal

```sql
-- Stock por variante y sucursal (multi-sucursal)
CREATE TABLE stock_sucursal (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id             UUID NOT NULL REFERENCES variantes(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- Stock
    stock                   INTEGER DEFAULT 0,
    stock_minimo            INTEGER DEFAULT 0,
    stock_maximo            INTEGER,

    -- Ubicación en almacén
    ubicacion               VARCHAR(50),                         -- A1-B2-C3

    -- Auditoría
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_stock_sucursal UNIQUE (variante_id, sucursal_id)
);

CREATE INDEX idx_stock_variante ON stock_sucursal(variante_id);
CREATE INDEX idx_stock_sucursal ON stock_sucursal(sucursal_id);
```

---

## 📦 TABLA: lotes (Control de Lotes y Vencimientos)

> **IMPORTANTE**: Esta tabla permite control FEFO (First Expired, First Out) y trazabilidad de lotes.
> Esencial para farmacias, alimentos, y productos perecederos.

```sql
CREATE TABLE lotes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    variante_id             UUID NOT NULL REFERENCES variantes(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- Identificacion del lote
    codigo_lote             VARCHAR(50) NOT NULL,            -- LOT-2024-001

    -- Fechas
    fecha_vencimiento       DATE,                            -- NULL si no vence
    fecha_fabricacion       DATE,                            -- Opcional
    fecha_ingreso           DATE DEFAULT CURRENT_DATE,       -- Cuando entro al inventario

    -- Stock de este lote especifico
    stock                   INTEGER DEFAULT 0,               -- Stock actual del lote
    stock_inicial           INTEGER DEFAULT 0,               -- Stock cuando ingreso

    -- Costo (para valorizacion FIFO/LIFO)
    costo_unitario          DECIMAL(12,2),

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'activo',    -- activo, agotado, vencido, bloqueado

    -- Notas
    notas                   TEXT,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES usuarios(id),

    CONSTRAINT uk_lote UNIQUE (empresa_id, variante_id, sucursal_id, codigo_lote),
    CONSTRAINT chk_estado_lote CHECK (estado IN ('activo', 'agotado', 'vencido', 'bloqueado'))
);

CREATE INDEX idx_lotes_empresa ON lotes(empresa_id);
CREATE INDEX idx_lotes_variante ON lotes(variante_id);
CREATE INDEX idx_lotes_sucursal ON lotes(sucursal_id);
CREATE INDEX idx_lotes_vencimiento ON lotes(fecha_vencimiento);
CREATE INDEX idx_lotes_estado ON lotes(estado);
```

### Campos lotes
| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador unico |
| empresa_id | UUID | Si | FK empresa |
| variante_id | UUID | Si | FK variante |
| sucursal_id | UUID | Si | FK sucursal |
| codigo_lote | VARCHAR(50) | Si | Codigo del lote (LOT-2024-001) |
| fecha_vencimiento | DATE | No | Fecha de vencimiento (NULL si no vence) |
| fecha_fabricacion | DATE | No | Fecha de fabricacion |
| fecha_ingreso | DATE | No | Fecha de ingreso al inventario |
| stock | INTEGER | No | Stock actual del lote |
| stock_inicial | INTEGER | No | Stock inicial cuando ingreso |
| costo_unitario | DECIMAL(12,2) | No | Costo unitario para FIFO |
| estado | VARCHAR(20) | No | activo, agotado, vencido, bloqueado |
| notas | TEXT | No | Notas adicionales |
| created_at | TIMESTAMP | Auto | Fecha creacion |
| updated_at | TIMESTAMP | Auto | Ultima actualizacion |
| created_by | UUID | No | Usuario creador |

### Ejemplos de uso FEFO

```sql
-- Obtener lotes ordenados por FEFO (primero los que vencen antes)
SELECT l.*, v.sku, p.nombre
FROM lotes l
JOIN variantes v ON v.id = l.variante_id
JOIN productos p ON p.id = v.producto_id
WHERE l.sucursal_id = 'uuid-sucursal'
  AND l.estado = 'activo'
  AND l.stock > 0
ORDER BY l.fecha_vencimiento ASC NULLS LAST;

-- Productos proximos a vencer (30 dias)
SELECT l.*, v.sku, p.nombre
FROM lotes l
JOIN variantes v ON v.id = l.variante_id
JOIN productos p ON p.id = v.producto_id
WHERE l.empresa_id = 'uuid-empresa'
  AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
  AND l.fecha_vencimiento > CURRENT_DATE
  AND l.estado = 'activo'
  AND l.stock > 0
ORDER BY l.fecha_vencimiento ASC;

-- Marcar lotes vencidos automaticamente (job diario)
UPDATE lotes
SET estado = 'vencido', updated_at = CURRENT_TIMESTAMP
WHERE fecha_vencimiento < CURRENT_DATE
  AND estado = 'activo';
```

---

## 📥 TABLA: movimientos_inventario

```sql
CREATE TABLE movimientos_inventario (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id),
    variante_id             UUID NOT NULL REFERENCES variantes(id),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),

    -- Tipo de movimiento
    tipo                    VARCHAR(20) NOT NULL,                -- entrada, salida, ajuste, traspaso
    motivo                  VARCHAR(50) NOT NULL,                -- compra, venta, merma, devolucion, etc.

    -- Cantidades
    cantidad                INTEGER NOT NULL,                    -- + o -
    stock_anterior          INTEGER NOT NULL,
    stock_nuevo             INTEGER NOT NULL,

    -- Costo
    costo_unitario          DECIMAL(12,2),
    costo_total             DECIMAL(12,2),

    -- Referencia
    documento_tipo          VARCHAR(30),                         -- factura_compra, boleta_venta, etc.
    documento_numero        VARCHAR(50),
    documento_id            UUID,

    -- Traspaso
    sucursal_origen_id      UUID REFERENCES sucursales(id),
    sucursal_destino_id     UUID REFERENCES sucursales(id),

    -- Notas
    notas                   TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_movimiento CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'traspaso')),
    CONSTRAINT chk_motivo CHECK (motivo IN ('compra', 'venta', 'devolucion_cliente', 'devolucion_proveedor', 'merma', 'uso_interno', 'ajuste_positivo', 'ajuste_negativo', 'traspaso_entrada', 'traspaso_salida', 'inventario_inicial'))
);

CREATE INDEX idx_movimientos_empresa ON movimientos_inventario(empresa_id);
CREATE INDEX idx_movimientos_sucursal ON movimientos_inventario(sucursal_id);
CREATE INDEX idx_movimientos_variante ON movimientos_inventario(variante_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(created_at);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo);
```

---

## 🏢 TABLA: proveedores

```sql
CREATE TABLE proveedores (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    codigo                  VARCHAR(20) NOT NULL,
    razon_social            VARCHAR(200) NOT NULL,
    nombre_comercial        VARCHAR(200),
    ruc                     VARCHAR(20),

    -- Contacto
    email                   VARCHAR(150),
    telefono                VARCHAR(20),
    celular                 VARCHAR(20),
    direccion               TEXT,

    -- Contacto persona
    contacto_nombre         VARCHAR(150),
    contacto_cargo          VARCHAR(100),
    contacto_telefono       VARCHAR(20),
    contacto_email          VARCHAR(150),

    -- Condiciones
    dias_credito            INTEGER DEFAULT 0,
    limite_credito          DECIMAL(12,2),

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Notas
    notas                   TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_proveedor_codigo UNIQUE (empresa_id, codigo)
);

CREATE INDEX idx_proveedores_empresa ON proveedores(empresa_id);
CREATE INDEX idx_proveedores_nombre ON proveedores(empresa_id, nombre_comercial);
```

### Campos proveedores
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| codigo | VARCHAR(20) | Sí | Código único PRV-001 |
| razon_social | VARCHAR(200) | Sí | Razón social legal |
| nombre_comercial | VARCHAR(200) | No | Nombre comercial/apodo (para IA) |
| ruc | VARCHAR(20) | No | RUC |
| telefono | VARCHAR(20) | No | Teléfono |
| dias_credito | INTEGER | No | Días de crédito |
| limite_credito | DECIMAL | No | Límite de crédito |

> **Para el Agente IA**: Se identifica por `nombre_comercial` o `razon_social` con búsqueda flexible (fuzzy match)

---

## 🛒 TABLA: compras (⭐ NUEVO - Compras a Proveedores)

```sql
CREATE TABLE compras (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id),
    proveedor_id            UUID NOT NULL REFERENCES proveedores(id),

    -- Identificación
    numero                  VARCHAR(20) NOT NULL,               -- CMP-001
    fecha                   DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento       DATE,                               -- Para crédito

    -- Documento del proveedor
    tipo_documento_ref      VARCHAR(20),                        -- factura, boleta, guia
    numero_documento_ref    VARCHAR(50),                        -- F001-123456

    -- Montos
    subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0,
    descuento               DECIMAL(12,2) DEFAULT 0,
    impuesto                DECIMAL(12,2) DEFAULT 0,
    total                   DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Pago
    estado_pago             VARCHAR(20) DEFAULT 'pendiente',    -- pendiente, parcial, pagado
    monto_pagado            DECIMAL(12,2) DEFAULT 0,
    monto_pendiente         DECIMAL(12,2) DEFAULT 0,

    -- Tipo
    tipo                    VARCHAR(20) DEFAULT 'compra',       -- compra, consignacion
    afecta_inventario       BOOLEAN DEFAULT true,               -- ¿Sube stock?

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'recibida',     -- borrador, recibida, anulada
    notas                   TEXT,

    -- Registro por IA
    registrado_por_ia       BOOLEAN DEFAULT false,
    mensaje_original        TEXT,                               -- "La tienda X nos dejó 20 pollos"

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES usuarios(id),

    CONSTRAINT uk_compra_numero UNIQUE (empresa_id, numero)
);

CREATE INDEX idx_compras_empresa ON compras(empresa_id);
CREATE INDEX idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX idx_compras_estado_pago ON compras(empresa_id, estado_pago);
CREATE INDEX idx_compras_fecha ON compras(empresa_id, fecha);
```

---

## 📦 TABLA: compra_detalles

```sql
CREATE TABLE compra_detalles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id               UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,

    -- Producto
    producto_id             UUID REFERENCES productos(id),
    variante_id             UUID REFERENCES variantes(id),
    descripcion             VARCHAR(300) NOT NULL,              -- Si no hay producto exacto

    -- Cantidades
    cantidad                DECIMAL(12,3) NOT NULL,
    unidad_medida           VARCHAR(20) DEFAULT 'UND',
    precio_unitario         DECIMAL(12,4) NOT NULL,
    subtotal                DECIMAL(12,2) NOT NULL,

    -- Para IA sin producto exacto
    producto_texto          VARCHAR(200),                       -- "pollos" (lo que dijo el usuario)

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compra_detalles_compra ON compra_detalles(compra_id);
```

---

## 💰 TABLA: pagos_proveedor (⭐ NUEVO - Pagos a Proveedores)

```sql
CREATE TABLE pagos_proveedor (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    proveedor_id            UUID NOT NULL REFERENCES proveedores(id),
    compra_id               UUID REFERENCES compras(id),        -- NULL si es pago general

    -- Identificación
    numero                  VARCHAR(20) NOT NULL,               -- PAG-001
    fecha                   DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Monto
    monto                   DECIMAL(12,2) NOT NULL,
    metodo_pago             VARCHAR(50),                        -- efectivo, transferencia, yape

    -- Referencia
    referencia              VARCHAR(100),                       -- Número operación

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'completado',   -- completado, anulado
    notas                   TEXT,

    -- Registro por IA
    registrado_por_ia       BOOLEAN DEFAULT false,
    mensaje_original        TEXT,                               -- "Pagamos a tienda X 50 soles"

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES usuarios(id),

    CONSTRAINT uk_pago_proveedor_numero UNIQUE (empresa_id, numero)
);

CREATE INDEX idx_pagos_proveedor_empresa ON pagos_proveedor(empresa_id);
CREATE INDEX idx_pagos_proveedor_proveedor ON pagos_proveedor(proveedor_id);
CREATE INDEX idx_pagos_proveedor_fecha ON pagos_proveedor(empresa_id, fecha);
```

---

## 📊 VISTA: cuenta_corriente_proveedor

```sql
-- Vista para ver saldo actual con cada proveedor
CREATE VIEW cuenta_corriente_proveedor AS
SELECT
    p.empresa_id,
    p.id AS proveedor_id,
    COALESCE(p.nombre_comercial, p.razon_social) AS proveedor_nombre,
    p.telefono,

    -- Total de compras
    COALESCE(SUM(c.total), 0) AS total_compras,

    -- Total pagado
    COALESCE(SUM(pp.monto), 0) AS total_pagado,

    -- Saldo pendiente
    COALESCE(SUM(c.total), 0) - COALESCE(SUM(pp.monto), 0) AS saldo_pendiente,

    -- Última compra
    MAX(c.fecha) AS ultima_compra,

    -- Última pago
    MAX(pp.fecha) AS ultimo_pago

FROM proveedores p
LEFT JOIN compras c ON c.proveedor_id = p.id AND c.estado != 'anulada'
LEFT JOIN pagos_proveedor pp ON pp.proveedor_id = p.id AND pp.estado = 'completado'
GROUP BY p.id, p.empresa_id, p.nombre_comercial, p.razon_social, p.telefono;
```

---

## 👤 TABLA: clientes

```sql
CREATE TABLE clientes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Identificación
    codigo                  VARCHAR(20) NOT NULL,
    tipo_documento          VARCHAR(20) DEFAULT 'dni',           -- dni, ruc, pasaporte, ce
    numero_documento        VARCHAR(20),

    -- Información
    nombre                  VARCHAR(150) NOT NULL,
    apellido                VARCHAR(150),
    razon_social            VARCHAR(200),                        -- Si es empresa

    -- Contacto
    email                   VARCHAR(150),
    telefono                VARCHAR(20),
    celular                 VARCHAR(20),
    direccion               TEXT,

    -- Ubicación
    departamento            VARCHAR(100),
    provincia               VARCHAR(100),
    distrito                VARCHAR(100),

    -- Fecha nacimiento
    fecha_nacimiento        DATE,

    -- Fidelización
    puntos_acumulados       INTEGER DEFAULT 0,
    nivel_cliente           VARCHAR(20) DEFAULT 'regular',       -- regular, plata, oro, platino

    -- Crédito
    tiene_credito           BOOLEAN DEFAULT false,
    limite_credito          DECIMAL(12,2) DEFAULT 0,
    saldo_credito           DECIMAL(12,2) DEFAULT 0,             -- Deuda actual

    -- Estadísticas
    total_compras           INTEGER DEFAULT 0,
    monto_total_compras     DECIMAL(12,2) DEFAULT 0,
    ultima_compra           TIMESTAMP,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Notas
    notas                   TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_cliente_codigo UNIQUE (empresa_id, codigo),
    CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN ('dni', 'ruc', 'pasaporte', 'ce', 'otro'))
);

CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_documento ON clientes(numero_documento);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_celular ON clientes(celular);
```

---

## 💳 TABLA: metodos_pago

```sql
CREATE TABLE metodos_pago (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    codigo                  VARCHAR(30) NOT NULL,                -- efectivo, yape, visa, etc.
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Tipo
    tipo                    VARCHAR(20) NOT NULL,                -- efectivo, digital, tarjeta, transferencia

    -- Visual
    icono                   VARCHAR(50),                         -- Nombre del icono
    color                   VARCHAR(7),                          -- Color hex

    -- Configuración
    requiere_referencia     BOOLEAN DEFAULT false,               -- Número de operación
    comision_porcentaje     DECIMAL(5,2) DEFAULT 0,              -- % comisión
    comision_fija           DECIMAL(10,2) DEFAULT 0,             -- Comisión fija

    -- Pasarela integrada
    es_pasarela_integrada   BOOLEAN DEFAULT false,
    pasarela_codigo         VARCHAR(50),                         -- izipay, mercadopago, etc.
    pasarela_config         JSONB,                               -- Configuración API

    -- Orden y visibilidad
    orden                   INTEGER DEFAULT 0,
    activo                  BOOLEAN DEFAULT true,
    visible_pos             BOOLEAN DEFAULT true,
    visible_web             BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_metodo_pago_codigo UNIQUE (empresa_id, codigo),
    CONSTRAINT chk_tipo_pago CHECK (tipo IN ('efectivo', 'digital', 'tarjeta', 'transferencia', 'credito'))
);

CREATE INDEX idx_metodos_pago_empresa ON metodos_pago(empresa_id);
```

---

## 🎁 TABLA: promociones

```sql
CREATE TABLE promociones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información
    codigo                  VARCHAR(50) NOT NULL,
    nombre                  VARCHAR(200) NOT NULL,
    descripcion             TEXT,

    -- Tipo de promoción
    tipo                    VARCHAR(30) NOT NULL,
    -- cantidad_gratis: Compra X lleva Y gratis
    -- cantidad_descuento: Compra X, el Y tiene Z% descuento
    -- precio_fijo: Lleva X por $Y
    -- monto_minimo: Compra mínima X, descuento Y%
    -- combo: Productos específicos por precio fijo

    -- Configuración según tipo
    cantidad_comprar        INTEGER,                             -- X
    cantidad_beneficio      INTEGER,                             -- Y
    descuento_porcentaje    DECIMAL(5,2),                        -- % descuento
    descuento_monto         DECIMAL(12,2),                       -- Monto fijo descuento
    precio_fijo             DECIMAL(12,2),                       -- Precio combo
    monto_minimo_compra     DECIMAL(12,2),                       -- Mínimo compra

    -- Aplicación
    aplica_a                VARCHAR(20) DEFAULT 'productos',     -- todos, categorias, productos, marcas
    categorias_ids          UUID[],                              -- Array de categorías
    productos_ids           UUID[],                              -- Array de productos
    marcas_ids              UUID[],                              -- Array de marcas

    -- Vigencia
    fecha_inicio            TIMESTAMP NOT NULL,
    fecha_fin               TIMESTAMP,
    hora_inicio             TIME,
    hora_fin                TIME,
    dias_semana             INTEGER[],                           -- [1,2,3,4,5,6,7]

    -- Límites
    limite_usos_total       INTEGER,
    limite_usos_cliente     INTEGER,
    usos_actuales           INTEGER DEFAULT 0,
    solo_clientes_registrados BOOLEAN DEFAULT false,

    -- Sucursales
    todas_sucursales        BOOLEAN DEFAULT true,
    sucursales_ids          UUID[],

    -- Configuración
    acumulable              BOOLEAN DEFAULT false,
    prioridad               INTEGER DEFAULT 0,

    -- Visibilidad
    activo                  BOOLEAN DEFAULT true,
    visible_pos             BOOLEAN DEFAULT true,
    visible_web             BOOLEAN DEFAULT true,
    imagen                  VARCHAR(500),
    banner                  VARCHAR(500),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_promocion_codigo UNIQUE (empresa_id, codigo),
    CONSTRAINT chk_tipo_promocion CHECK (tipo IN ('cantidad_gratis', 'cantidad_descuento', 'precio_fijo', 'monto_minimo', 'combo'))
);

CREATE INDEX idx_promociones_empresa ON promociones(empresa_id);
CREATE INDEX idx_promociones_fechas ON promociones(fecha_inicio, fecha_fin);
CREATE INDEX idx_promociones_activo ON promociones(activo);
```

---

## 💰 TABLA: cajas

```sql
CREATE TABLE cajas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),

    -- Información
    numero_caja             INTEGER NOT NULL,                    -- Caja 1, 2, 3...

    -- Apertura
    fecha_apertura          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_inicial           DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Cierre
    fecha_cierre            TIMESTAMP,
    monto_final_sistema     DECIMAL(12,2),                       -- Lo que dice el sistema
    monto_final_real        DECIMAL(12,2),                       -- Lo que contó el cajero
    diferencia              DECIMAL(12,2),                       -- Diferencia

    -- Resumen
    total_ventas            DECIMAL(12,2) DEFAULT 0,
    total_efectivo          DECIMAL(12,2) DEFAULT 0,
    total_tarjetas          DECIMAL(12,2) DEFAULT 0,
    total_digital           DECIMAL(12,2) DEFAULT 0,
    total_otros             DECIMAL(12,2) DEFAULT 0,
    cantidad_ventas         INTEGER DEFAULT 0,

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'abierta',       -- abierta, cerrada

    -- Notas
    notas_apertura          TEXT,
    notas_cierre            TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_estado_caja CHECK (estado IN ('abierta', 'cerrada'))
);

CREATE INDEX idx_cajas_empresa ON cajas(empresa_id);
CREATE INDEX idx_cajas_sucursal ON cajas(sucursal_id);
CREATE INDEX idx_cajas_usuario ON cajas(usuario_id);
CREATE INDEX idx_cajas_fecha ON cajas(fecha_apertura);
CREATE INDEX idx_cajas_estado ON cajas(estado);
```

---

## 💵 TABLA: movimientos_caja

```sql
CREATE TABLE movimientos_caja (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id                 UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),

    -- Tipo
    tipo                    VARCHAR(20) NOT NULL,                -- entrada, salida
    motivo                  VARCHAR(50) NOT NULL,                -- apertura, venta, retiro, gasto, cierre

    -- Monto
    monto                   DECIMAL(12,2) NOT NULL,

    -- Referencia
    venta_id                UUID,
    descripcion             TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_mov_caja CHECK (tipo IN ('entrada', 'salida')),
    CONSTRAINT chk_motivo_mov_caja CHECK (motivo IN ('apertura', 'venta', 'retiro', 'gasto', 'devolucion', 'cierre', 'ajuste'))
);

CREATE INDEX idx_mov_caja_caja ON movimientos_caja(caja_id);
CREATE INDEX idx_mov_caja_fecha ON movimientos_caja(created_at);
```

---

## 🧾 TABLA: ventas (⭐ PRINCIPAL)

```sql
CREATE TABLE ventas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sucursal_id             UUID NOT NULL REFERENCES sucursales(id),
    caja_id                 UUID NOT NULL REFERENCES cajas(id),
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),
    cliente_id              UUID REFERENCES clientes(id),

    -- Numeración
    serie                   VARCHAR(10) NOT NULL,                -- B001
    numero                  INTEGER NOT NULL,                    -- 0001234
    numero_completo         VARCHAR(20) NOT NULL,                -- B001-0001234

    -- Tipo documento
    tipo_documento          VARCHAR(20) DEFAULT 'boleta',        -- boleta, factura, ticket

    -- Fecha
    fecha_venta             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Montos
    subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0,
    descuento_total         DECIMAL(12,2) DEFAULT 0,
    impuesto_total          DECIMAL(12,2) DEFAULT 0,
    total                   DECIMAL(12,2) NOT NULL DEFAULT 0,

    -- Promociones aplicadas
    promociones_aplicadas   JSONB,                               -- Detalle de promociones

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'completada',    -- pendiente, completada, anulada
    motivo_anulacion        TEXT,
    fecha_anulacion         TIMESTAMP,
    usuario_anulacion_id    UUID,

    -- Notas
    notas                   TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_venta_numero UNIQUE (empresa_id, serie, numero),
    CONSTRAINT chk_tipo_doc_venta CHECK (tipo_documento IN ('boleta', 'factura', 'ticket', 'nota_credito')),
    CONSTRAINT chk_estado_venta CHECK (estado IN ('pendiente', 'completada', 'anulada'))
);

CREATE INDEX idx_ventas_empresa ON ventas(empresa_id);
CREATE INDEX idx_ventas_sucursal ON ventas(sucursal_id);
CREATE INDEX idx_ventas_caja ON ventas(caja_id);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_numero ON ventas(numero_completo);
CREATE INDEX idx_ventas_estado ON ventas(estado);
```

---

## 📋 TABLA: venta_detalles

```sql
CREATE TABLE venta_detalles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id                UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id             UUID NOT NULL REFERENCES productos(id),
    variante_id             UUID REFERENCES variantes(id),
    lote_id                 UUID REFERENCES lotes(id),           -- FK lote (para trazabilidad FEFO)

    -- Descripción (snapshot al momento de la venta)
    codigo                  VARCHAR(100) NOT NULL,               -- SKU o código
    nombre                  VARCHAR(300) NOT NULL,
    variante_nombre         VARCHAR(200),                        -- "40 - Rojo"

    -- Cantidades
    cantidad                INTEGER NOT NULL,

    -- Precios
    precio_unitario         DECIMAL(12,2) NOT NULL,              -- Precio original
    precio_venta            DECIMAL(12,2) NOT NULL,              -- Precio con descuento
    costo_unitario          DECIMAL(12,2) DEFAULT 0,             -- Para calcular utilidad

    -- Descuento en línea
    descuento_porcentaje    DECIMAL(5,2) DEFAULT 0,
    descuento_monto         DECIMAL(12,2) DEFAULT 0,

    -- Promoción aplicada
    promocion_id            UUID,
    promocion_nombre        VARCHAR(200),

    -- Impuesto
    impuesto_porcentaje     DECIMAL(5,2) DEFAULT 0,
    impuesto_monto          DECIMAL(12,2) DEFAULT 0,

    -- Totales
    subtotal                DECIMAL(12,2) NOT NULL,              -- cantidad * precio_venta
    total                   DECIMAL(12,2) NOT NULL,              -- subtotal - descuento + impuesto

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venta_detalles_venta ON venta_detalles(venta_id);
CREATE INDEX idx_venta_detalles_producto ON venta_detalles(producto_id);
CREATE INDEX idx_venta_detalles_variante ON venta_detalles(variante_id);
CREATE INDEX idx_venta_detalles_lote ON venta_detalles(lote_id);
```

---

## 💳 TABLA: venta_pagos

```sql
CREATE TABLE venta_pagos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id                UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    metodo_pago_id          UUID NOT NULL REFERENCES metodos_pago(id),

    -- Monto
    monto                   DECIMAL(12,2) NOT NULL,

    -- Referencia
    referencia              VARCHAR(100),                        -- Número de operación

    -- Para efectivo
    monto_recibido          DECIMAL(12,2),
    vuelto                  DECIMAL(12,2),

    -- Estado pasarela
    estado_pasarela         VARCHAR(20),                         -- pending, approved, rejected
    pasarela_response       JSONB,                               -- Respuesta de la pasarela

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venta_pagos_venta ON venta_pagos(venta_id);
CREATE INDEX idx_venta_pagos_metodo ON venta_pagos(metodo_pago_id);
```

---

## ⚙️ TABLA: empresa_seo

```sql
CREATE TABLE empresa_seo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- SEO General
    titulo_sitio            VARCHAR(70),
    descripcion_sitio       VARCHAR(160),
    palabras_clave          TEXT,
    robots_indexar          BOOLEAN DEFAULT true,
    generar_sitemap         BOOLEAN DEFAULT true,

    -- Imágenes por defecto
    og_imagen_default       VARCHAR(500),
    imagen_producto_default VARCHAR(500),

    -- Google Analytics
    ga4_habilitado          BOOLEAN DEFAULT false,
    ga4_id                  VARCHAR(20),                         -- G-XXXXXXXXXX

    -- Google Tag Manager
    gtm_habilitado          BOOLEAN DEFAULT false,
    gtm_id                  VARCHAR(20),                         -- GTM-XXXXXXX

    -- Google Search Console
    search_console_verificacion VARCHAR(100),

    -- Google Ads
    gads_habilitado         BOOLEAN DEFAULT false,
    gads_id                 VARCHAR(20),                         -- AW-XXXXXXXXX
    gads_conversion_label   VARCHAR(50),
    gads_remarketing        BOOLEAN DEFAULT false,

    -- Meta/Facebook Pixel
    meta_pixel_habilitado   BOOLEAN DEFAULT false,
    meta_pixel_id           VARCHAR(30),
    meta_capi_habilitado    BOOLEAN DEFAULT false,
    meta_capi_token         TEXT,
    meta_catalogo_habilitado BOOLEAN DEFAULT false,

    -- TikTok Pixel
    tiktok_pixel_habilitado BOOLEAN DEFAULT false,
    tiktok_pixel_id         VARCHAR(30),
    tiktok_catalogo_habilitado BOOLEAN DEFAULT false,

    -- Pinterest
    pinterest_habilitado    BOOLEAN DEFAULT false,
    pinterest_id            VARCHAR(30),

    -- Snapchat
    snapchat_habilitado     BOOLEAN DEFAULT false,
    snapchat_id             VARCHAR(30),

    -- Twitter/X
    twitter_habilitado      BOOLEAN DEFAULT false,
    twitter_id              VARCHAR(30),

    -- Scripts personalizados
    script_head             TEXT,
    script_body             TEXT,

    -- WhatsApp
    whatsapp_habilitado     BOOLEAN DEFAULT false,
    whatsapp_numero         VARCHAR(20),
    whatsapp_mensaje        TEXT,

    -- Auditoría
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_empresa_seo UNIQUE (empresa_id)
);

CREATE INDEX idx_empresa_seo ON empresa_seo(empresa_id);
```

---

## 🖨️ TABLA: configuracion_impresion

```sql
CREATE TABLE configuracion_impresion (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    sucursal_id             UUID REFERENCES sucursales(id),      -- NULL = todas

    -- Tipo impresora
    tipo_impresora          VARCHAR(30) DEFAULT 'termica',       -- termica, normal, pdf
    ancho_papel             VARCHAR(10) DEFAULT '80mm',          -- 58mm, 80mm

    -- Contenido ticket
    mostrar_logo            BOOLEAN DEFAULT true,
    mostrar_nombre_empresa  BOOLEAN DEFAULT true,
    mostrar_direccion       BOOLEAN DEFAULT true,
    mostrar_telefono        BOOLEAN DEFAULT true,
    mostrar_ruc             BOOLEAN DEFAULT true,

    -- Mensaje
    mensaje_cabecera        TEXT,
    mensaje_pie             TEXT DEFAULT 'Gracias por su compra',

    -- Opciones
    imprimir_automatico     BOOLEAN DEFAULT false,
    copias                  INTEGER DEFAULT 1,

    -- Auditoría
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_config_impresion UNIQUE (empresa_id, sucursal_id)
);
```

---

## 🏷️ TABLA: plantillas_nicho (⭐ NUEVA - Onboarding)

```sql
-- Plantillas de nicho para onboarding
-- Cuando una empresa se registra, puede elegir un nicho
-- El sistema pre-crea los atributos sugeridos para ese nicho
CREATE TABLE plantillas_nicho (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información
    nombre                  VARCHAR(50) NOT NULL,                -- "Farmacia", "Moda", "Cosméticos"
    slug                    VARCHAR(60) NOT NULL UNIQUE,
    descripcion             TEXT,
    icono                   VARCHAR(50),                         -- Nombre del icono (lucide)
    imagen                  VARCHAR(500),

    -- Orden
    orden                   INTEGER DEFAULT 0,
    destacado               BOOLEAN DEFAULT false,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales de nichos
INSERT INTO plantillas_nicho (nombre, slug, descripcion, icono, orden) VALUES
    ('Moda y Ropa', 'moda', 'Tiendas de ropa, calzado y accesorios', 'Shirt', 1),
    ('Farmacia', 'farmacia', 'Farmacias y boticas con control de vencimiento', 'Pill', 2),
    ('Cosméticos', 'cosmeticos', 'Productos de belleza y cuidado personal', 'Sparkles', 3),
    ('Alimentos', 'alimentos', 'Tiendas de abarrotes, panaderías, bodegas', 'Cookie', 4),
    ('Electrónica', 'electronica', 'Equipos electrónicos con número de serie', 'Laptop', 5),
    ('Juguetería', 'jugueteria', 'Juguetes y artículos infantiles', 'Gamepad2', 6),
    ('Ferretería', 'ferreteria', 'Herramientas y materiales de construcción', 'Wrench', 7),
    ('Librería', 'libreria', 'Libros, útiles escolares y oficina', 'BookOpen', 8),
    ('General', 'general', 'Tienda general sin nicho específico', 'Store', 99);
```

---

## 🔗 TABLA: plantilla_atributos (⭐ NUEVA - Onboarding)

```sql
-- Atributos sugeridos por cada plantilla de nicho
-- Se pre-crean automáticamente al seleccionar el nicho en onboarding
CREATE TABLE plantilla_atributos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_id            UUID NOT NULL REFERENCES plantillas_nicho(id) ON DELETE CASCADE,

    -- Atributo sugerido
    nombre_atributo         VARCHAR(100) NOT NULL,               -- "Talla", "Color", "Vencimiento"
    tipo_visual             VARCHAR(20) DEFAULT 'select',
    tipo_sistema            VARCHAR(30) DEFAULT 'dinamico',
    config_default          JSONB DEFAULT '{}',
    genera_variante         BOOLEAN DEFAULT true,

    -- Valores predefinidos (si aplica)
    valores_default         JSONB,                               -- ["S","M","L","XL"] o colores

    -- Orden
    orden                   INTEGER DEFAULT 0,

    CONSTRAINT uk_plantilla_atributo UNIQUE (plantilla_id, nombre_atributo)
);

CREATE INDEX idx_plantilla_atributos_plantilla ON plantilla_atributos(plantilla_id);

-- Atributos por nicho
-- MODA
INSERT INTO plantilla_atributos (plantilla_id, nombre_atributo, tipo_visual, tipo_sistema, genera_variante, valores_default, orden) VALUES
    ((SELECT id FROM plantillas_nicho WHERE slug = 'moda'), 'Talla', 'button', 'dinamico', true, '["XS","S","M","L","XL","XXL"]', 1),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'moda'), 'Color', 'color', 'dinamico', true, null, 2),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'moda'), 'Material', 'select', 'dinamico', false, '["Algodón","Poliéster","Lana","Cuero","Sintético"]', 3);

-- FARMACIA
INSERT INTO plantilla_atributos (plantilla_id, nombre_atributo, tipo_visual, tipo_sistema, config_default, genera_variante, orden) VALUES
    ((SELECT id FROM plantillas_nicho WHERE slug = 'farmacia'), 'Fecha de Vencimiento', 'date', 'fecha_vencimiento', '{"alertas_dias": [30, 60, 90], "fefo": true}', false, 1),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'farmacia'), 'Lote', 'text', 'lote', '{"trazabilidad": true}', false, 2),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'farmacia'), 'Presentación', 'select', 'dinamico', '{}', true, 3);

-- COSMÉTICOS
INSERT INTO plantilla_atributos (plantilla_id, nombre_atributo, tipo_visual, tipo_sistema, genera_variante, valores_default, orden) VALUES
    ((SELECT id FROM plantillas_nicho WHERE slug = 'cosmeticos'), 'Tono', 'color', 'dinamico', true, null, 1),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'cosmeticos'), 'Tamaño', 'select', 'dinamico', true, '["Mini","Pequeño","Mediano","Grande"]', 2),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'cosmeticos'), 'Fragancia', 'select', 'dinamico', false, null, 3);

-- ALIMENTOS
INSERT INTO plantilla_atributos (plantilla_id, nombre_atributo, tipo_visual, tipo_sistema, config_default, genera_variante, orden) VALUES
    ((SELECT id FROM plantillas_nicho WHERE slug = 'alimentos'), 'Fecha de Vencimiento', 'date', 'fecha_vencimiento', '{"alertas_dias": [7, 15, 30], "fefo": true}', false, 1),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'alimentos'), 'Lote', 'text', 'lote', '{}', false, 2),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'alimentos'), 'Peso', 'select', 'dinamico', '{}', true, 3);

-- ELECTRÓNICA
INSERT INTO plantilla_atributos (plantilla_id, nombre_atributo, tipo_visual, tipo_sistema, genera_variante, valores_default, orden) VALUES
    ((SELECT id FROM plantillas_nicho WHERE slug = 'electronica'), 'Número de Serie', 'text', 'numero_serie', false, null, 1),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'electronica'), 'Color', 'color', 'dinamico', true, null, 2),
    ((SELECT id FROM plantillas_nicho WHERE slug = 'electronica'), 'Capacidad', 'select', 'dinamico', true, null, 3);
```

---

## 🧾 TABLA: comprobantes (⭐ NUEVA - Facturación Electrónica)

```sql
-- Comprobantes electrónicos (Boletas, Facturas, Notas de Crédito)
-- Solo se crea si la empresa tiene el addon de facturación activo
CREATE TABLE comprobantes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    venta_id                UUID REFERENCES ventas(id),          -- Puede ser NULL para NC/ND

    -- Tipo de comprobante
    tipo_comprobante        VARCHAR(2) NOT NULL,                 -- 01=Factura, 03=Boleta, 07=NC, 08=ND

    -- Numeración
    serie                   VARCHAR(4) NOT NULL,                 -- F001, B001, FC01, BC01
    numero                  INTEGER NOT NULL,
    numero_completo         VARCHAR(15) NOT NULL,                -- F001-00000001

    -- Datos del cliente
    cliente_tipo_documento  VARCHAR(1) NOT NULL,                 -- 1=DNI, 6=RUC
    cliente_documento       VARCHAR(15) NOT NULL,
    cliente_nombre          VARCHAR(200) NOT NULL,
    cliente_direccion       TEXT,
    cliente_email           VARCHAR(150),

    -- Montos
    subtotal                DECIMAL(12,2) NOT NULL,
    descuento_total         DECIMAL(12,2) DEFAULT 0,
    igv                     DECIMAL(12,2) NOT NULL,
    total                   DECIMAL(12,2) NOT NULL,

    -- Para Notas de Crédito/Débito
    comprobante_ref_id      UUID REFERENCES comprobantes(id),    -- Comprobante que modifica
    motivo_nota             VARCHAR(2),                          -- 01=Anulación, 02=Corrección, etc.

    -- Fechas
    fecha_emision           DATE NOT NULL,
    fecha_vencimiento       DATE,

    -- Estado SUNAT
    estado                  VARCHAR(20) DEFAULT 'pendiente',     -- pendiente, enviado, aceptado, rechazado, anulado

    -- Datos SUNAT
    hash_cpe                VARCHAR(100),                        -- Hash del CPE
    codigo_respuesta        VARCHAR(10),                         -- Código respuesta SUNAT
    descripcion_respuesta   TEXT,                                -- Descripción respuesta
    cdr_xml                 TEXT,                                -- CDR XML (respuesta SUNAT)

    -- Archivos
    xml_firmado             TEXT,                                -- XML firmado
    pdf_url                 VARCHAR(500),                        -- URL del PDF

    -- Para Resumen Diario (boletas)
    resumen_diario_id       UUID,                                -- FK al resumen diario
    incluido_en_resumen     BOOLEAN DEFAULT false,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              UUID REFERENCES usuarios(id),

    CONSTRAINT uk_comprobante_numero UNIQUE (empresa_id, serie, numero),
    CONSTRAINT chk_tipo_comprobante CHECK (tipo_comprobante IN ('01', '03', '07', '08')),
    CONSTRAINT chk_estado_comprobante CHECK (estado IN ('pendiente', 'enviado', 'aceptado', 'rechazado', 'anulado', 'en_resumen'))
);

CREATE INDEX idx_comprobantes_empresa ON comprobantes(empresa_id);
CREATE INDEX idx_comprobantes_venta ON comprobantes(venta_id);
CREATE INDEX idx_comprobantes_numero ON comprobantes(numero_completo);
CREATE INDEX idx_comprobantes_estado ON comprobantes(estado);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha_emision);
CREATE INDEX idx_comprobantes_cliente ON comprobantes(cliente_documento);
```

### Campos comprobantes
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | Sí | FK empresa |
| venta_id | UUID | No | FK venta origen |
| tipo_comprobante | VARCHAR(2) | Sí | 01=Factura, 03=Boleta |
| serie | VARCHAR(4) | Sí | Serie F001, B001 |
| numero | INTEGER | Sí | Correlativo |
| cliente_tipo_documento | VARCHAR(1) | Sí | 1=DNI, 6=RUC |
| cliente_documento | VARCHAR(15) | Sí | Número documento |
| cliente_nombre | VARCHAR(200) | Sí | Nombre/Razón social |
| subtotal | DECIMAL(12,2) | Sí | Subtotal sin IGV |
| igv | DECIMAL(12,2) | Sí | IGV |
| total | DECIMAL(12,2) | Sí | Total |
| estado | VARCHAR(20) | No | Estado SUNAT |
| hash_cpe | VARCHAR(100) | No | Hash del comprobante |

---

## 📋 TABLA: comprobante_detalles (⭐ NUEVA)

```sql
-- Detalles del comprobante electrónico
CREATE TABLE comprobante_detalles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprobante_id          UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,

    -- Producto
    codigo                  VARCHAR(50) NOT NULL,                -- Código interno o SKU
    codigo_sunat            VARCHAR(20),                         -- Código SUNAT si aplica
    descripcion             VARCHAR(500) NOT NULL,
    unidad_medida           VARCHAR(10) DEFAULT 'NIU',           -- NIU=Unidad, KGM=Kilo

    -- Cantidades y precios
    cantidad                DECIMAL(12,3) NOT NULL,
    precio_unitario         DECIMAL(12,4) NOT NULL,              -- Precio sin IGV
    valor_unitario          DECIMAL(12,4) NOT NULL,              -- Valor con IGV

    -- Descuento
    descuento               DECIMAL(12,2) DEFAULT 0,

    -- Impuestos
    igv                     DECIMAL(12,2) NOT NULL,
    tipo_igv                VARCHAR(2) DEFAULT '10',             -- 10=Gravado, 20=Exonerado, 30=Inafecto

    -- Totales línea
    subtotal                DECIMAL(12,2) NOT NULL,
    total                   DECIMAL(12,2) NOT NULL,

    -- Orden
    orden                   INTEGER DEFAULT 0,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comprobante_detalles ON comprobante_detalles(comprobante_id);
```

---

## 📅 TABLA: resumenes_diarios (⭐ NUEVA - Boletas)

```sql
-- Resumen diario de boletas para SUNAT
-- Las boletas se agrupan y se envían en un solo ticket
CREATE TABLE resumenes_diarios (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Identificación
    identificador           VARCHAR(30) NOT NULL,                -- RC-20240115-001
    fecha_generacion        DATE NOT NULL,
    fecha_emision_boletas   DATE NOT NULL,                       -- Fecha de las boletas incluidas

    -- Totales
    cantidad_comprobantes   INTEGER NOT NULL,
    total_gravadas          DECIMAL(12,2) NOT NULL,
    total_exoneradas        DECIMAL(12,2) DEFAULT 0,
    total_inafectas         DECIMAL(12,2) DEFAULT 0,
    total_igv               DECIMAL(12,2) NOT NULL,
    total_general           DECIMAL(12,2) NOT NULL,

    -- Estado SUNAT
    estado                  VARCHAR(20) DEFAULT 'pendiente',     -- pendiente, enviado, aceptado, rechazado
    ticket_sunat            VARCHAR(100),                        -- Ticket de recepción
    codigo_respuesta        VARCHAR(10),
    descripcion_respuesta   TEXT,
    cdr_xml                 TEXT,

    -- Archivos
    xml_firmado             TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_resumen_identificador UNIQUE (empresa_id, identificador)
);

CREATE INDEX idx_resumenes_empresa ON resumenes_diarios(empresa_id);
CREATE INDEX idx_resumenes_fecha ON resumenes_diarios(fecha_emision_boletas);
```

---

## ⚙️ TABLA: facturacion_config (⭐ NUEVA)

```sql
-- Configuración de facturación electrónica por empresa
CREATE TABLE facturacion_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Proveedor de facturación
    proveedor               VARCHAR(20) NOT NULL,                -- 'nubefact', 'sunat_api', 'efact'
    modo                    VARCHAR(10) DEFAULT 'demo',          -- 'demo', 'produccion'

    -- Credenciales (encriptadas)
    api_token               TEXT,                                -- Token de API
    api_url                 VARCHAR(500),                        -- URL del API
    ruta_certificado        VARCHAR(500),                        -- Ruta al certificado digital
    password_certificado    TEXT,                                -- Password del certificado

    -- Datos del emisor
    ruc_emisor              VARCHAR(11) NOT NULL,
    razon_social_emisor     VARCHAR(200) NOT NULL,
    nombre_comercial_emisor VARCHAR(200),
    direccion_emisor        TEXT NOT NULL,
    ubigeo_emisor           VARCHAR(6),                          -- Código UBIGEO
    departamento_emisor     VARCHAR(100),
    provincia_emisor        VARCHAR(100),
    distrito_emisor         VARCHAR(100),

    -- Series configuradas
    serie_factura           VARCHAR(4) DEFAULT 'F001',
    serie_boleta            VARCHAR(4) DEFAULT 'B001',
    serie_nota_credito_f    VARCHAR(4) DEFAULT 'FC01',
    serie_nota_credito_b    VARCHAR(4) DEFAULT 'BC01',
    serie_nota_debito_f     VARCHAR(4) DEFAULT 'FD01',
    serie_nota_debito_b     VARCHAR(4) DEFAULT 'BD01',

    -- Correlativos actuales
    correlativo_factura     INTEGER DEFAULT 0,
    correlativo_boleta      INTEGER DEFAULT 0,
    correlativo_nc_f        INTEGER DEFAULT 0,
    correlativo_nc_b        INTEGER DEFAULT 0,
    correlativo_nd_f        INTEGER DEFAULT 0,
    correlativo_nd_b        INTEGER DEFAULT 0,

    -- Configuración de envío
    envio_automatico        BOOLEAN DEFAULT true,                -- Enviar automáticamente
    resumen_diario_hora     TIME DEFAULT '23:00',                -- Hora para generar resumen
    reintentos_max          INTEGER DEFAULT 3,

    -- Estado
    activo                  BOOLEAN DEFAULT true,
    validado                BOOLEAN DEFAULT false,               -- Credenciales validadas
    fecha_validacion        TIMESTAMP,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_facturacion_empresa UNIQUE (empresa_id),
    CONSTRAINT chk_proveedor CHECK (proveedor IN ('nubefact', 'sunat_api', 'efact', 'otro'))
);

CREATE INDEX idx_facturacion_config_empresa ON facturacion_config(empresa_id);
```

### Campos facturacion_config
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| proveedor | VARCHAR(20) | Sí | nubefact, sunat_api, efact |
| modo | VARCHAR(10) | No | demo o produccion |
| api_token | TEXT | No | Token del proveedor |
| ruc_emisor | VARCHAR(11) | Sí | RUC del emisor |
| serie_factura | VARCHAR(4) | No | Serie para facturas |
| serie_boleta | VARCHAR(4) | No | Serie para boletas |
| envio_automatico | BOOLEAN | No | ¿Enviar automático? |

---

## 📊 TABLA: facturacion_log (⭐ NUEVA)

```sql
-- Log de comunicaciones con SUNAT/Proveedor
CREATE TABLE facturacion_log (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    comprobante_id          UUID REFERENCES comprobantes(id),
    resumen_diario_id       UUID REFERENCES resumenes_diarios(id),

    -- Acción
    accion                  VARCHAR(50) NOT NULL,                -- 'enviar', 'consultar', 'anular', 'resumen'

    -- Request/Response
    request_xml             TEXT,
    response_xml            TEXT,
    http_status             INTEGER,

    -- Resultado
    exitoso                 BOOLEAN DEFAULT false,
    codigo_error            VARCHAR(20),
    mensaje_error           TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracion_ms             INTEGER                              -- Tiempo de respuesta
);

CREATE INDEX idx_facturacion_log_empresa ON facturacion_log(empresa_id);
CREATE INDEX idx_facturacion_log_comprobante ON facturacion_log(comprobante_id);
CREATE INDEX idx_facturacion_log_fecha ON facturacion_log(created_at);
```

---

## 📱 TABLA: integraciones_whatsapp (⭐ NUEVA - Agente IA)

```sql
-- Configuración WhatsApp por empresa (Evolution API)
CREATE TABLE integraciones_whatsapp (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Evolution API Config
    instancia_nombre        VARCHAR(100) NOT NULL,               -- Nombre de instancia Evolution
    instancia_token         VARCHAR(500),                        -- Token de la instancia
    instancia_estado        VARCHAR(30) DEFAULT 'pendiente',     -- pendiente, conectado, desconectado

    -- Webhook
    webhook_url             VARCHAR(500),                        -- URL para recibir mensajes
    webhook_secret          VARCHAR(200),

    -- Estado conexión
    telefono_conectado      VARCHAR(20),                         -- Número conectado
    ultima_conexion         TIMESTAMP,
    qr_code_base64          TEXT,                                -- QR actual si no conectado
    qr_code_expira          TIMESTAMP,

    -- Configuración agente IA
    agente_ia_activo        BOOLEAN DEFAULT false,
    agente_modo             VARCHAR(20) DEFAULT 'texto',         -- texto, audio, hibrido
    agente_modelo           VARCHAR(50) DEFAULT 'llama-3.3-70b', -- Modelo Groq/OpenAI
    agente_provider         VARCHAR(20) DEFAULT 'groq',          -- groq, openai

    -- Límites
    mensajes_hoy            INTEGER DEFAULT 0,
    audio_minutos_hoy       INTEGER DEFAULT 0,
    limite_mensajes_dia     INTEGER DEFAULT 200,                 -- Según plan
    limite_audio_min_dia    INTEGER DEFAULT 60,

    -- Auditoría
    activo                  BOOLEAN DEFAULT true,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_whatsapp_empresa UNIQUE (empresa_id),
    CONSTRAINT chk_instancia_estado CHECK (instancia_estado IN ('pendiente', 'conectado', 'desconectado')),
    CONSTRAINT chk_agente_modo CHECK (agente_modo IN ('texto', 'audio', 'hibrido')),
    CONSTRAINT chk_agente_provider CHECK (agente_provider IN ('groq', 'openai'))
);

CREATE INDEX idx_integraciones_whatsapp_empresa ON integraciones_whatsapp(empresa_id);
```

---

## 📊 TABLA: uso_agente_ia (⭐ NUEVA - Tracking IA)

```sql
-- Log de uso del agente IA para facturación
CREATE TABLE uso_agente_ia (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Periodo
    periodo                 VARCHAR(7) NOT NULL,                 -- YYYY-MM (2025-01)
    fecha                   DATE NOT NULL,                       -- Fecha específica

    -- Contadores de uso
    mensajes_texto          INTEGER DEFAULT 0,
    mensajes_audio          INTEGER DEFAULT 0,
    audio_segundos          INTEGER DEFAULT 0,                   -- Total segundos procesados
    tokens_consumidos       INTEGER DEFAULT 0,                   -- Tokens LLM usados

    -- Acciones realizadas
    inventario_entradas     INTEGER DEFAULT 0,
    inventario_consultas    INTEGER DEFAULT 0,
    ventas_consultadas      INTEGER DEFAULT 0,
    alertas_enviadas        INTEGER DEFAULT 0,

    -- Provider usado
    groq_requests           INTEGER DEFAULT 0,
    openai_requests         INTEGER DEFAULT 0,                   -- Fallback

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_uso_agente UNIQUE (empresa_id, fecha)
);

CREATE INDEX idx_uso_agente_empresa ON uso_agente_ia(empresa_id);
CREATE INDEX idx_uso_agente_periodo ON uso_agente_ia(periodo);
CREATE INDEX idx_uso_agente_fecha ON uso_agente_ia(fecha);
```

---

## 🌐 TABLA: landing_secciones (⭐ NUEVA - Landing Pages)

```sql
-- Secciones personalizables de landing page
CREATE TABLE landing_secciones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Tipo de sección
    tipo                    VARCHAR(30) NOT NULL,                -- hero, features, products, testimonials, contact, cta
    orden                   INTEGER DEFAULT 0,

    -- Contenido
    titulo                  VARCHAR(200),
    subtitulo               VARCHAR(300),
    contenido               TEXT,
    imagen_url              VARCHAR(500),
    video_url               VARCHAR(500),

    -- Botón CTA
    boton_texto             VARCHAR(50),
    boton_url               VARCHAR(500),
    boton_whatsapp          BOOLEAN DEFAULT false,

    -- Configuración visual
    color_fondo             VARCHAR(7),                          -- Hex color
    color_texto             VARCHAR(7),
    estilo                  VARCHAR(30) DEFAULT 'default',       -- default, dark, gradient

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_tipo_seccion CHECK (tipo IN ('hero', 'features', 'products', 'testimonials', 'contact', 'cta', 'gallery', 'about'))
);

CREATE INDEX idx_landing_secciones_empresa ON landing_secciones(empresa_id);
CREATE INDEX idx_landing_secciones_orden ON landing_secciones(empresa_id, orden);
```

---

## ⭐ TABLA: landing_testimonios (⭐ NUEVA)

```sql
-- Testimonios de clientes para landing
CREATE TABLE landing_testimonios (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información del testimonio
    nombre_cliente          VARCHAR(150) NOT NULL,
    cargo                   VARCHAR(100),
    empresa_cliente         VARCHAR(150),
    avatar_url              VARCHAR(500),

    -- Contenido
    testimonio              TEXT NOT NULL,
    rating                  INTEGER DEFAULT 5,                   -- 1-5 estrellas

    -- Orden y estado
    orden                   INTEGER DEFAULT 0,
    destacado               BOOLEAN DEFAULT false,
    activo                  BOOLEAN DEFAULT true,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_landing_testimonios_empresa ON landing_testimonios(empresa_id);
```

---

## 📬 TABLA: landing_contactos (⭐ NUEVA)

```sql
-- Contactos/leads recibidos desde landing
CREATE TABLE landing_contactos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Información contacto
    nombre                  VARCHAR(150) NOT NULL,
    email                   VARCHAR(150),
    telefono                VARCHAR(20),
    mensaje                 TEXT,

    -- Origen
    origen                  VARCHAR(30) DEFAULT 'landing',       -- landing, qr, whatsapp
    utm_source              VARCHAR(100),
    utm_medium              VARCHAR(100),
    utm_campaign            VARCHAR(100),

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'nuevo',         -- nuevo, contactado, convertido, descartado
    notas                   TEXT,

    -- Auditoría
    ip_address              VARCHAR(45),
    user_agent              TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atendido_por            UUID REFERENCES usuarios(id),
    atendido_at             TIMESTAMP,

    CONSTRAINT chk_estado_contacto CHECK (estado IN ('nuevo', 'contactado', 'convertido', 'descartado'))
);

CREATE INDEX idx_landing_contactos_empresa ON landing_contactos(empresa_id);
CREATE INDEX idx_landing_contactos_estado ON landing_contactos(estado);
CREATE INDEX idx_landing_contactos_fecha ON landing_contactos(created_at);
```

---

## 💎 TABLA: planes (⭐ NUEVA - SaaS Billing)

```sql
-- Planes de suscripción del SaaS
CREATE TABLE planes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información del plan
    codigo                  VARCHAR(30) UNIQUE NOT NULL,         -- basico, profesional, enterprise
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Precios (USD)
    precio_mensual          DECIMAL(10,2) NOT NULL,
    precio_anual            DECIMAL(10,2),                       -- Con descuento
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- Límites del plan
    max_sucursales          INTEGER DEFAULT 1,
    max_usuarios            INTEGER DEFAULT 2,
    max_productos           INTEGER DEFAULT 500,
    max_ventas_mes          INTEGER DEFAULT 1000,

    -- Features incluidos
    incluye_reportes        BOOLEAN DEFAULT true,
    incluye_multimoneda     BOOLEAN DEFAULT false,
    incluye_api             BOOLEAN DEFAULT false,
    incluye_soporte_prioritario BOOLEAN DEFAULT false,

    -- Estado
    activo                  BOOLEAN DEFAULT true,
    visible                 BOOLEAN DEFAULT true,
    orden                   INTEGER DEFAULT 0,

    -- Stripe
    stripe_price_id_mensual VARCHAR(100),
    stripe_price_id_anual   VARCHAR(100),

    -- PayPal
    paypal_plan_id_mensual  VARCHAR(100),
    paypal_plan_id_anual    VARCHAR(100),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planes_codigo ON planes(codigo);
```

---

## 🧩 TABLA: addons (⭐ NUEVA - Módulos Adicionales)

```sql
-- Módulos adicionales de pago
CREATE TABLE addons (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Información
    codigo                  VARCHAR(30) UNIQUE NOT NULL,         -- facturacion, agente_ia, ecommerce
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Precio (USD)
    precio_mensual          DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- Categoría
    categoria               VARCHAR(30) DEFAULT 'general',       -- general, integracion, automatizacion

    -- Estado
    activo                  BOOLEAN DEFAULT true,
    visible                 BOOLEAN DEFAULT true,
    orden                   INTEGER DEFAULT 0,

    -- Stripe
    stripe_price_id         VARCHAR(100),

    -- PayPal
    paypal_plan_id          VARCHAR(100),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addons_codigo ON addons(codigo);
```

---

## 📋 TABLA: suscripciones (⭐ NUEVA - Billing)

```sql
-- Suscripciones activas de empresas
CREATE TABLE suscripciones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES planes(id),

    -- Facturación
    ciclo                   VARCHAR(10) DEFAULT 'mensual',       -- mensual, anual
    precio_base             DECIMAL(10,2) NOT NULL,
    precio_addons           DECIMAL(10,2) DEFAULT 0,
    precio_total            DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- Fechas
    fecha_inicio            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_proximo_cobro     TIMESTAMP NOT NULL,
    fecha_fin               TIMESTAMP,                           -- NULL = activa

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'activa',        -- activa, pausada, cancelada, vencida

    -- Gateway de pago
    gateway                 VARCHAR(20),                         -- stripe, paypal
    gateway_subscription_id VARCHAR(100),                        -- ID suscripción en Stripe/PayPal
    gateway_customer_id     VARCHAR(100),                        -- ID cliente en Stripe/PayPal

    -- Método de pago
    metodo_pago_tipo        VARCHAR(20),                         -- card, paypal
    metodo_pago_ultimos4    VARCHAR(4),
    metodo_pago_marca       VARCHAR(20),                         -- visa, mastercard, amex

    -- Cancelación
    cancelada_at            TIMESTAMP,
    motivo_cancelacion      TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_suscripcion_empresa UNIQUE (empresa_id),
    CONSTRAINT chk_ciclo CHECK (ciclo IN ('mensual', 'anual')),
    CONSTRAINT chk_estado_suscripcion CHECK (estado IN ('activa', 'pausada', 'cancelada', 'vencida', 'trial')),
    CONSTRAINT chk_gateway CHECK (gateway IN ('stripe', 'paypal', NULL))
);

CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_suscripciones_proximo_cobro ON suscripciones(fecha_proximo_cobro);
```

---

## 🔗 TABLA: suscripcion_addons (⭐ NUEVA)

```sql
-- Addons contratados por suscripción
CREATE TABLE suscripcion_addons (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suscripcion_id          UUID NOT NULL REFERENCES suscripciones(id) ON DELETE CASCADE,
    addon_id                UUID NOT NULL REFERENCES addons(id),

    -- Precio al momento de contratar
    precio                  DECIMAL(10,2) NOT NULL,

    -- Fechas
    fecha_activacion        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_desactivacion     TIMESTAMP,

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    CONSTRAINT uk_suscripcion_addon UNIQUE (suscripcion_id, addon_id)
);

CREATE INDEX idx_suscripcion_addons_suscripcion ON suscripcion_addons(suscripcion_id);
```

---

## 💳 TABLA: pagos (⭐ NUEVA - Historial)

```sql
-- Historial de pagos del SaaS
CREATE TABLE pagos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    suscripcion_id          UUID REFERENCES suscripciones(id),

    -- Información del pago
    numero                  VARCHAR(30) UNIQUE NOT NULL,         -- PAY-2025-00001
    concepto                VARCHAR(200) NOT NULL,
    descripcion             TEXT,

    -- Montos
    monto                   DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',
    impuesto                DECIMAL(10,2) DEFAULT 0,
    total                   DECIMAL(10,2) NOT NULL,

    -- Gateway
    gateway                 VARCHAR(20) NOT NULL,                -- stripe, paypal
    gateway_payment_id      VARCHAR(100),                        -- ID transacción
    gateway_invoice_id      VARCHAR(100),
    gateway_receipt_url     VARCHAR(500),

    -- Método de pago
    metodo_pago             VARCHAR(20),                         -- card, paypal
    ultimos4                VARCHAR(4),
    marca_tarjeta           VARCHAR(20),

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'pendiente',     -- pendiente, completado, fallido, reembolsado

    -- Fechas
    fecha_pago              TIMESTAMP,
    fecha_vencimiento       TIMESTAMP,

    -- Factura
    factura_url             VARCHAR(500),
    factura_enviada         BOOLEAN DEFAULT false,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_gateway_pago CHECK (gateway IN ('stripe', 'paypal')),
    CONSTRAINT chk_estado_pago CHECK (estado IN ('pendiente', 'completado', 'fallido', 'reembolsado', 'cancelado'))
);

CREATE INDEX idx_pagos_empresa ON pagos(empresa_id);
CREATE INDEX idx_pagos_suscripcion ON pagos(suscripcion_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_pagos_gateway ON pagos(gateway, gateway_payment_id);
```

---

## 📋 TABLA: auditoria_roles (⭐ NUEVA - RBAC)

```sql
-- Log de cambios de roles de usuarios
CREATE TABLE auditoria_roles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Acción
    accion                  VARCHAR(30) NOT NULL,                -- cambio_rol, permiso_especial, crear, desactivar

    -- Datos del cambio
    rol_anterior_id         UUID REFERENCES roles(id),
    rol_nuevo_id            UUID REFERENCES roles(id),
    datos_anteriores        JSONB,                               -- Permisos anteriores
    datos_nuevos            JSONB,                               -- Permisos nuevos
    motivo                  TEXT,

    -- Quién realizó el cambio
    realizado_por           UUID NOT NULL REFERENCES usuarios(id),
    ip_address              VARCHAR(45),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_accion_auditoria CHECK (accion IN ('cambio_rol', 'permiso_especial', 'crear', 'desactivar', 'activar'))
);

CREATE INDEX idx_auditoria_roles_empresa ON auditoria_roles(empresa_id);
CREATE INDEX idx_auditoria_roles_usuario ON auditoria_roles(usuario_id);
CREATE INDEX idx_auditoria_roles_fecha ON auditoria_roles(created_at);
```

---

## 📋 TABLA: auditoria_acciones (⭐ NUEVA - Log General)

> Registro de **TODAS las acciones importantes** realizadas en el sistema. Para auditoría completa.

```sql
CREATE TABLE auditoria_acciones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID REFERENCES empresas(id) ON DELETE CASCADE,  -- NULL = acción de super admin

    -- Quién realizó la acción
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),
    usuario_nombre          VARCHAR(200),                        -- Cache del nombre
    usuario_rol             VARCHAR(50),                         -- Cache del rol

    -- Qué acción se realizó
    modulo                  VARCHAR(50) NOT NULL,                -- productos, ventas, usuarios, caja, etc.
    accion                  VARCHAR(30) NOT NULL,                -- crear, editar, eliminar, anular, login, logout
    entidad_id              UUID,                                -- ID del registro afectado
    entidad_tipo            VARCHAR(50),                         -- producto, venta, usuario, etc.
    descripcion             TEXT NOT NULL,                       -- "Creó producto Camiseta Roja"

    -- Datos del cambio
    datos_anteriores        JSONB,                               -- Estado anterior (para editar/eliminar)
    datos_nuevos            JSONB,                               -- Estado nuevo (para crear/editar)

    -- Contexto
    sucursal_id             UUID REFERENCES sucursales(id),
    ip_address              VARCHAR(45),
    user_agent              VARCHAR(500),
    request_id              VARCHAR(100),                        -- Para correlacionar logs

    -- Resultado
    exitoso                 BOOLEAN DEFAULT true,
    error_mensaje           TEXT,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_modulo CHECK (modulo IN (
        'auth', 'usuarios', 'roles', 'empresas', 'sucursales',
        'productos', 'categorias', 'marcas', 'atributos',
        'inventario', 'movimientos',
        'ventas', 'caja', 'clientes',
        'promociones', 'comprobantes',
        'reportes', 'configuracion', 'billing', 'integraciones'
    )),
    CONSTRAINT chk_accion CHECK (accion IN (
        'crear', 'editar', 'eliminar', 'ver', 'listar',
        'anular', 'aprobar', 'rechazar',
        'login', 'logout', 'login_fallido',
        'abrir_caja', 'cerrar_caja',
        'exportar', 'importar',
        'sync', 'webhook'
    ))
);

CREATE INDEX idx_auditoria_acciones_empresa ON auditoria_acciones(empresa_id);
CREATE INDEX idx_auditoria_acciones_usuario ON auditoria_acciones(usuario_id);
CREATE INDEX idx_auditoria_acciones_modulo ON auditoria_acciones(modulo);
CREATE INDEX idx_auditoria_acciones_fecha ON auditoria_acciones(created_at);
CREATE INDEX idx_auditoria_acciones_entidad ON auditoria_acciones(entidad_tipo, entidad_id);
```

### Campos auditoria_acciones

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador único |
| empresa_id | UUID | No | FK empresa (NULL=super admin) |
| usuario_id | UUID | Sí | FK usuario que realizó la acción |
| usuario_nombre | VARCHAR(200) | No | Nombre del usuario (cache) |
| usuario_rol | VARCHAR(50) | No | Rol del usuario (cache) |
| modulo | VARCHAR(50) | Sí | Módulo afectado |
| accion | VARCHAR(30) | Sí | Tipo de acción |
| entidad_id | UUID | No | ID del registro afectado |
| entidad_tipo | VARCHAR(50) | No | Tipo de entidad |
| descripcion | TEXT | Sí | Descripción legible de la acción |
| datos_anteriores | JSONB | No | Estado anterior |
| datos_nuevos | JSONB | No | Estado nuevo |
| sucursal_id | UUID | No | FK sucursal donde ocurrió |
| ip_address | VARCHAR(45) | No | IP del cliente |
| user_agent | VARCHAR(500) | No | Navegador/cliente |
| request_id | VARCHAR(100) | No | ID de correlación |
| exitoso | BOOLEAN | No | ¿Acción exitosa? |
| error_mensaje | TEXT | No | Mensaje de error si falló |
| created_at | TIMESTAMP | Auto | Fecha de la acción |

### Ejemplos de Auditoría

```sql
-- Login exitoso
INSERT INTO auditoria_acciones (empresa_id, usuario_id, usuario_nombre, usuario_rol, modulo, accion, descripcion, ip_address)
VALUES ('uuid-empresa', 'uuid-usuario', 'Juan Pérez', 'admin', 'auth', 'login', 'Inicio de sesión exitoso', '192.168.1.100');

-- Creación de producto
INSERT INTO auditoria_acciones (empresa_id, usuario_id, usuario_nombre, modulo, accion, entidad_id, entidad_tipo, descripcion, datos_nuevos)
VALUES ('uuid-empresa', 'uuid-usuario', 'María García', 'productos', 'crear', 'uuid-producto', 'producto',
        'Creó producto "Camiseta Básica" (SKU: CAM-001)', '{"nombre": "Camiseta Básica", "precio": 29.90}');

-- Anulación de venta
INSERT INTO auditoria_acciones (empresa_id, usuario_id, usuario_nombre, modulo, accion, entidad_id, entidad_tipo, descripcion, datos_anteriores, sucursal_id)
VALUES ('uuid-empresa', 'uuid-supervisor', 'Carlos López', 'ventas', 'anular', 'uuid-venta', 'venta',
        'Anuló venta #V-001234 por S/150.00 - Motivo: Cliente solicitó devolución',
        '{"total": 150.00, "estado": "completada"}', 'uuid-sucursal');
```

---

## 🛒 TABLA: integraciones_ecommerce (⭐ NUEVA - WooCommerce/Shopify)

```sql
-- Configuración de integraciones e-commerce
CREATE TABLE integraciones_ecommerce (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Plataforma
    plataforma              VARCHAR(30) NOT NULL,                -- woocommerce, shopify, tiendanube
    nombre                  VARCHAR(100) NOT NULL,               -- Nombre identificador

    -- Credenciales (encriptadas en JSONB)
    config                  JSONB NOT NULL,                      -- {storeUrl, consumerKey, consumerSecret} o {storeDomain, accessToken}
    config_encrypted        BOOLEAN DEFAULT true,

    -- Sincronización
    sync_productos          BOOLEAN DEFAULT true,
    sync_stock              BOOLEAN DEFAULT true,
    sync_pedidos            BOOLEAN DEFAULT true,
    sync_clientes           BOOLEAN DEFAULT true,
    sync_intervalo_min      INTEGER DEFAULT 15,
    ultima_sync             TIMESTAMP,
    ultima_sync_exitosa     TIMESTAMP,

    -- Mapeo de datos
    mapeo_categorias        JSONB DEFAULT '{}',                  -- {"uuid-local": id-externo}
    mapeo_atributos         JSONB DEFAULT '{}',
    mapeo_estados           JSONB DEFAULT '{}',

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'configurando',  -- configurando, activo, pausado, error
    ultimo_error            TEXT,

    -- Estadísticas
    productos_sincronizados INTEGER DEFAULT 0,
    pedidos_importados      INTEGER DEFAULT 0,

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_ecommerce_empresa UNIQUE (empresa_id, plataforma),
    CONSTRAINT chk_plataforma CHECK (plataforma IN ('woocommerce', 'shopify', 'tiendanube', 'prestashop')),
    CONSTRAINT chk_estado_ecommerce CHECK (estado IN ('configurando', 'activo', 'pausado', 'error'))
);

CREATE INDEX idx_integraciones_ecommerce_empresa ON integraciones_ecommerce(empresa_id);
```

---

## 🔗 TABLA: ecommerce_productos_sync (⭐ NUEVA)

```sql
-- Mapeo de productos POS ↔ E-commerce
CREATE TABLE ecommerce_productos_sync (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integracion_id          UUID NOT NULL REFERENCES integraciones_ecommerce(id) ON DELETE CASCADE,
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id             UUID REFERENCES variantes(id) ON DELETE CASCADE,

    -- ID en plataforma externa
    external_id             VARCHAR(100) NOT NULL,               -- ID en WooCommerce/Shopify
    external_parent_id      VARCHAR(100),                        -- ID padre (para variantes)

    -- Estado de sincronización
    ultima_sync             TIMESTAMP,
    sync_direccion          VARCHAR(15) DEFAULT 'bidireccional', -- pos_to_ext, ext_to_pos, bidireccional
    hash_local              VARCHAR(64),                         -- Para detectar cambios
    hash_externo            VARCHAR(64),

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_ecommerce_producto UNIQUE (integracion_id, producto_id, variante_id),
    CONSTRAINT chk_sync_direccion CHECK (sync_direccion IN ('pos_to_ext', 'ext_to_pos', 'bidireccional'))
);

CREATE INDEX idx_ecommerce_sync_integracion ON ecommerce_productos_sync(integracion_id);
CREATE INDEX idx_ecommerce_sync_producto ON ecommerce_productos_sync(producto_id);
```

---

## 📦 TABLA: ecommerce_pedidos (⭐ NUEVA)

```sql
-- Pedidos importados de e-commerce
CREATE TABLE ecommerce_pedidos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integracion_id          UUID NOT NULL REFERENCES integraciones_ecommerce(id) ON DELETE CASCADE,
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- ID en plataforma externa
    external_order_id       VARCHAR(100) NOT NULL,
    external_order_number   VARCHAR(50),

    -- Datos del pedido
    estado_externo          VARCHAR(50),                         -- processing, completed, cancelled
    total                   DECIMAL(12,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'PEN',
    fecha_pedido            TIMESTAMP NOT NULL,

    -- Cliente
    cliente_nombre          VARCHAR(200),
    cliente_email           VARCHAR(150),
    cliente_telefono        VARCHAR(20),

    -- Envío
    direccion_envio         JSONB,
    metodo_envio            VARCHAR(100),
    costo_envio             DECIMAL(10,2) DEFAULT 0,

    -- Relación con POS
    venta_id                UUID REFERENCES ventas(id),          -- Venta creada en POS
    procesado               BOOLEAN DEFAULT false,
    procesado_at            TIMESTAMP,

    -- Datos originales
    raw_data                JSONB,                               -- JSON completo del pedido

    -- Auditoría
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_ecommerce_pedido UNIQUE (integracion_id, external_order_id)
);

CREATE INDEX idx_ecommerce_pedidos_empresa ON ecommerce_pedidos(empresa_id);
CREATE INDEX idx_ecommerce_pedidos_procesado ON ecommerce_pedidos(procesado);
CREATE INDEX idx_ecommerce_pedidos_fecha ON ecommerce_pedidos(fecha_pedido);
```

---

## 📝 RESUMEN DE TABLAS

| Tabla | Descripción | Campos principales |
|-------|-------------|-------------------|
| empresas | Tenants del SaaS | id, codigo, nombre_comercial, plan |
| sucursales | Sucursales por empresa | id, empresa_id, nombre |
| usuarios | Usuarios del sistema | id, empresa_id, email, rol_id, todas_sucursales |
| **usuario_sucursales** | **Multi-sucursal por usuario** | **usuario_id, sucursal_id, es_principal, rol_sucursal** |
| roles | Roles del sistema | id, codigo, nombre |
| permisos | Permisos granulares | id, codigo, modulo |
| categorias | Categorías de productos | id, empresa_id, nombre, slug |
| **categoria_atributos** | **Vincula categoría-atributo** | **categoria_id, atributo_id, obligatorio** |
| marcas | Marcas de productos | id, empresa_id, nombre, slug |
| atributos | Atributos (Talla, Color) | id, empresa_id, nombre, tipo_sistema |
| valores_atributo | Valores (S, M, Rojo) | id, atributo_id, valor |
| **plantillas_nicho** | **Plantillas para onboarding** | **id, nombre, slug** |
| **plantilla_atributos** | **Atributos por plantilla** | **plantilla_id, nombre_atributo** |
| unidades_medida | Unidades (kg, lt) | id, empresa_id, nombre |
| productos | Productos principales | id, empresa_id, nombre, precio_venta, codigo_barras, stock |
| variantes | Variantes de productos | id, producto_id, sku, stock |
| movimientos_inventario | Kardex | id, variante_id, tipo, cantidad |
| clientes | Clientes | id, empresa_id, nombre |
| proveedores | Proveedores | id, empresa_id, razon_social |
| promociones | Promociones | id, empresa_id, tipo, descuento |
| metodos_pago | Métodos de pago | id, empresa_id, nombre, tipo |
| cajas | Cajas registradoras | id, sucursal_id, estado |
| ventas | Ventas realizadas | id, numero_completo, total |
| venta_detalles | Detalle de ventas | id, venta_id, cantidad |
| venta_pagos | Pagos de ventas | id, venta_id, monto |
| empresa_seo | Config SEO/Tracking | empresa_id, ga4_id, meta_pixel_id |
| **comprobantes** | **Boletas/Facturas SUNAT** | **id, tipo, serie, numero, estado** |
| **comprobante_detalles** | **Detalle comprobantes** | **comprobante_id, descripcion, total** |
| **resumenes_diarios** | **Resumen diario boletas** | **id, fecha, total, estado** |
| **facturacion_config** | **Config facturación** | **empresa_id, proveedor, api_token** |
| **facturacion_log** | **Log de envíos SUNAT** | **comprobante_id, accion, exitoso** |
| **integraciones_whatsapp** | **WhatsApp + Agente IA** | **empresa_id, instancia_nombre, agente_ia_activo** |
| **uso_agente_ia** | **Tracking uso IA** | **empresa_id, fecha, mensajes_texto, mensajes_audio** |
| **landing_secciones** | **Secciones landing page** | **empresa_id, tipo, titulo, contenido** |
| **landing_testimonios** | **Testimonios clientes** | **empresa_id, nombre_cliente, testimonio** |
| **landing_contactos** | **Leads/contactos** | **empresa_id, nombre, email, estado** |
| **planes** | **Planes SaaS** | **codigo, nombre, precio_mensual** |
| **addons** | **Módulos adicionales** | **codigo, nombre, precio_mensual** |
| **suscripciones** | **Suscripciones empresas** | **empresa_id, plan_id, estado, gateway** |
| **suscripcion_addons** | **Addons contratados** | **suscripcion_id, addon_id, precio** |
| **pagos** | **Historial pagos SaaS** | **empresa_id, numero, monto, gateway** |
| **auditoria_roles** | **Log cambios de roles** | **usuario_id, accion, rol_anterior, rol_nuevo** |
| **auditoria_acciones** | **Log general de acciones** | **usuario_id, modulo, accion, descripcion, entidad_id** |
| **integraciones_ecommerce** | **WooCommerce/Shopify** | **empresa_id, plataforma, config, estado** |
| **ecommerce_productos_sync** | **Mapeo productos POS↔Ecommerce** | **producto_id, external_id** |
| **ecommerce_pedidos** | **Pedidos importados** | **external_order_id, venta_id, procesado** |
| **compras** | **Compras a proveedores** | **proveedor_id, total, estado_pago, monto_pendiente** |
| **compra_detalles** | **Detalle de compras** | **compra_id, producto_texto, cantidad, precio_unitario** |
| **pagos_proveedor** | **Pagos a proveedores** | **proveedor_id, monto, metodo_pago, fecha** |

### VISTAS

| Vista | Descripción | Campos principales |
|-------|-------------|-------------------|
| **cuenta_corriente_proveedor** | **Saldo actual por proveedor** | **proveedor_id, total_compras, total_pagado, saldo_pendiente** |

---

**Total: 48 tablas + 1 vista**
