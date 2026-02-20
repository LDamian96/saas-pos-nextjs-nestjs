/**
 * @file producto.validator.ts
 * @description Esquemas de validación Zod para productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)
 */

import { z } from 'zod';

// Helper: convierte string vacío o NaN a undefined para campos numéricos opcionales
const optionalNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null || Number.isNaN(Number(val)) ? undefined : Number(val)),
  z.number().min(0).optional()
);
const optionalPositiveInt = z.preprocess(
  (val) => (val === '' || val === undefined || val === null || Number.isNaN(Number(val)) ? undefined : Number(val)),
  z.number().int().min(1).optional()
);
const optionalNonNegativeInt = z.preprocess(
  (val) => (val === '' || val === undefined || val === null || Number.isNaN(Number(val)) ? undefined : Number(val)),
  z.number().int().min(0).optional()
);
const optionalPercentage = z.preprocess(
  (val) => (val === '' || val === undefined || val === null || Number.isNaN(Number(val)) ? undefined : Number(val)),
  z.number().min(0).max(100).optional()
);

// =====================================================
// SCHEMA - PRODUCTO
// =====================================================

export const createProductoSchema = z.object({
  // Relaciones
  categoriaId: z.string().uuid('Selecciona una categoría'),
  marcaId: z.string().uuid().optional().or(z.literal('')),
  unidadMedidaId: z.string().uuid().optional().or(z.literal('')),

  // Identificación
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(200, 'Máximo 200 caracteres'),
  sku: z.string().max(50, 'Máximo 50 caracteres').optional(),
  codigoBarras: z.string().max(50, 'Máximo 50 caracteres').optional(),

  // Descripción
  descripcionCorta: z.string().max(500, 'Máximo 500 caracteres').optional(),
  descripcionLarga: z.string().optional(),

  // Tipo de producto
  tipo: z.enum(['simple', 'variable']).default('simple'),

  // Precios
  precioCompra: z.coerce.number().min(0, 'El precio no puede ser negativo').default(0),
  precioVenta: z.coerce.number().min(0.01, 'El precio de venta es obligatorio'),
  precioMayorista: optionalNumber,
  cantidadMinimaMayorista: optionalPositiveInt,
  precioOferta: optionalNumber,
  descuentoPorcentaje: optionalPercentage,
  ofertaDesde: z.string().optional(),
  ofertaHasta: z.string().optional(),

  // Impuestos y stock
  aplicaImpuesto: z.boolean().default(true),
  manejaStock: z.boolean().default(true),
  stock: z.coerce.number().int().min(0).default(0),
  stockMinimo: z.coerce.number().int().min(0).default(0),
  stockMaximo: optionalNonNegativeInt,

  // Imagen
  imagenPrincipal: z.string().url().optional().or(z.literal('')),

  // Estados
  activo: z.boolean().default(true),
  visiblePos: z.boolean().default(true),
  visibleWeb: z.boolean().default(true),
  destacado: z.boolean().default(false),
  nuevo: z.boolean().default(false),

  // SEO
  metaTitulo: z.string().max(70, 'Máximo 70 caracteres').optional(),
  metaDescripcion: z.string().max(160, 'Máximo 160 caracteres').optional(),

  // Dimensiones
  peso: optionalNumber,
  largo: optionalNumber,
  ancho: optionalNumber,
  alto: optionalNumber,
});

export const updateProductoSchema = createProductoSchema.partial();

export type CreateProductoFormData = z.infer<typeof createProductoSchema>;
export type UpdateProductoFormData = z.infer<typeof updateProductoSchema>;

// =====================================================
// SCHEMA - VARIANTE
// =====================================================

export const createVarianteSchema = z.object({
  sku: z
    .string()
    .min(1, 'El SKU es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  codigoBarras: z.string().max(50, 'Máximo 50 caracteres').optional(),
  nombreVariante: z.string().max(200, 'Máximo 200 caracteres').optional(),
  precioCompra: z.coerce.number().min(0).optional(),
  precioVenta: z.coerce.number().min(0).optional(),
  imagen: z.string().url().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).default(0),
  activo: z.boolean().default(true),
  valoresAtributoIds: z.array(z.string().uuid()).optional(),
});

export const updateVarianteSchema = createVarianteSchema.partial();

export type CreateVarianteFormData = z.infer<typeof createVarianteSchema>;
export type UpdateVarianteFormData = z.infer<typeof updateVarianteSchema>;

// =====================================================
// SCHEMA - FILTROS
// =====================================================

export const productoFiltersSchema = z.object({
  search: z.string().optional(),
  categoriaId: z.string().uuid().optional().or(z.literal('')),
  marcaId: z.string().uuid().optional().or(z.literal('')),
  tipo: z.enum(['simple', 'variable', '']).optional(),
  activo: z.boolean().optional(),
  stockBajo: z.boolean().optional(),
  visiblePos: z.boolean().optional(),
  visibleWeb: z.boolean().optional(),
});

export type ProductoFiltersFormData = z.infer<typeof productoFiltersSchema>;
