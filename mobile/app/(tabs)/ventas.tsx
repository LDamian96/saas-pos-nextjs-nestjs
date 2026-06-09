// =============================================================================
// (tabs)/ventas.tsx — Reportes y ventas del día.
// =============================================================================

import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import { Receipt, TrendingUp, Wallet } from 'lucide-react-native';
import { Text } from 'tamagui';

import api from '@/api/client';
import { extractList } from '@/api/helpers';
import { Card } from '@/components/ui/Card';

export default function VentasScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: resumenData } = useQuery({
    queryKey: ['ventas', 'resumen-dia'],
    queryFn: () =>
      api
        .get('/ventas/resumen-dia')
        .then((r) => r.data?.data ?? r.data)
        .catch(() => null),
  });
  const { data: ventasData } = useQuery({
    queryKey: ['ventas', 'lista'],
    queryFn: () => api.get('/ventas', { params: { limit: 30 } }).then((r) => r.data),
  });

  const ventas = extractList(ventasData);
  const totalDia = Number(resumenData?.total ?? 0);
  const countDia = Number(resumenData?.cantidad ?? ventas.length);
  const cobrosEfectivo = Number(resumenData?.efectivo ?? 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ventas', 'resumen-dia'] }),
      queryClient.invalidateQueries({ queryKey: ['ventas', 'lista'] }),
    ]);
    setRefreshing(false);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(220)} style={s.header}>
        <Text fontFamily="$body" fontSize={13} color="$colorMuted" fontWeight="600">
          Resumen del día
        </Text>
        <Text fontFamily="$body" fontSize={22} fontWeight="900" color="$color" letterSpacing={-0.4}>
          Reportes
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00932C" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero card ──────────────────── */}
        <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))} style={s.hero}>
          <Text fontFamily="$body" fontSize={11} fontWeight="800" color="rgba(255,255,255,0.7)" letterSpacing={1.4}>
            VENTAS DE HOY
          </Text>
          <Text fontFamily="$body" fontSize={42} fontWeight="900" color="#FFFFFF" marginTop={6} letterSpacing={-1.2}>
            S/ {totalDia.toFixed(2)}
          </Text>
          <Text fontFamily="$body" fontSize={13} color="rgba(255,255,255,0.7)" marginTop={4}>
            {countDia} venta{countDia === 1 ? '' : 's'}
          </Text>
        </Animated.View>

        {/* ─── Stat row ───────────────────── */}
        <View style={s.statRow}>
          <Animated.View entering={FadeInDown.delay(80).duration(260)} style={{ flex: 1 }}>
            <Card style={s.statCard}>
              <View style={s.statIcon}>
                <Wallet color="#00932C" size={18} strokeWidth={2.2} />
              </View>
              <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2} marginTop={10}>
                EFECTIVO
              </Text>
              <Text fontFamily="$body" fontSize={18} fontWeight="900" color="$color" marginTop={2}>
                S/ {cobrosEfectivo.toFixed(2)}
              </Text>
            </Card>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(160).duration(260)} style={{ flex: 1 }}>
            <Card style={s.statCard}>
              <View style={s.statIcon}>
                <TrendingUp color="#00932C" size={18} strokeWidth={2.2} />
              </View>
              <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorSubtle" letterSpacing={1.2} marginTop={10}>
                DIGITAL
              </Text>
              <Text fontFamily="$body" fontSize={18} fontWeight="900" color="$color" marginTop={2}>
                S/ {(totalDia - cobrosEfectivo).toFixed(2)}
              </Text>
            </Card>
          </Animated.View>
        </View>

        {/* ─── Lista de ventas ─────────────── */}
        <View style={{ marginTop: 20 }}>
          <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$color" marginBottom={10}>
            Últimas ventas
          </Text>
          {ventas.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Receipt color="#A8B0AB" size={32} strokeWidth={1.6} />
              <Text fontFamily="$body" color="$colorMuted" marginTop={10} fontWeight="600">
                Aún sin ventas
              </Text>
            </Card>
          ) : (
            ventas.map((v, i) => (
              <Animated.View key={v.id ?? i} entering={FadeInDown.delay(i * 30).duration(220)} style={{ marginBottom: 8 }}>
                <Card padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={s.ventaIcon}>
                      <Receipt color="#00932C" size={18} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$color">
                        #{v.numeroVenta ?? v.numero ?? '—'}
                      </Text>
                      <Text fontFamily="$body" fontSize={11} color="$colorMuted" fontWeight="600" marginTop={2}>
                        {new Date(v.createdAt ?? v.fechaVenta ?? Date.now()).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text fontFamily="$body" fontSize={16} fontWeight="900" color="#00932C">
                      S/ {Number(v.total ?? 0).toFixed(2)}
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  content: { padding: 16, paddingBottom: 100 },

  hero: {
    backgroundColor: '#00932C',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#00932C',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  statRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: { padding: 14 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ventaIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
