// =============================================================================
// (tabs)/index.tsx — POS principal: vender productos.
//   • FlashList 2 cols (10x más rápido que FlatList para catálogos grandes)
//   • Search debounce + filtro categorías + scanner
//   • Badge caja en header
//   • FAB carrito con count + total
//   • Animaciones Reanimated stagger
// =============================================================================

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  Bell,
  CircleDollarSign,
  Package,
  ScanLine,
  Search,
  ShoppingCart,
} from 'lucide-react-native';
import { Text } from 'tamagui';

import { useAuthStore } from '@/stores/auth.store';
import { useNetworkStore } from '@/stores/network.store';
import { usePosStore } from '@/stores/pos.store';
import api from '@/api/client';
import { extractList } from '@/api/helpers';
import { Pill } from '@/components/ui/Pill';
import { toastError, toastInfo } from '@/services/toast';
import { remoteLogger } from '@/services/remote-logger';

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
  const { isAuthenticated, isLoading, usuario } = useAuthStore();
  const { isOnline, pendingSales } = useNetworkStore();
  const { addToCart, itemCount, total } = usePosStore();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: prodData, error: prodError } = useQuery({
    queryKey: ['productos', debouncedSearch, selectedCat],
    queryFn: async () => {
      const r = await api.get('/productos', {
        params: {
          search: debouncedSearch || undefined,
          categoriaId: selectedCat || undefined,
          activo: true,
          visiblePos: true,
          limit: 100,
        },
      });
      return r.data;
    },
    enabled: isAuthenticated && isOnline,
    retry: false,
  });

  const { data: catData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then((r) => r.data),
    enabled: isAuthenticated && isOnline,
    retry: false,
  });

  const { data: cajaData } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () =>
      api
        .get('/caja/actual')
        .then((r) => r.data)
        .catch(() => null),
    enabled: isAuthenticated && isOnline,
  });

  const productos: Producto[] = extractList(prodData);
  const categorias = extractList(catData);

  useEffect(() => {
    if (prodError && isOnline) {
      const msg =
        (prodError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Verifica tu conexión';
      remoteLogger.error('productos_fetch_error', prodError, { msg });
      toastError({ title: 'Error cargando productos', message: msg });
    }
  }, [prodError, isOnline]);

  if (!isLoading && !isAuthenticated) return <Redirect href="/login" />;

  const handleAddToCart = (prod: Producto) => {
    const v = prod.variantes?.[0];
    if (!v) {
      toastError({ title: 'Sin stock', message: 'Producto sin variantes' });
      return;
    }
    addToCart({
      varianteId: v.id,
      productoId: prod.id,
      nombre: prod.nombre,
      imagen: prod.imagenPrincipal,
      precio: Number(v.precioVenta) || Number(prod.precioVenta),
      stock: v.stock,
    });
    toastInfo({ title: 'Agregado', message: prod.nombre });
  };

  const count = itemCount();
  const cartTotal = total();
  const cajaAbierta = !!cajaData?.id;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─────────────────────────────── */}
      <Animated.View entering={FadeIn.duration(220)} style={s.header}>
        <View style={{ flex: 1 }}>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted" fontWeight="600">
            {greet()},
          </Text>
          <Text
            fontFamily="$body"
            fontSize={20}
            color="$color"
            fontWeight="800"
            letterSpacing={-0.3}
            numberOfLines={1}
          >
            {usuario?.nombre ?? 'Bienvenido'}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push(cajaAbierta ? '/caja/cerrar' : '/caja/abrir')}
          style={[s.cajaBadge, cajaAbierta ? s.cajaOpen : s.cajaClosed]}
        >
          <View
            style={[s.cajaDot, { backgroundColor: cajaAbierta ? '#00932C' : '#E53935' }]}
          />
          <Text
            fontFamily="$body"
            fontSize={12}
            fontWeight="700"
            color={cajaAbierta ? '#00932C' : '#E53935'}
          >
            {cajaAbierta ? 'Caja abierta' : 'Sin caja'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/ventas')}
          style={s.bellBtn}
          hitSlop={8}
        >
          <Bell color="#0C0C0C" size={18} strokeWidth={2.2} />
          {pendingSales > 0 && (
            <View style={s.bellDot}>
              <Text fontFamily="$body" color="#FFFFFF" fontSize={9} fontWeight="800">
                {pendingSales}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* ─── Search + Scanner ───────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(240).easing(Easing.out(Easing.cubic))}
        style={s.searchRow}
      >
        <View style={s.searchWrap}>
          <Search color="#8A938D" size={18} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar producto..."
            placeholderTextColor="#A8B0AB"
          />
        </View>
        <Pressable onPress={() => router.push('/scanner')} style={s.scanBtn}>
          <ScanLine color="#0C0C0C" size={20} strokeWidth={2.2} />
        </Pressable>
      </Animated.View>

      {/* ─── Categorías ─────────────────────────── */}
      <Animated.View entering={FadeIn.delay(140).duration(220)} style={{ marginBottom: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
        >
          <Pill label="Todos" active={!selectedCat} onPress={() => setSelectedCat(null)} />
          {categorias.map((c: { id: string; nombre: string }) => (
            <Pill
              key={c.id}
              label={c.nombre}
              active={selectedCat === c.id}
              onPress={() => setSelectedCat(selectedCat === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* ─── Banner sin caja ────────────────────── */}
      {!cajaAbierta && isOnline && (
        <Animated.View
          entering={FadeInDown.duration(240).easing(Easing.out(Easing.cubic))}
          style={s.noCaja}
        >
          <AlertTriangle color="#B45309" size={18} strokeWidth={2.2} />
          <Text
            fontFamily="$body"
            color="#B45309"
            fontSize={13}
            fontWeight="700"
            marginLeft={8}
            flex={1}
          >
            Abre la caja para empezar a vender
          </Text>
          <Pressable onPress={() => router.push('/caja/abrir')}>
            <Text fontFamily="$body" color="#B45309" fontWeight="800" fontSize={13}>
              Abrir
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ─── Grid de productos ──────────────────── */}
      <View style={{ flex: 1 }}>
        <FlashList
          data={productos}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          estimatedItemSize={220}
          renderItem={({ item, index }) => (
            <ProductoCard producto={item} index={index} onPress={() => handleAddToCart(item)} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Package color="#A8B0AB" size={48} strokeWidth={1.6} />
              <Text fontFamily="$body" color="$colorMuted" marginTop={12} fontWeight="600">
                {search ? 'Sin resultados' : 'No hay productos'}
              </Text>
            </View>
          }
        />
      </View>

      {/* ─── FAB Carrito ────────────────────────── */}
      {count > 0 && (
        <CartFab
          count={count}
          total={cartTotal}
          bottom={18 + Math.max(insets.bottom, 0)}
          onPress={() => router.push('/carrito')}
        />
      )}
    </View>
  );
}

// =============================================================================
// Sub-componentes
// =============================================================================

function ProductoCard({
  producto,
  index,
  onPress,
}: {
  producto: Producto;
  index: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.97, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
      style={s.cardWrap}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 30)
          .duration(220)
          .easing(Easing.out(Easing.cubic))}
        style={[s.card, animStyle]}
      >
        {producto.imagenPrincipal ? (
          <Image source={{ uri: producto.imagenPrincipal }} style={s.cardImg} contentFit="cover" />
        ) : (
          <View style={[s.cardImg, s.cardImgPlaceholder]}>
            <Text fontFamily="$body" fontSize={28} fontWeight="800" color="#00932C">
              {producto.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={s.cardInfo}>
          <Text
            fontFamily="$body"
            fontSize={13.5}
            fontWeight="700"
            color="$color"
            numberOfLines={2}
            lineHeight={18}
          >
            {producto.nombre}
          </Text>
          <Text fontFamily="$body" fontSize={11} color="$colorSubtle" fontWeight="600" marginTop={2}>
            {producto.sku}
          </Text>
          <Text
            fontFamily="$body"
            fontSize={17}
            fontWeight="900"
            color="#00932C"
            marginTop={6}
            letterSpacing={-0.2}
          >
            S/ {Number(producto.precioVenta).toFixed(2)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CartFab({
  count,
  total,
  bottom,
  onPress,
}: {
  count: number;
  total: number;
  bottom: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[s.fab, { bottom }, animStyle]}>
      <Pressable onPress={onPress} style={s.fabInner}>
        <ShoppingCart color="#FFFFFF" size={22} strokeWidth={2.4} />
        <View style={s.fabBadge}>
          <Text fontFamily="$body" color="#FFFFFF" fontSize={12} fontWeight="900">
            {count}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text fontFamily="$body" color="#FFFFFF" fontSize={18} fontWeight="900">
          S/ {total.toFixed(2)}
        </Text>
        <CircleDollarSign color="#FFFFFF" size={18} strokeWidth={2.2} style={{ marginLeft: 6 }} />
      </Pressable>
    </Animated.View>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// =============================================================================
// Styles
// =============================================================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 10,
  },

  cajaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.2,
    gap: 6,
  },
  cajaOpen: { backgroundColor: '#EBF7EF', borderColor: '#CCE9D5' },
  cajaClosed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cajaDot: { width: 6, height: 6, borderRadius: 4 },

  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF0EF',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E53935',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F7F8FA',
  },

  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EEF0EF',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: '#0C0C0C',
    padding: 0,
  },
  scanBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEF0EF',
  },

  pillsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },

  noCaja: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  grid: { paddingHorizontal: 12, paddingBottom: 120 },
  cardWrap: { padding: 4, width: '50%' },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF0EF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardImg: { width: '100%', height: 110, backgroundColor: '#F1F3F2' },
  cardImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EC',
  },
  cardInfo: { padding: 12 },

  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 60,
    backgroundColor: '#00932C',
    borderRadius: 20,
    shadowColor: '#00932C',
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  fabBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 2,
    marginLeft: 10,
  },

  empty: { alignItems: 'center', marginTop: 60 },
});
