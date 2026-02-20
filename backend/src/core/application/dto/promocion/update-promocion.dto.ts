/**
 * @file update-promocion.dto.ts
 * @description DTO para actualizar promoción
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: promociones)
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreatePromocionDto } from './create-promocion.dto';

export class UpdatePromocionDto extends PartialType(CreatePromocionDto) {}
