// =============================================================================
// (tabs)/ventas.tsx — Dashboard de reportes (Hoy / Mes / Inventario).
// =============================================================================

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Animated, { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowDownRight, ArrowUpRight, BarChart3, CircleAlert, Flame, Trophy, Wallet, WifiOff } from 'lucide-react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useNetworkStore } from '@/stores/network.store';
import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';
import { remoteLogger } from '@/services/remote-logger';
import { colors, fonts, radius, shadows } from '@/theme';

type Tab = 'hoy' | 'mes' | 'inventario';
const STALE_60S = 60_000;

export default function ReportesScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const sucursalId = usuario?.sucursal?.id;
  const [tab, setTab] = useState<Tab>('hoy');

  const { data: dashData, refetch: refetchDash, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['reportes-dashboard', sucursalId],
    queryFn: () => api.get('/reportes/dashboard', { params: { sucursalId: sucursalId || undefined } }).then((r) => r.data),
    enabled: isOnline,
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const dash = dashData?.data || {};

  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['reportes-top-productos', sucursalId],
    queryFn: () =>
      api.get('/reportes/productos/mas-vendidos', { params: { sucursalId: sucursalId || undefined, limit: 10 } }).then((r) => r.data),
    enabled: isOnline && tab === 'mes',
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const topProductos = extractList(topData);

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['reportes-inventario', sucursalId],
    queryFn: () => api.get('/reportes/inventario/valorizado', { params: { sucursalId: sucursalId || undefined } }).then((r) => r.data),
    enabled: isOnline && tab === 'inventario',
    staleTime: 2 * STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const inventario = invData?.data || {};

  const { data: ventasData, refetch: refetchVentas } = useQuery({
    queryKey: ['ventas-list', sucursalId, tab],
    queryFn: () => {
      const params: any = { limit: 30, sucursalId: sucursalId || undefined };
      if (tab === 'hoy') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.fechaDesde = today.toISOString();
      }
      return api.get('/ventas', { params }).then((r) => r.data);
    },
    enabled: isOnline && tab === 'hoy',
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const ventas = extractList(ventasData);

  useEffect(() => {
    if (dashError) {
      remoteLogger.error('dashboard_failed', dashError as any);
      toastError('Error', 'No se pudo cargar el dashboard');
    }
  }, [dashError]);

  const onRefresh = () => {
    refetchDash();
    refetchVentas();
  };

  const TabBtn = ({ k, label }: { k: Tab; label: string }) => {
    const active = tab === k;
    return (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setTab(k);
        }}
        style={[s.tab, active && s.tabActive]}
      >
        <Text style={[s.tabText, active && s.tabTextActive]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(260)} style={s.header}>
        <View style={s.headerIcon}>
          <BarChart3 color={colors.brand} size={20} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>ANALÍTICA</Text>
          <Text style={s.title}>Reportes</Text>
          {usuario?.sucursal?.nombre && <Text style={s.sucursal}>{usuario.sucursal.nombre}</Text>}
        </View>
      </Animated.View>

      <View style={s.tabsRow}>
        <TabBtn k="hoy" label="Hoy" />
        <TabBtn k="mes" label="Mes" />
        <TabBtn k="inventario" label="Inventario" />
      </View>

      {!isOnline && (
        <View style={s.offlineBanner}>
          <WifiOff color={colors.danger} size={14} strokeWidth={2.2} />
          <Text style={s.offlineText}>Modo offline · los reportes requieren conexión</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dashLoading} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {((tab === 'hoy' && dashLoading && !dashData) ||
          (tab === 'mes' && (dashLoading || topLoading) && !dashData) ||
          (tab === 'inventario' && invLoading && !invData)) && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={s.loadingText}>Cargando reportes…</Text>
          </View>
        )}

        {tab === 'hoy' && <RenderHoy dash={dash} ventas={ventas} />}
        {tab === 'mes' && <RenderMes dash={dash} topProductos={topProductos} />}
        {tab === 'inventario' && <RenderInventario dash={dash} inventario={inventario} />}
      </ScrollView>
    </View>
  );
}

function KpiBig({
  label,
  value,
  subtext,
  comp,
  tone = 'default',
}: {
  label: string;
  value: string;
  subtext?: string;
  comp?: number;
  tone?: 'default' | 'positive';
}) {
  const bg = tone === 'positive' ? colors.brandTint : colors.surface;
  const border = tone === 'positive' ? colors.brandSoft : colors.divider;
  return (
    <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))} style={[k.bigCard, { backgroundColor: bg, borderColor: border }]}>
      <Text style={k.bigLabel}>{label}</Text>
      <Text style={[k.bigValue, tone === 'positive' && { color: colors.brandDark }]}>{value}</Text>
      <View style={k.bigFooter}>
        {subtext && <Text style={k.bigSubtext}>{subtext}</Text>}
        {comp !== undefined && comp !== 0 && (
          <View style={[k.compBadge, { backgroundColor: comp > 0 ? colors.brandTint : colors.dangerSoft }]}>
            {comp > 0 ? <ArrowUpRight color={colors.brandDark} size={12} strokeWidth={2.4} /> : <ArrowDownRight color={colors.danger} size={12} strokeWidth={2.4} />}
            <Text style={[k.compText, { color: comp > 0 ? colors.brandDark : colors.danger }]}>{Math.abs(comp).toFixed(1)}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function KpiSmall({ label, value }: { label: string; value: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))} style={k.smallCard}>
      <Text style={k.smallLabel}>{label}</Text>
      <Text style={k.smallValue}>{value}</Text>
    </Animated.View>
  );
}

function RenderHoy({ dash, ventas }: { dash: any; ventas: any[] }) {
  const ventasHoy = Number(dash?.hoy?.ventas || 0);
  const cantHoy = dash?.hoy?.cantidad || 0;
  const compAyer = dash?.hoy?.comparacionAyer || 0;
  const cajaAbierta = dash?.cajaActual?.abierta;
  const efectivoCaja = Number(dash?.cajaActual?.efectivoActual || 0);
  return (
    <>
      <KpiBig label="VENTAS DE HOY" value={`S/ ${ventasHoy.toFixed(2)}`} subtext={`${cantHoy} venta${cantHoy !== 1 ? 's' : ''}`} comp={compAyer} />
      <Animated.View entering={FadeInDown.delay(80).duration(280)} style={u.cajaCard}>
        <View style={u.cajaIcon}>
          <Wallet color={colors.brand} size={20} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={u.cajaLabel}>{cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}</Text>
          <Text style={u.cajaValue}>S/ {efectivoCaja.toFixed(2)}</Text>
          <Text style={u.cajaDesc}>Efectivo en caja</Text>
        </View>
        <View style={[u.statusDot, { backgroundColor: cajaAbierta ? colors.brand : colors.danger }]} />
      </Animated.View>

      {(dash?.alertas?.stockBajo > 0 || dash?.alertas?.sinStock > 0) && (
        <Animated.View entering={FadeInDown.delay(120).duration(280)} style={u.alertCard}>
          <CircleAlert color={colors.warningText} size={18} strokeWidth={2.2} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={u.alertTitle}>Alertas de inventario</Text>
            <Text style={u.alertDesc}>
              {dash?.alertas?.sinStock > 0 && `${dash.alertas.sinStock} sin stock`}
              {dash?.alertas?.sinStock > 0 && dash?.alertas?.stockBajo > 0 && ' · '}
              {dash?.alertas?.stockBajo > 0 && `${dash.alertas.stockBajo} con stock bajo`}
            </Text>
          </View>
        </Animated.View>
      )}

      {dash?.topProductosHoy?.length > 0 && (
        <View style={u.section}>
          <View style={u.sectionHeader}>
            <Flame color={colors.brand} size={16} strokeWidth={2.4} />
            <Text style={u.sectionTitle}>MÁS VENDIDOS HOY</Text>
          </View>
          {dash.topProductosHoy.slice(0, 5).map((p: any, i: number) => (
            <TopRow key={i} rank={i + 1} name={p.nombre} qty={p.cantidad} monto={Number(p.monto)} />
          ))}
        </View>
      )}

      {ventas.length > 0 && (
        <View style={u.section}>
          <View style={u.sectionHeader}>
            <Text style={u.sectionTitle}>VENTAS DE HOY</Text>
          </View>
          {ventas.map((v: any) => (
            <View key={v.id} style={u.ventaRow}>
              <View style={{ flex: 1 }}>
                <Text style={u.ventaNum}>{v.numeroVenta || v.numero}</Text>
                <Text style={u.ventaTime}>{new Date(v.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={u.ventaTotal}>S/ {Number(v.total).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function RenderMes({ dash, topProductos }: { dash: any; topProductos: any[] }) {
  const ventasMes = Number(dash?.mes?.ventas || 0);
  const cantMes = dash?.mes?.cantidad || 0;
  const compMes = dash?.mes?.comparacionMesAnterior || 0;
  const promedio = cantMes > 0 ? ventasMes / cantMes : 0;
  return (
    <>
      <KpiBig label="VENTAS DEL MES" value={`S/ ${ventasMes.toFixed(2)}`} subtext={`${cantMes} venta${cantMes !== 1 ? 's' : ''}`} comp={compMes} />
      <View style={k.row}>
        <KpiSmall label="Ticket promedio" value={`S/ ${promedio.toFixed(2)}`} />
        <KpiSmall label="Total ventas" value={String(cantMes)} />
      </View>

      {topProductos.length > 0 && (
        <View style={u.section}>
          <View style={u.sectionHeader}>
            <Trophy color={colors.brand} size={16} strokeWidth={2.4} />
            <Text style={u.sectionTitle}>MÁS VENDIDOS DEL MES</Text>
          </View>
          {topProductos.slice(0, 10).map((p: any, i: number) => (
            <TopRow
              key={i}
              rank={i + 1}
              name={p.producto?.nombre || p.nombre || 'Producto'}
              qty={p.cantidadVendida || p.cantidad || 0}
              monto={Number(p.totalVendido || p.monto || 0)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function RenderInventario({ dash, inventario }: { dash: any; inventario: any }) {
  const total = inventario?.totalProductos || 0;
  const valorTotal = Number(inventario?.valorTotalCosto || 0);
  const valorVenta = Number(inventario?.valorTotalVenta || 0);
  const ganancia = valorVenta - valorTotal;
  return (
    <>
      <KpiBig label="VALOR DEL INVENTARIO" value={`S/ ${valorTotal.toFixed(2)}`} subtext="Costo total" />
      <View style={k.row}>
        <KpiSmall label="Productos" value={String(total)} />
        <KpiSmall label="Valor en venta" value={`S/ ${valorVenta.toFixed(2)}`} />
      </View>
      <KpiBig label="GANANCIA POTENCIAL" value={`S/ ${ganancia.toFixed(2)}`} subtext="Si vendes todo el stock" tone="positive" />
      <Animated.View entering={FadeInDown.delay(180).duration(280)} style={u.alertCard}>
        <CircleAlert color={colors.warningText} size={18} strokeWidth={2.2} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={u.alertTitle}>Alertas de stock</Text>
          <Text style={u.alertDesc}>
            {dash?.alertas?.sinStock || 0} sin stock · {dash?.alertas?.stockBajo || 0} con stock bajo
          </Text>
        </View>
      </Animated.View>
    </>
  );
}

function TopRow({ rank, name, qty, monto }: { rank: number; name: string; qty: number; monto: number }) {
  return (
    <View style={u.topRow}>
      <View style={u.topRank}>
        <Text style={u.topRankText}>{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={u.topName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={u.topQty}>{qty} unidades</Text>
      </View>
      <Text style={u.topMonto}>S/ {monto.toFixed(2)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, gap: 12 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandSoft,
  },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4 },
  title: { fontFamily: fonts.black, fontSize: 24, color: colors.text, letterSpacing: -0.4, marginTop: 2 },
  sucursal: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.brand, marginTop: 3, letterSpacing: 0.2 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 4, gap: 8 },
  tab: { flex: 1, height: 42, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.divider },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: '#FFFFFF', fontFamily: fonts.extrabold },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  offlineText: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 12.5 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
});

const k = StyleSheet.create({
  bigCard: { borderRadius: radius.xl, padding: 20, marginBottom: 12, borderWidth: 1, ...shadows.soft },
  bigLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.4, marginBottom: 8 },
  bigValue: { fontFamily: fonts.black, fontSize: 34, color: colors.text, letterSpacing: -0.8 },
  bigFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  bigSubtext: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textMuted },
  compBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  compText: { fontFamily: fonts.extrabold, fontSize: 11.5 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  smallCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.divider, ...shadows.soft },
  smallLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.2, marginBottom: 6 },
  smallValue: { fontFamily: fonts.black, fontSize: 19, color: colors.text, letterSpacing: -0.3 },
});

const u = StyleSheet.create({
  cajaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.soft,
  },
  cajaIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cajaLabel: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.textSubtle, letterSpacing: 1.2 },
  cajaValue: { fontFamily: fonts.black, fontSize: 19, color: colors.text, marginTop: 1 },
  cajaDesc: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  alertTitle: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.warningText },
  alertDesc: { fontFamily: fonts.semibold, fontSize: 12, color: colors.warningText, marginTop: 2, opacity: 0.85 },

  section: { marginTop: 6, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, letterSpacing: 1.4 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  topRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brandTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  topRankText: { color: colors.brandDark, fontFamily: fonts.black, fontSize: 13 },
  topName: { fontFamily: fonts.extrabold, fontSize: 13.5, color: colors.text },
  topQty: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textSubtle, marginTop: 1 },
  topMonto: { fontFamily: fonts.black, fontSize: 14, color: colors.brand },

  ventaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  ventaNum: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text, letterSpacing: 0.2 },
  ventaTime: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.textSubtle, marginTop: 1 },
  ventaTotal: { fontFamily: fonts.black, fontSize: 14, color: colors.brand },
});
