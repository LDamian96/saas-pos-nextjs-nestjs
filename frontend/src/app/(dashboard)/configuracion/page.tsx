'use client';

/**
 * @file page.tsx
 * @description Índice de configuración
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, Store, Users, Shield, CreditCard, Printer } from 'lucide-react';

const configItems = [
  {
    href: '/configuracion/empresa',
    icon: Building2,
    title: 'Empresa',
    description: 'Datos de tu empresa, logo y colores',
    color: 'bg-blue-500',
  },
  {
    href: '/configuracion/sucursales',
    icon: Store,
    title: 'Sucursales',
    description: 'Gestiona tus locales y almacenes',
    color: 'bg-green-500',
  },
  {
    href: '/configuracion/usuarios',
    icon: Users,
    title: 'Usuarios',
    description: 'Administra empleados y accesos',
    color: 'bg-purple-500',
  },
  {
    href: '/configuracion/roles',
    icon: Shield,
    title: 'Roles',
    description: 'Permisos y niveles de acceso',
    color: 'bg-orange-500',
  },
  {
    href: '/configuracion/metodos-pago',
    icon: CreditCard,
    title: 'Metodos de Pago',
    description: 'Formas de pago aceptadas',
    color: 'bg-pink-500',
  },
  {
    href: '/configuracion/impresion',
    icon: Printer,
    title: 'Impresion',
    description: 'Configurar tickets y facturas',
    color: 'bg-cyan-500',
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-500 mt-1">
          Personaliza tu sistema segun las necesidades de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`${item.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
