// =============================================================================
// config/negocio.tsx — Datos del negocio + configuracion de impuestos (IGV).
// =============================================================================

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Building2, Save } from 'lucide-react-native';

import api from '@/api/client';
import { getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/theme';

export default function NegocioScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  // Config impuestos
  const [aplicaIgv, setAplicaIgv] = useState(true);
  const [igvPct, setIgvPct] = useState('18');
  const [igvNombre, setIgvNombre] = useState('IGV');

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-me'],
    queryFn: () => api.get('/empresas/me').then((r) => r.data),
  });

  const { data: cfgData } = useQuery({
    queryKey: ['empresa-config'],
    queryFn: () => api.get('/empresas/me/config').then((r) => r.data),
  });

  useEffect(() => {
    const emp = data?.data || data;
    if (emp) {
      setNombre(emp.nombreComercial || emp.nombre || '');
      setRuc(emp.ruc || '');
      setDireccion(emp.direccionFiscal || emp.direccion || '');
      setTelefono(emp.telefono || '');
    }
  }, [data]);

  useEffect(() => {
    const c = cfgData?.data || cfgData;
    if (c) {
      setAplicaIgv(c.aplicaImpuesto !== false);
      setIgvPct((c.porcentajeImpuesto ?? 18).toString());
      setIgvNombre(c.nombreImpuesto || 'IGV');
    }
  }, [cfgData]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put('/empresas/me', body).then((r) => r.data),
    onError: (err: any) => {
      remoteLogger.error('empresa_update_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const updateCfgMutation = useMutation({
    mutationFn: (body: any) => api.put('/empresas/me/config', body).then((r) => r.data),
    onError: (err: any) => {
      remoteLogger.error('empresa_cfg_update_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const handleSave = async () => {
    try {
      await Promise.all([
        updateMutation.mutateAsync({
          nombreComercial: nombre.trim() || undefined,
          ruc: ruc.trim() || undefined,
          direccionFiscal: direccion.trim() || undefined,
          telefono: telefono.trim() || undefined,
        }),
        updateCfgMutation.mutateAsync({
          aplicaImpuesto: aplicaIgv,
          porcentajeImpuesto: Number(igvPct) || 18,
          nombreImpuesto: igvNombre.trim() || 'IGV',
        }),
      ]);
      queryClient.invalidateQueries({ queryKey: ['empresa-me'] });
      queryClient.invalidateQueries({ queryKey: ['empresa-config'] });
      // Refrescar la sesion para que el nombre/logo nuevo aparezca en splash, login y sidebar
      try {
        const { useAuthStore } = await import('@/stores/auth.store');
        await useAuthStore.getState().checkAuth();
      } catch {}
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('empresa_actualizada');
      toastSuccess('Guardado', 'Datos del negocio actualizados');
    } catch {
      // toast ya mostrado por el onError
    }
  };

  const saving = updateMutation.isPending || updateCfgMutation.isPending;

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Mi negocio" subtitle="Datos fiscales, contacto e impuestos" />

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(220)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Building2 color={colors.brand} size={32} strokeWidth={2.2} />
          </View>
        </Animated.View>

        <Label>NOMBRE DEL NEGOCIO</Label>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Mi Tienda" placeholderTextColor={colors.textPlaceholder} />

        <Label>RUC</Label>
        <TextInput style={s.input} value={ruc} onChangeText={setRuc} placeholder="20123456789" placeholderTextColor={colors.textPlaceholder} keyboardType="numeric" maxLength={11} />

        <Label>DIRECCIÓN</Label>
        <TextInput style={s.input} value={direccion} onChangeText={setDireccion} placeholder="Av. Principal 123" placeholderTextColor={colors.textPlaceholder} />

        <Label>TELÉFONO</Label>
        <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="999 999 999" placeholderTextColor={colors.textPlaceholder} keyboardType="phone-pad" />

        {/* Impuestos */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>IMPUESTOS</Text>
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleLabel}>Aplicar {igvNombre}</Text>
              <Text style={s.toggleDesc}>
                {aplicaIgv
                  ? `El precio de venta incluye ${igvPct}% de ${igvNombre}`
                  : `Sin ${igvNombre} - el precio de venta es directo`}
              </Text>
            </View>
            <Switch
              value={aplicaIgv}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAplicaIgv(v);
              }}
              trackColor={{ false: colors.border, true: colors.brandSoft }}
              thumbColor={aplicaIgv ? colors.brand : '#FFFFFF'}
            />
          </View>

          {aplicaIgv && (
            <View style={s.row}>
              <View style={s.half}>
                <Label>NOMBRE</Label>
                <TextInput
                  style={s.input}
                  value={igvNombre}
                  onChangeText={setIgvNombre}
                  placeholder="IGV"
                  placeholderTextColor={colors.textPlaceholder}
                  maxLength={20}
                />
              </View>
              <View style={s.half}>
                <Label>PORCENTAJE</Label>
                <TextInput
                  style={s.input}
                  value={igvPct}
                  onChangeText={setIgvPct}
                  placeholder="18"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>
          )}
        </View>

        <View style={{ marginTop: 28 }}>
          <Button
            label={saving ? 'Guardando…' : 'Guardar'}
            onPress={handleSave}
            loading={saving}
            icon={Save}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginVertical: 12 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  label: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 8, marginTop: 16 },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    borderWidth: 1.2,
    borderColor: colors.divider,
    color: colors.text,
  },
  section: { marginTop: 22 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 10 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toggleLabel: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  toggleDesc: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});
