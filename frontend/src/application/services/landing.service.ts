import { api } from '@/infrastructure/api/axios-instance';

export interface LandingSeccion {
  id: string;
  tipo: string;
  titulo: string | null;
  subtitulo: string | null;
  contenido: any;
  imagen: string | null;
  orden: number;
  activo: boolean;
  createdAt: string;
}

export interface LandingContacto {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  leido: boolean;
  createdAt: string;
}

export interface CreateLandingSeccionDto {
  tipo: string;
  titulo?: string;
  subtitulo?: string;
  contenido?: any;
  imagen?: string;
  orden?: number;
  activo?: boolean;
}

export interface UpdateLandingSeccionDto extends Partial<CreateLandingSeccionDto> {}

export const landingService = {
  getSecciones: async (): Promise<LandingSeccion[]> => {
    const { data } = await api.get('/landing/secciones');
    return data.data;
  },

  createSeccion: async (dto: CreateLandingSeccionDto): Promise<LandingSeccion> => {
    const { data } = await api.post('/landing/secciones', dto);
    return data.data;
  },

  updateSeccion: async (id: string, dto: UpdateLandingSeccionDto): Promise<LandingSeccion> => {
    const { data } = await api.put(`/landing/secciones/${id}`, dto);
    return data.data;
  },

  deleteSeccion: async (id: string): Promise<void> => {
    await api.delete(`/landing/secciones/${id}`);
  },

  reorderSecciones: async (ids: string[]): Promise<void> => {
    await api.put('/landing/secciones/reorder', { ids });
  },

  getContactos: async (page = 1): Promise<{ data: LandingContacto[]; total: number }> => {
    const { data } = await api.get(`/landing/contactos?page=${page}`);
    return { data: data.data, total: data.total };
  },

  marcarLeido: async (id: string): Promise<void> => {
    await api.put(`/landing/contactos/${id}/leido`);
  },
};
