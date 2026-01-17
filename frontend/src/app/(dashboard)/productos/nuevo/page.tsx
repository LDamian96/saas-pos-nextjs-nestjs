'use client';

/**
 * @file page.tsx
 * @description Pagina para crear nuevo producto
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tablas: productos, variantes)
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Package, Save, Plus, Trash2, Layers, Box, Palette } from 'lucide-react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { useCategorias, useCategoriaAtributos } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { useCreateProducto } from '@/application/hooks/mutations/use-productos-mutations';
import { CreateProductoDto, CreateVarianteDto } from '@/application/services/productos.service';
import { Badge } from '@/presentation/components/ui/badge';

// Tipo para valores de atributos seleccionados
interface AtributoSeleccion {
  atributoId: string;
  atributoNombre: string;
  valoresIds: string[];
}

// Tipo para variante generada
interface VarianteGenerada {
  nombre: string;
  sku: string;
  valoresAtributoIds: string[];
  valoresTexto: string[];
  precioVenta?: number;
  stock?: number;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const createMutation = useCreateProducto();

  // Estado para atributos y variantes
  const [selectedAtributos, setSelectedAtributos] = useState<AtributoSeleccion[]>([]);
  const [generatedVariantes, setGeneratedVariantes] = useState<VarianteGenerada[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  // Observar cambios en categoría y tipo
  const categoriaId = useWatch({ control, name: 'categoriaId' });
  const tipoProducto = useWatch({ control, name: 'tipo' });
  const precioVentaBase = useWatch({ control, name: 'precioVenta' });
  const nombreProducto = useWatch({ control, name: 'nombre' });

  // Cargar atributos de la categoría seleccionada
  const { data: categoriaAtributos, isLoading: loadingAtributos } = useCategoriaAtributos(categoriaId || '');

  // Resetear atributos cuando cambia la categoría
  useEffect(() => {
    setSelectedAtributos([]);
    setGeneratedVariantes([]);
  }, [categoriaId]);

  // Generar variantes cuando cambian los atributos seleccionados
  useEffect(() => {
    if (tipoProducto !== 'variable' || selectedAtributos.length === 0) {
      setGeneratedVariantes([]);
      return;
    }

    // Solo generar si hay valores seleccionados en todos los atributos
    const atributosConValores = selectedAtributos.filter(a => a.valoresIds.length > 0);
    if (atributosConValores.length === 0) {
      setGeneratedVariantes([]);
      return;
    }

    // Generar combinaciones de valores
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

      // Buscar valores del atributo en categoriaAtributos
      const atributoData = categoriaAtributos?.find(ca => ca.atributo.id === atributo.atributoId);

      for (const valorId of atributo.valoresIds) {
        const valorData = (atributoData?.atributo as any)?.valores?.find((v: any) => v.id === valorId);
        const valorTexto = valorData?.valor || valorId;

        resultados.push(...generarCombinaciones(
          atributos,
          index + 1,
          [...current, { id: valorId, texto: valorTexto }]
        ));
      }

      return resultados;
    };

    const combinaciones = generarCombinaciones(atributosConValores);

    const variantes: VarianteGenerada[] = combinaciones.map((combo, idx) => ({
      nombre: combo.textos.join(' / '),
      sku: `${nombreProducto?.substring(0, 3).toUpperCase() || 'VAR'}-${idx + 1}`.replace(/\s/g, ''),
      valoresAtributoIds: combo.ids,
      valoresTexto: combo.textos,
      precioVenta: precioVentaBase || 0,
      stock: 0,
    }));

    setGeneratedVariantes(variantes);
  }, [selectedAtributos, tipoProducto, categoriaAtributos, nombreProducto, precioVentaBase]);

  // Handler para toggle de valor de atributo
  const toggleValorAtributo = (atributoId: string, atributoNombre: string, valorId: string) => {
    setSelectedAtributos(prev => {
      const existing = prev.find(a => a.atributoId === atributoId);
      if (existing) {
        const hasValor = existing.valoresIds.includes(valorId);
        const newValores = hasValor
          ? existing.valoresIds.filter(v => v !== valorId)
          : [...existing.valoresIds, valorId];

        if (newValores.length === 0) {
          return prev.filter(a => a.atributoId !== atributoId);
        }

        return prev.map(a =>
          a.atributoId === atributoId
            ? { ...a, valoresIds: newValores }
            : a
        );
      } else {
        return [...prev, { atributoId, atributoNombre, valoresIds: [valorId] }];
      }
    });
  };

  // Actualizar precio de variante
  const updateVariantePrecio = (index: number, precio: number) => {
    setGeneratedVariantes(prev =>
      prev.map((v, i) => i === index ? { ...v, precioVenta: precio } : v)
    );
  };

  // Actualizar stock de variante
  const updateVarianteStock = (index: number, stock: number) => {
    setGeneratedVariantes(prev =>
      prev.map((v, i) => i === index ? { ...v, stock } : v)
    );
  };

  // Eliminar variante
  const removeVariante = (index: number) => {
    setGeneratedVariantes(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateProductoDto) => {
    try {
      // Si es variable, agregar variantes al DTO
      if (data.tipo === 'variable' && generatedVariantes.length > 0) {
        data.variantes = generatedVariantes.map(v => ({
          sku: v.sku,
          nombreVariante: v.nombre,
          precioVenta: v.precioVenta,
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
            <Package className="h-8 w-8 text-blue-600" />
            Nuevo Producto
          </h1>
          <p className="text-gray-500 mt-1">Completa los datos del producto</p>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informacion basica */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion Basica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto *
              </label>
              <input
                type="text"
                {...register('nombre', { required: 'El nombre es requerido' })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Ej: Camiseta Azul Nike"
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                {...register('categoriaId', { required: 'Selecciona una categoria' })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Seleccionar categoria</option>
                {categorias?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId && (
                <p className="text-sm text-red-500 mt-1">{errors.categoriaId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                {...register('marcaId')}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              >
                <option value="">Sin marca</option>
                {marcas?.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                {...register('sku')}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Se genera automaticamente si se deja vacio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codigo de Barras
              </label>
              <input
                type="text"
                {...register('codigoBarras')}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Escanear o escribir"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripcion corta
              </label>
              <textarea
                {...register('descripcionCorta')}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                placeholder="Breve descripcion del producto"
              />
            </div>
          </div>
        </motion.div>

        {/* Tipo de Producto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Producto</h2>
          <p className="text-sm text-gray-500 mb-4">
            Selecciona si es un producto simple (sin variaciones) o variable (con tallas, colores, etc.)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                tipoProducto === 'simple'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                value="simple"
                {...register('tipo')}
                className="sr-only"
              />
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                tipoProducto === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Box className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Producto Simple</p>
                <p className="text-sm text-gray-500">Sin variaciones, un solo precio y stock</p>
              </div>
            </label>

            <label
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                tipoProducto === 'variable'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                value="variable"
                {...register('tipo')}
                className="sr-only"
              />
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                tipoProducto === 'variable' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Producto Variable</p>
                <p className="text-sm text-gray-500">Con tallas, colores u otras variaciones</p>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Atributos y Variantes (solo si es variable y hay categoria) */}
        <AnimatePresence>
          {tipoProducto === 'variable' && categoriaId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-600" />
                Atributos y Variantes
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Selecciona los valores de atributos para generar variantes automaticamente
              </p>

              {loadingAtributos ? (
                <div className="text-center py-4 text-gray-500">Cargando atributos...</div>
              ) : !categoriaAtributos || categoriaAtributos.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                  <p className="font-medium">Esta categoria no tiene atributos vinculados</p>
                  <p className="text-sm mt-1">
                    Ve a Catalogos &gt; Categorias y vincula atributos (talla, color, etc.) a esta categoria.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Lista de atributos con sus valores */}
                  {categoriaAtributos.map((catAtributo) => {
                    const atributo = catAtributo.atributo as any;
                    const valores = atributo.valores || [];
                    const seleccionado = selectedAtributos.find(s => s.atributoId === atributo.id);

                    return (
                      <div key={atributo.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium text-gray-900">{atributo.nombre}</span>
                          {catAtributo.obligatorio && (
                            <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                          )}
                          {seleccionado && seleccionado.valoresIds.length > 0 && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              {seleccionado.valoresIds.length} seleccionados
                            </Badge>
                          )}
                        </div>

                        {valores.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            Este atributo no tiene valores definidos
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {valores.map((valor: any) => {
                              const isSelected = seleccionado?.valoresIds.includes(valor.id);
                              const isColor = atributo.tipoVisual === 'color' && valor.codigoColor;

                              return (
                                <button
                                  key={valor.id}
                                  type="button"
                                  onClick={() => toggleValorAtributo(atributo.id, atributo.nombre, valor.id)}
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                    isSelected
                                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                  }`}
                                >
                                  {isColor && (
                                    <span
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: valor.codigoColor }}
                                    />
                                  )}
                                  <span className="text-sm">{valor.valor}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Variantes generadas */}
                  {generatedVariantes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3">
                        Variantes a crear ({generatedVariantes.length})
                      </h3>
                      <div className="space-y-3">
                        {generatedVariantes.map((variante, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{variante.nombre}</p>
                              <p className="text-xs text-gray-500">SKU: {variante.sku}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div>
                                <label className="text-xs text-gray-500">Precio</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variante.precioVenta || ''}
                                    onChange={(e) => updateVariantePrecio(index, parseFloat(e.target.value) || 0)}
                                    className="w-24 h-9 pl-7 pr-2 text-sm border border-gray-200 rounded-md focus:border-purple-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Stock</label>
                                <input
                                  type="number"
                                  value={variante.stock || ''}
                                  onChange={(e) => updateVarianteStock(index, parseInt(e.target.value) || 0)}
                                  className="w-20 h-9 px-2 text-sm border border-gray-200 rounded-md focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariante(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Precios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Compra
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioCompra', { valueAsNumber: true })}
                  className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de Venta *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioVenta', {
                    required: 'El precio es requerido',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
                  })}
                  className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
              {errors.precioVenta && (
                <p className="text-sm text-red-500 mt-1">{errors.precioVenta.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Mayorista
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioMayorista', { valueAsNumber: true })}
                  className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inventario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Minimo
              </label>
              <input
                type="number"
                {...register('stockMinimo', { valueAsNumber: true })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Maximo
              </label>
              <input
                type="number"
                {...register('stockMaximo', { valueAsNumber: true })}
                className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('manejaStock')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Maneja stock</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('aplicaImpuesto')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Aplica impuesto (IGV)</span>
            </label>
          </div>
        </motion.div>

        {/* Visibilidad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibilidad</h2>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('activo')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Producto activo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('visiblePos')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Visible en POS</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('visibleWeb')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Visible en Web</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('destacado')}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Producto destacado</span>
            </label>
          </div>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <Link
            href="/productos"
            className="flex-1 h-12 flex items-center justify-center border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? (
              'Guardando...'
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar Producto
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}
