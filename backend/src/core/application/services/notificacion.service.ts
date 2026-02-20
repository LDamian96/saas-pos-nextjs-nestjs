/**
 * @file notificacion.service.ts
 * @description Servicio para enviar notificaciones por email a clientes mayoristas
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface VentaNotificacionData {
  clienteNombre: string;
  clienteEmail: string;
  numeroVenta: string;
  items: {
    nombre: string;
    cantidad: number;
    precioOriginal: number;
    precioMayorista: number;
  }[];
  subtotalOriginal: number;
  subtotalMayorista: number;
  ahorro: number;
  total: number;
  vendedorNombre: string;
  empresaNombre: string;
  fecha: Date;
}

@Injectable()
export class NotificacionService {
  private readonly logger = new Logger(NotificacionService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    // Configure SMTP transporter
    const smtpHost = this.config.get('SMTP_HOST', 'smtp.gmail.com');
    const smtpPort = this.config.get('SMTP_PORT', 587);
    const smtpUser = this.config.get('SMTP_USER', '');
    const smtpPass = this.config.get('SMTP_PASS', '');

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('SMTP transporter configurado correctamente');
    } else {
      this.logger.warn('SMTP no configurado - notificaciones deshabilitadas');
    }
  }

  /**
   * Envia notificacion por email al cliente mayorista despues de una venta
   */
  async enviarNotificacionVentaMayorista(data: VentaNotificacionData): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('No se puede enviar email: SMTP no configurado');
      return false;
    }

    try {
      const fechaFormateada = data.fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const itemsHtml = data.items.map(item => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${item.nombre}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; text-decoration: line-through; color: #999;">S/ ${item.precioOriginal.toFixed(2)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #16a34a;">S/ ${item.precioMayorista.toFixed(2)}</td>
        </tr>
      `).join('');

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: #1e40af; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${data.empresaNombre}</h1>
            <p style="color: #93c5fd; margin: 8px 0 0; font-size: 14px;">Compra registrada a tu nombre</p>
          </div>

          <!-- Content -->
          <div style="padding: 24px;">
            <p style="color: #374151; margin: 0 0 16px;">Hola <strong>${data.clienteNombre}</strong>,</p>
            <p style="color: #6b7280; margin: 0 0 20px; font-size: 14px;">
              Se ha realizado una compra con tu cuenta de cliente mayorista:
            </p>

            <!-- Sale info -->
            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #6b7280;">Venta N:</td>
                  <td style="text-align: right; font-weight: bold;">${data.numeroVenta}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Fecha:</td>
                  <td style="text-align: right;">${fechaFormateada}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Atendido por:</td>
                  <td style="text-align: right;">${data.vendedorNombre}</td>
                </tr>
              </table>
            </div>

            <!-- Items table -->
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 8px 12px; text-align: left; color: #6b7280; font-weight: 500;">Producto</th>
                  <th style="padding: 8px 12px; text-align: center; color: #6b7280; font-weight: 500;">Cant.</th>
                  <th style="padding: 8px 12px; text-align: right; color: #6b7280; font-weight: 500;">P. Normal</th>
                  <th style="padding: 8px 12px; text-align: right; color: #6b7280; font-weight: 500;">Tu Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #6b7280; padding: 4px 0;">Precio normal:</td>
                  <td style="text-align: right; text-decoration: line-through; color: #999;">S/ ${data.subtotalOriginal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="color: #16a34a; font-weight: bold; padding: 4px 0;">Tu ahorro:</td>
                  <td style="text-align: right; color: #16a34a; font-weight: bold;">- S/ ${data.ahorro.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #bbf7d0;">
                  <td style="font-size: 18px; font-weight: bold; padding: 8px 0 0;">TOTAL PAGADO:</td>
                  <td style="text-align: right; font-size: 18px; font-weight: bold; padding: 8px 0 0;">S/ ${data.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              Si no reconoces esta compra, contacta inmediatamente a ${data.empresaNombre}.
            </p>
          </div>
        </div>
      </body>
      </html>
      `;

      const smtpUser = this.config.get('SMTP_USER', '');
      const empresaEmail = this.config.get('EMPRESA_EMAIL', smtpUser);

      await this.transporter.sendMail({
        from: `"${data.empresaNombre}" <${empresaEmail}>`,
        to: data.clienteEmail,
        subject: `Compra registrada - ${data.numeroVenta} - S/ ${data.total.toFixed(2)}`,
        html,
      });

      this.logger.log(`Email de notificacion enviado a ${data.clienteEmail} para venta ${data.numeroVenta}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email a ${data.clienteEmail}: ${error.message}`);
      return false;
    }
  }
}
