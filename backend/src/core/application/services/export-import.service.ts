/**
 * @file export-import.service.ts
 * @description Servicio para exportar/importar productos en Excel
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

@Injectable()
export class ExportImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Exportar productos a Excel
   */
  async exportProductos(empresaId: string): Promise<Buffer> {
    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      include: {
        categoria: { select: { nombre: true } },
        marca: { select: { nombre: true } },
        unidadMedida: { select: { nombre: true, abreviatura: true } },
      },
      orderBy: { nombre: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');

    // Headers
    sheet.columns = [
      { header: 'Codigo', key: 'codigoInterno', width: 15 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Codigo Barras', key: 'codigoBarras', width: 18 },
      { header: 'Nombre', key: 'nombre', width: 35 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Unidad', key: 'unidad', width: 10 },
      { header: 'Precio Compra', key: 'precioCompra', width: 14 },
      { header: 'Precio Venta', key: 'precioVenta', width: 14 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Minimo', key: 'stockMinimo', width: 12 },
      { header: 'Activo', key: 'activo', width: 8 },
    ];

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Data
    for (const p of productos) {
      sheet.addRow({
        codigoInterno: p.codigoInterno,
        sku: p.sku || '',
        codigoBarras: p.codigoBarras || '',
        nombre: p.nombre,
        categoria: p.categoria?.nombre || '',
        marca: p.marca?.nombre || '',
        unidad: p.unidadMedida?.abreviatura || 'UND',
        precioCompra: Number(p.precioCompra),
        precioVenta: Number(p.precioVenta),
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        activo: p.activo ? 'Si' : 'No',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Importar productos desde Excel
   */
  async importProductos(empresaId: string, fileBuffer: Buffer, userId: string): Promise<{
    importados: number;
    errores: string[];
    actualizados: number;
  }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      throw new BadRequestException('El archivo no tiene hojas de calculo');
    }

    const errores: string[] = [];
    let importados = 0;
    let actualizados = 0;

    // Get default category
    let defaultCategoria = await this.prisma.categoria.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'asc' },
    });
    if (!defaultCategoria) {
      throw new BadRequestException('Debe crear al menos una categoria antes de importar');
    }

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      rows.push({
        rowNumber,
        codigoInterno: row.getCell(1).value?.toString()?.trim() || '',
        sku: row.getCell(2).value?.toString()?.trim() || '',
        codigoBarras: row.getCell(3).value?.toString()?.trim() || '',
        nombre: row.getCell(4).value?.toString()?.trim() || '',
        precioCompra: parseFloat(row.getCell(8).value?.toString() || '0') || 0,
        precioVenta: parseFloat(row.getCell(9).value?.toString() || '0') || 0,
        stock: parseInt(row.getCell(10).value?.toString() || '0') || 0,
        stockMinimo: parseInt(row.getCell(11).value?.toString() || '0') || 0,
      });
    });

    for (const row of rows) {
      if (!row.nombre) {
        errores.push(`Fila ${row.rowNumber}: Nombre vacio, se omitio`);
        continue;
      }

      const codigo = row.codigoInterno || `IMP-${Date.now()}-${row.rowNumber}`;
      const slug = row.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      try {
        // Check if exists by codigo
        const existing = await this.prisma.producto.findFirst({
          where: { empresaId, codigoInterno: codigo },
        });

        if (existing) {
          // Update
          await this.prisma.producto.update({
            where: { id: existing.id },
            data: {
              nombre: row.nombre,
              precioCompra: row.precioCompra,
              precioVenta: row.precioVenta,
              stock: row.stock,
              stockMinimo: row.stockMinimo,
              sku: row.sku || existing.sku,
              codigoBarras: row.codigoBarras || existing.codigoBarras,
            },
          });
          actualizados++;
        } else {
          // Create
          await this.prisma.producto.create({
            data: {
              empresaId,
              categoriaId: defaultCategoria.id,
              codigoInterno: codigo,
              nombre: row.nombre,
              slug: `${slug}-${Date.now()}`,
              sku: row.sku || null,
              codigoBarras: row.codigoBarras || null,
              precioCompra: row.precioCompra,
              precioVenta: row.precioVenta || row.precioCompra,
              stock: row.stock,
              stockMinimo: row.stockMinimo,
              createdBy: userId,
            },
          });
          importados++;
        }
      } catch (error: any) {
        errores.push(`Fila ${row.rowNumber}: ${error.message || 'Error desconocido'}`);
      }
    }

    return { importados, actualizados, errores };
  }

  /**
   * Exportar plantilla Excel vacia
   */
  async exportPlantilla(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');

    sheet.columns = [
      { header: 'Codigo (requerido)', key: 'codigo', width: 20 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Codigo Barras', key: 'codigoBarras', width: 18 },
      { header: 'Nombre (requerido)', key: 'nombre', width: 35 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Unidad', key: 'unidad', width: 10 },
      { header: 'Precio Compra', key: 'precioCompra', width: 14 },
      { header: 'Precio Venta (requerido)', key: 'precioVenta', width: 14 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Minimo', key: 'stockMinimo', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };

    // Add example row
    sheet.addRow({
      codigo: 'PROD-001',
      sku: 'SKU001',
      codigoBarras: '7501234567890',
      nombre: 'Producto Ejemplo',
      categoria: 'General',
      marca: 'Mi Marca',
      unidad: 'UND',
      precioCompra: 10.00,
      precioVenta: 15.00,
      stock: 100,
      stockMinimo: 10,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
