'use client';

/**
 * @file page.tsx
 * @description Pagina para editar producto existente - Layout tipo detalle con campos editables
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Save, Box, BarChart3, AlertTriangle, Eye, Ruler } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import { useProducto } from '@/application/hooks/queries/use-productos';
import { useUpdateProducto } from '@/application/hooks/mutations/use-productos-mutations';
import { UpdateProductoDto } from '@/application/services/productos.service';

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: producto, isLoading, error } = useProducto(id);
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();
  const updateMutation = useUpdateProducto();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateProductoDto>();

  const manejaStockValue = watch('manejaStock');

  // Wait for producto AND dropdown options before reset to avoid select mismatch
  useEffect(() => {
    if (producto && categorias) {
      reset({
        nombre: producto.nombre,
        categoriaId: producto.categoriaId || producto.categoria?.id,
        marcaId: producto.marcaId || producto.marca?.id || undefined,
        sku: producto.sku || '',
        codigoBarras: producto.codigoBarras || '',
        descripcionCorta: producto.descripcionCorta || '',
        descripcionLarga: producto.descripcionLarga || '',
        precioCompra: Number(producto.precioCompra) || undefined,
        precioVenta: Number(producto.precioVenta) || 0,
        precioMayorista: producto.precioMayorista ? Number(producto.precioMayorista) : undefined,
        precioOferta: producto.precioOferta ? Number(producto.precioOferta) : undefined,
        descuentoPorcentaje: producto.descuentoPorcentaje || undefined,
        stockMinimo: producto.stockMinimo,
        manejaStock: producto.manejaStock,
        aplicaImpuesto: producto.aplicaImpuesto,
        activo: producto.activo,
        visiblePos: producto.visiblePos,
        visibleWeb: producto.visibleWeb,
        destacado: producto.destacado,
        peso: producto.peso || undefined,
        largo: producto.largo || undefined,
        ancho: producto.ancho || undefined,
        alto: producto.alto || undefined,
      });
    }
  }, [producto, categorias, marcas, reset]);

  const onSubmit = async (data: UpdateProductoDto) => {
    try {
      await updateMutation.mutateAsync({ id, dto: data });
      router.push(`/productos/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return 'S/ 0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return `S/ ${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="h-48 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-16 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-16 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-500">No se pudo cargar el producto</p>
        <Link href="/productos" className="mt-4 text-blue-600 hover:underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            href={`/productos/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              {...register('nombre', { required: 'El nombre es requerido' })}
              className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full transition-colors pb-1"
              placeholder="Nombre del producto"
            />
            {errors.nombre && (
              <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
            )}
            <p className="text-gray-500 mt-1">SKU: {producto.sku}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 shrink-0 ml-4"
        >
          {updateMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Guardar Cambios
            </>
          )}
        </button>
      </motion.div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 - Image + Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          {/* Image placeholder */}
          <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {producto.imagenPrincipal ? (
              <img
                src={producto.imagenPrincipal}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-16 w-16 text-gray-400" />
            )}
          </div>

          {/* Editable fields styled as key-value rows */}
          <div className="space-y-3">
            {/* Categoria - dropdown */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm shrink-0">Categoria</span>
              <select
                {...register('categoriaId', { required: 'Selecciona una categoria' })}
                className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none cursor-pointer py-0.5 min-w-0"
              >
                <option value="">Seleccionar...</option>
                {categorias?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            {errors.categoriaId && (
              <p className="text-xs text-red-500 text-right">{errors.categoriaId.message}</p>
            )}

            {/* Marca - dropdown */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm shrink-0">Marca</span>
              <select
                {...register('marcaId')}
                className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none cursor-pointer py-0.5 min-w-0"
              >
                <option value="">Sin marca</option>
                {marcas?.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo - read-only */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Tipo</span>
              <span className="font-medium text-sm capitalize">{producto.tipo}</span>
            </div>

            {/* Estado - checkbox */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Estado</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('activo')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Activo</span>
              </label>
            </div>

            {/* SKU - editable */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm shrink-0">SKU</span>
              <input
                type="text"
                {...register('sku')}
                className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full py-0.5"
                placeholder="Codigo SKU"
              />
            </div>

            {/* Codigo Barras - editable */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-sm shrink-0">Cod. Barras</span>
              <input
                type="text"
                {...register('codigoBarras')}
                className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full py-0.5"
                placeholder="Escanear o escribir"
              />
            </div>
          </div>
        </motion.div>

        {/* Column 2 - Precios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Precios
          </h3>

          <div className="space-y-4">
            {/* Precio de Venta - big input */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm text-gray-500 block mb-1">Precio de Venta *</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-bold">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioVenta', {
                    required: 'El precio es requerido',
                    valueAsNumber: true,
                    min: { value: 0.01, message: 'El precio debe ser mayor a 0' }
                  })}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full pl-10 py-1 transition-colors"
                  placeholder="0.00"
                />
              </div>
              {errors.precioVenta && (
                <p className="text-xs text-red-500 mt-1">{errors.precioVenta.message}</p>
              )}
            </div>

            {/* Precio Oferta */}
            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-sm text-green-600 block mb-1">Precio Oferta</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-green-400 text-lg font-bold">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioOferta', { valueAsNumber: true })}
                  className="text-lg font-bold text-green-700 bg-transparent border-b border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none w-full pl-8 py-0.5 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-green-600">Descuento:</span>
                <input
                  type="number"
                  step="0.1"
                  {...register('descuentoPorcentaje', { valueAsNumber: true })}
                  className="text-sm font-medium text-green-700 bg-transparent border-b border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none w-16 text-center transition-colors"
                  placeholder="0"
                />
                <span className="text-xs text-green-600">%</span>
              </div>
            </div>

            {/* Precio Compra */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500 text-sm">Precio Compra</span>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioCompra', { valueAsNumber: true })}
                  className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-28 pl-6 py-0.5 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Precio Mayorista */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500 text-sm">Precio Mayorista</span>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('precioMayorista', { valueAsNumber: true })}
                  className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-28 pl-6 py-0.5 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Aplica Impuesto */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500 text-sm">Aplica Impuesto (IGV)</span>
              <input
                type="checkbox"
                {...register('aplicaImpuesto')}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Column 3 - Inventario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Box className="h-5 w-5 text-purple-600" />
            Inventario
          </h3>

          <div className="space-y-4">
            {/* Stock Actual - read-only */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Stock Actual</p>
              <p className={`text-2xl font-bold ${
                producto.stock <= producto.stockMinimo ? 'text-red-600' : 'text-gray-900'
              }`}>
                {producto.stock} unidades
              </p>
              <p className="text-xs text-gray-400 mt-1">Gestionado via movimientos de inventario</p>
            </div>

            {/* Alerta stock bajo */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500 text-sm">Alerta stock bajo</span>
              <input
                type="number"
                {...register('stockMinimo', { valueAsNumber: true })}
                className="text-right font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-24 py-0.5 transition-colors"
                placeholder="5"
              />
            </div>

            {/* Maneja Stock - checkbox */}
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-gray-500 text-sm">Maneja Stock</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('manejaStock')}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  manejaStockValue ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {manejaStockValue ? 'Si' : 'No'}
                </span>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Variantes (read-only, if variable product) */}
      {producto.tipo === 'variable' && producto.variantes && producto.variantes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Variantes ({producto.variantes.length})
            <span className="text-sm font-normal text-gray-400 ml-2">Solo lectura</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Variante</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">SKU</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Precio</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Stock</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {producto.variantes.map((variante) => (
                  <tr key={variante.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {variante.valores?.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                            {v.codigoColor && (
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-1"
                                style={{ backgroundColor: v.codigoColor }}
                              />
                            )}
                            {v.valor}
                          </span>
                        )) || <span className="text-gray-500">{variante.nombre || variante.sku}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{variante.sku}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(variante.precioVenta)}</td>
                    <td className="px-4 py-3 text-right">{variante.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        variante.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {variante.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Descripcion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Descripcion</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Descripcion corta</label>
            <textarea
              {...register('descripcionCorta')}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
              placeholder="Breve descripcion del producto"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Descripcion larga</label>
            <textarea
              {...register('descripcionLarga')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none text-sm"
              placeholder="Descripcion detallada del producto"
            />
          </div>
        </div>
      </motion.div>

      {/* Visibilidad y Opciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-600" />
          Visibilidad y Opciones
        </h3>

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('visiblePos')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Visible en POS</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('visibleWeb')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Visible en Web</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('destacado')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Producto destacado</span>
          </label>
        </div>
      </motion.div>

      {/* Dimensiones y Peso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ruler className="h-5 w-5 text-orange-600" />
          Dimensiones y Peso
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.01"
              {...register('peso', { valueAsNumber: true })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Largo (cm)</label>
            <input
              type="number"
              step="0.1"
              {...register('largo', { valueAsNumber: true })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Ancho (cm)</label>
            <input
              type="number"
              step="0.1"
              {...register('ancho', { valueAsNumber: true })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Alto (cm)</label>
            <input
              type="number"
              step="0.1"
              {...register('alto', { valueAsNumber: true })}
              className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
              placeholder="0.0"
            />
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 justify-end"
      >
        <Link
          href={`/productos/${id}`}
          className="px-6 h-11 flex items-center justify-center border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-6 h-11 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Guardar Cambios
            </>
          )}
        </button>
      </motion.div>
    </form>
  );
}
