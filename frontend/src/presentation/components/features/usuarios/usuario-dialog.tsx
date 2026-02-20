'use client';

/**
 * @file usuario-dialog.tsx
 * @description Dialog para crear/editar usuarios
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { UsuarioForm } from './usuario-form';
import { Usuario } from '@/application/services/usuarios.service';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario | null;
}

export function UsuarioDialog({ open, onOpenChange, usuario }: Props) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {usuario ? 'Editar usuario' : 'Nuevo usuario'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <UsuarioForm
            usuario={usuario}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
