'use client';

/**
 * @file page.tsx
 * @description Página de configuración de empresa
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: EMPRESAS)
 * - Rutas: ver docs/arquitectura/07-FRONTEND-RUTAS.md
 */

import { Building2, Palette, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  EmpresaDatosForm,
  EmpresaConfigForm,
  EmpresaBrandingForm,
} from '@/presentation/components/features/empresa';

export default function EmpresaConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Empresa</h1>
        <p className="text-gray-500 mt-1">
          Administra la informacion y configuracion de tu empresa
        </p>
      </div>

      {/* Tabs con contenido */}
      <Card>
        <Tabs defaultValue="datos" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="datos" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Datos</span>
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Colores</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="datos" className="mt-0">
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg">Datos Generales</CardTitle>
                  <CardDescription>
                    Informacion basica de tu empresa
                  </CardDescription>
                </div>
                <EmpresaDatosForm />
              </div>
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg">Configuracion</CardTitle>
                  <CardDescription>
                    Moneda, impuestos y preferencias regionales
                  </CardDescription>
                </div>
                <EmpresaConfigForm />
              </div>
            </TabsContent>

            <TabsContent value="branding" className="mt-0">
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg">Colores de Marca</CardTitle>
                  <CardDescription>
                    Personaliza los colores de tu sistema
                  </CardDescription>
                </div>
                <EmpresaBrandingForm />
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
