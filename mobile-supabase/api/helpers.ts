import { toast } from '@/components/toaster';

/**
 * Extrae el array de datos de una respuesta API.
 * La API devuelve: { success, data: [...], meta? }
 * Axios wrappea en: { data: { success, data: [...] } }
 * Después de .then(r => r.data) tenemos: { success, data: [...] }
 */
export function extractList<T = any>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

/**
 * Extrae un objeto singular de una respuesta API.
 */
export function extractOne<T = any>(response: any): T | null {
  if (!response) return null;
  if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  return response;
}

/**
 * Muestra toast de éxito (estilo Sonner, custom RN)
 */
export function toastSuccess(title: string, message?: string) {
  toast.success(title, message);
}

/**
 * Muestra toast de error
 */
export function toastError(title: string, message?: string) {
  toast.error(title, message);
}

/**
 * Muestra toast informativo
 */
export function toastInfo(title: string, message?: string) {
  toast.info(title, message);
}

/**
 * Extrae mensaje de error de una respuesta API
 */
export function getErrorMessage(err: any, fallback = 'Algo salio mal'): string {
  return err?.response?.data?.message || err?.message || fallback;
}
