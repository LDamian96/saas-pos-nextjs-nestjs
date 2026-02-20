import { IsArray, IsUUID } from 'class-validator';

export class ReorderSeccionesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
