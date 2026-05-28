'use client';

/**
 * @file page.tsx
 * @description Pagina de gestion de proveedores - CRUD completo
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  CreditCard,
  FileText,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Badge } from '@/presentation/components/ui/badge';
import { Separator } from '@/presentation/components/ui/separator';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Switch } from '@/presentation/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { useProveedores } from '@/application/hooks/queries/use-proveedores';
import {
  useCreateProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
} from '@/application/hooks/mutations/use-proveedores-mutations';
import { Proveedor, CreateProveedorDto } from '@/application/services/proveedor.service';

const emptyForm: CreateProveedorDto = {
  codigo: '',
  razonSocial: '',
  nombreComercial: '',
  ruc: '',
  email: '',
  telefono: '',
  celular: '',
  direccion: '',
  contactoNombre: '',
  contactoCargo: '',
  contactoTelefono: '',
  contactoEmail: '',
  diasCredito: 0,
  limiteCredito: 0,
  activo: true,
  notas: '',
};

export default function ProveedoresPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [deletingProveedor, setDeletingProveedor] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<CreateProveedorDto>(emptyForm);

  const { data: proveedores, isLoading } = useProveedores({ search: search || undefined });
  const createMutation = useCreateProveedor();
  const updateMutation = useUpdateProveedor();
  const deleteMutation = useDeleteProveedor();

  const stats = useMemo(() => {
    if (!proveedores) return { total: 0, activos: 0, conCredito: 0 };
    return {
      total: proveedores.length,
      activos: proveedores.filter((p) => p.activo).length,
      conCredito: proveedores.filter((p) => p.diasCredito > 0).length,
    };
  }, [proveedores]);

  const handleNew = () => {
    setEditingProveedor(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setForm({
      codigo: proveedor.codigo,
      razonSocial: proveedor.razonSocial,
      nombreComercial: proveedor.nombreComercial || '',
      ruc: proveedor.ruc || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      celular: proveedor.celular || '',
      direccion: proveedor.direccion || '',
      contactoNombre: proveedor.contactoNombre || '',
      contactoCargo: proveedor.contactoCargo || '',
      contactoTelefono: proveedor.contactoTelefono || '',
      contactoEmail: proveedor.contactoEmail || '',
      diasCredito: proveedor.diasCredito,
      limiteCredito: proveedor.limiteCredito || 0,
      activo: proveedor.activo,
      notas: proveedor.notas || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (proveedor: Proveedor) => {
    setDeletingProveedor(proveedor);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.codigo || !form.razonSocial) return;

    const dto: CreateProveedorDto = {
      ...form,
      limiteCredito: form.limiteCredito || undefined,
      nombreComercial: form.nombreComercial || undefined,
      ruc: form.ruc || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      celular: form.celular || undefined,
      direccion: form.direccion || undefined,
      contactoNombre: form.contactoNombre || undefined,
      contactoCargo: form.contactoCargo || undefined,
      contactoTelefono: form.contactoTelefono || undefined,
      contactoEmail: form.contactoEmail || undefined,
      notas: form.notas || undefined,
    };

    if (editingProveedor) {
      await updateMutation.mutateAsync({ id: editingProveedor.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingProveedor) return;
    await deleteMutation.mutateAsync(deletingProveedor.id);
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
            <Truck className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Proveedores
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gestiona tus proveedores y sus datos de contacto
          </p>
        </div>
        <Button size="lg" className="gap-2 h-11 md:h-10 w-full sm:w-auto" onClick={handleNew}>
          <Plus size={20} />
          Nuevo Proveedor
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
              <Building2 className="h-5 w-5 text-blue-600" />
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
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.activos}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg md:text-2xl font-bold">{stats.conCredito}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Con credito</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, RUC o codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 md:h-10"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isLoading ? (
          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !proveedores?.length ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium">No hay proveedores</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? 'No se encontraron resultados' : 'Agrega tu primer proveedor'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Credito</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores.map((prov) => (
                      <TableRow key={prov.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{prov.nombreComercial || prov.razonSocial}</p>
                            <p className="text-xs text-muted-foreground">
                              {prov.codigo} {prov.ruc && `| RUC: ${prov.ruc}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            {prov.email && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {prov.email}
                              </p>
                            )}
                            {prov.telefono && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {prov.telefono}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {prov.diasCredito > 0 ? (
                            <Badge variant="secondary">{prov.diasCredito} dias</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Contado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={prov.activo ? 'default' : 'secondary'}>
                            {prov.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(prov)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(prov)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {proveedores.map((prov) => (
                <Card key={prov.id} className="active:scale-[0.98] transition-transform">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{prov.nombreComercial || prov.razonSocial}</p>
                          <Badge variant={prov.activo ? 'default' : 'secondary'} className="text-xs">
                            {prov.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prov.codigo} {prov.ruc && `| RUC: ${prov.ruc}`}
                        </p>
                      </div>
                      {prov.diasCredito > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">{prov.diasCredito}d credito</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {prov.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {prov.email}
                        </span>
                      )}
                      {prov.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {prov.telefono}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-11 text-sm gap-1.5"
                        onClick={() => handleEdit(prov)}
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 px-4 text-red-500 hover:text-red-700 border-red-200"
                        onClick={() => handleDelete(prov)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Datos principales */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Datos de la Empresa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Codigo *</Label>
                  <Input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="PROV-001"
                    disabled={!!editingProveedor}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RUC</Label>
                  <Input
                    value={form.ruc}
                    onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                    placeholder="20123456789"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Razon Social *</Label>
                  <Input
                    value={form.razonSocial}
                    onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
                    placeholder="Nombre legal de la empresa"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nombre Comercial</Label>
                  <Input
                    value={form.nombreComercial}
                    onChange={(e) => setForm({ ...form, nombreComercial: e.target.value })}
                    placeholder="Nombre comercial (opcional)"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contacto empresa */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contacto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="01-5551234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                    placeholder="999888777"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Direccion</Label>
                  <Input
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Av. Principal 123"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contacto persona */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Persona de Contacto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.contactoNombre}
                    onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
                    placeholder="Juan Perez"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={form.contactoCargo}
                    onChange={(e) => setForm({ ...form, contactoCargo: e.target.value })}
                    placeholder="Gerente Comercial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input
                    value={form.contactoTelefono}
                    onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })}
                    placeholder="999111222"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.contactoEmail}
                    onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Condiciones comerciales */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Condiciones Comerciales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias de Credito</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.diasCredito}
                    onChange={(e) => setForm({ ...form, diasCredito: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Credito</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={form.limiteCredito}
                    onChange={(e) => setForm({ ...form, limiteCredito: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notas y estado */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones sobre el proveedor..."
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Activo</Label>
                <Switch
                  checked={form.activo}
                  onCheckedChange={(v) => setForm({ ...form, activo: v })}
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
              disabled={isSaving || !form.codigo || !form.razonSocial}
            >
              {isSaving ? 'Guardando...' : editingProveedor ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a <strong>{deletingProveedor?.nombreComercial || deletingProveedor?.razonSocial}</strong>.
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
