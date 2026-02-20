import { IsString, IsIn, IsUUID } from 'class-validator';

export class CreateSuscripcionDto {
  @IsUUID('4')
  planId: string;

  @IsString()
  @IsIn(['mensual', 'anual'])
  periodoFacturacion: string;
}
