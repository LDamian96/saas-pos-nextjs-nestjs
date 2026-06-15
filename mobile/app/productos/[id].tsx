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
import { useAuthStore } from '@/stores/auth.store';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function EditarProductoScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { scannedCode, setScannedCode, setScannerMode } = usePosStore();
  const usuario = useAuthStore(s => s.usuario);
  const sucursalId = usuario?.sucursal?.id;
  const [nombre, setNombre] = useState('');
  const [precioCompra, setPrecioCompra] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [stockOriginal, setStockOriginal] = useState(0); // para detectar cambios
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [stockMinimo, setStockMinimo] = useState('5');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [marcaId, setMarcaId] = useState<string | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);
  const [newImagen, setNewImagen] = useState<string | null>(null);

  // Config IGV de la empresa (aplicaImpuesto)
  const { data: empresaCfgData } = useQuery({
    queryKey: ['empresa-config'],
    queryFn: () => api.get('/empresas/me/config').then(r => r.data),
    staleTime: 5 * 60_000,
  });
  const cfg = empresaCfgData?.data || empresaCfgData || {};
  const aplicaIgv = cfg.aplicaImpuesto !== false; // default true
  const igvPct = Number(cfg.porcentajeImpuesto || 18);
  const igvName = cfg.nombreImpuesto || 'IGV';

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
      const stockActual = Number(prod.variantes?.[0]?.stock ?? 0);
      setStock(stockActual.toString());
      setStockOriginal(stockActual);
      setVarianteId(prod.variantes?.[0]?.id || null);
      setStockMinimo((prod.variantes?.[0]?.stockMinimo ?? prod.stockMinimo ?? 5)?.toString() || '5');
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

  // Calcular ganancias. Si la empresa aplica IGV (aplicaImpuesto=true), el
  // precio de venta INCLUYE el impuesto que despues se paga a SUNAT.
  // - Ganancia REAL = lo que te queda despues de pagar SUNAT
  // - Total cobrado bruto = lo que entra a tu caja (incluye IGV que NO es tuyo)
  const IGV_FACTOR = 1 + igvPct / 100;
  const pc = Number(precioCompra) || 0;
  const pv = Number(precioVenta) || 0;
  const pvSinIgv = aplicaIgv ? pv / IGV_FACTOR : pv;
  const igvMonto = aplicaIgv && pv > 0 ? pv - pvSinIgv : 0;
  // Ganancia REAL: lo que queda despues de pagar SUNAT
  const gananciaReal = pc > 0 && pv > 0 ? pvSinIgv - pc : 0;
  const margenReal = pc > 0 && pv > 0 ? ((gananciaReal / pc) * 100).toFixed(1) : null;
  // Total bruto cobrado (= venta - compra). Cuando aplicaIgv, esto incluye
  // los soles que debes pagar a SUNAT.
  const gananciaBruta = pc > 0 && pv > 0 ? pv - pc : 0;
  const margenBruto = pc > 0 && pv > 0 ? ((gananciaBruta / pc) * 100).toFixed(1) : null;

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

  // Ajustar stock cuando el usuario cambia el valor en el form.
  // Endpoint POST /inventario/ajuste recibe { sucursalId, detalles: [{varianteId, stockNuevo}] }
  const ajustarStockMutation = useMutation({
    mutationFn: (body: any) => api.post('/inventario/ajuste', body).then(r => r.data),
    onError: (err: any) => toastError('Error ajustando stock', getErrorMessage(err)),
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

  const handleSave = async () => {
    if (!nombre.trim()) { toastError('Campo requerido', 'El nombre es obligatorio'); return; }
    if (!precioVenta) { toastError('Campo requerido', 'El precio de venta es obligatorio'); return; }

    // Si el stock cambio, ajustar inventario PRIMERO (asi si falla, no perdemos datos)
    const stockNuevo = Number(stock) || 0;
    if (varianteId && sucursalId && stockNuevo !== stockOriginal) {
      try {
        await ajustarStockMutation.mutateAsync({
          sucursalId,
          notas: 'Ajuste manual desde app movil',
          detalles: [{ varianteId, stockNuevo }],
        });
      } catch {
        return; // ya mostro toast el onError
      }
    }

    updateMutation.mutate({
      nombre: nombre.trim(),
      precioCompra: precioCompra ? Number(precioCompra) : undefined,
      precioVenta: Number(precioVenta),
      stockMinimo: stockMinimo ? Number(stockMinimo) : 5,
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

        <View style={s.row}>
          <View style={s.half}>
            <Text style={s.label}>Stock actual</Text>
            <TextInput
              style={s.input}
              value={stock}
              onChangeText={setStock}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>
          <View style={s.half}>
            <Text style={s.label}>Stock minimo (alerta)</Text>
            <TextInput style={s.input} value={stockMinimo} onChangeText={setStockMinimo} placeholder="5" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
          </View>
        </View>
        <Text style={s.hint}>
          {Number(stock) !== stockOriginal
            ? `↻ Stock cambia de ${stockOriginal} a ${stock} (se ajustara al guardar)`
            : `Alerta roja cuando stock <= minimo`}
        </Text>

        {pc > 0 && pv > 0 && (() => {
          // UNA sola card "Ganancia". Si aplicaIgv => pv/IGV_FACTOR - pc; si no => pv - pc.
          const ganancia = aplicaIgv ? gananciaReal : gananciaBruta;
          const margen = aplicaIgv ? margenReal : margenBruto;
          const positivo = ganancia > 0;
          return (
            <View style={[s.gainCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 10 }]}>
              <Text style={s.gainTag}>GANANCIA</Text>
              <Text style={[s.gainValue, { color: positivo ? '#16a34a' : '#dc2626', fontSize: 22 }]}>
                S/ {ganancia.toFixed(2)}
              </Text>
              <View style={[s.margenBadge, { backgroundColor: positivo ? '#dcfce7' : '#fee2e2', alignSelf: 'flex-start', marginTop: 6 }]}>
                <Text style={[s.margenText, { color: positivo ? '#16a34a' : '#dc2626' }]}>{margen}% de margen</Text>
              </View>
              <Text style={s.gainHint}>
                {aplicaIgv
                  ? `Precio sin ${igvName} (S/ ${pvSinIgv.toFixed(2)}) - Precio compra`
                  : 'Precio venta - Precio compra'}
              </Text>
            </View>
          );
        })()}

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

  gainRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  gainCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5 },
  gainTag: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 1, marginBottom: 6 },
  gainValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  gainHint: { fontSize: 11, color: '#9ca3af', marginTop: 8, fontWeight: '500' },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4, fontWeight: '500', fontStyle: 'italic' },
});
