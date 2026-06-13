// =============================================================================
// config/comprobantes.tsx — Activar tipos de comprobante (Ticket/Boleta/Factura).
// =============================================================================

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FileSpreadsheet, FileText, Receipt, Save } from 'lucide-react-native';
import { Text } from '@/components/ui/PText';

import { AppHeader } from '@/components/ui/AppHeader';
import { ConfigItem } from '@/components/ui/ConfigItem';
import { PressableButton } from '@/components/ui/PressableButton';
import { Screen } from '@/components/ui/Screen';
import { toastSuccess } from '@/services/toast';

const KEY = 'pos-negocio-config';

export default function ComprobantesConfig() {
  const [ticket, setTicket] = useState(true);
  const [boleta, setBoleta] = useState(true);
  const [factura, setFactura] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) {
        const c = JSON.parse(v);
        setTicket(c.ticket ?? true);
        setBoleta(c.boleta ?? true);
        setFactura(c.factura ?? false);
      }
    });
  }, []);

  return (
    <Screen>
      <AppHeader title="Comprobantes" subtitle="Qué tipos emites" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$colorMuted" marginBottom={12}>
          Activa los comprobantes que vas a emitir
        </Text>
        <Animated.View entering={FadeInDown.duration(280)}>
          <ConfigItem icon={Receipt} title="Ticket" description="Comprobante interno simple" switchValue={ticket} onSwitch={setTicket} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(280)}>
          <ConfigItem icon={FileText} title="Boleta de venta" description="Para clientes con DNI" switchValue={boleta} onSwitch={setBoleta} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(160).duration(280)}>
          <ConfigItem icon={FileSpreadsheet} title="Factura" description="Para empresas con RUC" switchValue={factura} onSwitch={setFactura} />
        </Animated.View>

        <View style={{ height: 24 }} />
        <PressableButton
          label="Guardar"
          icon={Save}
          onPress={async () => {
            await AsyncStorage.setItem(KEY, JSON.stringify({ ticket, boleta, factura }));
            toastSuccess({ title: 'Guardado' });
          }}
        />
      </ScrollView>
    </Screen>
  );
}
