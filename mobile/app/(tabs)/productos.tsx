import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';

type Filter = 'all' | 'low' | 'out' | 'ok';

// Si el producto no tiene stockMinimo configurado, usamos 5 como default razonable
const DEFAULT_MIN = 5;

function getStockState(stock: number, min: number) {
  const minimo = min > 0 ? min : DEFAULT_MIN;
  if (stock <= 0) return 'out' as const;
  if (stock <= minimo) return 'low' as const;
  return 'ok' as const;
}

function getStockColors(state: 'ok' | 'low' | 'out') {
  if (state === 'out') return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
  if (state === 'low') return { bg: '#fffbeb', border: '#fde68a', text: '#d97706' };
  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
}

export default function ProductosScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['productos-list', search],
    queryFn: () => api.get('/productos', { params: { search: search || undefined, limit: 100, activo: true } }).then(r => r.data),
  });
  const productos = extractList(data);

  useEffect(() => {
    if (error) toastError('Error', 'No se pudieron cargar los productos');
  }, [error]);

  // Filtrar segun estado de stock
  const productosFiltrados = useMemo(() => {
    if (filter === 'all') return productos;
    return productos.filter((p: any) => {
      const stock = Number(p.variantes?.[0]?.stock ?? 0);
      const min = Number(p.variantes?.[0]?.stockMinimo ?? p.stockMinimo ?? 0);
      const state = getStockState(stock, min);
      return state === filter;
    });
  }, [productos, filter]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Productos</Text>
        <View style={s.headerRight}>
          <View style={s.badge}><Text style={s.badgeText}>{productosFiltrados.length}</Text></View>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/productos/nuevo')} activeOpacity={0.7}>
            <Text style={s.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar producto..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filtros de stock (mismo estilo que las categorias del POS) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
        <TouchableOpacity
          style={[s.catPill, filter === 'all' && s.catPillActive]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[s.catText, filter === 'all' && s.catTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.catPill, filter === 'ok' && s.catPillActiveOk]}
          onPress={() => setFilter('ok')}
          activeOpacity={0.7}
        >
          <View style={[s.catDot, { backgroundColor: '#16a34a' }]} />
          <Text style={[s.catText, filter === 'ok' && s.catTextActiveColor]}>Stock alto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.catPill, filter === 'low' && s.catPillActiveLow]}
          onPress={() => setFilter('low')}
          activeOpacity={0.7}
        >
          <View style={[s.catDot, { backgroundColor: '#d97706' }]} />
          <Text style={[s.catText, filter === 'low' && s.catTextActiveColor]}>Stock bajo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.catPill, filter === 'out' && s.catPillActiveOut]}
          onPress={() => setFilter('out')}
          activeOpacity={0.7}
        >
          <View style={[s.catDot, { backgroundColor: '#dc2626' }]} />
          <Text style={[s.catText, filter === 'out' && s.catTextActiveColor]}>Sin stock</Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={productosFiltrados}
        keyExtractor={i => i.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>
                {filter === 'out' ? '🚨' : filter === 'low' ? '⚠️' : filter === 'ok' ? '✅' : '📦'}
              </Text>
              <Text style={s.emptyText}>
                {filter === 'out'
                  ? 'No hay productos sin stock'
                  : filter === 'low'
                  ? 'No hay productos con stock bajo'
                  : filter === 'ok'
                  ? 'No hay productos con stock alto'
                  : search
                  ? 'Sin resultados'
                  : 'Aun no hay productos'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const stock = Number(item.variantes?.[0]?.stock ?? 0);
          const minimo = Number(item.variantes?.[0]?.stockMinimo ?? item.stockMinimo ?? 0);
          const state = getStockState(stock, minimo);
          const colors = getStockColors(state);
          return (
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
                  <View style={[s.stockChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <View style={[s.stockDot, { backgroundColor: colors.text }]} />
                    <Text style={[s.stockText, { color: colors.text }]}>
                      {state === 'out' ? 'Sin stock' : `${stock} u`}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ color: '#d1d5db', fontSize: 18, alignSelf: 'center' }}>›</Text>
            </TouchableOpacity>
          );
        }}
      />
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

  // Filtros usando MISMO estilo que las categorias del POS (catScroll/catPill/catText)
  catScroll: { height: 48, minHeight: 48, maxHeight: 48, marginBottom: 10 },
  catScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    height: 38,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catPillActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  catPillActiveOk: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catPillActiveLow: { backgroundColor: '#d97706', borderColor: '#d97706' },
  catPillActiveOut: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  catTextActive: { color: '#ffffff', fontWeight: '700' },
  catTextActiveColor: { color: '#ffffff', fontWeight: '700' },

  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, paddingRight: 12 },
  cardImg: { width: 70, height: 70 },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardSku: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8 },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#16a34a' },

  // Chip de stock con color segun estado
  stockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});
