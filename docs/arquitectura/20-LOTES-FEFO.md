# Control de Lotes y FEFO (First Expired, First Out)

## Descripcion General

El sistema implementa control de lotes con FEFO para negocios que manejan productos con fecha de vencimiento:
- Farmacias
- Tiendas de alimentos
- Distribuidoras
- Cualquier negocio con productos perecederos

---

## Tabla Principal: lotes

```sql
CREATE TABLE lotes (
    id                      UUID PRIMARY KEY,
    empresa_id              UUID NOT NULL,
    variante_id             UUID NOT NULL,
    sucursal_id             UUID NOT NULL,
    codigo_lote             VARCHAR(50) NOT NULL,      -- LOT-2024-001
    fecha_vencimiento       DATE,                      -- NULL si no vence
    fecha_fabricacion       DATE,
    fecha_ingreso           DATE DEFAULT CURRENT_DATE,
    stock                   INTEGER DEFAULT 0,
    stock_inicial           INTEGER DEFAULT 0,
    costo_unitario          DECIMAL(12,2),
    estado                  VARCHAR(20) DEFAULT 'activo',
    notas                   TEXT,
    created_at              TIMESTAMP,
    updated_at              TIMESTAMP,
    created_by              UUID
);
```

### Estados del Lote
| Estado | Descripcion |
|--------|-------------|
| activo | Lote disponible para venta |
| agotado | Stock = 0 |
| vencido | fecha_vencimiento < hoy |
| bloqueado | Bloqueado manualmente (ej: recall) |

---

## Relacion con Ventas

Cada detalle de venta registra el lote del cual se desconto:

```sql
-- venta_detalles incluye lote_id
INSERT INTO venta_detalles (venta_id, variante_id, lote_id, cantidad, ...)
VALUES ('venta-001', 'var-001', 'lote-001', 5, ...);
```

Esto permite:
- Trazabilidad completa
- Imprimir lote en ticket/factura
- Atender reclamos con informacion exacta

---

## Flujo FEFO en el POS

### 1. Ingreso de Mercaderia (Compra)

```
Usuario ingresa compra:
  - Producto: Paracetamol 500mg
  - Cantidad: 100
  - Lote: LOT-2024-A
  - Vencimiento: 15/01/2026
  - Costo: S/. 8.00

Sistema crea:
  1. Registro en tabla `lotes`
  2. Actualiza `stock_sucursal` (total)
```

### 2. Venta con Sugerencia FEFO

```
Cajero escanea producto:
  1. Sistema busca lotes ordenados por fecha_vencimiento ASC
  2. Muestra sugerencia: "Vender del Lote LOT-2024-A (vence en 3 dias)"
  3. Cajero acepta o cambia lote
  4. Al confirmar:
     - venta_detalles.lote_id = lote seleccionado
     - lote.stock -= cantidad
     - stock_sucursal.stock -= cantidad
```

### 3. Ticket con Trazabilidad

```
BOLETA DE VENTA B001-00001
----------------------------
3 x Paracetamol 500mg    S/. 45.00
    Lote: LOT-2024-A
    Vence: 15/01/2026
----------------------------
```

---

## Queries Importantes

### Obtener lotes ordenados por FEFO

```sql
SELECT
  l.id,
  l.codigo_lote,
  l.stock,
  l.fecha_vencimiento,
  l.fecha_vencimiento - CURRENT_DATE as dias_restantes
FROM lotes l
WHERE l.variante_id = $1
  AND l.sucursal_id = $2
  AND l.estado = 'activo'
  AND l.stock > 0
ORDER BY l.fecha_vencimiento ASC NULLS LAST;
```

### Productos proximos a vencer (Dashboard)

```sql
SELECT
  p.nombre as producto,
  l.codigo_lote,
  l.stock,
  l.fecha_vencimiento,
  l.fecha_vencimiento - CURRENT_DATE as dias_restantes
FROM lotes l
JOIN variantes v ON v.id = l.variante_id
JOIN productos p ON p.id = v.producto_id
WHERE l.empresa_id = $1
  AND l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND l.estado = 'activo'
  AND l.stock > 0
ORDER BY l.fecha_vencimiento ASC;
```

### Marcar lotes vencidos (Job diario)

```sql
UPDATE lotes
SET estado = 'vencido', updated_at = NOW()
WHERE fecha_vencimiento < CURRENT_DATE
  AND estado = 'activo';
```

### Trazabilidad de venta

```sql
SELECT
  v.numero_venta,
  v.created_at as fecha_venta,
  p.nombre as producto,
  vd.cantidad,
  l.codigo_lote,
  l.fecha_vencimiento
FROM venta_detalles vd
JOIN ventas v ON v.id = vd.venta_id
JOIN variantes var ON var.id = vd.variante_id
JOIN productos p ON p.id = var.producto_id
LEFT JOIN lotes l ON l.id = vd.lote_id
WHERE v.id = $1;
```

---

## Endpoints API

### Lotes

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/v1/lotes | Listar lotes con filtros |
| GET | /api/v1/lotes/:id | Obtener lote por ID |
| POST | /api/v1/lotes | Crear nuevo lote |
| PATCH | /api/v1/lotes/:id | Actualizar lote |
| GET | /api/v1/lotes/proximos-vencer | Lotes proximos a vencer |
| GET | /api/v1/lotes/vencidos | Lotes vencidos |
| POST | /api/v1/lotes/:id/bloquear | Bloquear lote |

### Filtros disponibles

```
GET /api/v1/lotes?varianteId=xxx&sucursalId=xxx&estado=activo&diasVencimiento=30
```

---

## Frontend - Componentes

### Dashboard Alertas

```
/dashboard
  - Widget: Productos por vencer (7 dias)
  - Widget: Productos vencidos
  - Accion rapida: Crear promocion para vencer
```

### Inventario con Lotes

```
/inventario/productos/:id
  - Tab: Stock Total
  - Tab: Detalle por Lotes
    - Tabla: Lote | Stock | Vencimiento | Estado
    - Acciones: Bloquear, Ajustar, Ver movimientos
```

### POS con FEFO

```
/pos
  - Al agregar producto:
    - Modal sugerencia FEFO
    - Opcion cambiar lote
  - En carrito:
    - Muestra lote seleccionado
    - Alerta visual si proximo a vencer
```

---

## Consideraciones UX

```
REGLA: Si el usuario NO necesita lotes, no lo molestamos

1. Lotes es OPCIONAL
   - Productos sin lotes funcionan normal
   - lote_id en venta_detalles puede ser NULL

2. Sugerencia NO bloqueante
   - Sistema sugiere lote FEFO
   - Usuario puede ignorar o cambiar

3. Alertas claras y simples
   - "Este producto vence en 3 dias"
   - NO: "Warning: fecha_vencimiento < threshold"

4. Colores intuitivos
   - Verde: OK (> 30 dias)
   - Amarillo: Atencion (7-30 dias)
   - Rojo: Urgente (< 7 dias o vencido)
```

---

## Referencias

- Schema Prisma: `backend/prisma/schema.prisma` → model Lote
- Documentacion BD: `docs/arquitectura/03-BASE-DATOS-COMPLETA.md` → TABLA: lotes
- UX Guidelines: `docs/arquitectura/19-UX-UI-GUIDELINES.md`
