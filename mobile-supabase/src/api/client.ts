// Re-exporta el wrapper Supabase del nivel raiz para que cualquier import
// `@/api/client` (que resuelve a src/api/client.ts por el alias) use Supabase
// en vez del cliente axios del template.
export { api, default } from '../../api/client';
