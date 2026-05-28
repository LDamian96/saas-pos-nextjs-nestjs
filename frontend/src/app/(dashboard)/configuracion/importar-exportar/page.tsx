'use client';

import { useState, useRef } from 'react';
import { motion } from '@/shared/motion';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/application/stores/auth.store';
import { useThemeStore } from '@/application/stores/theme.store';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/v1';

export default function ImportarExportarPage() {
  const { isDark } = useThemeStore();
  const usuario = useAuthStore((s) => s.usuario);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setResult(null);
    try {
      const response = await fetch(`${API_URL}/excel/exportar`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setResult({ type: 'success', message: 'Productos exportados exitosamente' });
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Error al exportar' });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_URL}/excel/plantilla`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al descargar plantilla');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-productos.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Error al descargar plantilla' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/excel/importar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al importar');

      setResult({
        type: 'success',
        message: `Importacion completada: ${data.data?.creados || 0} creados, ${data.data?.actualizados || 0} actualizados`,
      });
    } catch (err: any) {
      setResult({ type: 'error', message: err.message || 'Error al importar' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Importar / Exportar Productos
        </h1>
        <p className={`mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Gestiona tus productos masivamente usando archivos Excel
        </p>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            result.type === 'success'
              ? isDark ? 'bg-green-900/30 text-green-300 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'
              : isDark ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {result.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {result.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Exportar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <Download className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Exportar Productos
              </h3>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Descarga todos tus productos
              </p>
            </div>
          </div>
          <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Genera un archivo Excel con todos los productos de tu empresa, incluyendo categorias, marcas, precios y stock.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'
            }`}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </motion.div>

        {/* Importar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <Upload className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Importar Productos
              </h3>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Carga productos masivamente
              </p>
            </div>
          </div>
          <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Sube un archivo Excel con los productos a importar. Si el SKU ya existe, se actualizara el producto.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800'
                : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400'
            }`}
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importando...' : 'Seleccionar Archivo'}
          </button>
        </motion.div>

        {/* Plantilla */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <FileSpreadsheet className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Plantilla Excel
              </h3>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Descarga la plantilla base
              </p>
            </div>
          </div>
          <p className={`text-sm mb-4 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Descarga una plantilla vacia con las columnas correctas para llenar e importar tus productos.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Descargar Plantilla
          </button>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
      >
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Instrucciones
        </h3>
        <ul className={`space-y-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          <li>1. Descarga la <strong>plantilla Excel</strong> para ver el formato correcto.</li>
          <li>2. Llena los datos de tus productos en el archivo.</li>
          <li>3. Columnas requeridas: <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>nombre, sku, precioVenta</code></li>
          <li>4. Columnas opcionales: <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>precioCompra, descripcion, stockMinimo, unidadMedida</code></li>
          <li>5. Sube el archivo con el boton <strong>Importar</strong>.</li>
          <li>6. Si un producto con el mismo SKU ya existe, se actualizaran sus datos.</li>
        </ul>
      </motion.div>
    </div>
  );
}
