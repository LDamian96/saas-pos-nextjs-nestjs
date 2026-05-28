'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/shared/motion';
import { Search, Save, Plus, Loader2, Globe } from 'lucide-react';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

const PAGINAS = ['home', 'productos', 'nosotros', 'contacto', 'blog', 'tienda'];

interface SeoItem {
  id: string;
  pagina: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
}

export default function SeoConfigPage() {
  const { isDark } = useThemeStore();
  const [configs, setConfigs] = useState<SeoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPagina, setSelectedPagina] = useState('home');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
  });

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API_URL}/seo`, { credentials: 'include' });
      const data = await res.json();
      setConfigs(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  useEffect(() => {
    const existing = configs.find((c) => c.pagina === selectedPagina);
    if (existing) {
      setForm({
        metaTitle: existing.metaTitle || '',
        metaDescription: existing.metaDescription || '',
        metaKeywords: existing.metaKeywords || '',
        ogImage: existing.ogImage || '',
        ogTitle: existing.ogTitle || '',
        ogDescription: existing.ogDescription || '',
      });
    } else {
      setForm({ metaTitle: '', metaDescription: '', metaKeywords: '', ogImage: '', ogTitle: '', ogDescription: '' });
    }
  }, [selectedPagina, configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/seo/${selectedPagina}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      fetchConfigs();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'}`;
  const labelClass = `block text-sm font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`;

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Configuracion SEO</h1>
        <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Optimiza el posicionamiento de tu tienda en buscadores</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page selector */}
        <div className={`lg:col-span-1 p-4 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Paginas</h3>
          <div className="space-y-1">
            {PAGINAS.map((p) => {
              const hasConfig = configs.some((c) => c.pagina === p);
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPagina(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedPagina === p
                      ? isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
                      : isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span className="capitalize">{p}</span>
                  {hasConfig && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <motion.div
          key={selectedPagina}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`lg:col-span-3 p-6 rounded-xl border space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <Globe className="w-4 h-4 inline mr-2" />{selectedPagina}
            </h3>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Meta Title</label>
              <input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className={inputClass} placeholder="Titulo de la pagina" />
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{form.metaTitle.length}/60 caracteres</p>
            </div>
            <div>
              <label className={labelClass}>OG Title</label>
              <input value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} className={inputClass} placeholder="Titulo para redes sociales" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Meta Description</label>
              <textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className={`${inputClass} resize-none`} rows={2} placeholder="Descripcion para buscadores (max 160 caracteres)" />
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{form.metaDescription.length}/160 caracteres</p>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Meta Keywords</label>
              <input value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} className={inputClass} placeholder="palabra1, palabra2, palabra3" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>OG Description</label>
              <textarea value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} className={`${inputClass} resize-none`} rows={2} placeholder="Descripcion para redes sociales" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>OG Image URL</label>
              <input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} className={inputClass} placeholder="https://tu-dominio.com/imagen.jpg" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
