import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function NegocioScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['empresa-me'],
    queryFn: () => api.get('/empresas/me').then(r => r.data),
  });

  useEffect(() => {
    const emp = data?.data || data;
    if (emp) {
      setNombre(emp.nombre || '');
      setRuc(emp.ruc || '');
      setDireccion(emp.direccion || '');
      setTelefono(emp.telefono || '');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: any) => api.put('/empresas/me', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-me'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess('Guardado', 'Datos del negocio actualizados');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const handleSave = () => {
    updateMutation.mutate({ nombre, ruc, direccion, telefono });
  };

  if (isLoading) {
    return (
      <View style={[s.container, { alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mi Negocio</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.form}>
        <View style={s.iconWrap}>
          <Text style={{ fontSize: 48 }}>🏪</Text>
        </View>

        <Text style={s.label}>Nombre del negocio</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Mi Tienda" placeholderTextColor="#9ca3af" />

        <Text style={s.label}>RUC</Text>
        <TextInput style={s.input} value={ruc} onChangeText={setRuc} placeholder="20123456789" placeholderTextColor="#9ca3af" keyboardType="numeric" maxLength={11} />

        <Text style={s.label}>Direccion</Text>
        <TextInput style={s.input} value={direccion} onChangeText={setDireccion} placeholder="Av. Principal 123" placeholderTextColor="#9ca3af" />

        <Text style={s.label}>Telefono</Text>
        <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="999999999" placeholderTextColor="#9ca3af" keyboardType="phone-pad" />

        <TouchableOpacity
          style={[s.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{updateMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backText: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  form: { padding: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { height: 50, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827' },
  saveBtn: { height: 56, backgroundColor: '#7c3aed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 28, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
