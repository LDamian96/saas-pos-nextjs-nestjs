// =============================================================================
// carrito.tsx — Carrito con qty +/- y subtotales.
// =============================================================================

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react-native';

import { usePosStore, type CartItem } from '@/stores/pos.store';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { colors, fonts, radius, shadows } from '@/theme';

export default function CarritoScreen() {
  const insets = useSafeAreaInsets();
  const { cart, updateQuantity, removeFromCart, total, itemCount, clearCart } = usePosStore();
  const cartTotal = total();
  const count = itemCount();

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => {
    const subtotal = item.precio * item.cantidad;
    const reachedMax = item.cantidad >= item.stock;
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 30).duration(260).easing(Easing.out(Easing.cubic))}
        exiting={FadeOut.duration(180)}
        style={s.card}
      >
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
            <Text style={s.cardUnit}>S/ {item.precio.toFixed(2)} c/u</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              removeFromCart(item.varianteId);
            }}
            style={s.cardRemove}
          >
            <X color={colors.danger} size={14} strokeWidth={2.6} />
          </Pressable>
        </View>

        <View style={s.cardDivider} />

        <View style={s.cardBottom}>
          <View style={s.qtyWrap}>
            <Pressable
              style={s.qtyBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateQuantity(item.varianteId, item.cantidad - 1);
              }}
            >
              <Minus color={colors.text} size={16} strokeWidth={2.4} />
            </Pressable>
            <View style={s.qtyNumWrap}>
              <Text style={s.qtyNum}>{item.cantidad}</Text>
            </View>
            <Pressable
              style={[s.qtyBtn, s.qtyBtnPlus, reachedMax && s.qtyBtnDisabled]}
              disabled={reachedMax}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateQuantity(item.varianteId, item.cantidad + 1);
              }}
            >
              <Plus color={reachedMax ? colors.textPlaceholder : '#FFFFFF'} size={16} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.subtotalLabel}>SUBTOTAL</Text>
            <Text style={s.cardSubtotal}>S/ {subtotal.toFixed(2)}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header
        title={`Carrito (${count})`}
        right={
          count > 0 ? (
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                clearCart();
              }}
              style={s.clearBtn}
            >
              <Trash2 color={colors.danger} size={14} strokeWidth={2.4} />
              <Text style={s.clearText}>Vaciar</Text>
            </Pressable>
          ) : null
        }
      />

      {count === 0 ? (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <ShoppingCart color={colors.brand} size={36} strokeWidth={2} />
          </View>
          <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={s.emptyText}>Agrega productos desde el punto de venta</Text>
          <View style={{ marginTop: 24, width: '70%' }}>
            <Button label="Ir al POS" onPress={() => router.back()} />
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={(i) => i.varianteId}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={s.footerTotalRow}>
              <Text style={s.footerTotalLabel}>Total</Text>
              <Text style={s.footerTotalValue}>S/ {cartTotal.toFixed(2)}</Text>
            </View>
            <Button label={`Cobrar S/ ${cartTotal.toFixed(2)}`} onPress={() => router.push('/cobrar')} size="lg" />
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  clearText: { fontFamily: fonts.extrabold, fontSize: 12, color: colors.danger },

  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 220 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: colors.divider, ...shadows.soft },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardImg: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.surfaceAlt },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandTint },
  cardImgLetter: { fontFamily: fonts.black, fontSize: 22, color: colors.brand },
  cardInfo: { flex: 1, marginLeft: 14, marginRight: 8 },
  cardName: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.text, lineHeight: 18 },
  cardUnit: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  cardRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },

  cardDivider: { height: 1, backgroundColor: colors.divider, marginVertical: 14 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnPlus: { backgroundColor: colors.brand, borderColor: colors.brand },
  qtyBtnDisabled: { backgroundColor: colors.border, borderColor: colors.border },
  qtyNumWrap: { minWidth: 36, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontFamily: fonts.black, fontSize: 17, color: colors.text },

  subtotalLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.textSubtle, letterSpacing: 1.2 },
  cardSubtotal: { fontFamily: fonts.black, fontSize: 18, color: colors.brand, marginTop: 2 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  footerTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  footerTotalLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  footerTotalValue: { fontFamily: fonts.black, fontSize: 28, color: colors.text, letterSpacing: -0.6 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  emptyTitle: { fontFamily: fonts.black, fontSize: 19, color: colors.text, letterSpacing: -0.3 },
  emptyText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
});
