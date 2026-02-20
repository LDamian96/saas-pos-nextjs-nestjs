import { api } from '@/infrastructure/api/axios-instance';

export interface SeoConfig {
  id: string;
  pagina: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  robotsTxt: string | null;
  sitemapActivo: boolean;
  createdAt: string;
}

export interface UpsertSeoDto {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  robotsTxt?: string;
  sitemapActivo?: boolean;
}

export const seoService = {
  getAll: async (): Promise<SeoConfig[]> => {
    const { data } = await api.get('/seo');
    return data.data;
  },

  getByPagina: async (pagina: string): Promise<SeoConfig | null> => {
    const { data } = await api.get(`/seo/${pagina}`);
    return data.data;
  },

  upsert: async (pagina: string, dto: UpsertSeoDto): Promise<SeoConfig> => {
    const { data } = await api.put(`/seo/${pagina}`, dto);
    return data.data;
  },

  delete: async (pagina: string): Promise<void> => {
    await api.delete(`/seo/${pagina}`);
  },
};
