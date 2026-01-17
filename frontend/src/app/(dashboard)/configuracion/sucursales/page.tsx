'use client';

/**
 * @file page.tsx
 * @description Página de gestión de sucursales
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: SUCURSALES)
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Loader2, X } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/common/empty-state';
import {
  SucursalCard,
  SucursalForm,
  SucursalDeleteDialog,
} from '@/presentation/components/features/sucursales';

import { useSucursales } from '@/application/hooks/queries/use-sucursales';
import type { Sucursal } from '@/application/services/sucursal.service';

export default function SucursalesPage() {
  const { data: sucursales, isLoading } = useSucursales();

  const [showModal, setShowModal] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null);

  const openCreateModal = () => {
    setEditingSucursal(null);
    setShowModal(true);
  };

  const openEditModal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSucursal(null);
  };

  const openDeleteDialog = (sucursal: Sucursal) => {
    setDeletingSucursal(sucursal);
  };

  const closeDeleteDialog = () => {
    setDeletingSucursal(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-gray-500 mt-1">
            Gestiona los locales y almacenes de tu empresa
          </p>
        </div>
        <Button size="lg" onClick={openCreateModal} className="gap-2">
          <Plus size={20} />
          Nueva Sucursal
        </Button>
      </div>

      {/* Lista de Sucursales */}
      {sucursales && sucursales.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sucursales.map((sucursal, index) => (
            <SucursalCard
              key={sucursal.id}
              sucursal={sucursal}
              index={index}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Store}
              title="No hay sucursales"
              description="Crea tu primera sucursal para comenzar a operar"
              action={
                <Button onClick={openCreateModal} className="gap-2">
                  <Plus size={20} />
                  Crear Sucursal
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                  <CardTitle>
                    {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
                  </CardTitle>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </CardHeader>
                <CardContent className="pt-6">
                  <SucursalForm
                    sucursal={editingSucursal}
                    onSuccess={closeModal}
                    onCancel={closeModal}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog Eliminar */}
      <SucursalDeleteDialog
        sucursal={deletingSucursal}
        open={!!deletingSucursal}
        onClose={closeDeleteDialog}
      />
    </div>
  );
}
