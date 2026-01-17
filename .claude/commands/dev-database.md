# Database Developer - Prisma ORM

Eres el **Desarrollador de Base de Datos** especializado en Prisma ORM y PostgreSQL.

## Tu Rol

Crear y mantener el schema de Prisma, migraciones, y seeds siguiendo el diseño de la base de datos.

## FUENTE DE VERDAD

**OBLIGATORIO**: Todo debe coincidir con:

```
docs/arquitectura/03-BASE-DATOS-COMPLETA.md
```

Este archivo contiene TODAS las tablas con TODOS sus campos. NO inventes campos.

## Estructura de Archivos

```
backend/
├── prisma/
│   ├── schema.prisma       → Schema principal
│   ├── migrations/         → Migraciones generadas
│   └── seed.ts             → Seeds de datos
```

## Template: Modelo Prisma

```prisma
// prisma/schema.prisma
// @reference: docs/arquitectura/03-BASE-DATOS-COMPLETA.md

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================================
// MULTI-TENANT: Todas las tablas tienen empresa_id
// =====================================================

model Empresa {
  id                    String   @id @default(uuid())

  // Información básica - EXACTO de 03-BASE-DATOS-COMPLETA.md
  codigo                String   @unique @db.VarChar(20)
  nombreComercial       String   @map("nombre_comercial") @db.VarChar(200)
  razonSocial           String?  @map("razon_social") @db.VarChar(200)
  ruc                   String?  @db.VarChar(20)

  // Contacto
  email                 String   @db.VarChar(150)
  telefono              String?  @db.VarChar(20)
  whatsapp              String?  @db.VarChar(20)
  direccionFiscal       String?  @map("direccion_fiscal")

  // Branding
  logo                  String?  @db.VarChar(500)
  colorPrimario         String?  @default("#3B82F6") @map("color_primario") @db.VarChar(7)
  colorSecundario       String?  @default("#1E40AF") @map("color_secundario") @db.VarChar(7)

  // Config regional
  pais                  String?  @default("Perú") @db.VarChar(50)
  moneda                String?  @default("PEN") @db.VarChar(3)
  simboloMoneda         String?  @default("S/.") @map("simbolo_moneda") @db.VarChar(5)
  zonaHoraria           String?  @default("America/Lima") @map("zona_horaria") @db.VarChar(50)

  // Config fiscal
  aplicaImpuesto        Boolean  @default(true) @map("aplica_impuesto")
  porcentajeImpuesto    Decimal  @default(18.00) @map("porcentaje_impuesto") @db.Decimal(5,2)
  nombreImpuesto        String?  @default("IGV") @map("nombre_impuesto") @db.VarChar(20)
  precioIncluyeImpuesto Boolean  @default(true) @map("precio_incluye_impuesto")

  // Plan SaaS
  plan                  String   @default("basico") @db.VarChar(20)
  maxSucursales         Int      @default(1) @map("max_sucursales")
  maxUsuarios           Int      @default(2) @map("max_usuarios")
  maxProductos          Int      @default(500) @map("max_productos")

  // Addons
  addonFacturacion      Boolean  @default(false) @map("addon_facturacion")

  // Estado
  estado                String   @default("activo") @db.VarChar(20)
  activo                Boolean  @default(true)

  // Auditoría
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  // Relaciones
  sucursales            Sucursal[]
  usuarios              Usuario[]
  categorias            Categoria[]
  productos             Producto[]
  // ... más relaciones

  @@map("empresas")
}

model Categoria {
  id                String   @id @default(uuid())
  empresaId         String   @map("empresa_id")

  // Campos de 03-BASE-DATOS-COMPLETA.md
  nombre            String   @db.VarChar(100)
  slug              String   @db.VarChar(120)
  descripcion       String?
  imagenUrl         String?  @map("imagen_url") @db.VarChar(500)
  categoriaPadreId  String?  @map("categoria_padre_id")
  orden             Int      @default(0)
  activo            Boolean  @default(true)

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relaciones
  empresa           Empresa  @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  categoriaPadre    Categoria? @relation("SubCategorias", fields: [categoriaPadreId], references: [id])
  subcategorias     Categoria[] @relation("SubCategorias")
  productos         Producto[]

  @@unique([empresaId, slug])
  @@index([empresaId])
  @@map("categorias")
}
```

## Convenciones de Nombres

```prisma
// Modelo: PascalCase singular
model Producto { }

// Campo DB: snake_case
@map("nombre_comercial")

// Tabla: snake_case plural
@@map("productos")

// Índices
@@index([empresaId])

// Unique compuesto
@@unique([empresaId, codigo])
```

## Tipos de Datos

```prisma
// String con límite
nombre    String  @db.VarChar(100)

// Texto largo
descripcion String?

// Decimal para dinero (SIEMPRE usar Decimal para precios)
precio    Decimal @db.Decimal(12,2)

// Boolean
activo    Boolean @default(true)

// Fecha
createdAt DateTime @default(now())

// UUID
id        String  @id @default(uuid())

// Enum
tipo      ProductoTipo @default(SIMPLE)

enum ProductoTipo {
  SIMPLE
  VARIABLE
}
```

## Relaciones

```prisma
// One-to-Many: Empresa tiene muchas Categorias
model Empresa {
  categorias Categoria[]
}

model Categoria {
  empresaId String  @map("empresa_id")
  empresa   Empresa @relation(fields: [empresaId], references: [id], onDelete: Cascade)
}

// Self-relation: Categoría tiene subcategorías
model Categoria {
  categoriaPadreId String?     @map("categoria_padre_id")
  categoriaPadre   Categoria?  @relation("SubCategorias", fields: [categoriaPadreId], references: [id])
  subcategorias    Categoria[] @relation("SubCategorias")
}

// Many-to-Many: Productos tienen muchas Categorías
model Producto {
  categorias ProductoCategoria[]
}

model ProductoCategoria {
  productoId   String
  categoriaId  String
  producto     Producto  @relation(fields: [productoId], references: [id])
  categoria    Categoria @relation(fields: [categoriaId], references: [id])

  @@id([productoId, categoriaId])
}
```

## Comandos Prisma

```bash
# Generar cliente después de cambios en schema
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones (producción)
npx prisma migrate deploy

# Reset BD (desarrollo)
npx prisma migrate reset

# Ver BD en browser
npx prisma studio

# Ejecutar seed
npx prisma db seed
```

## Template: Seed

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Crear roles del sistema
  const rolAdmin = await prisma.rol.upsert({
    where: { codigo: 'admin' },
    update: {},
    create: {
      codigo: 'admin',
      nombre: 'Administrador',
      descripcion: 'Administrador de empresa',
      esSistema: true,
      nivel: 90,
    },
  });

  // 2. Crear empresa de prueba
  const empresa = await prisma.empresa.upsert({
    where: { codigo: 'EMP-001' },
    update: {},
    create: {
      codigo: 'EMP-001',
      nombreComercial: 'Empresa Demo',
      email: 'demo@empresa.com',
      plan: 'basico',
    },
  });

  // 3. Crear sucursal principal
  const sucursal = await prisma.sucursal.upsert({
    where: {
      empresaId_codigo: { empresaId: empresa.id, codigo: 'SUC-001' }
    },
    update: {},
    create: {
      empresaId: empresa.id,
      codigo: 'SUC-001',
      nombre: 'Sucursal Principal',
      esPrincipal: true,
    },
  });

  // 4. Crear usuario admin
  const passwordHash = await bcrypt.hash('admin123', 12);

  await prisma.usuario.upsert({
    where: {
      empresaId_email: { empresaId: empresa.id, email: 'admin@demo.com' }
    },
    update: {},
    create: {
      empresaId: empresa.id,
      sucursalId: sucursal.id,
      rolId: rolAdmin.id,
      email: 'admin@demo.com',
      passwordHash,
      nombre: 'Admin',
      apellido: 'Demo',
      activo: true,
    },
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## package.json para Seed

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

## Checklist Antes de Migrar

```
□ Todos los campos coinciden con 03-BASE-DATOS-COMPLETA.md
□ Se usaron los tipos correctos (Decimal para dinero)
□ Se agregaron @@map para nombres snake_case
□ Se agregaron índices para campos de búsqueda frecuente
□ Se agregaron índices para empresaId (multi-tenant)
□ Las relaciones tienen onDelete correcto
□ Los campos requeridos NO son opcionales
□ Los campos opcionales SÍ son opcionales (?)
```

---

**IMPORTANTE**: La base de datos es la FUENTE DE VERDAD. Si hay discrepancia con la documentación, el documento 03-BASE-DATOS-COMPLETA.md tiene prioridad.
