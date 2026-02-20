import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportImportService } from '@/application/services/export-import.service';

export const useExportProductos = () => {
  return useMutation({
    mutationFn: () => exportImportService.exportarProductos(),
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Productos exportados correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al exportar productos');
    },
  });
};

export const useDownloadPlantilla = () => {
  return useMutation({
    mutationFn: () => exportImportService.descargarPlantilla(),
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-productos.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Plantilla descargada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al descargar plantilla');
    },
  });
};

export const useImportProductos = () => {
  return useMutation({
    mutationFn: (file: File) => exportImportService.importarProductos(file),
    onSuccess: (result: { importados: number; errores: any[] }) => {
      toast.success(`Importacion completada: ${result.importados} productos importados`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al importar productos');
    },
  });
};
