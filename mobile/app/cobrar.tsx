// =============================================================================
// cobrar.tsx — Cobrar con pago mixto + comprobante Ticket/Boleta/Factura.
// =============================================================================

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  Receipt,
  Smartphone,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from 'tamagui';

import api from '@/api/client';
import { extractList, getErrorMessage } from '@/api/helpers';
import { useNetworkStore } from '@/stores/network.store';
import { usePosStore } from '@/stores/pos.store';
import { refreshPendingCount } from '@/services/sync.service';
import { AppHeader } from '@/components/ui/AppHeader';
import { PressableButton } from '@/components/ui/PressableButton';
import { toastError, toastSuccess } from '@/services/toast';
import { remoteLogger } from '@/services/remote-logger';

interface Pago {
  metodoPagoId: string;
  nombre: string;
  tipo: string;
  monto: number;
}

const PAYMENT_ICONS: Record<string, LucideIcon> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  yape: Smartphone,
  plin: Smartphone,
  transferencia: Landmark,
};

function iconFor(tipo?: string, nombre?: string): LucideIcon {
  const key = (tipo ?? nombre ?? '').toLowerCase();
  for (const k of Object.keys(PAYMENT_ICONS)) {
    if (key.includes(k)) return PAYMENT_ICONS[k];
  }
  return Wallet;
}

export default function CobrarScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { cart, total, comprobante, setComprobante, dni, setDni, ruc, setRuc, clearCart, setLastVenta } =
    usePosStore();
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
        setCompConfig({
          ticket: cfg.ticket ?? true,
          boleta: cfg.boleta ?? true,
          factura: cfg.factura ?? false,
        });
      }
    });
  }, []);

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () =>
      api
        .get('/caja/actual')
        .then((r) => r.data)
        .catch(() => null),
  });
  const { data: metodosData } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: () => api.get('/metodos-pago', { params: { activo: true } }).then((r) => r.data),
  });
  const metodos = extractList(metodosData);

  const sumaPagos = pagos.reduce((s, p) => s + p.monto, 0);
  const restante = Math.round((cartTotal - sumaPagos) * 100) / 100;
  const montoNum = Number(montoPagado) || 0;
  const montoAUsar = montoNum > 0 ? montoNum : restante;
  const vueltoSiPaga = montoAUsar - restante;

  const seleccionarMetodo = (metodo: { id: string; nombre: string; tipo?: string }) => {
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
    mutationFn: (body: Record<string, unknown>) =>
      api.post('/ventas', body).then((r) => r.data),
    onSuccess: (data) => {
      const venta = data?.data || data;
      venta._pagos = pagos;
      venta._cart = cart;
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setLastVenta(venta);
      clearCart();
      remoteLogger.info('venta_success', { id: venta?.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess({ title: 'Venta exitosa' });
      router.replace('/cobrar-exito');
    },
    onError: (err: Error) => {
      remoteLogger.error('venta_failed', err);
      toastError({ title: 'Error', message: getErrorMessage(err) });
    },
  });

  const handleCobrar = async () => {
    if (pagos.length === 0) {
      toastError({ title: 'Sin pagos', message: 'Selecciona un método de pago' });
      return;
    }
    if (sumaPagos < cartTotal - 0.01) {
      toastError({ title: 'Monto insuficiente', message: `Faltan S/ ${(cartTotal - sumaPagos).toFixed(2)}` });
      return;
    }
    if (comprobante === 'boleta' && dni.length !== 8) {
      toastError({ title: 'DNI', message: '8 dígitos' });
      return;
    }
    if (comprobante === 'factura' && ruc.length !== 11) {
      toastError({ title: 'RUC', message: '11 dígitos' });
      return;
    }

    const payload = {
      sucursalId: cajaData?.sucursalId,
      cajaId: cajaData?.id,
      tipoComprobante: comprobante,
      clienteDocumento:
        comprobante === 'boleta' ? dni : comprobante === 'factura' ? ruc : undefined,
      items: cart.map((i) => ({
        varianteId: i.varianteId,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
      })),
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
      } catch (err) {
        toastError({ title: 'Error', message: getErrorMessage(err) });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!cajaData?.id) {
      toastError({ title: 'Caja cerrada', message: 'Abre la caja primero' });
      return;
    }
    ventaMutation.mutate(payload);
  };

  const comprobantes = [
    { key: 'ticket' as const, label: 'Ticket', icon: Receipt },
    { key: 'boleta' as const, label: 'Boleta', icon: FileText },
    { key: 'factura' as const, label: 'Factura', icon: FileSpreadsheet },
  ].filter((c) => compConfig[c.key]);

  const canCobrar = pagos.length > 0 && sumaPagos >= cartTotal - 0.01;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <AppHeader title="Cobrar" subtitle={`${cart.length} producto${cart.length === 1 ? '' : 's'}`} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ─── Total ───────────────────────── */}
        <Animated.View entering={FadeInUp.duration(260).easing(Easing.out(Easing.cubic))} style={s.totalCard}>
          <Text fontFamily="$body" fontSize={11} color="rgba(255,255,255,0.7)" fontWeight="700" letterSpacing={1.4}>
            TOTAL A COBRAR
          </Text>
          <Text fontFamily="$body" fontSize={40} color="#FFFFFF" fontWeight="900" marginTop={6} letterSpacing={-1}>
            S/ {cartTotal.toFixed(2)}
          </Text>
        </Animated.View>

        {/* ─── Pagos registrados ──────────── */}
        {pagos.length > 0 && (
          <View style={{ marginBottom: 18 }}>
            <SectionTitle>Pagos registrados</SectionTitle>
            {pagos.map((p, idx) => {
              const Icon = iconFor(p.tipo, p.nombre);
              return (
                <Animated.View
                  key={`${p.metodoPagoId}-${idx}`}
                  entering={FadeIn.duration(220)}
                  layout={LinearTransition.springify().damping(18).stiffness(220)}
                  style={s.pagoCard}
                >
                  <View style={s.pagoIcon}>
                    <Icon color="#00932C" size={20} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text fontFamily="$body" fontSize={13} fontWeight="700" color="#15803D">
                      {p.nombre}
                    </Text>
                    <Text fontFamily="$body" fontSize={18} fontWeight="900" color="#15803D">
                      S/ {p.monto.toFixed(2)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removePago(idx)} style={s.pagoRemove}>
                    <X color="#E53935" size={14} strokeWidth={2.4} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ─── Input de pago ───────────────── */}
        {restante > 0.01 ? (
          <Animated.View entering={FadeInDown.delay(60).duration(280)} style={s.payCard}>
            <Text fontFamily="$body" fontSize={14} fontWeight="700" color="$color" marginBottom={14}>
              {pagos.length === 0 ? 'Monto del cliente' : `Falta: S/ ${restante.toFixed(2)}`}
            </Text>

            <View style={s.payInputRow}>
              <Text fontFamily="$body" fontSize={28} fontWeight="900" color="#00932C" marginRight={10}>
                S/
              </Text>
              <TextInput
                style={s.payInput}
                value={montoPagado}
                onChangeText={setMontoPagado}
                placeholder={restante.toFixed(2)}
                placeholderTextColor="#CBD5C9"
                keyboardType="decimal-pad"
              />
            </View>

            {montoNum > 0 && vueltoSiPaga > 0 && (
              <View style={s.vueltoBadge}>
                <Text fontFamily="$body" fontSize={13} fontWeight="800" color="#15803D">
                  Vuelto: S/ {vueltoSiPaga.toFixed(2)}
                </Text>
              </View>
            )}

            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.4} marginTop={14} marginBottom={10}>
              MÉTODO DE PAGO
            </Text>
            <View style={s.metodosGrid}>
              {metodos.map((m: { id: string; nombre: string; tipo?: string }) => {
                const Icon = iconFor(m.tipo, m.nombre);
                return (
                  <Pressable key={m.id} onPress={() => seleccionarMetodo(m)} style={s.metodoChip}>
                    <Icon color="#0C0C0C" size={22} strokeWidth={2.2} />
                    <Text fontFamily="$body" fontSize={11} fontWeight="700" color="#475569" marginTop={6}>
                      {m.nombre}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(280)} style={s.completoCard}>
            <CheckCircle2 color="#00932C" size={42} strokeWidth={2} />
            <Text fontFamily="$body" fontSize={18} fontWeight="900" color="#15803D" marginTop={10}>
              Pago completo
            </Text>
            {sumaPagos > cartTotal + 0.01 && (
              <View style={s.vueltoFinal}>
                <Text fontFamily="$body" fontSize={11} fontWeight="800" color="#166534" letterSpacing={1.4}>
                  VUELTO
                </Text>
                <Text fontFamily="$body" fontSize={32} fontWeight="900" color="#00932C" marginTop={4}>
                  S/ {(sumaPagos - cartTotal).toFixed(2)}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* ─── Comprobante ─────────────────── */}
        <View style={{ marginTop: 18 }}>
          <SectionTitle>Comprobante</SectionTitle>
          <View style={s.compRow}>
            {comprobantes.map((c) => {
              const active = comprobante === c.key;
              const Icon = c.icon;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setComprobante(c.key);
                  }}
                  style={[s.compChip, active && s.compChipActive]}
                >
                  <Icon color={active ? '#00932C' : '#475569'} size={18} strokeWidth={2.2} />
                  <Text
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight="700"
                    color={active ? '#00932C' : '#475569'}
                    marginLeft={6}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {comprobante === 'boleta' && (
            <TextInput
              style={s.docInput}
              value={dni}
              onChangeText={setDni}
              placeholder="DNI (8 dígitos)"
              placeholderTextColor="#A8B0AB"
              keyboardType="numeric"
              maxLength={8}
            />
          )}
          {comprobante === 'factura' && (
            <TextInput
              style={s.docInput}
              value={ruc}
              onChangeText={setRuc}
              placeholder="RUC (11 dígitos)"
              placeholderTextColor="#A8B0AB"
              keyboardType="numeric"
              maxLength={11}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Footer ────────────────────────── */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PressableButton
          label={
            ventaMutation.isPending || submitting
              ? 'Procesando…'
              : !canCobrar
              ? `Falta S/ ${Math.max(0, restante).toFixed(2)}`
              : `Cobrar S/ ${cartTotal.toFixed(2)}`
          }
          size="lg"
          variant="primary"
          disabled={!canCobrar}
          loading={ventaMutation.isPending || submitting}
          onPress={handleCobrar}
        />
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$color" marginBottom={10}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 16, paddingBottom: 30 },

  totalCard: {
    backgroundColor: '#00932C',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00932C',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  pagoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF7EF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pagoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pagoRemove: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  payCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF0EF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  payInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },
  payInput: {
    flex: 1,
    height: 60,
    fontFamily: 'Mulish_900Black',
    fontSize: 32,
    color: '#0C0C0C',
  },
  vueltoBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  metodosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metodoChip: {
    flexGrow: 1,
    minWidth: '28%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F7F8FA',
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },

  completoCard: {
    backgroundColor: '#EBF7EF',
    borderRadius: 20,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  vueltoFinal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginTop: 14,
    alignItems: 'center',
  },

  compRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  compChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },
  compChipActive: { backgroundColor: '#EBF7EF', borderColor: '#00932C' },
  docInput: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
    color: '#0C0C0C',
    letterSpacing: 2,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF0EF',
  },
});
