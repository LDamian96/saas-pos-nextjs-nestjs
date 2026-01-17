# 🔐 ROLES, PERMISOS Y RBAC

## Resumen Ejecutivo

Sistema de control de acceso basado en roles (RBAC) que permite:
- **Roles del sistema**: Pre-definidos, no editables
- **Roles personalizados**: Creados por el admin de cada empresa
- **Permisos granulares**: Por módulo y acción
- **Permisos especiales**: Override por usuario (descuentos, anulaciones)
- **Gestión dinámica**: Admin puede ascender/degradar empleados

---

## 📊 ROLES DEL SISTEMA (Pre-definidos)

| Rol | Código | Nivel | Descripción |
|-----|--------|-------|-------------|
| **Super Admin** | `super_admin` | 100 | Control total del SaaS (solo Anthropic/dueño) |
| **Administrador** | `admin` | 90 | Dueño de empresa, acceso total a su tenant |
| **Supervisor** | `supervisor` | 70 | Gestiona tienda, reportes, puede anular |
| **Cajero** | `cajero` | 50 | Ventas, caja, consultas básicas |
| **Almacenero** | `almacenero` | 50 | Inventario, entradas, salidas |
| **Vendedor** | `vendedor` | 40 | Solo ventas, sin acceso a caja |

> **Nivel**: Determina jerarquía. Un usuario solo puede gestionar roles de nivel inferior al suyo.

---

## 🏪 ROLES Y MULTI-SUCURSAL

### Tipos de Asignación

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| **Una sucursal** | Usuario trabaja en una sola sucursal | Cajero de "Sucursal Norte" |
| **Múltiples sucursales** | Usuario accede a varias sucursales | Supervisor regional de 3 tiendas |
| **Todas las sucursales** | Acceso completo a todas | Admin de la empresa |

### Supervisor Regional (Multi-Sucursal)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPERVISOR REGIONAL                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Usuario: María García                                          │
│  Rol base: Supervisor (nivel 70)                                │
│                                                                  │
│  Sucursales asignadas:                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ★ Sucursal Norte (Principal)                             │   │
│  │   ├── Ver reportes: ✅                                    │   │
│  │   ├── Gestionar caja: ✅                                  │   │
│  │   ├── Gestionar stock: ✅                                 │   │
│  │   └── Horario: Lun-Vie 8:00-18:00                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Sucursal Sur                                            │   │
│  │   ├── Ver reportes: ✅                                    │   │
│  │   ├── Gestionar caja: ❌                                  │   │
│  │   ├── Gestionar stock: ✅                                 │   │
│  │   └── Horario: Flexible                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Sucursal Centro                                         │   │
│  │   ├── Ver reportes: ✅                                    │   │
│  │   ├── Gestionar caja: ✅                                  │   │
│  │   ├── Gestionar stock: ✅                                 │   │
│  │   └── Horario: Sáb-Dom 9:00-14:00                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cajero Rotativo (Multi-Sucursal)

```sql
-- Cajero que rota entre 2 sucursales según el día
INSERT INTO usuario_sucursales (usuario_id, sucursal_id, es_principal, dias_asignados) VALUES
('uuid-cajero-juan', 'uuid-sucursal-mall', true, ARRAY['lunes', 'martes', 'miercoles']),
('uuid-cajero-juan', 'uuid-sucursal-centro', false, ARRAY['jueves', 'viernes', 'sabado']);
```

### Permisos por Sucursal

Un usuario puede tener **permisos diferentes** en cada sucursal:

```typescript
// María es supervisor en Sucursal Norte, pero solo puede ver reportes en Sucursal Sur
{
  "usuario": "María García",
  "rol_base": "supervisor",
  "sucursales": [
    {
      "sucursal": "Sucursal Norte",
      "es_principal": true,
      "puede_ver_reportes": true,
      "puede_gestionar_caja": true,     // ✅ Puede abrir/cerrar caja
      "puede_gestionar_stock": true
    },
    {
      "sucursal": "Sucursal Sur",
      "es_principal": false,
      "puede_ver_reportes": true,
      "puede_gestionar_caja": false,    // ❌ Solo supervisión, no caja
      "puede_gestionar_stock": true
    }
  ]
}
```

### Cómo Asignar Multi-Sucursal (Admin)

```
┌─────────────────────────────────────────────────────────────────┐
│  Configuración → Usuarios → María García → [Editar]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Sucursales Asignadas                              [+ Agregar]   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ★ Sucursal Norte                              [Editar] ✕ │   │
│  │   Permisos: Reportes ✓ | Caja ✓ | Stock ✓               │   │
│  │   Días: Lun-Vie | Horario: 8:00-18:00                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Sucursal Sur                                 [Editar] ✕ │   │
│  │   Permisos: Reportes ✓ | Caja ✗ | Stock ✓               │   │
│  │   Días: Flexible | Horario: -                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                              [Guardar Cambios]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 MATRIZ DE PERMISOS POR ROL

### Leyenda
- ✅ = Permitido
- ❌ = Denegado
- 🔸 = Parcial (con restricciones)

### Módulo: PRODUCTOS

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `productos.ver` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `productos.crear` | ✅ | ✅ | ✅ | ❌ | 🔸 | ❌ |
| `productos.editar` | ✅ | ✅ | ✅ | ❌ | 🔸 | ❌ |
| `productos.eliminar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `productos.ver_costos` | ✅ | ✅ | 🔸 | ❌ | ✅ | ❌ |
| `productos.importar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `productos.exportar` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

> 🔸 **Almacenero**: Solo puede crear/editar productos si el admin lo habilita específicamente

### Módulo: INVENTARIO

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `inventario.ver` | ✅ | ✅ | ✅ | 🔸 | ✅ | ❌ |
| `inventario.entrada` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `inventario.salida` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `inventario.ajuste` | ✅ | ✅ | 🔸 | ❌ | 🔸 | ❌ |
| `inventario.transferir` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

> 🔸 **Cajero**: Solo ve stock de productos (para informar disponibilidad)
> 🔸 **Supervisor/Almacenero**: Ajustes requieren aprobación si superan X cantidad

### Módulo: VENTAS

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `ventas.crear` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `ventas.ver` | ✅ | ✅ | ✅ | 🔸 | ❌ | 🔸 |
| `ventas.ver_todas` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `ventas.anular` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `ventas.descuento` | ✅ | ✅ | ✅ | 🔸 | ❌ | 🔸 |
| `ventas.descuento_maximo` | 100% | 100% | 50% | 10% | 0% | 5% |

> 🔸 **Cajero/Vendedor**: Solo ven sus propias ventas del día
> 🔸 **Descuento**: Limitado por `descuento_maximo` del rol o usuario

### Módulo: CAJA

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `caja.ver` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `caja.apertura` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `caja.cierre` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `caja.movimientos` | ✅ | ✅ | ✅ | 🔸 | ❌ | ❌ |
| `caja.retiro` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `caja.arqueo` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> 🔸 **Cajero**: Solo puede hacer ingresos, no retiros

### Módulo: CLIENTES

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `clientes.ver` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `clientes.crear` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `clientes.editar` | ✅ | ✅ | ✅ | 🔸 | ❌ | 🔸 |
| `clientes.eliminar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `clientes.credito` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> 🔸 **Cajero/Vendedor**: Solo pueden editar teléfono y dirección

### Módulo: REPORTES

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `reportes.ventas` | ✅ | ✅ | ✅ | 🔸 | ❌ | ❌ |
| `reportes.inventario` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `reportes.financiero` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reportes.exportar` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

> 🔸 **Cajero**: Solo resumen de su caja/turno

### Módulo: CONFIGURACIÓN

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `config.empresa` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.sucursales` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.usuarios` | ✅ | ✅ | 🔸 | ❌ | ❌ | ❌ |
| `config.roles` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.impresion` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `config.metodos_pago` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.seo` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.integraciones` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `config.billing` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> 🔸 **Supervisor**: Solo puede ver usuarios, no crear ni editar roles

### Módulo: PROMOCIONES

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `promociones.ver` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `promociones.crear` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `promociones.editar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `promociones.eliminar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Módulo: FACTURACIÓN ELECTRÓNICA (Addon)

| Permiso | Super Admin | Admin | Supervisor | Cajero | Almacenero | Vendedor |
|---------|:-----------:|:-----:|:----------:|:------:|:----------:|:--------:|
| `facturacion.emitir` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `facturacion.anular` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `facturacion.config` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `facturacion.reportes` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 👤 GESTIÓN DE USUARIOS POR ADMIN

### Acciones del Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  EL ADMIN PUEDE:                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Crear usuarios con cualquier rol (excepto super_admin)      │
│  ✅ Cambiar el rol de un usuario (ascender/degradar)            │
│  ✅ Asignar permisos especiales (override de rol)               │
│  ✅ Desactivar usuarios                                          │
│  ✅ Asignar usuarios a sucursales específicas                   │
│  ✅ Establecer límites de descuento por usuario                 │
│  ✅ Permitir/denegar anulación de ventas                        │
│  ✅ Crear roles personalizados para su empresa                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ascenso de Empleados

```typescript
// Ejemplo: Ascender cajero a supervisor
PUT /api/v1/usuarios/:id/rol

// Request
{
  "rolId": "uuid-del-rol-supervisor",
  "motivo": "Promoción por buen desempeño"  // Log de auditoría
}

// Response
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "rolAnterior": "cajero",
      "rolNuevo": "supervisor"
    }
  },
  "message": "Usuario ascendido correctamente"
}
```

### Permisos Especiales por Usuario

```typescript
// Dar permiso especial a un cajero de confianza
PUT /api/v1/usuarios/:id/permisos-especiales

// Request
{
  "descuentoMaximo": 20,           // Puede dar hasta 20% (rol tiene 10%)
  "puedeAnularVenta": true,        // Override: puede anular
  "puedeVerCostos": false,
  "permisosExtra": [
    "inventario.ver",              // Agregar permiso no incluido en rol
    "reportes.ventas"
  ]
}
```

---

## 🔄 ROLES PERSONALIZADOS

El admin puede crear roles específicos para su empresa:

```typescript
// Crear rol personalizado
POST /api/v1/roles

// Request
{
  "codigo": "encargado_turno",
  "nombre": "Encargado de Turno",
  "descripcion": "Cajero con permisos de supervisor parcial",
  "nivel": 60,  // Entre cajero (50) y supervisor (70)
  "permisos": [
    "productos.ver",
    "productos.crear",      // Puede crear productos
    "ventas.crear",
    "ventas.ver",
    "ventas.ver_todas",     // Ve todas las ventas
    "ventas.descuento",
    "caja.apertura",
    "caja.cierre",
    "caja.movimientos",
    "clientes.ver",
    "clientes.crear",
    "reportes.ventas"       // Puede ver reportes
  ],
  "configuracion": {
    "descuentoMaximo": 25,
    "puedeAnularVenta": false  // No puede anular
  }
}
```

---

## 🛡️ REGLAS DE SEGURIDAD

### Jerarquía de Niveles

```
┌────────────────────────────────────────────────────┐
│  REGLA: Solo puedes gestionar niveles inferiores   │
├────────────────────────────────────────────────────┤
│  Super Admin (100) → Puede gestionar todos         │
│  Admin (90)        → Gestiona 89 hacia abajo       │
│  Supervisor (70)   → Gestiona 69 hacia abajo       │
│  Cajero (50)       → No puede gestionar usuarios   │
└────────────────────────────────────────────────────┘
```

### Validaciones

```typescript
// El backend SIEMPRE valida:
1. Usuario tiene permiso para la acción
2. Usuario tiene nivel suficiente (jerarquía)
3. Usuario pertenece a la misma empresa (tenant)
4. Usuario tiene acceso a la sucursal (si aplica)
5. Permisos especiales no exceden los del rol
```

---

## 📱 UI - Panel de Gestión de Usuarios

### Vista del Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  Usuarios de Mi Empresa                        [+ Nuevo Usuario]│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                    │
│  │  Avatar │  Juan Pérez                                        │
│  │   JP    │  cajero@empresa.com                                │
│  └─────────┘  Rol: Cajero  │  Sucursal: Principal              │
│               Estado: ● Activo                                  │
│               [Editar] [Cambiar Rol ▼] [Permisos] [Desactivar] │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                    │
│  │  Avatar │  María García                                      │
│  │   MG    │  supervisor@empresa.com                            │
│  └─────────┘  Rol: Supervisor  │  Sucursal: Todas              │
│               Estado: ● Activo                                  │
│               [Editar] [Cambiar Rol ▼] [Permisos] [Desactivar] │
└─────────────────────────────────────────────────────────────────┘
```

### Modal: Cambiar Rol

```
┌─────────────────────────────────────────────┐
│  Cambiar Rol de Juan Pérez                  │
├─────────────────────────────────────────────┤
│  Rol Actual: Cajero                         │
│                                             │
│  Nuevo Rol:                                 │
│  ○ Vendedor (nivel 40)                      │
│  ○ Cajero (nivel 50) ← actual               │
│  ○ Almacenero (nivel 50)                    │
│  ● Supervisor (nivel 70) ← ascenso          │
│  ○ Encargado Turno (nivel 60) - custom      │
│                                             │
│  Motivo del cambio:                         │
│  ┌─────────────────────────────────────┐    │
│  │ Promoción por excelente desempeño  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [Cancelar]              [Guardar Cambios]  │
└─────────────────────────────────────────────┘
```

---

## 📊 ENDPOINTS DE GESTIÓN DE ROLES

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/roles` | Listar roles disponibles | `config.usuarios` |
| POST | `/roles` | Crear rol personalizado | `config.roles` |
| PUT | `/roles/:id` | Editar rol personalizado | `config.roles` |
| DELETE | `/roles/:id` | Eliminar rol personalizado | `config.roles` |
| GET | `/permisos` | Listar todos los permisos | `config.roles` |
| PUT | `/usuarios/:id/rol` | Cambiar rol de usuario | `config.usuarios` |
| PUT | `/usuarios/:id/permisos-especiales` | Asignar permisos extra | `config.usuarios` |
| GET | `/usuarios/:id/permisos` | Ver permisos efectivos | `config.usuarios` |

---

## 🔍 AUDITORÍA DE CAMBIOS

Todos los cambios de roles se registran:

```sql
CREATE TABLE auditoria_roles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id        UUID NOT NULL REFERENCES empresas(id),
    usuario_id        UUID NOT NULL REFERENCES usuarios(id),

    -- Acción
    accion            VARCHAR(30) NOT NULL,  -- 'cambio_rol', 'permiso_especial', 'crear', 'desactivar'

    -- Datos
    rol_anterior_id   UUID,
    rol_nuevo_id      UUID,
    datos_anteriores  JSONB,
    datos_nuevos      JSONB,
    motivo            TEXT,

    -- Quién hizo el cambio
    realizado_por     UUID NOT NULL REFERENCES usuarios(id),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    ip_address        VARCHAR(45)
);
```

---

## 📋 SEED DE PERMISOS COMPLETO

```typescript
// Lista completa de permisos del sistema
const permisos = [
  // Productos
  { codigo: 'productos.ver', nombre: 'Ver productos', modulo: 'productos' },
  { codigo: 'productos.crear', nombre: 'Crear productos', modulo: 'productos' },
  { codigo: 'productos.editar', nombre: 'Editar productos', modulo: 'productos' },
  { codigo: 'productos.eliminar', nombre: 'Eliminar productos', modulo: 'productos' },
  { codigo: 'productos.ver_costos', nombre: 'Ver costos', modulo: 'productos' },
  { codigo: 'productos.importar', nombre: 'Importar productos', modulo: 'productos' },
  { codigo: 'productos.exportar', nombre: 'Exportar productos', modulo: 'productos' },

  // Inventario
  { codigo: 'inventario.ver', nombre: 'Ver inventario', modulo: 'inventario' },
  { codigo: 'inventario.entrada', nombre: 'Registrar entradas', modulo: 'inventario' },
  { codigo: 'inventario.salida', nombre: 'Registrar salidas', modulo: 'inventario' },
  { codigo: 'inventario.ajuste', nombre: 'Ajustar stock', modulo: 'inventario' },
  { codigo: 'inventario.transferir', nombre: 'Transferir stock', modulo: 'inventario' },

  // Ventas
  { codigo: 'ventas.crear', nombre: 'Crear ventas', modulo: 'ventas' },
  { codigo: 'ventas.ver', nombre: 'Ver mis ventas', modulo: 'ventas' },
  { codigo: 'ventas.ver_todas', nombre: 'Ver todas las ventas', modulo: 'ventas' },
  { codigo: 'ventas.anular', nombre: 'Anular ventas', modulo: 'ventas' },
  { codigo: 'ventas.descuento', nombre: 'Aplicar descuentos', modulo: 'ventas' },

  // Caja
  { codigo: 'caja.ver', nombre: 'Ver estado caja', modulo: 'caja' },
  { codigo: 'caja.apertura', nombre: 'Abrir caja', modulo: 'caja' },
  { codigo: 'caja.cierre', nombre: 'Cerrar caja', modulo: 'caja' },
  { codigo: 'caja.movimientos', nombre: 'Movimientos de caja', modulo: 'caja' },
  { codigo: 'caja.retiro', nombre: 'Retiro de efectivo', modulo: 'caja' },
  { codigo: 'caja.arqueo', nombre: 'Arqueo de caja', modulo: 'caja' },

  // Clientes
  { codigo: 'clientes.ver', nombre: 'Ver clientes', modulo: 'clientes' },
  { codigo: 'clientes.crear', nombre: 'Crear clientes', modulo: 'clientes' },
  { codigo: 'clientes.editar', nombre: 'Editar clientes', modulo: 'clientes' },
  { codigo: 'clientes.eliminar', nombre: 'Eliminar clientes', modulo: 'clientes' },
  { codigo: 'clientes.credito', nombre: 'Gestionar créditos', modulo: 'clientes' },

  // Reportes
  { codigo: 'reportes.ventas', nombre: 'Reportes de ventas', modulo: 'reportes' },
  { codigo: 'reportes.inventario', nombre: 'Reportes de inventario', modulo: 'reportes' },
  { codigo: 'reportes.financiero', nombre: 'Reportes financieros', modulo: 'reportes' },
  { codigo: 'reportes.exportar', nombre: 'Exportar reportes', modulo: 'reportes' },

  // Promociones
  { codigo: 'promociones.ver', nombre: 'Ver promociones', modulo: 'promociones' },
  { codigo: 'promociones.crear', nombre: 'Crear promociones', modulo: 'promociones' },
  { codigo: 'promociones.editar', nombre: 'Editar promociones', modulo: 'promociones' },
  { codigo: 'promociones.eliminar', nombre: 'Eliminar promociones', modulo: 'promociones' },

  // Configuración
  { codigo: 'config.empresa', nombre: 'Configurar empresa', modulo: 'configuracion' },
  { codigo: 'config.sucursales', nombre: 'Gestionar sucursales', modulo: 'configuracion' },
  { codigo: 'config.usuarios', nombre: 'Gestionar usuarios', modulo: 'configuracion' },
  { codigo: 'config.roles', nombre: 'Gestionar roles', modulo: 'configuracion' },
  { codigo: 'config.impresion', nombre: 'Configurar impresión', modulo: 'configuracion' },
  { codigo: 'config.metodos_pago', nombre: 'Métodos de pago', modulo: 'configuracion' },
  { codigo: 'config.seo', nombre: 'Configurar SEO', modulo: 'configuracion' },
  { codigo: 'config.integraciones', nombre: 'Integraciones', modulo: 'configuracion' },
  { codigo: 'config.billing', nombre: 'Facturación SaaS', modulo: 'configuracion' },

  // Facturación electrónica (addon)
  { codigo: 'facturacion.emitir', nombre: 'Emitir comprobantes', modulo: 'facturacion' },
  { codigo: 'facturacion.anular', nombre: 'Anular comprobantes', modulo: 'facturacion' },
  { codigo: 'facturacion.config', nombre: 'Configurar facturación', modulo: 'facturacion' },
  { codigo: 'facturacion.reportes', nombre: 'Reportes SUNAT', modulo: 'facturacion' },

  // Landing/Marketing
  { codigo: 'landing.ver', nombre: 'Ver landing', modulo: 'landing' },
  { codigo: 'landing.editar', nombre: 'Editar landing', modulo: 'landing' },
  { codigo: 'landing.contactos', nombre: 'Ver contactos/leads', modulo: 'landing' },

  // Integraciones
  { codigo: 'integraciones.whatsapp', nombre: 'WhatsApp config', modulo: 'integraciones' },
  { codigo: 'integraciones.agente_ia', nombre: 'Agente IA config', modulo: 'integraciones' },
  { codigo: 'integraciones.ecommerce', nombre: 'E-commerce sync', modulo: 'integraciones' },
];
```

---

## 🎯 RESPUESTAS A TUS PREGUNTAS

### ¿Un empleado puede agregar productos?
- **Cajero**: NO, solo vende
- **Vendedor**: NO, solo vende
- **Almacenero**: SÍ, si el admin lo habilita
- **Supervisor**: SÍ, puede crear y editar
- **Admin**: SÍ, control total

### ¿El admin puede ascender empleados?
**SÍ**, el admin puede:
1. Cambiar el rol de cualquier usuario
2. Crear roles personalizados
3. Asignar permisos especiales (override)
4. Establecer límites de descuento individuales

### Ejemplo práctico:
```
Juan es cajero → Admin lo asciende a supervisor
- Ahora Juan puede ver reportes
- Puede anular ventas
- Puede dar descuentos hasta 50%
- Puede gestionar inventario
```

---

## 👑 SUPER ADMIN - CONTROL TOTAL DEL SAAS

> El **Super Admin** (tú, dueño del SaaS) tiene control total sobre TODOS los tenants/clientes.

### Características del Super Admin

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN                              │
│                    (Dueño del SaaS - Nivel 100)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Ver TODAS las empresas (tenants)                            │
│  ✅ Acceder a CUALQUIER empresa como si fuera admin             │
│  ✅ Ver métricas globales (MRR, churn, usuarios activos)        │
│  ✅ Gestionar planes y precios                                  │
│  ✅ Activar/desactivar addons manualmente                       │
│  ✅ Suspender empresas morosas                                  │
│  ✅ Eliminar empresas (con confirmación)                        │
│  ✅ Ver auditoría de TODAS las empresas                         │
│  ✅ Soporte: Impersonar usuarios (login as)                     │
│  ✅ Configurar webhooks globales                                │
│  ✅ Ver logs de errores de todo el sistema                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Panel Super Admin - Rutas

| Ruta | Descripción |
|------|-------------|
| `/super-admin` | Dashboard global (MRR, empresas, usuarios) |
| `/super-admin/empresas` | Lista de todas las empresas |
| `/super-admin/empresas/:id` | Detalle de empresa + "Login As" |
| `/super-admin/billing` | Ingresos, pagos, morosos |
| `/super-admin/planes` | Gestionar planes y precios |
| `/super-admin/addons` | Gestionar addons |
| `/super-admin/auditoria` | Log de acciones global |
| `/super-admin/errores` | Logs de errores del sistema |
| `/super-admin/metricas` | Analytics del SaaS |

### Impersonar Usuario (Login As)

```typescript
// El Super Admin puede "entrar" a cualquier empresa
// para dar soporte sin pedir credenciales

POST /super-admin/impersonate
{
  "empresa_id": "uuid-empresa-cliente",
  "usuario_id": "uuid-usuario-admin-empresa", // Opcional, default = admin
  "motivo": "Soporte ticket #1234"
}

// Response: Token temporal (1 hora) para esa empresa
{
  "token": "jwt-temporal-impersonar",
  "expira": "2025-01-11T15:00:00Z",
  "empresa": "Farmacia San Juan",
  "warning": "Todas las acciones quedan registradas en auditoría"
}
```

### Auditoría de Super Admin

```sql
-- Todas las acciones del super admin se registran
INSERT INTO auditoria_acciones (
  empresa_id,      -- NULL o empresa afectada
  usuario_id,      -- Super admin
  modulo,
  accion,
  descripcion
) VALUES (
  'uuid-empresa-cliente',
  'uuid-super-admin',
  'empresas',
  'impersonate',
  'Super admin accedió como admin de Farmacia San Juan - Ticket #1234'
);
```

### Métricas del Super Admin Dashboard

```typescript
// GET /super-admin/metricas
{
  "mrr": 15250.00,                    // Monthly Recurring Revenue
  "arr": 183000.00,                   // Annual Recurring Revenue
  "empresas_activas": 342,
  "empresas_trial": 45,
  "empresas_suspendidas": 3,
  "usuarios_totales": 1250,
  "usuarios_activos_hoy": 189,
  "churn_mensual": 2.3,               // % de cancelaciones
  "ltv_promedio": 450.00,             // Lifetime Value
  "addons_populares": [
    { "addon": "facturacion", "cantidad": 120, "mrr": 600 },
    { "addon": "woocommerce", "cantidad": 45, "mrr": 360 },
    { "addon": "agente_ia", "cantidad": 89, "mrr": 178 }
  ],
  "planes_distribucion": {
    "trial": 45,
    "basico": 180,
    "emprendedor": 95,
    "profesional": 22
  }
}
```

### Diferencias: Admin vs Super Admin

| Función | Admin (Empresa) | Super Admin (SaaS) |
|---------|-----------------|-------------------|
| Ver su empresa | ✅ | ✅ |
| Ver OTRAS empresas | ❌ | ✅ |
| Gestionar usuarios propios | ✅ | ✅ |
| Gestionar usuarios de OTROS | ❌ | ✅ |
| Cambiar plan | ✅ (paga) | ✅ (gratis) |
| Suspender empresa | ❌ | ✅ |
| Ver auditoría propia | ✅ | ✅ |
| Ver auditoría GLOBAL | ❌ | ✅ |
| Impersonar usuarios | ❌ | ✅ |
| Ver métricas SaaS | ❌ | ✅ |
| Configurar precios | ❌ | ✅ |

---

## 📊 AUDITORÍA PARA EL ADMIN

El admin de cada empresa puede ver auditoría de **SU empresa**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Configuración → Auditoría                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtros: [Usuario ▼] [Módulo ▼] [Acción ▼] [Fecha ▼]          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 10:45 | María García | productos | crear                 │   │
│  │        Creó producto "Camiseta Básica" (CAM-001)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 10:30 | Juan Pérez | caja | abrir_caja                   │   │
│  │        Abrió caja con S/ 500.00 - Sucursal Norte         │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 09:15 | Carlos López | ventas | anular                   │   │
│  │        Anuló venta #V-001234 por S/ 150.00               │   │
│  │        Motivo: Cliente solicitó devolución               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Exportar a Excel]                    Mostrando 1-50 de 1,234   │
└─────────────────────────────────────────────────────────────────┘
```

### Endpoints Auditoría

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/auditoria` | Listar acciones de MI empresa | `config.auditoria` |
| GET | `/auditoria/:id` | Ver detalle de acción | `config.auditoria` |
| GET | `/auditoria/exportar` | Exportar a Excel | `config.auditoria` |
| GET | `/super-admin/auditoria` | Auditoría GLOBAL | Super Admin |
