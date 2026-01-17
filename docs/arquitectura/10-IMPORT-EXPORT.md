# 📤 IMPORT / EXPORT DE PRODUCTOS

## 📋 DESCRIPCIÓN GENERAL

Sistema para importar y exportar productos mediante archivos Excel (.xlsx) y CSV, permitiendo:
- Carga masiva de productos
- Actualización masiva de precios/stock
- Exportación para edición externa
- Validación antes de importar

---

## 📊 ESTRUCTURA DEL ARCHIVO EXCEL

### Template de Importación
```
| SKU* | Código Barras | Nombre* | Descripción Corta | Categoría* | Marca | Unidad | Precio Compra | Precio Venta* | Precio Oferta | Stock Mínimo | Stock Máximo | Activo |
|------|---------------|---------|-------------------|------------|-------|--------|---------------|---------------|---------------|--------------|--------------|--------|
| CAM-001 | 7501234567890 | Camisa Formal | Camisa de vestir | Camisas | Arrow | Unidad | 45.00 | 89.90 | | 10 | 100 | SI |
| PAN-001 | 7501234567891 | Pantalón Casual | | Pantalones | Levi's | Unidad | 60.00 | 120.00 | 99.90 | 5 | 50 | SI |
```

### Campos del Template
| Campo | Obligatorio | Tipo | Descripción |
|-------|-------------|------|-------------|
| SKU | Sí | Texto | Código único del producto |
| Código Barras | No | Texto | Código de barras (EAN-13) |
| Nombre | Sí | Texto | Nombre del producto |
| Descripción Corta | No | Texto | Descripción breve |
| Categoría | Sí | Texto | Nombre de categoría existente |
| Marca | No | Texto | Nombre de marca existente |
| Unidad | No | Texto | Unidad de medida (default: Unidad) |
| Precio Compra | No | Decimal | Precio de costo |
| Precio Venta | Sí | Decimal | Precio de venta |
| Precio Oferta | No | Decimal | Precio promocional |
| Stock Mínimo | No | Entero | Alerta de stock bajo |
| Stock Máximo | No | Entero | Stock máximo |
| Activo | No | SI/NO | Estado del producto |

### Template con Variantes
```
| SKU* | Nombre* | Tipo* | Categoría* | Precio Venta* | Atributo 1 | Valor 1 | Atributo 2 | Valor 2 | SKU Variante | Precio Variante | Código Barras Variante |
|------|---------|-------|------------|---------------|------------|---------|------------|---------|--------------|-----------------|------------------------|
| CAM-001 | Camisa Formal | Variable | Camisas | 89.90 | Color | Blanco | Talla | S | CAM-001-BL-S | | 7501234567891 |
| CAM-001 | Camisa Formal | Variable | Camisas | 89.90 | Color | Blanco | Talla | M | CAM-001-BL-M | | 7501234567892 |
| CAM-001 | Camisa Formal | Variable | Camisas | 89.90 | Color | Azul | Talla | S | CAM-001-AZ-S | 94.90 | 7501234567893 |
```

---

## 🔧 BACKEND - IMPLEMENTACIÓN

### Use Case: Importar Productos
```typescript
// backend/src/core/application/use-cases/import-export/importar-productos.use-case.ts
import { Injectable } from '@nestjs/common';
import { IProductoRepository } from '@/core/domain/repository-interfaces/producto.repository.interface';
import { ICategoriaRepository } from '@/core/domain/repository-interfaces/categoria.repository.interface';
import { IMarcaRepository } from '@/core/domain/repository-interfaces/marca.repository.interface';
import { ExcelProcessor } from '@/infrastructure/file-processing/excel.processor';
import { ImportResultDto, ImportRowDto } from '../dto/import-export/import.dto';

@Injectable()
export class ImportarProductosUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly marcaRepository: IMarcaRepository,
    private readonly excelProcessor: ExcelProcessor,
  ) {}

  async execute(
    empresaId: string,
    file: Express.Multer.File,
    options: { actualizarExistentes: boolean; sucursalId?: string },
  ): Promise<ImportResultDto> {
    // 1. Parsear archivo Excel
    const rows = await this.excelProcessor.parseProductos(file);

    // 2. Obtener catálogos para validación
    const [categorias, marcas, productosExistentes] = await Promise.all([
      this.categoriaRepository.findByEmpresa(empresaId),
      this.marcaRepository.findByEmpresa(empresaId),
      this.productoRepository.findAllSKUs(empresaId),
    ]);

    const categoriasMap = new Map(categorias.map(c => [c.nombre.toLowerCase(), c]));
    const marcasMap = new Map(marcas.map(m => [m.nombre.toLowerCase(), m]));
    const skusExistentes = new Set(productosExistentes);

    // 3. Validar y procesar filas
    const resultado: ImportResultDto = {
      totalFilas: rows.length,
      filasValidas: 0,
      filasConError: 0,
      productosCreados: 0,
      productosActualizados: 0,
      errores: [],
      productos: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const numeroFila = i + 2; // +2 porque Excel empieza en 1 y hay header

      const validacion = this.validarFila(row, numeroFila, categoriasMap, marcasMap, skusExistentes);

      if (validacion.errores.length > 0) {
        resultado.errores.push(...validacion.errores);
        resultado.filasConError++;
        continue;
      }

      resultado.filasValidas++;

      // 4. Crear o actualizar producto
      try {
        const categoria = categoriasMap.get(row.categoria.toLowerCase());
        const marca = row.marca ? marcasMap.get(row.marca.toLowerCase()) : null;

        if (skusExistentes.has(row.sku)) {
          if (options.actualizarExistentes) {
            await this.productoRepository.updateBySKU(empresaId, row.sku, {
              nombre: row.nombre,
              descripcion_corta: row.descripcionCorta,
              precio_compra: row.precioCompra,
              precio_venta: row.precioVenta,
              precio_oferta: row.precioOferta,
              stock_minimo: row.stockMinimo,
              stock_maximo: row.stockMaximo,
              activo: row.activo,
            });
            resultado.productosActualizados++;
          }
        } else {
          await this.productoRepository.create({
            empresa_id: empresaId,
            sku: row.sku,
            codigo_barras: row.codigoBarras,
            nombre: row.nombre,
            descripcion_corta: row.descripcionCorta,
            tipo: 'simple',
            categoria_id: categoria.id,
            marca_id: marca?.id,
            precio_compra: row.precioCompra,
            precio_venta: row.precioVenta,
            precio_oferta: row.precioOferta,
            stock_minimo: row.stockMinimo || 0,
            stock_maximo: row.stockMaximo || 999,
            activo: row.activo ?? true,
          });
          resultado.productosCreados++;
          skusExistentes.add(row.sku);
        }

        resultado.productos.push({
          fila: numeroFila,
          sku: row.sku,
          nombre: row.nombre,
          estado: skusExistentes.has(row.sku) ? 'actualizado' : 'creado',
        });
      } catch (error) {
        resultado.errores.push({
          fila: numeroFila,
          campo: 'general',
          error: `Error al procesar: ${error.message}`,
        });
        resultado.filasConError++;
      }
    }

    return resultado;
  }

  private validarFila(
    row: any,
    fila: number,
    categorias: Map<string, any>,
    marcas: Map<string, any>,
    skusExistentes: Set<string>,
  ): { errores: Array<{ fila: number; campo: string; error: string }> } {
    const errores: Array<{ fila: number; campo: string; error: string }> = [];

    // SKU obligatorio
    if (!row.sku || row.sku.trim() === '') {
      errores.push({ fila, campo: 'SKU', error: 'El SKU es obligatorio' });
    }

    // Nombre obligatorio
    if (!row.nombre || row.nombre.trim() === '') {
      errores.push({ fila, campo: 'Nombre', error: 'El nombre es obligatorio' });
    }

    // Categoría obligatoria y debe existir
    if (!row.categoria || row.categoria.trim() === '') {
      errores.push({ fila, campo: 'Categoría', error: 'La categoría es obligatoria' });
    } else if (!categorias.has(row.categoria.toLowerCase())) {
      errores.push({ fila, campo: 'Categoría', error: `La categoría "${row.categoria}" no existe` });
    }

    // Marca opcional pero si se proporciona debe existir
    if (row.marca && row.marca.trim() !== '' && !marcas.has(row.marca.toLowerCase())) {
      errores.push({ fila, campo: 'Marca', error: `La marca "${row.marca}" no existe` });
    }

    // Precio venta obligatorio y debe ser positivo
    if (row.precioVenta === undefined || row.precioVenta === null) {
      errores.push({ fila, campo: 'Precio Venta', error: 'El precio de venta es obligatorio' });
    } else if (isNaN(row.precioVenta) || row.precioVenta <= 0) {
      errores.push({ fila, campo: 'Precio Venta', error: 'El precio debe ser un número positivo' });
    }

    // Precio oferta debe ser menor que precio venta
    if (row.precioOferta && row.precioOferta >= row.precioVenta) {
      errores.push({ fila, campo: 'Precio Oferta', error: 'El precio de oferta debe ser menor al precio de venta' });
    }

    // Código de barras único si se proporciona
    if (row.codigoBarras && !/^\d{8,14}$/.test(row.codigoBarras)) {
      errores.push({ fila, campo: 'Código Barras', error: 'El código de barras debe tener entre 8 y 14 dígitos' });
    }

    return { errores };
  }
}
```

### Excel Processor
```typescript
// backend/src/infrastructure/file-processing/excel.processor.ts
import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

interface ProductoRow {
  sku: string;
  codigoBarras?: string;
  nombre: string;
  descripcionCorta?: string;
  categoria: string;
  marca?: string;
  unidad?: string;
  precioCompra?: number;
  precioVenta: number;
  precioOferta?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  activo?: boolean;
}

@Injectable()
export class ExcelProcessor {
  async parseProductos(file: Express.Multer.File): Promise<ProductoRow[]> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) {
      throw new Error('El archivo está vacío o no tiene datos');
    }

    // Mapear headers
    const headers = (rawData[0] as string[]).map(h => this.normalizeHeader(h));
    const rows = rawData.slice(1) as any[][];

    return rows
      .filter(row => row.some(cell => cell !== undefined && cell !== ''))
      .map(row => this.mapRow(headers, row));
  }

  private normalizeHeader(header: string): string {
    const headerMap: Record<string, string> = {
      'sku': 'sku',
      'código': 'sku',
      'codigo': 'sku',
      'código barras': 'codigoBarras',
      'codigo barras': 'codigoBarras',
      'barcode': 'codigoBarras',
      'nombre': 'nombre',
      'producto': 'nombre',
      'descripción corta': 'descripcionCorta',
      'descripcion corta': 'descripcionCorta',
      'descripción': 'descripcionCorta',
      'descripcion': 'descripcionCorta',
      'categoría': 'categoria',
      'categoria': 'categoria',
      'marca': 'marca',
      'brand': 'marca',
      'unidad': 'unidad',
      'unidad medida': 'unidad',
      'precio compra': 'precioCompra',
      'costo': 'precioCompra',
      'precio venta': 'precioVenta',
      'precio': 'precioVenta',
      'precio oferta': 'precioOferta',
      'oferta': 'precioOferta',
      'stock mínimo': 'stockMinimo',
      'stock minimo': 'stockMinimo',
      'stock máximo': 'stockMaximo',
      'stock maximo': 'stockMaximo',
      'activo': 'activo',
      'estado': 'activo',
    };

    const normalized = header.toLowerCase().trim();
    return headerMap[normalized] || normalized;
  }

  private mapRow(headers: string[], row: any[]): ProductoRow {
    const obj: any = {};

    headers.forEach((header, index) => {
      let value = row[index];

      // Convertir tipos según el campo
      if (['precioCompra', 'precioVenta', 'precioOferta'].includes(header)) {
        value = value !== undefined && value !== '' ? parseFloat(value) : undefined;
      } else if (['stockMinimo', 'stockMaximo'].includes(header)) {
        value = value !== undefined && value !== '' ? parseInt(value) : undefined;
      } else if (header === 'activo') {
        value = value === undefined || value === '' || ['si', 'sí', 'yes', '1', 'true'].includes(String(value).toLowerCase());
      } else if (typeof value === 'string') {
        value = value.trim();
      }

      obj[header] = value;
    });

    return obj as ProductoRow;
  }

  async generateTemplate(): Promise<Buffer> {
    const headers = [
      'SKU*',
      'Código Barras',
      'Nombre*',
      'Descripción Corta',
      'Categoría*',
      'Marca',
      'Unidad',
      'Precio Compra',
      'Precio Venta*',
      'Precio Oferta',
      'Stock Mínimo',
      'Stock Máximo',
      'Activo',
    ];

    const exampleData = [
      ['CAM-001', '7501234567890', 'Camisa Formal', 'Camisa de vestir para hombre', 'Camisas', 'Arrow', 'Unidad', 45.00, 89.90, '', 10, 100, 'SI'],
      ['PAN-001', '7501234567891', 'Pantalón Casual', '', 'Pantalones', "Levi's", 'Unidad', 60.00, 120.00, 99.90, 5, 50, 'SI'],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);

    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 12 }, // SKU
      { wch: 15 }, // Código Barras
      { wch: 25 }, // Nombre
      { wch: 30 }, // Descripción
      { wch: 15 }, // Categoría
      { wch: 12 }, // Marca
      { wch: 10 }, // Unidad
      { wch: 12 }, // Precio Compra
      { wch: 12 }, // Precio Venta
      { wch: 12 }, // Precio Oferta
      { wch: 12 }, // Stock Mínimo
      { wch: 12 }, // Stock Máximo
      { wch: 8 },  // Activo
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // Hoja de instrucciones
    const instrucciones = [
      ['INSTRUCCIONES DE USO'],
      [''],
      ['1. Los campos marcados con * son obligatorios'],
      ['2. Las categorías y marcas deben existir previamente en el sistema'],
      ['3. El SKU debe ser único para cada producto'],
      ['4. El código de barras debe tener entre 8 y 14 dígitos'],
      ['5. Los precios deben ser números positivos'],
      ['6. El precio de oferta debe ser menor al precio de venta'],
      ['7. El campo Activo acepta: SI, NO, 1, 0'],
      [''],
      ['CATEGORÍAS DISPONIBLES:'],
      ['(Las categorías se cargan desde el sistema)'],
      [''],
      ['MARCAS DISPONIBLES:'],
      ['(Las marcas se cargan desde el sistema)'],
    ];

    const instruccionesSheet = XLSX.utils.aoa_to_sheet(instrucciones);
    XLSX.utils.book_append_sheet(workbook, instruccionesSheet, 'Instrucciones');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  async exportProductos(productos: any[]): Promise<Buffer> {
    const headers = [
      'SKU',
      'Código Barras',
      'Nombre',
      'Descripción Corta',
      'Tipo',
      'Categoría',
      'Marca',
      'Unidad',
      'Precio Compra',
      'Precio Venta',
      'Precio Oferta',
      'Stock Mínimo',
      'Stock Máximo',
      'Stock Actual',
      'Activo',
      'Fecha Creación',
    ];

    const data = productos.map(p => [
      p.sku,
      p.codigo_barras || '',
      p.nombre,
      p.descripcion_corta || '',
      p.tipo,
      p.categoria?.nombre || '',
      p.marca?.nombre || '',
      p.unidad_medida?.nombre || 'Unidad',
      p.precio_compra || '',
      p.precio_venta,
      p.precio_oferta || '',
      p.stock_minimo,
      p.stock_maximo,
      p.stock_total || 0,
      p.activo ? 'SI' : 'NO',
      new Date(p.created_at).toLocaleDateString('es-PE'),
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Configurar anchos de columna
    worksheet['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}
```

### Controller
```typescript
// backend/src/presentation/http/controllers/import-export.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentTenant } from '../decorators/current-tenant.decorator';
import { ImportarProductosUseCase } from '@/core/application/use-cases/import-export/importar-productos.use-case';
import { ExportarProductosUseCase } from '@/core/application/use-cases/import-export/exportar-productos.use-case';
import { ExcelProcessor } from '@/infrastructure/file-processing/excel.processor';

@Controller('import-export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportExportController {
  constructor(
    private readonly importarProductosUseCase: ImportarProductosUseCase,
    private readonly exportarProductosUseCase: ExportarProductosUseCase,
    private readonly excelProcessor: ExcelProcessor,
  ) {}

  @Get('template/productos')
  @Roles('admin')
  async getTemplate(@Res() res: Response) {
    const buffer = await this.excelProcessor.generateTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template-productos.xlsx');
    res.send(buffer);
  }

  @Post('productos/validar')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
        return cb(new Error('Solo se permiten archivos Excel o CSV'), false);
      }
      cb(null, true);
    },
  }))
  async validarArchivo(
    @CurrentTenant() empresaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Solo validar sin importar
    return this.importarProductosUseCase.execute(empresaId, file, {
      actualizarExistentes: false,
      // Modo validación: no guarda nada
    });
  }

  @Post('productos/importar')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
        return cb(new Error('Solo se permiten archivos Excel o CSV'), false);
      }
      cb(null, true);
    },
  }))
  async importarProductos(
    @CurrentTenant() empresaId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('actualizarExistentes') actualizarExistentes: string,
    @Body('sucursalId') sucursalId?: string,
  ) {
    return this.importarProductosUseCase.execute(empresaId, file, {
      actualizarExistentes: actualizarExistentes === 'true',
      sucursalId,
    });
  }

  @Get('productos/exportar')
  @Roles('admin')
  async exportarProductos(
    @CurrentTenant() empresaId: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('marcaId') marcaId?: string,
    @Query('activo') activo?: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportarProductosUseCase.execute(empresaId, {
      categoriaId,
      marcaId,
      activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
    });

    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=productos-${fecha}.xlsx`);
    res.send(buffer);
  }
}
```

---

## 🎨 FRONTEND - COMPONENTES

### Modal de Importación
```tsx
// frontend/src/presentation/components/features/import-export/import-modal.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Progress } from '@/presentation/components/ui/progress';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { importExportService } from '@/application/services/import-export.service';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Download } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'validating' | 'preview' | 'importing' | 'result';

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [actualizarExistentes, setActualizarExistentes] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Validar archivo
  const validateMutation = useMutation({
    mutationFn: (file: File) => importExportService.validarProductos(file),
    onSuccess: (data) => {
      setValidationResult(data);
      setStep('preview');
    },
    onError: (error) => {
      console.error('Error validando:', error);
    },
  });

  // Importar productos
  const importMutation = useMutation({
    mutationFn: ({ file, actualizarExistentes }: { file: File; actualizarExistentes: boolean }) =>
      importExportService.importarProductos(file, actualizarExistentes),
    onSuccess: (data) => {
      setImportResult(data);
      setStep('result');
      onSuccess();
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleValidate = () => {
    if (file) {
      setStep('validating');
      validateMutation.mutate(file);
    }
  };

  const handleImport = () => {
    if (file) {
      setStep('importing');
      importMutation.mutate({ file, actualizarExistentes });
    }
  };

  const handleDownloadTemplate = async () => {
    const blob = await importExportService.downloadTemplate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-productos.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Productos</DialogTitle>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${file ? 'border-green-500 bg-green-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra un archivo Excel aquí'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: .xlsx, .xls, .csv (máx. 5MB)
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="actualizar"
                checked={actualizarExistentes}
                onCheckedChange={(checked) => setActualizarExistentes(checked as boolean)}
              />
              <label htmlFor="actualizar" className="text-sm">
                Actualizar productos existentes (por SKU)
              </label>
            </div>

            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descargar Template
            </Button>
          </div>
        )}

        {/* Step: Validating */}
        {step === 'validating' && (
          <div className="py-8 text-center">
            <Progress value={50} className="mb-4" />
            <p>Validando archivo...</p>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && validationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{validationResult.totalFilas}</p>
                <p className="text-sm text-muted-foreground">Total filas</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-600">{validationResult.filasValidas}</p>
                <p className="text-sm text-muted-foreground">Válidas</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">{validationResult.filasConError}</p>
                <p className="text-sm text-muted-foreground">Con errores</p>
              </div>
            </div>

            {validationResult.errores.length > 0 && (
              <div className="max-h-48 overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Fila</th>
                      <th className="p-2 text-left">Campo</th>
                      <th className="p-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.errores.map((error: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{error.fila}</td>
                        <td className="p-2">{error.campo}</td>
                        <td className="p-2 text-red-600">{error.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {validationResult.filasValidas > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se importarán {validationResult.filasValidas} productos.
                  {validationResult.filasConError > 0 &&
                    ` Las ${validationResult.filasConError} filas con errores serán ignoradas.`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-8 text-center">
            <Progress value={75} className="mb-4" />
            <p>Importando productos...</p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && importResult && (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold">Importación Completada</h3>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-600">{importResult.productosCreados}</p>
                <p className="text-sm text-muted-foreground">Creados</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-2xl font-bold text-blue-600">{importResult.productosActualizados}</p>
                <p className="text-sm text-muted-foreground">Actualizados</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button onClick={handleValidate} disabled={!file}>
              Validar Archivo
            </Button>
          )}
          {step === 'preview' && validationResult?.filasValidas > 0 && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Volver
              </Button>
              <Button onClick={handleImport}>
                Importar {validationResult.filasValidas} productos
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Botón de Exportación
```tsx
// frontend/src/presentation/components/features/import-export/export-button.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/presentation/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { importExportService } from '@/application/services/import-export.service';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  filters?: {
    categoriaId?: string;
    marcaId?: string;
    activo?: boolean;
  };
}

export function ExportButton({ filters }: ExportButtonProps) {
  const exportMutation = useMutation({
    mutationFn: () => importExportService.exportarProductos(filters),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fecha = new Date().toISOString().split('T')[0];
      a.download = `productos-${fecha}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => exportMutation.mutate()}
      disabled={exportMutation.isPending}
    >
      {exportMutation.isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Exportar Excel
    </Button>
  );
}
```

### Service Frontend
```typescript
// frontend/src/application/services/import-export.service.ts
import { apiClient } from '@/infrastructure/api/api-client';

export const importExportService = {
  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/import-export/template/productos', {
      responseType: 'blob',
    });
    return response.data;
  },

  validarProductos: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/import-export/productos/validar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  importarProductos: async (file: File, actualizarExistentes: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('actualizarExistentes', String(actualizarExistentes));

    const response = await apiClient.post('/import-export/productos/importar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportarProductos: async (filters?: {
    categoriaId?: string;
    marcaId?: string;
    activo?: boolean;
  }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.categoriaId) params.append('categoriaId', filters.categoriaId);
    if (filters?.marcaId) params.append('marcaId', filters.marcaId);
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo));

    const response = await apiClient.get(`/import-export/productos/exportar?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
```

---

## 📝 PÁGINA IMPORT/EXPORT

```tsx
// frontend/src/presentation/app/(dashboard)/productos/import-export/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { ImportModal } from '@/presentation/components/features/import-export/import-modal';
import { ExportButton } from '@/presentation/components/features/import-export/export-button';
import { Upload, Download, FileSpreadsheet, HelpCircle } from 'lucide-react';

export default function ImportExportPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleDownloadTemplate = async () => {
    // Descargar template
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Importar / Exportar Productos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Importar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Productos
            </CardTitle>
            <CardDescription>
              Carga masiva de productos desde archivo Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Formatos soportados: .xlsx, .xls, .csv</li>
              <li>Tamaño máximo: 5MB</li>
              <li>Valida antes de importar</li>
              <li>Opción de actualizar existentes</li>
            </ul>
            <div className="flex gap-2">
              <Button onClick={() => setImportModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Descargar Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exportar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Productos
            </CardTitle>
            <CardDescription>
              Descarga todos los productos en Excel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Exporta todos los productos</li>
              <li>Incluye variantes y stock</li>
              <li>Formato Excel (.xlsx)</li>
              <li>Filtrar por categoría o marca</li>
            </ul>
            <ExportButton />
          </CardContent>
        </Card>
      </div>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>Campos obligatorios:</h4>
            <ul>
              <li><strong>SKU:</strong> Código único del producto</li>
              <li><strong>Nombre:</strong> Nombre del producto</li>
              <li><strong>Categoría:</strong> Debe existir en el sistema</li>
              <li><strong>Precio Venta:</strong> Precio de venta al público</li>
            </ul>

            <h4>Campos opcionales:</h4>
            <ul>
              <li><strong>Código Barras:</strong> Entre 8 y 14 dígitos</li>
              <li><strong>Marca:</strong> Debe existir en el sistema</li>
              <li><strong>Precio Oferta:</strong> Menor al precio de venta</li>
              <li><strong>Stock Mínimo/Máximo:</strong> Para alertas</li>
            </ul>

            <h4>Notas importantes:</h4>
            <ul>
              <li>Las categorías y marcas deben crearse antes de importar</li>
              <li>Si un SKU ya existe, se puede actualizar marcando la opción</li>
              <li>Los errores se muestran antes de importar</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={() => {
          // Refrescar lista de productos si es necesario
        }}
      />
    </div>
  );
}
```
