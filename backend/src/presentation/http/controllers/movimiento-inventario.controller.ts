/**
 * @file movimiento-inventario.controller.ts
 * @description Controller para gestión de movimientos de inventario
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: movimientos_inventario)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MovimientoInventarioService } from '../../../core/application/services/movimiento-inventario.service';
import { CreateMovimientoDto, MovimientoFiltersDto } from '../../../core/application/dto/movimiento-inventario';
import { CurrentUser, UserPayload } from '../decorators/current-user.decorator';

@ApiTags('Movimientos de Inventario')
@Controller('movimientos-inventario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MovimientoInventarioController {
  constructor(private readonly movimientoService: MovimientoInventarioService) {}

  private getEmpresaId(user: UserPayload): string {
    if (!user.empresaId) {
      throw new ForbiddenException('Usuario sin empresa asignada');
    }
    return user.empresaId;
  }

  /**
   * GET /movimientos-inventario - Listar movimientos con filtros
   */
  @Get()
  @ApiOperation({ summary: 'Listar movimientos de inventario con filtros' })
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query() filters: MovimientoFiltersDto,
  ) {
    return this.movimientoService.findAll(this.getEmpresaId(user), filters);
  }

  /**
   * GET /movimientos-inventario/resumen - Resumen de movimientos
   */
  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen de movimientos por tipo' })
  async getResumen(
    @CurrentUser() user: UserPayload,
    @Query('sucursalId') sucursalId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.movimientoService.getResumen(
      this.getEmpresaId(user),
      sucursalId ?? user.sucursalId ?? undefined,
      fechaDesde,
      fechaHasta,
    );
  }

  /**
   * GET /movimientos-inventario/kardex/:varianteId - Kardex de variante
   */
  @Get('kardex/:varianteId')
  @ApiOperation({ summary: 'Obtener kardex (historial) de una variante' })
  async getKardex(
    @CurrentUser() user: UserPayload,
    @Param('varianteId', ParseUUIDPipe) varianteId: string,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.movimientoService.getKardex(
      this.getEmpresaId(user),
      varianteId,
      sucursalId ?? user.sucursalId ?? undefined,
    );
  }

  /**
   * GET /movimientos-inventario/:id - Obtener movimiento por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un movimiento' })
  async findOne(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.movimientoService.findOne(this.getEmpresaId(user), id);
  }

  /**
   * POST /movimientos-inventario - Crear movimiento
   */
  @Post()
  @ApiOperation({ summary: 'Crear nuevo movimiento de inventario' })
  async create(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateMovimientoDto,
  ) {
    return this.movimientoService.create(this.getEmpresaId(user), dto, user.id);
  }

  /**
   * POST /movimientos-inventario/traspaso - Crear traspaso entre sucursales
   */
  @Post('traspaso')
  @ApiOperation({ summary: 'Crear traspaso entre sucursales' })
  async createTraspaso(
    @CurrentUser() user: UserPayload,
    @Body() dto: {
      varianteId: string;
      sucursalOrigenId: string;
      sucursalDestinoId: string;
      cantidad: number;
      loteId?: string;
      notas?: string;
    },
  ) {
    return this.movimientoService.createTraspaso(this.getEmpresaId(user), dto, user.id);
  }
}
