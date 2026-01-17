'use client';

/**
 * @file page.tsx
 * @description Página de detalle de cliente
 */

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingBag,
  Star,
  Edit,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useCliente } from '@/application/hooks/queries/use-clientes';

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: cliente, isLoading, error } = useCliente(id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const getNivelBadge = (nivel: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      regular: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Regular' },
      plata: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Plata' },
      oro: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Oro' },
      platino: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Platino' },
    };
    return config[nivel] || config.regular;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-500">No se pudo cargar el cliente</p>
        <Link href="/clientes" className="mt-4 text-blue-600 hover:underline">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const nivelConfig = getNivelBadge(cliente.nivelCliente);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/clientes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <User className="h-8 w-8 text-blue-600" />
              {cliente.nombreCompleto}
            </h1>
            <p className="text-gray-500 mt-1">
              {cliente.codigo} - Cliente desde {format(new Date(cliente.createdAt), "MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${nivelConfig.bg} ${nivelConfig.text}`}>
            <Star className="h-4 w-4" />
            {nivelConfig.label}
          </span>
          <Link
            href={`/clientes?edit=${cliente.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos personales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion personal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cliente.tipoDocumento && cliente.numeroDocumento && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{cliente.tipoDocumento.toUpperCase()}</p>
                    <p className="font-medium text-gray-900">{cliente.numeroDocumento}</p>
                  </div>
                </div>
              )}

              {cliente.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{cliente.email}</p>
                  </div>
                </div>
              )}

              {(cliente.telefono || cliente.celular) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium text-gray-900">{cliente.celular || cliente.telefono}</p>
                  </div>
                </div>
              )}

              {cliente.direccion && (
                <div className="flex items-start gap-3 col-span-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Direccion</p>
                    <p className="font-medium text-gray-900">{cliente.direccion}</p>
                    {(cliente.departamento || cliente.provincia || cliente.distrito) && (
                      <p className="text-sm text-gray-500">
                        {[cliente.distrito, cliente.provincia, cliente.departamento].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {cliente.fechaNacimiento && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nacimiento</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(cliente.fechaNacimiento), "d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {cliente.notas && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Notas:</strong> {cliente.notas}
                </p>
              </div>
            )}
          </motion.div>

          {/* Estadísticas de compras */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gray-500" />
              Historial de compras
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Total compras</p>
                <p className="text-2xl font-bold text-blue-900">{cliente.totalCompras}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Monto total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(cliente.montoTotalCompras)}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600">Puntos</p>
                <p className="text-2xl font-bold text-yellow-900">{cliente.puntosAcumulados}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600">Ultima compra</p>
                <p className="text-lg font-bold text-purple-900">
                  {cliente.ultimaCompra
                    ? format(new Date(cliente.ultimaCompra), "d MMM yyyy", { locale: es })
                    : 'Sin compras'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-6">
          {/* Crédito */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              Credito
            </h2>

            {cliente.tieneCredito ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Estado</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Habilitado
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Limite</span>
                  <span className="font-medium text-gray-900">{formatCurrency(cliente.limiteCredito)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Deuda actual</span>
                  <span className={`font-medium ${cliente.saldoCredito > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(cliente.saldoCredito)}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Disponible</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(cliente.limiteCredito - cliente.saldoCredito)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Este cliente no tiene credito habilitado</p>
              </div>
            )}
          </motion.div>

          {/* Estado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-xl border p-6 ${cliente.activo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${cliente.activo ? 'bg-green-100' : 'bg-red-100'}`}>
                <User className={`h-5 w-5 ${cliente.activo ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className={`font-medium ${cliente.activo ? 'text-green-900' : 'text-red-900'}`}>
                  Cliente {cliente.activo ? 'activo' : 'inactivo'}
                </p>
                <p className={`text-sm ${cliente.activo ? 'text-green-600' : 'text-red-600'}`}>
                  {cliente.activo ? 'Puede realizar compras' : 'No puede realizar compras'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
