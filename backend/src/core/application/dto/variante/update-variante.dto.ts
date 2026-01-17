/**
 * @file update-variante.dto.ts
 * @description DTO para actualizar variantes
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: variantes)
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateVarianteDto } from './create-variante.dto';

export class UpdateVarianteDto extends PartialType(CreateVarianteDto) {}
