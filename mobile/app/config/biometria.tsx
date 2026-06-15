// =============================================================================
// config/biometria.tsx — Activar/desactivar login con huella.
// Si activa: pide credenciales actuales + huella, guarda en SecureStore.
// Si desactiva: borra credenciales.
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Fingerprint, Save } from 'lucide-react-native';

import { toastError, toastSuccess } from '@/api/helpers';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/theme';
import {
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricStatus,
  type BiometricStatus,
} from '@/services/biometric.service';
import { useAuthStore } from '@/stores/auth.store';

export default function BiometriaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuthStore();
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
    if (usuario?.email) setEmail(usuario.email);
  }, [usuario?.email]);

  const refresh = async () => {
    const st = await getBiometricStatus();
    setStatus(st);
    setEnabled(st.saved);
  };

  const handleToggle = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!val) {
      await disableBiometricLogin();
      setEnabled(false);
      toastSuccess('Huella desactivada', 'Ya no podras entrar con huella');
      return;
    }
    setEnabled(true);
  };

  const handleSave = async () => {
    if (!email.trim() || !password.trim()) {
      toastError('Datos requeridos', 'Ingresa email y contrasena');
      return;
    }
    setSaving(true);
    try {
      const ok = await enableBiometricLogin(email.trim(), password);
      if (!ok) {
        toastError('Cancelado', 'No se confirmo la huella');
        return;
      }
      toastSuccess('Huella activada', 'Podras entrar con tu huella');
      setPassword('');
      await refresh();
    } catch (e: any) {
      toastError('Error', e?.message || 'No se pudo activar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Huella digital" subtitle="Acceso rapido con biometria" />

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(220)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Fingerprint color={colors.brand} size={42} strokeWidth={2.2} />
          </View>
        </Animated.View>

        {/* Estado del dispositivo */}
        <View style={s.statusCard}>
          <Text style={s.statusLabel}>ESTADO DEL DISPOSITIVO</Text>
          <View style={s.statusRow}>
            <Text style={s.statusKey}>Tiene sensor</Text>
            <Text style={[s.statusVal, { color: status?.hasHardware ? colors.brand : colors.danger }]}>
              {status?.hasHardware ? 'Si' : 'No'}
            </Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusKey}>Huella registrada en el dispositivo</Text>
            <Text style={[s.statusVal, { color: status?.isEnrolled ? colors.brand : colors.danger }]}>
              {status?.isEnrolled ? 'Si' : 'No'}
            </Text>
          </View>
          <View style={s.statusRow}>
            <Text style={s.statusKey}>Habilitada en la app</Text>
            <Text style={[s.statusVal, { color: status?.saved ? colors.brand : colors.textMuted }]}>
              {status?.saved ? 'Si' : 'No'}
            </Text>
          </View>
        </View>

        {!status?.hasHardware && (
          <View style={s.warningCard}>
            <Text style={s.warningText}>Este dispositivo no tiene sensor biometrico.</Text>
          </View>
        )}

        {status?.hasHardware && !status?.isEnrolled && (
          <View style={s.warningCard}>
            <Text style={s.warningText}>
              No hay huella registrada en este dispositivo. Ve a Ajustes del telefono y registra una huella antes.
            </Text>
          </View>
        )}

        {status?.hasHardware && status?.isEnrolled && (
          <>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Activar login con huella</Text>
                <Text style={s.toggleDesc}>
                  {enabled
                    ? 'Tus credenciales se guardaran cifradas en este dispositivo'
                    : 'Despues podras entrar tocando tu huella sin escribir contrasena'}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                trackColor={{ false: colors.border, true: colors.brandSoft }}
                thumbColor={enabled ? colors.brand : '#FFFFFF'}
              />
            </View>

            {enabled && !status.saved && (
              <>
                <Text style={s.label}>CORREO</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={s.label}>CONTRASENA</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Tu contrasena actual"
                  placeholderTextColor={colors.textPlaceholder}
                  secureTextEntry
                />
                <View style={{ marginTop: 22 }}>
                  <Button
                    label={saving ? 'Verificando huella...' : 'Activar y verificar huella'}
                    onPress={handleSave}
                    loading={saving}
                    icon={Save}
                    size="lg"
                  />
                </View>
              </>
            )}

            {status.saved && (
              <View style={s.activeCard}>
                <Text style={s.activeIcon}>✓</Text>
                <Text style={s.activeTitle}>Huella activada</Text>
                <Text style={s.activeDesc}>
                  Al abrir la app puedes tocar "Entrar con huella" en el login.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginVertical: 12 },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  statusLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  statusKey: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, flex: 1 },
  statusVal: { fontFamily: fonts.extrabold, fontSize: 13 },

  warningCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  warningText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toggleLabel: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  toggleDesc: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },

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

  activeCard: {
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    padding: 20,
    marginTop: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  activeIcon: { fontSize: 30, color: colors.brand, fontFamily: fonts.black },
  activeTitle: { fontFamily: fonts.black, fontSize: 18, color: colors.brandDark, marginTop: 8 },
  activeDesc: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.brandDark, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
