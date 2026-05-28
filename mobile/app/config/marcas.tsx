import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/client';
import { extractList, toastSuccess, toastError, getErrorMessage } from '@/api/helpers';

export default function MarcasScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => api.get('/marcas').then(r => r.data),
  });
  const marcas = extractList(data);

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      if (editId) return api.put(`/marcas/${editId}`, body).then(r => r.data);
      return api.post('/marcas', body).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toastSuccess(editId ? 'Marca actualizada' : 'Marca creada');
      setShowModal(false);
      setEditId(null);
      setNombre('');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/marcas/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toastSuccess('Eliminada', 'Marca eliminada');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const openEdit = (marca: any) => {
    setEditId(marca.id);
    setNombre(marca.nombre);
    setShowModal(true);
  };

  const openNew = () => {
    setEditId(null);
    setNombre('');
    setShowModal(true);
  };

  const handleDelete = (marca: any) => {
    Alert.alert('Eliminar', `¿Eliminar "${marca.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(marca.id) },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Marcas</Text>
        <TouchableOpacity onPress={openNew}>
          <Text style={s.addText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={marcas}
        keyExtractor={(i: any) => i.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🏷️</Text>
            <Text style={s.emptyText}>No hay marcas</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={{ fontSize: 20 }}>🏷️</Text>
            <Text style={s.cardName}>{item.nombre}</Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={s.cardAction}>
              <Text style={{ color: '#7c3aed', fontWeight: '600' }}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={s.cardAction}>
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editId ? 'Editar' : 'Nueva'} Marca</Text>
            <TextInput
              style={s.modalInput}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la marca"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setShowModal(false); setEditId(null); setNombre(''); }}>
                <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSave, saveMutation.isPending && { opacity: 0.6 }]}
                onPress={() => { if (nombre.trim()) saveMutation.mutate({ nombre: nombre.trim() }); }}
                disabled={saveMutation.isPending}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backText: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addText: { fontSize: 15, color: '#7c3aed', fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1, gap: 10 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  cardAction: { paddingHorizontal: 8, paddingVertical: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  modalInput: { height: 50, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb', color: '#111827', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  modalSave: { flex: 1, height: 46, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
});
