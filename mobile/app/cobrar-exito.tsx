// =============================================================================
// cobrar-exito.tsx — Confirmación + ticket + acciones (imprimir / WhatsApp).
// =============================================================================

import { ComponentType, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  MessageCircle,
  Plus,
  Printer,
  Smartphone,
  Wallet,
  WifiOff,
} from 'lucide-react-native';

import { usePosStore } from '@/stores/pos.store';
import { useAuthStore } from '@/stores/auth.store';
import { getSelectedPrinter, printTicket } from '@/services/printer.service';
import { toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

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

export default function CobrarExitoScreen() {
  const insets = useSafeAreaInsets();
  const { lastVenta, reset } = usePosStore();
  const { usuario } = useAuthStore();
  const ventaTotal = Number(lastVenta?.total || 0);
  const isOffline = lastVenta?.offline;
  const [printing, setPrinting] = useState(false);
  const [hasPrinter, setHasPrinter] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const items = lastVenta?._cart || lastVenta?.items || [];
  const pagos = lastVenta?._pagos || [];
  const fecha = new Date();

  const checkScale = useSharedValue(0.4);
  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    getSelectedPrinter().then((p) => setHasPrinter(!!p));
    AsyncStorage.getItem('pos-negocio-config').then((val) => {
      if (val) {
        try {
          setWhatsappEnabled(JSON.parse(val).whatsapp !== false);
        } catch {}
      }
    });
  }, []);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  const handleWhatsApp = () => {
    let msg = `*${usuario?.empresa?.nombre || 'POS Shop'}*\n`;
    msg += `Venta: ${lastVenta?.numeroVenta || ''}\n`;
    msg += `${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    items.forEach((i: any) => {
      msg += `${i.nombre} x${i.cantidad} — S/ ${(Number(i.precio || i.precioUnitario || 0) * i.cantidad).toFixed(2)}\n`;
    });
    msg += `\n*TOTAL: S/ ${ventaTotal.toFixed(2)}*\n\nGracias por su compra`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printTicket({
        empresa: { nombre: usuario?.empresa?.nombre || 'POS Shop' },
        venta: { numero: lastVenta?.numeroVenta, fecha: fecha.toLocaleString('es-PE'), tipoComprobante: lastVenta?.tipoComprobante },
        items: items.map((i: any) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: Number(i.precio || i.precioUnitario || 0),
          subtotal: Number(i.precio || i.precioUnitario || 0) * i.cantidad,
        })),
        totales: { total: ventaTotal },
        metodoPago: pagos.map((p: any) => p.nombre).join(' + '),
      });
      toastSuccess('Ticket impreso');
    } catch (err: any) {
      remoteLogger.error('print_failed', err);
      toastError('Error', err?.message || 'Verifica la impresora');
    } finally {
      setPrinting(false);
    }
  };

  const handleNewSale = () => {
    reset();
    router.replace('/(tabs)');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(260)} style={s.statusSection}>
          <Animated.View style={[s.statusIconWrap, checkStyle]}>
            {isOffline ? (
              <WifiOff color={colors.warningText} size={42} strokeWidth={2.2} />
            ) : (
              <CheckCircle2 color={colors.brand} size={48} strokeWidth={2.2} />
            )}
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(120).duration(280)} style={s.statusTitle}>
            {isOffline ? 'Guardada offline' : '¡Venta completada!'}
          </Animated.Text>
          {isOffline ? (
            <Text style={s.statusOffline}>Se sincronizará al volver internet</Text>
          ) : (
            <Text style={s.statusSubtitle}>Total cobrado · S/ {ventaTotal.toFixed(2)}</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(300).easing(Easing.out(Easing.cubic))} style={s.ticket}>
          <View style={s.ticketHeader}>
            <Text style={s.ticketEmpresa}>{usuario?.empresa?.nombre || 'POS Shop'}</Text>
            {lastVenta?.numeroVenta && (
              <View style={s.ticketNumeroBadge}>
                <Text style={s.ticketNumero}>{lastVenta.numeroVenta}</Text>
              </View>
            )}
            <Text style={s.ticketFecha}>
              {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} · {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={s.ticketDivider} />

          {items.map((item: any, idx: number) => {
            const precio = Number(item.precio || item.precioUnitario || 0);
            const sub = precio * item.cantidad;
            return (
              <View key={idx} style={s.ticketItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.ticketItemName} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={s.ticketItemQty}>{item.cantidad} × S/ {precio.toFixed(2)}</Text>
                </View>
                <Text style={s.ticketItemSub}>S/ {sub.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={s.ticketDivider} />

          <View style={s.ticketTotalRow}>
            <Text style={s.ticketTotalLabel}>TOTAL</Text>
            <Text style={s.ticketTotalValue}>S/ {ventaTotal.toFixed(2)}</Text>
          </View>

          {pagos.length > 0 && (
            <>
              <View style={[s.ticketDivider, { marginVertical: 12 }]} />
              <View style={{ gap: 8 }}>
                {pagos.map((p: any, idx: number) => {
                  const Icon = iconFor(p.tipo, p.nombre);
                  return (
                    <View key={idx} style={s.ticketPagoRow}>
                      <Icon color={colors.textMuted} size={14} strokeWidth={2.2} />
                      <Text style={s.ticketPagoNombre}>{p.nombre}</Text>
                      <Text style={s.ticketPagoMonto}>S/ {Number(p.monto).toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={s.graciasWrap}>
            <Text style={s.gracias}>Gracias por su compra</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(280)} style={{ gap: 10 }}>
          {hasPrinter && (
            <Button
              label={printing ? 'Imprimiendo…' : 'Imprimir ticket'}
              icon={Printer}
              variant="outline"
              loading={printing}
              onPress={handlePrint}
            />
          )}
          {whatsappEnabled && <Button label="Enviar por WhatsApp" icon={MessageCircle} variant="outline" onPress={handleWhatsApp} />}
          <Button label="Nueva venta" icon={Plus} onPress={handleNewSale} size="lg" />
        </Animated.View>

        {printing && (
          <View style={s.printingNote}>
            <ActivityIndicator size="small" color={colors.brand} />
            <Text style={s.printingText}>Conectando con la impresora…</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },

  statusSection: { alignItems: 'center', marginBottom: 22, marginTop: 12 },
  statusIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.brandSoft,
  },
  statusTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.text, letterSpacing: -0.4 },
  statusSubtitle: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.brand, marginTop: 6 },
  statusOffline: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.warningText, marginTop: 6 },

  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 22,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  ticketHeader: { alignItems: 'center' },
  ticketEmpresa: { fontFamily: fonts.black, fontSize: 17, color: colors.text, letterSpacing: -0.2 },
  ticketNumeroBadge: {
    marginTop: 8,
    backgroundColor: colors.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  ticketNumero: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.brandDark, letterSpacing: 0.2 },
  ticketFecha: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textSubtle, marginTop: 8 },

  ticketDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 16 },

  ticketItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ticketItemName: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.text },
  ticketItemQty: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textSubtle, marginTop: 2 },
  ticketItemSub: { fontFamily: fonts.black, fontSize: 14, color: colors.text },

  ticketTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketTotalLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, letterSpacing: 1.5 },
  ticketTotalValue: { fontFamily: fonts.black, fontSize: 28, color: colors.brand, letterSpacing: -0.6 },

  ticketPagoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketPagoNombre: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted },
  ticketPagoMonto: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.text },

  graciasWrap: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider, alignItems: 'center' },
  gracias: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, letterSpacing: 0.5 },

  printingNote: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14 },
  printingText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted },
});
