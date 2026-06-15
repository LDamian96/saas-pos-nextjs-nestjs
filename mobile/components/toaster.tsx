// =============================================================================
// Toaster — Notificaciones estilo Sonner (web), pero en React Native nativo.
// Sin librerias externas. Slide-down desde arriba + fade + swipe to dismiss.
// API global: toast.success(), toast.error(), toast.info(), toast(msg, opts).
// =============================================================================

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'default';

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

// Singleton para llamar toast.success() desde cualquier archivo sin hook
let globalShow: ToastContextValue['show'] | null = null;

export const toast = {
  success: (title: string, description?: string) =>
    globalShow?.({ type: 'success', title, description, duration: 2500 }),
  error: (title: string, description?: string) =>
    globalShow?.({ type: 'error', title, description, duration: 3500 }),
  info: (title: string, description?: string) =>
    globalShow?.({ type: 'info', title, description, duration: 2500 }),
  show: (title: string, description?: string, duration = 2500) =>
    globalShow?.({ type: 'default', title, description, duration }),
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...item, id }]);
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

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View
        pointerEvents="box-none"
        style={[s.container, { top: insets.top + 8 }]}
      >
        {items.map((item, idx) => (
          <ToastView key={item.id} item={item} index={idx} onDismiss={() => dismiss(item.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ item, index, onDismiss }: { item: ToastItem; index: number; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, item.duration);

    return () => clearTimeout(timer);
  }, []);

  // Swipe to dismiss (arriba o lados)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 || g.dy < -8,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) dragY.setValue(g.dy);
        if (Math.abs(g.dx) > 0) dragX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -60 || Math.abs(g.dx) > 80) {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(g.dy < 0 ? dragY : dragX, {
              toValue: g.dy < 0 ? -120 : g.dx > 0 ? 400 : -400,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => onDismiss());
        } else {
          Animated.parallel([
            Animated.spring(dragX, { toValue: 0, useNativeDriver: true, friction: 6 }),
            Animated.spring(dragY, { toValue: 0, useNativeDriver: true, friction: 6 }),
          ]).start();
        }
      },
    })
  ).current;

  const config = TONES[item.type];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        s.toast,
        {
          opacity,
          transform: [
            { translateY: Animated.add(translateY, dragY) },
            { translateX: dragX },
          ],
          marginBottom: 8,
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <View style={[s.icon, { backgroundColor: config.iconBg }]}>
        <Text style={s.iconText}>{config.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.title, { color: config.title }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[s.desc, { color: config.desc }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onDismiss} hitSlop={8} style={s.close}>
        <Text style={[s.closeX, { color: config.close }]}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

const TONES: Record<ToastType, {
  bg: string; border: string;
  iconBg: string; icon: string;
  title: string; desc: string; close: string;
}> = {
  success: {
    bg: '#ffffff', border: '#dcfce7',
    iconBg: '#dcfce7', icon: '✓',
    title: '#0f172a', desc: '#65748b', close: '#94a3b8',
  },
  error: {
    bg: '#ffffff', border: '#fee2e2',
    iconBg: '#fee2e2', icon: '✕',
    title: '#0f172a', desc: '#65748b', close: '#94a3b8',
  },
  info: {
    bg: '#ffffff', border: '#ede9fe',
    iconBg: '#ede9fe', icon: 'i',
    title: '#0f172a', desc: '#65748b', close: '#94a3b8',
  },
  default: {
    bg: '#ffffff', border: '#e2e8f0',
    iconBg: '#f1f5f9', icon: '•',
    title: '#0f172a', desc: '#65748b', close: '#94a3b8',
  },
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
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  iconText: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  title: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  desc: { fontSize: 12.5, marginTop: 2, fontWeight: '500' },
  close: { padding: 4, marginLeft: 4 },
  closeX: { fontSize: 14, fontWeight: '700' },
});

// Override colors by type (mas precisos)
TONES.success.iconBg = '#dcfce7';
TONES.success.title = '#0f172a';
TONES.success.desc = '#475569';
TONES.error.iconBg = '#fee2e2';
TONES.error.title = '#7f1d1d';
TONES.error.desc = '#dc2626';
TONES.info.iconBg = '#ede9fe';
TONES.info.title = '#0f172a';
TONES.info.desc = '#475569';
