'use client';

/**
 * @file layout.tsx
 * @description Dashboard Layout - Responsive Mobile-First con Bottom Nav nativo
 */

import { useState, useEffect, useCallback } from 'react';
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
  Store,
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
  QrCode,
  FileSpreadsheet,
  Printer,
  Search,
  CreditCard,
  Crown,
  MoreHorizontal,
  Bell,
} from 'lucide-react';
import { useLogout } from '@/application/hooks/mutations/use-auth';
import { useAuthStore } from '@/application/stores/auth.store';
import { useThemeStore } from '@/application/stores/theme.store';
import { api } from '@/infrastructure/api/axios-instance';

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

const menuSections: MenuSection[] = [
  {
    title: 'Inicio',
    items: [
      { label: 'Resumen', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'supervisor'] },
      { label: 'Reportes', href: '/reportes', icon: BarChart3, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Vender',
    items: [
      { label: 'Caja', href: '/caja', icon: Calculator, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
      { label: 'Ventas', href: '/ventas', icon: ShoppingCart, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
      { label: 'Clientes', href: '/clientes', icon: Users, roles: ['super_admin', 'admin', 'supervisor', 'cajero'] },
    ],
  },
  {
    title: 'Productos',
    items: [
      { label: 'Mis Productos', href: '/productos', icon: Package, roles: ['super_admin', 'admin', 'supervisor', 'almacenero'] },
      { label: 'Categorias', href: '/catalogos/categorias', icon: FolderTree, roles: ['super_admin', 'admin', 'supervisor'] },
      { label: 'Marcas', href: '/catalogos/marcas', icon: Tag, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Control de Stock', href: '/inventario', icon: Warehouse, roles: ['super_admin', 'admin', 'supervisor', 'almacenero'] },
      { label: 'Promociones', href: '/promociones', icon: Sparkles, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Mi Negocio',
    items: [
      {
        label: 'Configuracion', href: '/configuracion', icon: Settings, roles: ['super_admin', 'admin'],
        submenu: [
          { label: 'Datos del Negocio', href: '/configuracion/negocio' },
          { label: 'Sucursales', href: '/configuracion/sucursales' },
          { label: 'Usuarios', href: '/configuracion/usuarios' },
          { label: 'Roles y Permisos', href: '/configuracion/roles' },
          { label: 'Formas de Pago', href: '/configuracion/metodos-pago' },
          { label: 'Facturacion', href: '/configuracion/facturacion' },
          { label: 'Impresion', href: '/configuracion/impresion' },
        ],
      },
      { label: 'Historial', href: '/auditoria', icon: Shield, roles: ['super_admin', 'admin'] },
      { label: 'Super Admin', href: '/superadmin', icon: Crown, roles: ['super_admin'] },
    ],
  },
  {
    title: 'Mi Trabajo',
    roles: ['vendedor'],
    items: [
      { label: 'Productos', href: '/productos', icon: Package, roles: ['vendedor'] },
      { label: 'Mis Ventas', href: '/ventas', icon: ShoppingCart, roles: ['vendedor'] },
      { label: 'Clientes', href: '/clientes', icon: Users, roles: ['vendedor'] },
    ],
  },
];

// Bottom nav items for mobile
const bottomNavItems = [
  { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { label: 'POS', href: '/pos', icon: Store, special: true },
  { label: 'Productos', href: '/productos', icon: Package },
  { label: 'Mas', href: '#more', icon: MoreHorizontal },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [stockAlerts, setStockAlerts] = useState(0);

  const logoutMutation = useLogout();
  const usuario = useAuthStore((state) => state.usuario);
  const { isDark, toggleTheme } = useThemeStore();

  // Fetch low stock alerts count
  useEffect(() => {
    api.get('/reportes/dashboard')
      .then((res) => {
        const alertas = res.data?.data?.alertas || res.data?.alertas;
        if (alertas) {
          setStockAlerts((alertas.stockBajo || 0) + (alertas.sinStock || 0));
        }
      })
      .catch(() => {});
  }, [pathname]);

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (!mobile && !sidebarOpen) setSidebarOpen(true);
    if (mobile && sidebarOpen) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  const userRol = (usuario?.rol?.codigo || 'vendedor') as RolCodigo;

  const canViewMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRol);
  };

  // PWA: only show essential menu items
  const pwaAllowedHrefs = ['/dashboard', '/ventas', '/caja', '/clientes', '/productos', '/inventario', '/catalogos/categorias', '/catalogos/marcas', '/configuracion', '/configuracion/negocio'];

  const filteredSections = menuSections
    .filter(section => {
      if (section.roles && !section.roles.includes(userRol)) return false;
      return true;
    })
    .map(section => ({
      ...section,
      items: section.items
        .filter(canViewMenuItem)
        .filter(item => !isPWA || pwaAllowedHrefs.includes(item.href))
        .map(item => isPWA ? { ...item, submenu: undefined } : item), // Remove submenus in PWA
    }))
    .filter(section => section.items.length > 0);

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-zinc-950' : 'bg-slate-50'}`}>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
        <div className={`h-16 flex items-center justify-between px-4 border-b flex-shrink-0 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
          {(sidebarOpen || isMobile) && (
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => isMobile && setSidebarOpen(false)}>
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>POS Shop</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            {sidebarOpen || isMobile ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {filteredSections.map((section, sectionIdx) => (
            <div key={section.title}>
              {(sidebarOpen || isMobile) && sectionIdx > 0 && (
                <div className={`px-3 pt-2 pb-1 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest">{section.title}</p>
                </div>
              )}
              {!sidebarOpen && !isMobile && sectionIdx > 0 && (
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
                              ? isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                              : isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon size={20} />
                          {(sidebarOpen || isMobile) && (
                            <>
                              <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                              <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => isMobile && setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                            isActive
                              ? isDark ? 'bg-purple-500/10 text-purple-400 shadow-lg shadow-purple-500/5' : 'bg-purple-50 text-purple-600'
                              : isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Icon size={20} />
                          {(sidebarOpen || isMobile) && <span className="font-medium text-sm">{item.label}</span>}
                        </Link>
                      )}

                      <AnimatePresence>
                        {hasSubmenu && isExpanded && (sidebarOpen || isMobile) && (
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
                                  onClick={() => isMobile && setSidebarOpen(false)}
                                  className={`block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    pathname === subitem.href
                                      ? isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                                      : isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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
        <div className={`flex-shrink-0 p-3 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
          <Link
            href="/pos"
            onClick={() => isMobile && setSidebarOpen(false)}
            className="mb-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
          >
            <ShoppingCart size={18} />
            {(sidebarOpen || isMobile) && <span>Abrir POS</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${
              isDark ? 'text-zinc-400 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            {logoutMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut size={20} />
            )}
            {(sidebarOpen || isMobile) && <span className="font-medium text-sm">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`transition-all duration-300 ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-20'} ${isMobile ? 'pb-20' : ''}`}>
        {/* Header */}
        <header className={`sticky top-0 z-40 h-14 md:h-16 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 ${
          isDark
            ? 'bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800'
            : 'bg-white/80 backdrop-blur-xl border-b border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-2 -ml-1 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <Menu size={22} />
              </button>
            )}
            <h1 className={`text-base md:text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {filteredSections.flatMap(s => s.items).find((item) => pathname.startsWith(item.href))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Stock Alerts Bell */}
            <Link
              href="/inventario/alertas"
              className={`relative p-2 md:p-2.5 rounded-lg transition-all duration-300 ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {stockAlerts > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold tabular ${stockAlerts >= 5 ? 'animate-stock-critical' : ''}`}>
                  {stockAlerts > 99 ? '99+' : stockAlerts}
                </span>
              )}
            </Link>

            <button
              onClick={toggleTheme}
              className={`p-2 md:p-2.5 rounded-lg transition-all duration-300 ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* User Info - compact on mobile */}
            <div className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-slate-100'}`}>
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

        {/* Page content */}
        <div className={`p-4 md:p-6 min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)] ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className={`fixed bottom-0 left-0 right-0 z-50 h-16 flex items-center justify-around px-2 safe-area-pb ${
          isDark
            ? 'bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800'
            : 'bg-white/95 backdrop-blur-xl border-t border-slate-200'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isMore = item.href === '#more';
            const isActive = !isMore && (pathname === item.href || pathname.startsWith(item.href + '/'));

            if (isMore) {
              return (
                <button
                  key={item.label}
                  onClick={() => setSidebarOpen(true)}
                  className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors ${
                    isDark ? 'text-zinc-500 active:text-zinc-300' : 'text-slate-400 active:text-slate-600'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            if (item.special) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-transform">
                    <Icon size={26} className="text-white" />
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors ${
                  isActive
                    ? isDark ? 'text-purple-400' : 'text-purple-600'
                    : isDark ? 'text-zinc-500 active:text-zinc-300' : 'text-slate-400 active:text-slate-600'
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-purple-500" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
