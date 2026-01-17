/**
 * @file update-sucursal.dto.ts
 * @description DTO para actualizar sucursal
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: sucursales)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (PUT /sucursales/:id)
 */

import { PartialType } from '@nestjs/swagger';
import { CreateSucursalDto } from './create-sucursal.dto';

export class UpdateSucursalDto extends PartialType(CreateSucursalDto) {}
