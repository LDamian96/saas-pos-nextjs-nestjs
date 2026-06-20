import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { usePosStore } from '@/stores/pos.store';
import api from '@/api/client';
import { extractList, toastSuccess, toastError, toastInfo, getErrorMessage } from '@/api/helpers';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { addToCart, scannerMode, setScannedCode, setScannerMode } = usePosStore();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Modo "returnCode" - solo devuelve el codigo (para crear/editar producto)
    if (scannerMode === 'returnCode') {
      setScannedCode(data);
      setScannerMode('addToCart'); // resetear modo
      toastSuccess('Codigo escaneado', data);
      router.back();
      return;
    }

    // Modo "addToCart" (default)
    return doAddToCart(data);
  };

  const doAddToCart = async (data: string) => {
    try {
      const res = await api.get(`/productos/barcode/${data}`);
      const prod = res.data?.data || res.data;
      if (prod) {
        const v = prod.variantes?.[0];
        if (v) {
          addToCart({
            varianteId: v.id,
            productoId: prod.id,
            nombre: prod.nombre,
            imagen: prod.imagenPrincipal,
            precio: Number(v.precioVenta) || Number(prod.precioVenta),
            stock: v.stock,
          });
          toastSuccess('Producto agregado', prod.nombre);
          router.back();
        } else {
          toastError('Sin stock', 'Producto sin variantes disponibles');
          setScanned(false);
        }
      } else {
        toastError('No encontrado', `No hay producto con codigo ${data}`);
        setScanned(false);
      }
    } catch {
      toastError('No encontrado', `No hay producto con codigo ${data}`);
      setScanned(false);
    }
  };

  if (!permission) return <View style={s.container} />;

  if (!permission.granted) {
    return (
      <View style={s.permissionWrap}>
        <Text style={s.permissionTitle}>Permiso de camara</Text>
        <Text style={s.permissionText}>Necesitamos acceso a la camara para escanear codigos de barras</Text>
        <TouchableOpacity style={s.permissionBtn} onPress={requestPermission}>
          <Text style={s.permissionBtnText}>Permitir camara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={s.overlay}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.topTitle}>Escanear codigo</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Scan guide */}
        <View style={s.guideWrap}>
          <View style={s.guide}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>
          <Text style={s.guideText}>Apunta al codigo de barras</Text>
        </View>

        {/* Scan again */}
        {scanned && (
          <TouchableOpacity style={s.scanAgainBtn} onPress={() => setScanned(false)}>
            <Text style={s.scanAgainText}>Escanear de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  guideWrap: { alignItems: 'center' },
  guide: { width: 260, height: 160, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#7c3aed' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  guideText: { color: '#fff', fontSize: 14, marginTop: 16, opacity: 0.8 },
  scanAgainBtn: { alignSelf: 'center', marginBottom: 80, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  scanAgainText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  permissionWrap: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  permissionTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  permissionText: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  permissionBtn: { width: '100%', height: 52, backgroundColor: '#7c3aed', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { width: '100%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#6b7280', fontSize: 15 },
});
