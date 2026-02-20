'use client';

/**
 * @file sidebar.tsx
 * @description Sidebar de navegacion principal del dashboard
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Folder,
  Tag,
  Palette,
  Package,
  Warehouse,
  Receipt,
  Calculator,
  Users,
  Percent,
  BarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/application/stores/auth.store';
import { useLogout, useCurrentUser } from '@/application/hooks/mutations/use-auth';
import { useState } from 'react';

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
  permission?: string;
  external?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard.ver' },
      { href: '/pos', icon: ShoppingCart, label: 'Punto de Venta', permission: 'ventas.crear', external: true },
    ],
  },
  {
    title: 'Catalogos',
    items: [
      { href: '/catalogos/categorias', icon: Folder, label: 'Categorias', permission: 'categorias.ver' },
      { href: '/catalogos/marcas', icon: Tag, label: 'Marcas', permission: 'categorias.ver' },
      { href: '/catalogos/atributos', icon: Palette, label: 'Atributos', permission: 'categorias.ver' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { href: '/productos', icon: Package, label: 'Productos', permission: 'productos.ver' },
      { href: '/inventario', icon: Warehouse, label: 'Stock', permission: 'inventario.ver' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { href: '/ventas', icon: Receipt, label: 'Historial', permission: 'ventas.ver' },
      { href: '/caja', icon: Calculator, label: 'Caja', permission: 'caja.abrir' },
      { href: '/clientes', icon: Users, label: 'Clientes', permission: 'clientes.ver' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/promociones', icon: Percent, label: 'Promociones', permission: 'admin' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { href: '/reportes', icon: BarChart, label: 'Reportes', permission: 'reportes.ventas' },
    ],
  },
  {
    title: 'Configuracion',
    items: [
      { href: '/configuracion', icon: Settings, label: 'Configuracion', permission: 'admin' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  // Usar useCurrentUser para obtener datos frescos del usuario
  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = useAuthStore();
  const logoutMutation = useLogout();
  const [collapsed, setCollapsed] = useState(false);

  // Usar el usuario del hook (más actualizado)
  const usuario = currentUser;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter((item) => {
      // Sin permiso requerido = visible para todos
      if (!item.permission) return true;

      // Admin y Super Admin ven TODO el menú
      const rolCodigo = usuario?.rol?.codigo;
      if (rolCodigo === 'admin' || rolCodigo === 'super_admin') {
        return true;
      }

      // Para otros roles, verificar permiso específico
      return usuario?.permisos?.includes(item.permission) || hasPermission(item.permission);
    });
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl text-gray-900">POS</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((section) => {
          const filteredItems = filterMenuItems(section.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1 px-2">
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                          'hover:bg-gray-100',
                          isActive && 'bg-blue-50 text-blue-600 font-medium',
                          !isActive && 'text-gray-700',
                          collapsed && 'justify-center'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-blue-600')} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        {!collapsed && usuario && (
          <div className="mb-3">
            <p className="font-medium text-gray-900 truncate">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="text-sm text-gray-500 truncate">{usuario.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg w-full',
            'text-red-600 hover:bg-red-50 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
      </div>
    </motion.aside>
  );
}
