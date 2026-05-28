'use client';

/**
 * @file page.tsx
 * @description Página de Categorías - CRUD completo con jerarquía y atributos
 *
 * @references
 * - Backend: ver backend/src/presentation/http/controllers/categoria.controller.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: CATEGORÍAS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: categorias, categoria_atributos)
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useState, useMemo, Fragment } from 'react';
import { motion } from '@/shared/motion';
import { Plus, Search, Edit, Trash2, FolderOpen, ChevronRight, Tags, FolderPlus } from 'lucide-react';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useDeleteCategoria } from '@/application/hooks/mutations/use-categorias';
import { Categoria } from '@/application/services/categorias.service';
import { CategoriaFormDialog } from './components/categoria-form-dialog';
import { CategoriaAtributosDialog } from './components/categoria-atributos-dialog';
import { ConfirmDialog } from '@/presentation/components/common/confirm-dialog';

// Tipo para categoría con subcategorías
interface CategoriaConHijos extends Categoria {
  subcategorias: Categoria[];
}

export default function CategoriasPage() {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [deletingCategoria, setDeletingCategoria] = useState<Categoria | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [atributosCategoria, setAtributosCategoria] = useState<Categoria | null>(null);

  const { data: categorias, isLoading } = useCategorias({ search });
  const deleteMutation = useDeleteCategoria();

  // Organizar categorías en jerarquía
  const categoriasJerarquicas = useMemo(() => {
    if (!categorias) return [];

    // Separar principales y subcategorías
    const principales: CategoriaConHijos[] = [];
    const subcategoriasPorPadre: Record<string, Categoria[]> = {};

    categorias.forEach((cat) => {
      if (cat.categoriaPadreId) {
        if (!subcategoriasPorPadre[cat.categoriaPadreId]) {
          subcategoriasPorPadre[cat.categoriaPadreId] = [];
        }
        subcategoriasPorPadre[cat.categoriaPadreId].push(cat);
      } else {
        principales.push({ ...cat, subcategorias: [] });
      }
    });

    // Asignar subcategorías a sus padres
    principales.forEach((cat) => {
      cat.subcategorias = subcategoriasPorPadre[cat.id] || [];
    });

    return principales;
  }, [categorias]);

  const handleDelete = async () => {
    if (deletingCategoria) {
      await deleteMutation.mutateAsync(deletingCategoria.id);
      setDeletingCategoria(null);
    }
  };

  const handleCreateSubcategoria = (padreId: string) => {
    setDefaultParentId(padreId);
    setShowCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setEditingCategoria(null);
    setDefaultParentId(null);
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm md:text-base text-gray-500">Organiza tus productos por categorias y subcategorias</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 h-11 md:h-10 px-5 md:px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          Nueva Categoria
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoria..."
          className="w-full h-11 md:h-10 pl-12 pr-4 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categoriasJerarquicas && categoriasJerarquicas.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
        >
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-gray-100">
            {categoriasJerarquicas.map((categoria, index) => (
              <Fragment key={categoria.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3"
                >
                  <div className="flex items-center gap-3 min-h-[44px]">
                    <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-gray-900">{categoria.nombre}</span>
                      {categoria.subcategorias.length > 0 && (
                        <p className="text-xs text-gray-500">{categoria.subcategorias.length} subcategoria(s)</p>
                      )}
                      {categoria.descripcion && (
                        <p className="text-xs text-gray-500 truncate">{categoria.descripcion}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                        categoria.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {categoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 ml-14">
                    <button
                      onClick={() => handleCreateSubcategoria(categoria.id)}
                      className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Agregar subcategoria"
                    >
                      <FolderPlus className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setAtributosCategoria(categoria)}
                      className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Gestionar atributos"
                    >
                      <Tags className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingCategoria(categoria)}
                      className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeletingCategoria(categoria)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
                {/* Mobile subcategorias */}
                {categoria.subcategorias.map((sub, subIndex) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (index * 0.05) + (subIndex * 0.02) }}
                    className="p-3 pl-8 bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3 min-h-[44px]">
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm text-gray-700">{sub.nombre}</span>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                          sub.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sub.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 ml-[52px]">
                      <button
                        onClick={() => setAtributosCategoria(sub)}
                        className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Gestionar atributos"
                      >
                        <Tags className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingCategoria(sub)}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCategoria(sub)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </Fragment>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Categoria
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Descripcion
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                    Estado
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoriasJerarquicas.map((categoria, index) => (
                  <Fragment key={categoria.id}>
                    {/* Categoria Principal */}
                    <motion.tr
                      key={categoria.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {categoria.nombre}
                            </span>
                            {categoria.subcategorias.length > 0 && (
                              <p className="text-xs text-gray-500">
                                {categoria.subcategorias.length} subcategoria(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {categoria.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            categoria.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {categoria.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCreateSubcategoria(categoria.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Agregar subcategoria"
                          >
                            <FolderPlus className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setAtributosCategoria(categoria)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Gestionar atributos"
                          >
                            <Tags className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingCategoria(categoria)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategoria(categoria)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Subcategorias */}
                    {categoria.subcategorias.map((sub, subIndex) => (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.05) + (subIndex * 0.02) }}
                        className="hover:bg-gray-50 bg-gray-50/50"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3 pl-8">
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <FolderOpen className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-700">
                              {sub.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-sm">
                          {sub.descripcion || '-'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              sub.activo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {sub.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAtributosCategoria(sub)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Gestionar atributos"
                            >
                              <Tags className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingCategoria(sub)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingCategoria(sub)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center bg-white rounded-xl border py-12 md:py-16 px-4"
        >
          <FolderOpen className="h-12 w-12 md:h-16 md:w-16 text-gray-300 mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 text-center">
            Sin categorias
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-6 text-center">
            Crea tu primera categoria para organizar tus productos
          </p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 h-11 md:h-10 px-5 md:px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm md:text-base"
          >
            <Plus className="h-5 w-5" />
            Crear Categoria
          </button>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <CategoriaFormDialog
        open={showCreateDialog || !!editingCategoria}
        onClose={handleCloseCreateDialog}
        categoria={editingCategoria}
        defaultParentId={defaultParentId}
      />

      {/* Atributos Dialog */}
      <CategoriaAtributosDialog
        open={!!atributosCategoria}
        onClose={() => setAtributosCategoria(null)}
        categoria={atributosCategoria}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategoria}
        onClose={() => setDeletingCategoria(null)}
        onConfirm={handleDelete}
        title="Eliminar categoria"
        description={`¿Seguro que quieres eliminar "${deletingCategoria?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Si, eliminar"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
