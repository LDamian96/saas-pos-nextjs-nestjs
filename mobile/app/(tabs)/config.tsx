// =============================================================================
// (tabs)/config.tsx — Ajustes: perfil, secciones de config y logout.
// =============================================================================

import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Bluetooth,
  Building2,
  ChevronRight,
  FileSpreadsheet,
  LogOut,
  Receipt,
  ShoppingBag,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from 'tamagui';

import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card';
import { toastInfo } from '@/services/toast';

interface Section {
  icon: LucideIcon;
  label: string;
  description?: string;
  href: string;
}

const SECTIONS: Section[][] = [
  [
    { icon: Building2, label: 'Negocio', description: 'Datos generales', href: '/config/negocio' },
    { icon: Receipt, label: 'Comprobantes', description: 'Ticket, boleta, factura', href: '/config/comprobantes' },
    { icon: FileSpreadsheet, label: 'NubeFact (SUNAT)', description: 'Facturación electrónica', href: '/config/nubefact' },
    { icon: Bluetooth, label: 'Impresora', description: 'Bluetooth térmica', href: '/config/impresora' },
  ],
  [
    { icon: Sparkles, label: 'Categorías', href: '/config/categorias' },
    { icon: Tag, label: 'Marcas', href: '/config/marcas' },
  ],
];

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          toastInfo({ title: 'Sesión cerrada' });
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(220)} style={s.header}>
        <Text fontFamily="$body" fontSize={13} color="$colorMuted" fontWeight="600">
          Mi negocio
        </Text>
        <Text fontFamily="$body" fontSize={22} fontWeight="900" color="$color" letterSpacing={-0.4}>
          Ajustes
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ─── Perfil ──────────────────────── */}
        <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}>
          <Card style={s.profile}>
            <View style={s.avatar}>
              <ShoppingBag color="#FFFFFF" size={28} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text fontFamily="$body" fontSize={16} fontWeight="800" color="$color">
                {usuario?.nombre ?? 'Usuario'} {usuario?.apellido ?? ''}
              </Text>
              <Text fontFamily="$body" fontSize={12} color="$colorMuted" fontWeight="600" numberOfLines={1}>
                {usuario?.email ?? ''}
              </Text>
              {usuario?.empresa?.nombre && (
                <View style={s.badge}>
                  <Text fontFamily="$body" fontSize={10} fontWeight="800" color="#00932C" letterSpacing={0.4}>
                    {usuario.empresa.nombre}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* ─── Grupos de secciones ─────────── */}
        {SECTIONS.map((group, gIdx) => (
          <View key={gIdx} style={{ marginTop: 18 }}>
            {group.map((sec, i) => (
              <Animated.View
                key={sec.href}
                entering={FadeInDown.delay(120 + gIdx * 200 + i * 40)
                  .duration(240)
                  .easing(Easing.out(Easing.cubic))}
                style={{ marginBottom: 8 }}
              >
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(sec.href);
                  }}
                  style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
                >
                  <View style={s.rowIcon}>
                    <sec.icon color="#00932C" size={20} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text fontFamily="$body" fontSize={14.5} fontWeight="700" color="$color">
                      {sec.label}
                    </Text>
                    {sec.description && (
                      <Text fontFamily="$body" fontSize={12} color="$colorMuted" fontWeight="600" marginTop={2}>
                        {sec.description}
                      </Text>
                    )}
                  </View>
                  <ChevronRight color="#A8B0AB" size={18} strokeWidth={2.2} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ))}

        {/* ─── Logout ──────────────────────── */}
        <Pressable onPress={handleLogout} style={({ pressed }) => [s.logout, pressed && { opacity: 0.85 }]}>
          <LogOut color="#E53935" size={18} strokeWidth={2.2} />
          <Text fontFamily="$body" fontSize={14} fontWeight="800" color="#E53935" marginLeft={8}>
            Cerrar sesión
          </Text>
        </Pressable>

        <Text fontFamily="$body" fontSize={11} color="$colorSubtle" textAlign="center" marginTop={16}>
          POS Shop · v0.1
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 120 },

  profile: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#00932C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00932C',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0EF',
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
});
