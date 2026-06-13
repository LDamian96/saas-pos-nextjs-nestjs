// =============================================================================
// (tabs)/_layout.tsx — Bottom navigation moderno DineTrack.
// • Reanimated 4 spring para indicator activo
// • Iconos lucide consistentes con la web
// • Haptic + label que aparece solo en tab activa
// =============================================================================

import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  BarChart3,
  LayoutGrid,
  Package2,
  Settings2,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

const ICONS: Record<string, LucideIcon> = {
  index: LayoutGrid,
  productos: Package2,
  ventas: BarChart3,
  config: Settings2,
};

const LABELS: Record<string, string> = {
  index: 'POS',
  productos: 'Productos',
  ventas: 'Reportes',
  config: 'Ajustes',
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 6);

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => (
        <View style={[s.bar, { paddingBottom: bottomPad }]}>
          <View style={s.row}>
            {props.state.routes
              .filter((r) => ICONS[r.name])
              .map((route) => {
                const idx = props.state.routes.findIndex((r) => r.key === route.key);
                const focused = props.state.index === idx;
                const Icon = ICONS[route.name];
                const label = LABELS[route.name];
                return (
                  <TabItem
                    key={route.key}
                    Icon={Icon}
                    label={label}
                    focused={focused}
                    onPress={() => {
                      Haptics.selectionAsync();
                      const event = props.navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                      });
                      if (!focused && !event.defaultPrevented) {
                        props.navigation.navigate(route.name as never);
                      }
                    }}
                  />
                );
              })}
          </View>
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="productos" />
      <Tabs.Screen name="ventas" />
      <Tabs.Screen name="config" />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

interface TabItemProps {
  Icon: LucideIcon;
  label: string;
  focused: boolean;
  onPress: () => void;
}

function TabItem({ Icon, label, focused, onPress }: TabItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 18,
      stiffness: 220,
    });
  }, [focused]);

  const animPill = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(0,147,44,0)', 'rgba(0,147,44,0.12)'],
    ),
    transform: [{ scale: 0.94 + 0.06 * progress.value }],
  }));

  const animIcon = useAnimatedStyle(() => ({
    opacity: 0.55 + 0.45 * progress.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withTiming(0.9, { duration: 100 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 400 }))}
      style={{ flex: 1 }}
    >
      <Animated.View style={[s.item, animPill]}>
        <Animated.View style={animIcon}>
          <Icon
            color={focused ? '#00932C' : '#8A938D'}
            size={focused ? 22 : 20}
            strokeWidth={2.2}
          />
        </Animated.View>
        {focused && (
          <Text
            fontFamily="$body"
            fontWeight="800"
            fontSize={12}
            color="#00932C"
            marginLeft={8}
            letterSpacing={0.1}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF0EF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
});
