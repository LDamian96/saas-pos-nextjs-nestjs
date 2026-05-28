import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth.store';

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const { usuario, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const menuItems = [
    { label: 'Mi Negocio', emoji: '🏪', desc: 'Nombre, RUC, direccion', route: '/config/negocio' },
    { label: 'Impresora', emoji: '🖨', desc: 'Configurar impresora Bluetooth', route: '/config/impresora' },
    { label: 'Comprobantes', emoji: '🧾', desc: 'Ticket, boleta, factura', route: '/config/comprobantes' },
    { label: 'Nubefact', emoji: '📡', desc: 'Facturacion electronica', route: '/config/nubefact' },
    { label: 'Categorias', emoji: '📂', desc: 'Organizar productos', route: '/config/categorias' },
    { label: 'Marcas', emoji: '🏷️', desc: 'Marcas de productos', route: '/config/marcas' },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={s.title}>Configuracion</Text>

        {/* User card */}
        <View style={s.userCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{usuario?.nombre?.charAt(0) || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{usuario?.nombre} {usuario?.apellido}</Text>
            <Text style={s.userEmail}>{usuario?.email}</Text>
            <Text style={s.userCompany}>{usuario?.empresa?.nombre}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={s.menuItem} activeOpacity={0.7} onPress={() => router.push(item.route as any)}>
              <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={{ color: '#d1d5db', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Cerrar Sesion</Text>
        </TouchableOpacity>

        <Text style={s.version}>POS Shop v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 16, elevation: 1, marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  userCompany: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  menu: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  menuDesc: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  logoutBtn: { marginHorizontal: 16, marginTop: 24, height: 50, borderRadius: 14, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: '#d1d5db', fontSize: 12, marginTop: 24 },
});
