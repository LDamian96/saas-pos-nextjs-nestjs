'use client';

/**
 * @file page.tsx
 * @description Página de gestión de clientes
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  CreditCard,
  X,
  UserCheck,
  UserX,
  Star,
} from 'lucide-react';
import { useClientes, useClienteEstadisticas } from '@/application/hooks/queries/use-clientes';
import { useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/application/hooks/mutations/use-clientes-mutations';
import { ClienteListItem, CreateClienteDto, UpdateClienteDto } from '@/application/services/cliente.service';

export default function ClientesPage() {
  const [filters, setFilters] = useState({
    search: '',
    tipoDocumento: '',
    tieneCredito: undefined as boolean | undefined,
    activo: true as boolean | undefined,
    page: 1,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteListItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<ClienteListItem | null>(null);

  const { data: clientes, isLoading } = useClientes({
    ...filters,
    limit: 20,
  });

  const { data: estadisticas } = useClienteEstadisticas();

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [formData, setFormData] = useState<CreateClienteDto>({
    nombre: '',
    apellido: '',
    tipoDocumento: 'dni',
    numeroDocumento: '',
    email: '',
    telefono: '',
    celular: '',
    direccion: '',
    tieneCredito: false,
    limiteCredito: 0,
    notas: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount);
  };

  const handleOpenCreate = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      apellido: '',
      tipoDocumento: 'dni',
      numeroDocumento: '',
      email: '',
      telefono: '',
      celular: '',
      direccion: '',
      tieneCredito: false,
      limiteCredito: 0,
      notas: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cliente: ClienteListItem) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      tipoDocumento: (cliente.tipoDocumento as any) || 'dni',
      numeroDocumento: cliente.numeroDocumento || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      celular: cliente.celular || '',
      direccion: cliente.direccion || '',
      tieneCredito: cliente.tieneCredito,
      limiteCredito: cliente.limiteCredito,
      notas: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) return;

    try {
      if (editingCliente) {
        await updateCliente.mutateAsync({
          id: editingCliente.id,
          dto: formData as UpdateClienteDto,
        });
      } else {
        await createCliente.mutateAsync(formData);
      }
      setShowModal(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteCliente.mutateAsync(showDeleteModal.id);
      setShowDeleteModal(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getNivelBadge = (nivel: string) => {
    const colors: Record<string, string> = {
      regular: 'bg-gray-100 text-gray-700',
      plata: 'bg-slate-100 text-slate-700',
      oro: 'bg-yellow-100 text-yellow-700',
      platino: 'bg-purple-100 text-purple-700',
    };
    return colors[nivel] || colors.regular;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Clientes
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tu base de clientes</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </motion.div>

      {/* Stats */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">Activos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{estadisticas.activos}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-500">Con credito</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{estadisticas.conCredito}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-gray-500">Ventas totales</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(estadisticas.montoTotalVentas)}</p>
          </motion.div>
        </div>
      )}

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Buscar por nombre, documento..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={filters.tipoDocumento}
            onChange={(e) => setFilters({ ...filters, tipoDocumento: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="dni">DNI</option>
            <option value="ruc">RUC</option>
            <option value="pasaporte">Pasaporte</option>
            <option value="ce">C. Extranjeria</option>
          </select>

          <select
            value={filters.tieneCredito === undefined ? '' : String(filters.tieneCredito)}
            onChange={(e) => setFilters({
              ...filters,
              tieneCredito: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="true">Con credito</option>
            <option value="false">Sin credito</option>
          </select>

          <select
            value={filters.activo === undefined ? '' : String(filters.activo)}
            onChange={(e) => setFilters({
              ...filters,
              activo: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1,
            })}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </motion.div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !clientes?.data?.length ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No hay clientes registrados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Nivel
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Compras
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Credito
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientes.data.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{cliente.nombreCompleto}</p>
                        <p className="text-sm text-gray-500">{cliente.codigo}</p>
                      </td>
                      <td className="px-4 py-3">
                        {cliente.numeroDocumento ? (
                          <div>
                            <p className="text-gray-900">{cliente.numeroDocumento}</p>
                            <p className="text-xs text-gray-500 uppercase">{cliente.tipoDocumento}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {cliente.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                          )}
                          {(cliente.telefono || cliente.celular) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {cliente.celular || cliente.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getNivelBadge(cliente.nivelCliente)}`}>
                          {cliente.nivelCliente}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(cliente.montoTotalCompras)}</p>
                        <p className="text-xs text-gray-500">{cliente.totalCompras} compras</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cliente.tieneCredito ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              <CreditCard className="h-3 w-3" />
                              Si
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              Limite: {formatCurrency(cliente.limiteCredito)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/clientes/${cliente.id}`}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(cliente)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(cliente)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {clientes.meta && clientes.meta.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Mostrando {((filters.page - 1) * 20) + 1} - {Math.min(filters.page * 20, clientes.meta.total)} de {clientes.meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Pagina {filters.page} de {clientes.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= clientes.meta.totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCliente ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Nombre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Apellido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo documento</label>
                <select
                  value={formData.tipoDocumento}
                  onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="dni">DNI</option>
                  <option value="ruc">RUC</option>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="ce">Carnet Extranjeria</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero documento</label>
                <input
                  type="text"
                  value={formData.numeroDocumento}
                  onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="01-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="987654321"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Av. Principal 123"
                />
              </div>

              <div className="md:col-span-2 border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tieneCredito}
                    onChange={(e) => setFormData({ ...formData, tieneCredito: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Tiene credito</span>
                </label>
              </div>

              {formData.tieneCredito && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite de credito</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.limiteCredito}
                    onChange={(e) => setFormData({ ...formData, limiteCredito: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.nombre.trim() || createCliente.isPending || updateCliente.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createCliente.isPending || updateCliente.isPending
                  ? 'Guardando...'
                  : editingCliente
                  ? 'Actualizar'
                  : 'Crear'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Eliminar cliente</h3>
            </div>
            <p className="text-gray-500 mb-4">
              ¿Estas seguro de eliminar a <strong>{showDeleteModal.nombreCompleto}</strong>?
              Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteCliente.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteCliente.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
