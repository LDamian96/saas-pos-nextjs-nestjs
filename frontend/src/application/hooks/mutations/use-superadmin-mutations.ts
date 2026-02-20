import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { superadminService } from '@/application/services/superadmin.service';
import { SUPERADMIN_QUERY_KEY } from '@/application/hooks/queries/use-superadmin';

export const useToggleEmpresa = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      superadminService.toggleEmpresa(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPERADMIN_QUERY_KEY });
      toast.success('Estado de empresa actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    },
  });
};
