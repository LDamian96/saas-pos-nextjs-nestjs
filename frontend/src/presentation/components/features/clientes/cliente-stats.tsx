'use client';

/**
 * @file cliente-stats.tsx
 * @description Cards de estadisticas de clientes
 */

import { motion } from '@/shared/motion';
import { Users, UserCheck, UserX, CreditCard } from 'lucide-react';
import { useClienteEstadisticas } from '@/application/hooks/queries/use-clientes';
import { Card } from '@/presentation/components/ui/card';

export function ClienteStats() {
  const { data: stats, isLoading } = useClienteEstadisticas();

  const statCards = [
    {
      title: 'Total clientes',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Activos',
      value: stats?.activos ?? 0,
      icon: UserCheck,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Inactivos',
      value: stats?.inactivos ?? 0,
      icon: UserX,
      color: 'bg-gray-100 text-gray-600',
    },
    {
      title: 'Con credito',
      value: stats?.conCredito ?? 0,
      icon: CreditCard,
      color: 'bg-[#CCE9D5] text-[#00932C]',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
