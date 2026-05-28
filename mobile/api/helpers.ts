import Toast from 'react-native-toast-message';

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
 * Muestra toast de éxito
 */
export function toastSuccess(title: string, message?: string) {
  Toast.show({ type: 'success', text1: title, text2: message, visibilityTime: 2500 });
}

/**
 * Muestra toast de error
 */
export function toastError(title: string, message?: string) {
  Toast.show({ type: 'error', text1: title, text2: message, visibilityTime: 3500 });
}

/**
 * Muestra toast informativo
 */
export function toastInfo(title: string, message?: string) {
  Toast.show({ type: 'info', text1: title, text2: message, visibilityTime: 2500 });
}

/**
 * Extrae mensaje de error de una respuesta API
 */
export function getErrorMessage(err: any, fallback = 'Algo salio mal'): string {
  return err?.response?.data?.message || err?.message || fallback;
}
