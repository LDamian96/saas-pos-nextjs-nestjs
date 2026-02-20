/**
 * @file (pos)/layout.tsx
 * @description Layout para el Punto de Venta
 * - Admin/Super Admin/Supervisor: Muestra el mismo sidebar del dashboard
 * - Vendedor/Cajero: Solo POS (sin sidebar)
 *
 * @references
 * - Rutas: docs/arquitectura/07-FRONTEND-RUTAS.md
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  FolderTree,
  Warehouse,
  Sun,
  Moon,
  Calculator,
  Sparkles,
  Truck,
  Tag,
  Wallet,
  Shield,
  ClipboardList,
  Crown,
} from 'lucide-react';
import { AuthGuard } from '@/presentation/components/common/auth-guard';
import { useLogout, useCurrentUser } from '@/application/hooks/mutations/use-auth';
import { useThemeStore } from '@/application/stores/theme.store';

// Roles del sistema con niveles de jerarquia
type RolCodigo = 'super_admin' | 'admin' | 'supervisor' | 'cajero' | 'almacenero' | 'vendedor';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: RolCodigo[];
  submenu?: { label: string; href: string; roles?: RolCodigo[] }[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Catalogos',
    href: '/catalogos',
    icon: FolderTree,
    roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
    submenu: [
      { label: 'Categorias', href: '/catalogos/categorias' },
      { label: 'Marcas', href: '/catalogos/marcas' },
      { label: 'Atributos', href: '/catalogos/atributos' },
      { label: 'Unidades', href: '/catalogos/unidades-medida' },
    ],
  },
  {
    label: 'Productos',
    href: '/productos',
    icon: Package,
  },
  {
    label: 'Inventario',
    href: '/inventario',
    icon: Warehouse,
    roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
  },
  {
    label: 'Ventas',
    href: '/ventas',
    icon: ShoppingCart,
    roles: ['super_admin', 'admin', 'supervisor', 'cajero', 'vendedor'],
    submenu: [
      { label: 'Historial', href: '/ventas' },
      { label: 'Caja', href: '/caja' },
      { label: 'Clientes', href: '/clientes' },
    ],
  },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: Truck,
    roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
    submenu: [
      { label: 'Lista Proveedores', href: '/proveedores' },
      { label: 'Compras', href: '/compras' },
      { label: 'Pagos', href: '/pagos-proveedor' },
    ],
  },
  {
    label: 'Promociones',
    href: '/promociones',
    icon: Tag,
    roles: ['super_admin', 'admin', 'supervisor'],
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
  },
  {
    label: 'Auditoria',
    href: '/auditoria',
    icon: Shield,
    roles: ['super_admin', 'admin'],
  },
  {
    label: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    submenu: [
      { label: 'Empresa', href: '/configuracion/empresa' },
      { label: 'Sucursales', href: '/configuracion/sucursales' },
      { label: 'Usuarios', href: '/configuracion/usuarios' },
      { label: 'Roles', href: '/configuracion/roles' },
      { label: 'Importar/Exportar', href: '/configuracion/importar-exportar' },
      { label: 'Impresion', href: '/configuracion/impresion' },
      { label: 'QR Productos', href: '/configuracion/qr-productos' },
      { label: 'Landing Page', href: '/configuracion/landing' },
      { label: 'SEO', href: '/configuracion/seo' },
      { label: 'Metodos de Pago', href: '/configuracion/metodos-pago' },
      { label: 'Planes y Facturacion', href: '/configuracion/billing' },
    ],
  },
  {
    label: 'Super Admin',
    href: '/superadmin',
    icon: Crown,
    roles: ['super_admin'],
  },
];

// Roles que ven el sidebar completo
const rolesConSidebar: RolCodigo[] = ['super_admin', 'admin', 'supervisor'];

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const logoutMutation = useLogout();
  const { data: usuario, isLoading } = useCurrentUser();
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Obtener el codigo del rol del usuario
  const userRol = (usuario?.rol?.codigo || 'vendedor') as RolCodigo;
  const mostrarSidebar = rolesConSidebar.includes(userRol);

  // Funcion para verificar si el usuario puede ver un item del menu
  const canViewMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRol);
  };

  // Filtrar items del menu segun el rol
  const filteredMenuItems = menuItems.filter(canViewMenuItem);

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Vendedor/Cajero: Solo POS sin sidebar
  if (!mostrarSidebar) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">{children}</div>
      </AuthGuard>
    );
  }

  // Admin/Super Admin/Supervisor: POS con sidebar completo (igual al dashboard)
  return (
    <AuthGuard>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-zinc-950' : 'bg-slate-50'
      }`}>
        {/* Sidebar - IGUAL AL DEL DASHBOARD */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 flex flex-col ${
            sidebarOpen ? 'w-64' : 'w-20'
          } ${
            isDark
              ? 'bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800'
              : 'bg-white/80 backdrop-blur-xl border-r border-slate-200 shadow-lg'
          }`}
        >
          {/* Logo */}
          <div className={`h-16 flex items-center justify-between px-4 border-b flex-shrink-0 ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            {sidebarOpen && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  POS SaaS
                </span>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-zinc-800 text-zinc-400'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenu === item.label;

              return (
                <div key={item.href}>
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? isDark
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-purple-50 text-purple-600'
                          : isDark
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={20} />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left font-medium text-sm">
                            {item.label}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? isDark
                            ? 'bg-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/5'
                            : 'bg-purple-50 text-purple-600'
                          : isDark
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={20} />
                      {sidebarOpen && (
                        <span className="font-medium text-sm">{item.label}</span>
                      )}
                    </Link>
                  )}

                  {/* Submenu */}
                  <AnimatePresence>
                    {hasSubmenu && isExpanded && sidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-7 mt-1 space-y-1 border-l-2 border-zinc-800 pl-3">
                          {item.submenu?.map((subitem) => (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                pathname === subitem.href
                                  ? isDark
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-purple-50 text-purple-600'
                                  : isDark
                                    ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className={`flex-shrink-0 p-3 border-t ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            {/* Cerrar POS */}
            <Link
              href="/dashboard"
              className="mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
            >
              <X size={18} />
              {sidebarOpen && <span>Cerrar POS</span>}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                isDark
                  ? 'text-zinc-400 hover:bg-red-500/10 hover:text-red-400'
                  : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              {logoutMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={20} />
              )}
              {sidebarOpen && <span className="font-medium text-sm">Cerrar Sesion</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={`transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
        >
          {/* Header */}
          <header className={`sticky top-0 z-40 h-16 flex items-center justify-between px-6 transition-colors duration-300 ${
            isDark
              ? 'bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800'
              : 'bg-white/80 backdrop-blur-xl border-b border-slate-200'
          }`}>
            <div>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Punto de Venta
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* User Info */}
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isDark ? 'bg-zinc-800/50' : 'bg-slate-100'
              }`}>
                <div className="text-right">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {usuario?.nombre} {usuario?.apellido}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {usuario?.empresa?.nombre || 'Cargando...'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-purple-500/20">
                  {usuario?.nombre?.charAt(0) || '?'}
                </div>
              </div>
            </div>
          </header>

          {/* Page content - El POS ocupa todo el espacio disponible */}
          <div className={`h-[calc(100vh-4rem)] ${
            isDark ? 'text-zinc-100' : 'text-slate-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
