import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePosStore } from '@/stores/pos.store';
import { useAuthStore } from '@/stores/auth.store';
import { getSelectedPrinter, printTicket } from '@/services/printer.service';
import { toastSuccess, toastError } from '@/api/helpers';

const EMOJI: Record<string, string> = {
  efectivo: '💵', tarjeta: '💳', yape: '📱', plin: '📱', transferencia: '🏦',
};

export default function CobrarExitoScreen() {
  const insets = useSafeAreaInsets();
  const { lastVenta, reset } = usePosStore();
  const { usuario } = useAuthStore();
  const ventaTotal = Number(lastVenta?.total || 0);
  const isOffline = lastVenta?.offline;
  const [printing, setPrinting] = useState(false);
  const [hasPrinter, setHasPrinter] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const items = lastVenta?._cart || lastVenta?.items || [];
  const pagos = lastVenta?._pagos || [];
  const fecha = new Date();

  useEffect(() => {
    getSelectedPrinter().then((p) => setHasPrinter(!!p));
    AsyncStorage.getItem('pos-negocio-config').then((val) => {
      if (val) { try { setWhatsappEnabled(JSON.parse(val).whatsapp !== false); } catch {} }
    });
  }, []);

  const handleWhatsApp = () => {
    let msg = `*${usuario?.empresa?.nombre || 'POS Shop'}*\n`;
    msg += `Venta: ${lastVenta?.numeroVenta || ''}\n`;
    msg += `Fecha: ${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}\n\n`;
    items.forEach((i: any) => {
      msg += `${i.nombre} x${i.cantidad} — S/ ${(Number(i.precio || i.precioUnitario || 0) * i.cantidad).toFixed(2)}\n`;
    });
    msg += `\n*TOTAL: S/ ${ventaTotal.toFixed(2)}*\n`;
    msg += `\nGracias por su compra!`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      await printTicket({
        empresa: { nombre: usuario?.empresa?.nombre || 'POS Shop' },
        venta: { numero: lastVenta?.numeroVenta, fecha: fecha.toLocaleString('es-PE'), tipoComprobante: lastVenta?.tipoComprobante },
        items: items.map((i: any) => ({
          nombre: i.nombre, cantidad: i.cantidad,
          precio: Number(i.precio || i.precioUnitario || 0),
          subtotal: Number(i.precio || i.precioUnitario || 0) * i.cantidad,
        })),
        totales: { total: ventaTotal },
        metodoPago: pagos.map((p: any) => p.nombre).join(' + '),
      });
      toastSuccess('Ticket impreso');
    } catch (err: any) { toastError('Error', err?.message || 'Verifica impresora'); }
    finally { setPrinting(false); }
  };

  const handleNewSale = () => { reset(); router.replace('/(tabs)'); };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status section */}
        <View style={s.statusSection}>
          <View style={s.statusIconWrap}>
            <Text style={s.statusEmoji}>{isOffline ? '📡' : '✅'}</Text>
          </View>
          <Text style={s.statusTitle}>{isOffline ? 'Guardada offline' : 'Venta Completada'}</Text>
          {isOffline && <Text style={s.statusOffline}>Se sincronizara al volver internet</Text>}
        </View>

        {/* Ticket card */}
        <View style={s.ticket}>
          {/* Ticket header */}
          <View style={s.ticketHeader}>
            <Text style={s.ticketEmpresa}>{usuario?.empresa?.nombre || 'POS Shop'}</Text>
            {lastVenta?.numeroVenta && (
              <View style={s.ticketNumeroBadge}>
                <Text style={s.ticketNumero}>{lastVenta.numeroVenta}</Text>
              </View>
            )}
            <Text style={s.ticketFecha}>
              {fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} — {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View style={s.ticketDivider} />

          {/* Items */}
          {items.map((item: any, idx: number) => {
            const precio = Number(item.precio || item.precioUnitario || 0);
            const sub = precio * item.cantidad;
            return (
              <View key={idx} style={s.ticketItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.ticketItemName} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={s.ticketItemQty}>{item.cantidad} x S/ {precio.toFixed(2)}</Text>
                </View>
                <Text style={s.ticketItemSub}>S/ {sub.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={s.ticketDivider} />

          {/* Total */}
          <View style={s.ticketTotalRow}>
            <Text style={s.ticketTotalLabel}>TOTAL</Text>
            <Text style={s.ticketTotalValue}>S/ {ventaTotal.toFixed(2)}</Text>
          </View>

          {/* Payments */}
          {pagos.length > 0 && (
            <>
              <View style={s.ticketDividerDashed} />
              <View style={s.ticketPagos}>
                {pagos.map((p: any, idx: number) => {
                  const emoji = EMOJI[p.tipo?.toLowerCase()] || EMOJI[p.nombre?.toLowerCase()] || '💰';
                  return (
                    <View key={idx} style={s.ticketPagoRow}>
                      <Text style={{ fontSize: 14 }}>{emoji}</Text>
                      <Text style={s.ticketPagoNombre}>{p.nombre}</Text>
                      <Text style={s.ticketPagoMonto}>S/ {Number(p.monto).toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Thank you */}
          <View style={s.ticketGraciasWrap}>
            <Text style={s.ticketGracias}>Gracias por su compra</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          {hasPrinter && (
            <TouchableOpacity style={s.printBtn} onPress={handlePrint} disabled={printing} activeOpacity={0.8}>
              {printing ? <ActivityIndicator color="#ffffff" /> : <Text style={s.printText}>🖨  Imprimir ticket</Text>}
            </TouchableOpacity>
          )}
          {whatsappEnabled && (
            <TouchableOpacity style={s.wspBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
              <Text style={s.wspText}>📱  Enviar por WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.newBtn} onPress={handleNewSale} activeOpacity={0.8}>
            <Text style={s.newText}>Nueva Venta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Status
  statusSection: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  statusIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  statusEmoji: { fontSize: 44 },
  statusTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: 0.2 },
  statusOffline: { fontSize: 13, color: '#d97706', fontWeight: '600', marginTop: 6 },

  // Ticket
  ticket: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  ticketHeader: { alignItems: 'center', marginBottom: 4 },
  ticketEmpresa: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 0.3 },
  ticketNumeroBadge: {
    marginTop: 8,
    backgroundColor: '#faf5ff',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  ticketNumero: { fontSize: 13, color: '#7c3aed', fontWeight: '700' },
  ticketFecha: { fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: '500' },

  ticketDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  ticketDividerDashed: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },

  ticketItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ticketItemName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  ticketItemQty: { fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: '500' },
  ticketItemSub: { fontSize: 15, fontWeight: '700', color: '#334155' },

  ticketTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketTotalLabel: { fontSize: 14, fontWeight: '700', color: '#64748b', letterSpacing: 1.5 },
  ticketTotalValue: { fontSize: 28, fontWeight: '800', color: '#16a34a' },

  ticketPagos: { gap: 8 },
  ticketPagoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketPagoNombre: { flex: 1, fontSize: 13, color: '#64748b', fontWeight: '500' },
  ticketPagoMonto: { fontSize: 14, color: '#334155', fontWeight: '600' },

  ticketGraciasWrap: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  ticketGracias: { fontSize: 14, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.5 },

  // Actions
  actions: { gap: 12 },
  printBtn: {
    height: 56,
    backgroundColor: '#0891b2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0891b2',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  printText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  wspBtn: {
    height: 56,
    backgroundColor: '#22c55e',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#22c55e',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  wspText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  newBtn: {
    height: 56,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  newText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
