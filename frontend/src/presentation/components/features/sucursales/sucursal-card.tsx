'use client';

/**
 * @file sucursal-card.tsx
 * @description Card de sucursal para mostrar en lista
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 */

import { motion } from '@/shared/motion';
import { Store, MapPin, Phone, Mail, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import type { Sucursal } from '@/application/services/sucursal.service';

interface SucursalCardProps {
  sucursal: Sucursal;
  index: number;
  onEdit: (sucursal: Sucursal) => void;
  onDelete: (sucursal: Sucursal) => void;
}

export function SucursalCard({ sucursal, index, onEdit, onDelete }: SucursalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="h-full">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{sucursal.nombre}</h3>
                <span className="text-sm text-gray-500">{sucursal.codigo}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {sucursal.esPrincipal && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Principal
                </span>
              )}
              {sucursal.esAlmacen && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Almacen
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm text-gray-600 min-h-[60px]">
            {sucursal.direccion && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{sucursal.direccion}</span>
              </div>
            )}
            {sucursal.telefono && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                <span>{sucursal.telefono}</span>
              </div>
            )}
            {sucursal.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{sucursal.email}</span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(sucursal)}
              className="flex-1 gap-2"
            >
              <Pencil size={16} />
              Editar
            </Button>
            {!sucursal.esPrincipal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(sucursal)}
                className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Eliminar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
