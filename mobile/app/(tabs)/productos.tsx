// =============================================================================
// (tabs)/productos.tsx — Listado de productos con búsqueda y FAB +.
// =============================================================================

import { memo, useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Package, Plus, Search } from 'lucide-react-native';

import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { colors, fonts, radius, shadows } from '@/theme';

const CARD_BLUR_HASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

export default function ProductosScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 220);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['productos-list', debounced],
    queryFn: () =>
      api.get('/productos', { params: { search: debounced || undefined, limit: 50, activo: true } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const productos = extractList(data);

  useEffect(() => {
    if (error) {
      remoteLogger.error('productos_list_failed', error as any);
      toastError('Error', 'No se pudieron cargar los productos');
    }
  }, [error]);

  const handleOpenProduct = useCallback((id: string) => {
    Haptics.selectionAsync();
    router.push(`/productos/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => <ProductRow item={item} onPress={handleOpenProduct} />,
    [handleOpenProduct]
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>CATÁLOGO</Text>
          <Text style={s.title}>Productos</Text>
        </View>
        <View style={s.countPill}>
          <Text style={s.countPillText}>{productos.length}</Text>
        </View>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchWrap}>
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
          style={s.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/productos/nuevo');
          }}
        >
          <Plus color="#FFFFFF" size={22} strokeWidth={2.6} />
        </Pressable>
      </View>

      <FlatList
        data={productos}
        keyExtractor={keyExtractor}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Package color={colors.textSubtle} size={30} strokeWidth={2} />
              </View>
              <Text style={s.emptyText}>{search ? 'Sin resultados' : 'Aún no hay productos'}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const ProductRow = memo(function ProductRow({
  item,
  onPress,
}: {
  item: any;
  onPress: (id: string) => void;
}) {
  const handle = useCallback(() => onPress(item.id), [item.id, onPress]);
  return (
    <Pressable onPress={handle} style={({ pressed }) => [s.card, { opacity: pressed ? 0.82 : 1 }]}>
      {item.imagenPrincipal ? (
        <Image
          source={{ uri: item.imagenPrincipal }}
          style={s.cardImg}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={100}
          placeholder={CARD_BLUR_HASH}
        />
      ) : (
        <View style={[s.cardImg, s.placeholder]}>
          <Text style={s.placeholderInitial}>{(item.nombre || '?').charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={s.cardInfo}>
        <Text style={s.cardName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={s.cardSku}>{item.sku}</Text>
        <View style={s.cardRow}>
          <Text style={s.cardPrice}>S/ {Number(item.precioVenta).toFixed(2)}</Text>
          <View style={s.stockChip}>
            <Text style={s.stockText}>{item.variantes?.[0]?.stock ?? 0} u</Text>
          </View>
        </View>
      </View>
      <ChevronRight color={colors.textSubtle} size={18} strokeWidth={2.2} />
    </Pressable>
  );
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, gap: 10 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4 },
  title: { fontFamily: fonts.black, fontSize: 24, color: colors.text, letterSpacing: -0.4, marginTop: 2 },
  countPill: {
    backgroundColor: colors.brandTint,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  countPillText: { color: colors.brandDark, fontFamily: fonts.extrabold, fontSize: 13 },

  searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 14, gap: 10 },
  searchWrap: {
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
  searchInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 14.5, color: colors.text, padding: 0 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 10,
    paddingRight: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  cardImg: { width: 78, height: 78, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandTint },
  placeholderInitial: { fontFamily: fonts.black, fontSize: 26, color: colors.brand },
  cardInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  cardName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  cardSku: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textSubtle, marginTop: 2, letterSpacing: 0.3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  cardPrice: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.brand },
  stockChip: {
    backgroundColor: colors.brandTint,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stockText: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.brandDark, letterSpacing: 0.2 },

  emptyWrap: { alignItems: 'center', marginTop: 70 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emptyText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
});
