import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

const STORAGE_KEY = 'pos-negocio-config';

interface ComprobanteConfig {
  ticket: boolean;
  boleta: boolean;
  factura: boolean;
  whatsapp: boolean;
}

const DEFAULT_CONFIG: ComprobanteConfig = { ticket: true, boleta: true, factura: false, whatsapp: true };

export default function ComprobantesScreen() {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<ComprobanteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setConfig(JSON.parse(val));
    });
  }, []);

  const toggle = (key: keyof ComprobanteConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toastSuccess('Guardado', 'Configuracion de comprobantes guardada');
  };

  const items = [
    { key: 'ticket' as const, emoji: '🧾', label: 'Ticket', desc: 'Comprobante simple sin datos fiscales' },
    { key: 'boleta' as const, emoji: '📄', label: 'Boleta de Venta', desc: 'Requiere DNI del cliente' },
    { key: 'factura' as const, emoji: '📋', label: 'Factura', desc: 'Requiere RUC de la empresa' },
    { key: 'whatsapp' as const, emoji: '📱', label: 'Envio por WhatsApp', desc: 'Ofrecer enviar comprobante por WhatsApp' },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Comprobantes</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {items.map(item => (
          <View key={item.key} style={s.card}>
            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardLabel}>{item.label}</Text>
              <Text style={s.cardDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={config[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
              thumbColor={config[item.key] ? '#7c3aed' : '#fff'}
            />
          </View>
        ))}

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
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
  content: { padding: 16, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } },
  cardLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  saveBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
