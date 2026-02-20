/**
 * @file update-metodo-pago.dto.ts
 * @description DTO para actualizar método de pago
 *
 * @references
 * - Base de datos: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: metodos_pago)
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateMetodoPagoDto } from './create-metodo-pago.dto';

export class UpdateMetodoPagoDto extends PartialType(CreateMetodoPagoDto) {}
