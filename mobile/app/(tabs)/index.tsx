// =============================================================================
// (tabs)/index.tsx — POS principal optimizado.
// Sin stagger en items, FlatList virtualizada, imagenes cacheadas, sin parpadeo
// al cambiar categoria (placeholderData).
// =============================================================================

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CircleAlert, Package, ScanLine, Search, ShoppingCart, WifiOff } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useNetworkStore } from '@/stores/network.store';
import { usePosStore } from '@/stores/pos.store';
import api from '@/api/client';
import { extractList, toastError, toastInfo } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Pill } from '@/components/ui/Pill';
import { colors, fonts, radius, shadows } from '@/theme';

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precioVenta: number;
  imagenPrincipal: string | null;
  categoria?: { nombre: string };
  variantes?: { id: string; stock: number; precioVenta: number }[];
}

const CARD_BLUR_HASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export default function POSScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, usuario } = useAuthStore();
  const { isOnline, pendingSales } = useNetworkStore();
  const addToCart = usePosStore((s) => s.addToCart);
  const count = usePosStore((s) => s.cart.length);
  const cartTotal = usePosStore((s) => s.cart.reduce((sum, i) => sum + i.precio * i.cantidad, 0));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [offlineProductos, setOfflineProductos] = useState<Producto[]>([]);
  const [offlineCategorias, setOfflineCategorias] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 220);
    return () => clearTimeout(t);
  }, [search]);

  const { data: prodData, error: prodError, isFetching } = useQuery({
    queryKey: ['productos', debouncedSearch, selectedCat],
    queryFn: async () => {
      const r = await api.get('/productos', {
        params: { search: debouncedSearch || undefined, categoriaId: selectedCat || undefined, activo: true, visiblePos: true, limit: 60 },
      });
      const list = extractList(r.data);
      if (list.length > 0 && !debouncedSearch && !selectedCat) {
        import('@/db/offline').then(({ cacheProductos }) => cacheProductos(list)).catch(() => {});
      }
      return r.data;
    },
    enabled: isAuthenticated && isOnline,
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
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
    staleTime: 5 * 60_000,
  });

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then((r) => r.data).catch(() => null),
    enabled: isAuthenticated && isOnline,
    staleTime: 60_000,
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
    if (prodError && isOnline) {
      const msg = (prodError as any)?.response?.data?.message ?? 'Verifica tu conexión';
      remoteLogger.error('productos_load_failed', prodError as any);
      toastError('Error cargando productos', msg);
    }
  }, [prodError, isOnline]);

  const handleAddToCart = useCallback(
    (prod: Producto) => {
      const v = prod.variantes?.[0];
      if (!v) {
        toastError('Sin stock', 'Este producto no tiene variantes');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addToCart({
        varianteId: v.id,
        productoId: prod.id,
        nombre: prod.nombre,
        imagen: prod.imagenPrincipal,
        precio: Number(v.precioVenta) || Number(prod.precioVenta),
        stock: v.stock,
      });
      toastInfo('Agregado', prod.nombre);
    },
    [addToCart]
  );

  const renderProduct = useCallback(
    ({ item }: { item: Producto }) => (
      <View style={{ flex: 1, marginBottom: 12 }}>
        <ProductCard product={item} onPress={handleAddToCart} />
      </View>
    ),
    [handleAddToCart]
  );

  const keyExtractor = useCallback((item: Producto) => item.id, []);

  if (!isLoading && !isAuthenticated) return <Redirect href="/login" />;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerEyebrow}>HOLA{usuario?.nombre ? `, ${usuario.nombre.split(' ')[0].toUpperCase()}` : ''}</Text>
          <Text style={s.headerTitle}>Punto de venta</Text>
        </View>
        <Pressable
          onPress={() => router.push(cajaData?.id ? '/caja/cerrar' : '/caja/abrir')}
          style={[s.cajaBadge, { backgroundColor: cajaData?.id ? colors.brandTint : colors.dangerSoft, borderColor: cajaData?.id ? colors.brandSoft : colors.dangerBorder }]}
        >
          <View style={[s.cajaDot, { backgroundColor: cajaData?.id ? colors.brand : colors.danger }]} />
          <Text style={[s.cajaText, { color: cajaData?.id ? colors.brandDark : colors.danger }]}>
            {cajaData?.id ? 'Caja abierta' : 'Sin caja'}
          </Text>
        </Pressable>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchInputWrap}>
          <Search color={colors.textSubtle} size={18} strokeWidth={2.2} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar producto…"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>
        <Pressable
          style={s.scanBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/scanner');
          }}
        >
          <ScanLine color={colors.brand} size={22} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
        <Pill label="Todos" active={!selectedCat} onPress={() => setSelectedCat(null)} />
        {categorias.map((cat: any) => (
          <Pill
            key={cat.id}
            label={cat.nombre}
            active={selectedCat === cat.id}
            onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
          />
        ))}
      </ScrollView>

      {!isOnline && <Banner icon={WifiOff} tone="danger" text="Modo offline · las ventas se sincronizarán al volver internet" />}
      {isOnline && pendingSales > 0 && (
        <Banner tone="info" text={`Sincronizando ${pendingSales} venta${pendingSales > 1 ? 's' : ''} pendiente${pendingSales > 1 ? 's' : ''}…`} />
      )}
      {!cajaData?.id && isOnline && (
        <Pressable onPress={() => router.push('/caja/abrir')}>
          <Banner icon={CircleAlert} tone="warning" text="Abre la caja para empezar a vender" />
        </Pressable>
      )}

      <FlatList
        data={productos}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={s.prodRow}
        contentContainerStyle={s.prodGrid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          !isFetching ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <Package color={colors.textSubtle} size={32} strokeWidth={2} />
              </View>
              <Text style={s.emptyText}>{search ? 'Sin resultados' : 'Aún no hay productos'}</Text>
            </View>
          ) : null
        }
      />

      {count > 0 && (
        <CartFab count={count} total={cartTotal} bottom={18 + Math.max(insets.bottom, 0)} onPress={() => router.push('/carrito')} />
      )}
    </View>
  );
}

const ProductCard = memo(function ProductCard({ product, onPress }: { product: Producto; onPress: (p: Producto) => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const price = useMemo(() => Number(product.precioVenta).toFixed(2), [product.precioVenta]);

  const handlePress = useCallback(() => onPress(product), [onPress, product]);
  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 90 });
  }, []);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 22, stiffness: 260, mass: 0.6 });
  }, []);

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[pc.card, animStyle]}>
        {product.imagenPrincipal ? (
          <Image
            source={{ uri: product.imagenPrincipal }}
            style={pc.img}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
            placeholder={CARD_BLUR_HASH}
          />
        ) : (
          <View style={[pc.img, pc.placeholder]}>
            <Text style={pc.placeholderInitial}>{product.nombre.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={pc.body}>
          <Text style={pc.name} numberOfLines={2}>
            {product.nombre}
          </Text>
          <Text style={pc.sku}>{product.sku}</Text>
          <View style={pc.row}>
            <Text style={pc.price}>S/ {price}</Text>
            <View style={pc.addBtn}>
              <Text style={pc.addBtnText}>+</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

function Banner({
  icon: Icon,
  tone,
  text,
}: {
  icon?: typeof CircleAlert;
  tone: 'warning' | 'danger' | 'info';
  text: string;
}) {
  const tones = {
    warning: { bg: colors.warningSoft, border: colors.warningBorder, color: colors.warningText },
    danger: { bg: colors.dangerSoft, border: colors.dangerBorder, color: colors.danger },
    info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
  } as const;
  const t = tones[tone];
  return (
    <Animated.View entering={FadeIn.duration(180)} style={[bn.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      {Icon && <Icon color={t.color} size={16} strokeWidth={2.2} />}
      <Text style={[bn.text, { color: t.color }]}>{text}</Text>
    </Animated.View>
  );
}

function CartFab({ count, total, bottom, onPress }: { count: number; total: number; bottom: number; onPress: () => void }) {
  const scale = useSharedValue(0.85);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 22, stiffness: 260, mass: 0.6 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[fab.wrap, { bottom }, animStyle]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={fab.btn}
      >
        <ShoppingCart color="#FFFFFF" size={22} strokeWidth={2.4} />
        <View style={fab.badge}>
          <Text style={fab.badgeText}>{count}</Text>
        </View>
        <Text style={fab.label}>{count} {count === 1 ? 'producto' : 'productos'}</Text>
        <View style={{ flex: 1 }} />
        <Text style={fab.total}>S/ {total.toFixed(2)}</Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, gap: 12 },
  headerEyebrow: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4 },
  headerTitle: { fontFamily: fonts.black, fontSize: 24, color: colors.text, letterSpacing: -0.4, marginTop: 2 },
  cajaBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, gap: 6 },
  cajaDot: { width: 7, height: 7, borderRadius: 4 },
  cajaText: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.2 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 14, gap: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 10,
    ...shadows.soft,
  },
  searchInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text, padding: 0, margin: 0 },
  scanBtn: {
    width: 50,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  catRow: { paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  prodGrid: { paddingHorizontal: 20, paddingBottom: 110 },
  prodRow: { gap: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 70 },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emptyText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
});

const pc = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider, ...shadows.soft },
  img: { width: '100%', height: 120, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandTint },
  placeholderInitial: { fontFamily: fonts.black, fontSize: 32, color: colors.brand },
  body: { padding: 12 },
  name: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.text, lineHeight: 18 },
  sku: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.textSubtle, marginTop: 3, letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontFamily: fonts.black, fontSize: 16, color: colors.brand, letterSpacing: -0.2 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addBtnText: { color: '#FFFFFF', fontFamily: fonts.black, fontSize: 18, lineHeight: 22, marginTop: -1 },
});

const bn = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, borderRadius: radius.md, padding: 12, borderWidth: 1 },
  text: { fontFamily: fonts.semibold, fontSize: 12.5, flex: 1 },
});

const fab = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20 },
  btn: {
    height: 60,
    backgroundColor: colors.brand,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: colors.brand,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginLeft: 10,
    marginRight: 10,
  },
  badgeText: { color: '#FFFFFF', fontFamily: fonts.black, fontSize: 12.5 },
  label: { color: 'rgba(255,255,255,0.92)', fontFamily: fonts.bold, fontSize: 13.5 },
  total: { color: '#FFFFFF', fontFamily: fonts.black, fontSize: 18, letterSpacing: -0.2 },
});
