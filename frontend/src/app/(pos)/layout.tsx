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
import { motion, AnimatePresence } from '@/shared/motion';
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
  FileSpreadsheet,
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

interface MenuSection {
  title: string;
  roles?: RolCodigo[];
  items: MenuItem[];
}

// Menu organizado por secciones - SINCRONIZADO con dashboard layout
const menuSections: MenuSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Historial Ventas', href: '/ventas', icon: ShoppingCart, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
      { label: 'Caja', href: '/caja', icon: Calculator, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
      { label: 'Clientes', href: '/clientes', icon: Users, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', href: '/productos', icon: Package, roles: ['super_admin', 'admin', 'supervisor', 'almacenero'] },
      { label: 'Stock', href: '/inventario', icon: Warehouse, roles: ['super_admin', 'admin', 'supervisor', 'almacenero'] },
      {
        label: 'Catalogos', href: '/catalogos', icon: FolderTree,
        roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
        submenu: [
          { label: 'Categorias', href: '/catalogos/categorias' },
          { label: 'Marcas', href: '/catalogos/marcas' },
          { label: 'Atributos', href: '/catalogos/atributos' },
          { label: 'Unidades', href: '/catalogos/unidades-medida' },
        ],
      },
    ],
  },
  {
    title: 'Proveedores',
    items: [
      {
        label: 'Proveedores', href: '/proveedores', icon: Truck,
        roles: ['super_admin', 'admin', 'supervisor', 'almacenero'],
        submenu: [
          { label: 'Lista Proveedores', href: '/proveedores' },
          { label: 'Compras al Proveedor', href: '/compras' },
          { label: 'Pagos al Proveedor', href: '/pagos-proveedor' },
        ],
      },
    ],
  },
  {
    title: 'Negocio',
    items: [
      { label: 'Promociones', href: '/promociones', icon: Tag, roles: ['super_admin', 'admin', 'supervisor'] },
      { label: 'Reportes', href: '/reportes', icon: BarChart3, roles: ['super_admin', 'admin', 'supervisor'] },
      { label: 'Auditoria', href: '/auditoria', icon: Shield, roles: ['super_admin', 'admin'] },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        label: 'Configuracion', href: '/configuracion', icon: Settings,
        roles: ['super_admin', 'admin'],
        submenu: [
          { label: 'Empresa', href: '/configuracion/empresa' },
          { label: 'Sucursales', href: '/configuracion/sucursales' },
          { label: 'Usuarios', href: '/configuracion/usuarios' },
          { label: 'Roles', href: '/configuracion/roles' },
          { label: 'Metodos de Pago', href: '/configuracion/metodos-pago' },
          { label: 'Impresion', href: '/configuracion/impresion' },
          { label: 'Facturacion', href: '/configuracion/facturacion' },
        ],
      },
      { label: 'Super Admin', href: '/superadmin', icon: Crown, roles: ['super_admin'] },
    ],
  },
];

// Roles que ven el sidebar completo
const rolesConSidebar: RolCodigo[] = ['super_admin', 'admin', 'supervisor'];

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const logoutMutation = useLogout();
  const { data: usuario, isLoading } = useCurrentUser();
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Obtener el codigo del rol del usuario
  const userRol = (usuario?.rol?.codigo || 'vendedor') as RolCodigo;
  const mostrarSidebar = rolesConSidebar.includes(userRol);

  // Funcion para verificar si el usuario puede ver un item del menu
  const canViewMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRol);
  };

  // Filtrar secciones y sus items segun el rol
  const filteredSections = menuSections
    .filter(section => {
      if (section.roles && !section.roles.includes(userRol)) return false;
      return true;
    })
    .map(section => ({
      ...section,
      items: section.items.filter(canViewMenuItem),
    }))
    .filter(section => section.items.length > 0);

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
        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-[70] transition-all duration-300 flex flex-col ${
            isMobile
              ? `w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : sidebarOpen ? 'w-64' : 'w-20'
          } ${
            isDark
              ? 'bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800'
              : 'bg-white/95 backdrop-blur-xl border-r border-slate-200 shadow-lg'
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

          {/* Menu con secciones */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {filteredSections.map((section, sectionIdx) => (
              <div key={section.title}>
                {/* Titulo de seccion */}
                {sidebarOpen && sectionIdx > 0 && (
                  <div className={`px-3 pt-2 pb-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{section.title}</p>
                  </div>
                )}
                {!sidebarOpen && sectionIdx > 0 && (
                  <div className={`mx-3 my-1 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`} />
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenu === item.label;

                    return (
                      <div key={item.href + item.label}>
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
                              <div className={`ml-7 mt-1 space-y-1 border-l-2 pl-3 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
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
                </div>
              </div>
            ))}
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
            isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'
          }`}
        >
          {/* Header */}
          <header className={`sticky top-0 z-40 h-14 md:h-16 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 ${
            isDark
              ? 'bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800'
              : 'bg-white/80 backdrop-blur-xl border-b border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 -ml-1 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Menu size={22} />
                </button>
              )}
              <h1 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
              <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${
                isDark ? 'bg-zinc-800/50' : 'bg-slate-100'
              }`}>
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {usuario?.nombre} {usuario?.apellido}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    {usuario?.empresa?.nombre || 'Cargando...'}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base shadow-lg shadow-purple-500/20">
                  {usuario?.nombre?.charAt(0) || '?'}
                </div>
              </div>
            </div>
          </header>

          {/* Page content - El POS ocupa todo el espacio disponible */}
          <div className={`h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] ${
            isDark ? 'text-zinc-100' : 'text-slate-900'
          }`}>
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
