// =============================================================================
// caja/cerrar.tsx — Cierre de caja con resumen automatico + retiro/ingreso
// opcional (motivo se guarda en observaciones).
// =============================================================================

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

type Movimiento = 'ninguno' | 'retiro' | 'ingreso';

export default function CerrarCajaScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [tipoMov, setTipoMov] = useState<Movimiento>('ninguno');
  const [montoMov, setMontoMov] = useState('');
  const [motivo, setMotivo] = useState('');

  const { data: cajaData, isLoading } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then((r) => r.data?.data || r.data).catch(() => null),
  });

  const montoApertura = Number(cajaData?.montoApertura || cajaData?.montoInicial || 0);
  const montoVentas = Number(cajaData?.montoEfectivo || cajaData?.totalVentas || 0);
  const totalEnCaja = montoApertura + montoVentas;
  const montoMovNum = Number(montoMov) || 0;

  const montoCierreFinal = useMemo(() => {
    if (tipoMov === 'retiro') return totalEnCaja - montoMovNum;
    if (tipoMov === 'ingreso') return totalEnCaja + montoMovNum;
    return totalEnCaja;
  }, [tipoMov, montoMovNum, totalEnCaja]);

  const cerrarMutation = useMutation({
    mutationFn: (body: any) =>
      api.post(`/caja/${cajaData?.id}/cerrar`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['cajas-historial'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Caja cerrada', 'Cierre registrado correctamente');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const handleCerrar = () => {
    if (!cajaData?.id) {
      toastError('Error', 'No hay caja abierta');
      return;
    }

    if (tipoMov !== 'ninguno') {
      if (montoMovNum <= 0) {
        toastError('Monto', 'Ingresa un monto valido');
        return;
      }
      if (!motivo.trim()) {
        toastError('Motivo', 'Indica el motivo del movimiento');
        return;
      }
      if (tipoMov === 'retiro' && montoMovNum > totalEnCaja) {
        toastError('Excede caja', 'No puedes retirar mas de lo que hay');
        return;
      }
    }

    let resumen: string;
    if (tipoMov === 'retiro') {
      resumen = `Retiro S/ ${montoMovNum.toFixed(2)} | Final S/ ${montoCierreFinal.toFixed(2)}`;
    } else if (tipoMov === 'ingreso') {
      resumen = `Ingreso S/ ${montoMovNum.toFixed(2)} | Final S/ ${montoCierreFinal.toFixed(2)}`;
    } else {
      resumen = `Cierre S/ ${montoCierreFinal.toFixed(2)}`;
    }

    Alert.alert('Cerrar caja', `${resumen}\n\n¿Confirmar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar caja',
        style: 'destructive',
        onPress: () => {
          // El backend lleva el detalle en observaciones (sin tocar el schema).
          // Formato parseable: "RETIRO: S/X — motivo" o "INGRESO: S/X — motivo".
          const obs =
            tipoMov === 'retiro'
              ? `RETIRO: S/ ${montoMovNum.toFixed(2)} — ${motivo.trim()}`
              : tipoMov === 'ingreso'
                ? `INGRESO: S/ ${montoMovNum.toFixed(2)} — ${motivo.trim()}`
                : undefined;
          cerrarMutation.mutate({
            montoCierre: montoCierreFinal,
            observaciones: obs,
          });
        },
      },
    ]);
  };

  if (!isLoading && !cajaData?.id) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <View style={s.emptyIcon}>
          <Text style={{ fontSize: 48 }}>📦</Text>
        </View>
        <Text style={s.emptyTitle}>No hay caja abierta</Text>
        <Text style={s.emptyDesc}>Primero abre caja para poder cerrarla</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.emptyBtn}>
          <Text style={s.emptyBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onPickTipo = (t: Movimiento) => {
    Haptics.selectionAsync();
    setTipoMov(t);
    if (t === 'ninguno') {
      setMontoMov('');
      setMotivo('');
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} hitSlop={10}>
          <Text style={s.headerBtnText}>‹  Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cerrar caja</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Resumen automatico */}
        <Animated.View entering={FadeInDown.duration(280)} style={s.resumenCard}>
          <Text style={s.resumenTitle}>RESUMEN AUTOMATICO</Text>

          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Monto de apertura</Text>
            <Text style={s.resumenValue}>S/ {montoApertura.toFixed(2)}</Text>
          </View>
          <View style={s.resumenRow}>
            <Text style={s.resumenLabel}>Ventas en efectivo</Text>
            <Text style={[s.resumenValue, { color: '#16a34a' }]}>+ S/ {montoVentas.toFixed(2)}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.resumenRow}>
            <Text style={s.totalLabel}>Total en caja</Text>
            <Text style={s.totalValue}>S/ {totalEnCaja.toFixed(2)}</Text>
          </View>
        </Animated.View>

        {/* Selector de movimiento */}
        <Animated.View entering={FadeInDown.delay(80).duration(280)}>
          <Text style={s.sectionTitle}>¿ALGUN MOVIMIENTO?</Text>
          <Text style={s.sectionHint}>Opcional. Selecciona si retiraste o ingresaste dinero al cerrar.</Text>

          <View style={s.tipoRow}>
            <TipoChip
              label="Ninguno"
              active={tipoMov === 'ninguno'}
              color="#7c3aed"
              onPress={() => onPickTipo('ninguno')}
            />
            <TipoChip
              label="Retiro"
              active={tipoMov === 'retiro'}
              color="#dc2626"
              onPress={() => onPickTipo('retiro')}
            />
            <TipoChip
              label="Ingreso"
              active={tipoMov === 'ingreso'}
              color="#16a34a"
              onPress={() => onPickTipo('ingreso')}
            />
          </View>
        </Animated.View>

        {/* Inputs de monto y motivo */}
        {tipoMov !== 'ninguno' && (
          <Animated.View
            entering={FadeIn.duration(220)}
            layout={Layout.springify().damping(20)}
            style={s.movCard}
          >
            <Text style={s.label}>Monto del {tipoMov}</Text>
            <View style={s.montoWrap}>
              <Text style={s.montoPrefix}>S/</Text>
              <TextInput
                style={s.montoInput}
                value={montoMov}
                onChangeText={setMontoMov}
                placeholder="0.00"
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>

            <Text style={[s.label, { marginTop: 16 }]}>Motivo</Text>
            <TextInput
              style={s.motivoInput}
              value={motivo}
              onChangeText={setMotivo}
              placeholder={
                tipoMov === 'retiro'
                  ? 'Ej: Pago proveedor, gastos varios...'
                  : 'Ej: Aporte de socio, devolucion cliente...'
              }
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={2}
              maxLength={120}
            />
          </Animated.View>
        )}

        {/* Preview del cierre final */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(280)}
          layout={Layout.springify().damping(20)}
          style={s.finalCard}
        >
          <Text style={s.finalLabel}>SE CERRARA CAJA CON</Text>
          <Text style={s.finalValue}>S/ {montoCierreFinal.toFixed(2)}</Text>
          {tipoMov !== 'ninguno' && montoMovNum > 0 && (
            <Text style={[s.finalDelta, { color: tipoMov === 'retiro' ? '#dc2626' : '#16a34a' }]}>
              {tipoMov === 'retiro' ? '−' : '+'} S/ {montoMovNum.toFixed(2)} ({tipoMov})
            </Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[s.cerrarBtn, cerrarMutation.isPending && { opacity: 0.5 }]}
          onPress={handleCerrar}
          disabled={cerrarMutation.isPending}
          activeOpacity={0.85}
        >
          <Text style={s.cerrarBtnText}>{cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar caja'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TipoChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        s.tipoChip,
        active && { backgroundColor: color, borderColor: color, shadowColor: color, shadowOpacity: 0.25, elevation: 4 },
      ]}
    >
      <Text style={[s.tipoChipText, active && { color: '#ffffff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: { paddingVertical: 4, paddingRight: 8 },
  headerBtnText: { fontSize: 15, color: '#7c3aed', fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },

  content: { padding: 20, paddingBottom: 60 },

  // Resumen card
  resumenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  resumenTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  resumenLabel: { fontSize: 14.5, color: '#64748b', fontWeight: '500' },
  resumenValue: { fontSize: 15.5, fontWeight: '700', color: '#0f172a', fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#7c3aed', fontVariant: ['tabular-nums'], letterSpacing: -0.4 },

  // Movimiento selector
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 4 },
  sectionHint: { fontSize: 12.5, color: '#94a3b8', marginBottom: 12, lineHeight: 18 },

  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  tipoChip: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  tipoChipText: { fontSize: 14.5, fontWeight: '700', color: '#475569' },

  // Movimiento card
  movCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { fontSize: 12.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.6, marginBottom: 8 },
  montoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
  },
  montoPrefix: { fontSize: 22, fontWeight: '700', color: '#94a3b8', marginRight: 8 },
  montoInput: { flex: 1, height: 56, fontSize: 24, fontWeight: '800', color: '#0f172a', fontVariant: ['tabular-nums'] },
  motivoInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: '#0f172a',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Final preview
  finalCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 18,
    marginTop: 22,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  finalLabel: { fontSize: 10.5, fontWeight: '800', color: 'rgba(255,255,255,0.78)', letterSpacing: 1.4 },
  finalValue: { fontSize: 34, fontWeight: '800', color: '#ffffff', marginTop: 4, fontVariant: ['tabular-nums'], letterSpacing: -0.8 },
  finalDelta: { fontSize: 12.5, fontWeight: '700', marginTop: 6, color: '#ffffff' },

  // Cerrar button
  cerrarBtn: {
    height: 56,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    elevation: 4,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cerrarBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  // Empty state
  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyDesc: { fontSize: 13.5, color: '#64748b', marginBottom: 22, paddingHorizontal: 30, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#7c3aed', borderRadius: 14 },
  emptyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14.5 },
});
