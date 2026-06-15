import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePosStore } from '@/stores/pos.store';
import { useNetworkStore } from '@/stores/network.store';
import api from '@/api/client';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';
import { refreshPendingCount } from '@/services/sync.service';

const EMOJI: Record<string, string> = {
  efectivo: '💵', tarjeta: '💳', yape: '📱', plin: '📱', transferencia: '🏦',
};

interface Pago {
  metodoPagoId: string;
  nombre: string;
  tipo: string;
  monto: number;
}

export default function CobrarScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { cart, total, comprobante, setComprobante, dni, setDni, ruc, setRuc, clearCart, setLastVenta } = usePosStore();
  const { isOnline } = useNetworkStore();
  const cartTotal = total();

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [montoPagado, setMontoPagado] = useState('');
  const [compConfig, setCompConfig] = useState({ ticket: true, boleta: true, factura: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('pos-negocio-config').then(val => {
      if (val) {
        const cfg = JSON.parse(val);
        setCompConfig({ ticket: cfg.ticket ?? true, boleta: cfg.boleta ?? true, factura: cfg.factura ?? false });
      }
    });
  }, []);

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then(r => r.data).catch(() => null),
  });
  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: () => api.get('/metodos-pago', { params: { activo: true } }).then(r => r.data),
  });
  const metodos = extractList(metodosData);

  const sumaPagos = pagos.reduce((s, p) => s + p.monto, 0);
  const restante = Math.round((cartTotal - sumaPagos) * 100) / 100;
  const montoPagadoNum = Number(montoPagado) || 0;
  const montoAUsar = montoPagadoNum > 0 ? montoPagadoNum : restante;
  const vueltoSiPaga = montoAUsar - restante;

  const seleccionarMetodo = (metodo: any) => {
    if (restante <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setPagos([...pagos, {
      metodoPagoId: metodo.id,
      nombre: metodo.nombre,
      tipo: metodo.tipo || metodo.nombre?.toLowerCase() || '',
      monto: montoAUsar > restante ? restante : montoAUsar,
    }]);
    setMontoPagado('');
  };

  const removePago = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPagos(pagos.filter((_, i) => i !== idx));
  };

  const ventaMutation = useMutation({
    mutationFn: (body: any) => api.post('/ventas', body).then(r => r.data),
    onSuccess: (data) => {
      const venta = data?.data || data;
      venta._pagos = pagos;
      venta._cart = cart;
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setLastVenta(venta);
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Venta exitosa');
      router.replace('/cobrar-exito');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const handleCobrar = async () => {
    if (pagos.length === 0) { toastError('Sin pagos', 'Selecciona un metodo de pago'); return; }
    if (sumaPagos < cartTotal - 0.01) { toastError('Monto insuficiente', `Faltan S/ ${(cartTotal - sumaPagos).toFixed(2)}`); return; }
    if (comprobante === 'boleta' && dni.length !== 8) { toastError('DNI', '8 digitos'); return; }
    if (comprobante === 'factura' && ruc.length !== 11) { toastError('RUC', '11 digitos'); return; }

    const payload = {
      sucursalId: cajaData?.sucursalId, cajaId: cajaData?.id,
      tipoComprobante: comprobante,
      clienteDocumento: comprobante === 'boleta' ? dni : comprobante === 'factura' ? ruc : undefined,
      items: cart.map(i => ({ varianteId: i.varianteId, cantidad: i.cantidad, precioUnitario: i.precio })),
      pagos: pagos.map(p => ({ metodoPagoId: p.metodoPagoId, monto: p.monto })),
    };

    if (!isOnline) {
      setSubmitting(true);
      try {
        const offlineDb = require('@/db/offline');
        await offlineDb.addVentaPendiente(payload);
        await refreshPendingCount();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastVenta({ numeroVenta: 'OFFLINE', total: cartTotal, items: cart, _pagos: pagos, _cart: cart, offline: true });
        clearCart(); router.replace('/cobrar-exito');
      } catch (err: any) { toastError('Error', getErrorMessage(err)); }
      finally { setSubmitting(false); }
      return;
    }
    if (!cajaData?.id) { toastError('Caja cerrada', 'Abre la caja primero'); return; }
    ventaMutation.mutate(payload);
  };

  const comprobantes = [
    { key: 'ticket' as const, label: 'Ticket', emoji: '🧾' },
    { key: 'boleta' as const, label: 'Boleta', emoji: '📄' },
    { key: 'factura' as const, label: 'Factura', emoji: '📋' },
  ].filter(c => compConfig[c.key]);

  const canCobrar = pagos.length > 0 && sumaPagos >= cartTotal - 0.01;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.6}>
          <Text style={s.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cobrar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Total Card */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>TOTAL A COBRAR</Text>
          <Text style={s.totalAmount}>S/ {cartTotal.toFixed(2)}</Text>
          <Text style={s.totalItems}>{cart.length} producto{cart.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* Confirmed payments */}
        {pagos.length > 0 && (
          <View style={s.pagosSection}>
            <Text style={s.sectionTitle}>Pagos registrados</Text>
            {pagos.map((p, idx) => {
              const emoji = EMOJI[p.tipo?.toLowerCase()] || EMOJI[p.nombre?.toLowerCase()] || '💰';
              return (
                <View key={idx} style={s.pagoCard}>
                  <View style={s.pagoIconWrap}>
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pagoNombre}>{p.nombre}</Text>
                    <Text style={s.pagoMonto}>S/ {p.monto.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removePago(idx)} style={s.pagoRemove} activeOpacity={0.6}>
                    <Text style={s.pagoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Payment input section */}
        {restante > 0.01 ? (
          <View style={s.payCard}>
            <Text style={s.payTitle}>
              {pagos.length === 0 ? 'Monto del cliente' : `Restante: S/ ${restante.toFixed(2)}`}
            </Text>

            <View style={s.payInputRow}>
              <Text style={s.payInputPrefix}>S/</Text>
              <TextInput
                style={s.payInput}
                value={montoPagado}
                onChangeText={setMontoPagado}
                placeholder={restante.toFixed(2)}
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Change/remaining indicator */}
            {montoPagadoNum > 0 && vueltoSiPaga > 0 && (
              <View style={s.vueltoBadge}>
                <Text style={s.vueltoBadgeText}>Vuelto: S/ {vueltoSiPaga.toFixed(2)}</Text>
              </View>
            )}
            {montoPagadoNum > 0 && vueltoSiPaga < 0 && (
              <View style={[s.vueltoBadge, s.vueltoBadgeWarn]}>
                <Text style={[s.vueltoBadgeText, s.vueltoBadgeWarnText]}>Despues faltara: S/ {Math.abs(vueltoSiPaga).toFixed(2)}</Text>
              </View>
            )}

            {/* Payment method pills */}
            <Text style={s.metodosLabel}>Selecciona metodo de pago</Text>
            <View style={s.metodosGrid}>
              {metodos.map((m: any) => {
                const emoji = EMOJI[m.tipo?.toLowerCase()] || EMOJI[m.nombre?.toLowerCase()] || '💰';
                return (
                  <TouchableOpacity key={m.id} style={s.metodoChip} onPress={() => seleccionarMetodo(m)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    <Text style={s.metodoNombre} numberOfLines={1}>{m.nombre}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={s.completoCard}>
            <Text style={s.completoEmoji}>✅</Text>
            <Text style={s.completoTitle}>Pago completo</Text>
            {sumaPagos > cartTotal + 0.01 && (
              <View style={s.vueltoFinalCard}>
                <Text style={s.vueltoFinalLabel}>VUELTO</Text>
                <Text style={s.vueltoFinalMonto}>S/ {(sumaPagos - cartTotal).toFixed(2)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Comprobante */}
        <View style={s.comprobanteSection}>
          <Text style={s.sectionTitle}>Comprobante</Text>
          <View style={s.compRow}>
            {comprobantes.map(c => (
              <TouchableOpacity
                key={c.key}
                style={[s.compChip, comprobante === c.key && s.compChipActive]}
                onPress={() => setComprobante(c.key)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 18 }}>{c.emoji}</Text>
                <Text style={[s.compChipText, comprobante === c.key && s.compChipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {comprobante === 'boleta' && (
            <TextInput style={s.docInput} value={dni} onChangeText={setDni} placeholder="DNI (8 digitos)" placeholderTextColor="#94a3b8" keyboardType="numeric" maxLength={8} />
          )}
          {comprobante === 'factura' && (
            <TextInput style={s.docInput} value={ruc} onChangeText={setRuc} placeholder="RUC (11 digitos)" placeholderTextColor="#94a3b8" keyboardType="numeric" maxLength={11} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[s.cobrarBtn, !canCobrar && s.cobrarBtnDisabled]}
          onPress={handleCobrar}
          disabled={!canCobrar || ventaMutation.isPending || submitting}
          activeOpacity={0.8}
        >
          <Text style={s.cobrarText}>
            {ventaMutation.isPending || submitting ? 'Procesando...'
              : !canCobrar ? `Falta S/ ${Math.max(0, restante).toFixed(2)}`
              : `Cobrar S/ ${cartTotal.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: '#7c3aed', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },

  content: { padding: 20, paddingBottom: 30 },

  // Total card - purple accent
  totalCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  totalLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5 },
  totalAmount: { fontSize: 42, fontWeight: '800', color: '#ffffff', marginTop: 6 },
  totalItems: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // Pagos section
  pagosSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 12, letterSpacing: 0.2 },

  pagoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pagoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pagoNombre: { fontSize: 13, color: '#166534', fontWeight: '600' },
  pagoMonto: { fontSize: 18, fontWeight: '800', color: '#15803d', marginTop: 2 },
  pagoRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  pagoRemoveText: { color: '#ef4444', fontWeight: '700', fontSize: 13 },

  // Payment input card
  payCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  payTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  payInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  payInputPrefix: { fontSize: 28, fontWeight: '800', color: '#7c3aed', marginRight: 10 },
  payInput: { flex: 1, height: 64, fontSize: 34, fontWeight: '800', color: '#0f172a' },

  vueltoBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  vueltoBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  vueltoBadgeWarn: { backgroundColor: '#fef3c7' },
  vueltoBadgeWarnText: { color: '#d97706' },

  metodosLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  metodosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metodoChip: {
    flexGrow: 1,
    minWidth: '28%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  metodoNombre: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 6 },

  // Complete state
  completoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completoEmoji: { fontSize: 40 },
  completoTitle: { fontSize: 18, fontWeight: '800', color: '#15803d', marginTop: 10 },
  vueltoFinalCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 16,
    alignItems: 'center',
  },
  vueltoFinalLabel: { fontSize: 11, fontWeight: '700', color: '#166534', letterSpacing: 1.5 },
  vueltoFinalMonto: { fontSize: 34, fontWeight: '800', color: '#16a34a', marginTop: 4 },

  // Comprobante section
  comprobanteSection: { marginBottom: 10 },
  compRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  compChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  compChipActive: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  compChipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  compChipTextActive: { color: '#7c3aed' },
  docInput: {
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    letterSpacing: 2,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  cobrarBtn: {
    height: 58,
    backgroundColor: '#16a34a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cobrarBtnDisabled: { backgroundColor: '#cbd5e1', elevation: 0, shadowOpacity: 0 },
  cobrarText: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
