import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function CerrarCajaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [montoCierre, setMontoCierre] = useState('');

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then(r => r.data).catch(() => null),
  });

  const montoApertura = Number(cajaData?.montoApertura || cajaData?.montoInicial || 0);
  const montoVentas = Number(cajaData?.montoEfectivo || cajaData?.totalVentas || 0);
  const totalEsperado = montoApertura + montoVentas;
  const montoCierreNum = Number(montoCierre) || 0;
  const diferencia = montoCierreNum - totalEsperado;

  const cerrarMutation = useMutation({
    mutationFn: (body: any) => api.post(`/caja/${cajaData?.id}/cerrar`, body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Caja cerrada', 'Caja cerrada correctamente');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const handleCerrar = () => {
    if (!cajaData?.id) { toastError('Error', 'No hay caja abierta'); return; }
    Alert.alert(
      'Cerrar caja',
      `Monto cierre: S/ ${montoCierreNum.toFixed(2)}\nEsperado: S/ ${totalEsperado.toFixed(2)}\nDiferencia: S/ ${diferencia.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar', style: 'destructive', onPress: () => {
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
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>No hay caja abierta</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#7c3aed', fontSize: 16, fontWeight: '600' }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cerrar Caja</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Resumen */}
        <View style={s.resumenCard}>
          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Monto apertura</Text>
            <Text style={s.resumenValue}>S/ {montoApertura.toFixed(2)}</Text>
          </View>
          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Ventas en efectivo</Text>
            <Text style={s.resumenValue}>S/ {montoVentas.toFixed(2)}</Text>
          </View>
          <View style={[s.resumenRow, s.resumenTotal]}>
            <Text style={s.resumenLabel}>Total esperado</Text>
            <Text style={[s.resumenValue, { fontSize: 20, color: '#7c3aed' }]}>S/ {totalEsperado.toFixed(2)}</Text>
          </View>
        </View>

        {/* Monto cierre */}
        <Text style={s.label}>Cuanto dinero hay en caja?</Text>
        <View style={s.montoWrap}>
          <Text style={s.montoPrefix}>S/</Text>
          <TextInput
            style={s.montoInput}
            value={montoCierre}
            onChangeText={setMontoCierre}
            placeholder="0.00"
            placeholderTextColor="#d1d5db"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Diferencia */}
        {montoCierreNum > 0 && (
          <View style={[s.difCard, { borderColor: diferencia === 0 ? '#16a34a' : diferencia > 0 ? '#f59e0b' : '#ef4444' }]}>
            <Text style={s.difLabel}>
              {diferencia === 0 ? '✅ Cuadra perfecto' : diferencia > 0 ? '⬆️ Hay sobrante' : '⬇️ Falta dinero'}
            </Text>
            <Text style={[s.difValue, { color: diferencia === 0 ? '#16a34a' : diferencia > 0 ? '#f59e0b' : '#ef4444' }]}>
              {diferencia >= 0 ? '+' : ''}S/ {diferencia.toFixed(2)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.cerrarBtn, cerrarMutation.isPending && { opacity: 0.6 }]}
          onPress={handleCerrar}
          disabled={cerrarMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={s.cerrarBtnText}>{cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar Caja'}</Text>
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
  content: { padding: 20, paddingBottom: 40 },
  resumenCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  resumenTotal: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginTop: 4 },
  resumenLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  resumenValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  montoWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 16, marginBottom: 16 },
  montoPrefix: { fontSize: 28, fontWeight: 'bold', color: '#9ca3af', marginRight: 8 },
  montoInput: { flex: 1, height: 70, fontSize: 36, fontWeight: 'bold', color: '#111827' },
  difCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 2, marginBottom: 16 },
  difLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  difValue: { fontSize: 18, fontWeight: 'bold' },
  cerrarBtn: { height: 56, backgroundColor: '#dc2626', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4 },
  cerrarBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
