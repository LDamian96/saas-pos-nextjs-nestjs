import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';

export default function ProductosScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['productos-list', search],
    queryFn: () => api.get('/productos', { params: { search: search || undefined, limit: 50, activo: true } }).then(r => r.data),
  });
  const productos = extractList(data);

  useEffect(() => {
    if (error) toastError('Error', 'No se pudieron cargar los productos');
  }, [error]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Productos</Text>
        <View style={s.headerRight}>
          <View style={s.badge}><Text style={s.badgeText}>{productos.length}</Text></View>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/productos/nuevo')} activeOpacity={0.7}>
            <Text style={s.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.searchWrap}>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar producto..." placeholderTextColor="#9ca3af" />
      </View>
      <FlatList data={productos} keyExtractor={i => i.id}
        onRefresh={refetch} refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => router.push(`/productos/${item.id}`)}>
            {item.imagenPrincipal ? (
              <Image source={{ uri: item.imagenPrincipal }} style={s.cardImg} />
            ) : (
              <View style={[s.cardImg, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 20, color: '#d1d5db' }}>{item.nombre?.charAt(0)}</Text>
              </View>
            )}
            <View style={s.cardInfo}>
              <Text style={s.cardName} numberOfLines={1}>{item.nombre}</Text>
              <Text style={s.cardSku}>{item.sku}</Text>
              <View style={s.cardBottom}>
                <Text style={s.cardPrice}>S/ {Number(item.precioVenta).toFixed(2)}</Text>
                <Text style={s.cardStock}>Stock: {item.variantes?.[0]?.stock ?? 0}</Text>
              </View>
            </View>
            <Text style={{ color: '#d1d5db', fontSize: 18, alignSelf: 'center' }}>›</Text>
          </TouchableOpacity>
        )} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { height: 48, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, paddingRight: 12 },
  cardImg: { width: 70, height: 70 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardSku: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#16a34a' },
  cardStock: { fontSize: 11, color: '#6b7280' },
});
