// =============================================================================
// scanner.tsx — Cámara para escanear código de barras / QR.
// =============================================================================

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Camera, RotateCw, X } from 'lucide-react-native';

import { usePosStore } from '@/stores/pos.store';
import api from '@/api/client';
import { toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius } from '@/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { addToCart, scannerMode, setScannedCode, setScannerMode } = usePosStore();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    remoteLogger.info('barcode_scanned', { code: data, mode: scannerMode });

    if (scannerMode === 'returnCode') {
      setScannedCode(data);
      setScannerMode('addToCart');
      toastSuccess('Código escaneado', data);
      router.back();
      return;
    }

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
          toastSuccess('Agregado', prod.nombre);
          router.back();
        } else {
          toastError('Sin stock', 'Producto sin variantes disponibles');
          setScanned(false);
        }
      } else {
        toastError('No encontrado', `Código ${data}`);
        setScanned(false);
      }
    } catch {
      toastError('No encontrado', `Código ${data}`);
      setScanned(false);
    }
  };

  if (!permission) return <View style={s.container} />;

  if (!permission.granted) {
    return (
      <View style={s.permissionWrap}>
        <View style={s.permissionIcon}>
          <Camera color={colors.brand} size={42} strokeWidth={2} />
        </View>
        <Text style={s.permissionTitle}>Permiso de cámara</Text>
        <Text style={s.permissionText}>
          Necesitamos acceso a la cámara para escanear códigos de barras o QR.
        </Text>
        <View style={{ marginTop: 30, width: '100%', gap: 12 }}>
          <Button label="Permitir cámara" icon={Camera} onPress={requestPermission} size="lg" />
          <Button label="Volver" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={s.scrim} />

      <Animated.View entering={FadeIn.duration(260)} style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.closeBtn} hitSlop={10}>
          <X color="#FFFFFF" size={20} strokeWidth={2.6} />
        </Pressable>
        <Text style={s.topTitle}>Escanear código</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <View style={s.guideWrap}>
        <View style={s.guide}>
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />
          <ScanLine />
        </View>
        <Text style={s.guideText}>Apunta al código</Text>
      </View>

      <View style={s.bottomBar}>
        {scanned && (
          <Pressable
            style={s.scanAgain}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScanned(false);
            }}
          >
            <RotateCw color="#FFFFFF" size={18} strokeWidth={2.4} />
            <Text style={s.scanAgainText}>Escanear de nuevo</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ScanLine() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * 158 - 79 }] }));
  return <Animated.View style={[ln.line, style]} />;
}

const ln = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: colors.brand,
    borderRadius: 2,
    shadowColor: colors.brand,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.2 },

  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guide: { width: 280, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.brand },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  guideText: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.semibold, fontSize: 13, marginTop: 22, letterSpacing: 0.4 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 64, alignItems: 'center' },
  scanAgain: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.brand,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.lg,
    shadowColor: colors.brand,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  scanAgainText: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 14 },

  permissionWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  permissionTitle: { fontFamily: fonts.black, fontSize: 22, color: colors.text, letterSpacing: -0.3 },
  permissionText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
