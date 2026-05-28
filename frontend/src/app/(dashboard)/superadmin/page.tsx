'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/shared/motion';
import {
  Building2, Users, ShoppingCart, TrendingUp, Search,
  ToggleLeft, ToggleRight, Loader2, Plus, X, Copy, Check,
  MessageCircle
} from 'lucide-react';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

interface DashboardStats {
  totalEmpresas: number;
  empresasActivas: number;
  totalUsuarios: number;
  totalVentas: number;
  ventasHoy: number;
  empresasNuevasMes: number;
}

interface EmpresaItem {
  id: string;
  codigo: string;
  nombreComercial: string;
  email: string;
  ruc: string | null;
  plan: string | null;
  estado: string;
  activo: boolean;
  createdAt: string;
  _count: {
    usuarios: number;
    productos: number;
    sucursales: number;
    ventas: number;
  };
}

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
  esPopular: boolean;
}

interface CreatedEmpresa {
  empresa: { id: string; codigo: string; nombreComercial: string };
  credenciales: { email: string; password: string; urlLogin: string };
  mensajeWhatsApp: string;
}

export default function SuperAdminPage() {
  const { isDark } = useThemeStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  // Modal crear empresa
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nombreComercial: '',
    email: '',
    whatsapp: '',
    telefono: '',
    ruc: '',
    planId: '',
  });
  const [createdEmpresa, setCreatedEmpresa] = useState<CreatedEmpresa | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, empRes, planesRes] = await Promise.all([
        fetch(`${API_URL}/superadmin/dashboard`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API_URL}/superadmin/empresas?buscar=${encodeURIComponent(busqueda)}`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`${API_URL}/superadmin/planes`, { credentials: 'include' }).then((r) => r.json()),
      ]);
      setStats(dashRes.data);
      setEmpresas(empRes.data || []);
      setPlanes(planesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { setLoading(true); fetchData(); };

  const toggleEmpresa = async (id: string, activo: boolean) => {
    setToggling(id);
    try {
      await fetch(`${API_URL}/superadmin/empresas/${id}/toggle`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/superadmin/empresas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedEmpresa(data.data);
        fetchData();
      } else {
        alert(data.message || 'Error al crear empresa');
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear empresa');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = () => {
    if (createdEmpresa) {
      navigator.clipboard.writeText(createdEmpresa.mensajeWhatsApp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsApp = () => {
    if (createdEmpresa) {
      const phone = formData.whatsapp.replace(/\D/g, '');
      const message = encodeURIComponent(createdEmpresa.mensajeWhatsApp);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCreatedEmpresa(null);
    setFormData({ nombreComercial: '', email: '', whatsapp: '', telefono: '', ruc: '', planId: '' });
  };

  const statCards = stats ? [
    { label: 'Total Empresas', value: stats.totalEmpresas, icon: Building2, color: 'blue' },
    { label: 'Empresas Activas', value: stats.empresasActivas, icon: TrendingUp, color: 'green' },
    { label: 'Total Usuarios', value: stats.totalUsuarios, icon: Users, color: 'purple' },
    { label: 'Total Ventas', value: stats.totalVentas, icon: ShoppingCart, color: 'orange' },
  ] : [];

  if (loading && !stats) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Super Admin Panel</h1>
          <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Gestion global de la plataforma multi-tenant</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Empresa
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg bg-${card.color}-500/10`}>
                <card.icon className={`w-5 h-5 text-${card.color}-500`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar empresa por nombre, email, RUC..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
          />
        </div>
        <button onClick={handleSearch} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Buscar</button>
      </div>

      {/* Empresas table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'}>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Empresa</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Plan</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Usuarios</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Productos</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ventas</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Estado</th>
                <th className={`px-4 py-3 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((emp) => (
                <tr key={emp.id} className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'}`}>{emp.nombreComercial}</p>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{emp.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                      {emp.plan || 'Sin plan'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{emp._count.usuarios}</td>
                  <td className={`px-4 py-3 text-center text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{emp._count.productos}</td>
                  <td className={`px-4 py-3 text-center text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{emp._count.ventas}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium ${emp.activo ? 'text-green-500' : 'text-red-500'}`}>
                      {emp.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleEmpresa(emp.id, emp.activo)}
                      disabled={toggling === emp.id}
                      className={`p-1.5 rounded-lg transition-colors ${emp.activo ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                    >
                      {toggling === emp.id ? <Loader2 className="w-5 h-5 animate-spin" /> : emp.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Empresa */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
            >
              <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {createdEmpresa ? 'Empresa Creada' : 'Nueva Empresa'}
                </h2>
                <button onClick={closeModal} className={`p-2 rounded-lg ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!createdEmpresa ? (
                <form onSubmit={handleCreateEmpresa} className="p-5 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombreComercial}
                      onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                      placeholder="Ej: Bodega Don Pedro"
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="cliente@gmail.com"
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="51987654321"
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        Telefono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="01-1234567"
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        RUC
                      </label>
                      <input
                        type="text"
                        value={formData.ruc}
                        onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                        placeholder="20123456789"
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Plan
                    </label>
                    <select
                      value={formData.planId}
                      onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}
                    >
                      <option value="">Seleccionar plan...</option>
                      {planes.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.nombre} - S/{plan.precioMensual}/mes ({plan.maxUsuarios} usuarios, {plan.maxProductos} productos)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {creating ? 'Creando...' : 'Crear Empresa'}
                  </button>
                </form>
              ) : (
                <div className="p-5 space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                    <p className="text-green-500 font-medium">Empresa creada exitosamente</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Codigo: {createdEmpresa.empresa.codigo}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Mensaje para WhatsApp:
                    </label>
                    <div className={`p-4 rounded-lg text-sm whitespace-pre-wrap ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                      {createdEmpresa.mensajeWhatsApp}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyToClipboard}
                      className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                      }`}
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={openWhatsApp}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Enviar por WhatsApp
                    </button>
                  </div>

                  <button
                    onClick={closeModal}
                    className={`w-full py-3 rounded-lg font-medium ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
