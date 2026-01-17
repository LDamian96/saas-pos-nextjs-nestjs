/**
 * @file update-lote.dto.ts
 * @description DTO para actualizar un lote
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: lotes)
 */

import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateLoteDto } from './create-lote.dto';

export class UpdateLoteDto extends PartialType(CreateLoteDto) {
  @IsString()
  @IsOptional()
  @IsIn(['activo', 'agotado', 'vencido', 'bloqueado'], {
    message: 'Estado inválido. Usa: activo, agotado, vencido o bloqueado',
  })
  estado?: string;
}
