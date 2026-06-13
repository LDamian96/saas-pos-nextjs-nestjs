// =============================================================================
// config/categorias.tsx — CRUD categorías con modal.
// =============================================================================

import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react-native';

import api from '@/api/client';
import { extractList, getErrorMessage, toastError, toastSuccess } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, shadows } from '@/theme';

export default function CategoriasScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then((r) => r.data),
  });
  const categorias = extractList(data);

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      if (editId) return api.put(`/categorias/${editId}`, body).then((r) => r.data);
      return api.post('/categorias', body).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      remoteLogger.info(editId ? 'categoria_actualizada' : 'categoria_creada');
      toastSuccess(editId ? 'Categoría actualizada' : 'Categoría creada');
      setShowModal(false);
      setEditId(null);
      setNombre('');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categorias/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      remoteLogger.info('categoria_eliminada');
      toastSuccess('Eliminada', 'Categoría eliminada');
    },
    onError: (err: any) => toastError('Error', getErrorMessage(err)),
  });

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setNombre(cat.nombre);
    setShowModal(true);
  };
  const openNew = () => {
    setEditId(null);
    setNombre('');
    setShowModal(true);
  };
  const handleDelete = (cat: any) => {
    Alert.alert('Eliminar', `¿Eliminar "${cat.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(cat.id) },
    ]);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Header
        title="Categorías"
        right={
          <Pressable onPress={openNew} style={s.addBtn}>
            <Plus color="#FFFFFF" size={18} strokeWidth={2.6} />
          </Pressable>
        }
      />

      <FlatList
        data={categorias}
        keyExtractor={(i: any) => i.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(220)} style={s.empty}>
            <View style={s.emptyIcon}>
              <Tags color={colors.textSubtle} size={28} strokeWidth={2} />
            </View>
            <Text style={s.emptyText}>Aún no hay categorías</Text>
          </Animated.View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 30).duration(220)} style={s.card}>
            <View style={s.cardIcon}>
              <Tags color={colors.brand} size={18} strokeWidth={2.2} />
            </View>
            <Text style={s.cardName} numberOfLines={1}>{item.nombre}</Text>
            <Pressable onPress={() => openEdit(item)} style={s.cardAction}>
              <Pencil color={colors.brand} size={16} strokeWidth={2.4} />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} style={s.cardActionDanger}>
              <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
            </Pressable>
          </Animated.View>
        )}
      />

      <Modal visible={showModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>{editId ? 'Editar categoría' : 'Nueva categoría'}</Text>
            <TextInput
              style={s.modalInput}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la categoría"
              placeholderTextColor={colors.textPlaceholder}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancelar"
                  variant="outline"
                  onPress={() => {
                    setShowModal(false);
                    setEditId(null);
                    setNombre('');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Guardar"
                  onPress={() => nombre.trim() && saveMutation.mutate({ nombre: nombre.trim() })}
                  loading={saveMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 10,
    ...shadows.soft,
  },
  cardIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center' },
  cardName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  cardAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionDanger: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', marginTop: 70 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  emptyText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '85%', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22 },
  modalTitle: { fontFamily: fonts.black, fontSize: 17, color: colors.text, marginBottom: 14, letterSpacing: -0.2 },
  modalInput: {
    height: 50,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.semibold,
    fontSize: 14.5,
    borderWidth: 1.2,
    borderColor: colors.divider,
    color: colors.text,
    marginBottom: 18,
  },
});
