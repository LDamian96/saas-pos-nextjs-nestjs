'use client';

import { useState } from 'react';
import { motion } from '@/shared/motion';
import { Printer, ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Switch } from '@/presentation/components/ui/switch';
import { Separator } from '@/presentation/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { Textarea } from '@/presentation/components/ui/textarea';
import { useEmpresa } from '@/application/hooks/queries/use-empresa';
import { useUpdateEmpresa } from '@/application/hooks/mutations/use-update-empresa';

export default function ImpresionPage() {
  const { data: empresa } = useEmpresa();
  const updateEmpresa = useUpdateEmpresa();

  const [config, setConfig] = useState({
    anchoTicket: '80',
    mostrarLogo: true,
    mostrarNombreEmpresa: true,
    mostrarDireccion: true,
    mostrarTelefono: true,
    mostrarRuc: true,
    encabezado: '',
    pieTicket: 'Gracias por su compra',
    mostrarVendedor: true,
    mostrarFechaHora: true,
    mostrarMetodoPago: true,
    copias: '1',
    imprimirAlVender: true,
    abrirCajon: true,
  });

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Save config to empresa settings
    toast.success('Configuración de impresión guardada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/configuracion"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Impresión</h1>
            <p className="text-gray-500 mt-1">
              Configura el formato de tickets y comprobantes
            </p>
          </div>
        </div>
        <Button size="lg" className="gap-2" onClick={handleSave}>
          <Save size={20} />
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Formato */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Formato de Ticket</h2>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ancho del papel (mm)</Label>
                    <Select
                      value={config.anchoTicket}
                      onValueChange={(v) => handleChange('anchoTicket', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58">58mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Copias</Label>
                    <Select
                      value={config.copias}
                      onValueChange={(v) => handleChange('copias', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 copia</SelectItem>
                        <SelectItem value="2">2 copias</SelectItem>
                        <SelectItem value="3">3 copias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Encabezado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Encabezado</h2>
                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Mostrar logo</Label>
                    <Switch
                      checked={config.mostrarLogo}
                      onCheckedChange={(v) => handleChange('mostrarLogo', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Nombre de empresa</Label>
                    <Switch
                      checked={config.mostrarNombreEmpresa}
                      onCheckedChange={(v) => handleChange('mostrarNombreEmpresa', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Dirección</Label>
                    <Switch
                      checked={config.mostrarDireccion}
                      onCheckedChange={(v) => handleChange('mostrarDireccion', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Teléfono</Label>
                    <Switch
                      checked={config.mostrarTelefono}
                      onCheckedChange={(v) => handleChange('mostrarTelefono', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>RUC/NIT</Label>
                    <Switch
                      checked={config.mostrarRuc}
                      onCheckedChange={(v) => handleChange('mostrarRuc', v)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Texto adicional de encabezado</Label>
                  <Textarea
                    value={config.encabezado}
                    onChange={(e) => handleChange('encabezado', e.target.value)}
                    placeholder="Texto que aparece debajo del logo..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detalle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Detalle de Venta</h2>
                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Vendedor</Label>
                    <Switch
                      checked={config.mostrarVendedor}
                      onCheckedChange={(v) => handleChange('mostrarVendedor', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Fecha y hora</Label>
                    <Switch
                      checked={config.mostrarFechaHora}
                      onCheckedChange={(v) => handleChange('mostrarFechaHora', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Método de pago</Label>
                    <Switch
                      checked={config.mostrarMetodoPago}
                      onCheckedChange={(v) => handleChange('mostrarMetodoPago', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Pie de Ticket</h2>
                <Separator />
                <div className="space-y-2">
                  <Label>Mensaje al pie</Label>
                  <Textarea
                    value={config.pieTicket}
                    onChange={(e) => handleChange('pieTicket', e.target.value)}
                    placeholder="Gracias por su compra"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Opciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Opciones</h2>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Imprimir automáticamente al vender</Label>
                    <Switch
                      checked={config.imprimirAlVender}
                      onCheckedChange={(v) => handleChange('imprimirAlVender', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Abrir cajón de dinero</Label>
                    <Switch
                      checked={config.abrirCajon}
                      onCheckedChange={(v) => handleChange('abrirCajon', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Vista Previa</h2>
                </div>
                <div
                  className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-4 mx-auto font-mono text-xs leading-relaxed"
                  style={{ maxWidth: config.anchoTicket === '58' ? '220px' : '300px' }}
                >
                  {config.mostrarLogo && (
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 bg-gray-200 rounded mx-auto mb-1" />
                    </div>
                  )}
                  {config.mostrarNombreEmpresa && (
                    <p className="text-center font-bold text-sm">
                      {empresa?.nombreComercial || 'Mi Empresa'}
                    </p>
                  )}
                  {config.mostrarDireccion && (
                    <p className="text-center text-gray-500">Av. Principal 123</p>
                  )}
                  {config.mostrarTelefono && (
                    <p className="text-center text-gray-500">Tel: 555-1234</p>
                  )}
                  {config.mostrarRuc && (
                    <p className="text-center text-gray-500">RUC: 20123456789</p>
                  )}
                  {config.encabezado && (
                    <p className="text-center text-gray-500 mt-1">{config.encabezado}</p>
                  )}
                  <div className="border-t border-dashed my-2" />
                  <div className="flex justify-between">
                    <span>Ticket:</span>
                    <span>#00001</span>
                  </div>
                  {config.mostrarFechaHora && (
                    <div className="flex justify-between text-gray-500">
                      <span>Fecha:</span>
                      <span>22/01/2026 15:30</span>
                    </div>
                  )}
                  {config.mostrarVendedor && (
                    <div className="flex justify-between text-gray-500">
                      <span>Cajero:</span>
                      <span>Juan</span>
                    </div>
                  )}
                  <div className="border-t border-dashed my-2" />
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Producto A x2</span>
                      <span>$200.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Producto B x1</span>
                      <span>$150.00</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed my-2" />
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span>$350.00</span>
                  </div>
                  {config.mostrarMetodoPago && (
                    <div className="flex justify-between text-gray-500">
                      <span>Pago:</span>
                      <span>Efectivo</span>
                    </div>
                  )}
                  <div className="border-t border-dashed my-2" />
                  {config.pieTicket && (
                    <p className="text-center text-gray-500">{config.pieTicket}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
