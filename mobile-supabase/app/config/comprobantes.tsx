// =============================================================================
// config/comprobantes.tsx — Tipos de comprobante habilitados.
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ComponentType } from 'react';
import { FileText, MessageCircle, Receipt, Save, Ticket } from 'lucide-react-native';

import { toastSuccess } from '@/api/helpers';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

const STORAGE_KEY = 'pos-negocio-config';

interface CompConfig {
  ticket: boolean;
  boleta: boolean;
  factura: boolean;
  whatsapp: boolean;
}

const DEFAULT: CompConfig = { ticket: true, boleta: true, factura: false, whatsapp: true };

const ITEMS: { key: keyof CompConfig; label: string; desc: string; Icon: ComponentType<any> }[] = [
  { key: 'ticket', label: 'Ticket', desc: 'Comprobante simple sin datos fiscales', Icon: Ticket },
  { key: 'boleta', label: 'Boleta de venta', desc: 'Requiere DNI del cliente', Icon: Receipt },
  { key: 'factura', label: 'Factura', desc: 'Requiere RUC de la empresa', Icon: FileText },
  { key: 'whatsapp', label: 'Envío por WhatsApp', desc: 'Ofrecer enviar comprobante por WhatsApp', Icon: MessageCircle },
];

export default function ComprobantesScreen() {
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<CompConfig>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setConfig(JSON.parse(val));
    });
  }, []);

  const toggle = (key: keyof CompConfig) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toastSuccess('Guardado', 'Configuración actualizada');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Comprobantes" subtitle="Habilita los tipos disponibles" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {ITEMS.map((item, i) => (
          <Animated.View key={item.key} entering={FadeInDown.delay(i * 50).duration(260)} style={s.card}>
            <View style={s.cardIcon}>
              <item.Icon color={colors.brand} size={20} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardLabel}>{item.label}</Text>
              <Text style={s.cardDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={config[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: colors.border, true: colors.brandSoft }}
              thumbColor={config[item.key] ? colors.brand : '#FFFFFF'}
            />
          </Animated.View>
        ))}

        <View style={{ marginTop: 20 }}>
          <Button label="Guardar" onPress={handleSave} icon={Save} size="lg" />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
    ...shadows.soft,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  cardDesc: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
});
