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
  // Offset de dia para "Hoy": 0 = hoy, -1 = ayer, -7 = hace 1 semana
  const [dayOffset, setDayOffset] = useState<number>(0);
  const selectedDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const isToday = dayOffset === 0;

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

  // Productos con stock bajo/sin stock - solo cuando tab es inventario
  const { data: stockBajoData } = useQuery({
    queryKey: ['inventario-stock-bajo', sucursalId],
    queryFn: () => api.get('/inventario/stock-bajo', { params: { sucursalId: sucursalId || undefined } }).then(r => r.data),
    enabled: isOnline && tab === 'inventario',
    staleTime: 2 * STALE_60S,
    refetchOnWindowFocus: false,
  });

  // Ventas detalle del dia seleccionado en tab "hoy"
  const { data: ventasData, refetch: refetchVentas, isLoading: ventasLoading } = useQuery({
    queryKey: ['ventas-list', sucursalId, tab, dayOffset],
    queryFn: () => {
      const params: any = { limit: 100, sucursalId: sucursalId || undefined };
      if (tab === 'hoy') {
        const desde = new Date(selectedDate);
        const hasta = new Date(selectedDate);
        hasta.setDate(hasta.getDate() + 1);
        params.fechaDesde = desde.toISOString();
        params.fechaHasta = hasta.toISOString();
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
    // Si es hoy, usa los KPIs del dashboard (ventasHoy). Si es otro dia, calcula desde la lista
    const totalVentas = isToday
      ? Number(dash?.hoy?.ventas || 0)
      : ventas.reduce((acc: number, v: any) => acc + Number(v.total || 0), 0);
    const cantVentas = isToday ? (dash?.hoy?.cantidad || 0) : ventas.length;
    const compAyer = isToday ? (dash?.hoy?.comparacionAyer || 0) : 0;
    const cajaAbierta = dash?.cajaActual?.abierta;
    const efectivoCaja = Number(dash?.cajaActual?.efectivoActual || 0);

    // Desglose por metodo de pago del dia
    const porMetodo = new Map<string, { monto: number; count: number }>();
    ventas.forEach((v: any) => {
      (v.pagos || []).forEach((p: any) => {
        const k = (p.metodoPago?.nombre || p.nombre || 'Otro').toString();
        const cur = porMetodo.get(k) || { monto: 0, count: 0 };
        cur.monto += Number(p.monto || 0);
        cur.count += 1;
        porMetodo.set(k, cur);
      });
    });
    const metodosArray = Array.from(porMetodo.entries()).map(([nombre, d]) => ({ nombre, ...d }));

    return (
      <>
        {/* Selector de dia */}
        <View style={s.dayNav}>
          <TouchableOpacity style={s.dayNavBtn} onPress={() => setDayOffset(dayOffset - 1)} activeOpacity={0.7}>
            <Text style={s.dayNavArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.dayNavLabel}>
              {isToday ? 'HOY' : dayOffset === -1 ? 'AYER' : selectedDate.toLocaleDateString('es-PE', { weekday: 'long' }).toUpperCase()}
            </Text>
            <Text style={s.dayNavDate}>
              {selectedDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.dayNavBtn, isToday && s.dayNavBtnDisabled]}
            onPress={() => !isToday && setDayOffset(dayOffset + 1)}
            disabled={isToday}
            activeOpacity={0.7}
          >
            <Text style={[s.dayNavArrow, isToday && { color: '#cbd5e1' }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Atajos rapidos */}
        <View style={s.dayShortcuts}>
          {[
            { label: 'Hoy', value: 0 },
            { label: 'Ayer', value: -1 },
            { label: '7 dias', value: -7 },
            { label: '15 dias', value: -15 },
            { label: '30 dias', value: -30 },
          ].map((o) => (
            <TouchableOpacity
              key={o.label}
              style={[s.dayChip, dayOffset === o.value && s.dayChipActive]}
              onPress={() => setDayOffset(o.value)}
              activeOpacity={0.7}
            >
              <Text style={[s.dayChipText, dayOffset === o.value && s.dayChipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPI total del dia */}
        <View style={s.kpiBigCard}>
          <Text style={s.kpiBigLabel}>VENTAS DEL DIA</Text>
          <Text style={s.kpiBigValue}>S/ {totalVentas.toFixed(2)}</Text>
          <View style={s.kpiBigFooter}>
            <Text style={s.kpiBigSubtext}>{cantVentas} venta{cantVentas !== 1 ? 's' : ''}</Text>
            {isToday && compAyer !== 0 && (
              <View style={[s.compBadge, { backgroundColor: compAyer > 0 ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[s.compText, { color: compAyer > 0 ? '#16a34a' : '#dc2626' }]}>
                  {compAyer > 0 ? '↑' : '↓'} {Math.abs(compAyer).toFixed(1)}% vs ayer
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Desglose por metodo de pago */}
        {metodosArray.length > 0 && (
          <View style={s.metodosCard}>
            <Text style={s.metodosTitle}>POR METODO DE PAGO</Text>
            {metodosArray.map((m, i) => {
              const isEf = /efect/i.test(m.nombre);
              const isYa = /yape/i.test(m.nombre);
              const emoji = isEf ? '💵' : isYa ? '📱' : '💳';
              const color = isEf ? '#16a34a' : isYa ? '#7c3aed' : '#0891b2';
              return (
                <View key={i} style={s.metodoRow}>
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.metodoNombre}>{m.nombre}</Text>
                    <Text style={s.metodoCount}>{m.count} pago{m.count !== 1 ? 's' : ''}</Text>
                  </View>
                  <Text style={[s.metodoMonto, { color }]}>S/ {m.monto.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}

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

        {/* Top productos del dia */}
        {isToday && dash?.topProductosHoy?.length > 0 && (
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

        {/* Lista de ventas del dia */}
        {ventas.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>📋 Ventas {isToday ? 'de hoy' : 'del dia'}</Text>
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
        ) : (
          !ventasLoading && (
            <View style={s.emptyDay}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📭</Text>
              <Text style={s.emptyDayText}>Sin ventas {isToday ? 'hoy' : 'este dia'}</Text>
            </View>
          )
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
    const resumen = inventario?.resumen || {};
    const totalProductos = Number(resumen?.totalProductos || 0);
    const totalUnidades = Number(resumen?.totalUnidades || 0);
    const sinStock = Number(dash?.alertas?.sinStock || 0);
    const stockBajo = Number(dash?.alertas?.stockBajo || 0);
    const stockOk = Math.max(0, totalProductos - sinStock - stockBajo);
    const productosCriticos: any[] = stockBajoData?.data || stockBajoData?.items || extractList(stockBajoData);

    return (
      <>
        {/* Card principal: total unidades */}
        <View style={s.kpiBigCard}>
          <Text style={s.kpiBigLabel}>UNIDADES EN STOCK</Text>
          <Text style={s.kpiBigValue}>{totalUnidades.toLocaleString('es-PE')}</Text>
          <Text style={s.kpiBigSubtext}>de {totalProductos} productos diferentes</Text>
        </View>

        {/* 3 cards de estado: OK, stock bajo, sin stock */}
        <View style={s.stockRow}>
          <View style={[s.stockCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={{ fontSize: 22 }}>✅</Text>
            <Text style={[s.stockValue, { color: '#16a34a' }]}>{stockOk}</Text>
            <Text style={s.stockLabel}>OK</Text>
          </View>
          <View style={[s.stockCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <Text style={{ fontSize: 22 }}>⚠️</Text>
            <Text style={[s.stockValue, { color: '#d97706' }]}>{stockBajo}</Text>
            <Text style={s.stockLabel}>Stock bajo</Text>
          </View>
          <View style={[s.stockCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={{ fontSize: 22 }}>🚨</Text>
            <Text style={[s.stockValue, { color: '#dc2626' }]}>{sinStock}</Text>
            <Text style={s.stockLabel}>Sin stock</Text>
          </View>
        </View>

        {/* Lista de productos criticos */}
        {productosCriticos.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚠️ Necesitan reposicion</Text>
            {productosCriticos.slice(0, 20).map((p: any) => {
              const stock = Number(p.stock ?? p.variantes?.[0]?.stock ?? 0);
              const minimo = Number(p.stockMinimo ?? p.variantes?.[0]?.stockMinimo ?? 5);
              const critico = stock === 0;
              return (
                <View key={p.id} style={s.criticRow}>
                  <View style={[s.criticDot, { backgroundColor: critico ? '#dc2626' : '#d97706' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.criticName} numberOfLines={1}>{p.nombre || p.producto?.nombre}</Text>
                    <Text style={s.criticSku}>{p.sku || p.producto?.sku}</Text>
                  </View>
                  <View style={s.criticStock}>
                    <Text style={[s.criticStockN, { color: critico ? '#dc2626' : '#d97706' }]}>{stock}</Text>
                    <Text style={s.criticStockMin}>min {minimo}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {totalProductos === 0 && (
          <View style={s.emptyInv}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>📦</Text>
            <Text style={s.emptyInvText}>Aun no hay productos cargados</Text>
          </View>
        )}
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
          { key: 'hoy' as const, label: 'Dia' },
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

  // Day navigator (atras / fecha / adelante)
  dayNav: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 16, padding: 8,
    marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  dayNavBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#faf5ff', alignItems: 'center', justifyContent: 'center',
  },
  dayNavBtnDisabled: { backgroundColor: '#f8fafc' },
  dayNavArrow: { fontSize: 26, color: '#7c3aed', fontWeight: '700', marginTop: -3 },
  dayNavLabel: { fontSize: 11, fontWeight: '800', color: '#7c3aed', letterSpacing: 1.5 },
  dayNavDate: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 2 },

  // Shortcuts
  dayShortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  dayChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  dayChipTextActive: { color: '#ffffff', fontWeight: '700' },

  // Metodos de pago desglose
  metodosCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  metodosTitle: { fontSize: 10, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 10 },
  metodoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  metodoNombre: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  metodoCount: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  metodoMonto: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },

  // Empty day
  emptyDay: { alignItems: 'center', paddingVertical: 40 },
  emptyDayText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },

  // Inventario: 3 cards de stock
  stockRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stockCard: {
    flex: 1, padding: 14, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center',
  },
  stockValue: { fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  stockLabel: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },

  // Productos criticos
  criticRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: 12, padding: 12,
    marginBottom: 6, elevation: 1, gap: 10,
  },
  criticDot: { width: 8, height: 8, borderRadius: 4 },
  criticName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  criticSku: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  criticStock: { alignItems: 'flex-end', minWidth: 50 },
  criticStockN: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  criticStockMin: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

  // Empty inventario
  emptyInv: { alignItems: 'center', paddingVertical: 40 },
  emptyInvText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },

  // Alert row (no usado, reemplazado por stockRow pero mantenido por compat)
  alertRow: { flexDirection: 'row', gap: 10 },
  alertCardSmall: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center',
  },
  alertValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  alertLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },

  // Categoria desglose (no usado, mantenido por compat)
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, elevation: 1 },
  catName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  catUnits: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  catValue: { fontSize: 14, fontWeight: 'bold', color: '#7c3aed' },
});
