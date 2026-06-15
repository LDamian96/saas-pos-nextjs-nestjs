// =============================================================================
// empresa-cache.service.ts — Cache local de nombre + logo de la empresa.
// Tras login exitoso guardamos para mostrar antes de tener red (splash/login).
// =============================================================================

import * as SecureStore from 'expo-secure-store';

const KEY_NOMBRE = 'empresa_nombre';
const KEY_LOGO = 'empresa_logo';

export interface EmpresaCache {
  nombre: string | null;
  logo: string | null;
}

export async function saveEmpresaCache(nombre?: string | null, logo?: string | null): Promise<void> {
  try {
    if (nombre) await SecureStore.setItemAsync(KEY_NOMBRE, nombre);
    if (logo) await SecureStore.setItemAsync(KEY_LOGO, logo);
  } catch {}
}

export async function getEmpresaCache(): Promise<EmpresaCache> {
  try {
    const [nombre, logo] = await Promise.all([
      SecureStore.getItemAsync(KEY_NOMBRE),
      SecureStore.getItemAsync(KEY_LOGO),
    ]);
    return { nombre, logo };
  } catch {
    return { nombre: null, logo: null };
  }
}

export async function clearEmpresaCache(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_NOMBRE);
    await SecureStore.deleteItemAsync(KEY_LOGO);
  } catch {}
}
