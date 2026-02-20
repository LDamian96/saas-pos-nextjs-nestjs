'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Star, Loader2, AlertCircle } from 'lucide-react';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioMensual: string;
  precioAnual: string;
  maxSucursales: number;
  maxUsuarios: number;
  maxProductos: number;
  features: string[] | null;
  esPopular: boolean;
}

interface Suscripcion {
  id: string;
  estado: string;
  periodoFacturacion: string;
  fechaInicio: string;
  precioActual: string;
  plan: Plan;
}

export default function BillingPage() {
  const { isDark } = useThemeStore();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<'mensual' | 'anual'>('mensual');

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/billing/planes`, { credentials: 'include' }).then((r) => r.json()),
      fetch(`${API_URL}/billing/mi-suscripcion`, { credentials: 'include' }).then((r) => r.json()),
    ]).then(([planesData, subData]) => {
      setPlanes(planesData.data || []);
      setSuscripcion(subData.data || null);
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const res = await fetch(`${API_URL}/billing/suscribir`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, periodoFacturacion: periodo }),
      });
      const data = await res.json();
      if (data.success) setSuscripcion(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancelar tu suscripcion actual?')) return;
    await fetch(`${API_URL}/billing/cancelar`, { method: 'POST', credentials: 'include' });
    setSuscripcion(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Planes y Facturacion</h1>
        <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Administra tu suscripcion y plan actual</p>
      </motion.div>

      {/* Current subscription */}
      {suscripcion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <CreditCard className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Plan {suscripcion.plan.nombre}</p>
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Estado: <span className="text-green-500 font-medium">{suscripcion.estado}</span> | S/ {Number(suscripcion.precioActual).toFixed(2)}/{suscripcion.periodoFacturacion === 'anual' ? 'ano' : 'mes'}
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-lg text-sm">Cancelar Plan</button>
          </div>
        </motion.div>
      )}

      {/* Period toggle */}
      <div className="flex justify-center">
        <div className={`inline-flex rounded-lg p-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <button onClick={() => setPeriodo('mensual')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodo === 'mensual' ? 'bg-blue-600 text-white' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Mensual</button>
          <button onClick={() => setPeriodo('anual')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${periodo === 'anual' ? 'bg-blue-600 text-white' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Anual <span className="text-xs opacity-75">(-17%)</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planes.map((plan, i) => {
          const precio = periodo === 'anual' ? Number(plan.precioAnual) / 12 : Number(plan.precioMensual);
          const isCurrentPlan = suscripcion?.plan.id === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-6 rounded-xl border ${
                plan.esPopular
                  ? isDark ? 'border-blue-600 bg-zinc-900' : 'border-blue-500 bg-white'
                  : isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
              }`}
            >
              {plan.esPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Popular
                </div>
              )}
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{plan.nombre}</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{plan.descripcion}</p>
              <div className="mt-4">
                <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>S/ {precio.toFixed(0)}</span>
                <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>/mes</span>
              </div>
              <ul className="mt-4 space-y-2">
                <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <Check className="w-4 h-4 text-green-500" /> {plan.maxSucursales} sucursal{plan.maxSucursales > 1 ? 'es' : ''}
                </li>
                <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <Check className="w-4 h-4 text-green-500" /> {plan.maxUsuarios} usuarios
                </li>
                <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <Check className="w-4 h-4 text-green-500" /> {plan.maxProductos.toLocaleString()} productos
                </li>
                {plan.features && (plan.features as string[]).map((f, idx) => (
                  <li key={idx} className={`text-sm flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    <Check className="w-4 h-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || subscribing === plan.id}
                className={`w-full mt-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrentPlan
                    ? isDark ? 'bg-zinc-800 text-zinc-500 cursor-default' : 'bg-zinc-100 text-zinc-400 cursor-default'
                    : plan.esPopular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                {subscribing === plan.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isCurrentPlan ? 'Plan Actual' : 'Seleccionar Plan'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
