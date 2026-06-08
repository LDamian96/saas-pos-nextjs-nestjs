/**
 * @file mobile-logs.controller.ts
 * @description Endpoint para recibir logs/errores de la app movil Flutter.
 *
 * Sin auth (intencional): los errores pueden ocurrir ANTES del login,
 * o cuando la sesion ya expiro. Tener auth bloquearia el debugging real.
 *
 * Protecciones:
 *  - Rate limit por IP (60 req/min) → ver app.module.ts ThrottlerModule.
 *  - Payload max 16 KB.
 *  - Sanitiza strings.
 *
 * Como leer los logs desde el VPS:
 *   ssh root@62.146.228.180 "docker logs --tail 200 pos_ldmapp_backend 2>&1 | grep MOBILE_LOG"
 *   ssh root@62.146.228.180 "docker logs -f pos_ldmapp_backend 2>&1 | grep MOBILE_LOG"   # streaming
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Logger,
  Post,
  Headers as RequestHeaders,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MobileDeviceInfoDto {
  @IsOptional() @IsString() @MaxLength(60) platform?: string;
  @IsOptional() @IsString() @MaxLength(60) osVersion?: string;
  @IsOptional() @IsString() @MaxLength(60) model?: string;
  @IsOptional() @IsString() @MaxLength(40) appVersion?: string;
  @IsOptional() @IsString() @MaxLength(40) buildNumber?: string;
  @IsOptional() @IsString() @MaxLength(40) locale?: string;
}

class MobileLogDto {
  @IsIn(['debug', 'info', 'warning', 'error', 'fatal'])
  level!: 'debug' | 'info' | 'warning' | 'error' | 'fatal';

  @IsString() @MaxLength(500)
  message!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  error?: string;

  @IsOptional() @IsString() @MaxLength(8000)
  stackTrace?: string;

  @IsOptional() @IsString() @MaxLength(120)
  route?: string;

  @IsOptional() @IsString() @MaxLength(80)
  userId?: string;

  @IsOptional() @IsString() @MaxLength(80)
  empresaId?: string;

  @IsOptional() @IsString() @MaxLength(80)
  sessionId?: string;

  @IsOptional() @IsString() @MaxLength(40)
  timestamp?: string;

  @IsOptional() @ValidateNested() @Type(() => MobileDeviceInfoDto)
  device?: MobileDeviceInfoDto;

  @IsOptional() @IsString() @MaxLength(2000)
  extra?: string;
}

@ApiTags('Mobile logs')
@Controller('logs/mobile')
export class MobileLogsController {
  private readonly logger = new Logger('MOBILE_LOG');

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Recibe logs/errores desde la app movil Flutter',
  })
  ingest(
    @Body() dto: MobileLogDto,
    @Ip() ip: string,
    @RequestHeaders('user-agent') ua?: string,
  ): void {
    const payload = {
      level: dto.level,
      msg: dto.message,
      error: dto.error,
      stack: dto.stackTrace,
      route: dto.route,
      userId: dto.userId,
      empresaId: dto.empresaId,
      sessionId: dto.sessionId,
      device: dto.device,
      extra: dto.extra,
      ts: dto.timestamp ?? new Date().toISOString(),
      ip,
      ua: ua?.slice(0, 120),
    };

    // Una sola linea JSON por entry → facil de grep/tail/parsear.
    const line = JSON.stringify(payload);

    switch (dto.level) {
      case 'fatal':
      case 'error':
        this.logger.error(line);
        break;
      case 'warning':
        this.logger.warn(line);
        break;
      case 'info':
        this.logger.log(line);
        break;
      case 'debug':
      default:
        this.logger.debug(line);
        break;
    }
  }
}
