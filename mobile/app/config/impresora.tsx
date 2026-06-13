// =============================================================================
// config/impresora.tsx — Configuración impresora Bluetooth térmica.
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bluetooth, Save } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import { AppHeader } from '@/components/ui/AppHeader';
import { ConfigItem } from '@/components/ui/ConfigItem';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastInfo, toastSuccess } from '@/services/toast';

const KEY = 'pos-impresora-config';

export default function ImpresoraConfig() {
  const [enabled, setEnabled] = useState(false);
  const [autoprint, setAutoprint] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const c = JSON.parse(v);
        setEnabled(c.enabled ?? false);
        setAutoprint(c.autoprint ?? true);
      }
    });
  }, []);

  return (
    <Screen>
      <AppHeader title="Impresora" subtitle="Bluetooth térmica" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.duration(280)}>
          <ConfigItem icon={Bluetooth} title="Activar impresión" description="Conecta una impresora térmica" switchValue={enabled} onSwitch={setEnabled} />
        </Animated.View>

        {enabled && (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(280)}>
              <ConfigItem title="Imprimir automáticamente" description="Al completar una venta" switchValue={autoprint} onSwitch={setAutoprint} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(160).duration(280)} style={{ marginTop: 8 }}>
              <PressableButton
                label="Buscar dispositivos"
                variant="outline"
                onPress={() => toastInfo({ title: 'Próximamente', message: 'Búsqueda bluetooth en construcción' })}
              />
            </Animated.View>
          </>
        )}

        <View style={{ height: 24 }} />
        <PressableButton
          label="Guardar"
          icon={Save}
          onPress={async () => {
            await AsyncStorage.setItem(KEY, JSON.stringify({ enabled, autoprint }));
            toastSuccess({ title: 'Guardado' });
          }}
        />
      </ScrollView>
    </Screen>
  );
}
