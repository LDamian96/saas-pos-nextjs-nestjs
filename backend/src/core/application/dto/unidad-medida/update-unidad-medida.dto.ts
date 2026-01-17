/**
 * @file update-unidad-medida.dto.ts
 * @description DTO para actualizar unidad de medida
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadMedidaDto } from './create-unidad-medida.dto';

export class UpdateUnidadMedidaDto extends PartialType(CreateUnidadMedidaDto) {}
