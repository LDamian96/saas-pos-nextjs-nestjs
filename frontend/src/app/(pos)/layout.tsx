'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tag,
  Shield,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import { AuthGuard } from '@/presentation/components/common/auth-guard';
import { useLogout, useCurrentUser } from '@/application/hooks/mutations/use-auth';
import { useThemeStore } from '@/application/stores/theme.store';

type RolCodigo = 'super_admin' | 'admin' | 'supervisor' | 'cajero' | 'almacenero' | 'vendedor';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: RolCodigo[];
  submenu?: { label: string; href: string }[];
}
interface MenuSection { title: string; items: MenuItem[]; }

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
      { label: 'Categorías', href: '/catalogos/categorias', icon: FolderTree, roles: ['super_admin', 'admin', 'supervisor'] },
      { label: 'Marcas', href: '/catalogos/marcas', icon: Tag, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Control de stock', href: '/inventario', icon: Warehouse, roles: ['super_admin', 'admin', 'supervisor', 'almacenero'] },
      { label: 'Promociones', href: '/promociones', icon: Sparkles, roles: ['super_admin', 'admin', 'supervisor'] },
    ],
  },
  {
    title: 'Mi negocio',
    items: [
      {
        label: 'Configuración', href: '/configuracion', icon: Settings, roles: ['super_admin', 'admin'],
        submenu: [
          { label: 'Datos del negocio', href: '/configuracion/negocio' },
          { label: 'Sucursales', href: '/configuracion/sucursales' },
          { label: 'Usuarios', href: '/configuracion/usuarios' },
          { label: 'Roles y permisos', href: '/configuracion/roles' },
          { label: 'Formas de pago', href: '/configuracion/metodos-pago' },
          { label: 'Facturación', href: '/configuracion/facturacion' },
          { label: 'Impresión', href: '/configuracion/impresion' },
        ],
      },
      { label: 'Historial', href: '/auditoria', icon: Shield, roles: ['super_admin', 'admin'] },
      { label: 'Super admin', href: '/superadmin', icon: Crown, roles: ['super_admin'] },
    ],
  },
];

const rolesConSidebar: RolCodigo[] = ['super_admin', 'admin', 'supervisor'];

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="36" height="36" rx="9" fill="hsl(var(--brand))" />
      <path
        d="M9 12.5C9 11.1193 10.1193 10 11.5 10H22.5C25.5376 10 28 12.4624 28 15.5C28 18.5376 25.5376 21 22.5 21H14V25.5C14 26.3284 13.3284 27 12.5 27H11.5C10.1193 27 9 25.8807 9 24.5V12.5Z"
        fill="hsl(var(--accent))"
      />
      <circle cx="22" cy="15.5" r="1.5" fill="hsl(var(--brand))" />
    </svg>
  );
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const logoutMutation = useLogout();
  const { data: usuario, isLoading } = useCurrentUser();
  const { isDark, toggleTheme } = useThemeStore();

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setSidebarOpen(!mobile);
  }, []);

  useEffect(() => {
    setMounted(true);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  const userRol = (usuario?.rol?.codigo || 'vendedor') as RolCodigo;
  const mostrarSidebar = rolesConSidebar.includes(userRol);

  const filteredSections = useMemo(() => menuSections
    .map(s => ({ ...s, items: s.items.filter(i => !i.roles?.length || i.roles.includes(userRol)) }))
    .filter(s => s.items.length > 0), [userRol]);

  const userInitial = usuario?.nombre?.charAt(0)?.toUpperCase() || '·';

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* — Vendedor / Cajero: POS limpio con mini-topbar — */
  if (!mostrarSidebar) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-surface flex flex-col">
          <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 glass border-b border-border/60 sticky top-0 z-40">
            <div className="flex items-center gap-2.5">
              <BrandMark size={28} />
              <div className="leading-tight">
                <p className="font-display font-semibold text-sm text-ink">POS Shop</p>
                <p className="caps text-[9px]">{usuario?.empresa?.nombre || 'Mi negocio'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                className="p-2 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
              >
                {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
              </button>
              <div className="flex items-center gap-2 pl-2">
                <span className="text-body-s font-medium text-ink hidden sm:inline">{usuario?.nombre}</span>
                <div className="w-8 h-8 rounded-sm bg-brand text-brand-foreground font-display font-semibold text-xs flex items-center justify-center">
                  {userInitial}
                </div>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                aria-label="Cerrar sesión"
                className="ml-1 p-2 rounded-sm text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                {logoutMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <LogOut size={18} strokeWidth={1.75} />}
              </button>
            </div>
          </header>
          <div className="flex-1">{children}</div>
        </div>
      </AuthGuard>
    );
  }

  /* — Admin/Supervisor: mismo shell que dashboard, con "Cerrar POS" — */
  const sidebarWidth = isMobile ? 280 : sidebarOpen ? 256 : 72;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface text-ink">
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] glass-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <aside
          style={{ width: sidebarWidth }}
          className={`fixed inset-y-0 left-0 z-[70] flex flex-col bg-surface-2 border-r border-border transition-[width,transform] duration-300 ease-out-quart
            ${isMobile ? (sidebarOpen ? 'translate-x-0 shadow-3' : '-translate-x-full') : 'translate-x-0'}
          `}
        >
          <div className="h-16 flex items-center justify-between px-3 border-b border-border flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <BrandMark size={32} />
              {(sidebarOpen || isMobile) && (
                <div className="min-w-0 flex flex-col leading-tight">
                  <span className="font-display font-bold text-[15px] tracking-tight text-ink truncate">POS Shop</span>
                  <span className="caps text-[9px]">{usuario?.empresa?.nombre || 'Mi negocio'}</span>
                </div>
              )}
            </Link>
            {!isMobile && (
              <button
                onClick={() => setSidebarOpen(v => !v)}
                aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
                className="p-1.5 rounded-sm text-ink-muted hover:bg-surface-3 hover:text-ink transition-colors"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
            {filteredSections.map((section, idx) => (
              <div key={section.title}>
                {(sidebarOpen || isMobile) && (
                  <p className="caps px-3 mb-1.5 select-none">{section.title}</p>
                )}
                {!sidebarOpen && !isMobile && idx > 0 && (
                  <div className="mx-3 my-2 border-t border-border" />
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const hasSubmenu = !!item.submenu?.length;
                    const isExpanded = expandedMenu === item.label;

                    const baseRow = `relative flex items-center gap-3 px-3 h-10 rounded-sm text-body-m font-medium transition-colors
                      ${isActive ? 'text-ink bg-surface-3' : 'text-ink-muted hover:text-ink hover:bg-surface-3/60'}`;

                    return (
                      <li key={item.href + item.label}>
                        {hasSubmenu ? (
                          <button onClick={() => setExpandedMenu(isExpanded ? null : item.label)} className={`${baseRow} w-full text-left`}>
                            {isActive && <span aria-hidden className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r bg-accent" />}
                            <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
                            {(sidebarOpen || isMobile) && (
                              <>
                                <span className="flex-1 truncate">{item.label}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </button>
                        ) : (
                          <Link href={item.href} onClick={() => isMobile && setSidebarOpen(false)} className={baseRow} title={!sidebarOpen && !isMobile ? item.label : undefined}>
                            {isActive && <span aria-hidden className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r bg-accent" />}
                            <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
                            {(sidebarOpen || isMobile) && <span className="truncate">{item.label}</span>}
                          </Link>
                        )}
                        <AnimatePresence>
                          {hasSubmenu && isExpanded && (sidebarOpen || isMobile) && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden ml-5 mt-0.5 border-l border-border"
                            >
                              {item.submenu!.map((sub) => {
                                const subActive = pathname === sub.href;
                                return (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      onClick={() => isMobile && setSidebarOpen(false)}
                                      className={`relative block pl-4 pr-3 h-9 leading-[2.25rem] text-body-s transition-colors
                                        ${subActive ? 'text-ink' : 'text-ink-muted hover:text-ink'}
                                      `}
                                    >
                                      {subActive && <span aria-hidden className="absolute left-[-1px] top-2 bottom-2 w-[2px] bg-accent" />}
                                      {sub.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="flex-shrink-0 p-3 border-t border-border space-y-1.5">
            <Link
              href="/dashboard"
              onClick={() => isMobile && setSidebarOpen(false)}
              className="flex items-center justify-center gap-2 h-11 rounded-sm border border-border bg-surface-2 hover:bg-surface-3 text-ink font-medium text-body-m transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={2} />
              {(sidebarOpen || isMobile) && <span>Salir del POS</span>}
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-sm text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
            >
              {logoutMutation.isPending
                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <LogOut size={18} strokeWidth={1.75} />}
              {(sidebarOpen || isMobile) && <span className="font-medium text-body-s">Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        <main
          style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
          className="transition-[margin] duration-300 ease-out-quart"
        >
          <header className="sticky top-0 z-40 h-14 md:h-16 flex items-center justify-between gap-3 px-4 md:px-6 glass border-b border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir menú"
                  className="p-2 -ml-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
                >
                  <Menu size={20} />
                </button>
              )}
              <h1 className="font-display font-semibold text-base md:text-lg tracking-tight text-ink truncate">
                Punto de venta
              </h1>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={toggleTheme}
                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                className="p-2 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDark ? 'sun' : 'moon'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="block"
                  >
                    {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
                  </motion.span>
                </AnimatePresence>
              </button>
              <div className="flex items-center gap-2 pl-2 md:pl-3">
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-body-s font-semibold text-ink truncate max-w-[150px]">{usuario?.nombre} {usuario?.apellido}</p>
                  <p className="text-[11px] text-ink-muted truncate max-w-[150px]">{usuario?.empresa?.nombre || '—'}</p>
                </div>
                <div className="w-9 h-9 rounded-sm bg-brand text-brand-foreground font-display font-semibold text-sm flex items-center justify-center select-none">
                  {userInitial}
                </div>
              </div>
            </div>
          </header>

          <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
