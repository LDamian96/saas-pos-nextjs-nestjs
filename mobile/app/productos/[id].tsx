import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { usePosStore } from '@/stores/pos.store';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function EditarProductoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [newImagen, setNewImagen] = useState<string | null>(null);

  const { data: prodData, isLoading } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => api.get(`/productos/${id}`).then(r => r.data),
    enabled: !!id,
  });

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

  useEffect(() => {
    const prod = prodData?.data || prodData;
    if (prod) {
      setNombre(prod.nombre || '');
      setPrecioCompra(prod.precioCompra?.toString() || '');
      setPrecioVenta(prod.precioVenta?.toString() || '');
      setPrecioMayorista(prod.precioMayorista?.toString() || '');
      setStock(prod.variantes?.[0]?.stock?.toString() || '0');
      setCodigoBarras(prod.codigoBarras || '');
      setCategoriaId(prod.categoriaId || null);
      setMarcaId(prod.marcaId || null);
      setImagen(prod.imagenPrincipal || null);
    }
  }, [prodData]);

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

  // Calcular ganancias: precio de venta incluye IGV 18%
  const IGV = 1.18;
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

  const updateMutation = useMutation({
    mutationFn: async (body: any) => {
      let imagenUrl = imagen;
      if (newImagen) {
        const formData = new FormData();
        formData.append('imagen', { uri: newImagen, name: 'photo.jpg', type: 'image/jpeg' } as any);
        const uploadRes = await api.post('/uploads/imagen', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imagenUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      }
      return api.put(`/productos/${id}`, { ...body, imagenPrincipal: imagenUrl }).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', id] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Producto actualizado');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/productos/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toastSuccess('Eliminado', 'Producto eliminado');
      router.back();
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) { setNewImagen(result.assets[0].uri); setImagen(result.assets[0].uri); }
  };

  const handleSave = () => {
    if (!nombre.trim()) { toastError('Campo requerido', 'El nombre es obligatorio'); return; }
    if (!precioVenta) { toastError('Campo requerido', 'El precio de venta es obligatorio'); return; }
    updateMutation.mutate({
      nombre: nombre.trim(),
      precioCompra: precioCompra ? Number(precioCompra) : undefined,
      precioVenta: Number(precioVenta),
      precioMayorista: precioMayorista ? Number(precioMayorista) : undefined,
      codigoBarras: codigoBarras || undefined,
      categoriaId: categoriaId || undefined,
      marcaId: marcaId || undefined,
    });
  };

  const handleDelete = () => {
    Alert.alert('Eliminar producto', '¿Seguro? Esta accion no se puede deshacer', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Producto</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        {/* Imagen */}
        <TouchableOpacity onPress={pickImage} style={s.imgSection}>
          {imagen ? (
            <Image source={{ uri: imagen }} style={s.imgPreview} />
          ) : (
            <View style={s.imgPlaceholder}>
              <Text style={{ fontSize: 28 }}>🖼</Text>
              <Text style={s.imgPlaceholderText}>Cambiar imagen</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.label}>Nombre *</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#9ca3af" />

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

        {pc > 0 && pv > 0 && (
          <View style={s.profitCard}>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>Precio sin IGV</Text>
              <Text style={s.profitValue}>S/ {pvSinIgv.toFixed(2)}</Text>
            </View>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>IGV (18%)</Text>
              <Text style={[s.profitValue, { color: '#f59e0b' }]}>S/ {igvMonto.toFixed(2)}</Text>
            </View>
            <View style={[s.profitRow, { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 6, marginTop: 2 }]}>
              <Text style={s.profitLabel}>Ganancia real</Text>
              <Text style={[s.profitValue, { color: gananciaReal > 0 ? '#16a34a' : '#dc2626', fontSize: 16 }]}>
                S/ {gananciaReal.toFixed(2)}
              </Text>
            </View>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>Margen real</Text>
              <View style={[s.margenBadge, { backgroundColor: Number(margenReal) > 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.margenText, { color: Number(margenReal) > 0 ? '#16a34a' : '#dc2626' }]}>{margenReal}%</Text>
              </View>
            </View>
          </View>
        )}

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Precio mayorista</Text>
            <TextInput style={s.input} value={precioMayorista} onChangeText={setPrecioMayorista} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Stock actual</Text>
            <TextInput style={[s.input, { backgroundColor: '#f3f4f6' }]} value={stock} editable={false} />
          </View>
        </View>

        {pc > 0 && pm > 0 && (
          <View style={[s.profitCard, { borderColor: '#f59e0b' }]}>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>Mayorista sin IGV</Text>
              <Text style={s.profitValue}>S/ {pmSinIgv.toFixed(2)}</Text>
            </View>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>Ganancia mayorista</Text>
              <Text style={[s.profitValue, { color: gananciaMayo > 0 ? '#16a34a' : '#dc2626', fontSize: 16 }]}>
                S/ {gananciaMayo.toFixed(2)}
              </Text>
            </View>
            <View style={s.profitRow}>
              <Text style={s.profitLabel}>Margen mayorista</Text>
              <View style={[s.margenBadge, { backgroundColor: Number(margenMayo) > 0 ? '#fef3c7' : '#fee2e2' }]}>
                <Text style={[s.margenText, { color: Number(margenMayo) > 0 ? '#d97706' : '#dc2626' }]}>{margenMayo}%</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={s.label}>Codigo de barras</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={codigoBarras}
            onChangeText={setCodigoBarras}
            placeholder="Escanear o escribir"
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}
            onPress={openScanner}
          >
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}</Text>
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
  imgSection: { alignItems: 'center', marginBottom: 16 },
  imgPreview: { width: 120, height: 120, borderRadius: 16 },
  imgPlaceholder: { width: 120, height: 120, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  imgPlaceholderText: { fontSize: 11, color: '#6b7280', marginTop: 4 },
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
  saveBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
