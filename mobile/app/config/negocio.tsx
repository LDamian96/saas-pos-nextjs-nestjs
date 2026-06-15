// =============================================================================
// config/negocio.tsx — Datos del negocio (nombre, RUC, dirección).
// =============================================================================

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-me'],
    queryFn: () => api.get('/empresas/me').then((r) => r.data),
  });

  useEffect(() => {
    const emp = data?.data || data;
    if (emp) {
      // Backend usa nombreComercial / direccionFiscal en el DTO.
      // Si el GET retorna 'nombre' (vista plana) tambien lo soportamos.
      setNombre(emp.nombreComercial || emp.nombre || '');
      setRuc(emp.ruc || '');
      setDireccion(emp.direccionFiscal || emp.direccion || '');
      setTelefono(emp.telefono || '');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put('/empresas/me', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-me'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('empresa_actualizada');
      toastSuccess('Guardado', 'Datos del negocio actualizados');
    },
    onError: (err: any) => {
      remoteLogger.error('empresa_update_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  if (isLoading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Mi negocio" subtitle="Datos fiscales y contacto" />

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

        <View style={{ marginTop: 28 }}>
          <Button
            label={updateMutation.isPending ? 'Guardando…' : 'Guardar'}
            onPress={() => updateMutation.mutate({
              nombreComercial: nombre.trim() || undefined,
              ruc: ruc.trim() || undefined,
              direccionFiscal: direccion.trim() || undefined,
              telefono: telefono.trim() || undefined,
            })}
            loading={updateMutation.isPending}
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
});
