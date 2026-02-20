/**
 * @file qr.service.ts
 * @description Servicio para generacion de codigos QR de productos
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generar QR para un producto (con su codigo interno)
   */
  async generarQrProducto(empresaId: string, productoId: string): Promise<Buffer> {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
      select: {
        id: true,
        codigoInterno: true,
        nombre: true,
        precioVenta: true,
        codigoBarras: true,
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    // QR contains JSON with product info
    const qrData = JSON.stringify({
      id: producto.id,
      codigo: producto.codigoInterno,
      nombre: producto.nombre,
      precio: Number(producto.precioVenta),
      barras: producto.codigoBarras,
    });

    const buffer = await QRCode.toBuffer(qrData, {
      type: 'png',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    return buffer;
  }

  /**
   * Generar QR como Data URL (base64)
   */
  async generarQrDataUrl(empresaId: string, productoId: string): Promise<string> {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId },
      select: { id: true, codigoInterno: true, nombre: true, precioVenta: true },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const qrData = JSON.stringify({
      id: producto.id,
      codigo: producto.codigoInterno,
      nombre: producto.nombre,
      precio: Number(producto.precioVenta),
    });

    return QRCode.toDataURL(qrData, { width: 300, margin: 2 });
  }

  /**
   * Generar QR batch para multiples productos
   */
  async generarQrBatch(empresaId: string, productoIds: string[]): Promise<{ id: string; codigo: string; nombre: string; qr: string }[]> {
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: productoIds }, empresaId },
      select: { id: true, codigoInterno: true, nombre: true, precioVenta: true },
    });

    const results = [];
    for (const p of productos) {
      const qrData = JSON.stringify({ id: p.id, codigo: p.codigoInterno, nombre: p.nombre, precio: Number(p.precioVenta) });
      const dataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
      results.push({ id: p.id, codigo: p.codigoInterno, nombre: p.nombre, qr: dataUrl });
    }

    return results;
  }
}
