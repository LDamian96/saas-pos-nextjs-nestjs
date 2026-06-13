// =============================================================================
// scanner.tsx — Escáner código de barras con overlay moderno.
// =============================================================================

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { ChevronLeft, ScanLine, X } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { usePosStore } from '@/stores/pos.store';
import { PressableButton } from '@/components/ui/PressableButton';
import { toastError, toastSuccess } from '@/services/toast';

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const addToCart = usePosStore((s) => s.addToCart);
  const scanned = useRef(false);
  const [code, setCode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['scan', code],
    queryFn: async () => {
      const r = await api.get(`/productos/buscar`, { params: { codigoBarras: code } });
      return r.data?.data ?? r.data;
    },
    enabled: !!code,
    retry: false,
  });

  // Animated scan line
  const linePos = useSharedValue(0);
  linePos.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: linePos.value * 180 }],
  }));

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <View style={s.permission}>
        <Text fontFamily="$body" fontSize={18} fontWeight="800" color="$color" textAlign="center">
          Necesitamos acceso a la cámara
        </Text>
        <View style={{ height: 20 }} />
        <PressableButton label="Permitir" onPress={requestPermission} />
      </View>
    );
  }

  const handleScan = (result: { data: string }) => {
    if (scanned.current) return;
    scanned.current = true;
    setCode(result.data);
  };

  const handleAdd = () => {
    if (!data) return;
    const v = data.variantes?.[0];
    if (!v) {
      toastError({ title: 'Sin stock' });
      return;
    }
    addToCart({
      varianteId: v.id,
      productoId: data.id,
      nombre: data.nombre,
      imagen: data.imagenPrincipal,
      precio: Number(v.precioVenta) || Number(data.precioVenta),
      stock: v.stock,
    });
    toastSuccess({ title: 'Agregado', message: data.nombre });
    router.back();
  };

  return (
    <View style={s.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a'] }}
      />

      {/* Overlay oscuro con marco transparente */}
      <View style={s.overlay} pointerEvents="none">
        <View style={s.dim} />
        <View style={{ flexDirection: 'row' }}>
          <View style={s.dim} />
          <View style={s.frameOuter}>
            <View style={s.corner} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            <Animated.View style={[s.scanLine, lineStyle]} />
          </View>
          <View style={s.dim} />
        </View>
        <View style={s.dim} />
      </View>

      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.topBtn}>
          <X color="#FFFFFF" size={22} strokeWidth={2.4} />
        </Pressable>
        <Text fontFamily="$body" color="#FFFFFF" fontSize={16} fontWeight="800">
          Escanear código
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hint */}
      <Animated.View entering={FadeIn.duration(400)} style={[s.hint, { bottom: insets.bottom + 120 }]}>
        <ScanLine color="#FFFFFF" size={18} strokeWidth={2.2} />
        <Text fontFamily="$body" color="#FFFFFF" fontSize={13} fontWeight="700" marginLeft={8}>
          Apunta al código de barras
        </Text>
      </Animated.View>

      {/* Result */}
      {code && (
        <View style={[s.result, { bottom: insets.bottom + 16 }]}>
          {isLoading ? (
            <Text fontFamily="$body" color="$color" fontWeight="700">
              Buscando…
            </Text>
          ) : data ? (
            <>
              <View style={{ flex: 1 }}>
                <Text fontFamily="$body" fontSize={14} fontWeight="700" color="$color" numberOfLines={1}>
                  {data.nombre}
                </Text>
                <Text fontFamily="$body" fontSize={13} color="#00932C" fontWeight="900">
                  S/ {Number(data.precioVenta).toFixed(2)}
                </Text>
              </View>
              <PressableButton label="Agregar" onPress={handleAdd} size="md" full={false} />
            </>
          ) : (
            <View style={{ flex: 1 }}>
              <Text fontFamily="$body" fontWeight="700" color="$color">
                No encontrado
              </Text>
              <Pressable
                onPress={() => {
                  scanned.current = false;
                  setCode(null);
                }}
              >
                <Text fontFamily="$body" color="#00932C" fontWeight="700" marginTop={4}>
                  Escanear otro
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const FRAME = 240;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F8FA' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  frameOuter: { width: FRAME, height: FRAME, position: 'relative' },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#00FF95',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: { left: undefined, right: 0, borderLeftWidth: 0, borderRightWidth: 4, borderTopLeftRadius: 0, borderTopRightRadius: 8 },
  cornerBL: { top: undefined, bottom: 0, borderTopWidth: 0, borderBottomWidth: 4, borderTopLeftRadius: 0, borderBottomLeftRadius: 8 },
  cornerBR: { top: undefined, left: undefined, bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomWidth: 4, borderRightWidth: 4, borderTopLeftRadius: 0, borderBottomRightRadius: 8 },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 28,
    height: 2,
    backgroundColor: '#00FF95',
    borderRadius: 2,
    shadowColor: '#00FF95',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
  },

  result: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
