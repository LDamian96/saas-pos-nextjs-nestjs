'use client';

/**
 * @file cliente-table.tsx
 * @description Tabla de clientes con acciones
 *
 * @references
 * - Service: ver application/services/cliente.service.ts
 * - API: ver docs/arquitectura/06-API-ENDPOINTS.md
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { Edit, Trash2, Users, Phone, Mail, CreditCard, Eye } from 'lucide-react';
import { useClientes } from '@/application/hooks/queries/use-clientes';
import { useDeleteCliente } from '@/application/hooks/mutations/use-clientes-mutations';
import { ClienteListItem, ClientesFilter } from '@/application/services/cliente.service';
import { Badge } from '@/presentation/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import Link from 'next/link';

interface Props {
  filters?: ClientesFilter;
  onEdit: (cliente: ClienteListItem) => void;
}

export function ClienteTable({ filters = {}, onEdit }: Props) {
  const { data, isLoading } = useClientes(filters);
  const deleteMutation = useDeleteCliente();
  const [clienteToDelete, setClienteToDelete] = useState<ClienteListItem | null>(null);

  const handleDelete = async () => {
    if (clienteToDelete) {
      await deleteMutation.mutateAsync(clienteToDelete.id);
      setClienteToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const clientes = data?.data || [];

  if (clientes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin clientes</h3>
        <p className="text-gray-500">Agrega tu primer cliente para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Documento</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Contacto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Credito</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente, index) => (
              <motion.tr
                key={cliente.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {cliente.nombre.charAt(0).toUpperCase()}
                        {cliente.apellido?.charAt(0).toUpperCase() || ''}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{cliente.nombreCompleto}</p>
                      {cliente.razonSocial && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">{cliente.razonSocial}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-xs text-gray-400 uppercase">{cliente.tipoDocumento || 'N/A'}</span>
                    <p className="text-gray-900">{cliente.numeroDocumento || '-'}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {cliente.telefono && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {cliente.telefono}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{cliente.email}</span>
                      </div>
                    )}
                    {!cliente.telefono && !cliente.email && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {cliente.tieneCredito ? (
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">
                        S/ {Number(cliente.limiteCredito).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Sin credito</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => onEdit(cliente)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setClienteToDelete(cliente)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Paginacion */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {clientes.length} de {data.meta.total} clientes
            </p>
            <p className="text-sm text-gray-500">
              Pagina {data.meta.page} de {data.meta.totalPages}
            </p>
          </div>
        )}
      </div>

      {/* Dialog de confirmacion de eliminacion */}
      <AlertDialog open={!!clienteToDelete} onOpenChange={() => setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de eliminar a <strong>{clienteToDelete?.nombreCompleto}</strong>?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Si, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
