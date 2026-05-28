'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from '@/shared/motion';
import { ArrowLeft, Package, Camera, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { ImageUpload } from '@/presentation/components/features/productos/image-upload';
import { BarcodeScanner } from '@/presentation/components/features/pos/barcode-scanner';
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
  const [showScanner, setShowScanner] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    control,
  } = useForm<UpdateProductoDto>();

  useEffect(() => {
    if (producto && categorias) {
      reset({
        nombre: producto.nombre,
        categoriaId: producto.categoriaId || producto.categoria?.id,
        marcaId: producto.marcaId || producto.marca?.id || undefined,
        codigoBarras: producto.codigoBarras || '',
        precioCompra: Number(producto.precioCompra) || undefined,
        precioVenta: Number(producto.precioVenta) || 0,
        precioMayorista: producto.precioMayorista ? Number(producto.precioMayorista) : undefined,
        stockMinimo: producto.stockMinimo,
        manejaStock: producto.manejaStock,
        aplicaImpuesto: producto.aplicaImpuesto,
        activo: producto.activo,
        visiblePos: producto.visiblePos,
        imagenPrincipal: producto.imagenPrincipal || '',
      });
    }
  }, [producto, categorias, marcas, reset]);

  const onSubmit = async (data: UpdateProductoDto) => {
    try {
      if (!data.marcaId) delete (data as any).marcaId;
      if (!data.codigoBarras) delete (data as any).codigoBarras;
      if (!data.precioCompra) delete (data as any).precioCompra;
      if (!data.precioMayorista) delete (data as any).precioMayorista;
      if (!data.imagenPrincipal) delete (data as any).imagenPrincipal;
      await updateMutation.mutateAsync({ id, dto: data });
      router.push(`/productos/${id}`);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Producto no encontrado</p>
        <Link href="/productos" className="text-blue-500 text-sm mt-2 inline-block">Volver a productos</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <Link href={`/productos/${id}`} className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Editar Producto</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-5">
        {/* 1. NOMBRE */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Nombre del producto</label>
          <input
            type="text"
            {...register('nombre', { required: 'Escribe el nombre' })}
            className={`w-full h-14 px-4 text-base border-2 rounded-2xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder-gray-300 ${errors.nombre ? 'border-red-400' : 'border-gray-200'}`}
            placeholder="Ej: Nike Air Max 90 Negro"
          />
          {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>}
        </div>

        {/* 2. IMAGEN + MARCA + CATEGORÍA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-52 shrink-0 rounded-xl" style={{ height: '224px' }}>
            <Controller
              name="imagenPrincipal"
              control={control}
              render={({ field }) => (
                <ImageUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Categoria</label>
              <select
                {...register('categoriaId')}
                className="w-full h-12 px-3 text-sm border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none transition-all"
              >
                <option value="">Elegir...</option>
                {categorias?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Marca</label>
              <select {...register('marcaId')} className="w-full h-12 px-3 text-sm border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none transition-all">
                <option value="">Sin marca</option>
                {marcas?.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. PRECIOS */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">P. de Compra</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">S/</span>
                <input type="number" step="0.01" {...register('precioCompra', { valueAsNumber: true })}
                  className="w-full h-12 pl-9 pr-2 text-base border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:outline-none transition-all" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-green-600 font-bold mb-1">P. de Venta *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm font-bold">S/</span>
                <input type="number" step="0.01"
                  {...register('precioVenta', { required: 'Requerido', valueAsNumber: true, min: { value: 0.01, message: '> 0' } })}
                  className="w-full h-12 pl-9 pr-2 text-lg font-bold border-2 border-green-300 rounded-xl bg-green-50 focus:border-green-500 focus:outline-none transition-all" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-orange-500 mb-1">P. Mayorista</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300 text-sm">S/</span>
                <input type="number" step="0.01" {...register('precioMayorista', { valueAsNumber: true })}
                  className="w-full h-12 pl-9 pr-2 text-base border-2 border-orange-200 rounded-xl bg-orange-50/50 focus:border-orange-500 focus:outline-none transition-all" placeholder="0" />
              </div>
            </div>
          </div>
          <MargenGanancia control={control} />
        </div>

        {/* 4. CÓDIGO DE BARRAS + ESCÁNER */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Codigo de barras</label>
          <div className="flex gap-2">
            <input type="text" {...register('codigoBarras')}
              className="flex-1 h-14 px-4 font-mono text-base border-2 border-gray-200 rounded-2xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all placeholder-gray-300"
              placeholder="Escanear o escribir..." />
            <button type="button" onClick={() => setShowScanner(true)}
              className="h-14 w-14 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/25">
              <Camera className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* GUARDAR */}
        <button type="submit" disabled={updateMutation.isPending}
          className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25 disabled:opacity-50">
          {updateMutation.isPending ? (
            <div className="w-6 h-6 border-3 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <><Package className="h-5 w-5" /> Guardar Cambios</>
          )}
        </button>

        <Link href={`/productos/${id}`} className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2">
          Cancelar
        </Link>
      </motion.div>

      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)}
        onScan={(code) => { setValue('codigoBarras', code); setShowScanner(false); }} />
    </form>
  );
}

function MargenGanancia({ control }: { control: any }) {
  const precioCompra = useWatch({ control, name: 'precioCompra' }) || 0;
  const precioVenta = useWatch({ control, name: 'precioVenta' }) || 0;

  if (!precioCompra || !precioVenta || precioVenta <= 0) return null;

  const ganancia = precioVenta - precioCompra;
  const margen = precioCompra > 0 ? ((ganancia / precioCompra) * 100) : 0;
  const igv = precioVenta / 1.18 * 0.18;
  const baseGravable = precioVenta / 1.18;
  const gananciaNeta = baseGravable - precioCompra;
  const margenNeto = precioCompra > 0 ? ((gananciaNeta / precioCompra) * 100) : 0;

  return (
    <div className="mt-3 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-800/30">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Margen de ganancia</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500 dark:text-zinc-400">Ganancia:</span>
          <span className={`ml-1 font-bold ${ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            S/ {ganancia.toFixed(2)} ({margen.toFixed(1)}%)
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-zinc-400">Si emites boleta:</span>
          <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
            S/ {gananciaNeta.toFixed(2)} ({margenNeto.toFixed(1)}%)
          </span>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
        IGV incluido: S/ {igv.toFixed(2)} | Base: S/ {baseGravable.toFixed(2)}
      </p>
    </div>
  );
}
