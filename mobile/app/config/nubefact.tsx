// =============================================================================
// config/nubefact.tsx — Token + URL + modo demo de Nubefact.
// =============================================================================

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CircleAlert, Eye, EyeOff, FileText, Save } from 'lucide-react-native';

import { toastSuccess } from '@/api/helpers';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

const STORAGE_KEY = 'pos-nubefact-config';

interface NubefactConfig {
  urlApi: string;
  token: string;
  modoDemo: boolean;
}

export default function NubefactScreen() {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<NubefactConfig>({ urlApi: '', token: '', modoDemo: true });
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setConfig(JSON.parse(val));
    });
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toastSuccess('Guardado', 'Configuración Nubefact guardada');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Nubefact" subtitle="Facturación electrónica" />

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(220)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <FileText color={colors.brand} size={32} strokeWidth={2.2} />
          </View>
        </Animated.View>

        <View style={s.modoCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.modoLabel}>Modo demo</Text>
            <Text style={s.modoDesc}>
              {config.modoDemo
                ? 'Pruebas sin emitir comprobantes reales'
                : 'Producción — comprobantes válidos ante SUNAT'}
            </Text>
          </View>
          <Switch
            value={config.modoDemo}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setConfig((prev) => ({ ...prev, modoDemo: v }));
            }}
            trackColor={{ false: colors.dangerBorder, true: colors.brandSoft }}
            thumbColor={config.modoDemo ? colors.brand : colors.danger}
          />
        </View>

        {!config.modoDemo && (
          <View style={s.warningCard}>
            <CircleAlert color={colors.danger} size={18} strokeWidth={2.2} />
            <Text style={s.warningText}>
              Modo producción activo · los comprobantes serán válidos ante SUNAT
            </Text>
          </View>
        )}

        <Text style={s.label}>URL DEL API</Text>
        <TextInput
          style={s.input}
          value={config.urlApi}
          onChangeText={(v) => setConfig((prev) => ({ ...prev, urlApi: v }))}
          placeholder="https://api.nubefact.com/api/v1/…"
          placeholderTextColor={colors.textPlaceholder}
          autoCapitalize="none"
        />

        <Text style={s.label}>TOKEN</Text>
        <View style={s.tokenRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={config.token}
            onChangeText={(v) => setConfig((prev) => ({ ...prev, token: v }))}
            placeholder="Token de Nubefact"
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

        <View style={{ marginTop: 28 }}>
          <Button label="Guardar" onPress={handleSave} icon={Save} size="lg" />
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
  modoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 16,
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
  tokenRow: { flexDirection: 'row', gap: 10 },
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
