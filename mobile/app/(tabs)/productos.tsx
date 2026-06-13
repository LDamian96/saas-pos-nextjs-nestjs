// =============================================================================
// (tabs)/productos.tsx — Lista de productos con búsqueda + FAB nuevo.
// =============================================================================

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlatList } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ChevronRight, Package2, Plus, Search } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import api from '@/api/client';
import { extractList } from '@/api/helpers';

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precioVenta: number;
  imagenPrincipal: string | null;
  variantes?: { stock: number }[];
}

export default function ProductosScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data } = useQuery({
    queryKey: ['productos', 'list', debouncedSearch],
    queryFn: () =>
      api
        .get('/productos', {
          params: { search: debouncedSearch || undefined, activo: true, limit: 200 },
        })
        .then((r) => r.data),
  });

  const productos: Producto[] = extractList(data);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(220)} style={s.header}>
        <View style={{ flex: 1 }}>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted" fontWeight="600">
            Mi catálogo
          </Text>
          <Text fontFamily="$body" fontSize={22} fontWeight="900" color="$color" letterSpacing={-0.4}>
            Productos
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/productos/nuevo')}
          style={s.addBtn}
        >
          <Plus color="#FFFFFF" size={20} strokeWidth={2.4} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(240)} style={s.searchWrap}>
        <Search color="#8A938D" size={18} strokeWidth={2} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o SKU"
          placeholderTextColor="#A8B0AB"
        />
      </Animated.View>

      <FlatList
        data={productos}
        keyExtractor={(item) => item.id}
        
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item, index }) => <Row producto={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Package2 color="#A8B0AB" size={48} strokeWidth={1.6} />
            <Text fontFamily="$body" color="$colorMuted" marginTop={12} fontWeight="600">
              {search ? 'Sin resultados' : 'Sin productos'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function Row({ producto, index }: { producto: Producto; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const totalStock = (producto.variantes ?? []).reduce((acc, v) => acc + Number(v.stock ?? 0), 0);

  return (
    <Pressable
      onPress={() => router.push(`/productos/${producto.id}`)}
      onPressIn={() => (scale.value = withSpring(0.98, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 24).duration(220).easing(Easing.out(Easing.cubic))}
        style={[s.row, animStyle]}
      >
        {producto.imagenPrincipal ? (
          <Image source={{ uri: producto.imagenPrincipal }} style={s.rowImg} contentFit="cover" />
        ) : (
          <View style={[s.rowImg, s.rowImgPlaceholder]}>
            <Text fontFamily="$body" fontSize={20} fontWeight="800" color="#00932C">
              {producto.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text fontFamily="$body" fontSize={14} fontWeight="700" color="$color" numberOfLines={1}>
            {producto.nombre}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" fontWeight="600" marginTop={2}>
            SKU · {producto.sku} · Stock {totalStock}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text fontFamily="$body" fontSize={15} fontWeight="900" color="#00932C">
            S/ {Number(producto.precioVenta).toFixed(2)}
          </Text>
          <ChevronRight color="#A8B0AB" size={14} strokeWidth={2.2} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#00932C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00932C',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EEF0EF',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Mulish_600SemiBold',
    fontSize: 15,
    color: '#0C0C0C',
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0EF',
  },
  rowImg: { width: 60, height: 60, borderRadius: 14 },
  rowImgPlaceholder: { backgroundColor: '#E8F5EC', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
});
