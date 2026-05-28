import api from '@/api/client';
import { useNetworkStore } from '@/stores/network.store';
import { toastSuccess, toastInfo, toastError, extractList } from '@/api/helpers';

import {
  cacheProductos,
  cacheCategorias,
  getVentasPendientes,
  markVentaSynced,
  markVentaError,
  getVentasPendientesCount,
} from '@/db/offline';

let syncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Descarga productos y categorias desde el backend y los cachea localmente
 */
export async function downloadCatalog(sucursalId?: string) {
  try {
    const [prodRes, catRes] = await Promise.all([
      api.get('/productos', { params: { activo: true, visiblePos: true, limit: 500 } }),
      api.get('/categorias'),
    ]);

    const productos = extractList(prodRes.data);
    const categorias = extractList(catRes.data);

    if (productos.length > 0) await cacheProductos(productos);
    if (categorias.length > 0) await cacheCategorias(categorias);

    return { productos: productos.length, categorias: categorias.length };
  } catch (err) {
    console.warn('[sync] downloadCatalog failed', err);
    throw err;
  }
}

/**
 * Sube todas las ventas pendientes al backend
 */
export async function syncPendingSales(): Promise<{ ok: number; failed: number }> {
  const { isOnline, setSyncing, setPendingSales } = useNetworkStore.getState();
  if (!isOnline) return { ok: 0, failed: 0 };

  setSyncing(true);
  let ok = 0;
  let failed = 0;

  try {
    const pendientes = await getVentasPendientes();
    for (const venta of pendientes) {
      try {
        await api.post('/ventas', venta.payload);
        await markVentaSynced(venta.id);
        ok++;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'unknown';
        await markVentaError(venta.id, msg);
        failed++;
      }
    }
  } finally {
    const remaining = await getVentasPendientesCount();
    setPendingSales(remaining);
    setSyncing(false);
  }

  if (ok > 0) toastSuccess(`${ok} venta${ok > 1 ? 's' : ''} sincronizada${ok > 1 ? 's' : ''}`);
  if (failed > 0) toastError('Algunas ventas no sincronizaron', `${failed} fallaron, se reintentaran`);

  return { ok, failed };
}

/**
 * Inicia el sync periódico cada 30s cuando hay internet
 */
export function startBackgroundSync() {
  if (syncInterval) return;

  // Sync inmediato al inicio
  syncPendingSales().catch(() => {});

  // Cada 30 segundos verifica si hay pendientes
  syncInterval = setInterval(() => {
    const { isOnline } = useNetworkStore.getState();
    if (isOnline) {
      syncPendingSales().catch(() => {});
    }
  }, 30000);
}

export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Refresca el contador de ventas pendientes en el store
 */
export async function refreshPendingCount() {
  const count = await getVentasPendientesCount();
  useNetworkStore.getState().setPendingSales(count);
}
