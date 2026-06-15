// =============================================================================
// config/nubefact.tsx — Configuracion Nubefact por empresa.
// Lee/guarda en backend (PUT /empresas/me/nubefact). Si el cliente no
// activa "Usar mis credenciales", el sistema usa las del proveedor SaaS.
// =============================================================================

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CircleAlert, Eye, EyeOff, FileText, Save, ShieldCheck } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api/client';
import { getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

interface NubefactConfig {
  nubefactEnabled: boolean;
  nubefactDemo: boolean;
  nubefactApiUrl: string;
  nubefactRuc: string;
  nubefactTokenSet: boolean;
  nubefactTokenPreview: string;
}

export default function NubefactScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [demo, setDemo] = useState(true);
  const [apiUrl, setApiUrl] = useState('');
  const [token, setToken] = useState('');
  const [ruc, setRuc] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenPreview, setTokenPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-nubefact'],
    queryFn: () => api.get('/empresas/me/nubefact').then((r) => r.data),
    staleTime: 60_000,
  });

  useEffect(() => {
    const cfg: NubefactConfig = data?.data || data;
    if (cfg) {
      setEnabled(!!cfg.nubefactEnabled);
      setDemo(cfg.nubefactDemo !== false);
      setApiUrl(cfg.nubefactApiUrl || '');
      setRuc(cfg.nubefactRuc || '');
      setTokenPreview(cfg.nubefactTokenPreview || '');
      // El token NO viene del backend (solo el preview). Si el usuario quiere
      // cambiarlo, escribe uno nuevo. Si deja vacio, el backend mantiene el actual.
      setToken('');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put('/empresas/me/nubefact', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-nubefact'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('nubefact_actualizado');
      toastSuccess('Guardado', 'Configuracion Nubefact actualizada');
    },
    onError: (err: any) => {
      remoteLogger.error('nubefact_update_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const handleSave = () => {
    const body: any = {
      nubefactEnabled: enabled,
      nubefactDemo: demo,
    };
    // Solo enviar campos que el usuario haya tocado / con valor
    if (apiUrl.trim()) body.nubefactApiUrl = apiUrl.trim();
    if (ruc.trim()) body.nubefactRuc = ruc.trim();
    // Si el usuario escribio un token nuevo lo enviamos. Si dejo el campo en blanco
    // y ya hay uno guardado, no lo tocamos.
    if (token.trim()) body.nubefactToken = token.trim();
    updateMutation.mutate(body);
  };

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Nubefact" subtitle="Facturacion electronica" />

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(220)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <FileText color={colors.brand} size={32} strokeWidth={2.2} />
          </View>
        </Animated.View>

        {/* Estado actual: usa proveedor o tus credenciales */}
        <View style={s.statusCard}>
          <ShieldCheck color={enabled ? colors.brand : '#0891b2'} size={20} strokeWidth={2.2} />
          <Text style={s.statusText}>
            {enabled
              ? 'Estas usando TUS credenciales Nubefact'
              : 'Estas usando las credenciales del proveedor (modo prueba). Activa el switch para usar las tuyas.'}
          </Text>
        </View>

        {/* Switch: usar mis credenciales */}
        <View style={s.modoCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.modoLabel}>Usar mis propias credenciales</Text>
            <Text style={s.modoDesc}>
              {enabled
                ? 'Tu RUC y token configurados se usan al emitir comprobantes.'
                : 'Mientras este apagado se usan las credenciales del proveedor.'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEnabled(v);
            }}
            trackColor={{ false: colors.border, true: colors.brandSoft }}
            thumbColor={enabled ? colors.brand : '#FFFFFF'}
          />
        </View>

        {/* Switch: modo demo */}
        {enabled && (
          <View style={s.modoCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.modoLabel}>Modo demo</Text>
              <Text style={s.modoDesc}>
                {demo
                  ? 'Pruebas sin emitir comprobantes reales a SUNAT'
                  : 'Produccion - comprobantes validos ante SUNAT'}
              </Text>
            </View>
            <Switch
              value={demo}
              onValueChange={(v) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDemo(v);
              }}
              trackColor={{ false: colors.dangerBorder, true: colors.brandSoft }}
              thumbColor={demo ? colors.brand : colors.danger}
            />
          </View>
        )}

        {/* Warning produccion */}
        {enabled && !demo && (
          <View style={s.warningCard}>
            <CircleAlert color={colors.danger} size={18} strokeWidth={2.2} />
            <Text style={s.warningText}>
              Modo produccion activo. Los comprobantes seran validos ante SUNAT.
            </Text>
          </View>
        )}

        {/* Campos editables solo cuando enabled */}
        {enabled && (
          <>
            <Text style={s.label}>URL DEL API</Text>
            <TextInput
              style={s.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://api.nubefact.com/api/v1/..."
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={s.label}>RUC</Text>
            <TextInput
              style={s.input}
              value={ruc}
              onChangeText={setRuc}
              placeholder="20123456789"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="numeric"
              maxLength={11}
            />

            <Text style={s.label}>TOKEN</Text>
            {tokenPreview && !token ? (
              <View style={s.tokenRow}>
                <View style={[s.input, { flex: 1, justifyContent: 'center' }]}>
                  <Text style={{ color: colors.textMuted, fontFamily: fonts.semibold }}>
                    {tokenPreview} (guardado)
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={s.tokenRow}>
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={token}
                onChangeText={setToken}
                placeholder={tokenPreview ? 'Escribe un token nuevo para reemplazar' : 'Token de Nubefact'}
                placeholderTextColor={colors.textPlaceholder}
                secureTextEntry={!showToken}
                autoCapitalize="none"
              />
              <Pressable style={s.showBtn} onPress={() => setShowToken(!showToken)}>
                {showToken ? (
                  <EyeOff color={colors.textMuted} size={18} strokeWidth={2.2} />
                ) : (
                  <Eye color={colors.textMuted} size={18} strokeWidth={2.2} />
                )}
              </Pressable>
            </View>
          </>
        )}

        <View style={{ marginTop: 28 }}>
          <Button
            label={updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            onPress={handleSave}
            loading={updateMutation.isPending}
            icon={Save}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginVertical: 8 },
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    marginTop: 8,
  },
  statusText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, lineHeight: 18 },
  modoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  modoLabel: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  modoDesc: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  warningText: { flex: 1, color: colors.danger, fontFamily: fonts.semibold, fontSize: 12.5 },
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
  tokenRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  showBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
});
