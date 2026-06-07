/**
 * @file lote.controller.ts
 * @description Controller para gestión de lotes (FEFO)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: lotes)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: LOTES)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoteService } from '../../../core/application/services/lote.service';
import { CreateLoteDto, UpdateLoteDto, LoteFiltersDto } from '../../../core/application/dto/lote';
import { CurrentUser, UserPayload } from '../decorators/current-user.decorator';

import { NormalizeSucursalIdPipe } from '../pipes/normalize-sucursal-id.pipe';
@ApiTags('Lotes')
@Controller('lotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoteController {
  constructor(private readonly loteService: LoteService) {}

  private getEmpresaId(user: UserPayload): string {
    if (!user.empresaId) {
      throw new ForbiddenException('Usuario sin empresa asignada');
    }
    return user.empresaId;
  }

  /**
   * GET /lotes - Listar lotes con filtros
   */
  @Get()
  @ApiOperation({ summary: 'Listar lotes con filtros y paginación' })
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query() filters: LoteFiltersDto,
  ) {
    return this.loteService.findAll(this.getEmpresaId(user), filters);
  }

  /**
   * GET /lotes/proximos-vencer - Lotes próximos a vencer
   */
  @Get('proximos-vencer')
  @ApiOperation({ summary: 'Obtener lotes próximos a vencer (FEFO)' })
  async findProximosVencer(
    @CurrentUser() user: UserPayload,
    @Query('dias') dias?: number,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
  ) {
    return this.loteService.findProximosVencer(
      this.getEmpresaId(user),
      dias || 30,
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /lotes/vencidos - Lotes vencidos
   */
  @Get('vencidos')
  @ApiOperation({ summary: 'Obtener lotes vencidos' })
  async findVencidos(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
  ) {
    return this.loteService.findVencidos(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /lotes/variante/:varianteId - Lotes FEFO de una variante
   */
  @Get('variante/:varianteId')
  @ApiOperation({ summary: 'Obtener lotes de una variante ordenados por FEFO' })
  async findByVariante(
    @CurrentUser() user: UserPayload,
    @Param('varianteId', ParseUUIDPipe) varianteId: string,
    @Query('sucursalId', NormalizeSucursalIdPipe) sucursalId?: string,
  ) {
    return this.loteService.findByVarianteFEFO(
      this.getEmpresaId(user),
      varianteId,
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /lotes/:id - Obtener lote por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un lote' })
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.loteService.findOne(this.getEmpresaId(user), id);
  }

  /**
   * POST /lotes - Crear lote
   */
  @Post()
  @ApiOperation({ summary: 'Crear nuevo lote' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateLoteDto,
  ) {
    return this.loteService.create(this.getEmpresaId(user), dto, user.id);
  }

  /**
   * PATCH /lotes/:id - Actualizar lote
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar lote' })
  async update(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoteDto,
  ) {
    return this.loteService.update(this.getEmpresaId(user), id, dto);
  }

  /**
   * POST /lotes/:id/bloquear - Bloquear lote
   */
  @Post(':id/bloquear')
  @ApiOperation({ summary: 'Bloquear lote (por recall, daño, etc.)' })
  async bloquear(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.loteService.bloquear(this.getEmpresaId(user), id, motivo);
  }

  /**
   * POST /lotes/:id/desbloquear - Desbloquear lote
   */
  @Post(':id/desbloquear')
  @ApiOperation({ summary: 'Desbloquear lote' })
  async desbloquear(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.loteService.desbloquear(this.getEmpresaId(user), id);
  }
}
