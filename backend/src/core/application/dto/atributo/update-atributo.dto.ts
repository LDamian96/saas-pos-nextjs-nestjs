/**
 * @file update-atributo.dto.ts
 * @description DTO para actualizar atributo
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: atributos)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: ATRIBUTOS)
 */

import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateAtributoDto } from './create-atributo.dto';

export class UpdateAtributoDto extends PartialType(
  OmitType(CreateAtributoDto, ['valores'] as const),
) {}
