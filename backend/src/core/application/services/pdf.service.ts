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
              include: { producto: { select: { nombre: true, codigoInterno: true, sku: true } } },
            },
          },
        },
        pagos: {
          include: { metodoPago: { select: { nombre: true } } },
        },
        cliente: { select: { nombre: true, apellido: true, numeroDocumento: true, tipoDocumento: true } },
        sucursal: { select: { nombre: true, direccion: true, telefono: true } },
        usuario: { select: { nombre: true, apellido: true } },
        empresa: { select: { nombreComercial: true, ruc: true, simboloMoneda: true, logo: true } },
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    const clienteNombre = venta.cliente
      ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}`.trim()
      : (venta as any).clienteNombre || null;

    const clienteDocumento = venta.cliente?.numeroDocumento || (venta as any).clienteDocumento || null;

    const moneda = 'S/';
    const W = 226.77; // ~80mm
    const M = 10; // margin
    const CW = W - M * 2; // content width

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: [W, 900],
        margin: M,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const line = () => {
        doc.moveDown(0.3);
        doc.strokeColor('#cccccc').lineWidth(0.5)
          .moveTo(M, doc.y).lineTo(W - M, doc.y).stroke();
        doc.moveDown(0.3);
      };

      const dottedLine = () => {
        doc.moveDown(0.2);
        doc.fontSize(6).fillColor('#999999')
          .text('- - - - - - - - - - - - - - - - - - - - - - - - - - - -', { align: 'center' });
        doc.fillColor('#000000');
        doc.moveDown(0.2);
      };

      const row = (left: string, right: string, opts?: { bold?: boolean; size?: number }) => {
        const size = opts?.size || 8;
        const font = opts?.bold ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(font).fontSize(size);
        const y = doc.y;
        doc.text(left, M, y, { width: CW * 0.6 });
        doc.text(right, M + CW * 0.6, y, { width: CW * 0.4, align: 'right' });
        doc.moveDown(0.15);
      };

      // ╔══════════════════════════════════╗
      // ║         LOGO + NOMBRE DEL NEGOCIO║
      // ╚══════════════════════════════════╝

      // Intentar agregar logo si existe
      if (venta.empresa.logo) {
        try {
          const response = await fetch(venta.empresa.logo);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            doc.image(buffer, (W - 60) / 2, doc.y, { width: 60 });
            doc.moveDown(0.5);
          }
        } catch {
          // Skip logo if fetch fails
        }
      }

      doc.fontSize(14).font('Helvetica-Bold')
        .text(venta.empresa.nombreComercial || 'POS Shop', { align: 'center' });

      line();

      // ═══ TIPO DE COMPROBANTE ═══
      const tipoDoc = venta.tipoComprobante === 'factura' ? 'FACTURA'
        : venta.tipoComprobante === 'boleta' ? 'BOLETA DE VENTA'
        : 'TICKET DE VENTA';

      doc.fontSize(11).font('Helvetica-Bold')
        .text(tipoDoc, { align: 'center' });

      doc.fontSize(9).font('Helvetica-Bold')
        .text(venta.numeroVenta, { align: 'center' });

      dottedLine();

      // ═══ INFO DE LA VENTA ═══
      const fecha = new Date(venta.createdAt);
      const fechaStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      doc.fontSize(8).font('Helvetica')
        .text(`${fechaStr}  ${horaStr}`, { align: 'center' });

      line();

      // ═══ PRODUCTOS ═══
      doc.fontSize(7).font('Helvetica-Bold');
      const thY = doc.y;
      doc.text('PRODUCTO', M, thY, { width: CW * 0.5 });
      doc.text('CANT', M + CW * 0.5, thY, { width: CW * 0.13, align: 'center' });
      doc.text('P.UNIT', M + CW * 0.63, thY, { width: CW * 0.18, align: 'right' });
      doc.text('TOTAL', M + CW * 0.81, thY, { width: CW * 0.19, align: 'right' });
      doc.moveDown(0.2);

      dottedLine();

      doc.font('Helvetica').fontSize(7);
      for (const det of venta.detalles) {
        const nombre = det.variante?.producto?.nombre || 'Producto';
        const pUnit = Number(det.precioUnidad).toFixed(2);
        const subT = Number(det.subtotal).toFixed(2);
        const cant = det.cantidad;

        // Nombre completo en una línea
        doc.font('Helvetica').fontSize(7);
        doc.text(nombre, M, doc.y, { width: CW });
        doc.moveDown(0.05);

        // Detalle: cantidad x precio = subtotal
        const detY = doc.y;
        doc.fontSize(7).fillColor('#555555');
        doc.text(`   ${cant} x ${moneda}${pUnit}`, M, detY, { width: CW * 0.7 });
        doc.fillColor('#000000').font('Helvetica-Bold');
        doc.text(`${moneda}${subT}`, M + CW * 0.7, detY, { width: CW * 0.3, align: 'right' });
        doc.font('Helvetica');

        // Descuento del item
        if (Number(det.descuento) > 0) {
          doc.fontSize(6).fillColor('#cc0000')
            .text(`   Desc: -${moneda}${Number(det.descuento).toFixed(2)}`, M);
          doc.fillColor('#000000');
        }

        doc.moveDown(0.25);
      }

      line();

      // ═══ TOTALES ═══
      if (Number(venta.subtotal) !== Number(venta.total)) {
        row('Subtotal:', `${moneda} ${Number(venta.subtotal).toFixed(2)}`);
      }

      if (Number(venta.descuento) > 0) {
        doc.fillColor('#cc0000');
        row('Descuento:', `-${moneda} ${Number(venta.descuento).toFixed(2)}`);
        doc.fillColor('#000000');
      }

      if (Number(venta.impuesto) > 0) {
        row('IGV (18%):', `${moneda} ${Number(venta.impuesto).toFixed(2)}`);
      }

      doc.moveDown(0.2);
      doc.strokeColor('#000000').lineWidth(1)
        .moveTo(M, doc.y).lineTo(W - M, doc.y).stroke();
      doc.moveDown(0.3);

      // TOTAL GRANDE
      doc.fontSize(14).font('Helvetica-Bold');
      const totalY = doc.y;
      doc.text('TOTAL', M, totalY, { width: CW * 0.4 });
      doc.text(`${moneda} ${Number(venta.total).toFixed(2)}`, M + CW * 0.4, totalY, { width: CW * 0.6, align: 'right' });

      doc.strokeColor('#000000').lineWidth(1)
        .moveTo(M, doc.y + 3).lineTo(W - M, doc.y + 3).stroke();
      doc.moveDown(0.5);

      // ═══ FORMA DE PAGO ═══
      dottedLine();
      doc.fontSize(7).font('Helvetica-Bold').text('FORMA DE PAGO', { align: 'center' });
      doc.moveDown(0.2);

      doc.font('Helvetica').fontSize(8);
      let totalPagado = 0;
      for (const pago of venta.pagos) {
        row(pago.metodoPago.nombre, `${moneda} ${Number(pago.monto).toFixed(2)}`);
        totalPagado += Number(pago.monto);
        if (pago.referencia) {
          doc.fontSize(6).fillColor('#888888')
            .text(`   Ref: ${pago.referencia}`, M);
          doc.fillColor('#000000');
        }
      }

      // VUELTO / CAMBIO
      const vuelto = totalPagado - Number(venta.total);
      if (vuelto > 0.01) {
        doc.moveDown(0.1);
        doc.fontSize(9).font('Helvetica-Bold');
        const vY = doc.y;
        doc.text('VUELTO:', M, vY, { width: CW * 0.5 });
        doc.text(`${moneda} ${vuelto.toFixed(2)}`, M + CW * 0.5, vY, { width: CW * 0.5, align: 'right' });
      }

      // ═══ FOOTER ═══
      doc.moveDown(0.8);
      line();

      doc.fontSize(10).font('Helvetica-Bold')
        .text('¡Gracias por su compra!', { align: 'center' });

      doc.moveDown(0.3);
      doc.fontSize(7).font('Helvetica').fillColor('#888888')
        .text('Conserve este comprobante para cualquier reclamo', { align: 'center' });

      doc.moveDown(0.8);
      doc.fontSize(6)
        .text(`${new Date().toLocaleString('es-PE')}`, { align: 'center' });

      doc.fillColor('#000000');
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

    const moneda = compra.empresa.simboloMoneda || 'S/';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold')
        .text('ORDEN DE COMPRA', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica')
        .text(compra.empresa.nombreComercial || '', { align: 'center' });
      if (compra.empresa.ruc) {
        doc.fontSize(10).text(`RUC: ${compra.empresa.ruc}`, { align: 'center' });
      }

      doc.moveDown(1.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Numero: ${compra.numero}`);
      doc.font('Helvetica');
      doc.text(`Fecha: ${new Date(compra.fecha).toLocaleDateString('es-PE')}`);
      doc.text(`Proveedor: ${compra.proveedor.nombreComercial || compra.proveedor.razonSocial}`);
      if (compra.proveedor.ruc) doc.text(`RUC Proveedor: ${compra.proveedor.ruc}`);
      doc.text(`Sucursal: ${compra.sucursal.nombre}`);

      doc.moveDown(1);

      const tableTop = doc.y;
      const colX = [40, 300, 360, 450];
      const colW = [250, 50, 80, 90];
      const headers = ['Descripcion', 'Cant.', 'P. Unitario', 'Subtotal'];

      doc.font('Helvetica-Bold').fontSize(10);
      doc.rect(40, tableTop - 5, 515, 20).fill('#f3f4f6');
      doc.fillColor('#000000');
      headers.forEach((h, i) => doc.text(h, colX[i], tableTop, { width: colW[i], align: i === 0 ? 'left' : 'right' }));

      doc.moveDown(0.8);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica').fontSize(9);
      for (const d of compra.detalles) {
        const y = doc.y;
        doc.text(d.descripcion || 'Producto', colX[0], y, { width: colW[0] });
        doc.text(String(Number(d.cantidad)), colX[1], y, { width: colW[1], align: 'right' });
        doc.text(`${moneda}${Number(d.precioUnitario).toFixed(2)}`, colX[2], y, { width: colW[2], align: 'right' });
        doc.text(`${moneda}${Number(d.subtotal).toFixed(2)}`, colX[3], y, { width: colW[3], align: 'right' });
        doc.moveDown(0.5);
      }

      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke();
      doc.moveDown(1);

      doc.fontSize(10);
      doc.text('Subtotal:', 360, doc.y, { width: 80, align: 'right' });
      doc.text(`${moneda} ${Number(compra.subtotal).toFixed(2)}`, 450, doc.y - 12, { width: 90, align: 'right' });

      if (Number(compra.descuento) > 0) {
        doc.moveDown(0.3);
        doc.text('Descuento:', 360, doc.y, { width: 80, align: 'right' });
        doc.text(`-${moneda} ${Number(compra.descuento).toFixed(2)}`, 450, doc.y - 12, { width: 90, align: 'right' });
      }

      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', 360, doc.y, { width: 80, align: 'right' });
      doc.text(`${moneda} ${Number(compra.total).toFixed(2)}`, 450, doc.y - 14, { width: 90, align: 'right' });

      doc.moveDown(3);
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text(`Documento generado el ${new Date().toLocaleString('es-PE')}`, { align: 'center' });

      doc.end();
    });
  }
}
