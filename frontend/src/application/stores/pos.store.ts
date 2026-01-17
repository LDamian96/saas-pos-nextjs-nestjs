/**
 * @file pos.store.ts
 * @description Store para el Punto de Venta con Zustand
 */

import { create } from 'zustand';

export interface CartItem {
  varianteId: string;
  productoId: string;
  productoNombre: string;
  varianteSku: string;
  varianteNombre?: string;
  imagen?: string;
  cantidad: number;
  precioUnitario: number;
  precioOriginal: number;
  descuento: number;
  subtotal: number;
  stockDisponible: number;
  loteId?: string;
  loteNumero?: string;
}

export interface PaymentItem {
  metodoPagoId: string;
  metodoPagoNombre: string;
  monto: number;
  referencia?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  documento?: string;
  email?: string;
  telefono?: string;
}

interface POSState {
  // Carrito
  items: CartItem[];
  cliente: Cliente | null;

  // Pagos
  pagos: PaymentItem[];

  // Modales
  showPaymentModal: boolean;
  showClienteModal: boolean;
  showDescuentoModal: boolean;

  // Configuracion de sesion
  sucursalId: string | null;
  cajaId: string | null;

  // Totales calculados
  subtotal: number;
  descuentoTotal: number;
  impuestoTotal: number;
  total: number;

  // Acciones de carrito
  addItem: (item: Omit<CartItem, 'subtotal'>) => void;
  updateItemQuantity: (varianteId: string, cantidad: number) => void;
  updateItemDiscount: (varianteId: string, descuento: number) => void;
  removeItem: (varianteId: string) => void;
  clearCart: () => void;

  // Acciones de cliente
  setCliente: (cliente: Cliente | null) => void;

  // Acciones de pago
  addPago: (pago: PaymentItem) => void;
  removePago: (metodoPagoId: string) => void;
  clearPagos: () => void;

  // Acciones de modales
  setShowPaymentModal: (show: boolean) => void;
  setShowClienteModal: (show: boolean) => void;
  setShowDescuentoModal: (show: boolean) => void;

  // Acciones de sesion
  setSucursalId: (id: string) => void;
  setCajaId: (id: string) => void;

  // Helpers
  getTotalPagado: () => number;
  getSaldoPendiente: () => number;
}

const calcularSubtotal = (items: CartItem[]): number => {
  return items.reduce((acc, item) => acc + item.subtotal, 0);
};

const calcularDescuentoTotal = (items: CartItem[]): number => {
  return items.reduce((acc, item) => acc + item.descuento * item.cantidad, 0);
};

export const usePOSStore = create<POSState>((set, get) => ({
  // Estado inicial
  items: [],
  cliente: null,
  pagos: [],
  showPaymentModal: false,
  showClienteModal: false,
  showDescuentoModal: false,
  sucursalId: null,
  cajaId: null,
  subtotal: 0,
  descuentoTotal: 0,
  impuestoTotal: 0,
  total: 0,

  // Agregar item al carrito
  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) => item.varianteId === newItem.varianteId
      );

      let updatedItems: CartItem[];

      if (existingIndex >= 0) {
        // Actualizar cantidad si ya existe
        updatedItems = state.items.map((item, index) => {
          if (index === existingIndex) {
            const nuevaCantidad = item.cantidad + newItem.cantidad;
            // No exceder stock disponible
            const cantidadFinal = Math.min(nuevaCantidad, item.stockDisponible);
            return {
              ...item,
              cantidad: cantidadFinal,
              subtotal: (item.precioUnitario - item.descuento) * cantidadFinal,
            };
          }
          return item;
        });
      } else {
        // Agregar nuevo item
        const itemConSubtotal: CartItem = {
          ...newItem,
          subtotal: (newItem.precioUnitario - newItem.descuento) * newItem.cantidad,
        };
        updatedItems = [...state.items, itemConSubtotal];
      }

      const subtotal = calcularSubtotal(updatedItems);
      const descuentoTotal = calcularDescuentoTotal(updatedItems);

      return {
        items: updatedItems,
        subtotal,
        descuentoTotal,
        total: subtotal, // Por ahora sin impuesto
      };
    });
  },

  // Actualizar cantidad de item
  updateItemQuantity: (varianteId, cantidad) => {
    set((state) => {
      const updatedItems = state.items
        .map((item) => {
          if (item.varianteId === varianteId) {
            const cantidadFinal = Math.min(Math.max(0, cantidad), item.stockDisponible);
            return {
              ...item,
              cantidad: cantidadFinal,
              subtotal: (item.precioUnitario - item.descuento) * cantidadFinal,
            };
          }
          return item;
        })
        .filter((item) => item.cantidad > 0);

      const subtotal = calcularSubtotal(updatedItems);
      const descuentoTotal = calcularDescuentoTotal(updatedItems);

      return {
        items: updatedItems,
        subtotal,
        descuentoTotal,
        total: subtotal,
      };
    });
  },

  // Actualizar descuento de item
  updateItemDiscount: (varianteId, descuento) => {
    set((state) => {
      const updatedItems = state.items.map((item) => {
        if (item.varianteId === varianteId) {
          const descuentoFinal = Math.max(0, Math.min(descuento, item.precioUnitario));
          return {
            ...item,
            descuento: descuentoFinal,
            subtotal: (item.precioUnitario - descuentoFinal) * item.cantidad,
          };
        }
        return item;
      });

      const subtotal = calcularSubtotal(updatedItems);
      const descuentoTotal = calcularDescuentoTotal(updatedItems);

      return {
        items: updatedItems,
        subtotal,
        descuentoTotal,
        total: subtotal,
      };
    });
  },

  // Remover item
  removeItem: (varianteId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.varianteId !== varianteId);
      const subtotal = calcularSubtotal(updatedItems);
      const descuentoTotal = calcularDescuentoTotal(updatedItems);

      return {
        items: updatedItems,
        subtotal,
        descuentoTotal,
        total: subtotal,
      };
    });
  },

  // Limpiar carrito
  clearCart: () => {
    set({
      items: [],
      cliente: null,
      pagos: [],
      subtotal: 0,
      descuentoTotal: 0,
      impuestoTotal: 0,
      total: 0,
    });
  },

  // Cliente
  setCliente: (cliente) => set({ cliente }),

  // Pagos
  addPago: (pago) => {
    set((state) => ({
      pagos: [...state.pagos, pago],
    }));
  },

  removePago: (metodoPagoId) => {
    set((state) => ({
      pagos: state.pagos.filter((p) => p.metodoPagoId !== metodoPagoId),
    }));
  },

  clearPagos: () => set({ pagos: [] }),

  // Modales
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  setShowClienteModal: (show) => set({ showClienteModal: show }),
  setShowDescuentoModal: (show) => set({ showDescuentoModal: show }),

  // Sesion
  setSucursalId: (id) => set({ sucursalId: id }),
  setCajaId: (id) => set({ cajaId: id }),

  // Helpers
  getTotalPagado: () => {
    return get().pagos.reduce((acc, pago) => acc + pago.monto, 0);
  },

  getSaldoPendiente: () => {
    const { total } = get();
    const totalPagado = get().getTotalPagado();
    return Math.max(0, total - totalPagado);
  },
}));
