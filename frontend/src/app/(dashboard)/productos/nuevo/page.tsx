'use client';

/**
 * @file page.tsx
 * @description Pagina para crear nuevo producto - Layout limpio 2 columnas
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Package, Save, Trash2, Layers, Box,
  Palette, BarChart3, Eye, Bell
} from 'lucide-react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { useCategorias, useCategoriaAtributos } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { useCreateProducto } from '@/application/hooks/mutations/use-productos-mutations';
import { CreateProductoDto } from '@/application/services/productos.service';
import { Badge } from '@/presentation/components/ui/badge';

interface AtributoSeleccion {
  atributoId: string;
  atributoNombre: string;
  valoresIds: string[];
}

interface VarianteGenerada {
  nombre: string;
  sku: string;
  codigoBarras: string;
  valoresAtributoIds: string[];
  valoresTexto: string[];
  precioVenta: number;
  precioCompra: number;
  precioMayorista: number;
  stock: number;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const createMutation = useCreateProducto();

  const [selectedAtributos, setSelectedAtributos] = useState<AtributoSeleccion[]>([]);
  const [generatedVariantes, setGeneratedVariantes] = useState<VarianteGenerada[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CreateProductoDto>({
    defaultValues: {
      tipo: 'simple',
      aplicaImpuesto: true,
      manejaStock: true,
      activo: true,
      visiblePos: true,
      visibleWeb: true,
      stock: 0,
      stockMinimo: 5,
    },
  });

  const categoriaId = useWatch({ control, name: 'categoriaId' });
  const tipoProducto = useWatch({ control, name: 'tipo' });
  const precioVentaBase = useWatch({ control, name: 'precioVenta' });
  const precioCompraBase = useWatch({ control, name: 'precioCompra' });
  const precioMayoristaBase = useWatch({ control, name: 'precioMayorista' });
  const nombreProducto = useWatch({ control, name: 'nombre' });

  const { data: categoriaAtributos, isLoading: loadingAtributos } = useCategoriaAtributos(categoriaId || '');

  useEffect(() => {
    setSelectedAtributos([]);
    setGeneratedVariantes([]);
  }, [categoriaId]);

  // Generate variants from attribute combinations
  useEffect(() => {
    if (tipoProducto !== 'variable' || selectedAtributos.length === 0) {
      setGeneratedVariantes([]);
      return;
    }

    const atributosConValores = selectedAtributos.filter(a => a.valoresIds.length > 0);
    if (atributosConValores.length === 0) {
      setGeneratedVariantes([]);
      return;
    }

    const generarCombinaciones = (
      atributos: AtributoSeleccion[],
      index: number = 0,
      current: { id: string; texto: string }[] = []
    ): { ids: string[]; textos: string[] }[] => {
      if (index === atributos.length) {
        return [{ ids: current.map(c => c.id), textos: current.map(c => c.texto) }];
      }
      const atributo = atributos[index];
      const resultados: { ids: string[]; textos: string[] }[] = [];
      const atributoData = categoriaAtributos?.find(ca => ca.atributo.id === atributo.atributoId);
      for (const valorId of atributo.valoresIds) {
        const valorData = (atributoData?.atributo as any)?.valores?.find((v: any) => v.id === valorId);
        const valorTexto = valorData?.valor || valorId;
        resultados.push(...generarCombinaciones(atributos, index + 1, [...current, { id: valorId, texto: valorTexto }]));
      }
      return resultados;
    };

    const combinaciones = generarCombinaciones(atributosConValores);

    setGeneratedVariantes(prev => {
      return combinaciones.map((combo, idx) => {
        const key = combo.ids.join('-');
        const existing = prev.find(v => v.valoresAtributoIds.join('-') === key);
        return existing || {
          nombre: combo.textos.join(' / '),
          sku: `${nombreProducto?.substring(0, 3).toUpperCase() || 'VAR'}-${idx + 1}`.replace(/\s/g, ''),
          codigoBarras: '',
          valoresAtributoIds: combo.ids,
          valoresTexto: combo.textos,
          precioVenta: precioVentaBase || 0,
          precioCompra: precioCompraBase || 0,
          precioMayorista: precioMayoristaBase || 0,
          stock: 0,
        };
      });
    });
  }, [selectedAtributos, tipoProducto, categoriaAtributos, nombreProducto, precioVentaBase, precioCompraBase, precioMayoristaBase]);

  const toggleValorAtributo = (atributoId: string, atributoNombre: string, valorId: string) => {
    setSelectedAtributos(prev => {
      const existing = prev.find(a => a.atributoId === atributoId);
      if (existing) {
        const hasValor = existing.valoresIds.includes(valorId);
        const newValores = hasValor
          ? existing.valoresIds.filter(v => v !== valorId)
          : [...existing.valoresIds, valorId];
        if (newValores.length === 0) return prev.filter(a => a.atributoId !== atributoId);
        return prev.map(a => a.atributoId === atributoId ? { ...a, valoresIds: newValores } : a);
      }
      return [...prev, { atributoId, atributoNombre, valoresIds: [valorId] }];
    });
  };

  const updateVarianteField = (index: number, field: keyof VarianteGenerada, value: any) => {
    setGeneratedVariantes(prev =>
      prev.map((v, i) => i === index ? { ...v, [field]: value } : v)
    );
  };

  const removeVariante = (index: number) => {
    setGeneratedVariantes(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateProductoDto) => {
    try {
      if (data.tipo === 'variable' && generatedVariantes.length > 0) {
        data.variantes = generatedVariantes.map(v => ({
          sku: v.sku,
          codigoBarras: v.codigoBarras || undefined,
          nombreVariante: v.nombre,
          precioVenta: v.precioVenta,
          precioCompra: v.precioCompra,
          precioMayorista: v.precioMayorista || undefined,
          stock: v.stock,
          valoresAtributoIds: v.valoresAtributoIds,
          activo: true,
        }));
      }
      const producto = await createMutation.mutateAsync(data);
      router.push(`/productos/${producto.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isVariable = tipoProducto === 'variable';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/productos" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
            <p className="text-sm text-gray-500">Completa los datos del producto</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Crear Producto
            </>
          )}
        </button>
      </motion.div>

      {/* Type Selector - clean inline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-3"
      >
        <label
          className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white ${
            !isVariable
              ? 'border-blue-500 shadow-sm'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input type="radio" value="simple" {...register('tipo')} className="sr-only" />
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            !isVariable ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Box className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-medium ${!isVariable ? 'text-gray-900' : 'text-gray-500'}`}>Simple</p>
            <p className="text-xs text-gray-400">Un solo precio y stock</p>
          </div>
        </label>

        <label
          className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white ${
            isVariable
              ? 'border-purple-500 shadow-sm'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input type="radio" value="variable" {...register('tipo')} className="sr-only" />
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isVariable ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-medium ${isVariable ? 'text-gray-900' : 'text-gray-500'}`}>Variable</p>
            <p className="text-xs text-gray-400">Tallas, colores, etc.</p>
          </div>
        </label>
      </motion.div>

      {/* ============ 2-Column Layout ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ---- LEFT (2/3) ---- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  {...register('nombre', { required: 'El nombre es requerido' })}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  placeholder="Nombre del producto"
                />
                {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select
                  {...register('categoriaId', { required: 'Selecciona una categoria' })}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  {categorias?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
                {errors.categoriaId && <p className="text-sm text-red-500 mt-1">{errors.categoriaId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select
                  {...register('marcaId')}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">Sin marca</option>
                  {marcas?.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  {...register('sku')}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  placeholder="Auto-generado si vacio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo de Barras</label>
                <input
                  type="text"
                  {...register('codigoBarras')}
                  className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                  placeholder="Escanear o escribir"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  {...register('descripcionCorta')}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors resize-none text-sm"
                  placeholder="Breve descripcion del producto"
                />
              </div>
            </div>
          </motion.div>

          {/* Attribute selector (variable only) */}
          <AnimatePresence>
            {isVariable && categoriaId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    Selecciona atributos
                  </h2>

                  {loadingAtributos ? (
                    <div className="flex items-center gap-2 py-4 text-gray-500 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
                      Cargando atributos...
                    </div>
                  ) : !categoriaAtributos || categoriaAtributos.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                      <p className="font-medium">Esta categoria no tiene atributos</p>
                      <p className="mt-1">Vincula atributos (talla, color, etc.) desde Catalogos &gt; Categorias.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categoriaAtributos.map((catAtributo) => {
                        const atributo = catAtributo.atributo as any;
                        const valores = atributo.valores || [];
                        const seleccionado = selectedAtributos.find(s => s.atributoId === atributo.id);

                        return (
                          <div key={atributo.id}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-700">{atributo.nombre}</span>
                              {seleccionado && seleccionado.valoresIds.length > 0 && (
                                <span className="text-xs text-purple-600 font-medium">
                                  ({seleccionado.valoresIds.length})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {valores.map((valor: any) => {
                                const isSelected = seleccionado?.valoresIds.includes(valor.id);
                                const isColor = atributo.tipoVisual === 'color' && valor.codigoColor;
                                return (
                                  <button
                                    key={valor.id}
                                    type="button"
                                    onClick={() => toggleValorAtributo(atributo.id, atributo.nombre, valor.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                                      isSelected
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isColor && (
                                      <span
                                        className={`w-3.5 h-3.5 rounded-full border ${isSelected ? 'border-white/50' : 'border-gray-300'}`}
                                        style={{ backgroundColor: valor.codigoColor }}
                                      />
                                    )}
                                    {valor.valor}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- RIGHT SIDEBAR (1/3) ---- */}
        <div className="space-y-6">

          {/* Precios - only for simple products */}
          {!isVariable && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Precios
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio de Venta *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('precioVenta', {
                        required: 'Requerido',
                        valueAsNumber: true,
                        min: { value: 0.01, message: 'Mayor a 0' }
                      })}
                      className="w-full h-12 pl-9 pr-4 text-xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.precioVenta && <p className="text-xs text-red-500 mt-1">{errors.precioVenta.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio de Compra</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('precioCompra', { valueAsNumber: true })}
                      className="w-full h-10 pl-9 pr-4 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio Mayorista</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('precioMayorista', { valueAsNumber: true })}
                      className="w-full h-10 pl-9 pr-4 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stock - only for simple products */}
          {!isVariable && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Box className="h-4 w-4 text-purple-600" />
                Stock
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    {...register('stock', { valueAsNumber: true })}
                    className="w-full h-12 px-4 text-xl font-bold border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Bell className="h-3 w-3" /> Alerta stock bajo
                  </label>
                  <input
                    type="number"
                    {...register('stockMinimo', { valueAsNumber: true })}
                    className="w-full h-10 px-4 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-400 mt-1">Notifica cuando el stock llegue a este numero</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Opciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Eye className="h-4 w-4 text-indigo-600" />
              Opciones
            </h3>

            <div className="space-y-0.5">
              {[
                { name: 'activo' as const, label: 'Activo' },
                { name: 'aplicaImpuesto' as const, label: 'Aplica IGV' },
                { name: 'manejaStock' as const, label: 'Maneja stock' },
                { name: 'visiblePos' as const, label: 'Visible en POS' },
                { name: 'visibleWeb' as const, label: 'Visible en Web' },
                { name: 'destacado' as const, label: 'Destacado' },
              ].map((opt) => (
                <label key={opt.name} className="flex items-center justify-between py-2.5 cursor-pointer border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{opt.label}</span>
                  <input
                    type="checkbox"
                    {...register(opt.name)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============ VARIANTS TABLE (full width, below the grid) ============ */}
      <AnimatePresence>
        {isVariable && generatedVariantes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border-2 border-purple-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-purple-100 bg-purple-50/50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-purple-600" />
                Variantes ({generatedVariantes.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block">Alerta stock bajo:</span>
                <input
                  type="number"
                  {...register('stockMinimo', { valueAsNumber: true })}
                  className="w-16 h-7 px-2 text-xs border border-purple-200 rounded focus:border-purple-500 focus:outline-none text-center"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Variante</th>
                    <th className="text-left px-3 py-3 font-medium w-28">SKU</th>
                    <th className="text-left px-3 py-3 font-medium w-32">Cod. Barras</th>
                    <th className="text-right px-3 py-3 font-medium w-28">P. Venta</th>
                    <th className="text-right px-3 py-3 font-medium w-28">P. Compra</th>
                    <th className="text-right px-3 py-3 font-medium w-28">P. Mayorista</th>
                    <th className="text-right px-3 py-3 font-medium w-20">Stock</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {generatedVariantes.map((variante, index) => (
                    <motion.tr
                      key={variante.valoresAtributoIds.join('-')}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-t border-gray-100 hover:bg-gray-50/50"
                    >
                      {/* Variante name */}
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {variante.valoresTexto.map((val, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {val}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={variante.sku}
                          onChange={(e) => updateVarianteField(index, 'sku', e.target.value)}
                          className="w-full h-8 px-2 text-xs font-mono border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                        />
                      </td>

                      {/* Codigo Barras */}
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          value={variante.codigoBarras}
                          onChange={(e) => updateVarianteField(index, 'codigoBarras', e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                          placeholder="Escanear"
                        />
                      </td>

                      {/* Precio Venta */}
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={variante.precioVenta || ''}
                            onChange={(e) => updateVarianteField(index, 'precioVenta', parseFloat(e.target.value) || 0)}
                            className="w-full h-8 pl-6 pr-1 text-xs text-right border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                          />
                        </div>
                      </td>

                      {/* Precio Compra */}
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={variante.precioCompra || ''}
                            onChange={(e) => updateVarianteField(index, 'precioCompra', parseFloat(e.target.value) || 0)}
                            className="w-full h-8 pl-6 pr-1 text-xs text-right border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                          />
                        </div>
                      </td>

                      {/* Precio Mayorista */}
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">S/</span>
                          <input
                            type="number"
                            step="0.01"
                            value={variante.precioMayorista || ''}
                            onChange={(e) => updateVarianteField(index, 'precioMayorista', parseFloat(e.target.value) || 0)}
                            className="w-full h-8 pl-6 pr-1 text-xs text-right border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                          />
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={variante.stock || ''}
                          onChange={(e) => updateVarianteField(index, 'stock', parseInt(e.target.value) || 0)}
                          className="w-full h-8 px-2 text-xs text-center border border-gray-200 rounded focus:border-purple-500 focus:outline-none bg-transparent"
                          placeholder="0"
                        />
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeVariante(index)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* For variable products without variants yet - show hint */}
      <AnimatePresence>
        {isVariable && generatedVariantes.length === 0 && categoriaId && !loadingAtributos && categoriaAtributos && categoriaAtributos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 text-gray-400 text-sm"
          >
            Selecciona valores de atributos arriba para generar las variantes
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3 justify-end pt-2"
      >
        <Link
          href="/productos"
          className="px-5 h-10 flex items-center justify-center border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 h-10 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
        >
          {createMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Crear Producto
            </>
          )}
        </button>
      </motion.div>
    </form>
  );
}
