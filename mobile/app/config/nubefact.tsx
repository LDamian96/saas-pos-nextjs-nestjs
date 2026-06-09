// =============================================================================
// config/nubefact.tsx — Credenciales NubeFact (SUNAT).
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FileSpreadsheet, Save } from 'lucide-react-native';
import { Text } from 'tamagui';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastSuccess } from '@/services/toast';

const KEY = 'pos-nubefact-config';

export default function NubefactConfig() {
  const [token, setToken] = useState('');
  const [ruc, setRuc] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const c = JSON.parse(v);
        setToken(c.token ?? '');
        setRuc(c.ruc ?? '');
      }
    });
  }, []);

  return (
    <Screen>
      <AppHeader title="NubeFact" subtitle="Facturación electrónica SUNAT" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(280)} style={s.hero}>
          <FileSpreadsheet color="#FFFFFF" size={36} strokeWidth={2.2} />
          <Text fontFamily="$body" fontSize={16} fontWeight="800" color="#FFFFFF" marginTop={12}>
            Conecta con NubeFact
          </Text>
          <Text fontFamily="$body" fontSize={12} color="rgba(255,255,255,0.85)" marginTop={4} textAlign="center">
            Crea tu cuenta en nubefact.com y pega aquí tu token
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(280)} style={{ marginTop: 20 }}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              RUC DEL NEGOCIO
            </Text>
            <TextInput style={s.input} value={ruc} onChangeText={setRuc} placeholder="20XXXXXXXXX" keyboardType="numeric" maxLength={11} placeholderTextColor="#A8B0AB" />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(280)} style={{ marginTop: 10 }}>
          <Card>
            <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2}>
              TOKEN NUBEFACT
            </Text>
            <TextInput style={s.input} value={token} onChangeText={setToken} placeholder="Tu token de API" placeholderTextColor="#A8B0AB" autoCapitalize="none" />
          </Card>
        </Animated.View>

        <View style={{ height: 24 }} />
        <PressableButton
          label="Guardar credenciales"
          icon={Save}
          onPress={async () => {
            await AsyncStorage.setItem(KEY, JSON.stringify({ token, ruc }));
            toastSuccess({ title: 'Guardado' });
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: '#00932C', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#00932C', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  input: { fontFamily: 'Mulish_700Bold', fontSize: 16, color: '#0C0C0C', paddingVertical: 8 },
});
