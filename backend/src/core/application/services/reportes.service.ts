/**
 * @file reportes.service.ts
 * @description Servicio para generación de reportes
 *
 * @references
 * - Endpoints: ver docs/arquitectura/06-API-ENDPOINTS.md (sección: REPORTES)
 * - Cache: ver docs/arquitectura/05-REDIS-CACHE.md
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import {
  ReporteVentasFiltersDto,
  ReporteProductosFiltersDto,
  ReporteInventarioFiltersDto,
  ReporteCajaFiltersDto,
  ReporteClientesFiltersDto,
  ReporteDashboardFiltersDto,
  AgruparPor,
} from '../dto/reportes';

const CACHE_TTL = 300; // 5 minutos
const CACHE_PREFIX = 'reportes';

@Injectable()
export class ReportesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * GET /reportes/ventas - Reporte completo de ventas
   */
  async getReporteVentas(empresaId: string, filters: ReporteVentasFiltersDto) {
    const { fechaInicio, fechaFin, sucursalId, agruparPor } = filters;

    // Fechas por defecto: último mes
    const fechaInicioDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();
    fechaFinDate.setHours(23, 59, 59, 999);

    const where: any = {
      empresaId,
      estado: 'completada',
      createdAt: {
        gte: fechaInicioDate,
        lte: fechaFinDate,
      },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    // Obtener ventas con detalles
    const ventas = await this.prisma.venta.findMany({
      where,
      include: {
        detalles: {
          include: {
            variante: {
              select: {
                id: true,
                precioCompra: true,
                producto: {
                  select: {
                    categoriaId: true,
                    categoria: { select: { nombre: true } },
                  },
                },
              },
            },
          },
        },
        pagos: {
          include: {
            metodoPago: { select: { nombre: true, tipo: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calcular resumen
    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const cantidadVentas = ventas.length;
    const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
    const totalDescuentos = ventas.reduce((sum, v) => sum + Number(v.descuento), 0);

    // Calcular costo total y margen
    let costoTotal = 0;
    for (const venta of ventas) {
      for (const detalle of venta.detalles) {
        const precioCompra = Number(detalle.variante?.precioCompra || 0);
        costoTotal += precioCompra * detalle.cantidad;
      }
    }
    const margenBruto = totalVentas - costoTotal;
    const margenPorcentaje = totalVentas > 0 ? (margenBruto / totalVentas) * 100 : 0;

    // Agrupar por periodo
    const porPeriodo = this.agruparVentasPorPeriodo(ventas, agruparPor || AgruparPor.DIA);

    // Agrupar por categoría
    const porCategoria = this.agruparVentasPorCategoria(ventas);

    // Agrupar por método de pago
    const porMetodoPago = this.agruparVentasPorMetodoPago(ventas, totalVentas);

    return {
      success: true,
      data: {
        resumen: {
          totalVentas,
          cantidadVentas,
          ticketPromedio: Math.round(ticketPromedio * 100) / 100,
          totalDescuentos,
          margenBruto: Math.round(margenBruto * 100) / 100,
          margenPorcentaje: Math.round(margenPorcentaje * 10) / 10,
        },
        porPeriodo,
        porCategoria,
        porMetodoPago,
      },
    };
  }

  /**
   * GET /reportes/ventas/diario - Ventas del día actual
   */
  async getVentasDiario(empresaId: string, sucursalId?: string) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const where: any = {
      empresaId,
      estado: 'completada',
      createdAt: { gte: hoy },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const ventas = await this.prisma.venta.findMany({
      where,
      include: {
        usuario: { select: { nombre: true } },
        cliente: { select: { nombre: true } },
        detalles: { select: { cantidad: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const cantidadVentas = ventas.length;
    const totalItems = ventas.reduce(
      (sum, v) => sum + v.detalles.reduce((s, d) => s + d.cantidad, 0),
      0,
    );

    return {
      success: true,
      data: {
        fecha: hoy.toISOString().split('T')[0],
        totalVentas,
        cantidadVentas,
        totalItems,
        ticketPromedio: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0,
        ventas: ventas.map((v) => ({
          id: v.id,
          numeroVenta: v.numeroVenta,
          hora: v.createdAt,
          usuario: v.usuario?.nombre,
          cliente: v.cliente?.nombre || 'Público general',
          items: v.detalles.reduce((s, d) => s + d.cantidad, 0),
          total: v.total,
        })),
      },
    };
  }

  /**
   * GET /reportes/productos/mas-vendidos - Top productos
   */
  async getProductosMasVendidos(empresaId: string, filters: ReporteProductosFiltersDto) {
    const { fechaInicio, fechaFin, sucursalId, categoriaId, limit = 10 } = filters;

    // Fechas por defecto: último mes
    const fechaInicioDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();
    fechaFinDate.setHours(23, 59, 59, 999);

    const whereVenta: any = {
      empresaId,
      estado: 'completada',
      createdAt: {
        gte: fechaInicioDate,
        lte: fechaFinDate,
      },
    };

    if (sucursalId) {
      whereVenta.sucursalId = sucursalId;
    }

    // Obtener detalles de ventas agrupados por variante
    const ventasDetalles = await this.prisma.ventaDetalle.findMany({
      where: {
        venta: whereVenta,
        ...(categoriaId && {
          variante: {
            producto: { categoriaId },
          },
        }),
      },
      include: {
        variante: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                imagenPrincipal: true,
                categoria: { select: { nombre: true } },
              },
            },
          },
        },
      },
    });

    // Agrupar por producto
    const productosMap = new Map<string, {
      id: string;
      nombre: string;
      imagen: string | null;
      categoria: string;
      cantidad: number;
      monto: number;
    }>();

    for (const detalle of ventasDetalles) {
      const producto = detalle.variante.producto;
      const key = producto.id;

      if (productosMap.has(key)) {
        const existing = productosMap.get(key)!;
        existing.cantidad += detalle.cantidad;
        existing.monto += Number(detalle.subtotal);
      } else {
        productosMap.set(key, {
          id: producto.id,
          nombre: producto.nombre,
          imagen: producto.imagenPrincipal,
          categoria: producto.categoria?.nombre || 'Sin categoría',
          cantidad: detalle.cantidad,
          monto: Number(detalle.subtotal),
        });
      }
    }

    // Ordenar por cantidad vendida
    const productos = Array.from(productosMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);

    return {
      success: true,
      data: productos,
    };
  }

  /**
   * GET /reportes/productos/sin-rotacion - Productos sin movimiento
   */
  async getProductosSinRotacion(empresaId: string, filters: ReporteProductosFiltersDto) {
    const { fechaInicio, sucursalId, categoriaId, limit = 20 } = filters;

    // Por defecto: productos sin venta en los últimos 30 días
    const fechaLimite = fechaInicio
      ? new Date(fechaInicio)
      : new Date(new Date().setDate(new Date().getDate() - 30));

    // Obtener IDs de variantes vendidas en el periodo
    const ventasRecientes = await this.prisma.ventaDetalle.findMany({
      where: {
        venta: {
          empresaId,
          estado: 'completada',
          createdAt: { gte: fechaLimite },
          ...(sucursalId && { sucursalId }),
        },
      },
      select: { varianteId: true },
      distinct: ['varianteId'],
    });

    const variantesVendidas = new Set(ventasRecientes.map((v) => v.varianteId));

    // Obtener productos con stock que no se han vendido
    const whereProducto: any = {
      empresaId,
      activo: true,
    };

    if (categoriaId) {
      whereProducto.categoriaId = categoriaId;
    }

    const productos = await this.prisma.producto.findMany({
      where: whereProducto,
      include: {
        variantes: {
          where: {
            id: { notIn: Array.from(variantesVendidas) },
            stock: { gt: 0 },
          },
          select: {
            id: true,
            sku: true,
            stock: true,
            precioVenta: true,
          },
        },
        categoria: { select: { nombre: true } },
      },
    });

    // Filtrar productos con variantes sin rotación
    const productosSinRotacion = productos
      .filter((p) => p.variantes.length > 0)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'Sin categoría',
        variantes: p.variantes.length,
        stockTotal: p.variantes.reduce((sum, v) => sum + v.stock, 0),
        valorInventario: p.variantes.reduce(
          (sum, v) => sum + v.stock * Number(v.precioVenta),
          0,
        ),
      }))
      .sort((a, b) => b.valorInventario - a.valorInventario)
      .slice(0, limit);

    return {
      success: true,
      data: productosSinRotacion,
    };
  }

  /**
   * GET /reportes/inventario/valorizado - Inventario valorizado
   */
  async getInventarioValorizado(empresaId: string, filters: ReporteInventarioFiltersDto) {
    const { sucursalId, categoriaId } = filters;

    const whereProducto: any = {
      empresaId,
      activo: true,
    };

    if (categoriaId) {
      whereProducto.categoriaId = categoriaId;
    }

    const productos = await this.prisma.producto.findMany({
      where: whereProducto,
      include: {
        variantes: true,
        categoria: { select: { nombre: true } },
      },
    });

    // Si hay sucursalId, obtener stock por sucursal
    let stockPorVariante = new Map<string, number>();
    if (sucursalId) {
      const stockSucursales = await this.prisma.stockSucursal.findMany({
        where: { sucursalId },
        select: { varianteId: true, stock: true },
      });
      for (const ss of stockSucursales) {
        stockPorVariante.set(ss.varianteId, ss.stock);
      }
    }

    let totalUnidades = 0;
    let valorTotal = 0;
    let valorCosto = 0;

    const porCategoria = new Map<string, { unidades: number; valor: number }>();

    for (const producto of productos) {
      for (const variante of producto.variantes) {
        const stock = sucursalId
          ? stockPorVariante.get(variante.id) || 0
          : variante.stock;

        totalUnidades += stock;
        const valorVenta = stock * Number(variante.precioVenta || 0);
        const valorCostoVariante = stock * Number(variante.precioCompra || 0);
        valorTotal += valorVenta;
        valorCosto += valorCostoVariante;

        const categoria = producto.categoria?.nombre || 'Sin categoría';
        if (porCategoria.has(categoria)) {
          const existing = porCategoria.get(categoria)!;
          existing.unidades += stock;
          existing.valor += valorVenta;
        } else {
          porCategoria.set(categoria, { unidades: stock, valor: valorVenta });
        }
      }
    }

    return {
      success: true,
      data: {
        resumen: {
          totalProductos: productos.length,
          totalUnidades,
          valorVenta: Math.round(valorTotal * 100) / 100,
          valorCosto: Math.round(valorCosto * 100) / 100,
          margenBruto: Math.round((valorTotal - valorCosto) * 100) / 100,
        },
        porCategoria: Array.from(porCategoria.entries())
          .map(([categoria, data]) => ({
            categoria,
            unidades: data.unidades,
            valor: Math.round(data.valor * 100) / 100,
            porcentaje: valorTotal > 0 ? Math.round((data.valor / valorTotal) * 100) : 0,
          }))
          .sort((a, b) => b.valor - a.valor),
      },
    };
  }

  /**
   * GET /reportes/caja/resumen - Resumen de cajas
   */
  async getResumenCajas(empresaId: string, filters: ReporteCajaFiltersDto) {
    const { fechaInicio, fechaFin, sucursalId, usuarioId } = filters;

    // Fechas por defecto: última semana
    const fechaInicioDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date(new Date().setDate(new Date().getDate() - 7));
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();
    fechaFinDate.setHours(23, 59, 59, 999);

    const where: any = {
      empresaId,
      createdAt: {
        gte: fechaInicioDate,
        lte: fechaFinDate,
      },
    };

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    if (usuarioId) {
      where.usuarioAperturaId = usuarioId;
    }

    const cajas = await this.prisma.caja.findMany({
      where,
      include: {
        usuarioApertura: { select: { nombre: true } },
        usuarioCierre: { select: { nombre: true } },
        sucursal: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const resumen = {
      totalCajas: cajas.length,
      cajasAbiertas: cajas.filter((c) => c.estado === 'abierta').length,
      cajasCerradas: cajas.filter((c) => c.estado === 'cerrada').length,
      totalVentas: cajas.reduce((sum, c) => sum + Number(c.montoVentas), 0),
      totalEfectivo: cajas.reduce((sum, c) => sum + Number(c.montoEfectivo), 0),
      totalTarjeta: cajas.reduce((sum, c) => sum + Number(c.montoTarjeta), 0),
      diferenciaTotal: cajas
        .filter((c) => c.estado === 'cerrada')
        .reduce((sum, c) => sum + Number(c.diferencia || 0), 0),
    };

    return {
      success: true,
      data: {
        resumen,
        cajas: cajas.map((c) => ({
          id: c.id,
          numero: c.numero,
          sucursal: c.sucursal?.nombre,
          usuarioApertura: c.usuarioApertura?.nombre,
          usuarioCierre: c.usuarioCierre?.nombre,
          fechaApertura: c.createdAt,
          fechaCierre: c.fechaCierre,
          estado: c.estado,
          montoApertura: c.montoApertura,
          montoVentas: c.montoVentas,
          diferencia: c.diferencia,
        })),
      },
    };
  }

  /**
   * GET /reportes/clientes/frecuentes - Top clientes
   */
  async getClientesFrecuentes(empresaId: string, filters: ReporteClientesFiltersDto) {
    const { fechaInicio, fechaFin, limit = 10 } = filters;

    // Fechas por defecto: último mes
    const fechaInicioDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const fechaFinDate = fechaFin ? new Date(fechaFin) : new Date();
    fechaFinDate.setHours(23, 59, 59, 999);

    // Agrupar ventas por cliente
    const ventasPorCliente = await this.prisma.venta.groupBy({
      by: ['clienteId'],
      where: {
        empresaId,
        estado: 'completada',
        clienteId: { not: null },
        createdAt: {
          gte: fechaInicioDate,
          lte: fechaFinDate,
        },
      },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
    });

    // Obtener datos de clientes
    const clienteIds = ventasPorCliente
      .map((v) => v.clienteId)
      .filter((id): id is string => id !== null);

    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
      },
    });

    const clientesMap = new Map(clientes.map((c) => [c.id, c]));

    return {
      success: true,
      data: ventasPorCliente.map((v, index) => {
        const cliente = clientesMap.get(v.clienteId!);
        return {
          posicion: index + 1,
          id: v.clienteId,
          nombre: cliente?.nombre || 'Cliente eliminado',
          email: cliente?.email,
          telefono: cliente?.telefono,
          compras: v._count.id,
          totalGastado: Number(v._sum.total) || 0,
        };
      }),
    };
  }

  /**
   * GET /reportes/dashboard - KPIs para dashboard
   */
  async getDashboard(empresaId: string, filters: ReporteDashboardFiltersDto) {
    const { sucursalId } = filters;

    // Cache key con TTL 30s: la mayoría de hits regresan sin tocar DB
    const cacheKey = `dashboard:${empresaId}:${sucursalId || 'all'}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return { success: true, data: cached };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const whereBase: any = { empresaId, estado: 'completada' };
    if (sucursalId) {
      whereBase.sucursalId = sucursalId;
    }

    // ⚡ Paralelizar las 9 queries: tiempo total = la más lenta, no la suma
    const [
      ventasHoy,
      ventasAyer,
      ventasMes,
      ventasMesAnterior,
      cajaActual,
      variantesConStockBajo,
      sinStockResult,
      topProductosHoy,
    ] = await Promise.all([
      // Ventas hoy
      this.prisma.venta.aggregate({
        where: { ...whereBase, createdAt: { gte: hoy } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Ventas ayer
      this.prisma.venta.aggregate({
        where: { ...whereBase, createdAt: { gte: ayer, lt: hoy } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Ventas mes actual
      this.prisma.venta.aggregate({
        where: { ...whereBase, createdAt: { gte: inicioMes } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Ventas mes anterior
      this.prisma.venta.aggregate({
        where: { ...whereBase, createdAt: { gte: inicioMesAnterior, lte: finMesAnterior } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Caja actual
      this.prisma.caja.findFirst({
        where: { empresaId, estado: 'abierta', ...(sucursalId && { sucursalId }) },
        select: { id: true, montoApertura: true, montoEfectivo: true, montoVentas: true },
      }),
      // Stock bajo (raw SQL)
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM stock_sucursal ss
        INNER JOIN variantes v ON ss.variante_id = v.id
        INNER JOIN productos p ON v.producto_id = p.id
        INNER JOIN sucursales s ON ss.sucursal_id = s.id
        WHERE p.empresa_id = ${empresaId}::uuid
        AND p.activo = true AND v.activo = true AND s.activo = true
        AND ss.stock_minimo > 0 AND ss.stock > 0 AND ss.stock <= ss.stock_minimo
      `,
      // Sin stock (raw SQL)
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT v.id) as count FROM variantes v
        INNER JOIN productos p ON v.producto_id = p.id
        WHERE p.empresa_id = ${empresaId}::uuid
        AND p.activo = true AND v.activo = true AND v.stock <= 0
      `,
      // Top productos hoy
      this.prisma.ventaDetalle.groupBy({
        by: ['varianteId'],
        where: { venta: { ...whereBase, createdAt: { gte: hoy } } },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { cantidad: 'desc' } },
        take: 5,
      }),
    ]);

    const stockBajo = Number(variantesConStockBajo[0]?.count || 0);
    const sinStock = Number(sinStockResult[0]?.count || 0);

    const varianteIds = topProductosHoy.map((p) => p.varianteId);
    const variantes = varianteIds.length > 0
      ? await this.prisma.variante.findMany({
          where: { id: { in: varianteIds } },
          select: { id: true, producto: { select: { nombre: true } } },
        })
      : [];
    const variantesMap = new Map(variantes.map((v) => [v.id, v]));

    // Calcular comparaciones
    const ventasHoyNum = Number(ventasHoy._sum.total) || 0;
    const ventasAyerNum = Number(ventasAyer._sum.total) || 0;
    const ventasMesNum = Number(ventasMes._sum.total) || 0;
    const ventasMesAntNum = Number(ventasMesAnterior._sum.total) || 0;

    const comparacionAyer = ventasAyerNum > 0
      ? ((ventasHoyNum - ventasAyerNum) / ventasAyerNum) * 100
      : 0;

    const comparacionMes = ventasMesAntNum > 0
      ? ((ventasMesNum - ventasMesAntNum) / ventasMesAntNum) * 100
      : 0;

    const data = {
      hoy: {
        ventas: ventasHoyNum,
        cantidad: ventasHoy._count.id,
        comparacionAyer: Math.round(comparacionAyer * 10) / 10,
      },
      mes: {
        ventas: ventasMesNum,
        cantidad: ventasMes._count.id,
        comparacionMesAnterior: Math.round(comparacionMes * 10) / 10,
      },
      cajaActual: cajaActual
        ? {
            abierta: true,
            efectivoActual: Number(cajaActual.montoEfectivo),
            ventasHoy: Number(cajaActual.montoVentas),
          }
        : { abierta: false, efectivoActual: 0, ventasHoy: 0 },
      alertas: { stockBajo, sinStock },
      topProductosHoy: topProductosHoy.map((p) => {
        const variante = variantesMap.get(p.varianteId);
        return {
          nombre: variante?.producto.nombre || 'Producto',
          cantidad: p._sum.cantidad || 0,
          monto: Number(p._sum.subtotal) || 0,
        };
      }),
    };

    // Cache 30s — invalidación se hace en venta.service al crear venta
    await this.redis.set(cacheKey, data, 30);

    return { success: true, data };
  }

  // =====================================================
  // MÉTODOS PRIVADOS AUXILIARES
  // =====================================================

  private agruparVentasPorPeriodo(ventas: any[], agruparPor: AgruparPor) {
    const grupos = new Map<string, { ventas: number; cantidad: number }>();

    for (const venta of ventas) {
      const fecha = new Date(venta.createdAt);
      let key: string;

      switch (agruparPor) {
        case AgruparPor.SEMANA:
          const inicioSemana = new Date(fecha);
          inicioSemana.setDate(fecha.getDate() - fecha.getDay());
          key = inicioSemana.toISOString().split('T')[0];
          break;
        case AgruparPor.MES:
          key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = fecha.toISOString().split('T')[0];
      }

      if (grupos.has(key)) {
        const existing = grupos.get(key)!;
        existing.ventas += Number(venta.total);
        existing.cantidad += 1;
      } else {
        grupos.set(key, { ventas: Number(venta.total), cantidad: 1 });
      }
    }

    return Array.from(grupos.entries())
      .map(([fecha, data]) => ({
        fecha,
        ventas: Math.round(data.ventas * 100) / 100,
        cantidad: data.cantidad,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  private agruparVentasPorCategoria(ventas: any[]) {
    const categorias = new Map<string, number>();
    let total = 0;

    for (const venta of ventas) {
      for (const detalle of venta.detalles) {
        const categoria = detalle.variante?.producto?.categoria?.nombre || 'Sin categoría';
        const subtotal = Number(detalle.subtotal);
        total += subtotal;

        if (categorias.has(categoria)) {
          categorias.set(categoria, categorias.get(categoria)! + subtotal);
        } else {
          categorias.set(categoria, subtotal);
        }
      }
    }

    return Array.from(categorias.entries())
      .map(([categoria, ventas]) => ({
        categoria,
        ventas: Math.round(ventas * 100) / 100,
        porcentaje: total > 0 ? Math.round((ventas / total) * 100) : 0,
      }))
      .sort((a, b) => b.ventas - a.ventas);
  }

  private agruparVentasPorMetodoPago(ventas: any[], totalVentas: number) {
    const metodos = new Map<string, number>();

    for (const venta of ventas) {
      for (const pago of venta.pagos) {
        const metodo = pago.metodoPago?.nombre || 'Otro';
        const monto = Number(pago.monto);

        if (metodos.has(metodo)) {
          metodos.set(metodo, metodos.get(metodo)! + monto);
        } else {
          metodos.set(metodo, monto);
        }
      }
    }

    return Array.from(metodos.entries())
      .map(([metodo, monto]) => ({
        metodo,
        monto: Math.round(monto * 100) / 100,
        porcentaje: totalVentas > 0 ? Math.round((monto / totalVentas) * 100) : 0,
      }))
      .sort((a, b) => b.monto - a.monto);
  }
}
