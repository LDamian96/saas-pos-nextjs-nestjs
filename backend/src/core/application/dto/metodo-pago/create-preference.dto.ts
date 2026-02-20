import { IsArray, IsString, IsNumber, IsPositive, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class PreferenceItemDto {
  @IsString()
  title: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unit_price: number;
}

export class CreatePreferenceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  items: PreferenceItemDto[];

  @IsString()
  external_reference: string;
}
