'use client';

/**
 * @file page.tsx
 * @description Pagina de gestion de promociones - CRUD completo
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Percent,
  Gift,
  DollarSign,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Badge } from '@/presentation/components/ui/badge';
import { Separator } from '@/presentation/components/ui/separator';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Switch } from '@/presentation/components/ui/switch';
import { Textarea } from '@/presentation/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import { usePromociones } from '@/application/hooks/queries/use-promociones';
import {
  useCreatePromocion,
  useUpdatePromocion,
  useDeletePromocion,
} from '@/application/hooks/mutations/use-promociones-mutations';
import { Promocion, CreatePromocionDto, TipoPromocion } from '@/application/services/promocion.service';

const tipoLabels: Record<TipoPromocion, { label: string; icon: any; color: string }> = {
  cantidad_gratis: { label: 'Lleva X Paga Y', icon: Gift, color: 'bg-green-100 text-green-700' },
  cantidad_descuento: { label: 'Descuento por cantidad', icon: Percent, color: 'bg-blue-100 text-blue-700' },
  precio_fijo: { label: 'Precio fijo', icon: DollarSign, color: 'bg-purple-100 text-purple-700' },
  monto_minimo: { label: 'Monto minimo', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700' },
  combo: { label: 'Combo', icon: Zap, color: 'bg-cyan-100 text-cyan-700' },
  descuento_porcentaje: { label: 'Descuento %', icon: Percent, color: 'bg-indigo-100 text-indigo-700' },
  nth_precio: { label: 'Nth precio especial', icon: Tag, color: 'bg-pink-100 text-pink-700' },
  nth_gratis: { label: 'Nth gratis', icon: Gift, color: 'bg-emerald-100 text-emerald-700' },
  nxm: { label: 'NxM (Lleva N paga M)', icon: ShoppingBag, color: 'bg-amber-100 text-amber-700' },
};

const getPromoStatus = (promo: Promocion) => {
  if (!promo.activo) return { label: 'Inactiva', variant: 'secondary' as const };
  const now = new Date();
  const inicio = new Date(promo.fechaInicio);
  if (inicio > now) return { label: 'Programada', variant: 'outline' as const };
  if (promo.fechaFin) {
    const fin = new Date(promo.fechaFin);
    if (fin < now) return { label: 'Expirada', variant: 'secondary' as const };
  }
  return { label: 'Activa', variant: 'default' as const };
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getPromoDescription = (promo: Promocion) => {
  switch (promo.tipo) {
    case 'cantidad_gratis':
      return `Lleva ${promo.cantidadComprar}, paga ${(promo.cantidadComprar || 0) - (promo.cantidadBeneficio || 0)}`;
    case 'cantidad_descuento':
      return `${promo.descuentoPorcentaje}% dcto comprando ${promo.cantidadComprar}+`;
    case 'descuento_porcentaje':
      return `${promo.descuentoPorcentaje}% de descuento`;
    case 'nth_precio':
      return `Compra ${promo.cantidadComprar}, la ${(promo.cantidadComprar || 0) + 1}ra a S/ ${promo.precioFijo?.toFixed(2)}`;
    case 'nth_gratis':
      return `Compra ${promo.cantidadComprar}, la ${(promo.cantidadComprar || 0) + 1}ra gratis`;
    case 'nxm':
      return `Lleva ${promo.cantidadComprar} paga ${promo.cantidadBeneficio}`;
    case 'precio_fijo':
      return `Precio especial: S/ ${promo.precioFijo?.toFixed(2)}`;
    case 'monto_minimo':
      return `${promo.descuentoPorcentaje}% dcto en compras +S/ ${promo.montoMinimoCompra}`;
    case 'combo':
      return `Combo especial`;
    default:
      return promo.descripcion || '';
  }
};

export default function PromocionesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promocion | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promocion | null>(null);
  const [form, setForm] = useState<CreatePromocionDto>({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'cantidad_gratis',
    cantidadComprar: 3,
    cantidadBeneficio: 1,
    aplicaA: 'todos',
    fechaInicio: new Date().toISOString().split('T')[0],
    activo: true,
    visiblePos: true,
    visibleWeb: true,
  });

  const { data: promociones, isLoading } = usePromociones();
  const createMutation = useCreatePromocion();
  const updateMutation = useUpdatePromocion();
  const deleteMutation = useDeletePromocion();

  const stats = useMemo(() => {
    if (!promociones) return { total: 0, activas: 0, programadas: 0 };
    const now = new Date();
    return {
      total: promociones.length,
      activas: promociones.filter((p) => {
        if (!p.activo) return false;
        const inicio = new Date(p.fechaInicio);
        if (inicio > now) return false;
        if (p.fechaFin && new Date(p.fechaFin) < now) return false;
        return true;
      }).length,
      programadas: promociones.filter((p) => p.activo && new Date(p.fechaInicio) > now).length,
    };
  }, [promociones]);

  const handleNew = () => {
    setEditingPromo(null);
    setForm({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'cantidad_gratis',
      cantidadComprar: 3,
      cantidadBeneficio: 1,
      aplicaA: 'todos',
      fechaInicio: new Date().toISOString().split('T')[0],
      activo: true,
      visiblePos: true,
      visibleWeb: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (promo: Promocion) => {
    setEditingPromo(promo);
    setForm({
      codigo: promo.codigo,
      nombre: promo.nombre,
      descripcion: promo.descripcion || '',
      tipo: promo.tipo,
      cantidadComprar: promo.cantidadComprar || undefined,
      cantidadBeneficio: promo.cantidadBeneficio || undefined,
      descuentoPorcentaje: promo.descuentoPorcentaje || undefined,
      descuentoMonto: promo.descuentoMonto || undefined,
      precioFijo: promo.precioFijo || undefined,
      montoMinimoCompra: promo.montoMinimoCompra || undefined,
      aplicaA: promo.aplicaA || 'todos',
      fechaInicio: promo.fechaInicio.split('T')[0],
      fechaFin: promo.fechaFin?.split('T')[0] || undefined,
      activo: promo.activo,
      visiblePos: promo.visiblePos,
      visibleWeb: promo.visibleWeb,
    });
    setDialogOpen(true);
  };

  const handleDelete = (promo: Promocion) => {
    setDeletingPromo(promo);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.codigo || !form.nombre || !form.fechaInicio) return;

    const dto: CreatePromocionDto = {
      ...form,
      fechaInicio: new Date(form.fechaInicio).toISOString(),
      fechaFin: form.fechaFin ? new Date(form.fechaFin).toISOString() : undefined,
    };

    if (editingPromo) {
      await updateMutation.mutateAsync({ id: editingPromo.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingPromo) return;
    await deleteMutation.mutateAsync(deletingPromo.id);
    setDeleteDialogOpen(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
            <Tag className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Promociones
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Crea ofertas y descuentos para tus clientes
          </p>
        </div>
        <Button size="lg" className="gap-2 h-11 md:h-10 w-full sm:w-auto" onClick={handleNew}>
          <Plus size={20} />
          Nueva Promocion
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2 md:gap-4"
      >
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.activas}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Activas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.programadas}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Programadas</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 md:space-y-4"
      >
        {isLoading ? (
          <div className="space-y-3 md:space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : !promociones?.length ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium">No hay promociones</h3>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primera oferta o descuento</p>
            </CardContent>
          </Card>
        ) : (
          promociones.map((promo) => {
            const tipoInfo = tipoLabels[promo.tipo] || tipoLabels.cantidad_gratis;
            const status = getPromoStatus(promo);
            const Icon = tipoInfo.icon;

            return (
              <Card key={promo.id} className="hover:shadow-md active:scale-[0.98] transition-all">
                <CardContent className="p-3 md:p-4">
                  {/* Desktop layout */}
                  <div className="hidden md:flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${tipoInfo.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{promo.nombre}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {promo.visiblePos && <Badge variant="outline" className="text-xs">POS</Badge>}
                        {promo.visibleWeb && <Badge variant="outline" className="text-xs">Web</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getPromoDescription(promo)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(promo.fechaInicio)}
                          {promo.fechaFin && ` - ${formatDate(promo.fechaFin)}`}
                        </span>
                        <span>Codigo: {promo.codigo}</span>
                        {promo.usosActuales > 0 && <span>{promo.usosActuales} usos</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(promo)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(promo)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${tipoInfo.color} shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-sm">{promo.nombre}</h3>
                          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getPromoDescription(promo)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(promo.fechaInicio)}
                          </span>
                          <div className="flex gap-1">
                            {promo.visiblePos && <Badge variant="outline" className="text-[10px] px-1 py-0">POS</Badge>}
                            {promo.visibleWeb && <Badge variant="outline" className="text-[10px] px-1 py-0">Web</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-11 text-sm gap-1.5"
                        onClick={() => handleEdit(promo)}
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-4 text-red-500 hover:text-red-700 border-red-200"
                        onClick={() => handleDelete(promo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Editar Promocion' : 'Nueva Promocion'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-5 py-3 md:py-4">
            {/* Datos basicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm md:text-base">Codigo *</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="PROMO-001"
                  disabled={!!editingPromo}
                  className="h-11 md:h-10 text-base md:text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-sm md:text-base">Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v as TipoPromocion })}
                >
                  <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descuento_porcentaje">Descuento %</SelectItem>
                    <SelectItem value="nth_precio">Nth precio especial</SelectItem>
                    <SelectItem value="nth_gratis">Nth gratis</SelectItem>
                    <SelectItem value="nxm">NxM (Lleva N paga M)</SelectItem>
                    <SelectItem value="cantidad_gratis">Lleva X Paga Y (legado)</SelectItem>
                    <SelectItem value="cantidad_descuento">Descuento por cantidad</SelectItem>
                    <SelectItem value="precio_fijo">Precio fijo</SelectItem>
                    <SelectItem value="monto_minimo">Monto minimo</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-sm md:text-base">Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Promo 3x2 en bebidas"
                className="h-11 md:h-10 text-base md:text-sm"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-sm md:text-base">Descripcion</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripcion de la promocion..."
                rows={2}
                className="text-base md:text-sm min-h-[44px]"
              />
            </div>

            <Separator />

            {/* Campos segun tipo */}
            {form.tipo === 'cantidad_gratis' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Cantidad a comprar</Label>
                  <Input
                    type="number"
                    min={2}
                    value={form.cantidadComprar || ''}
                    onChange={(e) => setForm({ ...form, cantidadComprar: parseInt(e.target.value) || undefined })}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad gratis</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.cantidadBeneficio || ''}
                    onChange={(e) => setForm({ ...form, cantidadBeneficio: parseInt(e.target.value) || undefined })}
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            {form.tipo === 'cantidad_descuento' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Cantidad minima</Label>
                  <Input
                    type="number"
                    min={2}
                    value={form.cantidadComprar || ''}
                    onChange={(e) => setForm({ ...form, cantidadComprar: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>% Descuento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.descuentoPorcentaje || ''}
                    onChange={(e) => setForm({ ...form, descuentoPorcentaje: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            )}

            {form.tipo === 'precio_fijo' && (
              <div className="space-y-2">
                <Label>Precio fijo (S/)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.precioFijo || ''}
                  onChange={(e) => setForm({ ...form, precioFijo: parseFloat(e.target.value) || undefined })}
                  placeholder="9.90"
                />
              </div>
            )}

            {form.tipo === 'monto_minimo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Monto minimo (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.montoMinimoCompra || ''}
                    onChange={(e) => setForm({ ...form, montoMinimoCompra: parseFloat(e.target.value) || undefined })}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>% Descuento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.descuentoPorcentaje || ''}
                    onChange={(e) => setForm({ ...form, descuentoPorcentaje: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
            )}

            {form.tipo === 'descuento_porcentaje' && (
              <div className="space-y-2">
                <Label>Porcentaje de descuento (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.descuentoPorcentaje || ''}
                  onChange={(e) => setForm({ ...form, descuentoPorcentaje: parseFloat(e.target.value) || undefined })}
                  placeholder="10"
                />
              </div>
            )}

            {form.tipo === 'nth_precio' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Cantidad a comprar</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.cantidadComprar || ''}
                    onChange={(e) => setForm({ ...form, cantidadComprar: parseInt(e.target.value) || undefined })}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground">Ej: Compra 2, la 3ra a precio especial</p>
                </div>
                <div className="space-y-2">
                  <Label>Precio especial (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.precioFijo || ''}
                    onChange={(e) => setForm({ ...form, precioFijo: parseFloat(e.target.value) || undefined })}
                    placeholder="1.00"
                  />
                </div>
              </div>
            )}

            {form.tipo === 'nth_gratis' && (
              <div className="space-y-2">
                <Label>Cantidad a comprar</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.cantidadComprar || ''}
                  onChange={(e) => setForm({ ...form, cantidadComprar: parseInt(e.target.value) || undefined })}
                  placeholder="4"
                />
                <p className="text-xs text-muted-foreground">Ej: Compra 4, la 5ta es gratis</p>
              </div>
            )}

            {form.tipo === 'nxm' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label>Lleva (N)</Label>
                  <Input
                    type="number"
                    min={2}
                    value={form.cantidadComprar || ''}
                    onChange={(e) => setForm({ ...form, cantidadComprar: parseInt(e.target.value) || undefined })}
                    placeholder="3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paga (M)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.cantidadBeneficio || ''}
                    onChange={(e) => setForm({ ...form, cantidadBeneficio: parseInt(e.target.value) || undefined })}
                    placeholder="2"
                  />
                </div>
                <p className="text-xs text-muted-foreground col-span-2">Ej: Lleva 3 paga 2</p>
              </div>
            )}

            <Separator />

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio *</Label>
                <Input
                  type="date"
                  value={form.fechaInicio?.split('T')[0] || ''}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={form.fechaFin?.split('T')[0] || ''}
                  onChange={(e) => setForm({ ...form, fechaFin: e.target.value || undefined })}
                />
              </div>
            </div>

            <Separator />

            {/* Opciones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Activa</Label>
                <Switch
                  checked={form.activo}
                  onCheckedChange={(v) => setForm({ ...form, activo: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Visible en POS</Label>
                <Switch
                  checked={form.visiblePos}
                  onCheckedChange={(v) => setForm({ ...form, visiblePos: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Visible en Web</Label>
                <Switch
                  checked={form.visibleWeb}
                  onCheckedChange={(v) => setForm({ ...form, visibleWeb: v })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Button variant="outline" className="h-11 md:h-10" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="h-11 md:h-10"
              onClick={handleSubmit}
              disabled={isSaving || !form.codigo || !form.nombre || !form.fechaInicio}
            >
              {isSaving ? 'Guardando...' : editingPromo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar promocion</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deletingPromo?.nombre}</strong>.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
