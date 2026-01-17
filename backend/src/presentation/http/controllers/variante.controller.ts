/**
 * @file variante.controller.ts
 * @description Controlador REST para variantes de productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: variantes)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS - Variantes)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { VarianteService } from '../../../core/application/services/variante.service';
import { ProductoService } from '../../../core/application/services/producto.service';
import {
  CreateVarianteDto,
  UpdateVarianteDto,
} from '../../../core/application/dto/variante';

// Tipo local con empresaId garantizado (TenantGuard valida esto)
interface UserWithEmpresa {
  id: string;
  email: string;
  empresaId: string;
  sucursalId: string | null;
  rol: string;
  permisos: string[];
}

const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Este producto no existe',
  VARIANT_NOT_FOUND: 'Esta variante no existe',
  VARIANT_CREATE_ERROR: 'No se pudo crear la variante. Intenta de nuevo',
  VARIANT_UPDATE_ERROR: 'No se pudo actualizar la variante. Intenta de nuevo',
  VARIANT_DELETE_ERROR: 'No se pudo eliminar la variante. Intenta de nuevo',
  UNAUTHORIZED: 'No tienes permiso para esta operación',
};

@Controller('productos/:productoId/variantes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class VarianteController {
  constructor(
    private readonly varianteService: VarianteService,
    private readonly productoService: ProductoService,
  ) {}

  /**
   * GET /productos/:productoId/variantes
   * Listar variantes de un producto
   */
  @Get()
  @Permissions('productos.ver')
  async findAll(
    @CurrentUser() user: UserWithEmpresa,
    @Param('productoId', ParseUUIDPipe) productoId: string,
  ) {
    // Verificar que el producto existe y pertenece a la empresa
    const producto = await this.productoService.findById(
      user.empresaId,
      productoId,
    );
    if (!producto) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const variantes = await this.varianteService.findByProductoId(productoId);

    return {
      success: true,
      data: variantes.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        codigoBarras: v.codigoBarras,
        nombre: v.nombre,
        precioCompra: v.precioCompra,
        precioVenta: v.precioVenta,
        imagen: v.imagen,
        stock: v.stock,
        activo: v.activo,
        valores: v.valores.map((vv: any) => ({
          atributo: vv.valorAtributo.atributo.nombre,
          valor: vv.valorAtributo.valor,
          codigoColor: vv.valorAtributo.codigoColor,
        })),
      })),
    };
  }

  /**
   * GET /productos/:productoId/variantes/:id
   * Obtener variante por ID
   */
  @Get(':id')
  @Permissions('productos.ver')
  async findOne(
    @CurrentUser() user: UserWithEmpresa,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const variante = await this.varianteService.findById(id);

    if (!variante) {
      throw new NotFoundException(ERROR_MESSAGES.VARIANT_NOT_FOUND);
    }

    // Verificar que pertenece a la empresa
    if (variante.producto.empresaId !== user.empresaId) {
      throw new ForbiddenException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    return {
      success: true,
      data: variante,
    };
  }

  /**
   * POST /productos/:productoId/variantes
   * Crear variante
   */
  @Post()
  @Permissions('productos.crear')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserWithEmpresa,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Body() dto: CreateVarianteDto,
  ) {
    // Verificar que el producto existe y pertenece a la empresa
    const producto = await this.productoService.findById(
      user.empresaId,
      productoId,
    );
    if (!producto) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    try {
      const variante = await this.varianteService.create(
        user.empresaId,
        productoId,
        {
          sku: dto.sku,
          codigoBarras: dto.codigoBarras,
          nombreVariante: dto.nombreVariante,
          precioCompra: dto.precioCompra,
          precioVenta: dto.precioVenta,
          imagen: dto.imagen,
          stock: dto.stock,
          activo: dto.activo,
          valoresAtributoIds: dto.valoresAtributoIds,
        },
      );

      return {
        success: true,
        message: 'Variante creada correctamente',
        data: variante,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Ya existe una variante con ese SKU');
      }
      throw new BadRequestException(ERROR_MESSAGES.VARIANT_CREATE_ERROR);
    }
  }

  /**
   * PUT /productos/:productoId/variantes/:id
   * Actualizar variante
   */
  @Put(':id')
  @Permissions('productos.editar')
  async update(
    @CurrentUser() user: UserWithEmpresa,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVarianteDto,
  ) {
    try {
      const updated = await this.varianteService.update(user.empresaId, id, {
        sku: dto.sku,
        codigoBarras: dto.codigoBarras,
        nombre: dto.nombreVariante,
        precioCompra: dto.precioCompra,
        precioVenta: dto.precioVenta,
        imagen: dto.imagen,
        stock: dto.stock,
        activo: dto.activo,
        valoresAtributoIds: dto.valoresAtributoIds,
      });

      return {
        success: true,
        message: 'Variante actualizada correctamente',
        data: updated,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Ya existe una variante con ese SKU');
      }
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.VARIANT_UPDATE_ERROR);
    }
  }

  /**
   * DELETE /productos/:productoId/variantes/:id
   * Eliminar variante (soft delete)
   */
  @Delete(':id')
  @Permissions('productos.eliminar')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() user: UserWithEmpresa,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      await this.varianteService.delete(user.empresaId, id);

      return {
        success: true,
        message: 'Variante eliminada correctamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.VARIANT_DELETE_ERROR);
    }
  }
}
