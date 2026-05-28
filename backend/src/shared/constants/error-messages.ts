/**
 * @file error-messages.ts
 * @description Mensajes de error amigables para usuarios no tecnicos
 *
 * @references
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 *
 * IMPORTANTE: Estos mensajes deben ser SIMPLES y CLAROS
 * Nuestros usuarios NO son tecnicos (duenos de tiendas, cajeros, etc.)
 */

export const ERROR_MESSAGES = {
  // =====================================================
  // AUTENTICACION
  // =====================================================
  INVALID_CREDENTIALS: 'Usuario o contrasena incorrectos',
  TOKEN_EXPIRED: 'Tu sesion termino. Vuelve a iniciar sesion',
  TOKEN_INVALID: 'Sesion no valida. Inicia sesion nuevamente',
  ACCOUNT_LOCKED: 'Tu cuenta esta bloqueada. Contacta al administrador',
  ACCOUNT_INACTIVE: 'Tu cuenta esta desactivada',
  EMAIL_NOT_VERIFIED: 'Debes verificar tu email primero',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera unos minutos',

  // =====================================================
  // PERMISOS
  // =====================================================
  UNAUTHORIZED: 'No tienes permiso para hacer esto',
  FORBIDDEN: 'Acceso denegado',
  SESSION_EXPIRED: 'Tu sesion expiro. Inicia sesion de nuevo',

  // =====================================================
  // VALIDACION
  // =====================================================
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_EMAIL: 'El email no es valido',
  INVALID_PHONE: 'El telefono no es valido',
  INVALID_RUC: 'El RUC no es valido',
  PASSWORD_TOO_SHORT: 'La contrasena debe tener al menos 8 caracteres',
  PASSWORD_TOO_WEAK: 'La contrasena debe incluir mayusculas, minusculas y numeros',

  // =====================================================
  // DUPLICADOS
  // =====================================================
  DUPLICATE_EMAIL: 'Este email ya esta registrado',
  DUPLICATE_SKU: 'Este codigo ya existe. Usa otro diferente',
  DUPLICATE_BARCODE: 'Este codigo de barras ya existe',
  DUPLICATE_RUC: 'Este RUC ya esta registrado',
  DUPLICATE_CODE: 'Este codigo ya existe',

  // =====================================================
  // NO ENCONTRADO
  // =====================================================
  NOT_FOUND: 'No se encontro lo que buscas',
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  CUSTOMER_NOT_FOUND: 'Cliente no encontrado',
  SALE_NOT_FOUND: 'Venta no encontrada',
  USER_NOT_FOUND: 'Usuario no encontrado',

  // =====================================================
  // INVENTARIO Y LOTES
  // =====================================================
  INSUFFICIENT_STOCK: 'No hay suficiente stock disponible',
  STOCK_NEGATIVE: 'El stock no puede ser negativo',
  STOCK_RESERVED: 'Este producto tiene stock reservado',
  LOTE_NOT_FOUND: 'No encontramos este lote',
  LOTE_DUPLICATE: 'Ya existe un lote con este codigo',
  LOTE_EXPIRED: 'Este lote esta vencido',
  LOTE_BLOCKED: 'Este lote esta bloqueado',
  LOTE_NO_STOCK: 'Este lote no tiene stock disponible',
  VARIANT_NOT_FOUND: 'No encontramos esta variante del producto',
  MOVIMIENTO_INVALID: 'El movimiento de inventario no es valido',

  // =====================================================
  // VENTAS
  // =====================================================
  SALE_ALREADY_CANCELLED: 'Esta venta ya fue anulada',
  SALE_CANNOT_CANCEL: 'No se puede anular esta venta',
  SALE_RETURN_INVALID: 'No se puede procesar la devolucion',
  SALE_DETAIL_NOT_FOUND: 'Detalle de venta no encontrado',
  RETURN_QUANTITY_EXCEEDED: 'La cantidad a devolver excede la cantidad vendida',
  PAYMENT_INSUFFICIENT: 'El pago es menor al total',
  CART_EMPTY: 'El carrito esta vacio',
  INVALID_DISCOUNT: 'El descuento no es valido',
  MAX_DISCOUNT_EXCEEDED: 'No tienes permiso para aplicar este descuento',

  // =====================================================
  // CAJA
  // =====================================================
  CASH_REGISTER_CLOSED: 'La caja esta cerrada. Abrela primero',
  CASH_REGISTER_ALREADY_OPEN: 'La caja ya esta abierta',
  CASH_REGISTER_MISMATCH: 'El monto de cierre no coincide',
  NO_CASH_REGISTER: 'No tienes una caja asignada',

  // =====================================================
  // EMPRESA / PLAN
  // =====================================================
  PLAN_LIMIT_PRODUCTS: 'Has alcanzado el limite de productos de tu plan',
  PLAN_LIMIT_USERS: 'Has alcanzado el limite de usuarios de tu plan',
  PLAN_LIMIT_BRANCHES: 'Has alcanzado el limite de sucursales de tu plan',
  PLAN_EXPIRED: 'Tu plan ha expirado. Renueva para continuar',
  ADDON_NOT_ACTIVE: 'Esta funcion requiere activar un modulo adicional',

  // =====================================================
  // SERVIDOR
  // =====================================================
  SERVER_ERROR: 'Algo salio mal. Intenta de nuevo',
  CONNECTION_ERROR: 'Error de conexion. Verifica tu internet',
  TIMEOUT: 'La operacion tardo demasiado. Intenta de nuevo',
  MAINTENANCE: 'Sistema en mantenimiento. Vuelve en unos minutos',

  // =====================================================
  // ARCHIVOS
  // =====================================================
  FILE_TOO_LARGE: 'El archivo es muy grande. Maximo 5MB',
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido',
  UPLOAD_FAILED: 'Error al subir el archivo. Intenta de nuevo',

  // =====================================================
  // IMPORTACION
  // =====================================================
  IMPORT_INVALID_FORMAT: 'El formato del archivo no es valido',
  IMPORT_EMPTY_FILE: 'El archivo esta vacio',
  IMPORT_MISSING_COLUMNS: 'Faltan columnas requeridas en el archivo',
  IMPORT_ROW_ERROR: 'Error en la fila {row}: {error}',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Obtener mensaje de error amigable
 */
export function getErrorMessage(key: ErrorMessageKey, params?: Record<string, string>): string {
  let message: string = ERROR_MESSAGES[key] || ERROR_MESSAGES.SERVER_ERROR;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      message = message.replace(`{${paramKey}}`, value);
    });
  }

  return message;
}
