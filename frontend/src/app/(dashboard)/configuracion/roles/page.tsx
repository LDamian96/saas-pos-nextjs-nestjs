'use client';

/**
 * @file page.tsx
 * @description Pagina de gestion de roles y permisos
 *
 * @references
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (CRUD /roles)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, ArrowLeft, Edit2, Trash2, Check, Users } from 'lucide-react';
import Link from 'next/link';
import { useRoles, usePermisos } from '@/application/hooks/queries/use-roles';
import {
  useCreateRol,
  useUpdateRol,
  useDeleteRol
} from '@/application/hooks/mutations/use-roles-mutations';
import type { Rol, CreateRolDto, UpdateRolDto, Permiso } from '@/application/services/roles.service';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

type FormMode = 'create' | 'edit' | null;

// Agrupar permisos por modulo
const groupPermisos = (permisos: Permiso[]) => {
  const groups: Record<string, Permiso[]> = {};
  permisos.forEach((permiso) => {
    const modulo = permiso.codigo.split('.')[0];
    if (!groups[modulo]) {
      groups[modulo] = [];
    }
    groups[modulo].push(permiso);
  });
  return groups;
};

const moduloLabels: Record<string, string> = {
  ventas: 'Ventas',
  productos: 'Productos',
  inventario: 'Inventario',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  compras: 'Compras',
  reportes: 'Reportes',
  config: 'Configuracion',
  caja: 'Caja',
};

export default function RolesPage() {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [deletingRol, setDeletingRol] = useState<Rol | null>(null);

  // Queries
  const { data: roles, isLoading } = useRoles();
  const { data: permisos } = usePermisos();

  // Mutations
  const createMutation = useCreateRol();
  const updateMutation = useUpdateRol();
  const deleteMutation = useDeleteRol();

  // Form state
  const [formData, setFormData] = useState<{
    nombre: string;
    descripcion: string;
    permisoIds: string[];
  }>({
    nombre: '',
    descripcion: '',
    permisoIds: [],
  });

  const handleOpenCreate = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      permisoIds: [],
    });
    setSelectedRol(null);
    setFormMode('create');
  };

  const handleOpenEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setFormData({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      permisoIds: rol.permisos?.map((p) => p.id) || [],
    });
    setFormMode('edit');
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setSelectedRol(null);
  };

  const handleTogglePermiso = (permisoId: string) => {
    setFormData((prev) => ({
      ...prev,
      permisoIds: prev.permisoIds.includes(permisoId)
        ? prev.permisoIds.filter((id) => id !== permisoId)
        : [...prev.permisoIds, permisoId],
    }));
  };

  const handleToggleModulo = (moduloPermisos: Permiso[]) => {
    const moduloIds = moduloPermisos.map((p) => p.id);
    const allSelected = moduloIds.every((id) => formData.permisoIds.includes(id));

    setFormData((prev) => ({
      ...prev,
      permisoIds: allSelected
        ? prev.permisoIds.filter((id) => !moduloIds.includes(id))
        : Array.from(new Set([...prev.permisoIds, ...moduloIds])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formMode === 'create') {
      const dto: CreateRolDto = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        permisoIds: formData.permisoIds,
      };
      await createMutation.mutateAsync(dto);
    } else if (formMode === 'edit' && selectedRol) {
      const dto: UpdateRolDto = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        permisoIds: formData.permisoIds,
      };
      await updateMutation.mutateAsync({ id: selectedRol.id, dto });
    }

    handleCloseForm();
  };

  const confirmDelete = async () => {
    if (deletingRol) {
      await deleteMutation.mutateAsync(deletingRol.id);
      setDeletingRol(null);
    }
  };

  const permisosGrouped = permisos ? permisos.porModulo : {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/configuracion"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              Roles y Permisos
            </h1>
            <p className="text-gray-500 mt-1">Define que puede hacer cada tipo de usuario</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          Nuevo Rol
        </button>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && roles?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-200 p-12 text-center"
        >
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin roles</h3>
          <p className="text-gray-500 mb-6">Crea tu primer rol para asignar permisos a usuarios</p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Crear Rol
          </button>
        </motion.div>
      )}

      {/* Roles Grid */}
      {!isLoading && roles && roles.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {roles.map((rol) => (
            <motion.div
              key={rol.id}
              variants={fadeInUp}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{rol.nombre}</h3>
                    {rol.descripcion && (
                      <p className="text-sm text-gray-500">{rol.descripcion}</p>
                    )}
                  </div>
                </div>

                {!rol.esSistema && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(rol)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setDeletingRol(rol)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  {rol.permisos?.length || 0} permisos
                </span>
                {rol.esSistema && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    Rol del sistema
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {formMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">
                {formMode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Rol
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Vendedor, Supervisor"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripcion (opcional)
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe las responsabilidades de este rol"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permisos
                  </label>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg p-4">
                    {Object.entries(permisosGrouped).map(([modulo, moduloPermisos]) => {
                      const allSelected = moduloPermisos.every((p) =>
                        formData.permisoIds.includes(p.id)
                      );
                      const someSelected = moduloPermisos.some((p) =>
                        formData.permisoIds.includes(p.id)
                      );

                      return (
                        <div key={modulo} className="border-b border-gray-100 pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              type="button"
                              onClick={() => handleToggleModulo(moduloPermisos)}
                              className="flex items-center gap-2 font-medium text-gray-900"
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  allSelected
                                    ? 'bg-purple-600 border-purple-600'
                                    : someSelected
                                    ? 'bg-purple-100 border-purple-600'
                                    : 'border-gray-300'
                                }`}
                              >
                                {allSelected && <Check className="h-3 w-3 text-white" />}
                                {someSelected && !allSelected && (
                                  <div className="w-2 h-2 bg-purple-600 rounded-sm" />
                                )}
                              </div>
                              {moduloLabels[modulo] || modulo}
                            </button>
                            <span className="text-xs text-gray-500">
                              {moduloPermisos.filter((p) => formData.permisoIds.includes(p.id)).length}/
                              {moduloPermisos.length}
                            </span>
                          </div>

                          <div className="ml-7 space-y-1">
                            {moduloPermisos.map((permiso) => (
                              <button
                                key={permiso.id}
                                type="button"
                                onClick={() => handleTogglePermiso(permiso.id)}
                                className="flex items-center gap-2 w-full text-left py-1 text-sm text-gray-600 hover:text-gray-900"
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    formData.permisoIds.includes(permiso.id)
                                      ? 'bg-purple-600 border-purple-600'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {formData.permisoIds.includes(permiso.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                {permiso.nombre}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending)
                      ? 'Guardando...'
                      : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingRol}
        onClose={() => setDeletingRol(null)}
        title="Eliminar Rol"
        description={`¿Estas seguro de eliminar el rol "${deletingRol?.nombre}"? Los usuarios con este rol quedaran sin permisos.`}
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
