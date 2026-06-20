import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useNetworkStore } from '@/stores/network.store';
import { usePosStore } from '@/stores/pos.store';
import api from '@/api/client';
import { extractList, toastError, toastInfo, toastSuccess } from '@/api/helpers';
import { downloadCatalog } from '@/services/sync.service';

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precioVenta: number;
  imagenPrincipal: string | null;
  categoria?: { nombre: string };
  variantes?: { id: string; stock: number; precioVenta: number }[];
}

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isOnline, pendingSales } = useNetworkStore();
  const { addToCart, itemCount, total, cart } = usePosStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [offlineProductos, setOfflineProductos] = useState<Producto[]>([]);
  const [offlineCategorias, setOfflineCategorias] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: prodData, error: prodError } = useQuery({
    queryKey: ['productos', debouncedSearch, selectedCat],
    queryFn: async () => {
      const r = await api.get('/productos', { params: { search: debouncedSearch || undefined, categoriaId: selectedCat || undefined, activo: true, visiblePos: true, limit: 100 } });
      const list = extractList(r.data);
      if (list.length > 0 && !debouncedSearch && !selectedCat) {
        import('@/db/offline').then(({ cacheProductos }) => cacheProductos(list)).catch(() => {});
      }
      return r.data;
    },
    enabled: isAuthenticated && isOnline,
    retry: false,
  });

  const { data: catData } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const r = await api.get('/categorias');
      const list = extractList(r.data);
      if (list.length > 0) import('@/db/offline').then(({ cacheCategorias }) => cacheCategorias(list)).catch(() => {});
      return r.data;
    },
    enabled: isAuthenticated && isOnline,
    retry: false,
  });

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then(r => r.data).catch(() => null),
    enabled: isAuthenticated && isOnline,
  });

  useEffect(() => {
    if (!isOnline && isAuthenticated) {
      import('@/db/offline').then(({ getProductosFromCache, getCategoriasFromCache }) => {
        getProductosFromCache(debouncedSearch || undefined, selectedCat).then(setOfflineProductos);
        getCategoriasFromCache().then(setOfflineCategorias);
      });
    }
  }, [isOnline, isAuthenticated, debouncedSearch, selectedCat]);

  const productos: Producto[] = isOnline ? extractList(prodData) : offlineProductos;
  const categorias = isOnline ? extractList(catData) : offlineCategorias;

  useEffect(() => {
    if (prodError && isOnline) toastError('Error cargando productos', (prodError as any)?.response?.data?.message || 'Verifica tu conexion');
  }, [prodError, isOnline]);

  if (!isLoading && !isAuthenticated) return <Redirect href="/login" />;

  const handleAddToCart = (prod: Producto) => {
    const v = prod.variantes?.[0];
    if (!v) { toastError('Sin stock', 'Este producto no tiene variantes'); return; }
    addToCart({
      varianteId: v.id, productoId: prod.id, nombre: prod.nombre,
      imagen: prod.imagenPrincipal,
      precio: Number(v.precioVenta) || Number(prod.precioVenta), stock: v.stock,
    });
    toastInfo('Agregado', `${prod.nombre} al carrito`);
  };

  const count = itemCount();
  const cartTotal = total();

  const renderProduct = ({ item }: { item: Producto }) => (
    <TouchableOpacity style={s.prodCard} onPress={() => handleAddToCart(item)} activeOpacity={0.7}>
      {item.imagenPrincipal ? (
        <Image source={{ uri: item.imagenPrincipal }} style={s.prodImg} />
      ) : (
        <View style={[s.prodImg, s.prodPlaceholder]}>
          <Text style={s.prodInitial}>{item.nombre.charAt(0)}</Text>
        </View>
      )}
      <View style={s.prodInfo}>
        <Text style={s.prodName} numberOfLines={2}>{item.nombre}</Text>
        <Text style={s.prodSku}>{item.sku}</Text>
        <Text style={s.prodPrice}>S/ {Number(item.precioVenta).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Punto de Venta</Text>
        </View>
        <TouchableOpacity
          style={[s.cajaBadge, cajaData?.id ? s.cajaBadgeOpen : s.cajaBadgeClosed]}
          onPress={() => cajaData?.id ? router.push('/caja/cerrar') : router.push('/caja/abrir')}
          activeOpacity={0.7}
        >
          <View style={[s.cajaDot, { backgroundColor: cajaData?.id ? '#16a34a' : '#dc2626' }]} />
          <Text style={[s.cajaBadgeText, { color: cajaData?.id ? '#16a34a' : '#dc2626' }]}>
            {cajaData?.id ? 'Caja abierta' : 'Sin caja'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search + Scanner */}
      <View style={s.searchRow}>
        <View style={s.searchInputWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar producto..."
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity style={s.scanBtn} onPress={() => router.push('/scanner')} activeOpacity={0.7}>
          <Text style={{ fontSize: 22 }}>📷</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catScrollContent}>
        <TouchableOpacity
          style={[s.catPill, !selectedCat && s.catPillActive]}
          onPress={() => setSelectedCat(null)}
          activeOpacity={0.7}
        >
          <Text style={[s.catText, !selectedCat && s.catTextActive]}>Todos</Text>
        </TouchableOpacity>
        {categorias.map((cat: any) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catPill, selectedCat === cat.id && s.catPillActive]}
            onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.catText, selectedCat === cat.id && s.catTextActive]}>{cat.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Offline banner */}
      {!isOnline && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineBannerText}>📡 Modo offline — Las ventas se sincronizaran al volver internet</Text>
        </View>
      )}

      {/* Pending sync */}
      {isOnline && pendingSales > 0 && (
        <View style={s.pendingBanner}>
          <Text style={s.pendingBannerText}>🔄 Sincronizando {pendingSales} venta{pendingSales > 1 ? 's' : ''} pendiente{pendingSales > 1 ? 's' : ''}...</Text>
        </View>
      )}

      {/* No caja warning */}
      {!cajaData?.id && isOnline && (
        <TouchableOpacity style={s.noCajaWarn} onPress={() => router.push('/caja/abrir')} activeOpacity={0.8}>
          <Text style={s.noCajaText}>⚠  Abre la caja para empezar a vender</Text>
        </TouchableOpacity>
      )}

      {/* Products Grid */}
      <FlatList
        data={productos}
        renderItem={renderProduct}
        keyExtractor={i => i.id}
        numColumns={2}
        contentContainerStyle={s.prodGrid}
        columnWrapperStyle={s.prodRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
              <Text style={{ fontSize: 36 }}>📦</Text>
            </View>
            <Text style={s.emptyText}>{search ? 'Sin resultados' : 'No hay productos'}</Text>
          </View>
        }
      />

      {/* Cart FAB bar */}
      {count > 0 && (
        <TouchableOpacity
          style={[s.cartFab, { bottom: 18 + Math.max(insets.bottom, 0) }]}
          onPress={() => router.push('/carrito')}
          activeOpacity={0.9}
        >
          <Text style={s.cartFabEmoji}>🛒</Text>
          <View style={s.cartFabCountWrap}>
            <Text style={s.cartFabCount}>{count}</Text>
          </View>
          <Text style={s.cartFabLabel}>{count} {count === 1 ? 'item' : 'items'}</Text>
          <View style={{ flex: 1 }} />
          <Text style={s.cartFabTotal}>S/ {cartTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  cajaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  cajaBadgeOpen: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  cajaBadgeClosed: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  cajaDot: { width: 7, height: 7, borderRadius: 4 },
  cajaBadgeText: { fontSize: 12, fontWeight: '600' },

  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 8, marginBottom: 12, gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a', fontWeight: '500' },
  scanBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Categories
  catScroll: { height: 48, minHeight: 48, maxHeight: 48, marginBottom: 10 },
  catScrollContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    height: 38,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catPillActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  catText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  catTextActive: { color: '#ffffff', fontWeight: '700' },

  // Banners
  noCajaWarn: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noCajaText: { color: '#92400e', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  offlineBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  offlineBannerText: { color: '#b91c1c', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  pendingBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pendingBannerText: { color: '#1e40af', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Products grid
  prodGrid: { paddingHorizontal: 20, paddingBottom: 100 },
  prodRow: { gap: 12 },
  prodCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  prodImg: { width: '100%', height: 110, backgroundColor: '#f1f5f9' },
  prodPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ede9fe' },
  prodInitial: { fontSize: 30, fontWeight: '700', color: '#7c3aed' },
  prodInfo: { padding: 12 },
  prodName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3, lineHeight: 19 },
  prodSku: { fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: '500' },
  prodPrice: { fontSize: 17, fontWeight: '800', color: '#16a34a' },

  // Cart FAB
  cartFab: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 58,
    backgroundColor: '#7c3aed',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  cartFabEmoji: { fontSize: 20, marginRight: 8 },
  cartFabCountWrap: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  cartFabCount: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  cartFabLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  cartFabTotal: { color: '#ffffff', fontSize: 18, fontWeight: '800' },

  // Empty
  emptyWrap: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyText: { fontSize: 15, color: '#94a3b8', fontWeight: '500' },
});
