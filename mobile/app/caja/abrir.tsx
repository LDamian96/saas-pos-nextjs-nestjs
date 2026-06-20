import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { extractList, toastSuccess, toastError, toastInfo, getErrorMessage } from '@/api/helpers';

export default function AbrirCajaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const [montoInicial, setMontoInicial] = useState('');
  const sucursalId = usuario?.sucursal?.id;

  const abrirMutation = useMutation({
    mutationFn: (body: any) => api.post('/caja/abrir', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Caja abierta', 'Ya puedes vender');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const handleAbrir = () => {
    if (!sucursalId) { toastError('Error', 'No tienes sucursal asignada'); return; }
    abrirMutation.mutate({
      sucursalId,
      montoApertura: Number(montoInicial) || 0,
    });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Abrir Caja</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.iconWrap}>
          <Text style={{ fontSize: 60 }}>💰</Text>
        </View>

        {/* Sucursal */}
        <Text style={s.label}>Sucursal</Text>
        {sucursalId ? (
          <View style={[s.sucCard, s.sucCardActive, { marginBottom: 24 }]}>
            <Text style={{ fontSize: 20 }}>🏪</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.sucName, { color: '#7c3aed' }]}>{usuario?.sucursal?.nombre || 'Sucursal'}</Text>
            </View>
            <View style={s.checkCircle}>
              <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
            </View>
          </View>
        ) : (
          <View style={[s.sucCard, { borderColor: '#f59e0b', backgroundColor: '#fffbeb', marginBottom: 24 }]}>
            <Text style={{ fontSize: 20 }}>⚠️</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.sucName, { color: '#92400e' }]}>Sin sucursal asignada</Text>
              <Text style={s.sucDir}>Contacta al administrador</Text>
            </View>
          </View>
        )}

        {/* Monto */}
        <Text style={s.label}>Monto inicial (efectivo en caja)</Text>
        <View style={s.montoWrap}>
          <Text style={s.montoPrefix}>S/</Text>
          <TextInput
            style={s.montoInput}
            value={montoInicial}
            onChangeText={setMontoInicial}
            placeholder="0.00"
            placeholderTextColor="#d1d5db"
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity
          style={[s.abrirBtn, abrirMutation.isPending && { opacity: 0.6 }]}
          onPress={handleAbrir}
          disabled={abrirMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={s.abrirBtnText}>{abrirMutation.isPending ? 'Abriendo...' : 'Abrir Caja'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backText: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 20, alignItems: 'center' },
  iconWrap: { marginVertical: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10, alignSelf: 'flex-start' },
  sucursalList: { width: '100%', gap: 8 },
  sucCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 2, borderColor: '#f3f4f6' },
  sucCardActive: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  sucName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  sucDir: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  montoWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, marginBottom: 32 },
  montoPrefix: { fontSize: 24, fontWeight: 'bold', color: '#9ca3af', marginRight: 8 },
  montoInput: { flex: 1, height: 64, fontSize: 32, fontWeight: 'bold', color: '#111827' },
  abrirBtn: { width: '100%', height: 56, backgroundColor: '#16a34a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  abrirBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
