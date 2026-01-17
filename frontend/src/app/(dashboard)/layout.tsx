'use client';

/**
 * @file layout.tsx
 * @description Layout del dashboard con sidebar y header
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { useLogout } from '@/application/hooks/mutations/use-auth';
import { useAuthStore } from '@/application/stores/auth.store';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Catalogos',
    href: '/catalogos',
    icon: FolderTree,
    submenu: [
      { label: 'Categorias', href: '/catalogos/categorias' },
      { label: 'Marcas', href: '/catalogos/marcas' },
      { label: 'Atributos', href: '/catalogos/atributos' },
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
  },
  {
    label: 'Ventas',
    href: '/ventas',
    icon: ShoppingCart,
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: BarChart3,
  },
  {
    label: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
    submenu: [
      { label: 'Empresa', href: '/configuracion/empresa' },
      { label: 'Sucursales', href: '/configuracion/sucursales' },
      { label: 'Usuarios', href: '/configuracion/usuarios' },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const logoutMutation = useLogout();
  const usuario = useAuthStore((state) => state.usuario);

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">POS SaaS</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu - scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenu === item.label;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={22} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-medium">
                          {item.label}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={22} />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isExpanded && sidebarOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-8 mt-1 space-y-1"
                  >
                    {item.submenu?.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === subitem.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {subitem.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t">
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {logoutMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut size={22} />
            )}
            {sidebarOpen && <span className="font-medium">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {menuItems.find((item) => pathname.startsWith(item.href))?.label ||
              'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {usuario?.nombre} {usuario?.apellido}
              </p>
              <p className="text-xs text-gray-500">
                {usuario?.empresa?.nombre || 'Cargando...'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {usuario?.nombre?.charAt(0) || '?'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
