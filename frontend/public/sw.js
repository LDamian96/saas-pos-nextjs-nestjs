/**
 * SW KILL-SWITCH
 *
 * El Service Worker anterior (pos-shop-v1) cacheaba assets agresivamente y
 * servía la versión vieja del POS tras cada deploy. Este SW se auto-desinstala,
 * borra TODOS los caches y fuerza un reload limpio. Tras esta visita el cliente
 * verá la versión actual y futuras versiones sin intervención manual.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Borrar TODOS los caches existentes
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));

      // 2. Desregistrarse a sí mismo
      try {
        await self.registration.unregister();
      } catch {
        // ignore
      }

      // 3. Forzar reload de todas las pestañas controladas
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch {
          // ignore: el siguiente refresh manual igual mostrará versión nueva
        }
      }
    })()
  );
  self.clients.claim();
});

// Nunca interceptar peticiones — todo va directo a la red
self.addEventListener('fetch', () => {});
