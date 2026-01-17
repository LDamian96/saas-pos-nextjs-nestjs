'use client';

/**
 * @file page.tsx
 * @description Página principal del dashboard
 */

import { motion } from 'framer-motion';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';

const stats = [
  {
    label: 'Ventas Hoy',
    value: 'S/. 0.00',
    icon: DollarSign,
    color: 'bg-green-500',
  },
  {
    label: 'Transacciones',
    value: '0',
    icon: ShoppingCart,
    color: 'bg-blue-500',
  },
  {
    label: 'Productos',
    value: '0',
    icon: Package,
    color: 'bg-purple-500',
  },
  {
    label: 'Clientes',
    value: '0',
    icon: Users,
    color: 'bg-orange-500',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Placeholder content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Bienvenido a tu Sistema POS
        </h2>
        <p className="text-gray-600">
          Configura tu empresa y sucursales desde el menu de Configuracion para
          comenzar a usar el sistema.
        </p>
      </div>
    </div>
  );
}
