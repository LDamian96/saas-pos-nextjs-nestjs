import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pdfService } from '@/application/services/pdf.service';

export const useGenerarTicketVenta = () => {
  return useMutation({
    mutationFn: (ventaId: string) => pdfService.generarTicketVenta(ventaId),
    onSuccess: (blob, ventaId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ventaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Ticket generado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar ticket');
    },
  });
};

export const useGenerarReporteCompra = () => {
  return useMutation({
    mutationFn: (compraId: string) => pdfService.generarReporteCompra(compraId),
    onSuccess: (blob, compraId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compra-${compraId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Reporte de compra generado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar reporte');
    },
  });
};
