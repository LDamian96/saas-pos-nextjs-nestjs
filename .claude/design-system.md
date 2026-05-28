# POS Shop — Sistema de Diseño

> Referencia interna del rediseño. Construido con `ui-ux-pro-max` skill.
> Última actualización: 2026-05-28 18:00 (Lima).

## Filosofía

POS operativo, no landing SaaS. **Densidad alta** donde el cajero opera (POS, ventas, inventario). **Premium suave** en pantallas de bienvenida (login, dashboard, reportes). El cliente final lo usa 8 horas al día — comodidad y velocidad ganan a glamour.

**Test interno**: si parece "otro template Vercel + shadcn", no pasa.

---

## 1. Paleta — "Lima Operativa"

Nombrada por sensaciones del comercio peruano. NO Tailwind default.

### Light mode (default)
| Token | Hex | Uso | Nombre interno |
|---|---|---|---|
| `--brand` | `#0B1220` | Sidebar, headers oscuros, logo | Noche limeña |
| `--surface` | `#FAF7F2` | Background general | Papel |
| `--surface-2` | `#FFFFFF` | Cards, tablas, modales (sólido) | Blanco |
| `--surface-glass` | `rgba(255,255,255,0.72)` | Sidebar elevado, sheets, popovers | Glass cálido |
| `--ink` | `#11161F` | Texto principal | Tinta |
| `--ink-muted` | `#5A6473` | Texto secundario, labels | Grafito |
| `--ink-soft` | `#9099A8` | Placeholders, captions | Niebla |
| `--accent` | `#E83A2F` | CTA primario (Cobrar, Confirmar) | Pimentón |
| `--accent-hover` | `#C2261C` | Hover del accent | Pimentón fuerte |
| `--success` | `#0EA563` | Éxito, stock OK, ingresos | Hierba luisa |
| `--warning` | `#F2B91E` | Stock bajo, alertas leves | Maíz |
| `--danger` | `#D72638` | Sin stock, anular, errores | Huayruco |
| `--info` | `#2E7CF6` | Info neutra | Cielo |
| `--border` | `#E7E1D6` | Bordes hairline | Arena |
| `--border-strong` | `#D2C9B8` | Bordes activos, hover | Arena oscura |

### Dark mode
| Token | Hex | Uso |
|---|---|---|
| `--brand` | `#0B1220` | (mismo, ahora ES la superficie general) |
| `--surface` | `#0F151F` | Background |
| `--surface-2` | `#161D2A` | Cards |
| `--surface-glass` | `rgba(22,29,42,0.72)` | Overlays |
| `--ink` | `#F2EEE6` | Texto principal (cálido, no blanco frío) |
| `--ink-muted` | `#A8B0BE` | Secundario |
| `--ink-soft` | `#6B7689` | Captions |
| `--accent` | `#FF4B3F` | CTA (sube +brightness para dark) |
| `--success` | `#22C97A` | (sube saturación) |
| `--warning` | `#FFC72E` | |
| `--danger` | `#FF4B5C` | |
| `--info` | `#5A95FF` | |
| `--border` | `#262E3D` | |

**Por qué NO es genérico**: cero `slate-*` o `gray-*` puros. Surface light es `#FAF7F2` (cálido tipo papel) en vez del `#F8FAFC` azulado de Tailwind. Accent es `#E83A2F` (bermellón) — más rojo cálido que el `#F97316` orange genérico.

---

## 2. Tipografía — Tres voces

| Rol | Fuente | Fallback Google | Uso |
|---|---|---|---|
| **Display** | Clash Display (Fontshare) | Outfit | Headings de página, números KPI grandes |
| **Body** | Inter (con `font-feature-settings: 'cv11', 'ss03'`) | — | Texto, labels, navegación |
| **Mono** | JetBrains Mono | Geist Mono | Montos S/, SKUs, fechas, RUC, DNI |

**Escala** (en `rem`, base 16px):

| Token | Tamaño | Line | Tracking | Peso | Uso |
|---|---|---|---|---|---|
| `display-xl` | 3.25rem | 1.05 | -0.03em | 700 | Hero login, total al cobrar |
| `display-l` | 2.25rem | 1.1 | -0.02em | 700 | Headings de página |
| `display-m` | 1.5rem | 1.2 | -0.015em | 600 | Subtítulos, totales KPI |
| `body-l` | 1.0625rem | 1.5 | 0 | 500 | Botones, tabs |
| `body-m` | 0.9375rem | 1.55 | 0 | 400 | Texto general |
| `body-s` | 0.8125rem | 1.5 | 0 | 400 | Labels, captions |
| `mono-m` | 0.9375rem | 1.4 | -0.01em | 500 | Montos en tablas |
| `mono-l` | 1.5rem | 1.1 | -0.02em | 600 | Total carrito POS |
| `caps` | 0.75rem | 1.3 | 0.08em | 600 | Section headers sidebar (uppercase) |

**Detalle peruano**: montos siempre en mono con `tabular-nums` (los dígitos alineados). `S/ 1,250.00` se ve consistente entre celdas.

---

## 3. Radius, sombras, blur

| Token | Valor | Uso |
|---|---|---|
| `--r-xs` | 6px | Chips, badges |
| `--r-sm` | 10px | Buttons, inputs |
| `--r-md` | 14px | Cards, dialogs |
| `--r-lg` | 20px | Sheets, glass overlays |
| `--r-pill` | 9999px | Pills de categoría |

**Sombras** (más sutiles que `shadow-xl` de Tailwind):
```
--shadow-1: 0 1px 0 rgba(11,18,32,.04), 0 1px 2px rgba(11,18,32,.06)
--shadow-2: 0 4px 12px -2px rgba(11,18,32,.08), 0 2px 4px -2px rgba(11,18,32,.05)
--shadow-3: 0 12px 32px -8px rgba(11,18,32,.14), 0 6px 12px -4px rgba(11,18,32,.06)
--shadow-glow-accent: 0 0 0 4px rgba(232,58,47,.18) /* focus ring CTA */
```

**Blur** (solo en glass):
- Sidebar elevado / popover / sheet: `backdrop-filter: blur(20px) saturate(180%)`
- Modal overlay: `backdrop-filter: blur(8px)` sobre fondo `rgba(11,18,32,.4)`
- **NO usar blur** en cards de datos, tablas, ni POS grid (perjudica perf y legibilidad).

---

## 4. Componentes clave

### Button (4 variants)
- `accent` (Pimentón) — CTA principal: Cobrar, Confirmar
- `primary` (Noche limeña) — acciones de navegación primaria
- `ghost` — acciones secundarias
- `danger` (Huayruco) — eliminar, anular

Press effect: `transform: scale(0.985); transition: 120ms ease-out`. Focus visible: ring 4px en `--shadow-glow-accent`.

### Card glass
Solo en: sidebar collapsed flyout, dropdown del usuario, command palette, toasts.
```
background: var(--surface-glass);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
border-radius: var(--r-lg);
```

### Card data (NO glass)
Para KPIs, listas, formularios:
```
background: var(--surface-2);
border: 1px solid var(--border);
border-radius: var(--r-md);
box-shadow: var(--shadow-1);
```

### Sidebar item
- Estado base: texto `--ink-muted`, sin fondo
- Hover: fondo `color-mix(in srgb, var(--ink) 4%, transparent)` + texto `--ink`
- Activo: barra vertical izquierda 3px de `--accent` + texto `--ink` + fondo sutil
- **Sin gradientes purple→pink genéricos**

### KPI Card
Layout: label en `caps`, valor en `display-m` mono, delta en chip pequeño.
```
┌─────────────────┐
│ VENTAS HOY      │  ← caps + ink-muted
│ S/ 1,250.00     │  ← mono-l + ink
│ ▲ 12% vs ayer   │  ← chip success
└─────────────────┘
```
**Sin emojis ni íconos circulares de colorinche**. Sí un sparkline mini opcional al fondo (línea de 1px).

### Data table
- Header sticky con `caps` + `ink-muted`
- Filas: alto 44px (no 56px premium — densidad)
- Row hover: fondo `color-mix(in srgb, var(--accent) 4%, transparent)` (rojo muy diluido)
- Selected: barra izquierda 3px `--accent`
- Montos en columna mono + tabular-nums + alineados a la derecha
- Acciones inline visibles en hover (no menú kebab oculto)

### Dialog
- Overlay glass (`backdrop-blur: 8px`)
- Container `surface-2` sólido (legibilidad), no glass
- Entry: `opacity 0→1 + translateY 8px→0` en 220ms ease-out
- Exit: 160ms ease-in

---

## 5. Animaciones — Sistema con propósito

| Trigger | Animación | Duración | Easing |
|---|---|---|---|
| Botón press | `scale 0.985` | 120ms | ease-out |
| Botón hover | `bg + shadow` shift | 180ms | ease-out |
| Page transition | `opacity + translateY 12px` | 240ms | ease-out |
| List stagger | item-by-item 30ms delay | 200ms | ease-out |
| Modal enter | `opacity + translateY 8px + scale 0.98` | 220ms | ease-out |
| Modal exit | inverse | 160ms | ease-in |
| Toast enter | `slideInRight + opacity` | 260ms | spring(300, 30) |
| Carrito +1 | bounce sutil en counter | 320ms | spring |
| Stock bajo crítico | pulse del badge (3 ciclos) | 600ms × 3 | ease-in-out |
| Cobrar éxito | confeti corto (250ms) + check scale 0→1.1→1 | 800ms total | cubic-bezier |

**Respeta** `prefers-reduced-motion: reduce` (todas las animaciones → fade en 80ms).
**Cero animaciones decorativas infinitas** (sin `animate-bounce` en icons, sin gradientes en movimiento).

---

## 6. Iconografía

- **Set único**: Lucide React (ya está en deps probablemente). Talla:
  - Nav sidebar: 20px stroke 1.75
  - Buttons: 16px stroke 2
  - Inline chips: 14px stroke 2
- **Custom icons del dominio** (SVG inline, no librería):
  - Yape (logo simplificado)
  - Plin
  - Boleta / Factura / Ticket (distintos)
  - RUC, DNI (chip con label, no icon)
  - Caja abierta / cerrada (no usar `box` genérico de Lucide)
- **NO emojis** en UI. Si hace falta semánticamente (ej. dashboard "👋 Bienvenido"), reemplazar por icon o quitar.

---

## 7. Densidad — Tres modos

| Modo | Padding fila | Font body | Uso |
|---|---|---|---|
| `compact` | 8px | 13px | POS grid, inventario kardex, auditoría |
| `comfortable` (default) | 12px | 15px | Dashboard, productos, ventas |
| `spacious` | 20px | 16px | Login, configuración inicial |

Toggle del modo persistido en `localStorage` por usuario. (Versión 2, no esta sesión.)

---

## 8. Orden de implementación

Por **impacto visual percibido** vs esfuerzo:

| # | Bloque | Impacto | Esfuerzo | Notas |
|---|---|---|---|---|
| 1 | **Tokens + globals.css** | — | Bajo | Foundation. Sin esto el resto no aplica. |
| 2 | **Layout + sidebar + topbar** | ALTO | Medio | Se ve en TODAS las páginas inmediatamente. |
| 3 | **Login + auth pages** | ALTO | Bajo | Primera impresión del cliente. |
| 4 | **Dashboard (resumen)** | ALTO | Medio | KPI cards + estado caja. |
| 5 | **POS (cobro)** | ALTO | Alto | Pantalla de uso más intenso. |
| 6 | **Caja (apertura/cierre/movimientos)** | Medio | Medio | |
| 7 | **Productos + grid** | Medio | Medio | Imágenes Cloudinary, image-upload. |
| 8 | **Ventas + detalle** | Medio | Bajo | Tablas data-dense. |
| 9 | **Inventario** (alertas, kardex, lotes, traspasos) | Medio | Alto | 8+ subpáginas, mucha tabla. |
| 10 | **Reportes** (5 subpáginas) | Bajo-Medio | Medio | Gráficos charts. |
| 11 | **Configuración** (sucursales, usuarios, roles, métodos-pago, negocio) | Bajo | Medio | Formularios. |
| 12 | **Clientes / Proveedores / Compras / Pagos** | Bajo | Bajo | CRUDs estándar. |
| 13 | **Promociones / Auditoría / Catálogos** | Bajo | Bajo | |

Cada bloque incluye: light + dark mode, responsive ≥375px, accesibilidad (contraste, focus, labels).

---

## 9. Reglas de oro (anti-IA-genérico)

1. **Cero gradiente `from-blue to-purple`**. Si hay gradiente, es de la paleta nombrada (ej. `from-brand to-brand` con `mix-blend`).
2. **Cero card glass en zonas de datos**. Glass solo en overlays.
3. **Cero copy de IA**. "Bienvenido 👋" → "Hola Carlos, S/ 1,250 vendidos hoy". Concreto.
4. **Numérica siempre en mono + tabular**. Nunca un monto en sans proporcional.
5. **Iconos con propósito**. Si no agrega información, fuera.
6. **Densidad real**. Tablas de 44px alto, no 64.
7. **Animaciones responden a acción**. Nunca decorativas infinitas.
8. **Focus visible siempre**. Ring de accent 4px.
9. **Bordes hairline cálidos**, no `border-gray-200` frío.
10. **El detalle peruano**: S/, IGV 18%, Yape/Plin, RUC, Boleta/Factura/Ticket bien diferenciados visualmente.
