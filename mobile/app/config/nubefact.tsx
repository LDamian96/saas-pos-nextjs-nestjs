import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

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
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setConfig(JSON.parse(val));
    });
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toastSuccess('Guardado', 'Configuracion de Nubefact guardada');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nubefact</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.form}>
        <View style={s.iconWrap}>
          <Text style={{ fontSize: 48 }}>📡</Text>
          <Text style={s.subtitle}>Facturacion electronica</Text>
        </View>

        {/* Modo */}
        <View style={s.modoCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.modoLabel}>Modo Demo</Text>
            <Text style={s.modoDesc}>{config.modoDemo ? 'Pruebas sin emitir comprobantes reales' : 'Produccion - comprobantes validos ante SUNAT'}</Text>
          </View>
          <Switch
            value={config.modoDemo}
            onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setConfig(prev => ({ ...prev, modoDemo: v })); }}
            trackColor={{ false: '#fecaca', true: '#c4b5fd' }}
            thumbColor={config.modoDemo ? '#7c3aed' : '#dc2626'}
          />
        </View>

        {!config.modoDemo && (
          <View style={s.warningCard}>
            <Text style={s.warningText}>⚠️ Modo produccion activo. Los comprobantes emitidos seran validos ante SUNAT.</Text>
          </View>
        )}

        <Text style={s.label}>URL del API</Text>
        <TextInput
          style={s.input}
          value={config.urlApi}
          onChangeText={v => setConfig(prev => ({ ...prev, urlApi: v }))}
          placeholder="https://api.nubefact.com/api/v1/..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />

        <Text style={s.label}>Token</Text>
        <View style={s.tokenRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={config.token}
            onChangeText={v => setConfig(prev => ({ ...prev, token: v }))}
            placeholder="Token de Nubefact"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showToken}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.showBtn} onPress={() => setShowToken(!showToken)}>
            <Text style={{ fontSize: 18 }}>{showToken ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>Guardar</Text>
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
  form: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginBottom: 20 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  modoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 1 },
  modoLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  modoDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  warningCard: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' },
  warningText: { color: '#dc2626', fontSize: 13, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  tokenRow: { flexDirection: 'row', gap: 8 },
  showBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 28, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
