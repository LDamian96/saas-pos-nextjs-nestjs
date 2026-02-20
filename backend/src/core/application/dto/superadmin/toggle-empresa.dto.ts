import { IsBoolean } from 'class-validator';

export class ToggleEmpresaDto {
  @IsBoolean()
  activo: boolean;
}
