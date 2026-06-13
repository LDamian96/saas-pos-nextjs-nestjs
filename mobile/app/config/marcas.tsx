// =============================================================================
// config/marcas.tsx — Lista + crear marcas.
// =============================================================================

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Plus, Tag, Trash2 } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import api from '@/api/client';
import { extractList, getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function MarcasConfig() {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState('');

  const { data } = useQuery({
    queryKey: ['marcas'],
    queryFn: () => api.get('/marcas').then((r) => r.data),
  });
  const marcas = extractList(data);

  const create = useMutation({
    mutationFn: () => api.post('/marcas', { nombre }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcas'] });
      setNombre('');
      toastSuccess({ title: 'Creada' });
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/marcas/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marcas'] });
      toastSuccess({ title: 'Eliminada' });
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  return (
    <Screen>
      <AppHeader title="Marcas" subtitle={`${marcas.length} marcas`} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280)}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              NUEVA MARCA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej. Coca-Cola" placeholderTextColor="#A8B0AB" />
              <PressableButton label="Agregar" icon={Plus} size="sm" full={false} loading={create.isPending} onPress={() => nombre.trim() && create.mutate()} />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 20 }} />
        {marcas.map((m: { id: string; nombre: string }, i: number) => (
          <Animated.View key={m.id} entering={FadeIn.delay(i * 30).duration(220)} style={s.row}>
            <View style={s.iconWrap}>
              <Tag color="#00932C" size={18} strokeWidth={2.2} />
            </View>
            <Text fontFamily="$body" fontSize={14} fontWeight="700" color="$color" flex={1} marginLeft={12}>
              {m.nombre}
            </Text>
            <Pressable onPress={() => del.mutate(m.id)} hitSlop={8}>
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
