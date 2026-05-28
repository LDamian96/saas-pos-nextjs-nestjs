import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  scanPrinters,
  saveSelectedPrinter,
  getSelectedPrinter,
  removeSelectedPrinter,
  printTicket,
} from '@/services/printer.service';
import { toastSuccess, toastError, toastInfo } from '@/api/helpers';

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
      toastError('Permisos requeridos', 'Activa Bluetooth y ubicacion');
      return;
    }
    setScanning(true);
    setDevices([]);
    try {
      const found = await scanPrinters(8000);
      setDevices(found);
      if (found.length === 0) {
        toastInfo('Sin dispositivos', 'No se encontraron impresoras BT cercanas');
      } else {
        toastSuccess(`${found.length} dispositivo${found.length > 1 ? 's' : ''} encontrado${found.length > 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      toastError('Error escaneando', err?.message || 'Verifica que Bluetooth este activado');
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
        empresa: { nombre: 'POS SHOP', ruc: '20123456789', direccion: 'Lima, Peru' },
        venta: {
          numero: 'TEST-001',
          fecha: new Date().toLocaleString('es-PE'),
          tipoComprobante: 'TICKET DE PRUEBA',
        },
        items: [
          { nombre: 'Producto de prueba 1', cantidad: 2, precio: 5.0, subtotal: 10.0 },
          { nombre: 'Producto de prueba 2', cantidad: 1, precio: 15.5, subtotal: 15.5 },
        ],
        totales: { subtotal: 21.61, igv: 3.89, total: 25.5 },
        metodoPago: 'Efectivo',
      });
      toastSuccess('Impresion enviada', 'Revisa tu impresora');
    } catch (err: any) {
      toastError('Error al imprimir', err?.message || 'No se pudo imprimir');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Impresora</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.iconWrap}>
          <Text style={{ fontSize: 56 }}>🖨</Text>
          <Text style={s.subtitle}>Impresora termica Bluetooth</Text>
        </View>

        {/* Selected printer */}
        {selected ? (
          <View style={s.selectedCard}>
            <View style={s.selectedDot} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.selectedLabel}>IMPRESORA ACTIVA</Text>
              <Text style={s.selectedName}>{selected.name}</Text>
              <Text style={s.selectedId}>{selected.id.substring(0, 17)}</Text>
            </View>
            <TouchableOpacity onPress={handleRemove} style={s.removeBtn}>
              <Text style={{ color: '#dc2626', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.warnCard}>
            <Text style={{ fontSize: 22 }}>ℹ️</Text>
            <Text style={s.warnText}>No hay impresora configurada. Escanea para encontrar la tuya.</Text>
          </View>
        )}

        {selected && (
          <TouchableOpacity
            style={[s.testBtn, testing && { opacity: 0.6 }]}
            onPress={handleTest}
            disabled={testing}
            activeOpacity={0.8}
          >
            {testing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.testBtnText}>🧾 Imprimir ticket de prueba</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={s.divider} />

        <TouchableOpacity
          style={[s.scanBtn, scanning && { opacity: 0.6 }]}
          onPress={handleScan}
          disabled={scanning}
          activeOpacity={0.8}
        >
          {scanning ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={s.scanBtnText}>Buscando dispositivos...</Text>
            </>
          ) : (
            <Text style={s.scanBtnText}>📡 Buscar impresoras Bluetooth</Text>
          )}
        </TouchableOpacity>

        {devices.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Dispositivos encontrados</Text>
            {devices.map((d) => {
              const isSelected = selected?.id === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[s.deviceCard, isSelected && s.deviceCardActive]}
                  onPress={() => handleSelect(d)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22 }}>🔵</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.deviceName}>{d.name || d.localName || 'Sin nombre'}</Text>
                    <Text style={s.deviceId}>{d.id.substring(0, 17)}</Text>
                  </View>
                  {isSelected && (
                    <View style={s.checkBadge}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={s.helpCard}>
          <Text style={s.helpTitle}>💡 Tips</Text>
          <Text style={s.helpText}>1. Activa el Bluetooth del celular</Text>
          <Text style={s.helpText}>2. Enciende tu impresora termica</Text>
          <Text style={s.helpText}>3. Empareja primero desde Ajustes de Android</Text>
          <Text style={s.helpText}>4. Vuelve aqui y presiona "Buscar"</Text>
          <Text style={s.helpText}>5. Compatible con XPrinter, Epson TM, Bematech, Goojprt y similares (ESC/POS, 58/80mm)</Text>
        </View>
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
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  selectedCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#16a34a',
    shadowColor: '#16a34a', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  selectedDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#16a34a' },
  selectedLabel: { fontSize: 10, fontWeight: '700', color: '#16a34a', letterSpacing: 1 },
  selectedName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  selectedId: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  removeBtn: { padding: 8 },
  warnCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a', gap: 10 },
  warnText: { flex: 1, color: '#92400e', fontSize: 13, fontWeight: '500' },
  testBtn: { height: 52, backgroundColor: '#16a34a', borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 8, elevation: 2 },
  testBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 20 },
  scanBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', elevation: 4 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 20, marginBottom: 10 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  deviceCardActive: { borderColor: '#7c3aed', backgroundColor: '#faf5ff' },
  deviceName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  deviceId: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  checkBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  helpCard: { backgroundColor: '#f0f9ff', borderRadius: 14, padding: 14, marginTop: 24, borderWidth: 1, borderColor: '#bae6fd' },
  helpTitle: { fontSize: 13, fontWeight: '700', color: '#0369a1', marginBottom: 6 },
  helpText: { fontSize: 12, color: '#0c4a6e', lineHeight: 18 },
});
