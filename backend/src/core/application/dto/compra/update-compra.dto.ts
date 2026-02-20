/**
 * @file update-compra.dto.ts
 * @description DTO para actualizar compra
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateCompraDto } from './create-compra.dto';

export class UpdateCompraDto extends PartialType(CreateCompraDto) {}
