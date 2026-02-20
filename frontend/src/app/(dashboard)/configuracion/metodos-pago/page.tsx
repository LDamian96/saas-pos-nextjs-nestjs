'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  MoreHorizontal,
  Banknote,
  Smartphone,
  Wallet,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Switch } from '@/presentation/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
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
import { useMetodosPago } from '@/application/hooks/queries/use-metodos-pago';
import {
  useCreateMetodoPago,
  useUpdateMetodoPago,
  useDeleteMetodoPago,
} from '@/application/hooks/mutations/use-metodos-pago-mutations';
import type { MetodoPago, CreateMetodoPagoDto } from '@/application/services/metodos-pago.service';

const TIPOS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'digital', label: 'Digital', icon: Smartphone },
  { value: 'transferencia', label: 'Transferencia', icon: Globe },
  { value: 'otro', label: 'Otro', icon: Wallet },
];

function getTipoIcon(tipo: string) {
  const found = TIPOS.find((t) => t.value === tipo);
  return found?.icon || Wallet;
}

export default function MetodosPagoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingMetodo, setEditingMetodo] = useState<MetodoPago | null>(null);

  const { data: metodosPagoData, isLoading } = useMetodosPago();
  const createMutation = useCreateMetodoPago();
  const updateMutation = useUpdateMetodoPago();
  const deleteMutation = useDeleteMetodoPago();

  const metodosPago = metodosPagoData?.data || [];

  const handleCreate = () => {
    setEditingMetodo(null);
    setDialogOpen(true);
  };

  const handleEdit = (metodo: MetodoPago) => {
    setEditingMetodo(metodo);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/configuracion"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Métodos de Pago</h1>
            <p className="text-gray-500 mt-1">
              Configura las formas de pago aceptadas en tu negocio
            </p>
          </div>
        </div>
        <Button size="lg" className="gap-2" onClick={handleCreate}>
          <Plus size={20} />
          Nuevo Método
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-12" /> : metodosPago.length}
              </p>
              <p className="text-sm text-gray-500">Total métodos</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  metodosPago.filter((m) => m.esPasarelaIntegrada).length
                )}
              </p>
              <p className="text-sm text-gray-500">Con pasarela</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  metodosPago.filter((m) => m.activo).length
                )}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : metodosPago.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Sin métodos de pago</h3>
            <p className="text-gray-500 mt-1">Crea tu primer método de pago</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {metodosPago.map((metodo, index) => {
            const Icon = getTipoIcon(metodo.tipo);
            return (
              <motion.div
                key={metodo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: metodo.color ? `${metodo.color}20` : '#f3f4f6' }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{ color: metodo.color || '#6b7280' }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{metodo.nombre}</h3>
                            <Badge variant={metodo.activo ? 'default' : 'secondary'}>
                              {metodo.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            {metodo.esPasarelaIntegrada && (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                {metodo.pasarelaCodigo}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">
                              Código: {metodo.codigo}
                            </span>
                            <span className="text-sm text-gray-500">
                              Tipo: {metodo.tipo}
                            </span>
                            {(metodo.comisionPorcentaje > 0 || metodo.comisionFija > 0) && (
                              <span className="text-sm text-orange-600">
                                Comisión: {metodo.comisionPorcentaje}%
                                {metodo.comisionFija > 0 && ` + $${metodo.comisionFija}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {metodo.visiblePos && (
                            <Badge variant="outline" className="text-xs">POS</Badge>
                          )}
                          {metodo.visibleWeb && (
                            <Badge variant="outline" className="text-xs">Web</Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(metodo)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(metodo.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <MetodoPagoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metodo={editingMetodo}
        onCreate={(dto) => createMutation.mutate(dto, { onSuccess: () => setDialogOpen(false) })}
        onUpdate={(id, dto) => updateMutation.mutate({ id, dto }, { onSuccess: () => setDialogOpen(false) })}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar método de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el método de pago. No se podrá usar en nuevas ventas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

// ===== Dialog Component =====

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metodo: MetodoPago | null;
  onCreate: (dto: CreateMetodoPagoDto) => void;
  onUpdate: (id: string, dto: Partial<CreateMetodoPagoDto>) => void;
  isLoading: boolean;
}

function MetodoPagoDialog({ open, onOpenChange, metodo, onCreate, onUpdate, isLoading }: DialogProps) {
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('efectivo');
  const [descripcion, setDescripcion] = useState('');
  const [comisionPorcentaje, setComisionPorcentaje] = useState('0');
  const [comisionFija, setComisionFija] = useState('0');
  const [requiereReferencia, setRequiereReferencia] = useState(false);
  const [esPasarela, setEsPasarela] = useState(false);
  const [pasarelaCodigo, setPasarelaCodigo] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [visiblePos, setVisiblePos] = useState(true);
  const [visibleWeb, setVisibleWeb] = useState(true);
  const [activo, setActivo] = useState(true);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && metodo) {
      setCodigo(metodo.codigo);
      setNombre(metodo.nombre);
      setTipo(metodo.tipo);
      setDescripcion(metodo.descripcion || '');
      setComisionPorcentaje(String(metodo.comisionPorcentaje || 0));
      setComisionFija(String(metodo.comisionFija || 0));
      setRequiereReferencia(metodo.requiereReferencia);
      setEsPasarela(metodo.esPasarelaIntegrada);
      setPasarelaCodigo(metodo.pasarelaCodigo || '');
      setVisiblePos(metodo.visiblePos);
      setVisibleWeb(metodo.visibleWeb);
      setActivo(metodo.activo);
      setAccessToken('');
      setPublicKey('');
    } else if (isOpen && !metodo) {
      setCodigo('');
      setNombre('');
      setTipo('efectivo');
      setDescripcion('');
      setComisionPorcentaje('0');
      setComisionFija('0');
      setRequiereReferencia(false);
      setEsPasarela(false);
      setPasarelaCodigo('');
      setAccessToken('');
      setPublicKey('');
      setVisiblePos(true);
      setVisibleWeb(true);
      setActivo(true);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreateMetodoPagoDto = {
      codigo,
      nombre,
      tipo,
      descripcion: descripcion || undefined,
      comisionPorcentaje: parseFloat(comisionPorcentaje) || 0,
      comisionFija: parseFloat(comisionFija) || 0,
      requiereReferencia,
      esPasarelaIntegrada: esPasarela,
      pasarelaCodigo: esPasarela ? pasarelaCodigo : undefined,
      visiblePos,
      visibleWeb,
      activo,
    };

    if (esPasarela && pasarelaCodigo === 'mercadopago' && accessToken && publicKey) {
      dto.pasarelaConfig = { access_token: accessToken, public_key: publicKey };
    }

    if (metodo) {
      onUpdate(metodo.id, dto);
    } else {
      onCreate(dto);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {metodo ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="EFECTIVO"
                required
                disabled={!!metodo}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Efectivo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comisionPct">Comisión (%)</Label>
              <Input
                id="comisionPct"
                type="number"
                step="0.01"
                value={comisionPorcentaje}
                onChange={(e) => setComisionPorcentaje(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comisionFija">Comisión Fija ($)</Label>
              <Input
                id="comisionFija"
                type="number"
                step="0.01"
                value={comisionFija}
                onChange={(e) => setComisionFija(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Requiere referencia</Label>
              <Switch checked={requiereReferencia} onCheckedChange={setRequiereReferencia} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Visible en POS</Label>
              <Switch checked={visiblePos} onCheckedChange={setVisiblePos} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Visible en Web</Label>
              <Switch checked={visibleWeb} onCheckedChange={setVisibleWeb} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Activo</Label>
              <Switch checked={activo} onCheckedChange={setActivo} />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Pasarela de pago integrada</Label>
              <Switch checked={esPasarela} onCheckedChange={setEsPasarela} />
            </div>

            {esPasarela && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pl-4 border-l-2 border-blue-200"
              >
                <div className="space-y-2">
                  <Label>Pasarela</Label>
                  <Select value={pasarelaCodigo} onValueChange={setPasarelaCodigo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar pasarela" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pasarelaCodigo === 'mercadopago' && (
                  <>
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder={metodo?.pasarelaConfig?.configured ? '••••••• (configurado)' : 'TEST-xxxxxxxxxx'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Input
                        type="password"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        placeholder={metodo?.pasarelaConfig?.configured ? '••••••• (configurado)' : 'TEST-xxxxxxxxxx'}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Las credenciales se almacenan de forma segura y no se muestran después de guardarse.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : metodo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
