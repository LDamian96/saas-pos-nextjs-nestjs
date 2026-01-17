'use client';

/**
 * @file page.tsx
 * @description Página de gestión de usuarios
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';

// Datos demo estáticos (reemplazar con hook cuando exista el endpoint)
const usuariosDemo = [
  {
    id: '1',
    nombre: 'Carlos',
    apellido: 'Mendoza',
    email: 'admin@demo.com',
    telefono: '999888777',
    rol: 'Administrador',
    rolColor: 'bg-purple-100 text-purple-800',
    activo: true,
    ultimoAcceso: '2026-01-15 10:30',
  },
  {
    id: '2',
    nombre: 'Maria',
    apellido: 'Garcia',
    email: 'supervisor@demo.com',
    telefono: '999777666',
    rol: 'Supervisor',
    rolColor: 'bg-blue-100 text-blue-800',
    activo: true,
    ultimoAcceso: '2026-01-15 09:15',
  },
  {
    id: '3',
    nombre: 'Juan',
    apellido: 'Lopez',
    email: 'cajero@demo.com',
    telefono: '999666555',
    rol: 'Cajero',
    rolColor: 'bg-green-100 text-green-800',
    activo: true,
    ultimoAcceso: '2026-01-14 18:00',
  },
  {
    id: '4',
    nombre: 'Pedro',
    apellido: 'Sanchez',
    email: 'almacen@demo.com',
    telefono: '999555444',
    rol: 'Almacenero',
    rolColor: 'bg-orange-100 text-orange-800',
    activo: true,
    ultimoAcceso: '2026-01-14 17:30',
  },
  {
    id: '5',
    nombre: 'Ana',
    apellido: 'Martinez',
    email: 'vendedor@demo.com',
    telefono: '999444333',
    rol: 'Vendedor',
    rolColor: 'bg-teal-100 text-teal-800',
    activo: false,
    ultimoAcceso: '2026-01-10 12:00',
  },
];

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsuarios = usuariosDemo.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">Gestiona los usuarios de tu empresa</p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{usuariosDemo.length}</p>
              <p className="text-sm text-gray-500">Total usuarios</p>
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {usuariosDemo.filter((u) => u.activo).length}
              </p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {usuariosDemo.filter((u) => !u.activo).length}
              </p>
              <p className="text-sm text-gray-500">Inactivos</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-500">Roles</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar usuario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Lista de usuarios */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                    Estado
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                    Ultimo acceso
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario, index) => (
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
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {usuario.telefono}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={usuario.rolColor}>{usuario.rol}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {usuario.activo ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{usuario.ultimoAcceso}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
