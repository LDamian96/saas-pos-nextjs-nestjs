# UX/UI GUIDELINES - Simplicidad Extrema

## Filosofía de Diseño

> **"Si un niño de 10 años no puede usarlo en 5 segundos, está mal diseñado"**

---

## LA UI DEBE SER OBVIA - EJEMPLOS VISUALES

### Login - Sin complicaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         🛒 MiTienda                             │
│                                                                  │
│                    Bienvenido de vuelta                         │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │  📧  tucorreo@ejemplo.com               │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │  🔒  ••••••••••                         │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │                                         │             │
│         │           ENTRAR                        │  ← GRANDE   │
│         │                                         │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│                  ¿Olvidaste tu contraseña?                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Solo 2 campos + 1 botón grande. NADA MÁS.
```

### Dashboard - Lo importante visible

```
┌─────────────────────────────────────────────────────────────────┐
│  🛒 MiTienda              Hola, Juan        [🔔] [👤]           │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  📊 Inicio   │   Buenos días, Juan 👋                           │
│              │                                                   │
│  🛒 Vender   │   ┌──────────────────────────────────────────┐   │
│     ← AQUÍ   │   │                                          │   │
│  📦 Productos│   │   💰 VENTAS DE HOY                       │   │
│              │   │                                          │   │
│  📋 Inventario│  │        S/ 1,250.00                       │   │
│              │   │        ↑ 15% vs ayer                     │   │
│  👥 Clientes │   │                                          │   │
│              │   └──────────────────────────────────────────┘   │
│  📈 Reportes │                                                   │
│              │   ┌─────────────┐  ┌─────────────┐               │
│  ⚙️ Config   │   │ 🛒 23       │  │ 📦 5        │               │
│              │   │ Ventas hoy  │  │ Stock bajo  │               │
│              │   └─────────────┘  └─────────────┘               │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘

- Menú con ICONOS + TEXTO (no solo iconos)
- Número grande de ventas (lo más importante)
- Alertas visibles (stock bajo)
```

### Punto de Venta (POS) - ULTRA SIMPLE

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   🔍 Buscar producto o escanear código...                       │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                  │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │                              │
│   PRODUCTOS                       │   🛒 CARRITO                │
│                                   │                              │
│   [Todas] [Ropa] [Zapatos]       │   ┌────────────────────────┐ │
│                                   │   │ Camiseta Azul      x2 │ │
│   ┌─────────┐  ┌─────────┐       │   │ S/ 50.00       [-][+] │ │
│   │  👕     │  │  👟     │       │   └────────────────────────┘ │
│   │         │  │         │       │                              │
│   │ S/25.00 │  │ S/80.00 │       │   ┌────────────────────────┐ │
│   │Camiseta │  │ Zapato  │       │   │ Pantalón         x1   │ │
│   │  [+]    │  │  [+]    │       │   │ S/ 60.00       [-][+] │ │
│   └─────────┘  └─────────┘       │   └────────────────────────┘ │
│                                   │                              │
│   ┌─────────┐  ┌─────────┐       │   ──────────────────────────│
│   │  👜     │  │  🧢     │       │                              │
│   │         │  │         │       │   Subtotal:      S/ 110.00  │
│   │ S/45.00 │  │ S/20.00 │       │   Descuento:        S/ 0.00 │
│   │ Bolso   │  │ Gorra   │       │   ════════════════════════  │
│   │  [+]    │  │  [+]    │       │   TOTAL:         S/ 110.00  │
│   └─────────┘  └─────────┘       │                              │
│                                   │   ┌────────────────────────┐ │
│                                   │   │                        │ │
│                                   │   │   💰 COBRAR S/110     │ │
│                                   │   │                        │ │
│                                   │   └────────────────────────┘ │
│                                   │         ↑ BOTÓN ENORME      │
└───────────────────────────────────┴─────────────────────────────┘

FLUJO:
1. Click en producto → Se agrega al carrito
2. Click en COBRAR → Se abre modal de pago
3. Listo!
```

### Modal de Cobro - Súper claro

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                        💰 COBRAR                                │
│                                                                  │
│                     Total: S/ 110.00                            │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   ¿Cómo paga el cliente?                                │   │
│   │                                                          │   │
│   │   ┌───────────────┐  ┌───────────────┐                  │   │
│   │   │               │  │               │                  │   │
│   │   │   💵 EFECTIVO │  │   💳 TARJETA  │                  │   │
│   │   │               │  │               │                  │   │
│   │   └───────────────┘  └───────────────┘                  │   │
│   │                                                          │   │
│   │   ┌───────────────┐  ┌───────────────┐                  │   │
│   │   │               │  │               │                  │   │
│   │   │   📱 YAPE     │  │   📱 PLIN     │                  │   │
│   │   │               │  │               │                  │   │
│   │   └───────────────┘  └───────────────┘                  │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Si es EFECTIVO:                                               │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Cliente paga con: S/ [    200    ]                     │   │
│   │                                                          │   │
│   │  Vuelto: S/ 90.00                                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│              [Cancelar]        [✓ CONFIRMAR VENTA]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

- Botones GRANDES para cada método de pago
- Cálculo automático del vuelto
- Solo 2 opciones finales: Cancelar o Confirmar
```

### Crear Producto - Formulario Simple

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ← Volver                    Nuevo Producto                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📷 [Click para subir foto]                                    │
│      ┌─────────────┐                                            │
│      │             │                                            │
│      │    + 📷     │                                            │
│      │             │                                            │
│      └─────────────┘                                            │
│                                                                  │
│   Nombre del producto *                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Ej: Camiseta deportiva azul                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Precio de venta *                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  S/  25.00                                              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Categoría                                                     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Seleccionar categoría...                           ▼   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Stock inicial                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  10                                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │              ✓ GUARDAR PRODUCTO                         │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

- Solo campos ESENCIALES (nombre, precio, categoría, stock)
- Ejemplos en los placeholders
- Botón grande al final
- Campos opcionales ocultos en "Más opciones" (colapsado)
```

### Lista de Productos - Acciones claras

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Productos                                    [+ Nuevo Producto]│
│                                                                  │
│  🔍 Buscar...                    [Categoría ▼] [Estado ▼]      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👕  Camiseta Azul             S/ 25.00    Stock: 15     │  │
│  │      Categoría: Ropa           ● Activo                   │  │
│  │                                         [✏️ Editar]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👟  Zapato Deportivo          S/ 120.00   Stock: 8      │  │
│  │      Categoría: Calzado        ● Activo                   │  │
│  │                                         [✏️ Editar]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👜  Bolso de Cuero            S/ 85.00    Stock: 3      │  │
│  │      Categoría: Accesorios     ⚠️ Stock bajo             │  │
│  │                                         [✏️ Editar]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    [◀ Anterior]  1 2 3  [Siguiente ▶]           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

- Cards grandes, fáciles de leer
- Información más importante visible (nombre, precio, stock)
- Estado con color (verde=activo, amarillo=stock bajo)
- Una sola acción visible (Editar)
```

### Mensaje de Éxito - Celebrar la acción

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          ✅                                     │
│                                                                  │
│                   ¡Venta completada!                            │
│                                                                  │
│                     S/ 110.00                                   │
│                                                                  │
│              Venta #0045 - 11 Ene 2025                          │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │         🖨️ Imprimir Boleta             │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │         📱 Enviar por WhatsApp          │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│                  [Nueva Venta]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

- Icono grande de éxito
- Resumen claro
- Opciones útiles (imprimir, enviar)
- Botón para continuar vendiendo
```

### Error - Amigable y con solución

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          ❌                                     │
│                                                                  │
│              No hay suficiente stock                            │
│                                                                  │
│     Solo quedan 3 unidades de "Camiseta Azul"                   │
│     pero intentas vender 5.                                     │
│                                                                  │
│         ┌─────────────────────────────────────────┐             │
│         │         Vender solo 3 unidades          │             │
│         └─────────────────────────────────────────┘             │
│                                                                  │
│                     [Volver al carrito]                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

- Explica QUÉ pasó
- Explica POR QUÉ
- Ofrece SOLUCIÓN
- Botón para continuar
```

---

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    PRINCIPIOS FUNDAMENTALES                      │
│                                                                  │
│     1. SIMPLE > Complejo                                        │
│     2. OBVIO > Inteligente                                      │
│     3. FAMILIAR > Innovador                                     │
│     4. RÁPIDO > Bonito                                          │
│     5. ACCESIBLE > Exclusivo                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Regla de los 3 Clics

**Cualquier tarea debe completarse en máximo 3 clics.**

| Tarea | Flujo | Clics |
|-------|-------|-------|
| Vender producto | Buscar → Agregar → Cobrar | 3 |
| Crear producto | Botón Nuevo → Llenar form → Guardar | 3 |
| Ver reporte | Menú Reportes → Seleccionar → Ver | 3 |
| Abrir caja | Botón Abrir → Monto inicial → Confirmar | 3 |
| Anular venta | Buscar venta → Botón Anular → Confirmar | 3 |

---

## Jerarquía Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   TÍTULO DE PÁGINA                              [ + Nuevo ]     │
│   ━━━━━━━━━━━━━━━━━                                             │
│                                                                  │
│   [🔍 Buscar...]  [Categoría ▼]  [Estado ▼]                    │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   📦 Producto 1                              S/ 25.00   │   │
│   │   └─ Categoría: Ropa                         [Editar]   │   │
│   │                                                          │   │
│   │   📦 Producto 2                              S/ 50.00   │   │
│   │   └─ Categoría: Zapatos                      [Editar]   │   │
│   │                                                          │   │
│   │   📦 Producto 3                              S/ 15.00   │   │
│   │   └─ Categoría: Accesorios                   [Editar]   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [◀ Anterior]                              [Siguiente ▶]       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Zonas de Importancia

```
┌─────────────────────────────────────────────────────────────────┐
│  ZONA 1: CRÍTICA                      ZONA 2: IMPORTANTE        │
│  (Esquina superior izquierda)         (Esquina superior derecha)│
│  • Logo                               • Acciones principales    │
│  • Título                             • Botón "+ Nuevo"         │
│  • Navegación                         • Notificaciones          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     ZONA 3: CONTENIDO                           │
│                     (Centro de la pantalla)                     │
│                     • Datos principales                         │
│                     • Tablas/Cards                              │
│                     • Formularios                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ZONA 4: SECUNDARIA                   ZONA 5: ACCIONES          │
│  (Esquina inferior izquierda)         (Esquina inferior derecha)│
│  • Información extra                  • Botones Guardar/Cancelar│
│  • Links secundarios                  • Paginación              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tamaños Obligatorios

### Botones

```tsx
// Botón principal (CTA) - Grande y obvio
<Button size="lg" className="h-12 px-6 text-base font-medium">
  Guardar Producto
</Button>

// Botón secundario - Normal
<Button variant="outline" size="default" className="h-10">
  Cancelar
</Button>

// Botón de tabla - Compacto pero visible
<Button variant="ghost" size="sm" className="h-8 px-3">
  <Edit className="h-4 w-4 mr-2" />
  Editar
</Button>
```

### Touch Targets (Áreas táctiles)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  MÍNIMO 44px x 44px para cualquier elemento clickeable          │
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────┐     │
│  │                  │    │                                │     │
│  │    44px          │    │     Botón con padding          │     │
│  │    mínimo        │    │     interno suficiente         │     │
│  │                  │    │                                │     │
│  └──────────────────┘    └────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Inputs

```tsx
// Input de búsqueda principal - Grande
<Input className="h-12 text-lg" placeholder="Buscar producto..." />

// Input de formulario - Normal
<Input className="h-10" placeholder="Nombre del producto" />

// Select
<Select>
  <SelectTrigger className="h-10 w-full">
    <SelectValue placeholder="Seleccionar categoría" />
  </SelectTrigger>
</Select>
```

---

## Colores con Significado

```
┌─────────────────────────────────────────────────────────────────┐
│                      PALETA SEMÁNTICA                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟢 VERDE (Success/Positive)                                    │
│     • Venta completada                                          │
│     • Producto activo                                           │
│     • Dinero entrante (+)                                       │
│     • Stock suficiente                                          │
│     → bg-green-500, text-green-600                              │
│                                                                  │
│  🔴 ROJO (Error/Danger)                                         │
│     • Error en formulario                                       │
│     • Eliminar elemento                                         │
│     • Stock agotado                                             │
│     • Venta anulada                                             │
│     → bg-red-500, text-red-600, bg-destructive                  │
│                                                                  │
│  🔵 AZUL (Primary/Info)                                         │
│     • Botón principal                                           │
│     • Links                                                     │
│     • Información                                               │
│     • Selección activa                                          │
│     → bg-primary, text-primary                                  │
│                                                                  │
│  🟡 AMARILLO (Warning/Pending)                                  │
│     • Stock bajo                                                │
│     • Pago pendiente                                            │
│     • Requiere atención                                         │
│     → bg-yellow-500, text-yellow-600                            │
│                                                                  │
│  ⚫ GRIS (Disabled/Secondary)                                   │
│     • Elemento deshabilitado                                    │
│     • Texto secundario                                          │
│     • Bordes                                                    │
│     → text-muted-foreground, bg-muted                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Badges de Estado

```tsx
// Activo
<Badge className="bg-green-100 text-green-700 hover:bg-green-100">
  Activo
</Badge>

// Inactivo
<Badge variant="secondary">Inactivo</Badge>

// Stock bajo
<Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
  Stock bajo
</Badge>

// Sin stock
<Badge className="bg-red-100 text-red-700 hover:bg-red-100">
  Agotado
</Badge>

// Pendiente
<Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
  Pendiente
</Badge>
```

---

## Iconos + Texto (SIEMPRE)

```tsx
// ✅ CORRECTO: Icono + Texto
<Button className="gap-2">
  <Plus className="h-4 w-4" />
  Nuevo Producto
</Button>

<Button variant="outline" className="gap-2">
  <Download className="h-4 w-4" />
  Exportar
</Button>

<Button variant="destructive" className="gap-2">
  <Trash2 className="h-4 w-4" />
  Eliminar
</Button>

// ❌ INCORRECTO: Solo icono (confuso)
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>

// ⚠️ EXCEPCIÓN: Solo iconos universales con tooltip
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon" variant="ghost">
        <Search className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Buscar</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Iconos Estándar

| Acción | Icono | Nombre |
|--------|-------|--------|
| Crear/Nuevo | ➕ | `Plus` |
| Editar | ✏️ | `Edit` / `Pencil` |
| Eliminar | 🗑️ | `Trash2` |
| Ver | 👁️ | `Eye` |
| Buscar | 🔍 | `Search` |
| Filtrar | 📊 | `Filter` |
| Exportar | ⬇️ | `Download` |
| Importar | ⬆️ | `Upload` |
| Configurar | ⚙️ | `Settings` |
| Usuario | 👤 | `User` |
| Cerrar | ✕ | `X` |
| Guardar | 💾 | `Save` |
| Imprimir | 🖨️ | `Printer` |
| Dinero | 💵 | `DollarSign` |
| Carrito | 🛒 | `ShoppingCart` |

---

## Estados de Carga

```tsx
// Loading en botón
<Button disabled className="gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  Guardando...
</Button>

// Loading en página
<div className="flex items-center justify-center h-64">
  <div className="text-center">
    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
    <p className="mt-2 text-muted-foreground">Cargando productos...</p>
  </div>
</div>

// Skeleton para tablas
<div className="space-y-3">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>
```

---

## Estados Vacíos

```tsx
// Estado vacío amigable
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <Package className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium">No hay productos</h3>
  <p className="text-muted-foreground mt-1 mb-4 max-w-sm">
    Aún no has agregado ningún producto. Crea tu primer producto para
    comenzar a vender.
  </p>
  <Button className="gap-2">
    <Plus className="h-4 w-4" />
    Crear primer producto
  </Button>
</div>
```

### Estados vacíos por módulo

| Módulo | Mensaje | Acción |
|--------|---------|--------|
| Productos | "No hay productos. Crea tu primer producto para vender" | Crear producto |
| Ventas | "Sin ventas hoy. Las ventas aparecerán aquí" | - |
| Clientes | "Sin clientes. Agrega clientes para guardar sus datos" | Agregar cliente |
| Categorías | "Sin categorías. Organiza tus productos con categorías" | Crear categoría |

---

## Confirmaciones

### Antes de eliminar

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm" className="gap-2">
      <Trash2 className="h-4 w-4" />
      Eliminar
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        ¿Eliminar producto?
      </AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. El producto
        <strong> "Camiseta Azul XL"</strong> será eliminado
        permanentemente del sistema.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>No, cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
        Sí, eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Antes de salir sin guardar

```tsx
// Detectar cambios no guardados
const hasUnsavedChanges = form.formState.isDirty;

// Mostrar confirmación al salir
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);
```

---

## Toasts (Notificaciones)

```tsx
import { toast } from 'sonner';

// Éxito - Breve y claro
toast.success('Producto guardado');

// Error - Con detalle
toast.error('Error al guardar', {
  description: 'Verifica tu conexión e intenta de nuevo',
});

// Warning
toast.warning('Stock bajo', {
  description: 'Solo quedan 5 unidades de este producto',
});

// Promise - Para operaciones largas
toast.promise(saveProduct(data), {
  loading: 'Guardando producto...',
  success: 'Producto guardado',
  error: 'Error al guardar',
});

// Con acción
toast.error('Venta anulada', {
  action: {
    label: 'Deshacer',
    onClick: () => restoreVenta(),
  },
});
```

---

## Animaciones (Framer Motion)

### Sutiles y funcionales

```tsx
// Fade in suave para páginas
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Transición rápida
export const pageTransition = {
  duration: 0.2,
  ease: 'easeOut',
};

// Uso en página
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {children}
</motion.div>
```

### Stagger para listas

```tsx
// Contenedor
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// Items
export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Uso en tabla
<motion.tbody variants={staggerContainer} initial="initial" animate="animate">
  {items.map((item) => (
    <motion.tr key={item.id} variants={staggerItem}>
      ...
    </motion.tr>
  ))}
</motion.tbody>
```

### Hover suaves

```tsx
// Card con hover
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  <Card>...</Card>
</motion.div>

// Botón con press
<motion.button
  whileTap={{ scale: 0.95 }}
  className="..."
>
  Guardar
</motion.button>
```

---

## Formularios Simples

### Reglas

1. **Un campo por línea** (excepto campos relacionados como ciudad/estado)
2. **Labels siempre visibles** (nunca solo placeholder)
3. **Errores debajo del campo** (no al final del form)
4. **Botón guardar visible** (sticky en forms largos)

```tsx
<form className="space-y-4">
  {/* Campo simple */}
  <div className="space-y-2">
    <Label htmlFor="nombre">
      Nombre del producto <span className="text-destructive">*</span>
    </Label>
    <Input
      id="nombre"
      placeholder="Ej: Camiseta deportiva"
      {...register('nombre')}
    />
    {errors.nombre && (
      <p className="text-sm text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {errors.nombre.message}
      </p>
    )}
  </div>

  {/* Campos relacionados en fila */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="precio">Precio</Label>
      <Input id="precio" type="number" {...register('precio')} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="costo">Costo</Label>
      <Input id="costo" type="number" {...register('costo')} />
    </div>
  </div>

  {/* Botones siempre visibles */}
  <div className="flex justify-end gap-3 pt-4 border-t">
    <Button type="button" variant="outline">
      Cancelar
    </Button>
    <Button type="submit" disabled={isSubmitting} className="gap-2">
      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
      Guardar producto
    </Button>
  </div>
</form>
```

---

## Sidebar Simple

```tsx
// Sidebar colapsable con iconos + texto
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Punto de Venta', href: '/pos' },
  { icon: Package, label: 'Productos', href: '/productos' },
  { icon: Layers, label: 'Categorías', href: '/categorias' },
  { icon: Archive, label: 'Inventario', href: '/inventario' },
  { icon: Receipt, label: 'Ventas', href: '/ventas' },
  { icon: Wallet, label: 'Caja', href: '/caja' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: BarChart3, label: 'Reportes', href: '/reportes' },
  { icon: Settings, label: 'Configuración', href: '/configuracion' },
];

// Cada item del menú
<Link
  href={item.href}
  className={cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
    'hover:bg-accent',
    isActive && 'bg-accent text-accent-foreground font-medium'
  )}
>
  <item.icon className="h-5 w-5" />
  <span>{item.label}</span>
</Link>
```

---

## POS (Punto de Venta) - Ultra Simple

```
┌─────────────────────────────────────────────────────────────────┐
│  [🔍 Buscar producto o escanear código...]                      │
├───────────────────────────────────┬─────────────────────────────┤
│                                   │                              │
│   PRODUCTOS                       │   CARRITO                   │
│                                   │                              │
│   ┌─────────┐  ┌─────────┐       │   Camiseta Azul    S/ 25.00 │
│   │  📦     │  │  📦     │       │   Qty: 2           - [+]    │
│   │ S/25.00 │  │ S/50.00 │       │                              │
│   │Camiseta │  │ Zapato  │       │   Pantalón         S/ 80.00 │
│   └─────────┘  └─────────┘       │   Qty: 1           - [+]    │
│                                   │                              │
│   ┌─────────┐  ┌─────────┐       │   ────────────────────────   │
│   │  📦     │  │  📦     │       │   Subtotal:       S/ 130.00 │
│   │ S/15.00 │  │ S/35.00 │       │   Descuento:       S/ 0.00  │
│   │Accesorio│  │ Bolso   │       │   ════════════════════════   │
│   └─────────┘  └─────────┘       │   TOTAL:          S/ 130.00 │
│                                   │                              │
│   [Categoría 1] [Cat 2] [Cat 3]  │   ┌────────────────────────┐ │
│                                   │   │     💰 COBRAR          │ │
│                                   │   │     S/ 130.00          │ │
│                                   │   └────────────────────────┘ │
└───────────────────────────────────┴─────────────────────────────┘
```

### Flujo de Venta

```
1. Buscar/Escanear → 2. Click para agregar → 3. Click en COBRAR
       ↓                      ↓                       ↓
   Producto encontrado   Se agrega al carrito   Modal de pago
```

---

## Checklist UX Antes de Entregar

```
□ ¿Un niño de 10 años podría usarlo?
□ ¿Se completa en 3 clics o menos?
□ ¿Todos los botones tienen icono + texto?
□ ¿Los colores comunican el significado correcto?
□ ¿Hay feedback visual para cada acción?
□ ¿Los estados vacíos son amigables?
□ ¿Las confirmaciones son claras?
□ ¿Los errores explican qué hacer?
□ ¿La jerarquía visual es obvia?
□ ¿Los touch targets son de 44px mínimo?
□ ¿Las animaciones son sutiles (< 300ms)?
□ ¿El flujo principal está en la zona crítica?
```

---

## Anti-patrones (NUNCA hacer)

```
❌ Menús hamburguesa en desktop
❌ Solo iconos sin texto
❌ Colores sin significado
❌ Scroll infinito sin paginación
❌ Modales sobre modales
❌ Auto-save sin confirmación visual
❌ Mensajes de error técnicos
❌ Botones pequeños (< 44px)
❌ Animaciones largas (> 300ms)
❌ Texto pequeño (< 14px body)
❌ Contraste bajo
❌ Demasiadas opciones visibles
❌ Acciones destructivas sin confirmación
```
