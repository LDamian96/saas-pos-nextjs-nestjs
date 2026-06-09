// =============================================================================
// carrito.tsx — Carrito moderno: lista qty +/- + total + cobrar.
// =============================================================================

import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react-native';
import { Text } from 'tamagui';

import { usePosStore, type CartItem } from '@/stores/pos.store';
import { AppHeader } from '@/components/ui/AppHeader';
import { PressableButton } from '@/components/ui/PressableButton';
import { toastWarn } from '@/services/toast';

export default function CarritoScreen() {
  const insets = useSafeAreaInsets();
  const { cart, updateQuantity, removeFromCart, total, itemCount, clearCart } = usePosStore();
  const count = itemCount();
  const cartTotal = total();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="Carrito"
        subtitle={count === 0 ? 'Vacío' : `${count} producto${count === 1 ? '' : 's'}`}
        right={
          count > 0 ? (
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                clearCart();
                toastWarn({ title: 'Carrito vacío' });
              }}
              style={s.clearBtn}
            >
              <Trash2 color="#E53935" size={16} strokeWidth={2.2} />
              <Text fontFamily="$body" color="#E53935" fontWeight="700" fontSize={13} marginLeft={4}>
                Vaciar
              </Text>
            </Pressable>
          ) : null
        }
      />

      {count === 0 ? (
        <EmptyState />
      ) : (
        <>
          <FlashList
            data={cart}
            keyExtractor={(item) => item.varianteId}
            estimatedItemSize={150}
            contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
            renderItem={({ item, index }) => (
              <CartCard
                item={item}
                index={index}
                onInc={() => updateQuantity(item.varianteId, item.cantidad + 1)}
                onDec={() => updateQuantity(item.varianteId, item.cantidad - 1)}
                onRemove={() => removeFromCart(item.varianteId)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />

          {/* ─── Footer ───────────────────────── */}
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.totalRow}>
              <Text fontFamily="$body" color="$colorMuted" fontSize={14} fontWeight="600">
                Total
              </Text>
              <Text
                fontFamily="$body"
                color="$color"
                fontSize={26}
                fontWeight="900"
                letterSpacing={-0.5}
              >
                S/ {cartTotal.toFixed(2)}
              </Text>
            </View>
            <PressableButton
              label={`Cobrar S/ ${cartTotal.toFixed(2)}`}
              icon={ArrowRight}
              size="lg"
              onPress={() => router.push('/cobrar')}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ============================================================================

function CartCard({
  item,
  index,
  onInc,
  onDec,
  onRemove,
}: {
  item: CartItem;
  index: number;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const subtotal = item.precio * item.cantidad;
  const atMax = item.cantidad >= item.stock;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 30).duration(220).easing(Easing.out(Easing.cubic))}
      layout={LinearTransition.springify().damping(18).stiffness(200)}
      style={s.card}
    >
      <View style={s.cardTop}>
        {item.imagen ? (
          <Image source={{ uri: item.imagen }} style={s.cardImg} contentFit="cover" />
        ) : (
          <View style={[s.cardImg, s.cardImgPlaceholder]}>
            <Text fontFamily="$body" fontSize={22} fontWeight="800" color="#00932C">
              {item.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="700"
            color="$color"
            numberOfLines={2}
            lineHeight={18}
          >
            {item.nombre}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" fontWeight="600" marginTop={2}>
            S/ {item.precio.toFixed(2)} c/u
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemove();
          }}
          style={s.removeBtn}
        >
          <X color="#E53935" size={14} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={s.divider} />

      <View style={s.cardBottom}>
        <View style={s.qtyWrap}>
          <QtyBtn icon={Minus} onPress={onDec} />
          <View style={s.qtyNum}>
            <Text fontFamily="$body" fontSize={17} fontWeight="800" color="$color">
              {item.cantidad}
            </Text>
          </View>
          <QtyBtn icon={Plus} onPress={onInc} disabled={atMax} primary />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            fontFamily="$body"
            fontSize={10}
            fontWeight="700"
            color="$colorSubtle"
            letterSpacing={1.2}
          >
            SUBTOTAL
          </Text>
          <Text
            fontFamily="$body"
            fontSize={18}
            fontWeight="900"
            color="#00932C"
            marginTop={2}
            letterSpacing={-0.3}
          >
            S/ {subtotal.toFixed(2)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

function QtyBtn({
  icon: Icon,
  onPress,
  disabled,
  primary,
}: {
  icon: typeof Minus;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
    >
      <Animated.View
        style={[
          s.qtyBtn,
          primary && !disabled && { backgroundColor: '#00932C', borderColor: '#00932C' },
          disabled && { backgroundColor: '#EEF0EF', borderColor: '#EEF0EF' },
          animStyle,
        ]}
      >
        <Icon
          color={primary && !disabled ? '#FFFFFF' : disabled ? '#A8B0AB' : '#0C0C0C'}
          size={18}
          strokeWidth={2.4}
        />
      </Animated.View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <Animated.View
      entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
      style={s.empty}
    >
      <View style={s.emptyIcon}>
        <ShoppingBag color="#A8B0AB" size={42} strokeWidth={1.8} />
      </View>
      <Text fontFamily="$body" fontSize={20} fontWeight="800" color="$color">
        Tu carrito está vacío
      </Text>
      <Text
        fontFamily="$body"
        fontSize={13}
        color="$colorMuted"
        marginTop={6}
        marginBottom={24}
        textAlign="center"
      >
        Agrega productos desde el POS
      </Text>
      <PressableButton
        label="Ir al POS"
        onPress={() => router.back()}
        size="md"
        full={false}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF0EF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardImg: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#F1F3F2' },
  cardImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5EC',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginLeft: 8,
  },
  divider: { height: 1, backgroundColor: '#EEF0EF', marginVertical: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#E5E7E6',
  },
  qtyNum: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF0EF',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#EEF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
