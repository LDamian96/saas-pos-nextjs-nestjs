// =============================================================================
// ventas/[id].tsx — Detalles completos de una venta.
// Muestra: nro, fecha, vendedor, items con cantidad+subtotal, pagos por metodo,
// totales. Botones: reimprimir, reenviar por WhatsApp.
// =============================================================================

import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { toastError } from '@/api/helpers';

const EMOJI: Record<string, string> = {
  efectivo: '💵', tarjeta: '💳', yape: '📱', plin: '📱',
  digital: '📱', transferencia: '🏦',
};

export default function VentaDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useAuthStore();
  const [waOpen, setWaOpen] = useState(false);
  const [waPhone, setWaPhone] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['venta', id],
    queryFn: () => api.get(`/ventas/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const venta = data?.data || data || {};
  // El backend devuelve items y pagos con campos PLANOS:
  // items: [{ productoNombre, varianteSku, cantidad, precioUnitario, subtotal, ... }]
  // pagos: [{ metodoPagoNombre, metodoPagoId, monto, referencia }]
  const items: any[] = venta?.items || venta?.detalles || [];
  const pagos: any[] = venta?.pagos || [];
  const total = Number(venta?.total || 0);
  const subtotal = Number(venta?.subtotal || (total / 1.18));
  const igv = Number(venta?.impuesto || venta?.impuestoTotal || venta?.igv || (total - subtotal));
  const fechaStr = venta?.createdAt
    ? new Date(venta.createdAt).toLocaleString('es-PE', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  const buildWaMessage = () => {
    let msg = `*${usuario?.empresa?.nombre || 'POS Shop'}*\n`;
    msg += `Venta: ${venta?.numeroVenta || venta?.numero || ''}\n`;
    msg += `${fechaStr}\n\n`;
    items.forEach((i: any) => {
      const nombre = i.productoNombre || i.variante?.producto?.nombre || i.nombre || 'Producto';
      const cant = Number(i.cantidad || 0);
      const precio = Number(i.precioUnitario || i.precioUnidad || i.precio || 0);
      msg += `${nombre} x${cant} — S/ ${(precio * cant).toFixed(2)}\n`;
    });
    msg += `\n*TOTAL: S/ ${total.toFixed(2)}*\nGracias por su compra`;
    return msg;
  };

  const sendWhatsApp = async () => {
    const clean = waPhone.replace(/\D/g, '');
    if (clean.length < 9) {
      toastError('Telefono invalido', 'Ingresa 9 digitos');
      return;
    }
    const phone = clean.length === 9 ? `51${clean}` : clean;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWaMessage())}`;
    setWaOpen(false);
    try {
      await Linking.openURL(url);
    } catch {
      toastError('Error', 'No pude abrir WhatsApp');
    }
  };

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.6}>
          <Text style={s.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Detalle de venta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Card principal con total */}
        <View style={s.heroCard}>
          <Text style={s.heroNumero}>{venta?.numeroVenta || venta?.numero || ''}</Text>
          <Text style={s.heroTotal}>S/ {total.toFixed(2)}</Text>
          <Text style={s.heroFecha}>{fechaStr}</Text>
          {venta?.tipoComprobante && (
            <View style={s.tipoChip}>
              <Text style={s.tipoChipText}>{(venta.tipoComprobante).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Info del vendedor */}
        {(venta?.usuarioNombre || venta?.usuario?.nombre) && (
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>VENDEDOR</Text>
            <Text style={s.infoValue}>
              {venta?.usuarioNombre || venta?.usuario?.nombre} {venta?.usuario?.apellido || ''}
            </Text>
          </View>
        )}

        {/* Items */}
        <Text style={s.sectionTitle}>📦 PRODUCTOS</Text>
        <View style={s.itemsCard}>
          {items.length > 0 ? items.map((it: any, idx: number) => {
            // Campos PLANOS del backend: productoNombre, varianteSku, cantidad, precioUnitario, subtotal
            const nombre = it.productoNombre || it.variante?.producto?.nombre || it.nombre || 'Producto';
            const sku = it.varianteSku || it.variante?.sku || it.sku || '';
            const cant = Number(it.cantidad || 0);
            const precio = Number(it.precioUnitario || it.precioUnidad || it.precio || 0);
            const sub = Number(it.subtotal || precio * cant);
            return (
              <View key={idx} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={s.itemName} numberOfLines={2}>{nombre}</Text>
                  <Text style={s.itemSku}>{sku} · {cant} x S/ {precio.toFixed(2)}</Text>
                </View>
                <Text style={s.itemSub}>S/ {sub.toFixed(2)}</Text>
              </View>
            );
          }) : (
            <Text style={s.empty}>Sin items</Text>
          )}
        </View>

        {/* Totales */}
        <View style={s.totalesCard}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>S/ {subtotal.toFixed(2)}</Text>
          </View>
          {igv > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IGV</Text>
              <Text style={[s.totalValue, { color: '#f59e0b' }]}>S/ {igv.toFixed(2)}</Text>
            </View>
          )}
          <View style={[s.totalRow, s.totalFinalRow]}>
            <Text style={s.totalFinalLabel}>Total</Text>
            <Text style={s.totalFinalValue}>S/ {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Pagos */}
        {pagos.length > 0 && (
          <>
            <Text style={s.sectionTitle}>💰 PAGOS</Text>
            <View style={s.pagosCard}>
              {pagos.map((p: any, idx: number) => {
                // Backend devuelve metodoPagoNombre PLANO
                const nombre = p.metodoPagoNombre || p.metodoPago?.nombre || p.nombre || 'Pago';
                const tipo = (p.metodoPago?.tipo || p.tipo || nombre || '').toLowerCase();
                const emoji = EMOJI[tipo] || EMOJI[nombre.toLowerCase()] || '💰';
                return (
                  <View key={idx} style={[s.pagoRow, idx < pagos.length - 1 && s.itemRowBorder]}>
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.pagoNombre}>{nombre}</Text>
                      {p.referencia && <Text style={s.pagoRef}>Ref: {p.referencia}</Text>}
                    </View>
                    <Text style={s.pagoMonto}>S/ {Number(p.monto || 0).toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Acciones */}
        <View style={s.actions}>
          <TouchableOpacity style={s.wspBtn} onPress={() => setWaOpen(true)} activeOpacity={0.85}>
            <Text style={s.wspBtnText}>📱  Reenviar por WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal WhatsApp */}
      <Modal visible={waOpen} transparent animationType="fade" onRequestClose={() => setWaOpen(false)}>
        <Pressable style={s.modalScrim} onPress={() => setWaOpen(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            <View style={s.modalIcon}><Text style={{ fontSize: 30 }}>📱</Text></View>
            <Text style={s.modalTitle}>Enviar al cliente</Text>
            <Text style={s.modalDesc}>Numero del cliente. Abrira su chat directo.</Text>
            <View style={s.phoneRow}>
              <View style={s.phonePrefix}><Text style={s.phonePrefixText}>+51</Text></View>
              <TextInput
                style={s.phoneInput}
                value={waPhone}
                onChangeText={setWaPhone}
                placeholder="987 654 321"
                placeholderTextColor="#cbd5e1"
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setWaOpen(false)}>
                <Text style={s.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSend} onPress={sendWhatsApp}>
                <Text style={s.modalSendText}>📤  Enviar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#7c3aed', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },

  scroll: { padding: 20, paddingBottom: 60 },

  // Hero
  heroCard: {
    backgroundColor: '#7c3aed', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 18,
    elevation: 4, shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  heroNumero: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5 },
  heroTotal: { fontSize: 38, fontWeight: '800', color: '#ffffff', marginTop: 6, letterSpacing: -0.5 },
  heroFecha: { fontSize: 12, color: 'rgba(255,255,255,0.78)', marginTop: 8, textTransform: 'capitalize' },
  tipoChip: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  tipoChipText: { fontSize: 11, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },

  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 4 },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#475569', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  itemsCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 6, marginBottom: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#0f172a', lineHeight: 18 },
  itemSku: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  itemSub: { fontSize: 15, fontWeight: '800', color: '#334155' },

  totalesCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  totalLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  totalValue: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  totalFinalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, marginTop: 4 },
  totalFinalLabel: { fontSize: 15, color: '#0f172a', fontWeight: '800', letterSpacing: 0.5 },
  totalFinalValue: { fontSize: 22, fontWeight: '800', color: '#16a34a' },

  pagosCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 6, marginBottom: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  pagoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  pagoNombre: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  pagoRef: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  pagoMonto: { fontSize: 17, fontWeight: '800', color: '#15803d' },

  empty: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 13 },

  actions: { marginTop: 8 },
  wspBtn: {
    height: 56, backgroundColor: '#22c55e', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  wspBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

  // Modal WhatsApp
  modalScrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, elevation: 10 },
  modalIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  modalDesc: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  phoneRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#e2e8f0' },
  phonePrefixText: { fontSize: 16, fontWeight: '800', color: '#7c3aed' },
  phoneInput: { flex: 1, height: 52, paddingHorizontal: 14, fontSize: 17, color: '#0f172a', fontWeight: '700', letterSpacing: 1 },
  modalCancel: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { color: '#475569', fontWeight: '700' },
  modalSend: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  modalSendText: { color: '#ffffff', fontWeight: '800' },
});
