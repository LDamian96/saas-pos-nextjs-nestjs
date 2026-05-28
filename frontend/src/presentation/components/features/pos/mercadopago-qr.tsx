/**
 * @file mercadopago-qr.tsx
 * @description Componente para mostrar QR de pago de Mercado Pago
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from '@/shared/motion';
import { QrCode, Loader2, CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { metodosPagoService } from '@/application/services/metodos-pago.service';
import QRCode from 'qrcode';

interface MercadoPagoQRProps {
  items: Array<{
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
  }>;
  total: number;
  externalReference: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
}

type PaymentStatus = 'generating' | 'waiting' | 'checking' | 'approved' | 'error';

export function MercadoPagoQR({
  items,
  total,
  externalReference,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}: MercadoPagoQRProps) {
  const [status, setStatus] = useState<PaymentStatus>('generating');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [initPoint, setInitPoint] = useState<string>('');
  const [preferenceId, setPreferenceId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [pollCount, setPollCount] = useState(0);

  // Generar preferencia de pago
  const generatePreference = useCallback(async () => {
    setStatus('generating');
    setError('');

    try {
      const preferenceItems = items.map((item) => ({
        title: item.productoNombre,
        quantity: item.cantidad,
        unit_price: item.precioUnitario,
      }));

      const result = await metodosPagoService.createPreference({
        items: preferenceItems,
        external_reference: externalReference,
      });

      if (result.initPoint) {
        setInitPoint(result.initPoint);
        setPreferenceId(result.preferenceId);

        // Generar QR code para el init_point
        const qrUrl = await QRCode.toDataURL(result.initPoint, {
          width: 280,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(qrUrl);
        setStatus('waiting');
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar el pago');
      setStatus('error');
      onPaymentError(err.message || 'Error al generar el pago');
    }
  }, [items, externalReference, onPaymentError]);

  // Generar preferencia al montar
  useEffect(() => {
    generatePreference();
  }, [generatePreference]);

  // Polling para verificar estado del pago (cada 5 segundos, max 60 intentos = 5 min)
  useEffect(() => {
    if (status !== 'waiting') return;

    const checkPayment = async () => {
      if (pollCount >= 60) {
        setStatus('error');
        setError('Tiempo de espera agotado');
        return;
      }

      setPollCount((prev) => prev + 1);

      // En un sistema real, aquí consultaríamos el estado del pago
      // Por ahora, simulamos con el endpoint de consulta
      // El webhook debería actualizar el estado en el backend
      // y podríamos consultar el estado de la venta

      // Para demo, verificamos si hay un payment asociado al external_reference
      // Esto requeriría un endpoint adicional en el backend
    };

    const intervalId = setInterval(checkPayment, 5000);
    return () => clearInterval(intervalId);
  }, [status, pollCount, preferenceId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(value);
  };

  // Simular pago exitoso (para testing)
  const handleSimulateSuccess = () => {
    setStatus('approved');
    setTimeout(() => {
      onPaymentSuccess('simulated-payment-id');
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-blue-600" />
          Pago con Mercado Pago
        </h3>
        <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(total)}</p>
      </div>

      {/* Estado */}
      {status === 'generating' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-8"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-muted-foreground">Generando codigo QR...</p>
        </motion.div>
      )}

      {status === 'waiting' && qrDataUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-blue-100">
            <img src={qrDataUrl} alt="QR Mercado Pago" className="w-[280px] h-[280px]" />
          </div>

          <p className="mt-4 text-sm text-muted-foreground text-center">
            Escanea el codigo QR con la app de<br />
            <strong className="text-blue-600">Mercado Pago</strong> para pagar
          </p>

          {/* Link alternativo */}
          {initPoint && (
            <a
              href={initPoint}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir link de pago
            </a>
          )}

          {/* Indicador de espera */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Esperando confirmacion de pago...
          </div>

          {/* Botón para simular (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleSimulateSuccess}
            >
              (Dev) Simular pago exitoso
            </Button>
          )}
        </motion.div>
      )}

      {status === 'checking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-8"
        >
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-muted-foreground">Verificando pago...</p>
        </motion.div>
      )}

      {status === 'approved' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-8"
        >
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <p className="mt-4 text-lg font-semibold text-green-600">Pago aprobado!</p>
          <p className="text-sm text-muted-foreground">Completando la venta...</p>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-8"
        >
          <XCircle className="h-16 w-16 text-red-500" />
          <p className="mt-4 text-lg font-semibold text-red-600">Error en el pago</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={generatePreference}>
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </motion.div>
      )}

      {/* Cancelar */}
      {(status === 'waiting' || status === 'error') && (
        <Button variant="ghost" onClick={onCancel} className="mt-4">
          Cancelar y usar otro metodo
        </Button>
      )}
    </div>
  );
}
