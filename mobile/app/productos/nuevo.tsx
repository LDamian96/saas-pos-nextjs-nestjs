import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { usePosStore } from '@/stores/pos.store';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function NuevoProductoScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { scannedCode, setScannedCode, setScannerMode } = usePosStore();
  const [nombre, setNombre] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);

  // Cuando el scanner devuelve un codigo, llenarlo en el input
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

  const { data: catData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then(r => r.data),
  });
  const categorias = extractList(catData);

  const { data: marcaData } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => api.get('/marcas').then(r => r.data),
  });
  const marcas = extractList(marcaData);

  // Calcular ganancias: el precio de venta INCLUYE IGV 18%
  const IGV = 1.18;
  const pc = Number(precioCompra) || 0;
  const pv = Number(precioVenta) || 0;
  const pvSinIgv = pv / IGV;
  const igvMonto = pv > 0 ? pv - pvSinIgv : 0;
  // Ganancia SIN IGV: lo que realmente queda despues de pagar IGV a SUNAT
  const gananciaSinIgv = pc > 0 && pv > 0 ? pvSinIgv - pc : 0;
  const margenSinIgv = pc > 0 && pv > 0 ? ((gananciaSinIgv / pc) * 100).toFixed(1) : null;
  // Ganancia BRUTA CON IGV: lo que entra a caja menos lo que pagaste
  const gananciaConIgv = pc > 0 && pv > 0 ? pv - pc : 0;
  const margenConIgv = pc > 0 && pv > 0 ? ((gananciaConIgv / pc) * 100).toFixed(1) : null;

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      let imagenUrl = null;
      if (imagen) {
        const formData = new FormData();
        formData.append('imagen', { uri: imagen, name: 'photo.jpg', type: 'image/jpeg' } as any);
        const uploadRes = await api.post('/uploads/imagen', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imagenUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      }
      return api.post('/productos', { ...body, imagenPrincipal: imagenUrl }).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Producto creado', 'El producto se ha creado correctamente');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { toastError('Permiso requerido', 'Necesitamos acceso a la camara'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setImagen(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!nombre.trim()) { toastError('Campo requerido', 'El nombre es obligatorio'); return; }
    if (!precioVenta) { toastError('Campo requerido', 'El precio de venta es obligatorio'); return; }

    createMutation.mutate({
      nombre: nombre.trim(),
      precioCompra: precioCompra ? Number(precioCompra) : undefined,
      precioVenta: Number(precioVenta),
      stock: stock ? Number(stock) : 0,
      codigoBarras: codigoBarras || undefined,
      categoriaId: categoriaId || undefined,
      marcaId: marcaId || undefined,
    });
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nuevo Producto</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        {/* Imagen */}
        <View style={s.imgSection}>
          {imagen ? (
            <TouchableOpacity onPress={pickImage}>
              <Image source={{ uri: imagen }} style={s.imgPreview} />
            </TouchableOpacity>
          ) : (
            <View style={s.imgButtons}>
              <TouchableOpacity style={s.imgBtn} onPress={takePhoto}>
                <Text style={{ fontSize: 28 }}>📷</Text>
                <Text style={s.imgBtnText}>Camara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.imgBtn} onPress={pickImage}>
                <Text style={{ fontSize: 28 }}>🖼</Text>
                <Text style={s.imgBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Nombre */}
        <Text style={s.label}>Nombre *</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Nombre del producto" placeholderTextColor="#9ca3af" />

        {/* Categoría */}
        <Text style={s.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity style={[s.pill, !categoriaId && s.pillActive]} onPress={() => setCategoriaId(null)}>
            <Text style={[s.pillText, !categoriaId && s.pillTextActive]}>Ninguna</Text>
          </TouchableOpacity>
          {categorias.map((c: any) => (
            <TouchableOpacity key={c.id} style={[s.pill, categoriaId === c.id && s.pillActive]} onPress={() => setCategoriaId(c.id)}>
              <Text style={[s.pillText, categoriaId === c.id && s.pillTextActive]}>{c.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Marca */}
        <Text style={s.label}>Marca</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity style={[s.pill, !marcaId && s.pillActive]} onPress={() => setMarcaId(null)}>
            <Text style={[s.pillText, !marcaId && s.pillTextActive]}>Ninguna</Text>
          </TouchableOpacity>
          {marcas.map((m: any) => (
            <TouchableOpacity key={m.id} style={[s.pill, marcaId === m.id && s.pillActive]} onPress={() => setMarcaId(m.id)}>
              <Text style={[s.pillText, marcaId === m.id && s.pillTextActive]}>{m.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Precios */}
        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Precio compra</Text>
            <TextInput style={s.input} value={precioCompra} onChangeText={setPrecioCompra} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Precio venta *</Text>
            <TextInput style={s.input} value={precioVenta} onChangeText={setPrecioVenta} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Stock inicial</Text>
            <TextInput style={s.input} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
          </View>
          <View style={s.half} />
        </View>

        {pc > 0 && pv > 0 && (
          <>
            <View style={s.profitCard}>
              <View style={s.profitRow}>
                <Text style={s.profitLabel}>Precio sin IGV</Text>
                <Text style={s.profitValue}>S/ {pvSinIgv.toFixed(2)}</Text>
              </View>
              <View style={s.profitRow}>
                <Text style={s.profitLabel}>IGV (18%)</Text>
                <Text style={[s.profitValue, { color: '#f59e0b' }]}>S/ {igvMonto.toFixed(2)}</Text>
              </View>
            </View>

            <View style={s.gainRow}>
              <View style={[s.gainCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={s.gainTag}>GANANCIA SIN IGV</Text>
                <Text style={[s.gainValue, { color: gananciaSinIgv > 0 ? '#16a34a' : '#dc2626' }]}>
                  S/ {gananciaSinIgv.toFixed(2)}
                </Text>
                <View style={[s.margenBadge, { backgroundColor: Number(margenSinIgv) > 0 ? '#dcfce7' : '#fee2e2', alignSelf: 'flex-start', marginTop: 6 }]}>
                  <Text style={[s.margenText, { color: Number(margenSinIgv) > 0 ? '#16a34a' : '#dc2626' }]}>{margenSinIgv}%</Text>
                </View>
                <Text style={s.gainHint}>Lo que queda tras IGV</Text>
              </View>
              <View style={[s.gainCard, { backgroundColor: '#faf5ff', borderColor: '#ddd6fe' }]}>
                <Text style={[s.gainTag, { color: '#7c3aed' }]}>GANANCIA CON IGV</Text>
                <Text style={[s.gainValue, { color: gananciaConIgv > 0 ? '#7c3aed' : '#dc2626' }]}>
                  S/ {gananciaConIgv.toFixed(2)}
                </Text>
                <View style={[s.margenBadge, { backgroundColor: Number(margenConIgv) > 0 ? '#ede9fe' : '#fee2e2', alignSelf: 'flex-start', marginTop: 6 }]}>
                  <Text style={[s.margenText, { color: Number(margenConIgv) > 0 ? '#7c3aed' : '#dc2626' }]}>{margenConIgv}%</Text>
                </View>
                <Text style={s.gainHint}>Bruta antes de IGV</Text>
              </View>
            </View>
          </>
        )}

        {/* Código barras */}
        <Text style={s.label}>Codigo de barras</Text>
        <View style={s.barcodeRow}>
          <TextInput style={[s.input, { flex: 1 }]} value={codigoBarras} onChangeText={setCodigoBarras} placeholder="Escanear o escribir" placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={s.barcodeScan} onPress={openScanner}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, createMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={createMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{createMutation.isPending ? 'Guardando...' : 'Crear Producto'}</Text>
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
  imgSection: { alignItems: 'center', marginBottom: 20 },
  imgPreview: { width: 120, height: 120, borderRadius: 16 },
  imgButtons: { flexDirection: 'row', gap: 16 },
  imgBtn: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  imgBtnText: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  pillScroll: { maxHeight: 40 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  pillActive: { backgroundColor: '#7c3aed' },
  pillText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  profitCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  profitLabel: { fontSize: 13, color: '#6b7280' },
  profitValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  margenBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  margenText: { fontSize: 13, fontWeight: '700' },
  barcodeRow: { flexDirection: 'row', gap: 8 },
  barcodeScan: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  // Ganancia con/sin IGV
  gainRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  gainCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  gainTag: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 1, marginBottom: 6 },
  gainValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  gainHint: { fontSize: 11, color: '#9ca3af', marginTop: 8, fontWeight: '500' },
});
