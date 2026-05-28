import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useNetworkStore } from '@/stores/network.store';
import api from '@/api/client';
import { extractList, toastError } from '@/api/helpers';

type Tab = 'hoy' | 'mes' | 'inventario';

const STALE_60S = 60_000;

export default function ReportesScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const sucursalId = usuario?.sucursal?.id;
  const [tab, setTab] = useState<Tab>('hoy');

  // Dashboard KPIs - cache 1 min, no se recarga al cambiar tab
  const { data: dashData, refetch: refetchDash, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['reportes-dashboard', sucursalId],
    queryFn: () => api.get('/reportes/dashboard', { params: { sucursalId: sucursalId || undefined } }).then(r => r.data),
    enabled: isOnline,
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const dash = dashData?.data || {};

  // Top productos - solo cuando tab es mes
  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['reportes-top-productos', sucursalId],
    queryFn: () => api.get('/reportes/productos/mas-vendidos', { params: { sucursalId: sucursalId || undefined, limit: 10 } }).then(r => r.data),
    enabled: isOnline && tab === 'mes',
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const topProductos = extractList(topData);

  // Inventario valorizado - solo cuando tab es inventario
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['reportes-inventario', sucursalId],
    queryFn: () => api.get('/reportes/inventario/valorizado', { params: { sucursalId: sucursalId || undefined } }).then(r => r.data),
    enabled: isOnline && tab === 'inventario',
    staleTime: 2 * STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const inventario = invData?.data || {};

  // Ventas detalle - solo en tab "hoy"
  const { data: ventasData, refetch: refetchVentas, isLoading: ventasLoading } = useQuery({
    queryKey: ['ventas-list', sucursalId, tab],
    queryFn: () => {
      const params: any = { limit: 30, sucursalId: sucursalId || undefined };
      if (tab === 'hoy') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.fechaDesde = today.toISOString();
      }
      return api.get('/ventas', { params }).then(r => r.data);
    },
    enabled: isOnline && tab === 'hoy',
    staleTime: STALE_60S,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const ventas = extractList(ventasData);

  useEffect(() => {
    if (dashError) toastError('Error', 'No se pudo cargar el dashboard');
  }, [dashError]);

  const onRefresh = () => {
    refetchDash();
    refetchVentas();
  };

  const renderHoy = () => {
    const ventasHoy = Number(dash?.hoy?.ventas || 0);
    const cantHoy = dash?.hoy?.cantidad || 0;
    const compAyer = dash?.hoy?.comparacionAyer || 0;
    const cajaAbierta = dash?.cajaActual?.abierta;
    const efectivoCaja = Number(dash?.cajaActual?.efectivoActual || 0);

    return (
      <>
        {/* KPIs principales */}
        <View style={s.kpiBigCard}>
          <Text style={s.kpiBigLabel}>VENTAS DE HOY</Text>
          <Text style={s.kpiBigValue}>S/ {ventasHoy.toFixed(2)}</Text>
          <View style={s.kpiBigFooter}>
            <Text style={s.kpiBigSubtext}>{cantHoy} venta{cantHoy !== 1 ? 's' : ''}</Text>
            {compAyer !== 0 && (
              <View style={[s.compBadge, { backgroundColor: compAyer > 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.compText, { color: compAyer > 0 ? '#16a34a' : '#dc2626' }]}>
                  {compAyer > 0 ? '↑' : '↓'} {Math.abs(compAyer).toFixed(1)}% vs ayer
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Caja actual */}
        <View style={s.cajaCard}>
          <View style={s.cajaIconWrap}>
            <Text style={{ fontSize: 28 }}>💰</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cajaLabel}>{cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}</Text>
            <Text style={s.cajaValue}>S/ {efectivoCaja.toFixed(2)}</Text>
            <Text style={s.cajaDesc}>Efectivo en caja</Text>
          </View>
          <View style={[s.cajaDot, { backgroundColor: cajaAbierta ? '#16a34a' : '#dc2626' }]} />
        </View>

        {/* Alertas */}
        {(dash?.alertas?.stockBajo > 0 || dash?.alertas?.sinStock > 0) && (
          <View style={s.alertCard}>
            <Text style={{ fontSize: 22 }}>⚠️</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.alertTitle}>Alertas de inventario</Text>
              <Text style={s.alertDesc}>
                {dash?.alertas?.sinStock > 0 && `${dash.alertas.sinStock} sin stock`}
                {dash?.alertas?.sinStock > 0 && dash?.alertas?.stockBajo > 0 && ' · '}
                {dash?.alertas?.stockBajo > 0 && `${dash.alertas.stockBajo} con stock bajo`}
              </Text>
            </View>
          </View>
        )}

        {/* Top productos hoy */}
        {dash?.topProductosHoy?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔥 Mas vendidos hoy</Text>
            {dash.topProductosHoy.map((p: any, i: number) => (
              <View key={i} style={s.topRow}>
                <View style={s.topRank}>
                  <Text style={s.topRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.topName} numberOfLines={1}>{p.nombre}</Text>
                  <Text style={s.topQty}>{p.cantidad} unidades</Text>
                </View>
                <Text style={s.topMonto}>S/ {Number(p.monto).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Lista de ventas hoy */}
        {ventas.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 Ventas de hoy</Text>
            {ventas.map((v: any) => (
              <View key={v.id} style={s.ventaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.ventaNum}>{v.numeroVenta || v.numero}</Text>
                  <Text style={s.ventaTime}>
                    {new Date(v.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={s.ventaTotal}>S/ {Number(v.total).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderMes = () => {
    const ventasMes = Number(dash?.mes?.ventas || 0);
    const cantMes = dash?.mes?.cantidad || 0;
    const compMes = dash?.mes?.comparacionMesAnterior || 0;
    const promedioVenta = cantMes > 0 ? ventasMes / cantMes : 0;

    return (
      <>
        <View style={s.kpiBigCard}>
          <Text style={s.kpiBigLabel}>VENTAS DEL MES</Text>
          <Text style={s.kpiBigValue}>S/ {ventasMes.toFixed(2)}</Text>
          <View style={s.kpiBigFooter}>
            <Text style={s.kpiBigSubtext}>{cantMes} venta{cantMes !== 1 ? 's' : ''}</Text>
            {compMes !== 0 && (
              <View style={[s.compBadge, { backgroundColor: compMes > 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.compText, { color: compMes > 0 ? '#16a34a' : '#dc2626' }]}>
                  {compMes > 0 ? '↑' : '↓'} {Math.abs(compMes).toFixed(1)}% vs mes anterior
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiSmall}>
            <Text style={s.kpiSmallLabel}>Ticket promedio</Text>
            <Text style={s.kpiSmallValue}>S/ {promedioVenta.toFixed(2)}</Text>
          </View>
          <View style={s.kpiSmall}>
            <Text style={s.kpiSmallLabel}>Total ventas</Text>
            <Text style={s.kpiSmallValue}>{cantMes}</Text>
          </View>
        </View>

        {/* Top productos del mes */}
        {topProductos.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏆 Mas vendidos del mes</Text>
            {topProductos.slice(0, 10).map((p: any, i: number) => (
              <View key={i} style={s.topRow}>
                <View style={s.topRank}>
                  <Text style={s.topRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.topName} numberOfLines={1}>{p.producto?.nombre || p.nombre || 'Producto'}</Text>
                  <Text style={s.topQty}>{p.cantidadVendida || p.cantidad || 0} unidades</Text>
                </View>
                <Text style={s.topMonto}>S/ {Number(p.totalVendido || p.monto || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  const renderInventario = () => {
    const totalProductos = inventario?.totalProductos || 0;
    const valorTotal = Number(inventario?.valorTotalCosto || 0);
    const valorVenta = Number(inventario?.valorTotalVenta || 0);
    const gananciaPotencial = valorVenta - valorTotal;

    return (
      <>
        <View style={s.kpiBigCard}>
          <Text style={s.kpiBigLabel}>VALOR DEL INVENTARIO</Text>
          <Text style={s.kpiBigValue}>S/ {valorTotal.toFixed(2)}</Text>
          <Text style={s.kpiBigSubtext}>Costo total</Text>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiSmall}>
            <Text style={s.kpiSmallLabel}>Productos</Text>
            <Text style={s.kpiSmallValue}>{totalProductos}</Text>
          </View>
          <View style={s.kpiSmall}>
            <Text style={s.kpiSmallLabel}>Valor en venta</Text>
            <Text style={[s.kpiSmallValue, { fontSize: 16 }]}>S/ {valorVenta.toFixed(2)}</Text>
          </View>
        </View>

        <View style={[s.kpiBigCard, { backgroundColor: '#dcfce7', marginTop: 12 }]}>
          <Text style={[s.kpiBigLabel, { color: '#15803d' }]}>GANANCIA POTENCIAL</Text>
          <Text style={[s.kpiBigValue, { color: '#16a34a' }]}>S/ {gananciaPotencial.toFixed(2)}</Text>
          <Text style={[s.kpiBigSubtext, { color: '#16a34a' }]}>
            Si vendes todo el stock
          </Text>
        </View>

        <View style={s.alertCard}>
          <Text style={{ fontSize: 22 }}>⚠️</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.alertTitle}>Alertas de stock</Text>
            <Text style={s.alertDesc}>
              {dash?.alertas?.sinStock || 0} sin stock · {dash?.alertas?.stockBajo || 0} con stock bajo
            </Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Reportes</Text>
        {sucursalId && (
          <Text style={s.sucursal}>{usuario?.sucursal?.nombre}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {([
          { key: 'hoy' as const, label: 'Hoy' },
          { key: 'mes' as const, label: 'Mes' },
          { key: 'inventario' as const, label: 'Inventario' },
        ]).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isOnline && (
        <View style={s.offlineBanner}>
          <Text style={s.offlineText}>📡 Modo offline · los reportes requieren conexion</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dashLoading} onRefresh={onRefresh} tintColor="#7c3aed" />}
      >
        {/* Loading inicial visible */}
        {(tab === 'hoy' && dashLoading && !dashData) ||
        (tab === 'mes' && (dashLoading || topLoading) && !dashData) ||
        (tab === 'inventario' && invLoading && !invData) ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={s.loadingText}>Cargando reportes...</Text>
          </View>
        ) : null}

        {tab === 'hoy' && renderHoy()}
        {tab === 'mes' && renderMes()}
        {tab === 'inventario' && renderInventario()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  sucursal: { fontSize: 13, color: '#7c3aed', fontWeight: '600', marginTop: 2 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingBottom: 100 },

  offlineBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  offlineText: { color: '#b91c1c', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  loadingWrap: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },

  kpiBigCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  kpiBigLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 6 },
  kpiBigValue: { fontSize: 36, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  kpiBigSubtext: { fontSize: 13, color: '#6b7280' },
  kpiBigFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  compBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  compText: { fontSize: 12, fontWeight: '700' },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  kpiSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  kpiSmallLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  kpiSmallValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

  cajaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    gap: 4,
  },
  cajaIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cajaLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  cajaValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cajaDesc: { fontSize: 11, color: '#6b7280' },
  cajaDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  alertDesc: { fontSize: 12, color: '#a16207', marginTop: 2 },

  section: { marginTop: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 10 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    elevation: 1,
  },
  topRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  topRankText: { color: '#7c3aed', fontWeight: 'bold', fontSize: 13 },
  topName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  topQty: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  topMonto: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },

  ventaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    elevation: 1,
  },
  ventaNum: { fontSize: 13, fontWeight: '600', color: '#111827' },
  ventaTime: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  ventaTotal: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },
});
