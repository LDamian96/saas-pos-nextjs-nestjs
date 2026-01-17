# 🖨️ SISTEMA DE IMPRESIÓN DE BOLETAS

## ⚠️ NOTA DE DESARROLLO

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sistema de impresión para:                                             │
│  ├── Tickets térmicos (58mm y 80mm)                                    │
│  ├── Boletas PDF                                                        │
│  ├── Facturas PDF                                                       │
│  └── Envío por WhatsApp/Email                                          │
│                                                                          │
│  ⚠️ Impresión térmica: Funciona directo desde el navegador            │
│  ⚠️ PDF: Se genera en el backend y se descarga                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 TIPOS DE IMPRESIÓN

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. TICKET TÉRMICO (POS)                                                │
│     ├── Ancho: 58mm o 80mm                                             │
│     ├── Impresora: USB térmica conectada a PC                         │
│     ├── Método: window.print() con CSS específico                     │
│     └── Uso: Ventas rápidas en tienda                                  │
│                                                                          │
│  2. BOLETA/FACTURA PDF                                                  │
│     ├── Tamaño: A4 o carta                                             │
│     ├── Generación: Backend con PDFKit                                 │
│     ├── Método: Descargar o imprimir                                   │
│     └── Uso: Clientes que requieren documento formal                   │
│                                                                          │
│  3. COMPROBANTE DIGITAL                                                 │
│     ├── Formato: PDF o imagen                                          │
│     ├── Envío: WhatsApp, Email, SMS                                    │
│     └── Uso: Clientes que no necesitan impreso                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧾 ESTRUCTURA DEL TICKET TÉRMICO

### Ticket 80mm (Estándar)

```
┌──────────────────────────────────────────┐
│                                          │  <- 80mm
│              [LOGO EMPRESA]              │
│           NOMBRE DE LA EMPRESA           │
│            RUC: 12345678901              │
│         Av. Principal 123, Lima          │
│           Tel: 01-234-5678               │
│                                          │
│  ════════════════════════════════════    │
│         BOLETA DE VENTA                  │
│            B001-0001234                  │
│  ════════════════════════════════════    │
│                                          │
│  Fecha: 07/01/2026  Hora: 15:30         │
│  Cajero: Juan Pérez                      │
│  Sucursal: Tienda Principal              │
│                                          │
│  ────────────────────────────────────    │
│  DESCRIPCIÓN           CANT    PRECIO    │
│  ────────────────────────────────────    │
│  Coca Cola 500ml         2      7.00    │
│  Nike Air Max 40-Rojo    1    280.00    │
│    (20% dcto aplicado)                   │
│  Polo Adidas M-Negro     1     80.00    │
│  ────────────────────────────────────    │
│                                          │
│  SUBTOTAL:                     367.00    │
│  DESCUENTO:                    -70.00    │
│  IGV (18%):                     53.46    │
│  ════════════════════════════════════    │
│  TOTAL:                  S/. 350.46     │
│  ════════════════════════════════════    │
│                                          │
│  PAGOS:                                  │
│  Efectivo:                     200.00    │
│  Yape:                         150.46    │
│                                          │
│  Vuelto:                         0.00    │
│                                          │
│  ────────────────────────────────────    │
│  Cliente: Juan García                    │
│  DNI: 12345678                          │
│  ────────────────────────────────────    │
│                                          │
│       ¡Gracias por su compra!           │
│    Vuelva pronto a visitarnos           │
│                                          │
│          [CÓDIGO QR]                     │
│                                          │
│  ════════════════════════════════════    │
│  Representación impresa de la boleta    │
│  electrónica. Consulte en SUNAT         │
│                                          │
└──────────────────────────────────────────┘
```

### Ticket 58mm (Compacto)

```
┌────────────────────────────┐
│                            │  <- 58mm
│        [LOGO]              │
│    NOMBRE EMPRESA          │
│    RUC: 12345678901        │
│                            │
│  ══════════════════════    │
│     BOLETA B001-0001234    │
│  ══════════════════════    │
│  07/01/2026  15:30        │
│  Cajero: Juan              │
│                            │
│  ──────────────────────    │
│  2x Coca Cola     S/7.00  │
│  1x Nike Air    S/280.00  │
│  1x Polo Adidas  S/80.00  │
│  ──────────────────────    │
│  TOTAL:       S/350.46    │
│  ══════════════════════    │
│  Efectivo:    S/200.00    │
│  Yape:        S/150.46    │
│                            │
│    ¡Gracias!              │
│                            │
└────────────────────────────┘
```

---

## 💻 IMPLEMENTACIÓN FRONTEND

### Componente de Impresión

```tsx
// src/components/print/ticket-template.tsx
// @reference: 03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, venta_pagos)

'use client';

import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketTemplateProps {
  venta: {
    id: string;
    numero_completo: string;
    fecha_venta: string;
    subtotal: number;
    descuento_total: number;
    impuesto_total: number;
    total: number;
    detalles: Array<{
      nombre: string;
      variante_nombre?: string;
      cantidad: number;
      precio_unitario: number;
      descuento_porcentaje: number;
      total: number;
    }>;
    pagos: Array<{
      metodo_pago: { nombre: string };
      monto: number;
    }>;
    cliente?: {
      nombre: string;
      apellido?: string;
      numero_documento?: string;
    };
    usuario: {
      nombre: string;
    };
    sucursal: {
      nombre: string;
    };
  };
  empresa: {
    nombre_comercial: string;
    ruc: string;
    direccion_fiscal?: string;
    telefono?: string;
    logo?: string;
  };
  config: {
    ancho_papel: '58mm' | '80mm';
    mostrar_logo: boolean;
    mensaje_pie: string;
  };
}

export const TicketTemplate = forwardRef<HTMLDivElement, TicketTemplateProps>(
  ({ venta, empresa, config }, ref) => {
    const ancho = config.ancho_papel === '58mm' ? '58mm' : '80mm';
    const fontSize = config.ancho_papel === '58mm' ? '10px' : '12px';

    return (
      <div
        ref={ref}
        className="ticket-print"
        style={{
          width: ancho,
          fontFamily: 'monospace',
          fontSize,
          padding: '5mm',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          {config.mostrar_logo && empresa.logo && (
            <img
              src={empresa.logo}
              alt={empresa.nombre_comercial}
              style={{ maxWidth: '50%', marginBottom: '5px' }}
            />
          )}
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {empresa.nombre_comercial}
          </div>
          <div>RUC: {empresa.ruc}</div>
          {empresa.direccion_fiscal && <div>{empresa.direccion_fiscal}</div>}
          {empresa.telefono && <div>Tel: {empresa.telefono}</div>}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '2px solid black', margin: '5px 0' }} />

        {/* Tipo documento y número */}
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          BOLETA DE VENTA
        </div>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
          {venta.numero_completo}
        </div>

        {/* Separador */}
        <div style={{ borderTop: '2px solid black', margin: '5px 0' }} />

        {/* Info venta */}
        <div style={{ marginBottom: '10px' }}>
          <div>
            Fecha: {format(new Date(venta.fecha_venta), 'dd/MM/yyyy', { locale: es })}
            {'  '}
            Hora: {format(new Date(venta.fecha_venta), 'HH:mm', { locale: es })}
          </div>
          <div>Cajero: {venta.usuario.nombre}</div>
          <div>Sucursal: {venta.sucursal.nombre}</div>
        </div>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed black', margin: '5px 0' }} />

        {/* Detalle productos */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Descripción</th>
              <th style={{ textAlign: 'right' }}>Cant</th>
              <th style={{ textAlign: 'right' }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles.map((item, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'left' }}>
                  {item.nombre}
                  {item.variante_nombre && (
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {item.variante_nombre}
                    </div>
                  )}
                  {item.descuento_porcentaje > 0 && (
                    <div style={{ fontSize: '9px', color: '#666' }}>
                      ({item.descuento_porcentaje}% dcto)
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                <td style={{ textAlign: 'right' }}>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Separador */}
        <div style={{ borderTop: '1px dashed black', margin: '5px 0' }} />

        {/* Totales */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>S/. {venta.subtotal.toFixed(2)}</span>
          </div>
          {venta.descuento_total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Descuento:</span>
              <span>-S/. {venta.descuento_total.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>IGV (18%):</span>
            <span>S/. {venta.impuesto_total.toFixed(2)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '14px',
              borderTop: '2px solid black',
              paddingTop: '5px',
              marginTop: '5px',
            }}
          >
            <span>TOTAL:</span>
            <span>S/. {venta.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Pagos */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>PAGOS:</div>
          {venta.pagos.map((pago, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{pago.metodo_pago.nombre}:</span>
              <span>S/. {pago.monto.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Cliente */}
        {venta.cliente && (
          <>
            <div style={{ borderTop: '1px dashed black', margin: '5px 0' }} />
            <div>
              <div>Cliente: {venta.cliente.nombre} {venta.cliente.apellido}</div>
              {venta.cliente.numero_documento && (
                <div>DNI/RUC: {venta.cliente.numero_documento}</div>
              )}
            </div>
          </>
        )}

        {/* Mensaje pie */}
        <div style={{ borderTop: '1px dashed black', margin: '5px 0' }} />
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          {config.mensaje_pie || '¡Gracias por su compra!'}
        </div>
      </div>
    );
  }
);

TicketTemplate.displayName = 'TicketTemplate';
```

### Hook de Impresión

```tsx
// src/hooks/use-print.ts

'use client';

import { useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

interface UsePrintOptions {
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function usePrint(options: UsePrintOptions = {}) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onBeforeGetContent: options.onBeforePrint,
    onAfterPrint: options.onAfterPrint,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return {
    componentRef,
    handlePrint,
  };
}
```

### Componente Botón de Impresión

```tsx
// src/components/print/print-button.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, MessageCircle, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePrint } from '@/hooks/use-print';
import { TicketTemplate } from './ticket-template';
import { ventasService } from '@/services/ventas.service';

interface PrintButtonProps {
  ventaId: string;
  venta?: any; // Si ya tienes los datos
}

export function PrintButton({ ventaId, venta: ventaProp }: PrintButtonProps) {
  const [venta, setVenta] = useState(ventaProp);
  const [loading, setLoading] = useState(false);
  const { componentRef, handlePrint } = usePrint();

  const loadVenta = async () => {
    if (!venta) {
      setLoading(true);
      try {
        const data = await ventasService.getById(ventaId);
        setVenta(data);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrintTicket = async () => {
    await loadVenta();
    setTimeout(handlePrint, 100); // Esperar render
  };

  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      const blob = await ventasService.downloadPdf(ventaId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-${venta?.numero_completo || ventaId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    // Implementar envío por WhatsApp
    const telefono = venta?.cliente?.celular || venta?.cliente?.telefono;
    if (!telefono) {
      alert('El cliente no tiene teléfono registrado');
      return;
    }

    const mensaje = `Hola! Aquí está tu boleta de compra ${venta.numero_completo} por S/. ${venta.total.toFixed(2)}`;
    const url = `https://wa.me/51${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Template oculto para imprimir */}
      <div style={{ display: 'none' }}>
        {venta && (
          <TicketTemplate
            ref={componentRef}
            venta={venta}
            empresa={venta.empresa}
            config={{
              ancho_papel: '80mm',
              mostrar_logo: true,
              mensaje_pie: '¡Gracias por su compra!',
            }}
          />
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={loading}>
            <Printer className="mr-2 h-4 w-4" />
            {loading ? 'Cargando...' : 'Imprimir'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handlePrintTicket}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Ticket
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadPdf}>
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendWhatsApp}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar por WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
```

---

## 💻 IMPLEMENTACIÓN BACKEND

### Servicio de Impresión

```typescript
// src/modules/impresion/impresion.service.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (tablas: ventas, venta_detalles, empresas)

import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { VentasService } from '../ventas/ventas.service';
import { EmpresasService } from '../empresas/empresas.service';

@Injectable()
export class ImpresionService {
  constructor(
    private ventasService: VentasService,
    private empresasService: EmpresasService,
  ) {}

  async generateBoletaPdf(ventaId: string, empresaId: string): Promise<Buffer> {
    // Obtener datos
    const venta = await this.ventasService.findOne(ventaId, empresaId);
    const empresa = await this.empresasService.findOne(empresaId);

    // Crear PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ========== CONTENIDO DEL PDF ==========

      // Logo y cabecera
      if (empresa.logo) {
        try {
          doc.image(empresa.logo, 50, 45, { width: 100 });
        } catch (e) {
          // Logo no disponible
        }
      }

      // Datos empresa
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(empresa.nombre_comercial, 200, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`RUC: ${empresa.ruc}`, 200, 75, { align: 'right' })
        .text(empresa.direccion_fiscal || '', 200, 90, { align: 'right' })
        .text(`Tel: ${empresa.telefono || ''}`, 200, 105, { align: 'right' });

      // Tipo y número de documento
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('BOLETA DE VENTA ELECTRÓNICA', 50, 150, { align: 'center' })
        .fontSize(14)
        .text(venta.numero_completo, 50, 175, { align: 'center' });

      // Línea separadora
      doc
        .moveTo(50, 200)
        .lineTo(545, 200)
        .stroke();

      // Datos de la venta
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Fecha: ${new Date(venta.fecha_venta).toLocaleDateString('es-PE')}`, 50, 220)
        .text(`Hora: ${new Date(venta.fecha_venta).toLocaleTimeString('es-PE')}`, 300, 220)
        .text(`Cajero: ${venta.usuario.nombre}`, 50, 240)
        .text(`Sucursal: ${venta.sucursal.nombre}`, 300, 240);

      // Cliente
      if (venta.cliente) {
        doc
          .text(`Cliente: ${venta.cliente.nombre} ${venta.cliente.apellido || ''}`, 50, 260)
          .text(`${venta.cliente.tipo_documento?.toUpperCase()}: ${venta.cliente.numero_documento || ''}`, 300, 260);
      }

      // Tabla de productos
      const tableTop = 300;
      const tableHeaders = ['Descripción', 'Cant.', 'P. Unit.', 'Dcto.', 'Total'];
      const columnWidths = [200, 50, 80, 60, 80];
      let currentY = tableTop;

      // Cabecera de tabla
      doc
        .font('Helvetica-Bold')
        .fontSize(10);

      let x = 50;
      tableHeaders.forEach((header, i) => {
        doc.text(header, x, currentY, { width: columnWidths[i], align: i === 0 ? 'left' : 'right' });
        x += columnWidths[i] + 10;
      });

      // Línea bajo cabecera
      currentY += 20;
      doc.moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 10;

      // Filas de productos
      doc.font('Helvetica').fontSize(9);

      venta.detalles.forEach((item) => {
        x = 50;

        // Nombre producto
        let nombre = item.nombre;
        if (item.variante_nombre) {
          nombre += ` (${item.variante_nombre})`;
        }
        doc.text(nombre, x, currentY, { width: columnWidths[0] });
        x += columnWidths[0] + 10;

        // Cantidad
        doc.text(item.cantidad.toString(), x, currentY, { width: columnWidths[1], align: 'right' });
        x += columnWidths[1] + 10;

        // Precio unitario
        doc.text(`S/. ${item.precio_unitario.toFixed(2)}`, x, currentY, { width: columnWidths[2], align: 'right' });
        x += columnWidths[2] + 10;

        // Descuento
        doc.text(item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '-', x, currentY, {
          width: columnWidths[3],
          align: 'right',
        });
        x += columnWidths[3] + 10;

        // Total
        doc.text(`S/. ${item.total.toFixed(2)}`, x, currentY, { width: columnWidths[4], align: 'right' });

        currentY += 20;

        // Nueva página si es necesario
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      });

      // Línea antes de totales
      currentY += 10;
      doc.moveTo(350, currentY).lineTo(545, currentY).stroke();
      currentY += 15;

      // Totales
      doc.font('Helvetica');
      doc.text('Subtotal:', 350, currentY);
      doc.text(`S/. ${venta.subtotal.toFixed(2)}`, 450, currentY, { align: 'right', width: 95 });
      currentY += 18;

      if (venta.descuento_total > 0) {
        doc.text('Descuento:', 350, currentY);
        doc.text(`-S/. ${venta.descuento_total.toFixed(2)}`, 450, currentY, { align: 'right', width: 95 });
        currentY += 18;
      }

      doc.text('IGV (18%):', 350, currentY);
      doc.text(`S/. ${venta.impuesto_total.toFixed(2)}`, 450, currentY, { align: 'right', width: 95 });
      currentY += 18;

      // Total
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', 350, currentY);
      doc.text(`S/. ${venta.total.toFixed(2)}`, 450, currentY, { align: 'right', width: 95 });
      currentY += 30;

      // Método de pago
      doc.font('Helvetica').fontSize(10);
      doc.text('FORMA DE PAGO:', 50, currentY);
      currentY += 18;

      venta.pagos.forEach((pago) => {
        doc.text(`${pago.metodo_pago.nombre}: S/. ${pago.monto.toFixed(2)}`, 70, currentY);
        currentY += 15;
      });

      // Pie de página
      currentY = 750;
      doc.fontSize(8).font('Helvetica');
      doc.text(
        'Representación impresa de la Boleta de Venta Electrónica.',
        50,
        currentY,
        { align: 'center' },
      );
      doc.text(
        'Consulte su comprobante en www.sunat.gob.pe',
        50,
        currentY + 12,
        { align: 'center' },
      );

      doc.end();
    });
  }

  async generateTicketHtml(ventaId: string, empresaId: string): Promise<string> {
    const venta = await this.ventasService.findOne(ventaId, empresaId);
    const empresa = await this.empresasService.findOne(empresaId);

    // Retornar HTML del ticket
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: monospace; font-size: 12px; width: 80mm; margin: 0; padding: 5mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 5px 0; }
            .total { font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 2px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center bold">${empresa.nombre_comercial}</div>
          <div class="center">RUC: ${empresa.ruc}</div>
          <div class="center">${empresa.direccion_fiscal || ''}</div>
          <div class="separator"></div>
          <div class="center bold">BOLETA DE VENTA</div>
          <div class="center bold">${venta.numero_completo}</div>
          <div class="separator"></div>
          <div>Fecha: ${new Date(venta.fecha_venta).toLocaleString('es-PE')}</div>
          <div>Cajero: ${venta.usuario.nombre}</div>
          <div class="separator"></div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="right">Cant</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${venta.detalles.map(item => `
                <tr>
                  <td>${item.nombre}${item.variante_nombre ? `<br><small>${item.variante_nombre}</small>` : ''}</td>
                  <td class="right">${item.cantidad}</td>
                  <td class="right">${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="separator"></div>
          <div class="right">Subtotal: S/. ${venta.subtotal.toFixed(2)}</div>
          ${venta.descuento_total > 0 ? `<div class="right">Dcto: -S/. ${venta.descuento_total.toFixed(2)}</div>` : ''}
          <div class="right">IGV: S/. ${venta.impuesto_total.toFixed(2)}</div>
          <div class="right total">TOTAL: S/. ${venta.total.toFixed(2)}</div>
          <div class="separator"></div>
          <div class="center">¡Gracias por su compra!</div>
        </body>
      </html>
    `;
  }
}
```

### Controller de Impresión

```typescript
// src/modules/impresion/impresion.controller.ts

import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImpresionService } from './impresion.service';

@Controller('impresion')
@UseGuards(JwtAuthGuard)
export class ImpresionController {
  constructor(private impresionService: ImpresionService) {}

  @Get('boleta/:ventaId/pdf')
  async downloadBoletaPdf(
    @Param('ventaId') ventaId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.impresionService.generateBoletaPdf(
      ventaId,
      user.empresa_id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=boleta-${ventaId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('boleta/:ventaId/html')
  async getTicketHtml(
    @Param('ventaId') ventaId: string,
    @CurrentUser() user: any,
  ) {
    return this.impresionService.generateTicketHtml(ventaId, user.empresa_id);
  }
}
```

---

## 📋 ESTILOS CSS PARA IMPRESIÓN

```css
/* src/app/globals.css - Añadir al final */

/* ========== ESTILOS DE IMPRESIÓN ========== */
@media print {
  /* Ocultar elementos que no se imprimen */
  .no-print,
  header,
  nav,
  aside,
  footer,
  .sidebar,
  .navbar,
  button:not(.print-button) {
    display: none !important;
  }

  /* Reset para impresión */
  body {
    margin: 0;
    padding: 0;
    background: white;
  }

  /* Ticket térmico 80mm */
  .ticket-print {
    width: 80mm !important;
    margin: 0;
    padding: 2mm;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.3;
  }

  /* Ticket térmico 58mm */
  .ticket-print-58 {
    width: 58mm !important;
    font-size: 10px;
  }

  /* Evitar cortes en elementos */
  .ticket-print * {
    page-break-inside: avoid;
  }
}

/* Página para ticket */
@page ticket {
  size: 80mm auto;
  margin: 0;
}

@page ticket-58 {
  size: 58mm auto;
  margin: 0;
}
```
