import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePosStore, type CartItem } from '@/stores/pos.store';

export default function CarritoScreen() {
  const insets = useSafeAreaInsets();
  const { cart, updateQuantity, removeFromCart, total, itemCount, clearCart } = usePosStore();
  const cartTotal = total();
  const count = itemCount();

  const renderItem = ({ item }: { item: CartItem }) => {
    const subtotal = item.precio * item.cantidad;
    const reachedMax = item.cantidad >= item.stock;
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          {item.imagen ? (
            <Image source={{ uri: item.imagen }} style={s.cardImg} contentFit="cover" />
          ) : (
            <View style={[s.cardImg, s.cardImgPlaceholder]}>
              <Text style={s.cardImgLetter}>{item.nombre.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={s.cardInfo}>
            <Text style={s.cardName} numberOfLines={2}>{item.nombre}</Text>
            <Text style={s.cardUnit}>S/ {item.precio.toFixed(2)} por unidad</Text>
          </View>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); removeFromCart(item.varianteId); }}
            style={s.cardRemove}
            activeOpacity={0.6}
          >
            <Text style={s.cardRemoveText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={s.cardDivider} />

        <View style={s.cardBottom}>
          <View style={s.qtyWrap}>
            <TouchableOpacity
              style={s.qtyBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateQuantity(item.varianteId, item.cantidad - 1); }}
              activeOpacity={0.6}
            >
              <Text style={s.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <View style={s.qtyNumWrap}>
              <Text style={s.qtyNum}>{item.cantidad}</Text>
            </View>
            <TouchableOpacity
              style={[s.qtyBtn, s.qtyBtnPlus, reachedMax && s.qtyBtnDisabled]}
              disabled={reachedMax}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateQuantity(item.varianteId, item.cantidad + 1); }}
              activeOpacity={0.6}
            >
              <Text style={[s.qtyBtnText, s.qtyBtnPlusText, reachedMax && s.qtyBtnDisabledText]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={s.subtotalWrap}>
            <Text style={s.subtotalLabel}>Subtotal</Text>
            <Text style={s.cardSubtotal}>S/ {subtotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.6}>
          <Text style={s.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Carrito ({count})</Text>
        {count > 0 ? (
          <TouchableOpacity onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); clearCart(); }} style={s.clearBtn} activeOpacity={0.6}>
            <Text style={s.clearText}>Vaciar</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 64 }} />}
      </View>

      {count === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Text style={s.emptyIcon}>🛒</Text>
          </View>
          <Text style={s.emptyTitle}>Tu carrito esta vacio</Text>
          <Text style={s.emptyText}>Agrega productos desde el punto de venta</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={s.emptyBtnText}>Ir al POS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={i => i.varianteId}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          {/* Footer */}
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={s.footerTotalRow}>
              <Text style={s.footerTotalLabel}>Total</Text>
              <Text style={s.footerTotalValue}>S/ {cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={s.cobrarBtn} onPress={() => router.push('/cobrar')} activeOpacity={0.8}>
              <Text style={s.cobrarText}>Cobrar S/ {cartTotal.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: '#7c3aed', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
  },
  clearText: { fontSize: 13, color: '#dc2626', fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 240 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  cardImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  cardImgLetter: { fontSize: 24, fontWeight: '700', color: '#7c3aed' },
  cardInfo: { flex: 1, marginLeft: 14, marginRight: 8 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4, lineHeight: 20 },
  cardUnit: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  cardRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRemoveText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 14 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtnPlus: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  qtyBtnDisabled: {
    backgroundColor: '#e2e8f0',
    borderColor: '#e2e8f0',
  },
  qtyBtnText: { fontSize: 20, color: '#475569', fontWeight: '600' },
  qtyBtnPlusText: { color: '#ffffff' },
  qtyBtnDisabledText: { color: '#94a3b8' },
  qtyNumWrap: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  subtotalWrap: { alignItems: 'flex-end' },
  subtotalLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardSubtotal: { fontSize: 20, fontWeight: '800', color: '#16a34a' },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerTotalLabel: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  footerTotalValue: { fontSize: 28, color: '#0f172a', fontWeight: '800' },
  cobrarBtn: {
    height: 56,
    backgroundColor: '#16a34a',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cobrarText: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginBottom: 28, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  emptyBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
