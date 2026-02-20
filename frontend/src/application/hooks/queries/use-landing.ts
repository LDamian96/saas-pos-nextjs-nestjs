import { useQuery } from '@tanstack/react-query';
import { landingService } from '@/application/services/landing.service';

export const LANDING_QUERY_KEY = ['landing'];

export const useLandingSecciones = () => {
  return useQuery({
    queryKey: [...LANDING_QUERY_KEY, 'secciones'],
    queryFn: () => landingService.getSecciones(),
  });
};

export const useLandingContactos = (page = 1) => {
  return useQuery({
    queryKey: [...LANDING_QUERY_KEY, 'contactos', page],
    queryFn: () => landingService.getContactos(page),
  });
};
