import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class UpdateVarianteRapidoDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVenta?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioCompra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
