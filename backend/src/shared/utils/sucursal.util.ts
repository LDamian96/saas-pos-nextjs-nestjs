/**
 * @file sucursal.util.ts
 * @description Helpers compartidos para manejo de filtros por sucursal.
 */

/** Regex estándar de UUID v4 (acepta versiones 1-5). */
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Normaliza `sucursalId` recibido desde query params, body o JWT.
 *
 * Acepta: string UUID válido → lo devuelve trimmed.
 * Rechaza (devuelve undefined): undefined, null, '', array stringificado
 * (`["uuid"]`), JSON object stringificado (`{...}`), o cualquier valor que no
 * sea UUID válido.
 *
 * Este helper previene el error de Prisma:
 *   `Error creating UUID, invalid character: found '['`
 * que ocurre cuando query params duplicados llegan como arrays.
 */
export function normalizeSucursalId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return undefined;
  if (!UUID_RE.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Sintaxis fluida para `...(spreadSucursal(id) && { sucursalId: ... })`.
 * Devuelve un objeto vacío si el id es inválido (no añade el filtro).
 *
 * Ejemplo:
 *   prisma.lote.findMany({
 *     where: { empresaId, ...spreadSucursalFilter(sucursalId, 'sucursalId') }
 *   });
 */
export function spreadSucursalFilter(
  value: unknown,
  field: 'sucursalId' | 'id' = 'sucursalId',
): Record<string, string> {
  const normalized = normalizeSucursalId(value);
  if (!normalized) return {};
  return { [field]: normalized };
}
