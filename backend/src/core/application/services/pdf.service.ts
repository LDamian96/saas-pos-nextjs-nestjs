/**
 * @file pdf.service.ts
 * @description Servicio para generacion de PDF y tickets de venta
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generar ticket/recibo de venta en PDF (80mm)
   */
  async generarTicketVenta(empresaId: string, ventaId: string): Promise<Buffer> {
    const venta = await this.prisma.venta.findFirst({
      where: { id: ventaId, empresaId },
      include: {
        detalles: {
          include: {
            variante: {
              include: { producto: { select: { nombre: true, codigoInterno: true } } },
            },
          },
        },
        pagos: {
          include: { metodoPago: { select: { nombre: true } } },
        },
        cliente: { select: { nombre: true, apellido: true, numeroDocumento: true } },
        sucursal: { select: { nombre: true, direccion: true, telefono: true } },
        usuario: { select: { nombre: true, apellido: true } },
        empresa: { select: { nombreComercial: true, ruc: true, simboloMoneda: true, logo: true } },
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    // Obtener nombre del cliente (registrado o temporal)
    const clienteNombre = venta.cliente
      ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}`.trim()
      : (venta as any).clienteNombreTemporal || null;

    const clienteDocumento = venta.cliente?.numeroDocumento || (venta as any).clienteDocumentoTemporal || null;

    const moneda = venta.empresa.simboloMoneda || 'S/.';
    const ticketWidth = 226.77; // ~80mm

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [ticketWidth, 800],
        margin: 12,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const contentWidth = ticketWidth - 24; // margin * 2
      const lineChar = '━';
      const lightLineChar = '─';

      // ===== HEADER =====
      doc.fontSize(14).font('Helvetica-Bold')
        .text(venta.empresa.nombreComercial || 'Mi Tienda', { align: 'center' });

      doc.moveDown(0.3);

      if (venta.empresa.ruc) {
        doc.fontSize(9).font('Helvetica')
          .text(`RUC: ${venta.empresa.ruc}`, { align: 'center' });
      }

      doc.fontSize(9).font('Helvetica')
        .text(venta.sucursal.nombre, { align: 'center' });

      if (venta.sucursal.direccion) {
        doc.fontSize(8).text(venta.sucursal.direccion, { align: 'center' });
      }

      if (venta.sucursal.telefono) {
        doc.fontSize(8).text(`Tel: ${venta.sucursal.telefono}`, { align: 'center' });
      }

      // Linea separadora
      doc.moveDown(0.5);
      doc.fontSize(8).text(lineChar.repeat(35), { align: 'center' });

      // ===== TIPO DOCUMENTO =====
      doc.moveDown(0.4);
      doc.fontSize(12).font('Helvetica-Bold')
        .text('BOLETA DE VENTA', { align: 'center' });

      doc.fontSize(10).font('Helvetica-Bold')
        .text(venta.numeroVenta, { align: 'center' });

      // Linea separadora
      doc.moveDown(0.4);
      doc.fontSize(8).font('Helvetica')
        .text(lightLineChar.repeat(35), { align: 'center' });

      // ===== INFO VENTA =====
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica');

      const fecha = new Date(venta.createdAt);
      const fechaStr = fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const horaStr = fecha.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.text(`Fecha: ${fechaStr}  Hora: ${horaStr}`, { align: 'center' });
      doc.text(`Atendido por: ${venta.usuario.nombre}`, { align: 'center' });

      // Cliente (si existe)
      if (clienteNombre) {
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica-Bold')
          .text('CLIENTE:', { align: 'left' });
        doc.font('Helvetica')
          .text(clienteNombre, { align: 'left' });
        if (clienteDocumento) {
          doc.text(`Doc: ${clienteDocumento}`, { align: 'left' });
        }
      }

      // Linea separadora
      doc.moveDown(0.4);
      doc.fontSize(8).font('Helvetica')
        .text(lineChar.repeat(35), { align: 'center' });

      // ===== DETALLE PRODUCTOS =====
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica-Bold')
        .text('DETALLE DE PRODUCTOS', { align: 'center' });
      doc.moveDown(0.3);

      // Header de tabla
      doc.fontSize(7).font('Helvetica-Bold');
      const headerY = doc.y;
      doc.text('Cant', 12, headerY, { width: 30 });
      doc.text('Producto', 45, headerY, { width: 100 });
      doc.text('P.Unit', 145, headerY, { width: 35, align: 'right' });
      doc.text('Subtot', 180, headerY, { width: 35, align: 'right' });

      doc.moveDown(0.3);
      doc.fontSize(7).text(lightLineChar.repeat(35), { align: 'center' });
      doc.moveDown(0.2);

      // Items
      doc.font('Helvetica').fontSize(7);
      for (const detalle of venta.detalles) {
        const nombre = detalle.variante?.producto?.nombre || 'Producto';
        const nombreCorto = nombre.length > 16 ? nombre.substring(0, 16) + '...' : nombre;
        const precioUnit = Number(detalle.precioUnidad).toFixed(2);
        const subtotalItem = Number(detalle.subtotal).toFixed(2);

        const itemY = doc.y;
        doc.text(String(detalle.cantidad), 12, itemY, { width: 30 });
        doc.text(nombreCorto, 45, itemY, { width: 100 });
        doc.text(precioUnit, 145, itemY, { width: 35, align: 'right' });
        doc.text(subtotalItem, 180, itemY, { width: 35, align: 'right' });

        // Si hay descuento en el item, mostrarlo
        if (Number(detalle.descuento) > 0) {
          doc.moveDown(0.1);
          doc.fontSize(6).fillColor('#666666')
            .text(`   Desc: -${moneda}${Number(detalle.descuento).toFixed(2)}`, { align: 'left' });
          doc.fillColor('#000000');
        }

        doc.moveDown(0.2);
      }

      // Linea separadora
      doc.moveDown(0.3);
      doc.fontSize(8).text(lineChar.repeat(35), { align: 'center' });

      // ===== TOTALES =====
      doc.moveDown(0.4);
      doc.fontSize(9).font('Helvetica');

      // Subtotal
      const subtotalY = doc.y;
      doc.text('Subtotal:', 12, subtotalY, { width: 100 });
      doc.text(`${moneda} ${Number(venta.subtotal).toFixed(2)}`, 120, subtotalY, { width: 95, align: 'right' });

      // Descuento (si hay)
      if (Number(venta.descuento) > 0) {
        doc.moveDown(0.2);
        const descY = doc.y;
        doc.text('Descuento:', 12, descY, { width: 100 });
        doc.text(`-${moneda} ${Number(venta.descuento).toFixed(2)}`, 120, descY, { width: 95, align: 'right' });
      }

      // Impuesto (si hay)
      if (Number(venta.impuesto) > 0) {
        doc.moveDown(0.2);
        const impY = doc.y;
        doc.text('IGV (18%):', 12, impY, { width: 100 });
        doc.text(`${moneda} ${Number(venta.impuesto).toFixed(2)}`, 120, impY, { width: 95, align: 'right' });
      }

      // Total
      doc.moveDown(0.4);
      doc.fontSize(12).font('Helvetica-Bold');
      const totalY = doc.y;
      doc.text('TOTAL:', 12, totalY, { width: 100 });
      doc.text(`${moneda} ${Number(venta.total).toFixed(2)}`, 100, totalY, { width: 115, align: 'right' });

      // Linea separadora
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica')
        .text(lightLineChar.repeat(35), { align: 'center' });

      // ===== PAGOS =====
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica-Bold')
        .text('FORMA DE PAGO', { align: 'center' });
      doc.moveDown(0.2);

      doc.font('Helvetica').fontSize(8);
      let totalPagado = 0;
      for (const pago of venta.pagos) {
        const pagoY = doc.y;
        doc.text(pago.metodoPago.nombre, 12, pagoY, { width: 120 });
        doc.text(`${moneda} ${Number(pago.monto).toFixed(2)}`, 120, pagoY, { width: 95, align: 'right' });
        totalPagado += Number(pago.monto);

        if (pago.referencia) {
          doc.fontSize(7).text(`   Ref: ${pago.referencia}`, { align: 'left' });
        }
        doc.moveDown(0.1);
      }

      // Vuelto
      const vuelto = totalPagado - Number(venta.total);
      if (vuelto > 0.01) {
        doc.moveDown(0.2);
        doc.fontSize(9).font('Helvetica-Bold');
        const vueltoY = doc.y;
        doc.text('Vuelto:', 12, vueltoY, { width: 100 });
        doc.text(`${moneda} ${vuelto.toFixed(2)}`, 120, vueltoY, { width: 95, align: 'right' });
      }

      // ===== FOOTER =====
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica')
        .text(lineChar.repeat(35), { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold')
        .text('¡Gracias por su compra!', { align: 'center' });

      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica')
        .text('Conserve este comprobante', { align: 'center' });
      doc.text('para cualquier reclamo', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(7)
        .text(`Generado: ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generar reporte de compra en PDF (A4)
   */
  async generarReporteCompra(empresaId: string, compraId: string): Promise<Buffer> {
    const compra = await this.prisma.compra.findFirst({
      where: { id: compraId, empresaId },
      include: {
        proveedor: true,
        sucursal: { select: { nombre: true } },
        detalles: true,
        empresa: { select: { nombreComercial: true, ruc: true, simboloMoneda: true } },
      },
    });

    if (!compra) {
      throw new NotFoundException('Compra no encontrada');
    }

    const moneda = compra.empresa.simboloMoneda || 'S/.';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).font('Helvetica-Bold')
        .text('ORDEN DE COMPRA', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica')
        .text(compra.empresa.nombreComercial || '', { align: 'center' });
      if (compra.empresa.ruc) {
        doc.fontSize(10).text(`RUC: ${compra.empresa.ruc}`, { align: 'center' });
      }

      doc.moveDown(1.5);

      // Linea
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Info de la compra
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Numero: ${compra.numero}`);
      doc.font('Helvetica');
      doc.text(`Fecha: ${new Date(compra.fecha).toLocaleDateString('es-PE')}`);
      doc.text(`Proveedor: ${compra.proveedor.nombreComercial || compra.proveedor.razonSocial}`);
      if (compra.proveedor.ruc) {
        doc.text(`RUC Proveedor: ${compra.proveedor.ruc}`);
      }
      doc.text(`Sucursal: ${compra.sucursal.nombre}`);
      if (compra.tipoDocumentoRef) {
        doc.text(`Doc. Referencia: ${compra.tipoDocumentoRef} ${compra.numeroDocumentoRef || ''}`);
      }

      doc.moveDown(1);

      // Tabla de productos
      const tableTop = doc.y;
      const tableHeaders = ['Descripcion', 'Cant.', 'P. Unitario', 'Subtotal'];
      const colWidths = [250, 50, 80, 90];
      const colX = [40, 300, 360, 450];

      // Header de tabla
      doc.font('Helvetica-Bold').fontSize(10);
      doc.rect(40, tableTop - 5, 515, 20).fill('#f3f4f6');
      doc.fillColor('#000000');

      tableHeaders.forEach((header, i) => {
        doc.text(header, colX[i], tableTop, { width: colWidths[i], align: i === 0 ? 'left' : 'right' });
      });

      doc.moveDown(0.8);

      // Linea bajo header
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // Filas de productos
      doc.font('Helvetica').fontSize(9);
      for (const d of compra.detalles) {
        const y = doc.y;
        doc.text(d.descripcion || 'Producto', colX[0], y, { width: colWidths[0] });
        doc.text(String(Number(d.cantidad)), colX[1], y, { width: colWidths[1], align: 'right' });
        doc.text(`${moneda}${Number(d.precioUnitario).toFixed(2)}`, colX[2], y, { width: colWidths[2], align: 'right' });
        doc.text(`${moneda}${Number(d.subtotal).toFixed(2)}`, colX[3], y, { width: colWidths[3], align: 'right' });
        doc.moveDown(0.5);
      }

      // Linea bajo items
      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke();
      doc.moveDown(1);

      // Totales
      doc.fontSize(10);
      const totalsX = 360;
      const totalsValueX = 450;
      const totalsWidth = 90;

      doc.text('Subtotal:', totalsX, doc.y, { width: 80, align: 'right' });
      doc.text(`${moneda} ${Number(compra.subtotal).toFixed(2)}`, totalsValueX, doc.y - 12, { width: totalsWidth, align: 'right' });

      if (Number(compra.descuento) > 0) {
        doc.moveDown(0.3);
        doc.text('Descuento:', totalsX, doc.y, { width: 80, align: 'right' });
        doc.text(`-${moneda} ${Number(compra.descuento).toFixed(2)}`, totalsValueX, doc.y - 12, { width: totalsWidth, align: 'right' });
      }

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', totalsX, doc.y, { width: 80, align: 'right' });
      doc.text(`${moneda} ${Number(compra.total).toFixed(2)}`, totalsValueX, doc.y - 14, { width: totalsWidth, align: 'right' });

      // Footer
      doc.moveDown(3);
      doc.fontSize(8).font('Helvetica')
        .fillColor('#666666')
        .text(`Documento generado el ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

      doc.end();
    });
  }
}
