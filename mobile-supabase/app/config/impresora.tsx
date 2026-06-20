// =============================================================================
// config/impresora.tsx — Buscar y guardar impresora térmica Bluetooth.
// =============================================================================

import { useEffect, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Bluetooth, CheckCircle2, Lightbulb, Printer, Radio, ReceiptText, Search, X } from 'lucide-react-native';

import {
  getSelectedPrinter,
  printTicket,
  removeSelectedPrinter,
  saveSelectedPrinter,
  scanPrinters,
} from '@/services/printer.service';
import { toastError, toastInfo, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

export default function ImpresoraScreen() {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getSelectedPrinter().then(setSelected);
  }, []);

  const requestPerms = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(granted).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
    } catch {
      return false;
    }
  };

  const handleScan = async () => {
    const ok = await requestPerms();
    if (!ok) {
      toastError('Permisos requeridos', 'Activa Bluetooth y ubicación');
      return;
    }
    setScanning(true);
    setDevices([]);
    try {
      const found = await scanPrinters(8000);
      setDevices(found);
      remoteLogger.info('printer_scan', { found: found.length });
      if (found.length === 0) toastInfo('Sin dispositivos', 'No se encontraron impresoras BT cercanas');
      else toastSuccess(`${found.length} dispositivo${found.length > 1 ? 's' : ''} encontrado${found.length > 1 ? 's' : ''}`);
    } catch (err: any) {
      remoteLogger.error('printer_scan_failed', err);
      toastError('Error escaneando', err?.message || 'Verifica que Bluetooth esté activado');
    } finally {
      setScanning(false);
    }
  };

  const handleSelect = async (device: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data = { id: device.id, name: device.name || device.localName || 'Impresora' };
    await saveSelectedPrinter(data);
    setSelected(data);
    toastSuccess('Impresora guardada', data.name);
  };

  const handleRemove = async () => {
    await removeSelectedPrinter();
    setSelected(null);
    toastInfo('Impresora eliminada');
  };

  const handleTest = async () => {
    if (!selected) return;
    setTesting(true);
    try {
      await printTicket({
        empresa: { nombre: 'POS SHOP', ruc: '20123456789', direccion: 'Lima, Perú' },
        venta: { numero: 'TEST-001', fecha: new Date().toLocaleString('es-PE'), tipoComprobante: 'TICKET DE PRUEBA' },
        items: [
          { nombre: 'Producto de prueba 1', cantidad: 2, precio: 5.0, subtotal: 10.0 },
          { nombre: 'Producto de prueba 2', cantidad: 1, precio: 15.5, subtotal: 15.5 },
        ],
        totales: { subtotal: 21.61, igv: 3.89, total: 25.5 },
        metodoPago: 'Efectivo',
      });
      toastSuccess('Impresión enviada', 'Revisa tu impresora');
    } catch (err: any) {
      remoteLogger.error('printer_test_failed', err);
      toastError('Error al imprimir', err?.message || 'No se pudo imprimir');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Impresora" subtitle="Térmica Bluetooth (ESC/POS)" />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(220)} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Printer color={colors.brand} size={36} strokeWidth={2.2} />
          </View>
        </Animated.View>

        {selected ? (
          <Animated.View entering={FadeInDown.duration(260)} style={s.selectedCard}>
            <View style={s.selectedIcon}>
              <CheckCircle2 color={colors.brand} size={22} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.selectedLabel}>IMPRESORA ACTIVA</Text>
              <Text style={s.selectedName} numberOfLines={1}>{selected.name}</Text>
              <Text style={s.selectedId}>{selected.id.substring(0, 17)}</Text>
            </View>
            <Pressable onPress={handleRemove} style={s.removeBtn}>
              <X color={colors.danger} size={16} strokeWidth={2.4} />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={s.warnCard}>
            <Bluetooth color={colors.warningText} size={20} strokeWidth={2.2} />
            <Text style={s.warnText}>No hay impresora configurada. Escanea para encontrar la tuya.</Text>
          </View>
        )}

        {selected && (
          <Button
            label={testing ? 'Imprimiendo…' : 'Imprimir ticket de prueba'}
            onPress={handleTest}
            loading={testing}
            icon={ReceiptText}
            variant="outline"
          />
        )}

        <View style={s.divider} />

        <Button label={scanning ? 'Buscando…' : 'Buscar impresoras Bluetooth'} onPress={handleScan} icon={Radio} loading={scanning} size="lg" />

        {devices.length > 0 && (
          <>
            <Text style={s.sectionTitle}>DISPOSITIVOS ENCONTRADOS</Text>
            {devices.map((d, i) => {
              const active = selected?.id === d.id;
              return (
                <Animated.View key={d.id} entering={FadeInDown.delay(i * 40).duration(220)}>
                  <Pressable
                    style={({ pressed }) => [s.deviceCard, active && s.deviceCardActive, pressed && { opacity: 0.88 }]}
                    onPress={() => handleSelect(d)}
                  >
                    <View style={s.deviceIcon}>
                      <Bluetooth color={active ? colors.brand : colors.textMuted} size={18} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.deviceName} numberOfLines={1}>{d.name || d.localName || 'Sin nombre'}</Text>
                      <Text style={s.deviceId}>{d.id.substring(0, 17)}</Text>
                    </View>
                    {active && (
                      <View style={s.checkBadge}>
                        <CheckCircle2 color="#FFFFFF" size={12} strokeWidth={2.6} />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </>
        )}

        <View style={s.helpCard}>
          <View style={s.helpHead}>
            <Lightbulb color={colors.info} size={18} strokeWidth={2.2} />
            <Text style={s.helpTitle}>TIPS</Text>
          </View>
          <Text style={s.helpText}>· Activa el Bluetooth del celular</Text>
          <Text style={s.helpText}>· Enciende tu impresora térmica</Text>
          <Text style={s.helpText}>· Empareja primero desde Ajustes de Android</Text>
          <Text style={s.helpText}>· Vuelve aquí y presiona "Buscar"</Text>
          <Text style={s.helpText}>· Compatible con XPrinter, Epson TM, Bematech, Goojprt (ESC/POS, 58/80mm)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginBottom: 20 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.4,
    borderColor: colors.brand,
    gap: 12,
  },
  selectedIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  selectedLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.brandDark, letterSpacing: 1.2 },
  selectedName: { fontFamily: fonts.black, fontSize: 14.5, color: colors.brandDark, marginTop: 2 },
  selectedId: { fontFamily: fonts.semibold, fontSize: 11, color: colors.brandDark, opacity: 0.75 },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  warnText: { flex: 1, color: colors.warningText, fontFamily: fonts.semibold, fontSize: 12.5 },

  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 22 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },

  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 12,
  },
  deviceCardActive: { borderColor: colors.brand, backgroundColor: colors.brandTint },
  deviceIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.text },
  deviceId: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textSubtle, marginTop: 1 },
  checkBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },

  helpCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  helpHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  helpTitle: { fontFamily: fonts.bold, fontSize: 11, color: colors.info, letterSpacing: 1.4 },
  helpText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted, lineHeight: 19 },
});
