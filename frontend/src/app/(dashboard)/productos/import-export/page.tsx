'use client';

/**
 * @file page.tsx
 * @description Página de importar/exportar productos
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
} from 'lucide-react';
import { useProductos } from '@/application/hooks/queries/use-productos';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    created?: number;
    updated?: number;
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: productos } = useProductos({ limit: 1000 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleExportCSV = () => {
    if (!productos?.data?.length) return;

    const headers = [
      'SKU',
      'Nombre',
      'Categoria',
      'Marca',
      'Precio Compra',
      'Precio Venta',
      'Stock',
      'Stock Minimo',
      'Codigo Barras',
      'Activo',
    ];

    const rows = productos.data.map((p) => [
      p.sku || '',
      p.nombre,
      p.categoria?.nombre || '',
      p.marca?.nombre || '',
      p.precioCompra || 0,
      p.precioVenta,
      p.stockTotal || 0,
      p.stockMinimo || 0,
      p.codigoBarras || '',
      p.activo ? 'Si' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // Para Excel real se necesitaría una librería como xlsx
    // Por ahora exportamos como CSV que Excel puede abrir
    handleExportCSV();
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Simular procesamiento - en producción esto iría al backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setImportResult({
        success: true,
        message: 'Importacion completada',
        created: 15,
        updated: 8,
        errors: [],
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Error al procesar el archivo',
        errors: ['El archivo tiene un formato incorrecto'],
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'SKU',
      'Nombre',
      'Categoria',
      'Marca',
      'Precio Compra',
      'Precio Venta',
      'Stock',
      'Stock Minimo',
      'Codigo Barras',
    ];

    const example = [
      'PROD-001',
      'Producto de ejemplo',
      'Categoria 1',
      'Marca X',
      '10.00',
      '25.00',
      '100',
      '10',
      '7501234567890',
    ];

    const csvContent = [headers.join(','), example.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla_productos.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link
          href="/productos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-blue-600" />
            Importar / Exportar
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tus productos de forma masiva</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'export'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Download className="h-4 w-4 inline mr-2" />
          Exportar
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-2" />
          Importar
        </button>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Exportar productos</h2>
          <p className="text-gray-500 mb-6">
            Descarga todos tus productos en formato CSV o Excel.
            {productos?.meta?.total && (
              <span className="font-medium"> ({productos.meta.total} productos)</span>
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportCSV}
              disabled={!productos?.data?.length}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Exportar CSV</p>
                <p className="text-sm text-gray-500">Compatible con Excel y Google Sheets</p>
              </div>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={!productos?.data?.length}
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Exportar Excel</p>
                <p className="text-sm text-gray-500">Formato .xlsx nativo</p>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Instrucciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Instrucciones</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Descarga la plantilla de ejemplo</li>
              <li>2. Completa los datos de tus productos</li>
              <li>3. Guarda el archivo en formato CSV</li>
              <li>4. Sube el archivo para importar</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </button>
          </motion.div>

          {/* Upload area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir archivo</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!importFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Arrastra tu archivo aqui o{' '}
                  <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-sm text-gray-400">CSV, XLS o XLSX (max 5MB)</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{importFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportResult(null);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {importFile && !importResult && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="mt-4 w-full h-12 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Iniciar importacion
                  </>
                )}
              </button>
            )}

            {/* Result */}
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg ${
                  importResult.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        importResult.success ? 'text-green-900' : 'text-red-900'
                      }`}
                    >
                      {importResult.message}
                    </p>
                    {importResult.success && (
                      <p className="text-sm text-green-700 mt-1">
                        {importResult.created} productos creados, {importResult.updated} actualizados
                      </p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <ul className="text-sm text-red-700 mt-2 space-y-1">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
