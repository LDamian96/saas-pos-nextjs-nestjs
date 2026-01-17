'use client';

/**
 * @file cliente-dialog.tsx
 * @description Dialog para crear/editar clientes
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import { ClienteForm } from './cliente-form';
import { Cliente, ClienteListItem } from '@/application/services/cliente.service';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: ClienteListItem | Cliente | null;
}

export function ClienteDialog({ open, onOpenChange, cliente }: Props) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {cliente ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <ClienteForm
            cliente={cliente as Cliente}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
