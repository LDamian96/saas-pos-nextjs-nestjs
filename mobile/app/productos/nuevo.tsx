// =============================================================================
// productos/nuevo.tsx — Crear nuevo producto.
// =============================================================================

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Camera, ImagePlus, Plus, ScanLine } from 'lucide-react-native';

import api from '@/api/client';
import { usePosStore } from '@/stores/pos.store';
import { extractList, getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { colors, fonts, radius, shadows } from '@/theme';

const IGV = 1.18;

export default function NuevoProductoScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { scannedCode, setScannedCode, setScannerMode } = usePosStore();

  const [nombre, setNombre] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioMayorista, setPrecioMayorista] = useState('');
  const [stock, setStock] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (scannedCode) {
        setCodigoBarras(scannedCode);
        setScannedCode(null);
      }
    }, [scannedCode])
  );

  const openScanner = () => {
    setScannerMode('returnCode');
    router.push('/scanner');
  };

  const { data: catData } = useQuery({ queryKey: ['categorias'], queryFn: () => api.get('/categorias').then((r) => r.data) });
  const categorias = extractList(catData);
  const { data: marcaData } = useQuery({ queryKey: ['marcas'], queryFn: () => api.get('/marcas').then((r) => r.data) });
  const marcas = extractList(marcaData);

  const pc = Number(precioCompra) || 0;
  const pv = Number(precioVenta) || 0;
  const pm = Number(precioMayorista) || 0;
  const pvSinIgv = pv / IGV;
  const pmSinIgv = pm / IGV;
  const gananciaReal = pc > 0 && pv > 0 ? pvSinIgv - pc : 0;
  const margenReal = pc > 0 && pv > 0 ? ((gananciaReal / pc) * 100).toFixed(1) : null;
  const igvMonto = pv > 0 ? pv - pvSinIgv : 0;
  const gananciaMayo = pc > 0 && pm > 0 ? pmSinIgv - pc : 0;
  const margenMayo = pc > 0 && pm > 0 ? ((gananciaMayo / pc) * 100).toFixed(1) : null;

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      let imagenUrl = null;
      if (imagen) {
        const formData = new FormData();
        formData.append('imagen', { uri: imagen, name: 'photo.jpg', type: 'image/jpeg' } as any);
        const uploadRes = await api.post('/uploads/imagen', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imagenUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      }
      return api.post('/productos', { ...body, imagenPrincipal: imagenUrl }).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info('producto_creado', { nombre });
      toastSuccess('Producto creado');
      router.back();
    },
    onError: (err: any) => {
      remoteLogger.error('producto_create_failed', err);
      toastError('Error', getErrorMessage(err));
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toastError('Permiso requerido', 'Necesitamos acceso a la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      toastError('Campo requerido', 'El nombre es obligatorio');
      return;
    }
    if (!precioVenta) {
      toastError('Campo requerido', 'El precio de venta es obligatorio');
      return;
    }
    createMutation.mutate({
      nombre: nombre.trim(),
      precioCompra: precioCompra ? Number(precioCompra) : undefined,
      precioVenta: Number(precioVenta),
      precioMayorista: precioMayorista ? Number(precioMayorista) : undefined,
      stock: stock ? Number(stock) : 0,
      codigoBarras: codigoBarras || undefined,
      categoriaId: categoriaId || undefined,
      marcaId: marcaId || undefined,
    });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header title="Nuevo producto" subtitle="Añade un producto al catálogo" />

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(220)} style={s.imgSection}>
          {imagen ? (
            <Pressable onPress={pickImage}>
              <Image source={{ uri: imagen }} style={s.imgPreview} contentFit="cover" />
            </Pressable>
          ) : (
            <View style={s.imgButtons}>
              <Pressable style={s.imgBtn} onPress={takePhoto}>
                <Camera color={colors.brand} size={26} strokeWidth={2} />
                <Text style={s.imgBtnText}>Cámara</Text>
              </Pressable>
              <Pressable style={s.imgBtn} onPress={pickImage}>
                <ImagePlus color={colors.brand} size={26} strokeWidth={2} />
                <Text style={s.imgBtnText}>Galería</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <FieldLabel>NOMBRE *</FieldLabel>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del producto" placeholderTextColor={colors.textPlaceholder} />

        <FieldLabel>CATEGORÍA</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          <Pill label="Ninguna" active={!categoriaId} onPress={() => setCategoriaId(null)} />
          {categorias.map((c: any) => (
            <Pill key={c.id} label={c.nombre} active={categoriaId === c.id} onPress={() => setCategoriaId(c.id)} />
          ))}
        </ScrollView>

        <FieldLabel>MARCA</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
          <Pill label="Ninguna" active={!marcaId} onPress={() => setMarcaId(null)} />
          {marcas.map((m: any) => (
            <Pill key={m.id} label={m.nombre} active={marcaId === m.id} onPress={() => setMarcaId(m.id)} />
          ))}
        </ScrollView>

        <View style={s.row}>
          <View style={s.half}>
            <FieldLabel>PRECIO COMPRA</FieldLabel>
            <TextInput style={s.input} value={precioCompra} onChangeText={setPrecioCompra} placeholder="0.00" placeholderTextColor={colors.textPlaceholder} keyboardType="decimal-pad" />
          </View>
          <View style={s.half}>
            <FieldLabel>PRECIO VENTA *</FieldLabel>
            <TextInput style={s.input} value={precioVenta} onChangeText={setPrecioVenta} placeholder="0.00" placeholderTextColor={colors.textPlaceholder} keyboardType="decimal-pad" />
          </View>
        </View>

        {pc > 0 && pv > 0 && (
          <Animated.View entering={FadeInDown.duration(240)} style={s.profitCard}>
            <PRow label="Precio sin IGV" value={`S/ ${pvSinIgv.toFixed(2)}`} />
            <PRow label="IGV (18%)" value={`S/ ${igvMonto.toFixed(2)}`} color={colors.warningText} />
            <View style={s.profitSep} />
            <PRow label="Ganancia real" value={`S/ ${gananciaReal.toFixed(2)}`} color={gananciaReal > 0 ? colors.brand : colors.danger} big />
            <View style={s.profitMargin}>
              <Text style={s.profitLabel}>Margen real</Text>
              <View style={[s.margenBadge, { backgroundColor: Number(margenReal) > 0 ? colors.brandTint : colors.dangerSoft, borderColor: Number(margenReal) > 0 ? colors.brandSoft : colors.dangerBorder }]}>
                <Text style={[s.margenText, { color: Number(margenReal) > 0 ? colors.brandDark : colors.danger }]}>{margenReal}%</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={s.row}>
          <View style={s.half}>
            <FieldLabel>PRECIO MAYORISTA</FieldLabel>
            <TextInput style={s.input} value={precioMayorista} onChangeText={setPrecioMayorista} placeholder="0.00" placeholderTextColor={colors.textPlaceholder} keyboardType="decimal-pad" />
          </View>
          <View style={s.half}>
            <FieldLabel>STOCK INICIAL</FieldLabel>
            <TextInput style={s.input} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor={colors.textPlaceholder} keyboardType="number-pad" />
          </View>
        </View>

        {pc > 0 && pm > 0 && (
          <Animated.View entering={FadeInDown.duration(240)} style={[s.profitCard, { borderColor: colors.warningBorder, backgroundColor: colors.warningSoft }]}>
            <PRow label="Mayorista sin IGV" value={`S/ ${pmSinIgv.toFixed(2)}`} color={colors.warningText} />
            <PRow label="Ganancia mayorista" value={`S/ ${gananciaMayo.toFixed(2)}`} color={gananciaMayo > 0 ? colors.brand : colors.danger} big />
            <View style={s.profitMargin}>
              <Text style={s.profitLabel}>Margen mayorista</Text>
              <View style={[s.margenBadge, { backgroundColor: colors.warningSoft, borderColor: colors.warningBorder }]}>
                <Text style={[s.margenText, { color: colors.warningText }]}>{margenMayo}%</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <FieldLabel>CÓDIGO DE BARRAS</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[s.input, { flex: 1 }]} value={codigoBarras} onChangeText={setCodigoBarras} placeholder="Escanear o escribir" placeholderTextColor={colors.textPlaceholder} />
          <Pressable style={s.scanIconBtn} onPress={openScanner}>
            <ScanLine color={colors.brand} size={22} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={{ marginTop: 28 }}>
          <Button label={createMutation.isPending ? 'Creando…' : 'Crear producto'} loading={createMutation.isPending} icon={Plus} size="lg" onPress={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.label}>{children}</Text>;
}

function PRow({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <View style={s.profitRow}>
      <Text style={s.profitLabel}>{label}</Text>
      <Text style={[s.profitValue, color && { color }, big && { fontSize: 16, fontFamily: fonts.black }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 20, paddingBottom: 40 },

  imgSection: { alignItems: 'center', marginBottom: 6 },
  imgPreview: { width: 130, height: 130, borderRadius: radius.xl },
  imgButtons: { flexDirection: 'row', gap: 16 },
  imgBtn: {
    width: 100,
    height: 100,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.brandSoft,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgBtnText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand, marginTop: 6, letterSpacing: 0.3 },

  label: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 8, marginTop: 16 },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    borderWidth: 1.2,
    borderColor: colors.divider,
    color: colors.text,
  },

  pillRow: { gap: 8, paddingVertical: 2 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  profitCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  profitSep: { height: 1, backgroundColor: colors.divider, marginVertical: 6 },
  profitMargin: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  profitLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted },
  profitValue: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  margenBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  margenText: { fontFamily: fonts.black, fontSize: 12.5 },

  scanIconBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
});
