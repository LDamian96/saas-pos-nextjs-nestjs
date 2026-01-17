/**
 * @file sucursal.validator.ts
 * @description Validadores Zod para sucursal
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 */

import { z } from 'zod';

/**
 * Schema para crear sucursal
 */
export const createSucursalSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El codigo es obligatorio')
    .max(20, 'Maximo 20 caracteres')
    .transform((val) => val.toUpperCase()),
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'Maximo 150 caracteres'),
  direccion: z.string().max(300, 'Maximo 300 caracteres').optional(),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional(),
  email: z.string().email('Email no valido').optional().or(z.literal('')),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  diasOperacion: z.array(z.string()).optional(),
  esPrincipal: z.boolean().default(false),
  esAlmacen: z.boolean().default(false),
  activo: z.boolean().default(true),
});

export type CreateSucursalFormData = z.infer<typeof createSucursalSchema>;

/**
 * Schema para actualizar sucursal
 */
export const updateSucursalSchema = createSucursalSchema.partial();

export type UpdateSucursalFormData = z.infer<typeof updateSucursalSchema>;
