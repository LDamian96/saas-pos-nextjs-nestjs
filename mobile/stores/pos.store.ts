import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export interface CartItem {
  varianteId: string;
  productoId: string;
  nombre: string;
  imagen: string | null;
  cantidad: number;
  precio: number;
  stock: number;
}

interface PosState {
  cart: CartItem[];
  comprobante: 'ticket' | 'boleta' | 'factura';
  dni: string;
  ruc: string;
  lastVenta: any;
  scannerMode: 'addToCart' | 'returnCode';
  scannedCode: string | null;

  // Computed-like
  total: () => number;
  itemCount: () => number;

  // Actions
  addToCart: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void;
  removeFromCart: (varianteId: string) => void;
  updateQuantity: (varianteId: string, cantidad: number) => void;
  clearCart: () => void;
  setComprobante: (tipo: 'ticket' | 'boleta' | 'factura') => void;
  setDni: (dni: string) => void;
  setRuc: (ruc: string) => void;
  setLastVenta: (venta: any) => void;
  setScannerMode: (mode: 'addToCart' | 'returnCode') => void;
  setScannedCode: (code: string | null) => void;
  reset: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  comprobante: 'ticket',
  dni: '',
  ruc: '',
  lastVenta: null,
  scannerMode: 'addToCart',
  scannedCode: null,

  total: () => get().cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
  itemCount: () => get().cart.reduce((sum, i) => sum + i.cantidad, 0),

  addToCart: (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set((state) => {
      const existing = state.cart.find((i) => i.varianteId === item.varianteId);
      if (existing) {
        if (existing.cantidad >= item.stock) return state;
        return {
          cart: state.cart.map((i) =>
            i.varianteId === item.varianteId
              ? { ...i, cantidad: i.cantidad + (item.cantidad || 1) }
              : i
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          { ...item, cantidad: item.cantidad || 1 } as CartItem,
        ],
      };
    });
  },

  removeFromCart: (varianteId) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.varianteId !== varianteId),
    }));
  },

  updateQuantity: (varianteId, cantidad) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cantidad <= 0) {
      get().removeFromCart(varianteId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((i) =>
        i.varianteId === varianteId ? { ...i, cantidad } : i
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  setComprobante: (tipo) => set({ comprobante: tipo }),
  setDni: (dni) => set({ dni }),
  setRuc: (ruc) => set({ ruc }),
  setLastVenta: (venta) => set({ lastVenta: venta }),
  setScannerMode: (mode) => set({ scannerMode: mode }),
  setScannedCode: (code) => set({ scannedCode: code }),

  reset: () =>
    set({
      cart: [],
      comprobante: 'ticket',
      dni: '',
      ruc: '',
      lastVenta: null,
      scannedCode: null,
      scannerMode: 'addToCart',
    }),
}));
