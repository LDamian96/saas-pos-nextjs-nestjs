'use client';

/**
 * @file producto-form.tsx
 * @description Formulario de crear/editar producto
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos)
 * - Backend DTO: ver backend/src/core/application/dto/producto/create-producto.dto.ts
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronDown,
  Info,
  Save,
  ArrowLeft,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { useCategorias } from '@/application/hooks/queries/use-categorias';
import { useMarcas } from '@/application/hooks/queries/use-marcas';
import {
  useCreateProducto,
  useUpdateProducto,
} from '@/application/hooks/mutations/use-productos-mutations';
import {
  createProductoSchema,
  CreateProductoFormData,
} from '@/application/validators/producto.validator';
import { Producto } from '@/application/services/productos.service';

interface ProductoFormProps {
  producto?: Producto | null;
  onSuccess?: () => void;
}

export function ProductoForm({ producto, onSuccess }: ProductoFormProps) {
  const router = useRouter();
  const isEditing = !!producto;

  // Queries para selectores
  const { data: categorias } = useCategorias();
  const { data: marcas } = useMarcas();

  // Mutations
  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Active tab state
  const [activeTab, setActiveTab] = useState<'basico' | 'precios' | 'stock' | 'avanzado'>('basico');

  const form = useForm<CreateProductoFormData>({
    resolver: zodResolver(createProductoSchema),
    defaultValues: {
      // Relaciones
      categoriaId: '',
      marcaId: '',
      unidadMedidaId: '',
      // Identificación
      nombre: '',
      sku: '',
      codigoBarras: '',
      // Descripción
      descripcionCorta: '',
      descripcionLarga: '',
      // Tipo
      tipo: 'simple',
      // Precios
      precioCompra: 0,
      precioVenta: 0,
      precioMayorista: undefined,
      cantidadMinimaMayorista: undefined,
      precioOferta: undefined,
      descuentoPorcentaje: undefined,
      // Impuestos y stock
      aplicaImpuesto: true,
      manejaStock: true,
      stock: 0,
      stockMinimo: 0,
      stockMaximo: undefined,
      // Imagen
      imagenPrincipal: '',
      // Estados
      activo: true,
      visiblePos: true,
      visibleWeb: true,
      destacado: false,
      nuevo: false,
      // SEO
      metaTitulo: '',
      metaDescripcion: '',
      // Dimensiones
      peso: undefined,
      largo: undefined,
      ancho: undefined,
      alto: undefined,
    },
  });

  // Helper para convertir precio string/number a number
  const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
  };

  // Reset form cuando cambia el producto (edición)
  useEffect(() => {
    if (producto) {
      form.reset({
        categoriaId: producto.categoriaId || '',
        marcaId: producto.marcaId || '',
        unidadMedidaId: producto.unidadMedidaId || '',
        nombre: producto.nombre || '',
        sku: producto.sku || '',
        codigoBarras: producto.codigoBarras || '',
        descripcionCorta: producto.descripcionCorta || '',
        descripcionLarga: producto.descripcionLarga || '',
        tipo: producto.tipo || 'simple',
        precioCompra: toNumber(producto.precioCompra),
        precioVenta: toNumber(producto.precioVenta),
        precioMayorista: producto.precioMayorista ? toNumber(producto.precioMayorista) : undefined,
        cantidadMinimaMayorista: producto.cantidadMinimaMayorista || undefined,
        precioOferta: producto.precioOferta ? toNumber(producto.precioOferta) : undefined,
        descuentoPorcentaje: producto.descuentoPorcentaje || undefined,
        aplicaImpuesto: producto.aplicaImpuesto ?? true,
        manejaStock: producto.manejaStock ?? true,
        stock: producto.stock || 0,
        stockMinimo: producto.stockMinimo || 0,
        stockMaximo: producto.stockMaximo || undefined,
        imagenPrincipal: producto.imagenPrincipal || '',
        activo: producto.activo ?? true,
        visiblePos: producto.visiblePos ?? true,
        visibleWeb: producto.visibleWeb ?? true,
        destacado: producto.destacado ?? false,
        nuevo: producto.nuevo ?? false,
        metaTitulo: producto.metaTitulo || '',
        metaDescripcion: producto.metaDescripcion || '',
        peso: producto.peso || undefined,
        largo: producto.largo || undefined,
        ancho: producto.ancho || undefined,
        alto: producto.alto || undefined,
      });
    }
  }, [producto, form]);

  const onSubmit = async (data: CreateProductoFormData) => {
    try {
      // Limpiar campos vacíos
      const cleanData = {
        ...data,
        marcaId: data.marcaId || undefined,
        unidadMedidaId: data.unidadMedidaId || undefined,
        sku: data.sku || undefined,
        codigoBarras: data.codigoBarras || undefined,
        descripcionCorta: data.descripcionCorta || undefined,
        descripcionLarga: data.descripcionLarga || undefined,
        imagenPrincipal: data.imagenPrincipal || undefined,
        metaTitulo: data.metaTitulo || undefined,
        metaDescripcion: data.metaDescripcion || undefined,
      };

      if (isEditing && producto) {
        await updateMutation.mutateAsync({ id: producto.id, dto: cleanData });
      } else {
        await createMutation.mutateAsync(cleanData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/catalogos/productos');
      }
    } catch {
      // Error handled by mutation
    }
  };

  const tabs = [
    { id: 'basico', label: 'Información Básica' },
    { id: 'precios', label: 'Precios' },
    { id: 'stock', label: 'Inventario' },
    { id: 'avanzado', label: 'Avanzado' },
  ] as const;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/catalogos/productos')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? 'Actualiza los datos del producto' : 'Completa la información del producto'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border p-6">
        {/* Tab: Información Básica */}
        {activeTab === 'basico' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del producto *
              </label>
              <input
                type="text"
                {...form.register('nombre')}
                placeholder="Ej: Camiseta Polo Azul"
                className={`w-full h-12 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                  form.formState.errors.nombre
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:border-blue-500'
                }`}
              />
              {form.formState.errors.nombre && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.nombre.message}</p>
              )}
            </div>

            {/* SKU y Código de Barras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Código interno)
                </label>
                <input
                  type="text"
                  {...form.register('sku')}
                  placeholder="PROD-001"
                  className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  {...form.register('codigoBarras')}
                  placeholder="7501234567890"
                  className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Categoría y Marca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div className="relative">
                  <select
                    {...form.register('categoriaId')}
                    className={`w-full h-12 px-4 pr-10 text-base border-2 rounded-xl focus:outline-none transition-colors appearance-none bg-white ${
                      form.formState.errors.categoriaId
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.categoriaPadreId ? '  └ ' : ''}{cat.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                {form.formState.errors.categoriaId && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.categoriaId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <div className="relative">
                  <select
                    {...form.register('marcaId')}
                    className="w-full h-12 px-4 pr-10 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors appearance-none bg-white"
                  >
                    <option value="">Sin marca</option>
                    {marcas?.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Tipo de producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de producto
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    form.watch('tipo') === 'simple'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...form.register('tipo')}
                    value="simple"
                    className="sr-only"
                  />
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-current">
                    {form.watch('tipo') === 'simple' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Simple</p>
                    <p className="text-sm text-gray-500">Producto sin variantes</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    form.watch('tipo') === 'variable'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...form.register('tipo')}
                    value="variable"
                    className="sr-only"
                  />
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-current">
                    {form.watch('tipo') === 'variable' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Con variantes</p>
                    <p className="text-sm text-gray-500">Tallas, colores, etc.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Descripciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción corta
              </label>
              <textarea
                {...form.register('descripcionCorta')}
                placeholder="Descripción breve del producto (se muestra en el listado)"
                rows={2}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción completa
              </label>
              <textarea
                {...form.register('descripcionLarga')}
                placeholder="Descripción detallada del producto (características, materiales, etc.)"
                rows={4}
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen principal (URL)
              </label>
              <div className="flex gap-4">
                <input
                  type="url"
                  {...form.register('imagenPrincipal')}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                {form.watch('imagenPrincipal') && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border">
                    <img
                      src={form.watch('imagenPrincipal')}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab: Precios */}
        {activeTab === 'precios' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Precios principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de compra (costo)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('precioCompra')}
                    placeholder="0.00"
                    className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de venta *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    {...form.register('precioVenta')}
                    placeholder="0.00"
                    className={`w-full h-12 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      form.formState.errors.precioVenta
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {form.formState.errors.precioVenta && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.precioVenta.message}</p>
                )}
              </div>
            </div>

            {/* Info de margen */}
            {form.watch('precioCompra') > 0 && form.watch('precioVenta') > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Margen de ganancia:{' '}
                  <strong>
                    {(
                      ((form.watch('precioVenta') - form.watch('precioCompra')) /
                        form.watch('precioCompra')) *
                      100
                    ).toFixed(1)}
                    %
                  </strong>{' '}
                  (S/{' '}
                  {(form.watch('precioVenta') - form.watch('precioCompra')).toFixed(2)}{' '}
                  por unidad)
                </span>
              </div>
            )}

            {/* Precio mayorista */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-medium text-gray-900">Precio Mayorista</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio mayorista
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      {...form.register('precioMayorista')}
                      placeholder="0.00"
                      className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad mínima
                  </label>
                  <input
                    type="number"
                    {...form.register('cantidadMinimaMayorista')}
                    placeholder="10"
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Precio oferta */}
            <div className="p-4 bg-green-50 rounded-xl space-y-4">
              <h3 className="font-medium text-gray-900">Precio en Oferta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio oferta
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      {...form.register('precioOferta')}
                      placeholder="0.00"
                      className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    {...form.register('descuentoPorcentaje')}
                    placeholder="10"
                    min="0"
                    max="100"
                    className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Impuestos */}
            <div className="flex items-center gap-3">
              <Controller
                name="aplicaImpuesto"
                control={form.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="aplicaImpuesto"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              />
              <label htmlFor="aplicaImpuesto" className="text-sm font-medium text-gray-700">
                Este producto aplica impuesto (IGV)
              </label>
            </div>
          </motion.div>
        )}

        {/* Tab: Inventario */}
        {activeTab === 'stock' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Maneja stock */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Controller
                name="manejaStock"
                control={form.control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="manejaStock"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              />
              <div>
                <label htmlFor="manejaStock" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Controlar inventario
                </label>
                <p className="text-xs text-gray-500">
                  Llevar registro de las unidades disponibles
                </p>
              </div>
            </div>

            {form.watch('manejaStock') && (
              <>
                {/* Stock actual */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock actual
                    </label>
                    <input
                      type="number"
                      {...form.register('stock')}
                      placeholder="0"
                      min="0"
                      className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock mínimo
                    </label>
                    <input
                      type="number"
                      {...form.register('stockMinimo')}
                      placeholder="5"
                      min="0"
                      className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">Alerta de stock bajo</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock máximo
                    </label>
                    <input
                      type="number"
                      {...form.register('stockMaximo')}
                      placeholder="100"
                      min="0"
                      className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">Capacidad máxima</p>
                  </div>
                </div>

                {/* Dimensiones para envío */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                  <h3 className="font-medium text-gray-900">Dimensiones (para envío)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...form.register('peso')}
                        placeholder="0.5"
                        className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Largo (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...form.register('largo')}
                        placeholder="20"
                        className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ancho (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...form.register('ancho')}
                        placeholder="15"
                        className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alto (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...form.register('alto')}
                        placeholder="5"
                        className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Tab: Avanzado */}
        {activeTab === 'avanzado' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Visibilidad */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Visibilidad</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-xl">
                  <Controller
                    name="visiblePos"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="visiblePos"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  />
                  <div>
                    <label htmlFor="visiblePos" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Visible en POS
                    </label>
                    <p className="text-xs text-gray-500">Se puede vender desde el punto de venta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-xl">
                  <Controller
                    name="visibleWeb"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="visibleWeb"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  />
                  <div>
                    <label htmlFor="visibleWeb" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Visible en Tienda Online
                    </label>
                    <p className="text-xs text-gray-500">Se muestra en la tienda web</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Etiquetas */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Etiquetas</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Controller
                    name="destacado"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="destacado"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    )}
                  />
                  <label htmlFor="destacado" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Producto destacado
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Controller
                    name="nuevo"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="nuevo"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    )}
                  />
                  <label htmlFor="nuevo" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Producto nuevo
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Controller
                    name="activo"
                    control={form.control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="activo"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Activo
                  </label>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-4">
              <h3 className="font-medium text-gray-900">SEO (Tienda Online)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta título
                </label>
                <input
                  type="text"
                  {...form.register('metaTitulo')}
                  placeholder="Título para buscadores (máx. 70 caracteres)"
                  maxLength={70}
                  className="w-full h-12 px-4 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {form.watch('metaTitulo')?.length || 0}/70 caracteres
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta descripción
                </label>
                <textarea
                  {...form.register('metaDescripcion')}
                  placeholder="Descripción para buscadores (máx. 160 caracteres)"
                  maxLength={160}
                  rows={2}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {form.watch('metaDescripcion')?.length || 0}/160 caracteres
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.push('/catalogos/productos')}
          className="h-12 px-6 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {isEditing ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
