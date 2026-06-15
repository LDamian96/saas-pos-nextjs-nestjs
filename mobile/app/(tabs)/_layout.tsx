import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={ti.wrap}>
      <Text style={{ fontSize: focused ? 22 : 18 }}>{emoji}</Text>
      <Text style={[ti.label, focused && ti.labelActive]}>{label}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  label: { fontSize: 10, marginTop: 2, color: '#9ca3af' },
  labelActive: { color: '#7c3aed', fontWeight: '700' },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Solo agregar padding extra si hay inset real (gesture nav), sino un mínimo
  const bottomPad = Math.max(insets.bottom, 4);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          elevation: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#7c3aed',
      }}>
      <Tabs.Screen name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" label="POS" focused={focused} /> }} />
      <Tabs.Screen name="productos"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Productos" focused={focused} /> }} />
      <Tabs.Screen name="ventas"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Reportes" focused={focused} /> }} />
      <Tabs.Screen name="config"
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Config" focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
