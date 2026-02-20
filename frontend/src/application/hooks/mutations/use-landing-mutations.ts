import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { landingService, CreateLandingSeccionDto, UpdateLandingSeccionDto } from '@/application/services/landing.service';
import { LANDING_QUERY_KEY } from '@/application/hooks/queries/use-landing';

export const useCreateLandingSeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateLandingSeccionDto) => landingService.createSeccion(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LANDING_QUERY_KEY });
      toast.success('Seccion creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear seccion');
    },
  });
};

export const useUpdateLandingSeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLandingSeccionDto }) =>
      landingService.updateSeccion(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LANDING_QUERY_KEY });
      toast.success('Seccion actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar seccion');
    },
  });
};

export const useDeleteLandingSeccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingService.deleteSeccion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LANDING_QUERY_KEY });
      toast.success('Seccion eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar seccion');
    },
  });
};

export const useReorderLandingSecciones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => landingService.reorderSecciones(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LANDING_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al reordenar secciones');
    },
  });
};

export const useMarcarContactoLeido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingService.marcarLeido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LANDING_QUERY_KEY });
    },
  });
};
