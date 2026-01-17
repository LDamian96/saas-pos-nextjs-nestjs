# 🛣️ FRONTEND - RUTAS Y PÁGINAS

## 📋 ARQUITECTURA DE RUTAS (Next.js App Router)

```
frontend/src/presentation/app/
├── (auth)/                    # Grupo: Sin autenticación requerida
├── (dashboard)/               # Grupo: Requiere autenticación + sidebar
├── (pos)/                     # Grupo: Requiere autenticación, layout POS
├── (landing)/                 # Grupo: Público, layout landing
└── layout.tsx                 # Layout raíz
```

---

## 🔐 RUTAS DE AUTENTICACIÓN - `(auth)/`

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/login` | `(auth)/login/page.tsx` | Iniciar sesión |
| `/register` | `(auth)/register/page.tsx` | Registrar empresa |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Recuperar contraseña |
| `/reset-password` | `(auth)/reset-password/page.tsx` | Cambiar contraseña |

### Layout Auth
```tsx
// (auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
```

### Página Login
```tsx
// (auth)/login/page.tsx
import { LoginForm } from '@/presentation/components/features/auth/login-form';

export const metadata = {
  title: 'Iniciar Sesión | POS System',
  description: 'Accede a tu cuenta',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bienvenido</h1>
        <p className="text-muted-foreground">Ingresa a tu cuenta</p>
      </div>
      <LoginForm />
    </div>
  );
}
```

---

## 📊 RUTAS DEL DASHBOARD - `(dashboard)/`

### Layout Dashboard
```tsx
// (dashboard)/layout.tsx
import { Sidebar } from '@/presentation/components/layout/sidebar/sidebar';
import { Header } from '@/presentation/components/layout/header/header';
import { AuthGuard } from '@/presentation/components/common/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
```

### Rutas Dashboard Principal

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/dashboard` | `(dashboard)/dashboard/page.tsx` | Dashboard principal con KPIs | Todos |

```tsx
// (dashboard)/dashboard/page.tsx
import { DashboardStats } from '@/presentation/components/features/dashboard/dashboard-stats';
import { SalesChart } from '@/presentation/components/features/reportes/sales-chart';
import { RecentSales } from '@/presentation/components/features/dashboard/recent-sales';
import { LowStockAlert } from '@/presentation/components/features/dashboard/low-stock-alert';

export const metadata = {
  title: 'Dashboard | POS System',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <DashboardStats />

      {/* Gráficos y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <LowStockAlert />
      </div>

      {/* Ventas recientes */}
      <RecentSales />
    </div>
  );
}
```

---

### Rutas Catálogos

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/catalogos/categorias` | `categorias/page.tsx` | Lista de categorías | `categorias:leer` |
| `/catalogos/categorias/[id]` | `categorias/[id]/page.tsx` | Editar categoría | `categorias:editar` |
| `/catalogos/marcas` | `marcas/page.tsx` | Lista de marcas | `marcas:leer` |
| `/catalogos/marcas/[id]` | `marcas/[id]/page.tsx` | Editar marca | `marcas:editar` |
| `/catalogos/atributos` | `atributos/page.tsx` | Lista de atributos | `atributos:leer` |
| `/catalogos/atributos/[id]` | `atributos/[id]/page.tsx` | Editar atributo | `atributos:editar` |
| `/catalogos/unidades-medida` | `unidades-medida/page.tsx` | Unidades de medida | `catalogos:leer` |

```tsx
// (dashboard)/catalogos/categorias/page.tsx
import { CategoriaTable } from '@/presentation/components/features/catalogos/categoria-table';
import { CreateCategoriaDialog } from '@/presentation/components/features/catalogos/create-categoria-dialog';
import { PermissionGuard } from '@/presentation/components/common/permission-guard';

export const metadata = {
  title: 'Categorías | POS System',
};

export default function CategoriasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Categorías</h1>
        <PermissionGuard permission="categorias:crear">
          <CreateCategoriaDialog />
        </PermissionGuard>
      </div>

      <CategoriaTable />
    </div>
  );
}
```

---

### Rutas Productos

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/productos` | `productos/page.tsx` | Lista de productos | `productos:leer` |
| `/productos/nuevo` | `productos/nuevo/page.tsx` | Crear producto | `productos:crear` |
| `/productos/[id]` | `productos/[id]/page.tsx` | Ver producto | `productos:leer` |
| `/productos/[id]/editar` | `productos/[id]/editar/page.tsx` | Editar producto | `productos:editar` |
| `/productos/import-export` | `productos/import-export/page.tsx` | Importar/Exportar | `productos:importar` |

```tsx
// (dashboard)/productos/page.tsx
import { ProductoTable } from '@/presentation/components/features/productos/producto-table';
import { ProductoFilters } from '@/presentation/components/features/productos/producto-filters';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Productos | POS System',
};

export default function ProductosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <Link href="/productos/import-export">
            <Button variant="outline">Importar/Exportar</Button>
          </Link>
          <Link href="/productos/nuevo">
            <Button>+ Nuevo Producto</Button>
          </Link>
        </div>
      </div>

      <ProductoFilters />
      <ProductoTable />
    </div>
  );
}
```

```tsx
// (dashboard)/productos/nuevo/page.tsx
import { ProductoForm } from '@/presentation/components/features/productos/producto-form';

export const metadata = {
  title: 'Nuevo Producto | POS System',
};

export default function NuevoProductoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Nuevo Producto</h1>
      <ProductoForm mode="create" />
    </div>
  );
}
```

```tsx
// (dashboard)/productos/[id]/page.tsx
import { ProductoDetail } from '@/presentation/components/features/productos/producto-detail';
import { VariantesTable } from '@/presentation/components/features/productos/variantes-table';
import { StockTable } from '@/presentation/components/features/productos/stock-table';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  // Fetch producto para metadata
  return {
    title: 'Detalle Producto | POS System',
  };
}

export default function ProductoDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <ProductoDetail id={params.id} />

      {/* Tabs: Variantes, Stock, Historial */}
      <Tabs defaultValue="variantes">
        <TabsList>
          <TabsTrigger value="variantes">Variantes</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="variantes">
          <VariantesTable productoId={params.id} />
        </TabsContent>
        <TabsContent value="stock">
          <StockTable productoId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Rutas Inventario

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/inventario` | `inventario/page.tsx` | Vista general de stock | `inventario:leer` |
| `/inventario/entradas` | `inventario/entradas/page.tsx` | Registrar entrada | `inventario:entrada` |
| `/inventario/salidas` | `inventario/salidas/page.tsx` | Registrar salida | `inventario:salida` |
| `/inventario/ajustes` | `inventario/ajustes/page.tsx` | Ajustar stock | `inventario:ajuste` |
| `/inventario/transferencias` | `inventario/transferencias/page.tsx` | Transferir stock | `inventario:transferir` |
| `/inventario/kardex` | `inventario/kardex/page.tsx` | Ver kardex | `inventario:leer` |

```tsx
// (dashboard)/inventario/page.tsx
import { StockTable } from '@/presentation/components/features/inventario/stock-table';
import { StockFilters } from '@/presentation/components/features/inventario/stock-filters';
import { StockStats } from '@/presentation/components/features/inventario/stock-stats';

export const metadata = {
  title: 'Inventario | POS System',
};

export default function InventarioPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <div className="flex gap-2">
          <Link href="/inventario/entradas">
            <Button variant="outline">+ Entrada</Button>
          </Link>
          <Link href="/inventario/salidas">
            <Button variant="outline">- Salida</Button>
          </Link>
          <Link href="/inventario/ajustes">
            <Button variant="outline">Ajuste</Button>
          </Link>
        </div>
      </div>

      <StockStats />
      <StockFilters />
      <StockTable />
    </div>
  );
}
```

---

### Rutas Ventas

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/ventas` | `ventas/page.tsx` | Historial de ventas | `ventas:leer` |
| `/ventas/[id]` | `ventas/[id]/page.tsx` | Detalle de venta | `ventas:leer` |

```tsx
// (dashboard)/ventas/page.tsx
import { VentaTable } from '@/presentation/components/features/ventas/venta-table';
import { VentaFilters } from '@/presentation/components/features/ventas/venta-filters';
import { VentaStats } from '@/presentation/components/features/ventas/venta-stats';

export const metadata = {
  title: 'Ventas | POS System',
};

export default function VentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Historial de Ventas</h1>
        <Link href="/pos">
          <Button>Ir al POS</Button>
        </Link>
      </div>

      <VentaStats />
      <VentaFilters />
      <VentaTable />
    </div>
  );
}
```

```tsx
// (dashboard)/ventas/[id]/page.tsx
import { VentaDetail } from '@/presentation/components/features/ventas/venta-detail';
import { PrintButton } from '@/presentation/components/features/print/print-button';

interface Props {
  params: { id: string };
}

export default function VentaDetailPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Detalle de Venta</h1>
        <div className="flex gap-2">
          <PrintButton ventaId={params.id} />
          <Button variant="outline">Descargar PDF</Button>
        </div>
      </div>

      <VentaDetail id={params.id} />
    </div>
  );
}
```

---

### Rutas Caja

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/caja` | `caja/page.tsx` | Estado de caja actual | `caja:ver` |
| `/caja/historial` | `caja/historial/page.tsx` | Historial de cajas | `caja:historial` |

```tsx
// (dashboard)/caja/page.tsx
import { CajaStatus } from '@/presentation/components/features/caja/caja-status';
import { AperturaCajaDialog } from '@/presentation/components/features/caja/apertura-caja-dialog';
import { CierreCajaDialog } from '@/presentation/components/features/caja/cierre-caja-dialog';
import { MovimientoCajaDialog } from '@/presentation/components/features/caja/movimiento-caja-dialog';
import { MovimientosTable } from '@/presentation/components/features/caja/movimientos-table';

export const metadata = {
  title: 'Caja | POS System',
};

export default function CajaPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Caja</h1>
        <div className="flex gap-2">
          <AperturaCajaDialog />
          <MovimientoCajaDialog />
          <CierreCajaDialog />
        </div>
      </div>

      <CajaStatus />
      <MovimientosTable />
    </div>
  );
}
```

---

### Rutas Clientes

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/clientes` | `clientes/page.tsx` | Lista de clientes | `clientes:leer` |
| `/clientes/[id]` | `clientes/[id]/page.tsx` | Detalle de cliente | `clientes:leer` |

---

### Rutas Proveedores

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/proveedores` | `proveedores/page.tsx` | Lista de proveedores | `proveedores:leer` |
| `/proveedores/[id]` | `proveedores/[id]/page.tsx` | Detalle de proveedor | `proveedores:leer` |

---

### Rutas Promociones

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/promociones` | `promociones/page.tsx` | Lista de promociones | `promociones:leer` |
| `/promociones/nueva` | `promociones/nueva/page.tsx` | Crear promoción | `promociones:crear` |
| `/promociones/[id]` | `promociones/[id]/page.tsx` | Editar promoción | `promociones:editar` |

```tsx
// (dashboard)/promociones/page.tsx
import { PromocionTable } from '@/presentation/components/features/promociones/promocion-table';
import { PromocionStats } from '@/presentation/components/features/promociones/promocion-stats';

export default function PromocionesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Promociones</h1>
        <Link href="/promociones/nueva">
          <Button>+ Nueva Promoción</Button>
        </Link>
      </div>

      <PromocionStats />
      <PromocionTable />
    </div>
  );
}
```

---

### Rutas Reportes

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/reportes` | `reportes/page.tsx` | Índice de reportes | `reportes:leer` |
| `/reportes/ventas` | `reportes/ventas/page.tsx` | Reporte de ventas | `reportes:ventas` |
| `/reportes/productos` | `reportes/productos/page.tsx` | Reporte de productos | `reportes:productos` |
| `/reportes/inventario` | `reportes/inventario/page.tsx` | Reporte de inventario | `reportes:inventario` |
| `/reportes/caja` | `reportes/caja/page.tsx` | Reporte de caja | `reportes:caja` |

```tsx
// (dashboard)/reportes/ventas/page.tsx
import { SalesChart } from '@/presentation/components/features/reportes/sales-chart';
import { SalesTable } from '@/presentation/components/features/reportes/sales-table';
import { ReportFilters } from '@/presentation/components/features/reportes/report-filters';
import { ExportButtons } from '@/presentation/components/features/reportes/export-buttons';

export const metadata = {
  title: 'Reporte de Ventas | POS System',
};

export default function ReporteVentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reporte de Ventas</h1>
        <ExportButtons />
      </div>

      <ReportFilters />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <CategoryChart />
      </div>

      <SalesTable />
    </div>
  );
}
```

---

### Rutas Configuración

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/configuracion` | `configuracion/page.tsx` | Índice configuración | Admin |
| `/configuracion/empresa` | `configuracion/empresa/page.tsx` | Datos de empresa | Admin |
| `/configuracion/sucursales` | `configuracion/sucursales/page.tsx` | Gestión sucursales | Admin |
| `/configuracion/usuarios` | `configuracion/usuarios/page.tsx` | Gestión usuarios | Admin |
| `/configuracion/roles` | `configuracion/roles/page.tsx` | Gestión roles | Admin |
| `/configuracion/metodos-pago` | `configuracion/metodos-pago/page.tsx` | Métodos de pago | Admin |
| `/configuracion/impresion` | `configuracion/impresion/page.tsx` | Config impresión | Admin |
| `/configuracion/seo` | `configuracion/seo/page.tsx` | Config SEO landing | Admin |

```tsx
// (dashboard)/configuracion/page.tsx
import { Card } from '@/presentation/components/ui/card';
import Link from 'next/link';
import {
  Building, Users, Shield, CreditCard,
  Printer, Globe, Store
} from 'lucide-react';

const configItems = [
  { href: '/configuracion/empresa', icon: Building, title: 'Empresa', description: 'Datos de tu empresa' },
  { href: '/configuracion/sucursales', icon: Store, title: 'Sucursales', description: 'Gestiona tus locales' },
  { href: '/configuracion/usuarios', icon: Users, title: 'Usuarios', description: 'Administra empleados' },
  { href: '/configuracion/roles', icon: Shield, title: 'Roles', description: 'Permisos y accesos' },
  { href: '/configuracion/metodos-pago', icon: CreditCard, title: 'Métodos de Pago', description: 'Formas de pago' },
  { href: '/configuracion/impresion', icon: Printer, title: 'Impresión', description: 'Configurar tickets' },
  { href: '/configuracion/seo', icon: Globe, title: 'SEO & Landing', description: 'Página pública' },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <item.icon className="h-8 w-8 mb-4 text-primary" />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## 🛒 RUTAS DEL POS - `(pos)/`

### Layout POS (Sin Sidebar)
```tsx
// (pos)/layout.tsx
import { AuthGuard } from '@/presentation/components/common/auth-guard';
import { CajaGuard } from '@/presentation/components/common/caja-guard';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <CajaGuard>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </CajaGuard>
    </AuthGuard>
  );
}
```

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/pos` | `(pos)/pos/page.tsx` | Punto de venta | `ventas:crear` |

```tsx
// (pos)/pos/page.tsx
'use client';

import { POSLayout } from '@/presentation/components/features/pos/pos-layout';
import { ProductGrid } from '@/presentation/components/features/pos/product-grid';
import { Cart } from '@/presentation/components/features/pos/cart/cart';
import { QuickSearch } from '@/presentation/components/features/pos/quick-search';
import { BarcodeScanner } from '@/presentation/components/features/pos/barcode-scanner';
import { PaymentModal } from '@/presentation/components/features/pos/payment-modal';
import { DiscountModal } from '@/presentation/components/features/pos/discount-modal';
import { usePOSStore } from '@/application/stores/pos.store';

export default function POSPage() {
  const { showPaymentModal, showDiscountModal } = usePOSStore();

  return (
    <POSLayout>
      {/* Header POS */}
      <header className="h-16 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Punto de Venta</h1>
          <BarcodeScanner />
        </div>
        <QuickSearch />
        <div className="flex items-center gap-2">
          <CajaIndicator />
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Productos - 60% */}
        <div className="flex-1 p-4 overflow-auto">
          <ProductGrid />
        </div>

        {/* Carrito - 40% */}
        <div className="w-[400px] border-l bg-card">
          <Cart />
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && <PaymentModal />}
      {showDiscountModal && <DiscountModal />}
    </POSLayout>
  );
}
```

---

## 🌐 RUTAS PÚBLICAS (LANDING) - `(landing)/`

### Layout Landing
```tsx
// (landing)/layout.tsx
import { LandingHeader } from '@/presentation/components/layout/landing-header';
import { LandingFooter } from '@/presentation/components/layout/landing-footer';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
```

| Ruta | Archivo | Descripción | SEO |
|------|---------|-------------|-----|
| `/` | `(landing)/page.tsx` | Home landing | Sí |
| `/catalogo` | `(landing)/catalogo/page.tsx` | Catálogo productos | Sí |
| `/catalogo/[slug]` | `(landing)/catalogo/[slug]/page.tsx` | Detalle producto | Sí |
| `/nosotros` | `(landing)/nosotros/page.tsx` | Página nosotros | Sí |
| `/contacto` | `(landing)/contacto/page.tsx` | Formulario contacto | Sí |

```tsx
// (landing)/page.tsx
import { HeroSection } from '@/presentation/components/features/landing/hero-section';
import { FeaturedProducts } from '@/presentation/components/features/landing/featured-products';
import { Categories } from '@/presentation/components/features/landing/categories';
import { Testimonials } from '@/presentation/components/features/landing/testimonials';
import { ContactCTA } from '@/presentation/components/features/landing/contact-cta';
import { getSEOConfig, getEmpresaPublicData } from '@/application/services/seo.service';

export async function generateMetadata() {
  const seo = await getSEOConfig();
  return {
    title: seo.titulo,
    description: seo.descripcion,
    keywords: seo.keywords,
    openGraph: {
      title: seo.og_titulo,
      description: seo.og_descripcion,
      images: [seo.og_imagen],
    },
  };
}

export default async function LandingPage() {
  const empresa = await getEmpresaPublicData();

  return (
    <>
      <HeroSection empresa={empresa} />
      <FeaturedProducts />
      <Categories />
      <Testimonials />
      <ContactCTA />
    </>
  );
}
```

```tsx
// (landing)/catalogo/[slug]/page.tsx
import { ProductDetail } from '@/presentation/components/features/landing/product-detail';
import { RelatedProducts } from '@/presentation/components/features/landing/related-products';
import { getProductBySlug } from '@/application/services/producto.service';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const producto = await getProductBySlug(params.slug);
  if (!producto) return {};

  return {
    title: `${producto.nombre} | Tienda`,
    description: producto.descripcion_corta,
    openGraph: {
      images: [producto.imagen_principal],
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const producto = await getProductBySlug(params.slug);

  if (!producto) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <ProductDetail producto={producto} />
      <RelatedProducts categoriaId={producto.categoria_id} excludeId={producto.id} />
    </div>
  );
}
```

---

## 🧩 COMPONENTES DE NAVEGACIÓN

### Sidebar - Estructura
```tsx
// presentation/components/layout/sidebar/sidebar.tsx
const menuItems = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/pos', icon: ShoppingCart, label: 'Punto de Venta', external: true },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { href: '/catalogos/categorias', icon: Folder, label: 'Categorías', permission: 'categorias:leer' },
      { href: '/catalogos/marcas', icon: Tag, label: 'Marcas', permission: 'marcas:leer' },
      { href: '/catalogos/atributos', icon: Palette, label: 'Atributos', permission: 'atributos:leer' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { href: '/productos', icon: Package, label: 'Productos', permission: 'productos:leer' },
      { href: '/inventario', icon: Warehouse, label: 'Stock', permission: 'inventario:leer' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { href: '/ventas', icon: Receipt, label: 'Historial', permission: 'ventas:leer' },
      { href: '/caja', icon: Calculator, label: 'Caja', permission: 'caja:ver' },
      { href: '/clientes', icon: Users, label: 'Clientes', permission: 'clientes:leer' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/promociones', icon: Percent, label: 'Promociones', permission: 'promociones:leer' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { href: '/reportes', icon: BarChart, label: 'Reportes', permission: 'reportes:leer' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { href: '/configuracion', icon: Settings, label: 'Configuración', permission: 'admin' },
    ],
  },
];
```

---

## 🔒 GUARDS Y PROTECCIÓN DE RUTAS

### AuthGuard
```tsx
// presentation/components/common/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/application/stores/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### PermissionGuard
```tsx
// presentation/components/common/permission-guard.tsx
'use client';

import { useAuthStore } from '@/application/stores/auth.store';

interface Props {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: Props) {
  const { user, hasPermission } = useAuthStore();

  if (!user || !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### CajaGuard (Para POS)
```tsx
// presentation/components/common/caja-guard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCajaStore } from '@/application/stores/caja.store';
import { AperturaCajaDialog } from '../features/caja/apertura-caja-dialog';

export function CajaGuard({ children }: { children: React.ReactNode }) {
  const { cajaAbierta, checkEstadoCaja, isLoading } = useCajaStore();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    checkEstadoCaja();
  }, []);

  useEffect(() => {
    if (!isLoading && !cajaAbierta) {
      setShowDialog(true);
    }
  }, [isLoading, cajaAbierta]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!cajaAbierta) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Caja Cerrada</h2>
          <p className="mb-4">Debes abrir la caja para usar el POS</p>
          <AperturaCajaDialog open={showDialog} onOpenChange={setShowDialog} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## 📱 RESPONSIVE BREAKPOINTS

```tsx
// Configuración Tailwind para responsive
const breakpoints = {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};

// POS optimizado para tablets (768px+)
// Dashboard responsive completo
// Landing mobile-first
```

---

## 📱 RUTAS WHATSAPP / AGENTE IA - `(dashboard)/integraciones/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/integraciones/whatsapp` | `(dashboard)/integraciones/whatsapp/page.tsx` | Config WhatsApp | admin |
| `/integraciones/whatsapp/qr` | `(dashboard)/integraciones/whatsapp/qr/page.tsx` | Escanear QR | admin |
| `/integraciones/agente-ia` | `(dashboard)/integraciones/agente-ia/page.tsx` | Config Agente IA | admin |
| `/integraciones/agente-ia/uso` | `(dashboard)/integraciones/agente-ia/uso/page.tsx` | Estadísticas uso | admin |

```tsx
// (dashboard)/integraciones/whatsapp/page.tsx
import { WhatsAppConfig } from '@/presentation/components/features/integraciones/whatsapp-config';
import { WhatsAppStatus } from '@/presentation/components/features/integraciones/whatsapp-status';

export const metadata = {
  title: 'WhatsApp | Integraciones',
};

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integración WhatsApp</h1>
        <p className="text-muted-foreground">
          Conecta tu WhatsApp para usar el Agente IA
        </p>
      </div>

      <WhatsAppStatus />
      <WhatsAppConfig />
    </div>
  );
}
```

```tsx
// (dashboard)/integraciones/agente-ia/page.tsx
import { AgenteIAConfig } from '@/presentation/components/features/integraciones/agente-ia-config';
import { AgenteIAUsage } from '@/presentation/components/features/integraciones/agente-ia-usage';

export const metadata = {
  title: 'Agente IA | Integraciones',
};

export default function AgenteIAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agente IA WhatsApp</h1>
        <p className="text-muted-foreground">
          Configura tu asistente de inventario por voz
        </p>
      </div>

      <AgenteIAConfig />
      <AgenteIAUsage />
    </div>
  );
}
```

---

## 💳 RUTAS BILLING / SUSCRIPCIONES - `(dashboard)/billing/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/billing` | `(dashboard)/billing/page.tsx` | Ver plan actual | admin |
| `/billing/planes` | `(dashboard)/billing/planes/page.tsx` | Ver todos los planes | admin |
| `/billing/addons` | `(dashboard)/billing/addons/page.tsx` | Gestionar addons | admin |
| `/billing/pagos` | `(dashboard)/billing/pagos/page.tsx` | Historial pagos | admin |
| `/billing/success` | `(dashboard)/billing/success/page.tsx` | Pago exitoso | admin |
| `/billing/cancel` | `(dashboard)/billing/cancel/page.tsx` | Pago cancelado | admin |

```tsx
// (dashboard)/billing/page.tsx
import { CurrentPlan } from '@/presentation/components/features/billing/current-plan';
import { BillingOverview } from '@/presentation/components/features/billing/billing-overview';
import { ActiveAddons } from '@/presentation/components/features/billing/active-addons';
import { PaymentMethod } from '@/presentation/components/features/billing/payment-method';

export const metadata = {
  title: 'Facturación | Configuración',
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plan y Facturación</h1>
        <p className="text-muted-foreground">
          Gestiona tu suscripción y métodos de pago
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CurrentPlan />
        <BillingOverview />
      </div>

      <ActiveAddons />
      <PaymentMethod />
    </div>
  );
}
```

```tsx
// (dashboard)/billing/planes/page.tsx
import { PricingPlans } from '@/presentation/components/features/billing/pricing-plans';
import { PlanComparison } from '@/presentation/components/features/billing/plan-comparison';

export const metadata = {
  title: 'Planes | Facturación',
};

export default function PlanesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes Disponibles</h1>
        <p className="text-muted-foreground">
          Elige el plan que mejor se adapte a tu negocio
        </p>
      </div>

      <PricingPlans />
      <PlanComparison />
    </div>
  );
}
```

```tsx
// (dashboard)/billing/pagos/page.tsx
import { PaymentHistory } from '@/presentation/components/features/billing/payment-history';
import { PaymentFilters } from '@/presentation/components/features/billing/payment-filters';

export const metadata = {
  title: 'Historial de Pagos | Facturación',
};

export default function PagosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Pagos</h1>
        <p className="text-muted-foreground">
          Revisa todos tus pagos y descarga facturas
        </p>
      </div>

      <PaymentFilters />
      <PaymentHistory />
    </div>
  );
}
```

---

## 🌐 RUTAS LANDING MULTI-TENANT - `(tenant)/`

> Las landing pages de cada empresa son accesibles vía subdominio o ruta `/t/{subdominio}`

| Ruta | Archivo | Descripción | SEO |
|------|---------|-------------|-----|
| `/t/[subdominio]` | `(tenant)/t/[subdominio]/page.tsx` | Landing empresa | Sí |
| `/t/[subdominio]/productos` | `(tenant)/t/[subdominio]/productos/page.tsx` | Catálogo público | Sí |
| `/t/[subdominio]/producto/[slug]` | `(tenant)/t/[subdominio]/producto/[slug]/page.tsx` | Detalle producto | Sí |
| `/t/[subdominio]/contacto` | `(tenant)/t/[subdominio]/contacto/page.tsx` | Formulario contacto | Sí |
| `/t/[subdominio]/qr/[productoId]` | `(tenant)/t/[subdominio]/qr/[productoId]/page.tsx` | Producto vía QR | Sí |

```tsx
// (tenant)/t/[subdominio]/page.tsx
import { TenantLanding } from '@/presentation/components/features/tenant/tenant-landing';
import { getTenantData } from '@/application/services/tenant.service';
import { notFound } from 'next/navigation';

interface Props {
  params: { subdominio: string };
}

export async function generateMetadata({ params }: Props) {
  const tenant = await getTenantData(params.subdominio);
  if (!tenant) return {};

  return {
    title: tenant.seo.titulo,
    description: tenant.seo.descripcion,
    openGraph: {
      title: tenant.seo.titulo,
      description: tenant.seo.descripcion,
      images: [tenant.seo.ogImagen],
    },
  };
}

export default async function TenantPage({ params }: Props) {
  const tenant = await getTenantData(params.subdominio);

  if (!tenant) {
    notFound();
  }

  return <TenantLanding tenant={tenant} />;
}
```

```tsx
// (tenant)/t/[subdominio]/qr/[productoId]/page.tsx
import { ProductQRView } from '@/presentation/components/features/tenant/product-qr-view';
import { getProductoByQR } from '@/application/services/tenant.service';
import { notFound } from 'next/navigation';

interface Props {
  params: { subdominio: string; productoId: string };
}

export async function generateMetadata({ params }: Props) {
  const producto = await getProductoByQR(params.subdominio, params.productoId);
  if (!producto) return {};

  return {
    title: `${producto.nombre} | ${producto.empresa.nombre}`,
    description: producto.descripcion,
    openGraph: {
      images: [producto.imagenPrincipal],
    },
  };
}

export default async function ProductoQRPage({ params }: Props) {
  const producto = await getProductoByQR(params.subdominio, params.productoId);

  if (!producto) {
    notFound();
  }

  return <ProductQRView producto={producto} />;
}
```

---

## 🎨 RUTAS LANDING CONFIG - `(dashboard)/landing/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/landing` | `(dashboard)/landing/page.tsx` | Vista previa landing | admin |
| `/landing/secciones` | `(dashboard)/landing/secciones/page.tsx` | Editar secciones | admin |
| `/landing/testimonios` | `(dashboard)/landing/testimonios/page.tsx` | Gestionar testimonios | admin |
| `/landing/contactos` | `(dashboard)/landing/contactos/page.tsx` | Ver leads/contactos | admin |
| `/landing/qr` | `(dashboard)/landing/qr/page.tsx` | Generar códigos QR | admin |

```tsx
// (dashboard)/landing/page.tsx
import { LandingPreview } from '@/presentation/components/features/landing-admin/landing-preview';
import { LandingActions } from '@/presentation/components/features/landing-admin/landing-actions';

export const metadata = {
  title: 'Landing Page | Marketing',
};

export default function LandingAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Landing Page</h1>
          <p className="text-muted-foreground">
            Personaliza tu página pública
          </p>
        </div>
        <LandingActions />
      </div>

      <LandingPreview />
    </div>
  );
}
```

```tsx
// (dashboard)/landing/qr/page.tsx
import { QRGenerator } from '@/presentation/components/features/landing-admin/qr-generator';
import { QRProductList } from '@/presentation/components/features/landing-admin/qr-product-list';

export const metadata = {
  title: 'Códigos QR | Marketing',
};

export default function QRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Códigos QR</h1>
        <p className="text-muted-foreground">
          Genera QR para tu landing y productos
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QRGenerator type="landing" />
        <QRGenerator type="whatsapp" />
      </div>

      <QRProductList />
    </div>
  );
}
```

---

## 🧭 SIDEBAR ACTUALIZADO

```tsx
// presentation/components/layout/sidebar/sidebar.tsx - ACTUALIZADO
const menuItems = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/pos', icon: ShoppingCart, label: 'Punto de Venta', external: true },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { href: '/catalogos/categorias', icon: Folder, label: 'Categorías', permission: 'categorias:leer' },
      { href: '/catalogos/marcas', icon: Tag, label: 'Marcas', permission: 'marcas:leer' },
      { href: '/catalogos/atributos', icon: Palette, label: 'Atributos', permission: 'atributos:leer' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { href: '/productos', icon: Package, label: 'Productos', permission: 'productos:leer' },
      { href: '/inventario', icon: Warehouse, label: 'Stock', permission: 'inventario:leer' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { href: '/ventas', icon: Receipt, label: 'Historial', permission: 'ventas:leer' },
      { href: '/caja', icon: Calculator, label: 'Caja', permission: 'caja:ver' },
      { href: '/clientes', icon: Users, label: 'Clientes', permission: 'clientes:leer' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/promociones', icon: Percent, label: 'Promociones', permission: 'promociones:leer' },
      { href: '/landing', icon: Globe, label: 'Landing Page', permission: 'admin' },
      { href: '/landing/qr', icon: QrCode, label: 'Códigos QR', permission: 'admin' },
      { href: '/landing/contactos', icon: MessageSquare, label: 'Leads', permission: 'admin' },
    ],
  },
  {
    title: 'Integraciones',
    items: [
      { href: '/integraciones/whatsapp', icon: MessageCircle, label: 'WhatsApp', permission: 'admin', addon: 'agente_ia' },
      { href: '/integraciones/agente-ia', icon: Bot, label: 'Agente IA', permission: 'admin', addon: 'agente_ia' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { href: '/reportes', icon: BarChart, label: 'Reportes', permission: 'reportes:leer' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { href: '/configuracion', icon: Settings, label: 'Configuración', permission: 'admin' },
      { href: '/configuracion/auditoria', icon: FileText, label: 'Auditoría', permission: 'config.auditoria' },
      { href: '/billing', icon: CreditCard, label: 'Facturación', permission: 'admin' },
    ],
  },
];
```

---

## 👥 RUTAS GESTIÓN DE USUARIOS Y ROLES - `(dashboard)/configuracion/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/configuracion/usuarios` | `(dashboard)/configuracion/usuarios/page.tsx` | Lista de usuarios | `config.usuarios` |
| `/configuracion/usuarios/nuevo` | `(dashboard)/configuracion/usuarios/nuevo/page.tsx` | Crear usuario | `config.usuarios` |
| `/configuracion/usuarios/:id` | `(dashboard)/configuracion/usuarios/[id]/page.tsx` | Editar usuario | `config.usuarios` |
| `/configuracion/roles` | `(dashboard)/configuracion/roles/page.tsx` | Lista de roles | `config.roles` |
| `/configuracion/roles/nuevo` | `(dashboard)/configuracion/roles/nuevo/page.tsx` | Crear rol personalizado | `config.roles` |
| `/configuracion/roles/:id` | `(dashboard)/configuracion/roles/[id]/page.tsx` | Editar rol | `config.roles` |

```tsx
// (dashboard)/configuracion/usuarios/page.tsx
import { UsersList } from '@/presentation/components/features/usuarios/users-list';
import { UsersFilters } from '@/presentation/components/features/usuarios/users-filters';

export const metadata = {
  title: 'Usuarios | Configuración',
};

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus permisos
          </p>
        </div>
        <Button asChild>
          <Link href="/configuracion/usuarios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <UsersFilters />
      <UsersList />
    </div>
  );
}
```

```tsx
// (dashboard)/configuracion/usuarios/[id]/page.tsx
import { UserForm } from '@/presentation/components/features/usuarios/user-form';
import { UserPermissions } from '@/presentation/components/features/usuarios/user-permissions';
import { ChangeRoleDialog } from '@/presentation/components/features/usuarios/change-role-dialog';

export default function EditUserPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Editar Usuario</h1>
          <p className="text-muted-foreground">
            Modifica datos, rol y permisos especiales
          </p>
        </div>
        <ChangeRoleDialog userId={params.id} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserForm userId={params.id} />
        <UserPermissions userId={params.id} />
      </div>
    </div>
  );
}
```

```tsx
// (dashboard)/configuracion/roles/page.tsx
import { RolesList } from '@/presentation/components/features/roles/roles-list';
import { RolesMatrix } from '@/presentation/components/features/roles/roles-matrix';

export const metadata = {
  title: 'Roles | Configuración',
};

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles y Permisos</h1>
          <p className="text-muted-foreground">
            Administra roles del sistema y personalizados
          </p>
        </div>
        <Button asChild>
          <Link href="/configuracion/roles/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Link>
        </Button>
      </div>

      <RolesList />
      <RolesMatrix />
    </div>
  );
}
```

---

## 🛒 RUTAS E-COMMERCE - `(dashboard)/integraciones/ecommerce/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/integraciones/ecommerce` | `(dashboard)/integraciones/ecommerce/page.tsx` | Lista integraciones | `config.integraciones` |
| `/integraciones/ecommerce/nueva` | `(dashboard)/integraciones/ecommerce/nueva/page.tsx` | Conectar plataforma | `config.integraciones` |
| `/integraciones/ecommerce/:id` | `(dashboard)/integraciones/ecommerce/[id]/page.tsx` | Config integración | `config.integraciones` |
| `/integraciones/ecommerce/:id/mapeo` | `(dashboard)/integraciones/ecommerce/[id]/mapeo/page.tsx` | Mapear categorías | `config.integraciones` |
| `/integraciones/ecommerce/:id/productos` | `(dashboard)/integraciones/ecommerce/[id]/productos/page.tsx` | Productos sync | `config.integraciones` |
| `/integraciones/ecommerce/:id/pedidos` | `(dashboard)/integraciones/ecommerce/[id]/pedidos/page.tsx` | Pedidos importados | `config.integraciones` |

```tsx
// (dashboard)/integraciones/ecommerce/page.tsx
import { EcommerceList } from '@/presentation/components/features/ecommerce/ecommerce-list';
import { PlatformCards } from '@/presentation/components/features/ecommerce/platform-cards';

export const metadata = {
  title: 'E-commerce | Integraciones',
};

export default function EcommercePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integraciones E-commerce</h1>
        <p className="text-muted-foreground">
          Conecta tu tienda online para sincronizar productos y pedidos
        </p>
      </div>

      <EcommerceList />

      <div>
        <h2 className="text-lg font-semibold mb-4">Plataformas Disponibles</h2>
        <PlatformCards />
      </div>
    </div>
  );
}
```

```tsx
// (dashboard)/integraciones/ecommerce/[id]/page.tsx
import { EcommerceConfig } from '@/presentation/components/features/ecommerce/ecommerce-config';
import { SyncStatus } from '@/presentation/components/features/ecommerce/sync-status';
import { SyncActions } from '@/presentation/components/features/ecommerce/sync-actions';

export default function EcommerceDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <SyncStatus integrationId={params.id} />

      <div className="grid gap-6 md:grid-cols-2">
        <EcommerceConfig integrationId={params.id} />
        <SyncActions integrationId={params.id} />
      </div>
    </div>
  );
}
```

---

## 📋 RUTAS AUDITORÍA - `(dashboard)/configuracion/auditoria/`

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/configuracion/auditoria` | `(dashboard)/configuracion/auditoria/page.tsx` | Log de acciones | `config.auditoria` |
| `/configuracion/auditoria/:id` | `(dashboard)/configuracion/auditoria/[id]/page.tsx` | Detalle acción | `config.auditoria` |

```tsx
// (dashboard)/configuracion/auditoria/page.tsx
import { AuditLog } from '@/presentation/components/features/auditoria/audit-log';
import { AuditFilters } from '@/presentation/components/features/auditoria/audit-filters';
import { ExportAudit } from '@/presentation/components/features/auditoria/export-audit';

export const metadata = {
  title: 'Auditoría | Configuración',
};

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Auditoría</h1>
          <p className="text-muted-foreground">
            Registro de todas las acciones realizadas en el sistema
          </p>
        </div>
        <ExportAudit />
      </div>

      <AuditFilters />
      <AuditLog />
    </div>
  );
}
```

```tsx
// (dashboard)/configuracion/auditoria/[id]/page.tsx
import { AuditDetail } from '@/presentation/components/features/auditoria/audit-detail';
import { AuditChanges } from '@/presentation/components/features/auditoria/audit-changes';

export default function AuditDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Detalle de Acción</h1>
        <p className="text-muted-foreground">
          Información completa de la acción registrada
        </p>
      </div>

      <AuditDetail actionId={params.id} />
      <AuditChanges actionId={params.id} />
    </div>
  );
}
```

---

## 🔐 RUTAS SUPER ADMIN - `(super-admin)/`

> Estas rutas son EXCLUSIVAS para Super Administradores del SaaS (nosotros).
> Acceso vía `/super-admin/*` con autenticación especial.

### Layout Super Admin
```tsx
// (super-admin)/layout.tsx
import { SuperAdminGuard } from '@/presentation/components/common/super-admin-guard';
import { SuperAdminSidebar } from '@/presentation/components/layout/super-admin-sidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminGuard>
      <div className="min-h-screen flex">
        <SuperAdminSidebar />
        <main className="flex-1 p-6 overflow-auto bg-slate-50">
          {children}
        </main>
      </div>
    </SuperAdminGuard>
  );
}
```

| Ruta | Archivo | Descripción | Permisos |
|------|---------|-------------|----------|
| `/super-admin` | `(super-admin)/page.tsx` | Dashboard SaaS | Super Admin |
| `/super-admin/empresas` | `(super-admin)/empresas/page.tsx` | Todas las empresas | Super Admin |
| `/super-admin/empresas/:id` | `(super-admin)/empresas/[id]/page.tsx` | Detalle empresa | Super Admin |
| `/super-admin/planes` | `(super-admin)/planes/page.tsx` | Gestionar planes y precios | Super Admin |
| `/super-admin/planes/:id` | `(super-admin)/planes/[id]/page.tsx` | Editar plan | Super Admin |
| `/super-admin/addons` | `(super-admin)/addons/page.tsx` | Gestionar addons y precios | Super Admin |
| `/super-admin/addons/:id` | `(super-admin)/addons/[id]/page.tsx` | Editar addon | Super Admin |
| `/super-admin/suscripciones` | `(super-admin)/suscripciones/page.tsx` | Gestión suscripciones | Super Admin |
| `/super-admin/metricas` | `(super-admin)/metricas/page.tsx` | Métricas globales | Super Admin |
| `/super-admin/soporte` | `(super-admin)/soporte/page.tsx` | Tickets de soporte | Super Admin |

```tsx
// (super-admin)/page.tsx
import { SaaSMetrics } from '@/presentation/components/features/super-admin/saas-metrics';
import { RevenueChart } from '@/presentation/components/features/super-admin/revenue-chart';
import { RecentSignups } from '@/presentation/components/features/super-admin/recent-signups';
import { ActiveSubscriptions } from '@/presentation/components/features/super-admin/active-subscriptions';

export const metadata = {
  title: 'Dashboard | Super Admin',
};

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard SaaS</h1>
        <p className="text-muted-foreground">
          Métricas globales del sistema
        </p>
      </div>

      {/* KPIs globales */}
      <SaaSMetrics />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart />
        <ActiveSubscriptions />
      </div>

      {/* Recientes */}
      <RecentSignups />
    </div>
  );
}
```

```tsx
// (super-admin)/empresas/page.tsx
import { EmpresasList } from '@/presentation/components/features/super-admin/empresas-list';
import { EmpresasFilters } from '@/presentation/components/features/super-admin/empresas-filters';
import { ImpersonateDialog } from '@/presentation/components/features/super-admin/impersonate-dialog';

export const metadata = {
  title: 'Empresas | Super Admin',
};

export default function EmpresasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Todas las Empresas</h1>
          <p className="text-muted-foreground">
            Gestiona todos los clientes del SaaS
          </p>
        </div>
      </div>

      <EmpresasFilters />
      <EmpresasList />

      {/* Modal para impersonar */}
      <ImpersonateDialog />
    </div>
  );
}
```

```tsx
// (super-admin)/empresas/[id]/page.tsx
import { EmpresaDetail } from '@/presentation/components/features/super-admin/empresa-detail';
import { EmpresaSubscription } from '@/presentation/components/features/super-admin/empresa-subscription';
import { EmpresaUsage } from '@/presentation/components/features/super-admin/empresa-usage';
import { EmpresaActions } from '@/presentation/components/features/super-admin/empresa-actions';

export default function EmpresaDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <EmpresaDetail empresaId={params.id} />

      <div className="grid gap-6 md:grid-cols-2">
        <EmpresaSubscription empresaId={params.id} />
        <EmpresaUsage empresaId={params.id} />
      </div>

      <EmpresaActions empresaId={params.id} />
    </div>
  );
}
```

### SuperAdminGuard
```tsx
// presentation/components/common/super-admin-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/application/stores/auth.store';

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.rol !== 'super_admin')) {
      router.push('/login');
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user || user.rol !== 'super_admin') {
    return null;
  }

  return <>{children}</>;
}
```

### Super Admin Sidebar
```tsx
// presentation/components/layout/super-admin-sidebar.tsx
const superAdminMenuItems = [
  {
    title: 'Dashboard',
    items: [
      { href: '/super-admin', icon: LayoutDashboard, label: 'Resumen' },
      { href: '/super-admin/metricas', icon: BarChart, label: 'Métricas' },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { href: '/super-admin/empresas', icon: Building, label: 'Empresas' },
      { href: '/super-admin/suscripciones', icon: CreditCard, label: 'Suscripciones' },
    ],
  },
  {
    title: 'Precios',  // ⭐ NUEVA SECCIÓN
    items: [
      { href: '/super-admin/planes', icon: Package, label: 'Planes' },
      { href: '/super-admin/addons', icon: Puzzle, label: 'Addons' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { href: '/super-admin/soporte', icon: Headphones, label: 'Tickets' },
    ],
  },
];
```

---

## 🎨 ANIMACIONES (Framer Motion)

```tsx
// Configuración de animaciones base
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 },
};
```
