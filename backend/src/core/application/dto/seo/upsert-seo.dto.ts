import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeHtml } from '../../../../shared/utils/sanitize.util';

export class UpsertSeoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  metaKeywords?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  ogTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  ogDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  @IsOptional()
  @IsString()
  robotsTxt?: string;

  @IsOptional()
  @IsBoolean()
  sitemapActivo?: boolean;
}
