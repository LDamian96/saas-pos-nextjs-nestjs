'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/shared/motion';
import { Building2, Receipt, Printer, Wifi, Share2, MessageCircle, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface NegocioConfig {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  // Comprobantes
  ticketActivo: boolean;
  boletaActiva: boolean;
  facturaActiva: boolean;
  enviarWhatsapp: boolean;
  // Impresión PWA
  imprimirDespuesVenta: boolean;
  metodoImpresion: 'compartir' | 'wifi';
  ipImpresora: string;
  // Nubefact
  nubefactActivo: boolean;
  nubefactUrl: string;
  nubefactToken: string;
  nubefactModo: 'demo' | 'produccion';
}

const STORAGE_KEY = 'pos-negocio-config';

function getDefaultConfig(): NegocioConfig {
  return {
    nombre: '',
    ruc: '',
    direccion: '',
    telefono: '',
    ticketActivo: true,
    boletaActiva: false,
    facturaActiva: false,
    enviarWhatsapp: true,
    imprimirDespuesVenta: false,
    metodoImpresion: 'compartir',
    ipImpresora: '',
    nubefactActivo: false,
    nubefactUrl: '',
    nubefactToken: '',
    nubefactModo: 'demo',
  };
}

export default function NegocioConfigPage() {
  const [config, setConfig] = useState<NegocioConfig>(getDefaultConfig());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfig({ ...getDefaultConfig(), ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    toast.success('Configuracion guardada');
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (field: keyof NegocioConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const Toggle = ({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-zinc-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="max-w-lg mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <Link href="/configuracion" className="p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <h1 className="text-xl font-bold">Configuracion del Negocio</h1>
      </motion.div>

      <div className="space-y-5">
        {/* ========= MI NEGOCIO ========= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="font-semibold">Mi Negocio</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del negocio</label>
              <input type="text" value={config.nombre} onChange={(e) => update('nombre', e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-sm"
                placeholder="Ej: Mi Tienda de Ropa" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">RUC</label>
                <input type="text" value={config.ruc} onChange={(e) => update('ruc', e.target.value)} maxLength={11}
                  className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-sm font-mono"
                  placeholder="Solo formales" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Telefono</label>
                <input type="tel" value={config.telefono} onChange={(e) => update('telefono', e.target.value)}
                  className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-sm"
                  placeholder="987654321" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Direccion</label>
              <input type="text" value={config.direccion} onChange={(e) => update('direccion', e.target.value)}
                className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-sm"
                placeholder="Av. Principal 123" />
            </div>
          </div>
        </motion.div>

        {/* ========= COMPROBANTES ========= */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="font-semibold">Comprobantes</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            <Toggle value={config.ticketActivo} onChange={(v) => update('ticketActivo', v)}
              label="Ticket" description="Comprobante simple sin valor tributario" />
            <Toggle value={config.boletaActiva} onChange={(v) => update('boletaActiva', v)}
              label="Boleta" description="Requiere Nubefact para emision electronica" />
            <Toggle value={config.facturaActiva} onChange={(v) => update('facturaActiva', v)}
              label="Factura" description="Requiere Nubefact y RUC del negocio" />
            <Toggle value={config.enviarWhatsapp} onChange={(v) => update('enviarWhatsapp', v)}
              label="Enviar por WhatsApp" description="Mostrar opcion de enviar comprobante por WhatsApp" />
          </div>
        </motion.div>

        {/* ========= NUBEFACT ========= */}
        {(config.boletaActiva || config.facturaActiva) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-indigo-600" />
              </div>
              <h2 className="font-semibold">Nubefact</h2>
              <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 px-2 py-0.5 rounded-full font-medium">SUNAT</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-3">
              Necesitas una cuenta en nubefact.com para emitir boletas y facturas legales
            </p>
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
              <Toggle value={config.nubefactActivo} onChange={(v) => update('nubefactActivo', v)}
                label="Activar Nubefact" description="Conectar con SUNAT" />
            </div>
            {config.nubefactActivo && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">URL API</label>
                  <input type="url" value={config.nubefactUrl} onChange={(e) => update('nubefactUrl', e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-xs font-mono"
                    placeholder="https://api.nubefact.com/api/v1/..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Token</label>
                  <input type="password" value={config.nubefactToken} onChange={(e) => update('nubefactToken', e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 focus:border-blue-500 focus:outline-none transition-all text-xs font-mono"
                    placeholder="Tu token de Nubefact" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Modo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => update('nubefactModo', 'demo')}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all border-2 ${
                        config.nubefactModo === 'demo'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500'
                      }`}>
                      Demo (Pruebas)
                    </button>
                    <button type="button" onClick={() => update('nubefactModo', 'produccion')}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all border-2 ${
                        config.nubefactModo === 'produccion'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-500'
                      }`}>
                      Produccion (Real)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========= GUARDAR ========= */}
        <button onClick={handleSave}
          className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25">
          {saved ? (
            <><CheckCircle className="h-5 w-5" /> Guardado</>
          ) : (
            <><Save className="h-5 w-5" /> Guardar Configuracion</>
          )}
        </button>
      </div>
    </div>
  );
}
