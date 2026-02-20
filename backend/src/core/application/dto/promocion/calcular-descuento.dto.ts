import { IsNumber, IsPositive } from 'class-validator';

export class CalcularDescuentoDto {
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @IsPositive()
  precioUnitario: number;
}
