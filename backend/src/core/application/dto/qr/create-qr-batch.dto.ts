import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class CreateQrBatchDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  productoIds: string[];
}
