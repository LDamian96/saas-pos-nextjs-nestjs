// =============================================================================
// caja/cerrar.tsx — Cierre de caja con arqueo.
// =============================================================================

import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import api from '@/api/client';
import { getErrorMessage } from '@/api/helpers';
import { AppHeader } from '@/components/ui/AppHeader';
import { PressableButton } from '@/components/ui/PressableButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { toastError, toastSuccess } from '@/services/toast';

export default function CajaCerrarScreen() {
  const queryClient = useQueryClient();
  const [monto, setMonto] = useState('');

  const { data: caja } = useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => api.get('/caja/actual').then((r) => r.data?.data ?? r.data),
  });

  const efectivoEsperado = Number(caja?.totalEfectivo ?? caja?.montoInicial ?? 0);
  const montoNum = Number(monto) || 0;
  const diferencia = montoNum - efectivoEsperado;

  const m = useMutation({
    mutationFn: (montoFinal: number) =>
      api.post('/caja/cerrar', { cajaId: caja?.id, montoFinal }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] });
      toastSuccess({ title: 'Caja cerrada' });
      router.back();
    },
    onError: (err: Error) => toastError({ title: 'Error', message: getErrorMessage(err) }),
  });

  return (
    <Screen>
      <AppHeader title="Cerrar caja" subtitle="Arqueo del turno" />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.4}>
              EFECTIVO ESPERADO
            </Text>
            <Text fontFamily="$body" fontSize={28} fontWeight="900" color="#00932C" marginTop={4}>
              S/ {efectivoEsperado.toFixed(2)}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(280)}>
          <Text
            fontFamily="$body"
            fontSize={14}
            fontWeight="700"
            color="$color"
            marginTop={22}
            marginBottom={10}
          >
            Cuenta el efectivo físico
          </Text>
          <View style={s.inputCard}>
            <Text fontFamily="$body" fontSize={28} fontWeight="900" color="#00932C" marginRight={10}>
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
          </View>
        </Animated.View>

        {montoNum > 0 && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card
              style={[
                s.diffCard,
                Math.abs(diferencia) < 0.01
                  ? { backgroundColor: '#EBF7EF', borderColor: '#BBF7D0' }
                  : { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
              ]}
            >
              {Math.abs(diferencia) < 0.01 ? (
                <CheckCircle2 color="#00932C" size={24} strokeWidth={2.2} />
              ) : (
                <XCircle color="#B45309" size={24} strokeWidth={2.2} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  fontFamily="$body"
                  fontSize={12}
                  fontWeight="800"
                  color={Math.abs(diferencia) < 0.01 ? '#15803D' : '#B45309'}
                  letterSpacing={1}
                >
                  {Math.abs(diferencia) < 0.01
                    ? 'CUADRADO'
                    : diferencia > 0
                    ? 'SOBRANTE'
                    : 'FALTANTE'}
                </Text>
                <Text
                  fontFamily="$body"
                  fontSize={20}
                  fontWeight="900"
                  color={Math.abs(diferencia) < 0.01 ? '#15803D' : '#B45309'}
                >
                  S/ {Math.abs(diferencia).toFixed(2)}
                </Text>
              </View>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(220).duration(280)} style={{ marginTop: 28 }}>
          <PressableButton
            label="Cerrar caja"
            variant="danger"
            size="lg"
            loading={m.isPending}
            onPress={() => m.mutate(montoNum)}
          />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1.4,
    borderColor: '#E5E7E6',
  },
  input: { flex: 1, height: 62, fontFamily: 'Mulish_900Black', fontSize: 32, color: '#0C0C0C' },
  diffCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
});
