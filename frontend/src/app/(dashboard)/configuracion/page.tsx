'use client';

import Link from 'next/link';
import { motion } from '@/shared/motion';
import {
  Building2,
  Store,
  Users,
  CreditCard,
  ChevronRight,
  Shield,
  Receipt,
} from 'lucide-react';

const configSections = [
  {
    title: 'Tu Negocio',
    items: [
      {
        href: '/configuracion/negocio',
        icon: Building2,
        title: 'Datos del Negocio',
        description: 'Nombre, RUC, direccion, comprobantes',
        color: 'from-blue-500 to-indigo-600',
        featured: true,
      },
      {
        href: '/configuracion/sucursales',
        icon: Store,
        title: 'Tus Locales',
        description: 'Sucursales y almacenes',
        color: 'from-green-500 to-emerald-600',
      },
    ],
  },
  {
    title: 'Como Cobras',
    items: [
      {
        href: '/configuracion/metodos-pago',
        icon: CreditCard,
        title: 'Formas de Pago',
        description: 'Efectivo, Yape, Plin, tarjeta y mas',
        color: 'from-purple-500 to-pink-600',
      },
      {
        href: '/configuracion/facturacion',
        icon: Receipt,
        title: 'Facturacion',
        description: 'Boletas, facturas y Nubefact',
        color: 'from-amber-500 to-orange-600',
      },
    ],
  },
  {
    title: 'Tu Equipo',
    items: [
      {
        href: '/configuracion/usuarios',
        icon: Users,
        title: 'Empleados',
        description: 'Agrega cajeros, vendedores y mas',
        color: 'from-orange-500 to-red-600',
      },
      {
        href: '/configuracion/roles',
        icon: Shield,
        title: 'Roles y Permisos',
        description: 'Que puede hacer cada empleado',
        color: 'from-cyan-500 to-blue-600',
      },
    ],
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="max-w-lg mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl md:text-2xl font-bold mb-1">Configuracion</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">Ajusta tu negocio a tu medida</p>
      </motion.div>

      <div className="space-y-6">
        {configSections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.1 }}
          >
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
              {section.title}
            </p>
            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl transition-all active:scale-[0.98] ${
                      item.featured
                        ? 'bg-gradient-to-r ' + item.color + ' p-5 text-white shadow-lg'
                        : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        item.featured
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br ' + item.color + ' shadow-lg'
                      }`}>
                        <Icon className={`h-6 w-6 ${item.featured ? 'text-white' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${item.featured ? 'text-white text-lg' : ''}`}>
                          {item.title}
                        </p>
                        <p className={`text-sm mt-0.5 ${
                          item.featured ? 'text-white/80' : 'text-gray-400 dark:text-zinc-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className={`h-5 w-5 shrink-0 ${
                        item.featured ? 'text-white/60' : 'text-gray-300 dark:text-zinc-600'
                      }`} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
