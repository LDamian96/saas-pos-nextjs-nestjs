import { api } from '@/infrastructure/api/axios-instance';

export const qrService = {
  generarQr: async (productoId: string): Promise<Blob> => {
    const { data } = await api.get(`/qr/producto/${productoId}`, { responseType: 'blob' });
    return data;
  },

  generarQrDataUrl: async (productoId: string): Promise<string> => {
    const { data } = await api.get(`/qr/producto/${productoId}/dataurl`);
    return data.data.dataUrl;
  },

  generarQrBatch: async (productoIds: string[]): Promise<any[]> => {
    const { data } = await api.post('/qr/batch', { productoIds });
    return data.data;
  },
};
