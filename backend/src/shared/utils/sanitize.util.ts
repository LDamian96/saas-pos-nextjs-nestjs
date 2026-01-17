/**
 * @file sanitize.util.ts
 * @description Utilidad para sanitizar inputs contra XSS
 */

/**
 * Sanitiza un string removiendo tags HTML y caracteres peligrosos
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeHtml(text: string | undefined | null): string {
  if (!text) return '';

  return text
    .toString()
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Escapar caracteres especiales HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // Revertir entidades escapadas dobles (por si ya estaba escapado)
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&amp;lt;/g, '&lt;')
    .replace(/&amp;gt;/g, '&gt;')
    .replace(/&amp;quot;/g, '&quot;');
}

/**
 * Sanitiza un string para uso seguro en consultas
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeInput(text: string | undefined | null): string {
  if (!text) return '';

  return text.toString().trim();
}

/**
 * Alias de sanitizeHtml para compatibilidad
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeString(text: string | undefined | null): string {
  return sanitizeHtml(text);
}
