import { useQuery } from '@tanstack/react-query';
import { seoService } from '@/application/services/seo.service';

export const SEO_QUERY_KEY = ['seo'];

export const useSeoConfigs = () => {
  return useQuery({
    queryKey: SEO_QUERY_KEY,
    queryFn: () => seoService.getAll(),
  });
};

export const useSeoByPagina = (pagina: string) => {
  return useQuery({
    queryKey: [...SEO_QUERY_KEY, pagina],
    queryFn: () => seoService.getByPagina(pagina),
    enabled: !!pagina,
  });
};
