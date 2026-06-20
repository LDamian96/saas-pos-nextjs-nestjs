import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

const PRINTER_KEY = 'pos-printer-device';

// Servicios SPP comunes para impresoras térmicas BLE
const PRINTER_SERVICE_UUIDS = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC (común en muchas BT)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / similar
  '000018f0-0000-1000-8000-00805f9b34fb', // ESC/POS común
];

const PRINTER_CHARACTERISTIC_UUIDS = [
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '00002af1-0000-1000-8000-00805f9b34fb',
];

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) manager = new BleManager();
  return manager;
}

// ============ ESC/POS COMMANDS ============

const ESC = '\x1B';
const GS = '\x1D';

const cmd = {
  init: `${ESC}@`,
  alignLeft: `${ESC}a0`,
  alignCenter: `${ESC}a1`,
  alignRight: `${ESC}a2`,
  boldOn: `${ESC}E1`,
  boldOff: `${ESC}E0`,
  doubleSize: `${GS}!\x11`,
  largeSize: `${GS}!\x10`,
  normalSize: `${GS}!\x00`,
  cut: `${GS}V0`,
  feed: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  newLine: '\n',
};

interface TicketData {
  empresa: { nombre: string; ruc?: string; direccion?: string; telefono?: string };
  venta: {
    numero?: string;
    fecha?: string;
    tipoComprobante?: string;
    cliente?: { nombre?: string; documento?: string };
  };
  items: Array<{ nombre: string; cantidad: number; precio: number; subtotal: number }>;
  totales: { subtotal?: number; igv?: number; total: number };
  metodoPago?: string;
}

export function buildTicketEscPos(data: TicketData): Uint8Array {
  let out = '';

  out += cmd.init;
  out += cmd.alignCenter;
  out += cmd.boldOn + cmd.doubleSize;
  out += data.empresa.nombre + cmd.newLine;
  out += cmd.normalSize + cmd.boldOff;

  if (data.empresa.ruc) out += `RUC: ${data.empresa.ruc}` + cmd.newLine;
  if (data.empresa.direccion) out += data.empresa.direccion + cmd.newLine;
  if (data.empresa.telefono) out += `Tel: ${data.empresa.telefono}` + cmd.newLine;
  out += '--------------------------------' + cmd.newLine;

  out += cmd.boldOn;
  out += (data.venta.tipoComprobante?.toUpperCase() || 'TICKET') + cmd.newLine;
  out += cmd.boldOff;
  if (data.venta.numero) out += data.venta.numero + cmd.newLine;
  if (data.venta.fecha) out += data.venta.fecha + cmd.newLine;
  if (data.venta.cliente?.nombre) out += `Cliente: ${data.venta.cliente.nombre}` + cmd.newLine;
  if (data.venta.cliente?.documento) out += `Doc: ${data.venta.cliente.documento}` + cmd.newLine;
  out += '--------------------------------' + cmd.newLine;

  out += cmd.alignLeft;
  for (const item of data.items) {
    out += item.nombre.substring(0, 32) + cmd.newLine;
    const line = `${item.cantidad} x ${item.precio.toFixed(2)}`;
    const total = `S/ ${item.subtotal.toFixed(2)}`;
    const space = 32 - line.length - total.length;
    out += line + ' '.repeat(Math.max(1, space)) + total + cmd.newLine;
  }
  out += '--------------------------------' + cmd.newLine;

  // Total - sin desglose de IGV al cliente
  out += cmd.alignLeft;
  const totalStr = `S/ ${data.totales.total.toFixed(2)}`;
  out += `TOTAL${' '.repeat(32 - 5 - totalStr.length)}${totalStr}` + cmd.newLine;
  out += cmd.newLine;
  out += cmd.boldOn + cmd.alignCenter + cmd.doubleSize;
  out += `S/ ${data.totales.total.toFixed(2)}` + cmd.newLine;
  out += cmd.normalSize + cmd.boldOff + cmd.alignLeft;

  if (data.metodoPago) {
    out += '--------------------------------' + cmd.newLine;
    out += `Pago: ${data.metodoPago}` + cmd.newLine;
  }

  out += cmd.alignCenter;
  out += cmd.newLine;
  out += 'Gracias por su compra!' + cmd.newLine;
  out += cmd.feed(3);
  out += cmd.cut;

  return new Uint8Array(Buffer.from(out, 'utf-8'));
}

// ============ DEVICE CONNECTION ============

export async function scanPrinters(timeoutMs = 8000): Promise<Device[]> {
  const m = getManager();
  const found = new Map<string, Device>();

  return new Promise((resolve, reject) => {
    m.startDeviceScan(null, null, (error, device) => {
      if (error) {
        m.stopDeviceScan();
        reject(error);
        return;
      }
      if (device && device.id && (device.name || device.localName)) {
        found.set(device.id, device);
      }
    });

    setTimeout(() => {
      m.stopDeviceScan();
      resolve(Array.from(found.values()));
    }, timeoutMs);
  });
}

export async function saveSelectedPrinter(device: { id: string; name: string }) {
  await SecureStore.setItemAsync(PRINTER_KEY, JSON.stringify(device));
}

export async function getSelectedPrinter(): Promise<{ id: string; name: string } | null> {
  const val = await SecureStore.getItemAsync(PRINTER_KEY);
  return val ? JSON.parse(val) : null;
}

export async function removeSelectedPrinter() {
  await SecureStore.deleteItemAsync(PRINTER_KEY);
}

async function findWritableCharacteristic(device: Device): Promise<Characteristic | null> {
  const services = await device.services();
  for (const service of services) {
    const chars = await service.characteristics();
    for (const c of chars) {
      if (c.isWritableWithResponse || c.isWritableWithoutResponse) {
        return c;
      }
    }
  }
  return null;
}

export async function printTicket(data: TicketData): Promise<void> {
  const printer = await getSelectedPrinter();
  if (!printer) throw new Error('No hay impresora configurada');

  const m = getManager();
  let device: Device;

  try {
    device = await m.connectToDevice(printer.id, { autoConnect: false });
    await device.discoverAllServicesAndCharacteristics();
  } catch (err: any) {
    throw new Error(`No se pudo conectar a la impresora: ${err?.message || 'desconocido'}`);
  }

  const characteristic = await findWritableCharacteristic(device);
  if (!characteristic) {
    await device.cancelConnection();
    throw new Error('La impresora no tiene caracteristica escribible');
  }

  const bytes = buildTicketEscPos(data);
  // Enviar en chunks de 180 bytes (limite común BLE MTU)
  const chunkSize = 180;
  try {
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      const base64 = Buffer.from(chunk).toString('base64');
      if (characteristic.isWritableWithResponse) {
        await characteristic.writeWithResponse(base64);
      } else {
        await characteristic.writeWithoutResponse(base64);
      }
    }
  } finally {
    try { await device.cancelConnection(); } catch {}
  }
}
