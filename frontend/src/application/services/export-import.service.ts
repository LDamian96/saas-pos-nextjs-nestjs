import { api } from '@/infrastructure/api/axios-instance';

export const exportImportService = {
  exportarProductos: async (): Promise<Blob> => {
    const { data } = await api.get('/excel/exportar', { responseType: 'blob' });
    return data;
  },

  descargarPlantilla: async (): Promise<Blob> => {
    const { data } = await api.get('/excel/plantilla', { responseType: 'blob' });
    return data;
  },

  importarProductos: async (file: File): Promise<{ importados: number; errores: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/excel/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
};
