/**
 * @file producto.controller.ts
 * @description Controlador REST para productos
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: productos, variantes)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: PRODUCTOS)
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { ProductoService } from '../../../core/application/services/producto.service';
import {
  CreateProductoDto,
  UpdateProductoDto,
  ListarProductosQueryDto,
} from '../../../core/application/dto/producto';
import { UpdateVarianteRapidoDto } from '../../../core/application/dto/variante';

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
  PRODUCT_CREATE_ERROR: 'No se pudo crear el producto. Intenta de nuevo',
  PRODUCT_UPDATE_ERROR: 'No se pudo actualizar el producto. Intenta de nuevo',
  PRODUCT_DELETE_ERROR: 'No se pudo eliminar el producto. Intenta de nuevo',
  BARCODE_NOT_FOUND: 'No encontramos un producto con ese codigo',
};

@Controller('productos')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  /**
   * GET /productos
   * Listar productos con filtros y paginación
   */
  @Get()
  @Permissions('productos.ver')
  async findAll(
    @CurrentUser() user: UserWithEmpresa,
    @Query() query: ListarProductosQueryDto,
  ) {
    const result = await this.productoService.findAll(user.empresaId, {
      search: query.search,
      categoriaId: query.categoriaId,
      marcaId: query.marcaId,
      tipo: query.tipo,
      activo: query.activo,
      stockBajo: query.stockBajo,
      visiblePos: query.visiblePos,
      visibleWeb: query.visibleWeb,
      page: query.page,
      limit: query.limit,
      orden: query.orden,
      direccion: query.direccion,
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * GET /productos/buscar
   * Buscar productos por nombre, código o SKU
   */
  @Get('buscar')
  @Permissions('productos.ver')
  async search(
    @CurrentUser() user: UserWithEmpresa,
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ) {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const result = await this.productoService.findAll(user.empresaId, {
      search: query.trim(),
      activo: true,
      limit: limit,
    });

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * GET /productos/barcode/:codigo
   * Buscar producto por código de barras
   */
  @Get('barcode/:codigo')
  @Permissions('productos.ver')
  async findByBarcode(
    @CurrentUser() user: UserWithEmpresa,
    @Param('codigo') codigo: string,
  ) {
    const result = await this.productoService.findByBarcode(
      user.empresaId,
      codigo,
    );

    if (!result) {
      throw new NotFoundException(ERROR_MESSAGES.BARCODE_NOT_FOUND);
    }

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /productos/:id/variantes
   * Obtener variantes de un producto
   * IMPORTANTE: Esta ruta debe estar ANTES de GET /productos/:id
   */
  @Get(':id/variantes')
  @Permissions('productos.ver')
  async findVariantes(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const variantes = await this.productoService.findVariantes(
      user.empresaId,
      id,
    );

    return {
      success: true,
      data: variantes,
    };
  }

  /**
   * PUT /productos/:id/variantes/:varianteId
   * Actualizar una variante
   * IMPORTANTE: Esta ruta debe estar ANTES de PUT /productos/:id
   */
  @Put(':id/variantes/:varianteId')
  @Permissions('productos.editar')
  async updateVariante(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('varianteId', ParseUUIDPipe) varianteId: string,
    @Body() dto: UpdateVarianteRapidoDto,
  ) {
    try {
      const variante = await this.productoService.updateVariante(
        user.empresaId,
        id,
        varianteId,
        dto,
      );

      return {
        success: true,
        message: 'Variante actualizada correctamente',
        data: variante,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('No se pudo actualizar la variante');
    }
  }

  /**
   * GET /productos/:id
   * Obtener producto completo con variantes
   */
  @Get(':id')
  @Permissions('productos.ver')
  async findOne(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const producto = await this.productoService.findById(user.empresaId, id);

    if (!producto) {
      throw new NotFoundException(ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    return {
      success: true,
      data: producto,
    };
  }

  /**
   * POST /productos
   * Crear producto
   */
  @Post()
  @Permissions('productos.crear')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserWithEmpresa,
    @Body() dto: CreateProductoDto,
  ) {
    try {
      const producto = await this.productoService.create(user.empresaId, {
        categoriaId: dto.categoriaId,
        marcaId: dto.marcaId,
        unidadMedidaId: dto.unidadMedidaId,
        atributoImagenId: dto.atributoImagenId,
        codigoInterno: dto.codigoInterno,
        sku: dto.sku,
        codigoBarras: dto.codigoBarras,
        nombre: dto.nombre,
        descripcionCorta: dto.descripcionCorta,
        descripcionLarga: dto.descripcionLarga,
        tipo: dto.tipo || 'simple',
        precioCompra: dto.precioCompra,
        precioVenta: dto.precioVenta,
        precioMayorista: dto.precioMayorista,
        cantidadMinimaMayorista: dto.cantidadMinimaMayorista,
        precioOferta: dto.precioOferta,
        descuentoPorcentaje: dto.descuentoPorcentaje,
        ofertaDesde: dto.ofertaDesde,
        ofertaHasta: dto.ofertaHasta,
        aplicaImpuesto: dto.aplicaImpuesto,
        manejaStock: dto.manejaStock,
        stock: dto.stock,
        stockMinimo: dto.stockMinimo,
        stockMaximo: dto.stockMaximo,
        imagenPrincipal: dto.imagenPrincipal,
        activo: dto.activo,
        visiblePos: dto.visiblePos,
        visibleWeb: dto.visibleWeb,
        destacado: dto.destacado,
        nuevo: dto.nuevo,
        metaTitulo: dto.metaTitulo,
        metaDescripcion: dto.metaDescripcion,
        peso: dto.peso,
        largo: dto.largo,
        ancho: dto.ancho,
        alto: dto.alto,
        createdBy: user.id,
        variantes: dto.variantes,
      });

      return {
        success: true,
        message: 'Producto creado correctamente',
        data: producto,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Ya existe un producto con ese codigo o SKU',
        );
      }
      throw new BadRequestException(ERROR_MESSAGES.PRODUCT_CREATE_ERROR);
    }
  }

  /**
   * PUT /productos/:id
   * Actualizar producto
   */
  @Put(':id')
  @Permissions('productos.editar')
  async update(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductoDto,
  ) {
    try {
      const producto = await this.productoService.update(
        user.empresaId,
        id,
        {
          categoriaId: dto.categoriaId,
          marcaId: dto.marcaId,
          unidadMedidaId: dto.unidadMedidaId,
          atributoImagenId: dto.atributoImagenId,
          codigoInterno: dto.codigoInterno,
          sku: dto.sku,
          codigoBarras: dto.codigoBarras,
          nombre: dto.nombre,
          descripcionCorta: dto.descripcionCorta,
          descripcionLarga: dto.descripcionLarga,
          tipo: dto.tipo,
          precioCompra: dto.precioCompra,
          precioVenta: dto.precioVenta,
          precioMayorista: dto.precioMayorista,
          cantidadMinimaMayorista: dto.cantidadMinimaMayorista,
          precioOferta: dto.precioOferta,
          descuentoPorcentaje: dto.descuentoPorcentaje,
          ofertaDesde: dto.ofertaDesde,
          ofertaHasta: dto.ofertaHasta,
          aplicaImpuesto: dto.aplicaImpuesto,
          manejaStock: dto.manejaStock,
          stock: dto.stock,
          stockMinimo: dto.stockMinimo,
          stockMaximo: dto.stockMaximo,
          imagenPrincipal: dto.imagenPrincipal,
          activo: dto.activo,
          visiblePos: dto.visiblePos,
          visibleWeb: dto.visibleWeb,
          destacado: dto.destacado,
          nuevo: dto.nuevo,
          metaTitulo: dto.metaTitulo,
          metaDescripcion: dto.metaDescripcion,
          peso: dto.peso,
          largo: dto.largo,
          ancho: dto.ancho,
          alto: dto.alto,
        },
      );

      return {
        success: true,
        message: 'Producto actualizado correctamente',
        data: producto,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Ya existe un producto con ese codigo o SKU',
        );
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.PRODUCT_UPDATE_ERROR);
    }
  }

  /**
   * DELETE /productos/:id
   * Eliminar producto (soft delete)
   */
  @Delete(':id')
  @Permissions('productos.eliminar')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() user: UserWithEmpresa,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    try {
      await this.productoService.delete(user.empresaId, id);

      return {
        success: true,
        message: 'Producto eliminado correctamente',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(ERROR_MESSAGES.PRODUCT_DELETE_ERROR);
    }
  }
}
