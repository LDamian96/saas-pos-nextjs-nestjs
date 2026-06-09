// =============================================================================
// config/categorias.tsx — Lista + crear categorías.
// =============================================================================

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Plus, Sparkles, Trash2 } from 'lucide-react-native';
import { Text } from 'tamagui';

import api from '@/api/client';
import { extractList, getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function CategoriasConfig() {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState('');

  const { data } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then((r) => r.data),
  });
  const categorias = extractList(data);

  const create = useMutation({
    mutationFn: () => api.post('/categorias', { nombre }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      setNombre('');
      toastSuccess({ title: 'Creada' });
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/categorias/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toastSuccess({ title: 'Eliminada' });
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  return (
    <Screen>
      <AppHeader title="Categorías" subtitle={`${categorias.length} categorías`} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280)}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              NUEVA CATEGORÍA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej. Bebidas" placeholderTextColor="#A8B0AB" />
              <PressableButton label="Agregar" icon={Plus} size="sm" full={false} loading={create.isPending} onPress={() => nombre.trim() && create.mutate()} />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 20 }} />
        {categorias.map((c: { id: string; nombre: string }, i: number) => (
          <Animated.View key={c.id} entering={FadeIn.delay(i * 30).duration(220)} style={s.row}>
            <View style={s.iconWrap}>
              <Sparkles color="#00932C" size={18} strokeWidth={2.2} />
            </View>
            <Text fontFamily="$body" fontSize={14} fontWeight="700" color="$color" flex={1} marginLeft={12}>
              {c.nombre}
            </Text>
            <Pressable onPress={() => del.mutate(c.id)} hitSlop={8}>
              <Trash2 color="#E53935" size={18} strokeWidth={2.2} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  input: { flex: 1, height: 44, fontFamily: 'Mulish_700Bold', fontSize: 15, color: '#0C0C0C', paddingHorizontal: 14, backgroundColor: '#F7F8FA', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7E6' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EEF0EF', marginBottom: 8 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8F5EC', alignItems: 'center', justifyContent: 'center' },
});
