// =============================================================================
// config/negocio.tsx — Datos del negocio.
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Save } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastSuccess } from '@/services/toast';

const KEY = 'pos-negocio-info';

export default function NegocioConfig() {
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const c = JSON.parse(v);
        setNombre(c.nombre ?? '');
        setRuc(c.ruc ?? '');
        setDireccion(c.direccion ?? '');
        setTelefono(c.telefono ?? '');
      }
    });
  }, []);

  const save = async () => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ nombre, ruc, direccion, telefono }));
    toastSuccess({ title: 'Guardado' });
    router.back();
  };

  return (
    <Screen>
      <AppHeader title="Negocio" subtitle="Datos generales" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Field label="NOMBRE DEL NEGOCIO" value={nombre} onChange={setNombre} placeholder="Mi Tienda" delay={0} />
        <Field label="RUC" value={ruc} onChange={setRuc} placeholder="20XXXXXXXXX" delay={80} keyboard="numeric" maxLen={11} />
        <Field label="DIRECCIÓN" value={direccion} onChange={setDireccion} placeholder="Av. Lima 123" delay={160} />
        <Field label="TELÉFONO" value={telefono} onChange={setTelefono} placeholder="999 999 999" delay={240} keyboard="phone-pad" />
        <View style={{ height: 24 }} />
        <PressableButton label="Guardar" icon={Save} onPress={save} />
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  delay,
  keyboard,
  maxLen,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  delay: number;
  keyboard?: 'default' | 'numeric' | 'phone-pad';
  maxLen?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(280)} style={{ marginBottom: 10 }}>
      <Card>
        <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
          {label}
        </Text>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#A8B0AB"
          keyboardType={keyboard}
          maxLength={maxLen}
        />
      </Card>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  input: {
    fontFamily: 'Mulish_700Bold',
    fontSize: 16,
    color: '#0C0C0C',
    paddingVertical: 8,
  },
});
