# 🛒 INTEGRACIONES E-COMMERCE

## Resumen

Integración bidireccional con plataformas de e-commerce para sincronizar:
- **Productos**: POS → E-commerce y viceversa
- **Stock**: Actualización en tiempo real
- **Pedidos**: E-commerce → POS como ventas
- **Clientes**: Sincronización de datos

---

## 📊 PLATAFORMAS SOPORTADAS

| Plataforma | Tipo | Estado | Addon |
|------------|------|--------|-------|
| **WooCommerce** | Plugin WordPress | Planificado | +$8/mes |
| **Shopify** | SaaS | Planificado | +$10/mes |
| **TiendaNube** | SaaS (LATAM) | Futuro | +$8/mes |
| **PrestaShop** | Open Source | Futuro | +$8/mes |

---

## 🔗 WOOCOMMERCE

### Requisitos
- WordPress con WooCommerce instalado
- Plugin REST API habilitado
- Credenciales API (Consumer Key + Consumer Secret)

### Configuración

```typescript
// Tabla: integraciones_ecommerce
{
  id: "uuid",
  empresaId: "uuid",
  plataforma: "woocommerce",
  nombre: "Mi Tienda Online",

  // Credenciales WooCommerce
  config: {
    storeUrl: "https://mitienda.com",
    consumerKey: "ck_xxxxxxxxxxxxx",
    consumerSecret: "cs_xxxxxxxxxxxxx",
    version: "wc/v3"
  },

  // Configuración de sincronización
  sincronizacion: {
    productosActivo: true,
    stockActivo: true,
    pedidosActivo: true,
    clientesActivo: true,
    intervaloMinutos: 15,         // Sync cada 15 min
    ultimaSync: "2025-01-10T15:30:00Z"
  },

  // Mapeo de campos
  mapeo: {
    categorias: {
      "uuid-local": 123,          // ID categoría WooCommerce
    },
    atributos: {
      "talla": "pa_size",         // Atributo WooCommerce
      "color": "pa_color"
    },
    estadosPedido: {
      "processing": "pendiente",
      "completed": "completado",
      "cancelled": "anulado"
    }
  },

  estado: "activo",
  createdAt: "timestamp"
}
```

### Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINCRONIZACIÓN BIDIRECCIONAL                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POS → WooCommerce:                                             │
│  ├── Crear producto → POST /wp-json/wc/v3/products             │
│  ├── Actualizar stock → PUT /wp-json/wc/v3/products/{id}       │
│  ├── Actualizar precio → PUT /wp-json/wc/v3/products/{id}      │
│  └── Crear categoría → POST /wp-json/wc/v3/products/categories │
│                                                                  │
│  WooCommerce → POS:                                             │
│  ├── Nuevo pedido → Webhook → Crear venta en POS               │
│  ├── Pedido cancelado → Webhook → Anular venta                 │
│  └── Nuevo cliente → Webhook → Crear cliente en POS            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Webhooks WooCommerce

```typescript
// Webhooks a configurar en WooCommerce
const webhooks = [
  {
    topic: "order.created",
    deliveryUrl: "https://api.tupos.com/webhook/woocommerce/order",
    secret: "webhook_secret_xxxxx"
  },
  {
    topic: "order.updated",
    deliveryUrl: "https://api.tupos.com/webhook/woocommerce/order",
    secret: "webhook_secret_xxxxx"
  },
  {
    topic: "product.updated",
    deliveryUrl: "https://api.tupos.com/webhook/woocommerce/product",
    secret: "webhook_secret_xxxxx"
  }
];
```

### Mapeo de Productos

```typescript
// POS Producto → WooCommerce Product
{
  // POS
  nombre: "Camiseta Básica",
  descripcion: "Camiseta 100% algodón",
  precioVenta: 29.90,
  sku: "CAM-001",
  categoriaId: "uuid-categoria",
  imagenes: ["url1", "url2"],
  variantes: [
    { sku: "CAM-001-S-ROJO", talla: "S", color: "Rojo", stock: 10 },
    { sku: "CAM-001-M-ROJO", talla: "M", color: "Rojo", stock: 15 }
  ]
}

// → Se convierte a WooCommerce
{
  name: "Camiseta Básica",
  description: "Camiseta 100% algodón",
  regular_price: "29.90",
  sku: "CAM-001",
  categories: [{ id: 123 }],
  images: [{ src: "url1" }, { src: "url2" }],
  type: "variable",
  attributes: [
    { name: "Size", options: ["S", "M"], variation: true },
    { name: "Color", options: ["Rojo"], variation: true }
  ],
  variations: [
    { sku: "CAM-001-S-ROJO", attributes: [...], stock_quantity: 10 },
    { sku: "CAM-001-M-ROJO", attributes: [...], stock_quantity: 15 }
  ]
}
```

---

## 🛍️ SHOPIFY

### Requisitos
- Tienda Shopify activa
- App privada creada con permisos de API
- Access Token de Admin API

### Configuración

```typescript
// Configuración Shopify
{
  plataforma: "shopify",
  config: {
    storeDomain: "mitienda.myshopify.com",
    accessToken: "shpat_xxxxxxxxxxxxx",
    apiVersion: "2024-01"
  },
  sincronizacion: {
    productosActivo: true,
    stockActivo: true,
    pedidosActivo: true,
    locationId: "12345678901"     // ID de ubicación para stock
  }
}
```

### API Shopify

```typescript
// Crear producto en Shopify
POST https://mitienda.myshopify.com/admin/api/2024-01/products.json
Headers: {
  "X-Shopify-Access-Token": "shpat_xxxxx"
}
Body: {
  product: {
    title: "Camiseta Básica",
    body_html: "<p>Camiseta 100% algodón</p>",
    vendor: "Mi Marca",
    product_type: "Camisetas",
    variants: [
      {
        sku: "CAM-001-S",
        price: "29.90",
        inventory_quantity: 10,
        option1: "S"
      }
    ],
    options: [
      { name: "Talla", values: ["S", "M", "L"] }
    ]
  }
}
```

### Webhooks Shopify

```typescript
// Webhooks a registrar
POST https://mitienda.myshopify.com/admin/api/2024-01/webhooks.json
{
  webhook: {
    topic: "orders/create",
    address: "https://api.tupos.com/webhook/shopify/order",
    format: "json"
  }
}

// Topics necesarios:
// - orders/create
// - orders/updated
// - orders/cancelled
// - products/update (si editan desde Shopify)
// - inventory_levels/update
```

---

## 🗄️ BASE DE DATOS

### Tabla: integraciones_ecommerce

```sql
CREATE TABLE integraciones_ecommerce (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Plataforma
    plataforma              VARCHAR(30) NOT NULL,                -- woocommerce, shopify, tiendanube
    nombre                  VARCHAR(100) NOT NULL,               -- Nombre identificador

    -- Credenciales (encriptadas)
    config                  JSONB NOT NULL,                      -- Credenciales específicas de plataforma
    config_encrypted        BOOLEAN DEFAULT true,

    -- Sincronización
    sync_productos          BOOLEAN DEFAULT true,
    sync_stock              BOOLEAN DEFAULT true,
    sync_pedidos            BOOLEAN DEFAULT true,
    sync_clientes           BOOLEAN DEFAULT true,
    sync_intervalo_min      INTEGER DEFAULT 15,
    ultima_sync             TIMESTAMP,
    ultima_sync_exitosa     TIMESTAMP,

    -- Mapeo
    mapeo_categorias        JSONB DEFAULT '{}',                  -- { "uuid-local": id-externo }
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
    CONSTRAINT chk_plataforma CHECK (plataforma IN ('woocommerce', 'shopify', 'tiendanube', 'prestashop'))
);

CREATE INDEX idx_integraciones_ecommerce_empresa ON integraciones_ecommerce(empresa_id);
```

### Tabla: ecommerce_productos_sync

```sql
-- Mapeo de productos POS ↔ E-commerce
CREATE TABLE ecommerce_productos_sync (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integracion_id          UUID NOT NULL REFERENCES integraciones_ecommerce(id) ON DELETE CASCADE,
    producto_id             UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id             UUID REFERENCES variantes(id) ON DELETE CASCADE,

    -- ID externo
    external_id             VARCHAR(100) NOT NULL,               -- ID en WooCommerce/Shopify
    external_parent_id      VARCHAR(100),                        -- ID padre (para variantes)

    -- Estado sync
    ultima_sync             TIMESTAMP,
    sync_direccion          VARCHAR(10) DEFAULT 'bidireccional', -- pos_to_ext, ext_to_pos, bidireccional
    hash_local              VARCHAR(64),                         -- Para detectar cambios
    hash_externo            VARCHAR(64),

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_ecommerce_producto UNIQUE (integracion_id, producto_id, variante_id)
);
```

### Tabla: ecommerce_pedidos

```sql
-- Pedidos importados de e-commerce
CREATE TABLE ecommerce_pedidos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integracion_id          UUID NOT NULL REFERENCES integraciones_ecommerce(id) ON DELETE CASCADE,
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- ID externo
    external_order_id       VARCHAR(100) NOT NULL,
    external_order_number   VARCHAR(50),

    -- Datos del pedido
    estado_externo          VARCHAR(50),                         -- processing, completed, etc.
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

    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_ecommerce_pedido UNIQUE (integracion_id, external_order_id)
);

CREATE INDEX idx_ecommerce_pedidos_empresa ON ecommerce_pedidos(empresa_id);
CREATE INDEX idx_ecommerce_pedidos_procesado ON ecommerce_pedidos(procesado);
```

---

## 🔌 ENDPOINTS API

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/integraciones/ecommerce` | Listar integraciones | `config.integraciones` |
| POST | `/integraciones/ecommerce` | Crear integración | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id` | Ver detalle | `config.integraciones` |
| PUT | `/integraciones/ecommerce/:id` | Actualizar config | `config.integraciones` |
| DELETE | `/integraciones/ecommerce/:id` | Eliminar integración | `config.integraciones` |
| POST | `/integraciones/ecommerce/:id/test` | Probar conexión | `config.integraciones` |
| POST | `/integraciones/ecommerce/:id/sync` | Forzar sincronización | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id/logs` | Ver logs de sync | `config.integraciones` |
| POST | `/webhook/woocommerce/:empresaId` | Webhook WooCommerce | Sistema |
| POST | `/webhook/shopify/:empresaId` | Webhook Shopify | Sistema |

### POST /integraciones/ecommerce

```typescript
// Request - Crear integración WooCommerce
{
  "plataforma": "woocommerce",
  "nombre": "Mi Tienda WordPress",
  "config": {
    "storeUrl": "https://mitienda.com",
    "consumerKey": "ck_xxxxxxxxxxxxx",
    "consumerSecret": "cs_xxxxxxxxxxxxx"
  },
  "sincronizacion": {
    "productos": true,
    "stock": true,
    "pedidos": true,
    "intervaloMinutos": 15
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "plataforma": "woocommerce",
    "estado": "configurando",
    "mensaje": "Conexión establecida. Configure el mapeo de categorías."
  }
}
```

### POST /integraciones/ecommerce/:id/sync

```typescript
// Request - Forzar sincronización
{
  "tipo": "completa",  // completa, productos, stock, pedidos
  "direccion": "bidireccional"  // pos_to_ext, ext_to_pos, bidireccional
}

// Response
{
  "success": true,
  "data": {
    "productosActualizados": 45,
    "stockActualizado": 120,
    "pedidosImportados": 3,
    "errores": []
  }
}
```

---

## 📱 UI - Panel de Integraciones

```
┌─────────────────────────────────────────────────────────────────┐
│  Integraciones E-commerce                      [+ Nueva]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🛒 WooCommerce - Mi Tienda Online                       │   │
│  │  Estado: ● Conectado                                      │   │
│  │  Última sync: hace 5 minutos                              │   │
│  │  Productos: 234 | Pedidos hoy: 12                        │   │
│  │  [Configurar] [Sincronizar] [Ver Logs] [Desconectar]     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  🛍️ Shopify                                               │   │
│  │  Estado: ○ No configurado                                 │   │
│  │  [Conectar Shopify]                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ SINCRONIZACIÓN EN TIEMPO REAL

### Stock en Tiempo Real

```typescript
// Cuando se hace una venta en POS
async function onVentaCreada(venta: Venta) {
  // Actualizar stock en e-commerce
  for (const detalle of venta.detalles) {
    const sync = await getProductoSync(detalle.varianteId);
    if (sync) {
      await updateStockEcommerce(sync.integracionId, sync.externalId, -detalle.cantidad);
    }
  }
}

// Cuando llega un pedido de e-commerce
async function onPedidoEcommerce(pedido: EcommercePedido) {
  // Crear venta en POS
  const venta = await crearVentaDesdePedido(pedido);

  // Descontar stock local
  for (const item of pedido.items) {
    const sync = await getProductoSyncByExternal(item.productId);
    if (sync) {
      await descontarStock(sync.varianteId, item.cantidad);
    }
  }
}
```

---

## 💰 PRECIOS ADDON

| Plataforma | Precio Mensual | Incluye |
|------------|---------------|---------|
| WooCommerce | $8 USD | Sync ilimitado, soporte |
| Shopify | $10 USD | Sync ilimitado, soporte |
| TiendaNube | $8 USD | Sync ilimitado, soporte |
| Pack E-commerce | $20 USD | 2 plataformas a elección |

---

## 🔒 SEGURIDAD

```typescript
// Las credenciales se almacenan encriptadas
const encryptConfig = (config: object) => {
  return crypto.encrypt(JSON.stringify(config), process.env.ENCRYPTION_KEY);
};

// Validación de webhooks
const validateWebhook = (req: Request) => {
  const signature = req.headers['x-wc-webhook-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)
    .digest('base64');

  return signature === expectedSignature;
};
```
