import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { qrService } from '@/application/services/qr.service';

export const useGenerarQr = () => {
  return useMutation({
    mutationFn: (productoId: string) => qrService.generarQr(productoId),
    onSuccess: (blob, productoId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${productoId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR generado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar QR');
    },
  });
};

export const useGenerarQrDataUrl = () => {
  return useMutation({
    mutationFn: (productoId: string) => qrService.generarQrDataUrl(productoId),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar QR');
    },
  });
};

export const useGenerarQrBatch = () => {
  return useMutation({
    mutationFn: (productoIds: string[]) => qrService.generarQrBatch(productoIds),
    onSuccess: (results) => {
      toast.success(`${results.length} codigos QR generados`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar QR en batch');
    },
  });
};
