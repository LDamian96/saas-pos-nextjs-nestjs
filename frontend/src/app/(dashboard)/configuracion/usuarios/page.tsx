'use client';

/**
 * @file page.tsx
 * @description Pagina de gestion de usuarios
 *
 * @references
 * - Service: ver frontend/src/application/services/usuarios.service.ts
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: USUARIOS)
 */

import { useState } from 'react';
import { motion } from '@/shared/motion';
import {
  Users,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Mail,
  Phone,
  Edit,
  Trash2,
  Key,
  Building2,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

import { useUsuarios } from '@/application/hooks/queries/use-usuarios';
import { useDeleteUsuario } from '@/application/hooks/mutations/use-usuarios-mutations';
import { useRoles } from '@/application/hooks/queries/use-roles';
import { useEmpresa } from '@/application/hooks/queries/use-empresa';
import { Usuario } from '@/application/services/usuarios.service';
import { UsuarioDialog } from '@/presentation/components/features/usuarios';

// Colores para los roles
const rolColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  supervisor: 'bg-blue-100 text-blue-800',
  cajero: 'bg-green-100 text-green-800',
  almacenero: 'bg-orange-100 text-orange-800',
  vendedor: 'bg-teal-100 text-teal-800',
};

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  // Queries
  const { data: usuariosData, isLoading } = useUsuarios({ search: searchQuery || undefined });
  const { data: roles } = useRoles();
  const { data: empresa } = useEmpresa();
  const deleteMutation = useDeleteUsuario();

  const usuarios = usuariosData?.data || [];
  const totalUsuarios = usuariosData?.meta?.total || usuarios.length;
  const activos = usuarios.filter((u) => u.activo).length;
  const inactivos = usuarios.filter((u) => !u.activo).length;
  const maxUsuarios = empresa?.maxUsuarios ?? Infinity;
  const limiteAlcanzado = activos >= maxUsuarios;

  const handleCreate = () => {
    setSelectedUsuario(null);
    setDialogOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setDialogOpen(true);
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (usuarioToDelete) {
      await deleteMutation.mutateAsync(usuarioToDelete.id);
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    }
  };

  const getRolColor = (codigo: string) => {
    return rolColors[codigo] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3 md:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Gestiona los usuarios de tu empresa
            {empresa && (
              <span className={`ml-2 font-medium ${limiteAlcanzado ? 'text-red-600' : 'text-blue-600'}`}>
                ({activos}/{maxUsuarios} usuarios)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <Button
            size="lg"
            className="gap-2 h-11 md:h-10 w-full sm:w-auto active:scale-[0.98]"
            onClick={handleCreate}
            disabled={limiteAlcanzado}
          >
            <Plus size={20} />
            {limiteAlcanzado ? 'Limite alcanzado' : 'Nuevo Usuario'}
          </Button>
          {limiteAlcanzado && (
            <p className="text-xs text-red-500">Tu plan permite maximo {maxUsuarios} usuarios</p>
          )}
        </div>
      </div>

      {/* Estadisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-12" /> : totalUsuarios}
              </p>
              <p className="text-sm text-gray-500">Total usuarios</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-12" /> : activos}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? <Skeleton className="h-8 w-12" /> : inactivos}
              </p>
              <p className="text-sm text-gray-500">Inactivos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-3 md:p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {roles?.length || 0}
              </p>
              <p className="text-sm text-gray-500">Roles</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Buscador */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 md:h-10"
        />
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Usuario
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Contacto
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rol</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Sucursal
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Estado
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton loading
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-gray-500">No se encontraron usuarios</p>
                      <Button className="mt-4" onClick={handleCreate} disabled={limiteAlcanzado}>
                        <Plus className="mr-2 h-4 w-4" />
                        {limiteAlcanzado ? 'Limite alcanzado' : 'Crear primer usuario'}
                      </Button>
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario, index) => (
                    <motion.tr
                      key={usuario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {usuario.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {usuario.nombre} {usuario.apellido}
                            </p>
                            <p className="text-sm text-gray-500">{usuario.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            {usuario.email}
                          </div>
                          {usuario.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              {usuario.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getRolColor(usuario.rol.codigo)}>
                          {usuario.rol.nombre}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {usuario.todasSucursales ? (
                            <span className="text-blue-600 font-medium">Todas</span>
                          ) : usuario.sucursal ? (
                            usuario.sucursal.nombre
                          ) : (
                            <span className="text-gray-400">Sin asignar</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {usuario.activo ? (
                          <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(usuario)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="mr-2 h-4 w-4" />
                              Cambiar contrasena
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteClick(usuario)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog crear/editar */}
      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={selectedUsuario}
      />

      {/* Dialog confirmar eliminacion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion desactivara al usuario "{usuarioToDelete?.nombre} {usuarioToDelete?.apellido}".
              El usuario no podra iniciar sesion pero su historial se conservara.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-11 md:h-10 w-full sm:w-auto active:scale-[0.98]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 h-11 md:h-10 w-full sm:w-auto active:scale-[0.98]"
            >
              Si, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
