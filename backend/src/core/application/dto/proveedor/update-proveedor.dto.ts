/**
 * @file update-proveedor.dto.ts
 * @description DTO para actualizar proveedor
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: proveedores)
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateProveedorDto } from './create-proveedor.dto';

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {}
