/**
 * @file empresa.validator.ts
 * @description Validadores Zod para empresa
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 */

import { z } from 'zod';

/**
 * Schema para actualizar datos de empresa
 */
export const updateEmpresaSchema = z.object({
  nombreComercial: z
    .string()
    .min(1, 'El nombre comercial es requerido')
    .max(200, 'Maximo 200 caracteres')
    .optional(),
  razonSocial: z.string().max(200, 'Maximo 200 caracteres').optional(),
  ruc: z
    .string()
    .regex(/^[0-9]{11}$/, 'El RUC debe tener 11 digitos')
    .optional(),
  email: z.string().email('Email no valido').optional(),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional(),
  whatsapp: z.string().max(20, 'Maximo 20 caracteres').optional(),
  direccionFiscal: z.string().max(300, 'Maximo 300 caracteres').optional(),
  slogan: z.string().max(200, 'Maximo 200 caracteres').optional(),
});

export type UpdateEmpresaFormData = z.infer<typeof updateEmpresaSchema>;

/**
 * Schema para actualizar configuracion
 */
export const updateEmpresaConfigSchema = z.object({
  pais: z.string().optional(),
  moneda: z.string().max(3, 'Maximo 3 caracteres').optional(),
  simboloMoneda: z.string().max(5, 'Maximo 5 caracteres').optional(),
  zonaHoraria: z.string().optional(),
  formatoFecha: z.string().optional(),
  idioma: z.string().max(5, 'Maximo 5 caracteres').optional(),
  aplicaImpuesto: z.boolean().optional(),
  porcentajeImpuesto: z
    .number()
    .min(0, 'Debe ser mayor o igual a 0')
    .max(100, 'Maximo 100%')
    .optional(),
  nombreImpuesto: z.string().max(20, 'Maximo 20 caracteres').optional(),
  precioIncluyeImpuesto: z.boolean().optional(),
});

export type UpdateEmpresaConfigFormData = z.infer<typeof updateEmpresaConfigSchema>;

/**
 * Schema para actualizar branding
 */
export const updateEmpresaBrandingSchema = z.object({
  colorPrimario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color no valido (formato: #RRGGBB)')
    .optional(),
  colorSecundario: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color no valido (formato: #RRGGBB)')
    .optional(),
});

export type UpdateEmpresaBrandingFormData = z.infer<typeof updateEmpresaBrandingSchema>;
