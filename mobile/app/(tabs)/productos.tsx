import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';

type Filter = 'all' | 'low' | 'out';

// stockMinimo viene del producto. Si no se configuro queda 0 → para esos
// usamos un umbral default razonable: 5 unidades.
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

  // Conteos por categoria de stock
  const counts = useMemo(() => {
    let ok = 0, low = 0, out = 0;
    productos.forEach((p: any) => {
      const stock = Number(p.variantes?.[0]?.stock ?? 0);
      const min = Number(p.variantes?.[0]?.stockMinimo ?? p.stockMinimo ?? 0);
      const st = getStockState(stock, min);
      if (st === 'ok') ok++;
      else if (st === 'low') low++;
      else out++;
    });
    return { ok, low, out };
  }, [productos]);

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
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar producto..." placeholderTextColor="#9ca3af" />
      </View>

      {/* Filtros por stock */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        <FilterPill
          label="Todos"
          count={productos.length}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterPill
          label="Stock bajo"
          count={counts.low}
          dotColor="#d97706"
          active={filter === 'low'}
          onPress={() => setFilter('low')}
        />
        <FilterPill
          label="Sin stock"
          count={counts.out}
          dotColor="#dc2626"
          active={filter === 'out'}
          onPress={() => setFilter('out')}
        />
        <FilterPill
          label="OK"
          count={counts.ok}
          dotColor="#16a34a"
          active={false}
          disabled
          onPress={() => {}}
        />
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
                {filter === 'out' ? '🚨' : filter === 'low' ? '⚠️' : '📦'}
              </Text>
              <Text style={s.emptyText}>
                {filter === 'out'
                  ? 'No hay productos sin stock'
                  : filter === 'low'
                  ? 'No hay productos con stock bajo'
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

function FilterPill({
  label,
  count,
  active,
  disabled,
  dotColor,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  dotColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.filterPill, active && s.filterPillActive, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      {dotColor && <View style={[s.filterDot, { backgroundColor: dotColor }]} />}
      <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
      <View style={[s.filterCount, active && s.filterCountActive]}>
        <Text style={[s.filterCountText, active && s.filterCountTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
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
  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: { height: 48, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },

  // Filtros
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterPillActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterDot: { width: 8, height: 8, borderRadius: 4 },
  filterText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterTextActive: { color: '#ffffff', fontWeight: '700' },
  filterCount: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  filterCountTextActive: { color: '#ffffff' },

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
