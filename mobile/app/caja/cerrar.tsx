// =============================================================================
// caja/cerrar.tsx — Cerrar caja con monto contado y diferencia.
// =============================================================================

import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import { Calculator, CheckCircle2, Package, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';

import api from '@/api/client';
import { getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

export default function CerrarCajaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [montoCierre, setMontoCierre] = useState('');

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then((r) => r.data).catch(() => null),
  });

  const montoApertura = Number(cajaData?.montoApertura || cajaData?.montoInicial || 0);
  const montoVentas = Number(cajaData?.montoEfectivo || cajaData?.totalVentas || 0);
  const totalEsperado = montoApertura + montoVentas;
  const montoCierreNum = Number(montoCierre) || 0;
  const diferencia = montoCierreNum - totalEsperado;

  const cerrarMutation = useMutation({
    mutationFn: (body: any) => api.post(`/caja/${cajaData?.id}/cerrar`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('caja_cerrada', { diferencia });
      toastSuccess('Caja cerrada', 'Listo, jornada cerrada');
      router.back();
    },
    onError: (err: any) => {
      remoteLogger.error('caja_cerrar_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const handleCerrar = () => {
    if (!cajaData?.id) {
      toastError('Sin caja', 'No hay caja abierta');
      return;
    }
    Alert.alert(
      'Cerrar caja',
      `Monto contado · S/ ${montoCierreNum.toFixed(2)}\nEsperado · S/ ${totalEsperado.toFixed(2)}\nDiferencia · S/ ${diferencia.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: () => {
            cerrarMutation.mutate({
              montoCierre: montoCierreNum,
              observaciones: diferencia !== 0 ? `Diferencia: S/ ${diferencia.toFixed(2)}` : undefined,
            });
          },
        },
      ]
    );
  };

  if (!cajaData?.id) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Header title="Cerrar caja" />
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <Package color={colors.textSubtle} size={36} strokeWidth={2} />
          </View>
          <Text style={s.emptyTitle}>No hay caja abierta</Text>
          <Text style={s.emptyText}>Necesitas abrir una caja primero para poder cerrarla.</Text>
          <View style={{ width: '70%', marginTop: 24 }}>
            <Button label="Volver" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    );
  }

  const tone = diferencia === 0 ? 'ok' : diferencia > 0 ? 'sobrante' : 'falta';
  const ToneIcon = diferencia === 0 ? CheckCircle2 : diferencia > 0 ? TrendingUp : TrendingDown;
  const toneColor = diferencia === 0 ? colors.brand : diferencia > 0 ? colors.warningText : colors.danger;
  const toneBg = diferencia === 0 ? colors.brandTint : diferencia > 0 ? colors.warningSoft : colors.dangerSoft;
  const toneBorder = diferencia === 0 ? colors.brandSoft : diferencia > 0 ? colors.warningBorder : colors.dangerBorder;
  const toneLabel = diferencia === 0 ? 'Cuadra perfecto' : diferencia > 0 ? 'Hay sobrante' : 'Falta dinero';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Cerrar caja" subtitle="Cierre de jornada" />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(260)} style={s.resumenCard}>
          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Monto apertura</Text>
            <Text style={s.resumenValue}>S/ {montoApertura.toFixed(2)}</Text>
          </View>
          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Ventas en efectivo</Text>
            <Text style={s.resumenValue}>S/ {montoVentas.toFixed(2)}</Text>
          </View>
          <View style={[s.resumenRow, s.resumenTotal]}>
            <Text style={[s.resumenLabel, { fontFamily: fonts.extrabold, color: colors.text }]}>Total esperado</Text>
            <Text style={[s.resumenValue, { color: colors.brand, fontSize: 19 }]}>S/ {totalEsperado.toFixed(2)}</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(80).duration(220)} style={s.label}>
          MONTO CONTADO EN CAJA
        </Animated.Text>
        <Animated.View entering={FadeInUp.delay(100).duration(260).easing(Easing.out(Easing.cubic))} style={s.montoWrap}>
          <Wallet color={colors.brand} size={22} strokeWidth={2.2} />
          <Text style={s.montoPrefix}>S/</Text>
          <TextInput
            style={s.montoInput}
            value={montoCierre}
            onChangeText={setMontoCierre}
            placeholder="0.00"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="decimal-pad"
          />
        </Animated.View>

        {montoCierreNum > 0 && (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={[s.difCard, { backgroundColor: toneBg, borderColor: toneBorder }]}
          >
            <ToneIcon color={toneColor} size={20} strokeWidth={2.4} />
            <Text style={[s.difLabel, { color: toneColor }]}>{toneLabel}</Text>
            <View style={{ flex: 1 }} />
            <Text style={[s.difValue, { color: toneColor }]}>
              {diferencia >= 0 ? '+' : ''}S/ {diferencia.toFixed(2)}
            </Text>
          </Animated.View>
        )}

        <View style={{ marginTop: 22 }}>
          <Button
            label={cerrarMutation.isPending ? 'Cerrando…' : 'Cerrar caja'}
            onPress={handleCerrar}
            loading={cerrarMutation.isPending}
            size="lg"
            variant="danger"
            icon={Calculator}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  resumenCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resumenTotal: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12, marginBottom: 0 },
  resumenLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  resumenValue: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.text },

  label: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 10 },
  montoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.4,
    borderColor: colors.divider,
    paddingHorizontal: 16,
    gap: 10,
    ...shadows.soft,
  },
  montoPrefix: { fontFamily: fonts.black, fontSize: 24, color: colors.brand },
  montoInput: { flex: 1, height: 68, fontFamily: fonts.black, fontSize: 32, color: colors.text, padding: 0, letterSpacing: -0.6 },

  difCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.4,
    marginTop: 14,
  },
  difLabel: { fontFamily: fonts.extrabold, fontSize: 13.5 },
  difValue: { fontFamily: fonts.black, fontSize: 17 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emptyTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.text, letterSpacing: -0.3 },
  emptyText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});
