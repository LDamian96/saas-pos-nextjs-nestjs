// =============================================================================
// productos/nuevo.tsx — Crear producto rápido (nombre + precio + categoría).
// =============================================================================

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import api from '@/api/client';
import { extractList, getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function ProductoNuevo() {
  const qc = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const { data: catData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get('/categorias').then((r) => r.data),
  });
  const categorias = extractList(catData);

  const create = useMutation({
    mutationFn: () =>
      api
        .post('/productos', {
          nombre,
          precioVenta: Number(precio),
          stock: Number(stock) || 0,
          categoriaId: categoriaId || undefined,
          activo: true,
          visiblePos: true,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] });
      toastSuccess({ title: 'Producto creado' });
      router.back();
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  return (
    <Screen>
      <AppHeader title="Nuevo producto" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280)}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              NOMBRE
            </Text>
            <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej. Coca-Cola 500ml" placeholderTextColor="#A8B0AB" />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(280)} style={{ marginTop: 12 }}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              PRECIO DE VENTA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text fontFamily="$body" fontSize={22} fontWeight="900" color="#00932C" marginRight={8}>
                S/
              </Text>
              <TextInput style={[s.input, { fontSize: 22, fontFamily: 'Mulish_900Black' }]} value={precio} onChangeText={setPrecio} placeholder="0.00" placeholderTextColor="#CBD5C9" keyboardType="decimal-pad" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(280)} style={{ marginTop: 12 }}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              STOCK INICIAL
            </Text>
            <TextInput style={[s.input, { fontSize: 22, fontFamily: 'Mulish_900Black' }]} value={stock} onChangeText={setStock} placeholder="0" placeholderTextColor="#CBD5C9" keyboardType="numeric" />
          </Card>
        </Animated.View>

        {categorias.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(280)} style={{ marginTop: 12 }}>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2} marginBottom={8}>
              CATEGORÍA
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categorias.map((c: { id: string; nombre: string }) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
                  style={[s.chip, categoriaId === c.id && s.chipActive]}
                >
                  <Text fontFamily="$body" fontSize={13} fontWeight="700" color={categoriaId === c.id ? '#FFFFFF' : '#5E6A63'}>
                    {c.nombre}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 28 }} />
        <PressableButton
          label="Crear producto"
          icon={Plus}
          size="lg"
          loading={create.isPending}
          onPress={() => {
            if (!nombre || !precio) {
              toastError({ title: 'Datos requeridos', message: 'Nombre y precio son obligatorios' });
              return;
            }
            create.mutate();
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  input: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 18,
    color: '#0C0C0C',
    paddingVertical: 8,
    flex: 1,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },
  chipActive: { backgroundColor: '#00932C', borderColor: '#00932C' },
});
