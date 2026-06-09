// =============================================================================
// caja/abrir.tsx — Abrir caja con monto inicial.
// =============================================================================

import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { ArrowRight, Wallet } from 'lucide-react-native';
import { Text } from 'tamagui';

import api from '@/api/client';
import { getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function CajaAbrirScreen() {
  const queryClient = useQueryClient();
  const [monto, setMonto] = useState('');

  const m = useMutation({
    mutationFn: (montoInicial: number) =>
      api.post('/caja/abrir', { montoInicial }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      toastSuccess({ title: 'Caja abierta' });
      router.back();
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  const handleAbrir = () => {
    const n = Number(monto) || 0;
    if (n < 0) {
      toastError({ title: 'Monto inválido' });
      return;
    }
    m.mutate(n);
  };

  return (
    <Screen>
      <AppHeader title="Abrir caja" subtitle="Empieza tu turno" />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))} style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Wallet color="#FFFFFF" size={40} strokeWidth={2.2} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(280)}>
          <Text fontFamily="$body" fontSize={22} fontWeight="900" color="$color" textAlign="center" letterSpacing={-0.4}>
            Monto inicial de la caja
          </Text>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted" textAlign="center" marginTop={6}>
            Ingresa el efectivo con el que empiezas
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(280)} style={s.inputCard}>
          <Text fontFamily="$body" fontSize={32} fontWeight="900" color="#00932C" marginRight={10}>
            S/
          </Text>
          <TextInput
            style={s.input}
            value={monto}
            onChangeText={setMonto}
            placeholder="0.00"
            placeholderTextColor="#CBD5C9"
            keyboardType="decimal-pad"
            autoFocus
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(280)} style={{ marginTop: 24 }}>
          <PressableButton
            label="Abrir caja"
            rightIcon={ArrowRight}
            size="lg"
            loading={m.isPending}
            onPress={handleAbrir}
          />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: 20 },
  iconWrap: { alignItems: 'center', marginTop: 24, marginBottom: 28 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#00932C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00932C',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    marginTop: 28,
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },
  input: {
    flex: 1,
    height: 70,
    fontFamily: 'Mulish_900Black',
    fontSize: 38,
    color: '#0C0C0C',
  },
});
