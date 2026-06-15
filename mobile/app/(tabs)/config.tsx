// =============================================================================
// (tabs)/config.tsx — Configuración del POS + cerrar sesión.
// =============================================================================

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Building2,
  ChevronRight,
  FileText,
  LogOut,
  Printer,
  Receipt,
  Settings,
  Tag,
  Tags,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { remoteLogger } from '@/services/remote-logger';
import { colors, fonts, radius, shadows } from '@/theme';

type MenuItem = {
  label: string;
  desc: string;
  route: string;
  Icon: typeof Building2;
};

const MENU: MenuItem[] = [
  { label: 'Mi negocio', desc: 'Nombre, RUC, dirección', route: '/config/negocio', Icon: Building2 },
  { label: 'Impresora', desc: 'Conectar impresora Bluetooth', route: '/config/impresora', Icon: Printer },
  { label: 'Comprobantes', desc: 'Ticket, boleta, factura', route: '/config/comprobantes', Icon: Receipt },
  { label: 'Nubefact', desc: 'Facturación electrónica', route: '/config/nubefact', Icon: FileText },
  { label: 'Categorías', desc: 'Organizar productos', route: '/config/categorias', Icon: Tags },
  { label: 'Marcas', desc: 'Marcas de productos', route: '/config/marcas', Icon: Tag },
];

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          remoteLogger.info('logout');
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(260)} style={s.headerRow}>
          <View style={s.headerIcon}>
            <Settings color={colors.brand} size={20} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={s.eyebrow}>SISTEMA</Text>
            <Text style={s.title}>Ajustes</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(280).easing(Easing.out(Easing.cubic))} style={s.userCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName} numberOfLines={1}>
              {usuario?.nombre} {usuario?.apellido ?? ''}
            </Text>
            <Text style={s.userEmail} numberOfLines={1}>
              {usuario?.email}
            </Text>
            {usuario?.empresa?.nombre && (
              <View style={s.companyChip}>
                <Building2 color={colors.brandDark} size={11} strokeWidth={2.4} />
                <Text style={s.companyText} numberOfLines={1}>
                  {usuario.empresa.nombre}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(140).duration(220)} style={s.sectionTitle}>
          PREFERENCIAS
        </Animated.Text>

        <View style={s.menu}>
          {MENU.map((item, i) => (
            <Animated.View
              key={item.route}
              entering={FadeInDown.delay(160 + i * 32).duration(260).easing(Easing.out(Easing.cubic))}
            >
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(item.route as any);
                }}
                style={({ pressed }) => [s.menuItem, { backgroundColor: pressed ? colors.surfaceAlt : colors.surface }]}
              >
                <View style={s.menuIcon}>
                  <item.Icon color={colors.brand} size={18} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuDesc}>{item.desc}</Text>
                </View>
                <ChevronRight color={colors.textSubtle} size={18} strokeWidth={2.2} />
              </Pressable>
              {i < MENU.length - 1 && <View style={s.menuDivider} />}
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(380).duration(280).easing(Easing.out(Easing.cubic))}>
          <Pressable onPress={handleLogout} style={({ pressed }) => [s.logoutBtn, { opacity: pressed ? 0.75 : 1 }]}>
            <LogOut color={colors.danger} size={18} strokeWidth={2.2} />
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </Pressable>
        </Animated.View>

        {usuario?.empresa?.nombre ? (
          <Text style={s.version}>{usuario.empresa.nombre}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, paddingBottom: 18, gap: 12 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4 },
  title: { fontFamily: fonts.black, fontSize: 24, color: colors.text, letterSpacing: -0.4, marginTop: 2 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
    gap: 14,
    marginBottom: 22,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarText: { color: '#FFFFFF', fontFamily: fonts.black, fontSize: 22 },
  userName: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  userEmail: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted, marginTop: 1 },
  companyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    gap: 4,
  },
  companyText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brandDark, maxWidth: 200 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 10 },
  menu: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider, ...shadows.soft },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontFamily: fonts.extrabold, fontSize: 14.5, color: colors.text },
  menuDesc: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  menuDivider: { height: 1, marginLeft: 64, backgroundColor: colors.divider },

  logoutBtn: {
    marginTop: 26,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: { color: colors.danger, fontFamily: fonts.extrabold, fontSize: 14.5 },
  version: { textAlign: 'center', color: colors.textSubtle, fontFamily: fonts.medium, fontSize: 11, marginTop: 22, letterSpacing: 0.3 },
});
