/**
 * @file slugify.util.ts
 * @description Utilidad para generar slugs URL-friendly
 */

/**
 * Convierte un string a slug URL-friendly
 * @param text - Texto a convertir
 * @returns Slug generado
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios con guiones
    .replace(/\s+/g, '-')
    // Remover caracteres especiales
    .replace(/[^\w\-]+/g, '')
    // Remover guiones múltiples
    .replace(/\-\-+/g, '-')
    // Remover guiones al inicio y final
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
