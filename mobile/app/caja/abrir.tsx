// =============================================================================
// caja/abrir.tsx — Abrir caja con monto inicial.
// =============================================================================

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import { Building2, CheckCircle2, CircleAlert, KeyRound, Wallet } from 'lucide-react-native';

import api from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

export default function AbrirCajaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const [montoInicial, setMontoInicial] = useState('');
  const sucursalId = usuario?.sucursal?.id;

  const abrirMutation = useMutation({
    mutationFn: (body: any) => api.post('/caja/abrir', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('caja_abierta', { sucursalId, monto: Number(montoInicial) });
      toastSuccess('Caja abierta', 'Ya puedes vender');
      router.back();
    },
    onError: (err: any) => {
      remoteLogger.error('caja_abrir_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const handleAbrir = () => {
    if (!sucursalId) {
      toastError('Sin sucursal', 'No tienes sucursal asignada');
      return;
    }
    abrirMutation.mutate({ sucursalId, montoInicial: Number(montoInicial) || 0 });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Abrir caja" subtitle="Empieza la jornada" />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(260)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <KeyRound color={colors.brand} size={36} strokeWidth={2.2} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(60).duration(220)} style={s.label}>
          SUCURSAL
        </Animated.Text>
        {sucursalId ? (
          <Animated.View entering={FadeInUp.delay(80).duration(260).easing(Easing.out(Easing.cubic))} style={s.sucCard}>
            <View style={s.sucIcon}>
              <Building2 color={colors.brand} size={18} strokeWidth={2.2} />
            </View>
            <Text style={s.sucName}>{usuario?.sucursal?.nombre || 'Sucursal'}</Text>
            <View style={s.checkCircle}>
              <CheckCircle2 color="#FFFFFF" size={14} strokeWidth={2.6} />
            </View>
          </Animated.View>
        ) : (
          <View style={s.sucWarning}>
            <CircleAlert color={colors.warningText} size={18} strokeWidth={2.2} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.warnTitle}>Sin sucursal asignada</Text>
              <Text style={s.warnDesc}>Contacta al administrador</Text>
            </View>
          </View>
        )}

        <Text style={s.label}>MONTO INICIAL · EFECTIVO EN CAJA</Text>
        <View style={s.montoWrap}>
          <Wallet color={colors.brand} size={22} strokeWidth={2.2} />
          <Text style={s.montoPrefix}>S/</Text>
          <TextInput
            style={s.montoInput}
            value={montoInicial}
            onChangeText={setMontoInicial}
            placeholder="0.00"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={{ marginTop: 12 }}>
          <Button
            label={abrirMutation.isPending ? 'Abriendo…' : 'Abrir caja'}
            onPress={handleAbrir}
            loading={abrirMutation.isPending}
            disabled={!sucursalId}
            size="lg"
            icon={KeyRound}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  iconWrap: { alignItems: 'center', marginVertical: 20 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },

  label: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 10, marginTop: 16 },

  sucCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.4,
    borderColor: colors.brand,
    gap: 12,
  },
  sucIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  sucName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.brandDark },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sucWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.4,
    borderColor: colors.warningBorder,
  },
  warnTitle: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.warningText },
  warnDesc: { fontFamily: fonts.semibold, fontSize: 12, color: colors.warningText, opacity: 0.85, marginTop: 2 },

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
  montoInput: { flex: 1, height: 64, fontFamily: fonts.black, fontSize: 32, color: colors.text, padding: 0, letterSpacing: -0.6 },
});
