// =============================================================================
// cobrar.tsx — Cobro pago mixto + comprobante.
// =============================================================================

import { ComponentType, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  Smartphone,
  Ticket,
  Wallet,
  X,
} from 'lucide-react-native';

import { usePosStore } from '@/stores/pos.store';
import { useNetworkStore } from '@/stores/network.store';
import api from '@/api/client';
import { extractList, getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { refreshPendingCount } from '@/services/sync.service';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

interface Pago {
  metodoPagoId: string;
  nombre: string;
  tipo: string;
  monto: number;
}

const METODO_ICON: Record<string, ComponentType<{ color?: string; size?: number; strokeWidth?: number }>> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  yape: Smartphone,
  plin: Smartphone,
  transferencia: Landmark,
};

function iconFor(tipo?: string, nombre?: string) {
  const k1 = tipo?.toLowerCase() ?? '';
  const k2 = nombre?.toLowerCase() ?? '';
  return METODO_ICON[k1] ?? METODO_ICON[k2] ?? Wallet;
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
    AsyncStorage.getItem('pos-negocio-config').then((val) => {
      if (val) {
        const cfg = JSON.parse(val);
        setCompConfig({ ticket: cfg.ticket ?? true, boleta: cfg.boleta ?? true, factura: cfg.factura ?? false });
      }
    });
  }, []);

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then((r) => r.data).catch(() => null),
  });
  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: () => api.get('/metodos-pago', { params: { activo: true } }).then((r) => r.data),
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
    setPagos([
      ...pagos,
      {
        metodoPagoId: metodo.id,
        nombre: metodo.nombre,
        tipo: metodo.tipo || metodo.nombre?.toLowerCase() || '',
        monto: montoAUsar > restante ? restante : montoAUsar,
      },
    ]);
    setMontoPagado('');
  };

  const removePago = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPagos(pagos.filter((_, i) => i !== idx));
  };

  const ventaMutation = useMutation({
    mutationFn: (body: any) => api.post('/ventas', body).then((r) => r.data),
    onSuccess: (data) => {
      const venta = data?.data || data;
      venta._pagos = pagos;
      venta._cart = cart;
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setLastVenta(venta);
      clearCart();
      remoteLogger.info('venta_ok', { total: cartTotal });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Venta exitosa');
      router.replace('/cobrar-exito');
    },
    onError: (err: any) => {
      remoteLogger.error('venta_failed', err, { total: cartTotal });
      toastError('Error', getErrorMessage(err));
    },
  });

  const handleCobrar = async () => {
    if (pagos.length === 0) {
      toastError('Sin pagos', 'Selecciona un método de pago');
      return;
    }
    if (sumaPagos < cartTotal - 0.01) {
      toastError('Monto insuficiente', `Faltan S/ ${(cartTotal - sumaPagos).toFixed(2)}`);
      return;
    }
    if (comprobante === 'boleta' && dni.length !== 8) {
      toastError('DNI', '8 dígitos');
      return;
    }
    if (comprobante === 'factura' && ruc.length !== 11) {
      toastError('RUC', '11 dígitos');
      return;
    }

    const payload = {
      sucursalId: cajaData?.sucursalId,
      cajaId: cajaData?.id,
      tipoComprobante: comprobante,
      clienteDocumento: comprobante === 'boleta' ? dni : comprobante === 'factura' ? ruc : undefined,
      items: cart.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad, precioUnitario: i.precio })),
      pagos: pagos.map((p) => ({ metodoPagoId: p.metodoPagoId, monto: p.monto })),
    };

    if (!isOnline) {
      setSubmitting(true);
      try {
        const offlineDb = require('@/db/offline');
        await offlineDb.addVentaPendiente(payload);
        await refreshPendingCount();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastVenta({
          numeroVenta: 'OFFLINE',
          total: cartTotal,
          items: cart,
          _pagos: pagos,
          _cart: cart,
          offline: true,
        });
        clearCart();
        router.replace('/cobrar-exito');
      } catch (err: any) {
        toastError('Error', getErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!cajaData?.id) {
      toastError('Caja cerrada', 'Abre la caja primero');
      return;
    }
    ventaMutation.mutate(payload);
  };

  const comprobantes = [
    { key: 'ticket' as const, label: 'Ticket', Icon: Ticket },
    { key: 'boleta' as const, label: 'Boleta', Icon: Receipt },
    { key: 'factura' as const, label: 'Factura', Icon: FileText },
  ].filter((c) => compConfig[c.key]);

  const canCobrar = pagos.length > 0 && sumaPagos >= cartTotal - 0.01;
  const exceso = sumaPagos > cartTotal + 0.01 ? sumaPagos - cartTotal : 0;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Cobrar" subtitle={`${cart.length} producto${cart.length !== 1 ? 's' : ''}`} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(260)} style={s.totalCard}>
          <Text style={s.totalLabel}>TOTAL A COBRAR</Text>
          <Text style={s.totalAmount}>S/ {cartTotal.toFixed(2)}</Text>
          {restante > 0.01 ? (
            <Text style={s.totalRestante}>Restante S/ {restante.toFixed(2)}</Text>
          ) : (
            <Text style={s.totalCompleto}>Pago completo</Text>
          )}
        </Animated.View>

        {pagos.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <Text style={s.sectionTitle}>PAGOS REGISTRADOS</Text>
            {pagos.map((p, idx) => {
              const Icon = iconFor(p.tipo, p.nombre);
              return (
                <Animated.View
                  key={`${p.metodoPagoId}-${idx}`}
                  entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
                  exiting={FadeOut.duration(180)}
                  style={s.pagoCard}
                >
                  <View style={s.pagoIcon}>
                    <Icon color={colors.brandDark} size={18} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pagoNombre}>{p.nombre}</Text>
                    <Text style={s.pagoMonto}>S/ {p.monto.toFixed(2)}</Text>
                  </View>
                  <Pressable onPress={() => removePago(idx)} style={s.pagoRemove}>
                    <X color={colors.danger} size={14} strokeWidth={2.6} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {restante > 0.01 ? (
          <View style={s.payCard}>
            <Text style={s.payTitle}>{pagos.length === 0 ? 'Monto que entrega el cliente' : 'Monto del próximo pago'}</Text>

            <View style={s.payInputRow}>
              <Text style={s.payInputPrefix}>S/</Text>
              <TextInput
                style={s.payInput}
                value={montoPagado}
                onChangeText={setMontoPagado}
                placeholder={restante.toFixed(2)}
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="decimal-pad"
              />
            </View>

            {montoPagadoNum > 0 && vueltoSiPaga > 0 && (
              <View style={s.vueltoBadge}>
                <Text style={s.vueltoText}>Vuelto: S/ {vueltoSiPaga.toFixed(2)}</Text>
              </View>
            )}
            {montoPagadoNum > 0 && vueltoSiPaga < 0 && (
              <View style={[s.vueltoBadge, s.vueltoBadgeWarn]}>
                <Text style={s.vueltoWarnText}>Aún faltará S/ {Math.abs(vueltoSiPaga).toFixed(2)}</Text>
              </View>
            )}

            <Text style={[s.sectionTitle, { marginTop: 4, marginBottom: 12 }]}>MÉTODO DE PAGO</Text>
            <View style={s.metodosGrid}>
              {metodos.map((m: any) => {
                const Icon = iconFor(m.tipo, m.nombre);
                return (
                  <Pressable
                    key={m.id}
                    style={({ pressed }) => [s.metodoChip, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
                    onPress={() => seleccionarMetodo(m)}
                  >
                    <Icon color={colors.brand} size={22} strokeWidth={2.2} />
                    <Text style={s.metodoNombre} numberOfLines={1}>
                      {m.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(260).easing(Easing.out(Easing.cubic))} style={s.completoCard}>
            <View style={s.completoIcon}>
              <CheckCircle2 color={colors.brand} size={36} strokeWidth={2.2} />
            </View>
            <Text style={s.completoTitle}>Pago completo</Text>
            {exceso > 0 && (
              <View style={s.vueltoFinal}>
                <Text style={s.vueltoFinalLabel}>VUELTO</Text>
                <Text style={s.vueltoFinalMonto}>S/ {exceso.toFixed(2)}</Text>
              </View>
            )}
          </Animated.View>
        )}

        <Text style={s.sectionTitle}>COMPROBANTE</Text>
        <View style={s.compRow}>
          {comprobantes.map(({ key, label, Icon }) => {
            const active = comprobante === key;
            return (
              <Pressable
                key={key}
                style={({ pressed }) => [s.compChip, active && s.compChipActive, pressed && { opacity: 0.88 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setComprobante(key);
                }}
              >
                <Icon color={active ? colors.brand : colors.textMuted} size={18} strokeWidth={2.2} />
                <Text style={[s.compText, active && s.compTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        {comprobante === 'boleta' && (
          <TextInput
            style={s.docInput}
            value={dni}
            onChangeText={setDni}
            placeholder="DNI · 8 dígitos"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="numeric"
            maxLength={8}
          />
        )}
        {comprobante === 'factura' && (
          <TextInput
            style={s.docInput}
            value={ruc}
            onChangeText={setRuc}
            placeholder="RUC · 11 dígitos"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="numeric"
            maxLength={11}
          />
        )}

        <View style={{ height: 36 }} />
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <Button
          label={
            ventaMutation.isPending || submitting
              ? 'Procesando…'
              : !canCobrar
              ? `Falta S/ ${Math.max(0, restante).toFixed(2)}`
              : `Cobrar S/ ${cartTotal.toFixed(2)}`
          }
          onPress={handleCobrar}
          loading={ventaMutation.isPending || submitting}
          disabled={!canCobrar}
          size="lg"
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28 },

  totalCard: {
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    padding: 22,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: colors.brand,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  totalLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: 'rgba(255,255,255,0.78)', letterSpacing: 1.6 },
  totalAmount: { fontFamily: fonts.black, fontSize: 40, color: '#FFFFFF', marginTop: 6, letterSpacing: -1 },
  totalRestante: { fontFamily: fonts.bold, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 6, letterSpacing: 0.3 },
  totalCompleto: { fontFamily: fonts.extrabold, fontSize: 12, color: '#FFFFFF', marginTop: 6, letterSpacing: 0.6 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 10 },

  pagoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  pagoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pagoNombre: { fontFamily: fonts.semibold, fontSize: 12, color: colors.brandDark },
  pagoMonto: { fontFamily: fonts.black, fontSize: 16, color: colors.brandDark, marginTop: 2 },
  pagoRemove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },

  payCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  payTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, marginBottom: 12 },
  payInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.4,
    borderColor: colors.border,
  },
  payInputPrefix: { fontFamily: fonts.black, fontSize: 26, color: colors.brand, marginRight: 10 },
  payInput: { flex: 1, height: 60, fontFamily: fonts.black, fontSize: 30, color: colors.text, padding: 0 },

  vueltoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandTint,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  vueltoText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.brandDark },
  vueltoBadgeWarn: { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder },
  vueltoWarnText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.warningText },

  metodosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metodoChip: {
    flexGrow: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.4,
    borderColor: colors.border,
    gap: 6,
  },
  metodoNombre: { fontFamily: fonts.bold, fontSize: 11, color: colors.text, letterSpacing: 0.2 },

  completoCard: {
    backgroundColor: colors.brandTint,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  completoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
    marginBottom: 10,
  },
  completoTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.brandDark, letterSpacing: -0.3 },
  vueltoFinal: { marginTop: 14, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 28, borderWidth: 1, borderColor: colors.brandSoft },
  vueltoFinalLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.brandDark, letterSpacing: 1.4 },
  vueltoFinalMonto: { fontFamily: fonts.black, fontSize: 32, color: colors.brand, marginTop: 4 },

  compRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  compChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.4,
    borderColor: colors.divider,
  },
  compChipActive: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  compText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  compTextActive: { color: colors.brand, fontFamily: fonts.extrabold },
  docInput: {
    height: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontFamily: fonts.bold,
    fontSize: 15.5,
    borderWidth: 1.4,
    borderColor: colors.divider,
    color: colors.text,
    letterSpacing: 2,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
});
