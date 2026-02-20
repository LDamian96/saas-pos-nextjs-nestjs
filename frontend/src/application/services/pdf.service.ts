import { api } from '@/infrastructure/api/axios-instance';

export const pdfService = {
  generarTicketVenta: async (ventaId: string): Promise<Blob> => {
    const { data } = await api.get(`/pdf/venta/${ventaId}`, { responseType: 'blob' });
    return data;
  },

  generarReporteCompra: async (compraId: string): Promise<Blob> => {
    const { data } = await api.get(`/pdf/compra/${compraId}`, { responseType: 'blob' });
    return data;
  },
};
