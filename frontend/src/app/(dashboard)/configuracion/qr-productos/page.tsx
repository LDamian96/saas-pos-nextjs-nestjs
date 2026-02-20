'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Search, Loader2, CheckSquare, Square } from 'lucide-react';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

interface Producto {
  id: string;
  nombre: string;
  sku: string;
  codigoInterno: string;
  precioVenta: string;
}

interface QrResult {
  id: string;
  codigo: string;
  nombre: string;
  qr: string;
}

export default function QrProductosPage() {
  const { isDark } = useThemeStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrResults, setQrResults] = useState<QrResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const buscarProductos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/productos?buscar=${encodeURIComponent(busqueda)}&limit=50`, {
        credentials: 'include',
      });
      const data = await response.json();
      setProductos(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === productos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(productos.map((p) => p.id)));
    }
  };

  const generarQrBatch = async () => {
    if (selectedIds.size === 0) return;
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/qr/batch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoIds: Array.from(selectedIds) }),
      });
      const data = await response.json();
      setQrResults(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQr = async (productoId: string, nombre: string) => {
    try {
      const response = await fetch(`${API_URL}/qr/producto/${productoId}`, {
        credentials: 'include',
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${nombre}.png`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const printQrCodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>QR Codes</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .item { text-align: center; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .item img { width: 150px; height: 150px; }
        .item p { margin: 8px 0 0; font-size: 12px; font-weight: bold; }
        @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
      </style></head><body>
      <div class="grid">
        ${qrResults.map((r) => `<div class="item"><img src="${r.qr}" /><p>${r.codigo}</p><p>${r.nombre}</p></div>`).join('')}
      </div>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          QR de Productos
        </h1>
        <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Genera codigos QR para tus productos
        </p>
      </motion.div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarProductos()}
            placeholder="Buscar productos por nombre, SKU..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500'
                : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>
        <button
          onClick={buscarProductos}
          disabled={loading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </button>
      </div>

      {/* Product Selection */}
      {productos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
        >
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'}`}>
                {selectedIds.size === productos.length ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
              </button>
              <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {selectedIds.size} seleccionados de {productos.length}
              </span>
            </div>
            <button
              onClick={generarQrBatch}
              disabled={selectedIds.size === 0 || generating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generar QR ({selectedIds.size})
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {productos.map((p) => (
              <div
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                  isDark
                    ? `border-zinc-800 ${selectedIds.has(p.id) ? 'bg-blue-900/20' : 'hover:bg-zinc-800'}`
                    : `border-zinc-100 ${selectedIds.has(p.id) ? 'bg-blue-50' : 'hover:bg-zinc-50'}`
                }`}
              >
                {selectedIds.has(p.id) ? (
                  <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Square className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>{p.nombre}</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>SKU: {p.sku} | Codigo: {p.codigoInterno}</p>
                </div>
                <span className={`text-sm font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  S/ {Number(p.precioVenta).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* QR Results */}
      {qrResults.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Codigos QR Generados ({qrResults.length})
            </h2>
            <button
              onClick={printQrCodes}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium"
            >
              Imprimir Todos
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {qrResults.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border text-center ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
              >
                <img src={r.qr} alt={`QR ${r.nombre}`} className="w-32 h-32 mx-auto mb-2" />
                <p className={`text-xs font-mono mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{r.codigo}</p>
                <p className={`text-xs truncate ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{r.nombre}</p>
                <button
                  onClick={() => downloadQr(r.id, r.codigo)}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1 mx-auto"
                >
                  <Download className="w-3 h-3" /> PNG
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
