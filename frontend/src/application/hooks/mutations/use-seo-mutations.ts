import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { seoService, UpsertSeoDto } from '@/application/services/seo.service';
import { SEO_QUERY_KEY } from '@/application/hooks/queries/use-seo';

export const useUpsertSeo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pagina, dto }: { pagina: string; dto: UpsertSeoDto }) =>
      seoService.upsert(pagina, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_QUERY_KEY });
      toast.success('Configuracion SEO guardada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar SEO');
    },
  });
};

export const useDeleteSeo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pagina: string) => seoService.delete(pagina),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEO_QUERY_KEY });
      toast.success('Configuracion SEO eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar SEO');
    },
  });
};
