/**
 * @file alerta-inventario.service.ts
 * @description Servicio para alertas de inventario (stock bajo, próximos a vencer)
 *
 * @references
 * - BD: ver docs/arquitectura/03-BASE-DATOS-COMPLETA.md
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: INVENTARIO)
 * - FEFO: ver docs/arquitectura/20-LOTES-FEFO.md
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';

const CACHE_TTL = {
  ALERTAS: 300, // 5 minutos
};

export interface AlertaStockBajo {
  id: string;
  producto: {
    id: string;
    nombre: string;
  };
  variante: {
    id: string;
    sku: string;
    nombre: string | null;
  };
  sucursal: {
    id: string;
    nombre: string;
  };
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  diferencia: number;
  urgencia: 'critico' | 'bajo' | 'normal';
}

export interface AlertaVencimiento {
  id: string;
  codigoLote: string;
  producto: {
    id: string;
    nombre: string;
  };
  variante: {
    id: string;
    sku: string;
  };
  sucursal: {
    id: string;
    nombre: string;
  };
  fechaVencimiento: Date;
  diasRestantes: number;
  stock: number;
  urgencia: 'vencido' | 'critico' | 'alerta' | 'proximo';
}

@Injectable()
export class AlertaInventarioService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Obtener alertas de stock bajo
   */
  async getAlertasStockBajo(empresaId: string, sucursalId?: string): Promise<AlertaStockBajo[]> {
    const cacheKey = `empresa_${empresaId}:alertas:stock_bajo:${sucursalId || 'all'}`;

    // Buscar en cache
    const cached = await this.redis.get<AlertaStockBajo[]>(cacheKey);
    if (cached) return cached;

    // Consultar stock por sucursal con niveles mínimos
    // stockMinimo y stockMaximo están en StockSucursal, no en Variante
    const stockItems = await this.prisma.stockSucursal.findMany({
      where: {
        sucursal: {
          empresaId,
          ...(sucursalId && { id: sucursalId }),
          activo: true,
        },
        variante: {
          activo: true,
          producto: {
            activo: true,
          },
        },
      },
      include: {
        variante: {
          select: {
            id: true,
            sku: true,
            nombreVariante: true,
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Filtrar items con stock bajo (stockMinimo está en StockSucursal)
    const alertas: AlertaStockBajo[] = stockItems
      .filter((item) => {
        return item.stockMinimo > 0 && item.stock <= item.stockMinimo;
      })
      .map((item) => {
        const diferencia = item.stockMinimo - item.stock;

        // Determinar urgencia
        let urgencia: 'critico' | 'bajo' | 'normal' = 'normal';
        if (item.stock === 0) {
          urgencia = 'critico';
        } else if (item.stock <= item.stockMinimo * 0.5) {
          urgencia = 'critico';
        } else if (item.stock <= item.stockMinimo) {
          urgencia = 'bajo';
        }

        return {
          id: `${item.varianteId}-${item.sucursalId}`,
          producto: item.variante.producto,
          variante: {
            id: item.variante.id,
            sku: item.variante.sku,
            nombre: item.variante.nombreVariante || item.variante.sku,
          },
          sucursal: item.sucursal,
          stockActual: item.stock,
          stockMinimo: item.stockMinimo,
          stockMaximo: item.stockMaximo || 0,
          diferencia,
          urgencia,
        };
      })
      .sort((a, b) => {
        // Ordenar por urgencia (crítico primero) y luego por diferencia
        const urgenciaOrder: Record<string, number> = { critico: 0, bajo: 1, normal: 2 };
        if (urgenciaOrder[a.urgencia] !== urgenciaOrder[b.urgencia]) {
          return urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
        }
        return b.diferencia - a.diferencia;
      });

    // Guardar en cache
    await this.redis.set(cacheKey, alertas, CACHE_TTL.ALERTAS);

    return alertas;
  }

  /**
   * Obtener alertas de productos próximos a vencer
   */
  async getAlertasVencimiento(
    empresaId: string,
    sucursalId?: string,
    diasAlerta: number = 30,
  ): Promise<AlertaVencimiento[]> {
    const cacheKey = `empresa_${empresaId}:alertas:vencimiento:${sucursalId || 'all'}:${diasAlerta}`;

    // Buscar en cache
    const cached = await this.redis.get<AlertaVencimiento[]>(cacheKey);
    if (cached) return cached;

    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAlerta);

    // Consultar lotes con fecha de vencimiento próxima
    const lotes = await this.prisma.lote.findMany({
      where: {
        empresaId,
        ...(sucursalId && { sucursalId }),
        estado: { in: ['disponible', 'activo', 'alerta'] },
        stock: { gt: 0 },
        fechaVencimiento: {
          not: null,
          lte: fechaLimite,
        },
      },
      include: {
        variante: {
          select: {
            id: true,
            sku: true,
            producto: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        sucursal: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    const alertas: AlertaVencimiento[] = lotes
      .filter((lote) => lote.fechaVencimiento !== null)
      .map((lote) => {
        const fechaVencimiento = lote.fechaVencimiento as Date;
        const diasRestantes = Math.ceil(
          (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Determinar urgencia
        let urgencia: 'vencido' | 'critico' | 'alerta' | 'proximo' = 'proximo';
        if (diasRestantes <= 0) {
          urgencia = 'vencido';
        } else if (diasRestantes <= 7) {
          urgencia = 'critico';
        } else if (diasRestantes <= 15) {
          urgencia = 'alerta';
        }

        return {
          id: lote.id,
          codigoLote: lote.codigoLote,
          producto: lote.variante.producto,
          variante: {
            id: lote.variante.id,
            sku: lote.variante.sku,
          },
          sucursal: lote.sucursal,
          fechaVencimiento,
          diasRestantes,
          stock: lote.stock,
          urgencia,
        };
      });

    // Guardar en cache
    await this.redis.set(cacheKey, alertas, CACHE_TTL.ALERTAS);

    return alertas;
  }

  /**
   * Obtener resumen de alertas (contadores)
   */
  async getResumenAlertas(empresaId: string, sucursalId?: string) {
    const [stockBajo, vencimientos] = await Promise.all([
      this.getAlertasStockBajo(empresaId, sucursalId),
      this.getAlertasVencimiento(empresaId, sucursalId, 30),
    ]);

    return {
      stockBajo: {
        total: stockBajo.length,
        criticos: stockBajo.filter((a) => a.urgencia === 'critico').length,
        bajos: stockBajo.filter((a) => a.urgencia === 'bajo').length,
      },
      vencimientos: {
        total: vencimientos.length,
        vencidos: vencimientos.filter((a) => a.urgencia === 'vencido').length,
        criticos: vencimientos.filter((a) => a.urgencia === 'critico').length,
        alertas: vencimientos.filter((a) => a.urgencia === 'alerta').length,
        proximos: vencimientos.filter((a) => a.urgencia === 'proximo').length,
      },
      totalAlertas: stockBajo.length + vencimientos.length,
    };
  }

  /**
   * Obtener productos sin movimiento (estancados)
   */
  async getProductosEstancados(
    empresaId: string,
    sucursalId?: string,
    diasSinMovimiento: number = 30,
  ) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasSinMovimiento);

    // Obtener variantes con stock
    const variantes = await this.prisma.variante.findMany({
      where: {
        producto: {
          empresaId,
          activo: true,
        },
        activo: true,
        stock: { gt: 0 },
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
          },
        },
        stockSucursal: {
          where: {
            ...(sucursalId && { sucursalId }),
            stock: { gt: 0 },
          },
          include: {
            sucursal: {
              select: { id: true, nombre: true },
            },
          },
        },
        movimientosInventario: {
          where: {
            createdAt: { gte: fechaLimite },
            ...(sucursalId && { sucursalId }),
          },
          take: 1,
        },
      },
    });

    // Filtrar solo los que no tienen movimientos recientes
    return variantes
      .filter((v) => v.movimientosInventario.length === 0)
      .map((v) => ({
        producto: v.producto,
        variante: {
          id: v.id,
          sku: v.sku,
          nombre: v.nombreVariante || v.sku,
        },
        stockTotal: v.stock,
        stockPorSucursal: v.stockSucursal.map((ss) => ({
          sucursal: ss.sucursal,
          stock: ss.stock,
        })),
        diasSinMovimiento,
      }));
  }
}
