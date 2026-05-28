'use client';

/**
 * @file sucursal-delete-dialog.tsx
 * @description Modal de confirmacion para eliminar sucursal
 */

import { motion, AnimatePresence } from '@/shared/motion';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { useDeleteSucursal } from '@/application/hooks/mutations/use-sucursal-mutations';
import type { Sucursal } from '@/application/services/sucursal.service';

interface SucursalDeleteDialogProps {
  sucursal: Sucursal | null;
  open: boolean;
  onClose: () => void;
}

export function SucursalDeleteDialog({
  sucursal,
  open,
  onClose,
}: SucursalDeleteDialogProps) {
  const deleteMutation = useDeleteSucursal();

  const handleDelete = async () => {
    if (!sucursal) return;

    try {
      await deleteMutation.mutateAsync(sucursal.id);
      onClose();
    } catch {
      // Error manejado en el hook
    }
  };

  return (
    <AnimatePresence>
      {open && sucursal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-4 border-b">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Eliminar Sucursal
              </h3>
              <p className="text-gray-600">
                Estas seguro de eliminar la sucursal{' '}
                <strong>{sucursal.nombre}</strong>? Esta accion no se puede
                deshacer.
              </p>
            </div>

            <div className="flex items-center gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
                Eliminar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
