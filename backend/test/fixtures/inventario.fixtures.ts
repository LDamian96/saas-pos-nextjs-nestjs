/**
 * @file inventario.fixtures.ts
 * @description Datos de prueba para módulo de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 */

// Datos para crear lotes
export const loteFixtures = {
  valid: {
    codigoLote: 'LOT-TEST-001',
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    fechaIngreso: new Date().toISOString(),
    stock: 100,
    costoUnitario: 25.50,
    notas: 'Lote de prueba',
  },
  proximoVencer: {
    codigoLote: 'LOT-TEST-002',
    fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días
    fechaIngreso: new Date().toISOString(),
    stock: 50,
    costoUnitario: 20.00,
    notas: 'Lote próximo a vencer',
  },
  vencido: {
    codigoLote: 'LOT-TEST-003',
    fechaVencimiento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5 días (vencido)
    fechaIngreso: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    stock: 25,
    costoUnitario: 15.00,
    notas: 'Lote vencido',
  },
  invalid: {
    codigoLote: '', // vacío
    stock: -10, // negativo
  },
};

// Datos para movimientos de inventario
export const movimientoFixtures = {
  entrada: {
    tipo: 'entrada',
    motivo: 'compra',
    cantidad: 50,
    costoUnitario: 20.00,
    documentoTipo: 'factura_compra',
    documentoNumero: 'F001-00001',
    notas: 'Compra de prueba',
  },
  salida: {
    tipo: 'salida',
    motivo: 'venta',
    cantidad: 10,
    documentoTipo: 'boleta',
    documentoNumero: 'B001-00001',
    notas: 'Venta de prueba',
  },
  ajustePositivo: {
    tipo: 'ajuste',
    motivo: 'ajuste_positivo',
    cantidad: 5,
    notas: 'Ajuste por inventario físico',
  },
  ajusteNegativo: {
    tipo: 'ajuste',
    motivo: 'ajuste_negativo',
    cantidad: 3,
    notas: 'Ajuste por merma',
  },
  merma: {
    tipo: 'salida',
    motivo: 'merma',
    cantidad: 2,
    notas: 'Producto dañado',
  },
  invalid: {
    tipo: 'invalido', // tipo no válido
    motivo: 'fake',
    cantidad: 0,
  },
};

// Datos para traspasos
export const traspasoFixtures = {
  valid: {
    cantidad: 20,
    notas: 'Traspaso de prueba entre sucursales',
  },
  invalid: {
    cantidad: -5, // negativo
  },
};

// Helper para generar fechas
export const dateHelpers = {
  diasDesdeHoy: (dias: number): string => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString();
  },
  hoy: (): string => new Date().toISOString(),
};
