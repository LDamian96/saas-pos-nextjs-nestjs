'use client';

/**
 * @file page.tsx
 * @description Configuracion de facturacion electronica SUNAT
 *
 * Proveedores soportados:
 * - Nubefact (sandbox gratis para pruebas)
 * - Facturalo (open source)
 * - Modo simulado (sin conexion a SUNAT)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { facturacionService, ConfiguracionFacturacion } from '@/application/services/facturacion.service';

export default function FacturacionConfigPage() {
  const [config, setConfig] = useState<ConfiguracionFacturacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await facturacionService.getConfiguracion();
      setConfig(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar configuracion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const getProveedorInfo = () => {
    if (!config) return null;

    switch (config.proveedor) {
      case 'nubefact':
        return {
          nombre: 'Nubefact',
          descripcion: 'Proveedor de facturacion electronica certificado por SUNAT',
          url: 'https://www.nubefact.com/',
          color: 'bg-blue-500',
        };
      case 'facturalo':
        return {
          nombre: 'Facturalo Peru',
          descripcion: 'Sistema open source de facturacion electronica',
          url: 'https://github.com/PRY20220262/facturalo',
          color: 'bg-green-500',
        };
      default:
        return {
          nombre: 'Modo Simulado',
          descripcion: 'Los comprobantes se generan localmente sin enviar a SUNAT',
          url: null,
          color: 'bg-gray-500',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const proveedorInfo = getProveedorInfo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturacion Electronica</h1>
        <p className="text-gray-500 mt-1">
          Configuracion para emision de boletas y facturas electronicas SUNAT
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <Button variant="outline" size="sm" onClick={cargarConfiguracion} className="ml-auto">
            Reintentar
          </Button>
        </div>
      )}

      {config && (
        <div className="grid gap-6">
          {/* Estado General */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`${proveedorInfo?.color} p-3 rounded-lg`}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{proveedorInfo?.nombre}</h3>
                  <p className="text-gray-500 text-sm">{proveedorInfo?.descripcion}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={config.modo === 'beta' ? 'secondary' : 'default'}>
                  {config.modo === 'beta' ? 'MODO PRUEBAS' : 'PRODUCCION'}
                </Badge>
                {config.proveedorConectado ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Sin conexion
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* Configuracion Nubefact */}
          {config.proveedor === 'nubefact' && config.nubefactConfig && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Configuracion Nubefact</h3>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Modo</span>
                  <Badge variant={config.nubefactConfig.isDemo ? 'secondary' : 'default'}>
                    {config.nubefactConfig.isDemo ? 'SANDBOX (Demo)' : 'Produccion'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">RUC</span>
                  <span className="font-mono">{config.nubefactConfig.ruc}</span>
                </div>
                {config.nubefactConfig.isDemo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-blue-800 font-medium">Modo Sandbox Activo</p>
                        <p className="text-blue-600 text-sm mt-1">
                          Estas usando el ambiente de pruebas gratuito de Nubefact.
                          Los comprobantes emitidos son validos para testing pero NO
                          tienen validez legal ante SUNAT.
                        </p>
                        <a
                          href="https://www.nubefact.com/precios"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm mt-2"
                        >
                          Ver planes de produccion
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          )}

          {/* Info Modo Simulado */}
          {config.proveedor === 'simulado' && (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium">Modo Simulado</p>
                  <p className="text-amber-600 text-sm mt-1">
                    El sistema esta generando comprobantes simulados. Para emitir
                    comprobantes reales necesitas configurar un proveedor de facturacion.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Como funciona */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Como emitir comprobantes</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Realiza una venta en el POS</p>
                  <p className="text-gray-500 text-sm">
                    Agrega productos al carrito y procede al pago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Selecciona el tipo de comprobante</p>
                  <p className="text-gray-500 text-sm">
                    Elige entre Ticket, Boleta o Factura en el modal de pago
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Ingresa datos del cliente (si es Factura)</p>
                  <p className="text-gray-500 text-sm">
                    Para facturas se requiere RUC de 11 digitos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Completa la venta</p>
                  <p className="text-gray-500 text-sm">
                    El sistema emitira el comprobante automaticamente
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Acciones */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={cargarConfiguracion}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar estado
            </Button>
            {proveedorInfo?.url && (
              <Button variant="outline" asChild>
                <a href={proveedorInfo.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir a {proveedorInfo.nombre}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
