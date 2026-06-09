// =============================================================================
// productos/[id].tsx — Detalle producto: imagen + edición rápida + eliminar.
// =============================================================================

import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Save, Trash2 } from 'lucide-react-native';
import { Text } from 'tamagui';

import api from '@/api/client';
import { getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function ProductoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => api.get(`/productos/${id}`).then((r) => r.data?.data ?? r.data),
    enabled: !!id,
  });

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');

  useEffect(() => {
    if (data) {
      setNombre(data.nombre ?? '');
      setPrecio(String(data.precioVenta ?? ''));
    }
  }, [data]);

  const update = useMutation({
    mutationFn: () => api.put(`/productos/${id}`, { nombre, precioVenta: Number(precio) }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['producto', id] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      toastSuccess({ title: 'Guardado' });
      router.back();
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/productos/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] });
      toastSuccess({ title: 'Eliminado' });
      router.back();
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  const confirmDelete = () => {
    Alert.alert('Eliminar producto', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => del.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <AppHeader title="Cargando…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Producto" subtitle={data?.sku ?? ''} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        {data?.imagenPrincipal && (
          <Animated.View entering={FadeIn.duration(280)} style={s.imgWrap}>
            <Image source={{ uri: data.imagenPrincipal }} style={s.img} contentFit="cover" />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(80).duration(280)}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              NOMBRE
            </Text>
            <TextInput
              style={s.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del producto"
              placeholderTextColor="#A8B0AB"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(280)} style={{ marginTop: 12 }}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              PRECIO DE VENTA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text fontFamily="$body" fontSize={22} fontWeight="900" color="#00932C" marginRight={8}>
                S/
              </Text>
              <TextInput
                style={[s.input, { fontSize: 22, fontFamily: 'Mulish_900Black' }]}
                value={precio}
                onChangeText={setPrecio}
                placeholder="0.00"
                placeholderTextColor="#CBD5C9"
                keyboardType="decimal-pad"
              />
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 24 }} />
        <PressableButton label="Guardar cambios" icon={Save} loading={update.isPending} onPress={() => update.mutate()} />
        <View style={{ height: 10 }} />
        <PressableButton label="Eliminar" icon={Trash2} variant="danger" onPress={confirmDelete} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  imgWrap: { borderRadius: 20, overflow: 'hidden', marginBottom: 18, height: 200, backgroundColor: '#EEF0EF' },
  img: { width: '100%', height: '100%' },
  input: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    color: '#0C0C0C',
    paddingVertical: 8,
    flex: 1,
    margin: 0,
  },
});
