/**
 * @file empresa.service.ts
 * @description Servicio para gestion de empresas (tenant)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md (tabla: empresas)
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (seccion: EMPRESAS)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { ERROR_MESSAGES } from '../../../shared/constants/error-messages';
import {
  UpdateEmpresaDto,
  UpdateEmpresaConfigDto,
  UpdateEmpresaBrandingDto,
} from '../dto/empresa';

const CACHE_TTL = 3600; // 1 hora
const CACHE_PREFIX = 'empresa';

@Injectable()
export class EmpresaService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /empresas/me - Obtener mi empresa
   */
  async getMyEmpresa(empresaId: string) {
    // 1. Buscar en cache
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:info`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    // 2. Buscar en BD
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        codigo: true,
        nombreComercial: true,
        razonSocial: true,
        ruc: true,
        email: true,
        telefono: true,
        whatsapp: true,
        direccionFiscal: true,
        logo: true,
        logoSecundario: true,
        favicon: true,
        colorPrimario: true,
        colorSecundario: true,
        slogan: true,
        pais: true,
        moneda: true,
        simboloMoneda: true,
        zonaHoraria: true,
        formatoFecha: true,
        idioma: true,
        aplicaImpuesto: true,
        porcentajeImpuesto: true,
        nombreImpuesto: true,
        precioIncluyeImpuesto: true,
        plan: true,
        fechaInicioPlan: true,
        fechaVencimientoPlan: true,
        maxSucursales: true,
        maxUsuarios: true,
        maxProductos: true,
        addonFacturacion: true,
        addonEcommerce: true,
        addonMultialmacen: true,
        subdominio: true,
        dominioPersonalizado: true,
        estado: true,
        activo: true,
        createdAt: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    // 3. Guardar en cache
    await this.redis.set(cacheKey, empresa, CACHE_TTL);

    return { success: true, data: empresa };
  }

  /**
   * PUT /empresas/me - Actualizar mi empresa
   */
  async updateMyEmpresa(empresaId: string, dto: UpdateEmpresaDto) {
    // 1. Verificar que existe
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    // 2. Actualizar
    const updated = await this.prisma.empresa.update({
      where: { id: empresaId },
      data: {
        ...(dto.nombreComercial && { nombreComercial: dto.nombreComercial }),
        ...(dto.razonSocial && { razonSocial: dto.razonSocial }),
        ...(dto.ruc && { ruc: dto.ruc }),
        ...(dto.email && { email: dto.email }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
        ...(dto.direccionFiscal !== undefined && { direccionFiscal: dto.direccionFiscal }),
        ...(dto.slogan !== undefined && { slogan: dto.slogan }),
      },
    });

    // 3. Invalidar cache
    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Empresa actualizada correctamente',
    };
  }

  /**
   * GET /empresas/me/config - Obtener configuracion
   */
  async getConfig(empresaId: string) {
    const cacheKey = `${CACHE_PREFIX}:${empresaId}:config`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        pais: true,
        moneda: true,
        simboloMoneda: true,
        zonaHoraria: true,
        formatoFecha: true,
        idioma: true,
        aplicaImpuesto: true,
        porcentajeImpuesto: true,
        nombreImpuesto: true,
        precioIncluyeImpuesto: true,
      },
    });

    if (!empresa) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    await this.redis.set(cacheKey, empresa, CACHE_TTL);

    return { success: true, data: empresa };
  }

  /**
   * PUT /empresas/me/config - Actualizar configuracion
   */
  async updateConfig(empresaId: string, dto: UpdateEmpresaConfigDto) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    const updated = await this.prisma.empresa.update({
      where: { id: empresaId },
      data: {
        ...(dto.pais && { pais: dto.pais }),
        ...(dto.moneda && { moneda: dto.moneda }),
        ...(dto.simboloMoneda && { simboloMoneda: dto.simboloMoneda }),
        ...(dto.zonaHoraria && { zonaHoraria: dto.zonaHoraria }),
        ...(dto.formatoFecha && { formatoFecha: dto.formatoFecha }),
        ...(dto.idioma && { idioma: dto.idioma }),
        ...(dto.aplicaImpuesto !== undefined && { aplicaImpuesto: dto.aplicaImpuesto }),
        ...(dto.porcentajeImpuesto !== undefined && { porcentajeImpuesto: dto.porcentajeImpuesto }),
        ...(dto.nombreImpuesto && { nombreImpuesto: dto.nombreImpuesto }),
        ...(dto.precioIncluyeImpuesto !== undefined && { precioIncluyeImpuesto: dto.precioIncluyeImpuesto }),
      },
      select: {
        pais: true,
        moneda: true,
        simboloMoneda: true,
        zonaHoraria: true,
        formatoFecha: true,
        idioma: true,
        aplicaImpuesto: true,
        porcentajeImpuesto: true,
        nombreImpuesto: true,
        precioIncluyeImpuesto: true,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Configuracion actualizada correctamente',
    };
  }

  /**
   * PUT /empresas/me/branding - Actualizar branding
   */
  async updateBranding(empresaId: string, dto: UpdateEmpresaBrandingDto) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (!empresa) {
      throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
    }

    const updated = await this.prisma.empresa.update({
      where: { id: empresaId },
      data: {
        ...(dto.colorPrimario && { colorPrimario: dto.colorPrimario }),
        ...(dto.colorSecundario && { colorSecundario: dto.colorSecundario }),
      },
      select: {
        colorPrimario: true,
        colorSecundario: true,
        logo: true,
        logoSecundario: true,
        favicon: true,
      },
    });

    await this.invalidateCache(empresaId);

    return {
      success: true,
      data: updated,
      message: 'Colores actualizados correctamente',
    };
  }

  /**
   * Invalidar cache de empresa
   */
  private async invalidateCache(empresaId: string) {
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:info`);
    await this.redis.del(`${CACHE_PREFIX}:${empresaId}:config`);
  }
}
