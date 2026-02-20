import { IsString, IsOptional, IsObject } from 'class-validator';

export class WebhookMercadoPagoDto {
  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  api_version?: string;

  @IsObject()
  @IsOptional()
  data?: {
    id?: string;
  };

  @IsString()
  @IsOptional()
  date_created?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsOptional()
  live_mode?: boolean;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  user_id?: string;
}
