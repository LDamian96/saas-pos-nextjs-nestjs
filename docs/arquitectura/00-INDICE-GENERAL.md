# SISTEMA POS SAAS - INDICE DE ARQUITECTURA

## REGLAS FUNDAMENTALES DE DESARROLLO

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROHIBIDO EN DESARROLLO:                                               │
│  ├── NO ejecutar npm run build                                          │
│  ├── NO tocar configuraciones de produccion                             │
│  ├── NO hacer deploy                                                    │
│  └── La produccion se configura AL FINAL del proyecto                   │
│                                                                          │
│  OBLIGATORIO:                                                            │
│  ├── Usar SOLO npm run dev (desarrollo)                                 │
│  ├── Verificar que los campos coincidan con la BD                       │
│  ├── Revisar referencias antes de crear endpoints                       │
│  └── Backend primero, Frontend despues                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## ESTRUCTURA DE DOCUMENTOS

| # | Archivo | Descripcion |
|---|---------|-------------|
| 00 | `00-INDICE-GENERAL.md` | Este archivo - Indice y reglas |
| 01 | `01-STACK-TECNOLOGICO.md` | Tecnologias, puertos, configuracion |
| 02 | `02-ESTRUCTURA-PROYECTO.md` | Carpetas y archivos del proyecto |
| 03 | `03-BASE-DATOS-COMPLETA.md` | Todas las tablas con TODOS los campos |
| 04 | `04-SEGURIDAD-OWASP.md` | Implementacion de seguridad |
| 05 | `05-REDIS-CACHE.md` | Estrategia de cache con Redis |
| 06 | `06-API-ENDPOINTS.md` | Todos los endpoints del backend |
| 07 | `07-FRONTEND-RUTAS.md` | Todas las rutas del frontend |
| 08 | `08-SEO-TRACKING.md` | SEO, Analytics, Ads |
| 09 | `09-IMPRESION-BOLETAS.md` | Sistema de impresion termica |
| 10 | `10-IMPORT-EXPORT.md` | Importar/Exportar Excel/CSV |
| 11 | `11-DOCKER-CONFIG.md` | Configuracion de Docker |
| 12 | `12-COMANDOS-DESARROLLO.md` | Comandos para desarrollo |
| 13 | `13-FACTURACION-ELECTRONICA.md` | Facturacion SUNAT (Addon +$5/mes) |
| 14 | `14-AGENTE-IA-N8N.md` | Agente IA WhatsApp + N8N (Addon +$2/mes) |
| 15 | `15-LANDING-QR-SEO.md` | Landing Pages Multi-tenant + QR + SEO |
| 16 | `16-PAGOS-SUSCRIPCIONES.md` | Stripe + PayPal - Billing SaaS |
| 17 | `17-ROLES-PERMISOS-RBAC.md` | Sistema de Roles y Permisos completo |
| 18 | `18-INTEGRACIONES-ECOMMERCE.md` | WooCommerce + Shopify (Addon +$8-10/mes) |
| 19 | `19-UX-UI-GUIDELINES.md` | Guia UX/UI para usuarios no tecnicos |
| 20 | `20-LOTES-FEFO.md` | Control de Lotes y FEFO (vencimientos) |
| 21 | `21-CREDENCIALES-PAGOS.md` | Credenciales de pasarelas de pago |
| 22 | `22-HARDWARE-POS-PERU.md` | Proveedores de hardware POS en Peru |

---

## ESTADO ACTUAL DEL PROYECTO (Actualizado: Enero 2025)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PROGRESO GENERAL: 73% (9.5 de 13 fases completadas)                    │
│                                                                          │
│  MODULO           │ BACKEND │ FRONTEND │ ESTADO                         │
│  ─────────────────┼─────────┼──────────┼────────────────────────────────│
│  Infraestructura  │   ✅    │    ✅    │ Completado                     │
│  Auth             │   ✅    │    ✅    │ Completado                     │
│  Empresa          │   ✅    │    ✅    │ Completado                     │
│  Catalogos        │   ✅    │    ✅    │ Completado                     │
│  Productos        │   ✅    │    ✅    │ Completado                     │
│  Inventario       │   ✅    │    ✅    │ Completado                     │
│  Ventas/POS       │   ✅    │    ✅    │ Completado                     │
│  Caja             │   ✅    │    ✅    │ Completado (probado)           │
│  Clientes         │   ✅    │    ✅    │ Completado (probado)           │
│  Reportes         │   ✅    │    ⏳    │ Backend OK, Frontend pendiente │
│  Integraciones    │   ⏳    │    ⏳    │ En cola                        │
│  Addons           │   ⏳    │    ⏳    │ En cola                        │
│  Produccion       │   ⏳    │    ⏳    │ AL FINAL                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### SIGUIENTE TAREA: FASE 10 - FRONTEND REPORTES

```
El backend de REPORTES está completado con 8 endpoints funcionando:

ENDPOINTS BACKEND (todos probados con curl):
├── GET /reportes/dashboard          → KPIs principales
├── GET /reportes/ventas             → Reporte completo con margenBruto/margenPorcentaje
├── GET /reportes/ventas/diario      → Ventas del día
├── GET /reportes/productos/mas-vendidos    → Top productos
├── GET /reportes/productos/sin-rotacion    → Productos estancados
├── GET /reportes/inventario/valorizado     → Valor del inventario
├── GET /reportes/caja/resumen       → Resumen de cajas
└── GET /reportes/clientes/frecuentes       → Top clientes

FRONTEND PENDIENTE:
├── /reportes/dashboard (página principal de reportes)
├── /reportes/ventas (reporte de ventas con gráficos)
├── /reportes/productos (productos más/menos vendidos)
├── /reportes/inventario (valorización)
├── /reportes/caja (resumen de cajas)
└── /reportes/clientes (clientes frecuentes)

Archivos backend existentes:
├── backend/src/presentation/http/controllers/reportes.controller.ts
├── backend/src/core/application/services/reportes.service.ts
├── backend/src/core/application/dto/reportes/reporte-filters.dto.ts
└── backend/src/presentation/modules/reportes.module.ts
```

---

## ORDEN DE IMPLEMENTACION (Modulo por Modulo)

```
═══════════════════════════════════════════════════════════════════════════
FASE 1: INFRAESTRUCTURA ✅ COMPLETADA
═══════════════════════════════════════════════════════════════════════════
├── Docker Compose (PostgreSQL:5435 + Redis:6379)
├── Backend NestJS base (puerto 4000)
└── Frontend NextJS base (puerto 3000)

═══════════════════════════════════════════════════════════════════════════
FASE 2: MODULO AUTH ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── POST /auth/register (empresa + usuario)
│   ├── POST /auth/login
│   ├── POST /auth/logout
│   ├── GET /auth/me
│   └── POST /auth/refresh
└── FRONTEND ✅
    ├── /login (pagina de inicio sesion)
    ├── /register (registro empresa + admin)
    ├── AuthGuard (proteccion de rutas)
    └── auth.store.ts (Zustand)

═══════════════════════════════════════════════════════════════════════════
FASE 3: MODULO EMPRESAS ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── GET /empresas/me
│   ├── PUT /empresas/me
│   ├── CRUD Sucursales
│   └── Config empresa
└── FRONTEND ✅
    ├── /configuracion/empresa
    └── /configuracion/sucursales

═══════════════════════════════════════════════════════════════════════════
FASE 4: MODULO CATALOGOS ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── CRUD /categorias + /categorias/:id/atributos
│   ├── CRUD /marcas
│   └── CRUD /atributos + valores
└── FRONTEND ✅
    ├── /catalogos/categorias
    ├── /catalogos/marcas
    └── /catalogos/atributos

═══════════════════════════════════════════════════════════════════════════
FASE 5: MODULO PRODUCTOS ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── CRUD /productos
│   ├── Variantes
│   ├── Imagenes
│   └── Stock por sucursal
└── FRONTEND ✅
    ├── /productos (listado)
    ├── /productos/nuevo
    └── /productos/:id/editar

═══════════════════════════════════════════════════════════════════════════
FASE 6: MODULO INVENTARIO ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── Movimientos de inventario
│   ├── Control de lotes (FEFO)
│   ├── Alertas de stock bajo
│   └── Alertas de vencimiento
└── FRONTEND ✅
    ├── /inventario/lotes
    ├── /inventario/entrada
    ├── /inventario/salida
    ├── /inventario/ajuste
    └── /inventario/traspaso

═══════════════════════════════════════════════════════════════════════════
FASE 7: MODULO VENTAS/POS ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── POST /ventas (crear venta con FEFO)
│   ├── GET /ventas (listado con filtros)
│   ├── GET /ventas/:id (detalle con items y pagos)
│   ├── POST /ventas/:id/anular (anular venta)
│   └── GET /ventas/resumen-dia (estadisticas)
└── FRONTEND ✅
    ├── /pos (punto de venta completo)
    ├── /ventas (historial con stats)
    ├── /ventas/:id (detalle)
    └── pos.store.ts (carrito Zustand)

═══════════════════════════════════════════════════════════════════════════
FASE 8: MODULO CAJA ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── POST /caja/abrir (abrir caja con monto inicial)
│   ├── POST /caja/:id/cerrar (cerrar caja con arqueo)
│   ├── GET /caja/actual (obtener caja abierta)
│   ├── GET /caja/:id (detalle de caja)
│   ├── GET /caja/:id/resumen (resumen de caja)
│   ├── GET /caja/historial (historial de cajas)
│   └── POST /caja/:id/movimiento (agregar ingreso/egreso)
└── FRONTEND ✅
    ├── /caja (abrir/cerrar/ver estado actual)
    ├── /caja/historial (historial de cajas)
    └── /caja/:id (detalle de caja)

═══════════════════════════════════════════════════════════════════════════
FASE 9: MODULO CLIENTES ✅ COMPLETADO
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── CRUD /clientes
│   ├── GET /clientes/:id/compras
│   └── POST /clientes/buscar
└── FRONTEND ✅
    ├── /clientes (listado con tabla y estadísticas)
    ├── /clientes/nuevo (dialog modal)
    ├── /clientes/:id (detalle con historial compras)
    └── /clientes/:id/editar (dialog modal)

═══════════════════════════════════════════════════════════════════════════
FASE 10: MODULO REPORTES ⬅️ EN PROGRESO (Frontend pendiente)
═══════════════════════════════════════════════════════════════════════════
├── BACKEND ✅
│   ├── GET /reportes/dashboard (KPIs)
│   ├── GET /reportes/ventas (con margenBruto, margenPorcentaje)
│   ├── GET /reportes/ventas/diario
│   ├── GET /reportes/productos/mas-vendidos
│   ├── GET /reportes/productos/sin-rotacion
│   ├── GET /reportes/inventario/valorizado
│   ├── GET /reportes/caja/resumen
│   └── GET /reportes/clientes/frecuentes
└── FRONTEND ⏳
    ├── /reportes/dashboard
    ├── /reportes/ventas
    ├── /reportes/productos
    ├── /reportes/inventario
    ├── /reportes/caja
    └── /reportes/clientes

═══════════════════════════════════════════════════════════════════════════
FASE 11: INTEGRACIONES Y BILLING ⏳ EN COLA
═══════════════════════════════════════════════════════════════════════════
├── Mercado Pago (configurado - ver credenciales abajo)
├── PayPal (pendiente - ver instrucciones abajo)
├── Impresion de boletas
├── Landing Pages Multi-tenant
└── SEO y tracking

═══════════════════════════════════════════════════════════════════════════
FASE 12: ADDONS ⏳ EN COLA
═══════════════════════════════════════════════════════════════════════════
├── Facturacion Electronica SUNAT (+$5/mes)
├── Agente IA WhatsApp (+$2/mes)
├── WooCommerce (+$8/mes)
└── Shopify (+$10/mes)

═══════════════════════════════════════════════════════════════════════════
FASE 13: PRODUCCION ⏳ AL FINAL
═══════════════════════════════════════════════════════════════════════════
├── Optimizacion
├── Build de produccion (npm run build)
├── Docker produccion
└── Deploy
```

---

## CREDENCIALES DE PASARELAS DE PAGO

### Mercado Pago (TEST)

```
PUBLIC_KEY=TEST-47571ab9-8016-4bcc-97c8-4edd525d6008
ACCESS_TOKEN=TEST-7533682258184666-121221-10b0bcd47b0afd3cc810111603e6c1d6-2153656036
```

**IMPORTANTE**: Estas son credenciales de PRUEBA. Para produccion, obtener en:
https://www.mercadopago.com.pe/developers/panel/credentials

### PayPal - Como obtener credenciales

1. Ir a https://developer.paypal.com/
2. Crear cuenta o iniciar sesion
3. Ir a "Dashboard" > "My Apps & Credentials"
4. Crear una aplicacion (Sandbox para pruebas, Live para produccion)
5. Copiar Client ID y Secret

```
Sandbox (pruebas):
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

Live (produccion):
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
```

---

## HARDWARE POS RECOMENDADO EN PERU

### Impresoras Termicas

| Proveedor | Modelo | Precio Aprox | Donde comprar |
|-----------|--------|--------------|---------------|
| Epson | TM-T20III | S/ 450-550 | Mercado Libre, Linio |
| Star | TSP143III | S/ 600-700 | Amazon, importadores |
| Xprinter | XP-58 | S/ 80-120 | Mercado Libre |
| Xprinter | XP-80C | S/ 150-200 | Mercado Libre |

**Recomendacion economica**: Xprinter XP-80C (USB, 80mm)

### Lectores de Codigo de Barras

| Proveedor | Modelo | Precio Aprox | Donde comprar |
|-----------|--------|--------------|---------------|
| Honeywell | Voyager 1250g | S/ 200-300 | Mercado Libre |
| Symbol | LS2208 | S/ 150-200 | Mercado Libre |
| Generico USB | - | S/ 30-60 | Mercado Libre |

**Recomendacion economica**: Lector generico USB (funciona bien para codigo de barras 1D)

### Cajones de Dinero

| Proveedor | Modelo | Precio Aprox | Donde comprar |
|-----------|--------|--------------|---------------|
| Generico | 410x420mm | S/ 100-150 | Mercado Libre |
| Maken | MK-410 | S/ 200-250 | Importadores |

### Kit POS Completo (Economico)

```
Presupuesto minimo: S/ 300-400
├── Impresora Xprinter XP-58 (58mm): S/ 80-100
├── Lector codigo barras generico: S/ 40-60
├── Cajon de dinero generico: S/ 100-150
└── Rollo papel termico (10 unidades): S/ 20-30

Presupuesto recomendado: S/ 600-800
├── Impresora Xprinter XP-80C (80mm): S/ 150-200
├── Lector Honeywell o Symbol: S/ 150-200
├── Cajon de dinero Maken: S/ 200-250
└── Rollo papel termico (20 unidades): S/ 40-50
```

### Tiendas en Lima

1. **Mercado Libre Peru** - mercadolibre.com.pe
2. **Linio Peru** - linio.com.pe
3. **Plaza Norte / Mega Plaza** - Tiendas de computacion
4. **Wilson / Paruro** - Centro de Lima (precios mas bajos)
5. **Importadores directos**:
   - Deltron: deltron.com.pe
   - Intcomex: intcomex.com.pe

---

## PUERTOS Y SERVICIOS

| Servicio | Puerto | Descripcion |
|----------|--------|-------------|
| Frontend (NextJS) | 3000 | Aplicacion web |
| Backend (NestJS) | 4000 | API REST |
| PostgreSQL | 5435 | Base de datos (mapeado desde 5432) |
| Redis | 6379 | Cache |
| pgAdmin | 5050 | Admin BD (dev, profile: tools) |
| Redis Commander | 8081 | Admin Redis (dev, profile: tools) |

---

## CHECKLIST ANTES DE CREAR CODIGO

```
□ Revise 03-BASE-DATOS-COMPLETA.md para verificar los campos
□ Revise 06-API-ENDPOINTS.md para verificar la estructura del endpoint
□ Los DTOs coinciden con los campos de la tabla
□ Las entidades tienen TODOS los campos de la tabla
□ El frontend usa los mismos nombres de campos que el backend
□ No estoy ejecutando build, solo dev
```

---

## REFERENCIAS CRUZADAS

Cuando crees un archivo, SIEMPRE referencia los archivos relacionados:

```typescript
/**
 * @file productos.controller.ts
 * @description Controlador de productos
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - DTOs: ver src/modules/productos/dto/
 * - Entidades: ver src/modules/productos/entities/
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md
 */
```
