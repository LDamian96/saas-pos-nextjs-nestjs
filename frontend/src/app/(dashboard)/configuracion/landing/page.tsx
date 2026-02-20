'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, GripVertical, Trash2, Edit2, Eye, Loader2, Save } from 'lucide-react';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

const TIPOS_SECCION = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'features', label: 'Caracteristicas' },
  { value: 'testimonios', label: 'Testimonios' },
  { value: 'pricing', label: 'Precios' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'gallery', label: 'Galeria' },
];

interface Seccion {
  id: string;
  tipo: string;
  titulo: string | null;
  subtitulo: string | null;
  contenido: any;
  imagen: string | null;
  orden: number;
  activo: boolean;
}

export default function LandingAdminPage() {
  const { isDark } = useThemeStore();
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Seccion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipo: 'hero', titulo: '', subtitulo: '', imagen: '' });

  const fetchSecciones = async () => {
    try {
      const res = await fetch(`${API_URL}/landing/secciones`, { credentials: 'include' });
      const data = await res.json();
      setSecciones(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSecciones(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/landing/secciones`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ tipo: 'hero', titulo: '', subtitulo: '', imagen: '' });
        fetchSecciones();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/landing/secciones/${editing.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(null);
      setShowForm(false);
      fetchSecciones();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta seccion?')) return;
    await fetch(`${API_URL}/landing/secciones/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchSecciones();
  };

  const startEdit = (s: Seccion) => {
    setEditing(s);
    setForm({ tipo: s.tipo, titulo: s.titulo || '', subtitulo: s.subtitulo || '', imagen: s.imagen || '' });
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Landing Page</h1>
          <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Administra las secciones de tu pagina publica</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ tipo: 'hero', titulo: '', subtitulo: '', imagen: '' }); setShowForm(true); }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Seccion
        </button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {editing ? 'Editar Seccion' : 'Nueva Seccion'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`}>
                {TIPOS_SECCION.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Imagen URL</label>
              <input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`} placeholder="https://..." />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Titulo</label>
              <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`} />
            </div>
            <div>
              <label className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Subtitulo</label>
              <input value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} className={`mt-1 w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300'}`} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={editing ? handleUpdate : handleCreate} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>Cancelar</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : secciones.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay secciones. Crea la primera para empezar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {secciones.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
            >
              <GripVertical className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{s.tipo}</span>
                  <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{s.titulo || '(Sin titulo)'}</span>
                </div>
                {s.subtitulo && <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{s.subtitulo}</p>}
              </div>
              <div className={`text-xs ${s.activo ? 'text-green-500' : 'text-red-500'}`}>{s.activo ? 'Activo' : 'Inactivo'}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(s)} className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
