// =============================================================================
// Toaster — Estilo Sonner web. Stack arriba, max 3 visibles, los siguientes
// hacen FIFO (sale el mas viejo, entra el nuevo).
//   API global: toast.success() / toast.error() / toast.info() / toast.warning()
// =============================================================================

import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  show: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;

// Singleton para usar toast.success() sin necesidad de hook desde cualquier archivo.
let globalShow: ToastContextValue['show'] | null = null;

export const toast = {
  success: (title: string, description?: string) =>
    globalShow?.({ type: 'success', title, description, duration: 3500 }),
  error: (title: string, description?: string) =>
    globalShow?.({ type: 'error', title, description, duration: 4500 }),
  info: (title: string, description?: string) =>
    globalShow?.({ type: 'info', title, description, duration: 3500 }),
  warning: (title: string, description?: string) =>
    globalShow?.({ type: 'warning', title, description, duration: 4000 }),
  show: (title: string, description?: string, duration = 3500) =>
    globalShow?.({ type: 'default', title, description, duration }),
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((prev) => {
      const next = [...prev, { ...item, id }];
      return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
    });
  }, []);

  useEffect(() => {
    globalShow = show;
    return () => {
      if (globalShow === show) globalShow = null;
    };
  }, [show]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Renderizamos los items en el mismo punto absoluto, asi se ven apilados
  // (el mas nuevo arriba, los anteriores detras con scale/translateY/opacity).
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={[s.container, { top: insets.top + 10 }]}>
        {items.map((item, idx) => {
          // depth = posicion desde el frente (0 = al frente, mas grande)
          const depth = items.length - 1 - idx;
          return (
            <ToastView
              key={item.id}
              item={item}
              depth={depth}
              onDismiss={() => dismiss(item.id)}
            />
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({
  item,
  depth,
  onDismiss,
}: {
  item: ToastItem;
  depth: number;
  onDismiss: () => void;
}) {
  const enterY = useRef(new Animated.Value(-24)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Stack offsets — interpolados desde depth (cambia cuando llega otro toast).
  const stackScale = useRef(new Animated.Value(1)).current;
  const stackTranslateY = useRef(new Animated.Value(0)).current;
  const stackOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada inicial
    Animated.parallel([
      Animated.spring(enterY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 80 }),
      Animated.timing(enterOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(enterY, { toValue: -24, duration: 240, useNativeDriver: true }),
        Animated.timing(enterOpacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start(onDismiss);
    }, item.duration);

    return () => clearTimeout(timer);
  }, []);

  // Animar el cambio de profundidad cuando entra otro toast.
  useEffect(() => {
    const targetScale = 1 - depth * 0.05;
    const targetY = depth * 8;
    const targetOpacity = depth === 0 ? 1 : depth === 1 ? 0.92 : 0.75;
    Animated.parallel([
      Animated.spring(stackScale, { toValue: targetScale, useNativeDriver: true, friction: 9 }),
      Animated.spring(stackTranslateY, { toValue: targetY, useNativeDriver: true, friction: 9 }),
      Animated.timing(stackOpacity, { toValue: targetOpacity, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [depth]);

  // Swipe arriba para descartar
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -8 || Math.abs(g.dx) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) dragY.setValue(g.dy);
        if (Math.abs(g.dx) > 0) dragX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -50 || Math.abs(g.dx) > 80) {
          Animated.parallel([
            Animated.timing(enterOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
            Animated.timing(g.dy < 0 ? dragY : dragX, {
              toValue: g.dy < 0 ? -100 : g.dx > 0 ? 400 : -400,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start(onDismiss);
        } else {
          Animated.parallel([
            Animated.spring(dragX, { toValue: 0, useNativeDriver: true, friction: 6 }),
            Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 6 }),
          ]).start();
        }
      },
    }),
  ).current;

  const tone = TONES[item.type];
  const Icon = tone.icon;

  // Solo el frontmost reacciona a touch — los detras estan apagados (pointerEvents).
  const interactive = depth === 0;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[
        s.toast,
        {
          opacity: Animated.multiply(enterOpacity, stackOpacity),
          transform: [
            { translateY: Animated.add(Animated.add(enterY, dragY), stackTranslateY) },
            { translateX: dragX },
            { scale: stackScale },
          ],
          backgroundColor: '#ffffff',
          borderColor: tone.border,
        },
      ]}
    >
      <View style={[s.iconWrap, { backgroundColor: tone.iconBg }]}>
        <Icon color={tone.iconColor} size={16} strokeWidth={2.6} />
      </View>
      <View style={s.body}>
        <Text style={s.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={s.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      {interactive && (
        <Pressable onPress={onDismiss} hitSlop={10} style={s.close}>
          <X color="#94a3b8" size={15} strokeWidth={2.4} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const TONES: Record<
  ToastType,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    icon: typeof CheckCircle2;
  }
> = {
  success: { border: '#e2e8f0', iconBg: '#dcfce7', iconColor: '#16a34a', icon: CheckCircle2 },
  error: { border: '#e2e8f0', iconBg: '#fee2e2', iconColor: '#dc2626', icon: AlertCircle },
  info: { border: '#e2e8f0', iconBg: '#ede9fe', iconColor: '#7c3aed', icon: Info },
  warning: { border: '#e2e8f0', iconBg: '#fef3c7', iconColor: '#d97706', icon: AlertTriangle },
  default: { border: '#e2e8f0', iconBg: '#f1f5f9', iconColor: '#475569', icon: Info },
};

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  toast: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, paddingVertical: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a', letterSpacing: -0.1 },
  desc: { fontSize: 12.5, marginTop: 2, fontWeight: '500', color: '#64748b', lineHeight: 17 },
  close: { padding: 4 },
});
