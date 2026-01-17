# 🔌 API ENDPOINTS

## 📋 CONVENCIONES

```
Base URL: http://localhost:4000/api/v1
Autenticación: JWT en HTTPOnly Cookie
Content-Type: application/json
```

### Formato de Respuesta Exitosa
```json
{
  "success": true,
  "data": { },
  "message": "Operación exitosa",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Formato de Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": [
      { "field": "email", "message": "Email inválido" }
    ]
  }
}
```

---

## 🔐 AUTH (Autenticación)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/register` | Registrar empresa + admin | No |
| POST | `/auth/refresh` | Renovar access token | Cookie |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| GET | `/auth/me` | Obtener usuario actual | Sí |
| POST | `/auth/forgot-password` | Solicitar reset password | No |
| POST | `/auth/reset-password` | Cambiar password con token | No |

### POST /auth/login
```typescript
// Request
{
  "email": "admin@empresa.com",
  "password": "password123"
}

// Response (+ Set-Cookie: access_token, refresh_token)
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "email": "admin@empresa.com",
      "nombre": "Admin",
      "rol": { "id": "uuid", "nombre": "admin" },
      "empresa": { "id": "uuid", "nombre": "Mi Empresa" },
      "sucursal": { "id": "uuid", "nombre": "Principal" }
    }
  }
}
```

### POST /auth/register
```typescript
// Request
{
  "empresa": {
    "nombre": "Mi Empresa SAC",
    "ruc": "20123456789",
    "email": "contacto@empresa.com",
    "telefono": "987654321",
    "plan": "basic"  // basic | pro | enterprise
  },
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "admin@empresa.com",
    "password": "password123"
  }
}

// Response
{
  "success": true,
  "data": {
    "empresa": { "id": "uuid", "nombre": "Mi Empresa SAC" },
    "usuario": { "id": "uuid", "email": "admin@empresa.com" },
    "sucursal": { "id": "uuid", "nombre": "Principal" }
  },
  "message": "Empresa registrada exitosamente"
}
```

---

## 🏢 EMPRESAS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/empresas/me` | Obtener mi empresa | Usuario |
| PUT | `/empresas/me` | Actualizar mi empresa | Admin |
| GET | `/empresas/me/config` | Obtener configuración | Usuario |
| PUT | `/empresas/me/config` | Actualizar configuración | Admin |
| POST | `/empresas/me/logo` | Subir logo | Admin |

### PUT /empresas/me
```typescript
// Request
{
  "nombre": "Mi Empresa SAC",
  "ruc": "20123456789",
  "razon_social": "Mi Empresa Sociedad Anónima Cerrada",
  "direccion": "Av. Principal 123",
  "telefono": "987654321",
  "email": "contacto@empresa.com",
  "moneda": "PEN",
  "igv_porcentaje": 18.00
}
```

---

## 🏪 SUCURSALES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/sucursales` | Listar sucursales | Usuario |
| GET | `/sucursales/:id` | Obtener sucursal | Usuario |
| POST | `/sucursales` | Crear sucursal | Admin |
| PUT | `/sucursales/:id` | Actualizar sucursal | Admin |
| DELETE | `/sucursales/:id` | Eliminar sucursal | Admin |

### POST /sucursales
```typescript
// Request
{
  "nombre": "Sucursal Norte",
  "codigo": "SUC-002",
  "direccion": "Av. Norte 456",
  "telefono": "912345678",
  "email": "norte@empresa.com",
  "es_principal": false,
  "activo": true
}
```

---

## 👥 USUARIOS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/usuarios` | Listar usuarios | Admin |
| GET | `/usuarios/:id` | Obtener usuario | Admin |
| POST | `/usuarios` | Crear usuario | Admin |
| PUT | `/usuarios/:id` | Actualizar usuario | Admin |
| DELETE | `/usuarios/:id` | Eliminar usuario | Admin |
| PUT | `/usuarios/:id/password` | Cambiar password | Admin/Self |
| PUT | `/usuarios/:id/sucursal` | Cambiar sucursal | Admin |
| GET | `/usuarios/:id/sucursales` | Listar sucursales asignadas | Admin |
| POST | `/usuarios/:id/sucursales` | Asignar sucursal adicional | Admin |
| DELETE | `/usuarios/:id/sucursales/:sucursalId` | Quitar sucursal | Admin |
| PUT | `/usuarios/:id/sucursales/:sucursalId` | Actualizar asignación | Admin |

### POST /usuarios
```typescript
// Request
{
  "nombre": "María García",
  "email": "maria@empresa.com",
  "password": "password123",
  "telefono": "987654321",
  "rol_id": "uuid-rol-cajero",
  "sucursal_id": "uuid-sucursal",
  "activo": true
}
```

### GET /usuarios/:id/sucursales

```typescript
// Response - Sucursales asignadas al usuario
{
  "success": true,
  "data": [
    {
      "id": "uuid-asignacion",
      "sucursal": {
        "id": "uuid-sucursal-norte",
        "nombre": "Sucursal Norte",
        "direccion": "Av. Principal 123"
      },
      "es_principal": true,
      "rol_sucursal": "supervisor",
      "puede_ver_reportes": true,
      "puede_gestionar_caja": true,
      "puede_gestionar_stock": true,
      "dias_asignados": ["lunes", "martes", "miercoles", "jueves", "viernes"],
      "hora_inicio": "08:00",
      "hora_fin": "18:00",
      "activo": true
    },
    {
      "id": "uuid-asignacion-2",
      "sucursal": {
        "id": "uuid-sucursal-sur",
        "nombre": "Sucursal Sur",
        "direccion": "Calle Sur 456"
      },
      "es_principal": false,
      "rol_sucursal": "supervisor",
      "puede_ver_reportes": true,
      "puede_gestionar_caja": false,
      "puede_gestionar_stock": true,
      "dias_asignados": null,
      "hora_inicio": null,
      "hora_fin": null,
      "activo": true
    }
  ]
}
```

### POST /usuarios/:id/sucursales

```typescript
// Request - Asignar sucursal adicional a un usuario
{
  "sucursal_id": "uuid-sucursal-centro",
  "es_principal": false,
  "rol_sucursal": "supervisor",        // Opcional: override del rol
  "puede_ver_reportes": true,
  "puede_gestionar_caja": true,
  "puede_gestionar_stock": true,
  "dias_asignados": ["sabado", "domingo"],  // Opcional
  "hora_inicio": "09:00",                    // Opcional
  "hora_fin": "14:00"                        // Opcional
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid-nueva-asignacion",
    "mensaje": "Sucursal asignada correctamente"
  }
}
```

### PUT /usuarios/:id/sucursales/:sucursalId

```typescript
// Request - Actualizar asignación
{
  "es_principal": true,                // Cambiar a sucursal principal
  "dias_asignados": ["lunes", "martes", "miercoles"],
  "puede_gestionar_caja": false        // Quitar permiso de caja
}

// Response
{
  "success": true,
  "mensaje": "Asignación actualizada"
}
```

---

## 🎭 ROLES Y PERMISOS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/roles` | Listar roles | Admin |
| GET | `/roles/:id` | Obtener rol con permisos | Admin |
| POST | `/roles` | Crear rol | Admin |
| PUT | `/roles/:id` | Actualizar rol | Admin |
| DELETE | `/roles/:id` | Eliminar rol | Admin |
| GET | `/permisos` | Listar todos los permisos | Admin |

### POST /roles
```typescript
// Request
{
  "nombre": "Supervisor",
  "descripcion": "Supervisor de tienda",
  "permisos": [
    "productos:leer",
    "productos:crear",
    "productos:editar",
    "ventas:leer",
    "ventas:crear",
    "caja:abrir",
    "caja:cerrar",
    "reportes:leer"
  ]
}
```

---

## 📂 CATEGORÍAS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/categorias` | Listar categorías | Usuario |
| GET | `/categorias/:id` | Obtener categoría | Usuario |
| POST | `/categorias` | Crear categoría | Admin |
| PUT | `/categorias/:id` | Actualizar categoría | Admin |
| DELETE | `/categorias/:id` | Eliminar categoría | Admin |
| POST | `/categorias/:id/imagen` | Subir imagen | Admin |

### GET /categorias
```typescript
// Query params
?activo=true
&search=ropa
&page=1
&limit=20
&orden=nombre
&direccion=asc

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Ropa",
      "slug": "ropa",
      "descripcion": "Ropa de vestir",
      "imagen_url": "/uploads/categorias/ropa.jpg",
      "categoria_padre_id": null,
      "orden": 1,
      "activo": true,
      "productos_count": 45
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 10 }
}
```

### POST /categorias
```typescript
// Request
{
  "nombre": "Zapatos",
  "descripcion": "Calzado para hombres y mujeres",
  "categoria_padre_id": null,  // Para subcategoría
  "orden": 2,
  "activo": true
}
```

---

## 🏷️ MARCAS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/marcas` | Listar marcas | Usuario |
| GET | `/marcas/:id` | Obtener marca | Usuario |
| POST | `/marcas` | Crear marca | Admin |
| PUT | `/marcas/:id` | Actualizar marca | Admin |
| DELETE | `/marcas/:id` | Eliminar marca | Admin |
| POST | `/marcas/:id/logo` | Subir logo | Admin |

---

## 🎨 ATRIBUTOS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/atributos` | Listar atributos | Usuario |
| GET | `/atributos/:id` | Obtener atributo con valores | Usuario |
| POST | `/atributos` | Crear atributo | Admin |
| PUT | `/atributos/:id` | Actualizar atributo | Admin |
| DELETE | `/atributos/:id` | Eliminar atributo | Admin |
| POST | `/atributos/:id/valores` | Agregar valor | Admin |
| PUT | `/atributos/:id/valores/:valorId` | Actualizar valor | Admin |
| DELETE | `/atributos/:id/valores/:valorId` | Eliminar valor | Admin |

### GET /atributos/:id
```typescript
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Color",
    "tipo": "color",  // texto | color | imagen
    "valores": [
      {
        "id": "uuid",
        "valor": "Rojo",
        "codigo_color": "#FF0000",
        "imagen_url": null,
        "orden": 1
      },
      {
        "id": "uuid",
        "valor": "Azul",
        "codigo_color": "#0000FF",
        "imagen_url": null,
        "orden": 2
      }
    ]
  }
}
```

### POST /atributos
```typescript
// Request
{
  "nombre": "Talla",
  "tipo": "texto",
  "valores": [
    { "valor": "S", "orden": 1 },
    { "valor": "M", "orden": 2 },
    { "valor": "L", "orden": 3 },
    { "valor": "XL", "orden": 4 }
  ]
}
```

---

## 📦 PRODUCTOS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/productos` | Listar productos | Usuario |
| GET | `/productos/:id` | Obtener producto completo | Usuario |
| POST | `/productos` | Crear producto | Admin |
| PUT | `/productos/:id` | Actualizar producto | Admin |
| DELETE | `/productos/:id` | Eliminar producto | Admin |
| POST | `/productos/:id/imagenes` | Subir imágenes | Admin |
| DELETE | `/productos/:id/imagenes/:imgId` | Eliminar imagen | Admin |
| GET | `/productos/buscar` | Buscar por código/nombre | Usuario |
| GET | `/productos/barcode/:codigo` | Buscar por código de barras | Usuario |

### GET /productos
```typescript
// Query params
?search=camisa
&categoria_id=uuid
&marca_id=uuid
&tipo=variable        // simple | variable
&activo=true
&stock_bajo=true      // Solo productos con stock bajo
&page=1
&limit=20
&orden=nombre
&direccion=asc

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Camisa Formal",
      "slug": "camisa-formal",
      "sku": "CAM-001",
      "tipo": "variable",
      "categoria": { "id": "uuid", "nombre": "Camisas" },
      "marca": { "id": "uuid", "nombre": "Arrow" },
      "precio_venta": 89.90,
      "precio_oferta": null,
      "descuento_porcentaje": 0,
      "imagen_principal": "/uploads/productos/camisa.jpg",
      "stock_total": 150,
      "variantes_count": 12,
      "activo": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50 }
}
```

### GET /productos/:id
```typescript
// Response (Producto completo con variantes)
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "Camisa Formal",
    "slug": "camisa-formal",
    "sku": "CAM-001",
    "codigo_barras": "7501234567890",
    "tipo": "variable",
    "descripcion_corta": "Camisa formal para hombre",
    "descripcion_larga": "<p>Descripción HTML completa...</p>",

    "categoria_id": "uuid",
    "marca_id": "uuid",
    "unidad_medida_id": "uuid",

    "precio_compra": 45.00,
    "precio_venta": 89.90,
    "precio_oferta": null,
    "descuento_porcentaje": 0,

    "stock_minimo": 10,
    "stock_maximo": 100,

    "peso": 0.3,
    "largo": null,
    "ancho": null,
    "alto": null,

    "atributo_imagen_id": "uuid-atributo-color",  // Atributo que define imagen

    "imagenes": [
      { "id": "uuid", "url": "/uploads/...", "es_principal": true, "orden": 1 }
    ],

    "atributos": [
      {
        "atributo": { "id": "uuid", "nombre": "Color" },
        "valores": [
          { "id": "uuid", "valor": "Blanco", "imagen_url": "/uploads/color-blanco.jpg" },
          { "id": "uuid", "valor": "Azul", "imagen_url": "/uploads/color-azul.jpg" }
        ]
      },
      {
        "atributo": { "id": "uuid", "nombre": "Talla" },
        "valores": [
          { "id": "uuid", "valor": "S" },
          { "id": "uuid", "valor": "M" },
          { "id": "uuid", "valor": "L" }
        ]
      }
    ],

    "variantes": [
      {
        "id": "uuid",
        "sku": "CAM-001-BL-S",
        "codigo_barras": "7501234567891",
        "precio_venta": 89.90,       // null = hereda del padre
        "precio_oferta": null,
        "imagen_url": null,           // null = hereda del atributo color o padre
        "activo": true,
        "valores": [
          { "atributo": "Color", "valor": "Blanco", "codigo_color": "#FFFFFF" },
          { "atributo": "Talla", "valor": "S" }
        ],
        "stock": {
          "sucursal_id": "uuid",
          "cantidad": 25,
          "stock_reservado": 0
        }
      }
      // ... más variantes
    ],

    "activo": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### POST /productos
```typescript
// Request - Producto Simple
{
  "nombre": "Billetera de Cuero",
  "sku": "BIL-001",
  "codigo_barras": "7501234567892",
  "tipo": "simple",
  "descripcion_corta": "Billetera de cuero genuino",
  "descripcion_larga": "<p>Descripción completa...</p>",

  "categoria_id": "uuid",
  "marca_id": "uuid",           // Opcional
  "unidad_medida_id": "uuid",

  "precio_compra": 30.00,
  "precio_venta": 59.90,
  "precio_oferta": 49.90,        // Opcional
  "descuento_porcentaje": 16.69, // Calculado automáticamente si hay precio_oferta

  "stock_minimo": 5,
  "stock_maximo": 50,

  "activo": true
}

// Request - Producto Variable
{
  "nombre": "Camisa Formal",
  "sku": "CAM-001",
  "tipo": "variable",
  "descripcion_corta": "Camisa formal para hombre",

  "categoria_id": "uuid",
  "marca_id": "uuid",
  "unidad_medida_id": "uuid",

  "precio_compra": 45.00,
  "precio_venta": 89.90,

  "stock_minimo": 10,
  "stock_maximo": 100,

  "atributo_imagen_id": "uuid-atributo-color",

  "atributos": [
    {
      "atributo_id": "uuid-color",
      "valores": ["uuid-blanco", "uuid-azul", "uuid-negro"]
    },
    {
      "atributo_id": "uuid-talla",
      "valores": ["uuid-s", "uuid-m", "uuid-l", "uuid-xl"]
    }
  ],

  "generar_variantes": true,  // Genera todas las combinaciones automáticamente

  "activo": true
}
```

### GET /productos/barcode/:codigo
```typescript
// Response - Producto SIMPLE (tipo: "producto")
{
  "success": true,
  "data": {
    "tipo": "producto",
    "producto": {
      "id": "uuid",
      "sku": "CHE-001",
      "codigo_barras": "7751234567890",
      "nombre": "Cheetos Chico",
      "precio_venta": 2.50,
      "precio_oferta": null,
      "imagen_url": "/uploads/cheetos.jpg",
      "stock_disponible": 50
    },
    "variante": null
  }
}

// Response - VARIANTE (tipo: "variante")
{
  "success": true,
  "data": {
    "tipo": "variante",
    "producto": {
      "id": "uuid",
      "nombre": "Camisa Formal",
      "imagen_url": "/uploads/camisa.jpg"
    },
    "variante": {
      "id": "uuid",
      "sku": "CAM-001-BL-S",
      "codigo_barras": "7501234567891",
      "nombre_completo": "Camisa Formal - Blanco / S",
      "precio_venta": 89.90,
      "precio_oferta": null,
      "imagen_url": "/uploads/color-blanco.jpg",
      "stock_disponible": 25
    }
  }
}
```

---

## 🔄 VARIANTES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/productos/:productoId/variantes` | Listar variantes | Usuario |
| GET | `/variantes/:id` | Obtener variante | Usuario |
| POST | `/productos/:productoId/variantes` | Crear variante | Admin |
| PUT | `/variantes/:id` | Actualizar variante | Admin |
| DELETE | `/variantes/:id` | Eliminar variante | Admin |
| POST | `/productos/:productoId/variantes/generar` | Generar combinaciones | Admin |

### PUT /variantes/:id
```typescript
// Request
{
  "sku": "CAM-001-BL-S",
  "codigo_barras": "7501234567891",
  "precio_venta": 94.90,          // null para heredar del padre
  "precio_oferta": null,
  "descripcion_corta": null,       // null para heredar
  "descripcion_larga": null,       // null para heredar
  "imagen_url": null,              // null para heredar del atributo/padre
  "activo": true
}
```

---

## 📊 INVENTARIO

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/inventario/stock` | Ver stock por sucursal | Usuario |
| GET | `/inventario/stock/:varianteId` | Stock de variante en sucursales | Usuario |
| POST | `/inventario/entrada` | Registrar entrada | Admin |
| POST | `/inventario/salida` | Registrar salida | Admin |
| POST | `/inventario/ajuste` | Ajustar stock | Admin |
| POST | `/inventario/transferencia` | Transferir entre sucursales | Admin |
| GET | `/inventario/kardex` | Obtener kardex | Usuario |
| GET | `/inventario/stock-bajo` | Productos con stock bajo | Usuario |

### GET /inventario/stock
```typescript
// Query params
?sucursal_id=uuid
&categoria_id=uuid
&stock_bajo=true
&search=camisa
&page=1
&limit=20

// Response
{
  "success": true,
  "data": [
    {
      "producto": {
        "id": "uuid",
        "nombre": "Camisa Formal",
        "sku": "CAM-001"
      },
      "variante": {
        "id": "uuid",
        "sku": "CAM-001-BL-S",
        "valores": "Blanco / S"
      },
      "stock_actual": 25,
      "stock_reservado": 2,
      "stock_disponible": 23,
      "stock_minimo": 10,
      "stock_maximo": 100,
      "estado": "normal"  // normal | bajo | agotado | exceso
    }
  ]
}
```

### POST /inventario/entrada
```typescript
// Request
{
  "sucursal_id": "uuid",
  "proveedor_id": "uuid",         // Opcional
  "tipo": "compra",               // compra | devolucion | ajuste | inicial
  "referencia": "FAC-001-2024",   // Número de factura o documento
  "observaciones": "Compra de mercadería",
  "items": [
    {
      "variante_id": "uuid",
      "cantidad": 50,
      "costo_unitario": 45.00     // Para actualizar costo promedio
    },
    {
      "variante_id": "uuid",
      "cantidad": 30,
      "costo_unitario": 45.00
    }
  ]
}
```

### POST /inventario/transferencia
```typescript
// Request
{
  "sucursal_origen_id": "uuid",
  "sucursal_destino_id": "uuid",
  "observaciones": "Transferencia a sucursal norte",
  "items": [
    { "variante_id": "uuid", "cantidad": 10 },
    { "variante_id": "uuid", "cantidad": 5 }
  ]
}
```

### GET /inventario/kardex
```typescript
// Query params
?variante_id=uuid
&sucursal_id=uuid
&fecha_inicio=2024-01-01
&fecha_fin=2024-01-31
&tipo=entrada|salida|ajuste
&page=1
&limit=50

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fecha": "2024-01-15T10:30:00Z",
      "tipo": "entrada",
      "motivo": "compra",
      "cantidad": 50,
      "stock_anterior": 25,
      "stock_nuevo": 75,
      "costo_unitario": 45.00,
      "referencia": "FAC-001-2024",
      "usuario": { "id": "uuid", "nombre": "Admin" },
      "observaciones": "Compra de mercadería"
    }
  ]
}
```

---

## 🛒 VENTAS (POS)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/ventas` | Listar ventas | Usuario |
| GET | `/ventas/:id` | Obtener venta completa | Usuario |
| POST | `/ventas` | Crear venta | Cajero |
| POST | `/ventas/:id/anular` | Anular venta | Admin |
| GET | `/ventas/:id/ticket` | Obtener HTML de ticket | Usuario |
| GET | `/ventas/:id/pdf` | Descargar PDF | Usuario |

### GET /ventas
```typescript
// Query params
?sucursal_id=uuid
&usuario_id=uuid
&cliente_id=uuid
&fecha_inicio=2024-01-01
&fecha_fin=2024-01-31
&estado=completada    // pendiente | completada | anulada
&page=1
&limit=20

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numero": "V-0001-2024",
      "fecha": "2024-01-15T14:30:00Z",
      "cliente": { "id": "uuid", "nombre": "Juan Pérez" },
      "usuario": { "id": "uuid", "nombre": "María" },
      "sucursal": { "id": "uuid", "nombre": "Principal" },
      "subtotal": 150.00,
      "descuento_total": 15.00,
      "igv": 24.30,
      "total": 159.30,
      "estado": "completada",
      "items_count": 3
    }
  ]
}
```

### POST /ventas
```typescript
// Request
{
  "cliente_id": "uuid",           // Opcional (null = cliente genérico)
  "sucursal_id": "uuid",
  "caja_id": "uuid",

  "items": [
    {
      "variante_id": "uuid",
      "cantidad": 2,
      "precio_unitario": 89.90,    // Precio al momento de la venta
      "descuento_porcentaje": 0,
      "descuento_monto": 0,
      "promocion_id": null         // Si aplica promoción
    },
    {
      "variante_id": "uuid",
      "cantidad": 1,
      "precio_unitario": 59.90,
      "descuento_porcentaje": 10,  // Descuento manual
      "descuento_monto": 5.99
    }
  ],

  "descuento_general_porcentaje": 0,
  "descuento_general_monto": 0,

  "pagos": [
    {
      "metodo_pago_id": "uuid-efectivo",
      "monto": 100.00,
      "referencia": null
    },
    {
      "metodo_pago_id": "uuid-yape",
      "monto": 134.71,
      "referencia": "YAPE-123456"  // Número de operación
    }
  ],

  "observaciones": null
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "numero": "V-0001-2024",
    "fecha": "2024-01-15T14:30:00Z",

    "subtotal": 234.71,
    "descuento_items": 5.99,
    "descuento_general": 0,
    "descuento_total": 5.99,
    "base_imponible": 228.72,
    "igv": 41.17,
    "total": 234.71,

    "vuelto": 0,                   // Calculado: pagos - total

    "estado": "completada",

    "detalles": [
      {
        "variante": { "sku": "CAM-001-BL-S", "nombre": "Camisa - Blanco/S" },
        "cantidad": 2,
        "precio_unitario": 89.90,
        "descuento": 0,
        "subtotal": 179.80
      }
    ],

    "pagos": [
      { "metodo": "Efectivo", "monto": 100.00 },
      { "metodo": "Yape", "monto": 134.71, "referencia": "YAPE-123456" }
    ]
  },
  "message": "Venta registrada exitosamente"
}
```

---

## 💰 CAJA

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/caja/estado` | Estado de caja actual | Cajero |
| POST | `/caja/abrir` | Abrir caja | Cajero |
| POST | `/caja/cerrar` | Cerrar caja | Cajero |
| POST | `/caja/movimiento` | Registrar movimiento | Cajero |
| GET | `/caja/movimientos` | Listar movimientos | Cajero |
| GET | `/caja/historial` | Historial de cajas | Admin |
| GET | `/caja/:id/resumen` | Resumen de caja cerrada | Admin |

### GET /caja/estado
```typescript
// Response
{
  "success": true,
  "data": {
    "caja_abierta": true,
    "caja": {
      "id": "uuid",
      "fecha_apertura": "2024-01-15T08:00:00Z",
      "monto_inicial": 200.00,
      "usuario_apertura": { "id": "uuid", "nombre": "María" },
      "sucursal": { "id": "uuid", "nombre": "Principal" },

      "resumen_actual": {
        "ventas_efectivo": 1500.00,
        "ventas_tarjeta": 800.00,
        "ventas_yape": 450.00,
        "ventas_transferencia": 200.00,
        "total_ventas": 2950.00,

        "entradas_efectivo": 0,
        "salidas_efectivo": 50.00,

        "efectivo_esperado": 1650.00,  // inicial + ventas_efectivo + entradas - salidas
        "cantidad_ventas": 15
      }
    }
  }
}
```

### POST /caja/abrir
```typescript
// Request
{
  "sucursal_id": "uuid",
  "monto_inicial": 200.00,
  "observaciones": "Apertura de caja matutina"
}
```

### POST /caja/cerrar
```typescript
// Request
{
  "monto_final_efectivo": 1640.00,   // Monto contado físicamente
  "observaciones": "Cierre sin novedades"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "fecha_apertura": "2024-01-15T08:00:00Z",
    "fecha_cierre": "2024-01-15T20:00:00Z",

    "monto_inicial": 200.00,
    "monto_final_esperado": 1650.00,
    "monto_final_real": 1640.00,
    "diferencia": -10.00,            // Faltante

    "resumen": {
      "total_ventas": 2950.00,
      "cantidad_ventas": 15,
      "por_metodo_pago": [
        { "metodo": "Efectivo", "monto": 1500.00 },
        { "metodo": "Tarjeta", "monto": 800.00 },
        { "metodo": "Yape", "monto": 450.00 },
        { "metodo": "Transferencia", "monto": 200.00 }
      ]
    }
  }
}
```

### POST /caja/movimiento
```typescript
// Request
{
  "tipo": "salida",               // entrada | salida
  "monto": 50.00,
  "concepto": "Compra de útiles de limpieza",
  "referencia": "BOL-001"
}
```

---

## 🎁 PROMOCIONES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/promociones` | Listar promociones | Usuario |
| GET | `/promociones/:id` | Obtener promoción | Usuario |
| POST | `/promociones` | Crear promoción | Admin |
| PUT | `/promociones/:id` | Actualizar promoción | Admin |
| DELETE | `/promociones/:id` | Eliminar promoción | Admin |
| GET | `/promociones/vigentes` | Promociones activas hoy | Usuario |
| POST | `/promociones/aplicar` | Calcular promociones para items | Usuario |

### POST /promociones
```typescript
// Request - Tipo: Compra X, lleva Y
{
  "nombre": "3x4 en Camisas",
  "descripcion": "Compra 3 camisas y llévate la 4ta GRATIS",
  "tipo": "cantidad_gratis",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-31",
  "activo": true,

  "aplica_a": "categoria",        // todos | categoria | marca | producto
  "categoria_id": "uuid-camisas",

  "condiciones": {
    "cantidad_requerida": 3,
    "cantidad_gratis": 1
  }
}

// Request - Tipo: Descuento en N-ésima unidad
{
  "nombre": "3ra unidad 50% OFF",
  "descripcion": "La tercera unidad con 50% de descuento",
  "tipo": "cantidad_descuento",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-31",
  "activo": true,

  "aplica_a": "marca",
  "marca_id": "uuid-nike",

  "condiciones": {
    "unidad_numero": 3,
    "descuento_porcentaje": 50
  }
}

// Request - Tipo: Precio fijo
{
  "nombre": "Combo Zapatillas",
  "tipo": "precio_fijo",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-31",

  "aplica_a": "productos",
  "productos": ["uuid-1", "uuid-2"],

  "condiciones": {
    "precio_combo": 199.90
  }
}

// Request - Tipo: Por monto mínimo
{
  "nombre": "10% en compras mayores a S/200",
  "tipo": "monto_minimo",
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-01-31",

  "aplica_a": "todos",

  "condiciones": {
    "monto_minimo": 200.00,
    "descuento_porcentaje": 10
  }
}
```

### POST /promociones/aplicar
```typescript
// Request - Calcula promociones aplicables al carrito
{
  "items": [
    { "variante_id": "uuid", "cantidad": 4, "precio_unitario": 89.90 },
    { "variante_id": "uuid", "cantidad": 2, "precio_unitario": 59.90 }
  ]
}

// Response
{
  "success": true,
  "data": {
    "promociones_aplicadas": [
      {
        "promocion": {
          "id": "uuid",
          "nombre": "3x4 en Camisas"
        },
        "descuento": 89.90,
        "items_afectados": [0],
        "descripcion": "1 unidad gratis"
      }
    ],
    "subtotal_original": 479.40,
    "descuento_total": 89.90,
    "subtotal_final": 389.50
  }
}
```

---

## 👤 CLIENTES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/clientes` | Listar clientes | Usuario |
| GET | `/clientes/:id` | Obtener cliente | Usuario |
| POST | `/clientes` | Crear cliente | Usuario |
| PUT | `/clientes/:id` | Actualizar cliente | Usuario |
| DELETE | `/clientes/:id` | Eliminar cliente | Admin |
| GET | `/clientes/:id/compras` | Historial de compras | Usuario |
| GET | `/clientes/buscar` | Buscar por DNI/RUC/nombre | Usuario |

### POST /clientes
```typescript
// Request
{
  "tipo_documento": "dni",        // dni | ruc | pasaporte | ce
  "numero_documento": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez García",     // Solo para personas naturales
  "razon_social": null,           // Solo para empresas (RUC)
  "email": "juan@email.com",
  "telefono": "987654321",
  "direccion": "Av. Principal 123",
  "fecha_nacimiento": "1990-05-15",
  "notas": "Cliente frecuente"
}
```

---

## 🏢 PROVEEDORES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/proveedores` | Listar proveedores | Usuario |
| GET | `/proveedores/:id` | Obtener proveedor | Usuario |
| POST | `/proveedores` | Crear proveedor | Admin |
| PUT | `/proveedores/:id` | Actualizar proveedor | Admin |
| DELETE | `/proveedores/:id` | Eliminar proveedor | Admin |

---

## 🛒 COMPRAS A PROVEEDORES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/compras` | Listar compras | Usuario |
| GET | `/compras/:id` | Obtener compra | Usuario |
| POST | `/compras` | Crear compra | Admin |
| PUT | `/compras/:id` | Actualizar compra | Admin |
| DELETE | `/compras/:id` | Eliminar compra | Admin |

### POST /compras
```typescript
// Request
{
  "proveedor_id": "uuid",
  "sucursal_id": "uuid",
  "fecha": "2024-01-15",
  "observaciones": "Compra de mercadería",
  "detalles": [
    {
      "producto_id": "uuid",           // Opcional si no está en catálogo
      "descripcion": "Pollos enteros",
      "producto_texto": "pollos",      // Lo que dijo el usuario (IA)
      "cantidad": 20,
      "precio_unitario": 5.00
    }
  ],
  "registrado_por_ia": false,
  "mensaje_original": null
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "numero": "CMP-000001",
    "proveedor": { "id": "uuid", "nombre": "Tienda X" },
    "fecha": "2024-01-15",
    "total": 100.00,
    "estado_pago": "pendiente",
    "monto_pagado": 0,
    "monto_pendiente": 100.00,
    "detalles": [...]
  }
}
```

### GET /compras
```typescript
// Query params
?proveedor_id=uuid          // Filtrar por proveedor
&estado_pago=pendiente      // pendiente | parcial | pagado
&fecha_desde=2024-01-01
&fecha_hasta=2024-01-31
&page=1&limit=20

// Response
{
  "success": true,
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

---

## 💰 PAGOS A PROVEEDORES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/pagos-proveedor` | Listar pagos | Usuario |
| GET | `/pagos-proveedor/:id` | Obtener pago | Usuario |
| POST | `/pagos-proveedor` | Registrar pago | Admin |
| DELETE | `/pagos-proveedor/:id` | Anular pago | Admin |

### POST /pagos-proveedor
```typescript
// Request
{
  "proveedor_id": "uuid",
  "compra_id": "uuid",         // Opcional: pago a compra específica
  "monto": 50.00,
  "metodo_pago": "efectivo",
  "observaciones": "Pago parcial",
  "registrado_por_ia": false,
  "mensaje_original": null
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "numero": "PAG-000001",
    "proveedor": { "id": "uuid", "nombre": "Tienda X" },
    "monto": 50.00,
    "compra": { "id": "uuid", "numero": "CMP-000001" },
    "saldo_anterior": 100.00,
    "saldo_nuevo": 50.00
  }
}
```

---

## 📊 CUENTA CORRIENTE PROVEEDORES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/proveedores/cuenta-corriente` | Resumen de deudas por proveedor | Usuario |
| GET | `/proveedores/deuda-total` | Deuda total a todos los proveedores | Usuario |
| GET | `/proveedores/:id/cuenta-corriente` | Detalle proveedor | Usuario |
| GET | `/proveedores/:id/movimientos` | Historial movimientos | Usuario |

### GET /proveedores/cuenta-corriente

```typescript
// Query params
?con_deuda=true             // Solo proveedores con saldo pendiente

// Response - Lista de proveedores con sus saldos
{
  "success": true,
  "data": [
    {
      "proveedor_id": "uuid",
      "proveedor_nombre": "Tienda X",
      "total_compras": 150.00,
      "total_pagado": 50.00,
      "saldo_pendiente": 100.00,
      "ultima_compra": "2024-01-15",
      "ultimo_pago": "2024-01-16"
    }
  ]
}
```

### GET /proveedores/deuda-total

```typescript
// Response - Resumen total de deudas
{
  "success": true,
  "data": {
    "deuda_total": 850.00,
    "total_compras": 1500.00,
    "total_pagado": 650.00,
    "proveedores_con_deuda": 3,
    "proveedores": [
      {
        "proveedor_id": "uuid",
        "proveedor_nombre": "Tienda X",
        "saldo_pendiente": 200.00,
        "ultima_compra": "2024-01-15"
      },
      {
        "proveedor_id": "uuid",
        "proveedor_nombre": "Distribuidora",
        "saldo_pendiente": 350.00,
        "ultima_compra": "2024-01-10"
      },
      {
        "proveedor_id": "uuid",
        "proveedor_nombre": "Mayorista",
        "saldo_pendiente": 300.00,
        "ultima_compra": "2024-01-17"
      }
    ]
  }
}
```

### GET /proveedores/:id/movimientos
```typescript
// Historial cronológico de compras y pagos

// Response
{
  "success": true,
  "data": {
    "proveedor": { "id": "uuid", "nombre": "Tienda X" },
    "saldo_actual": 100.00,
    "movimientos": [
      {
        "tipo": "compra",
        "fecha": "2024-01-15",
        "descripcion": "CMP-000001 - 20 pollos",
        "monto": 100.00,
        "saldo": 100.00
      },
      {
        "tipo": "pago",
        "fecha": "2024-01-16",
        "descripcion": "PAG-000001 - Pago parcial",
        "monto": -50.00,
        "saldo": 50.00
      },
      {
        "tipo": "compra",
        "fecha": "2024-01-17",
        "descripcion": "CMP-000002 - 50 cervezas",
        "monto": 10.00,
        "saldo": 60.00
      }
    ]
  }
}
```

---

## 💳 MÉTODOS DE PAGO

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/metodos-pago` | Listar métodos | Usuario |
| POST | `/metodos-pago` | Crear método | Admin |
| PUT | `/metodos-pago/:id` | Actualizar método | Admin |
| DELETE | `/metodos-pago/:id` | Eliminar método | Admin |

### GET /metodos-pago
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Efectivo",
      "tipo": "efectivo",
      "requiere_referencia": false,
      "comision_porcentaje": 0,
      "activo": true
    },
    {
      "id": "uuid",
      "nombre": "Yape",
      "tipo": "wallet",
      "requiere_referencia": true,
      "comision_porcentaje": 2.94,
      "activo": true
    },
    {
      "id": "uuid",
      "nombre": "Visa/Mastercard",
      "tipo": "tarjeta",
      "requiere_referencia": true,
      "comision_porcentaje": 3.50,
      "activo": true
    }
  ]
}
```

---

## 📊 REPORTES

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/reportes/ventas` | Reporte de ventas | Admin |
| GET | `/reportes/ventas/diario` | Ventas del día | Usuario |
| GET | `/reportes/productos/mas-vendidos` | Top productos | Admin |
| GET | `/reportes/productos/sin-rotacion` | Sin movimiento | Admin |
| GET | `/reportes/inventario/valorizado` | Inventario valorizado | Admin |
| GET | `/reportes/caja/resumen` | Resumen de cajas | Admin |
| GET | `/reportes/clientes/frecuentes` | Top clientes | Admin |
| GET | `/reportes/dashboard` | KPIs para dashboard | Admin |

### GET /reportes/ventas
```typescript
// Query params
?fecha_inicio=2024-01-01
&fecha_fin=2024-01-31
&sucursal_id=uuid
&agrupar_por=dia      // dia | semana | mes

// Response
{
  "success": true,
  "data": {
    "resumen": {
      "total_ventas": 125000.00,
      "cantidad_ventas": 450,
      "ticket_promedio": 277.78,
      "total_descuentos": 5000.00,
      "margen_bruto": 45000.00,
      "margen_porcentaje": 36
    },
    "por_periodo": [
      { "fecha": "2024-01-01", "ventas": 4500.00, "cantidad": 15 },
      { "fecha": "2024-01-02", "ventas": 3800.00, "cantidad": 12 }
    ],
    "por_categoria": [
      { "categoria": "Camisas", "ventas": 45000.00, "porcentaje": 36 },
      { "categoria": "Pantalones", "ventas": 35000.00, "porcentaje": 28 }
    ],
    "por_metodo_pago": [
      { "metodo": "Efectivo", "monto": 60000.00, "porcentaje": 48 },
      { "metodo": "Tarjeta", "monto": 40000.00, "porcentaje": 32 },
      { "metodo": "Yape", "monto": 25000.00, "porcentaje": 20 }
    ]
  }
}
```

### GET /reportes/dashboard
```typescript
// Response
{
  "success": true,
  "data": {
    "hoy": {
      "ventas": 4500.00,
      "cantidad": 15,
      "comparacion_ayer": 12.5  // Porcentaje de cambio
    },
    "mes": {
      "ventas": 125000.00,
      "cantidad": 450,
      "comparacion_mes_anterior": 8.3
    },
    "caja_actual": {
      "abierta": true,
      "efectivo_actual": 1500.00,
      "ventas_hoy": 4500.00
    },
    "alertas": {
      "stock_bajo": 12,          // Productos con stock bajo
      "sin_stock": 3             // Productos agotados
    },
    "top_productos_hoy": [
      { "nombre": "Camisa Formal", "cantidad": 8, "monto": 720.00 }
    ]
  }
}
```

---

## 📤 IMPORT/EXPORT

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/import-export/template/productos` | Descargar template Excel | Admin |
| POST | `/import-export/productos/validar` | Validar archivo | Admin |
| POST | `/import-export/productos/importar` | Importar productos | Admin |
| GET | `/import-export/productos/exportar` | Exportar a Excel | Admin |

### POST /import-export/productos/validar
```typescript
// Request: multipart/form-data
// file: archivo.xlsx

// Response
{
  "success": true,
  "data": {
    "total_filas": 100,
    "filas_validas": 95,
    "filas_con_error": 5,
    "errores": [
      { "fila": 10, "campo": "precio_venta", "error": "Debe ser un número positivo" },
      { "fila": 25, "campo": "categoria", "error": "Categoría 'Otros' no existe" }
    ],
    "preview": [
      { "nombre": "Producto 1", "sku": "PRD-001", "precio": 99.90, "valido": true }
    ]
  }
}
```

---

## 🖨️ IMPRESIÓN

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/impresion/ticket/:ventaId` | HTML de ticket | Usuario |
| GET | `/impresion/ticket/:ventaId/pdf` | PDF de ticket | Usuario |
| GET | `/impresion/configuracion` | Config de impresión | Admin |
| PUT | `/impresion/configuracion` | Actualizar config | Admin |

---

## 🌐 SEO (Landing Pública)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/seo/config` | Obtener config SEO | Admin |
| PUT | `/seo/config` | Actualizar config SEO | Admin |
| GET | `/public/landing` | Datos para landing | Público |
| GET | `/public/productos` | Catálogo público | Público |
| GET | `/public/productos/:slug` | Detalle producto público | Público |

---

## 📁 UPLOADS

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| POST | `/uploads/imagen` | Subir imagen genérica | Usuario |
| POST | `/uploads/producto/:id` | Subir imagen de producto | Admin |
| DELETE | `/uploads/:id` | Eliminar archivo | Admin |

### POST /uploads/imagen
```typescript
// Request: multipart/form-data
// file: imagen.jpg
// carpeta: productos | categorias | marcas | empresas

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "/uploads/productos/imagen-123.jpg",
    "thumbnail_url": "/uploads/productos/imagen-123-thumb.jpg",
    "mime_type": "image/jpeg",
    "size": 125000
  }
}
```

---

## 🧾 FACTURACIÓN ELECTRÓNICA (⭐ NUEVO - Addon)

> **Nota:** Estos endpoints solo están disponibles si la empresa tiene `addon_facturacion = true`

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/facturacion/config` | Obtener configuración | Admin |
| PUT | `/facturacion/config` | Actualizar configuración | Admin |
| POST | `/facturacion/config/validar` | Validar credenciales con proveedor | Admin |
| GET | `/facturacion/comprobantes` | Listar comprobantes | Usuario |
| GET | `/facturacion/comprobantes/:id` | Obtener comprobante | Usuario |
| POST | `/facturacion/comprobantes` | Crear y enviar comprobante | Cajero |
| POST | `/facturacion/comprobantes/:id/reenviar` | Reenviar a SUNAT | Admin |
| GET | `/facturacion/comprobantes/:id/pdf` | Descargar PDF | Usuario |
| GET | `/facturacion/comprobantes/:id/xml` | Descargar XML | Admin |
| POST | `/facturacion/resumen-diario` | Generar resumen de boletas | Admin |
| GET | `/facturacion/resumen-diario` | Listar resúmenes | Admin |
| GET | `/facturacion/resumen-diario/:id/estado` | Consultar estado en SUNAT | Admin |
| GET | `/facturacion/dashboard` | Dashboard de facturación | Admin |

### PUT /facturacion/config
```typescript
// Request
{
  "proveedor": "nubefact",              // nubefact | sunat_api
  "modo": "produccion",                 // demo | produccion
  "api_token": "mi-token-secreto",

  "ruc_emisor": "20123456789",
  "razon_social_emisor": "MI EMPRESA SAC",
  "nombre_comercial_emisor": "MI TIENDA",
  "direccion_emisor": "AV. PRINCIPAL 123",
  "ubigeo_emisor": "150101",
  "departamento_emisor": "LIMA",
  "provincia_emisor": "LIMA",
  "distrito_emisor": "LIMA",

  "serie_factura": "F001",
  "serie_boleta": "B001",
  "serie_nota_credito_f": "FC01",
  "serie_nota_credito_b": "BC01",

  "envio_automatico": true,
  "resumen_diario_hora": "23:00"
}
```

### POST /facturacion/comprobantes
```typescript
// Request - Crear Factura
{
  "venta_id": "uuid-venta",             // Venta origen
  "tipo_comprobante": "01",             // 01=Factura, 03=Boleta

  "cliente_tipo_documento": "6",        // 1=DNI, 6=RUC
  "cliente_documento": "20987654321",
  "cliente_nombre": "EMPRESA CLIENTE SAC",
  "cliente_direccion": "AV. SECUNDARIA 456",
  "cliente_email": "cliente@empresa.com"
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "tipo_comprobante": "01",
    "serie": "F001",
    "numero": 125,
    "numero_completo": "F001-00000125",

    "subtotal": 100.00,
    "igv": 18.00,
    "total": 118.00,

    "estado": "aceptado",
    "hash_cpe": "xYz123...",
    "codigo_respuesta": "0",
    "descripcion_respuesta": "La Factura ha sido aceptada",

    "pdf_url": "/api/facturacion/comprobantes/uuid/pdf",
    "cadena_qr": "20123456789|01|F001|125|18.00|118.00|..."
  }
}
```

### GET /facturacion/dashboard
```typescript
// Response
{
  "success": true,
  "data": {
    "hoy": {
      "emitidos": 125,
      "aceptados": 89,
      "en_resumen": 36,
      "rechazados": 0
    },
    "resumen_pendiente": {
      "fecha": "2024-01-15",
      "cantidad_boletas": 36,
      "total": 4523.00,
      "proximo_envio": "2024-01-15T23:00:00Z"
    },
    "ultimos_comprobantes": [
      {
        "id": "uuid",
        "tipo": "Factura",
        "numero_completo": "F001-00000125",
        "cliente_nombre": "EMPRESA SAC",
        "total": 590.00,
        "estado": "aceptado"
      }
    ]
  }
}
```

---

## 🔗 CATEGORÍA-ATRIBUTOS (⭐ NUEVO)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/categorias/:id/atributos` | Listar atributos de categoría | Usuario |
| POST | `/categorias/:id/atributos` | Vincular atributo a categoría | Admin |
| DELETE | `/categorias/:id/atributos/:atributoId` | Desvincular atributo | Admin |
| PUT | `/categorias/:id/atributos/orden` | Reordenar atributos | Admin |

### GET /categorias/:id/atributos
```typescript
// Response - Atributos vinculados a la categoría
{
  "success": true,
  "data": {
    "categoria": {
      "id": "uuid",
      "nombre": "Zapatillas"
    },
    "atributos_vinculados": [
      {
        "id": "uuid",
        "atributo": {
          "id": "uuid-talla",
          "nombre": "Talla",
          "tipo_visual": "button",
          "tipo_sistema": "dinamico"
        },
        "obligatorio": true,
        "orden": 1
      },
      {
        "id": "uuid",
        "atributo": {
          "id": "uuid-color",
          "nombre": "Color",
          "tipo_visual": "color",
          "tipo_sistema": "dinamico"
        },
        "obligatorio": true,
        "orden": 2
      }
    ],
    "atributos_disponibles": [
      // Atributos que NO están vinculados a esta categoría
      {
        "id": "uuid-vencimiento",
        "nombre": "Fecha de Vencimiento",
        "tipo_visual": "date",
        "tipo_sistema": "fecha_vencimiento",
        "usado_en": ["Medicamentos", "Alimentos"]
      },
      {
        "id": "uuid-material",
        "nombre": "Material",
        "tipo_visual": "select",
        "tipo_sistema": "dinamico",
        "usado_en": ["Ropa"]
      }
    ]
  }
}
```

### POST /categorias/:id/atributos
```typescript
// Request - Vincular atributo existente
{
  "atributo_id": "uuid-vencimiento",
  "obligatorio": false,
  "orden": 3
}

// Request - Crear y vincular nuevo atributo
{
  "crear_nuevo": true,
  "nombre": "Estilo",
  "tipo_visual": "select",
  "tipo_sistema": "dinamico",
  "genera_variante": false,
  "valores": ["Casual", "Deportivo", "Formal"],
  "obligatorio": false
}
```

---

## 🏷️ PLANTILLAS DE NICHO (⭐ NUEVO - Onboarding)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/plantillas-nicho` | Listar plantillas disponibles | Público |
| GET | `/plantillas-nicho/:slug` | Obtener plantilla con atributos | Público |

### GET /plantillas-nicho
```typescript
// Response - Para pantalla de onboarding
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "Moda y Ropa",
      "slug": "moda",
      "descripcion": "Tiendas de ropa, calzado y accesorios",
      "icono": "Shirt",
      "destacado": true,
      "atributos_incluidos": ["Talla", "Color", "Material"]
    },
    {
      "id": "uuid",
      "nombre": "Farmacia",
      "slug": "farmacia",
      "descripcion": "Farmacias y boticas con control de vencimiento",
      "icono": "Pill",
      "atributos_incluidos": ["Fecha de Vencimiento", "Lote", "Presentación"]
    }
  ]
}
```

---

## 📱 WHATSAPP / AGENTE IA (⭐ NUEVO - Addon)

| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/whatsapp/config` | Obtener configuración WhatsApp | admin |
| POST | `/whatsapp/config` | Crear/actualizar configuración | admin |
| GET | `/whatsapp/qr` | Obtener QR para conexión | admin |
| POST | `/whatsapp/conectar` | Iniciar conexión WhatsApp | admin |
| POST | `/whatsapp/desconectar` | Desconectar WhatsApp | admin |
| GET | `/whatsapp/estado` | Estado de conexión | admin |
| GET | `/agente-ia/uso` | Ver uso del agente IA (mes actual) | admin |
| GET | `/agente-ia/uso/:periodo` | Ver uso por periodo (YYYY-MM) | admin |
| POST | `/agente-ia/config` | Configurar agente IA | admin |
| POST | `/webhook/whatsapp` | Webhook Evolution API (interno) | Sistema |

### GET /whatsapp/config
```typescript
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "instanciaNombre": "empresa-tienda-xyz",
    "instanciaEstado": "conectado", // pendiente, conectado, desconectado
    "telefonoConectado": "+51987654321",
    "ultimaConexion": "2025-01-10T15:30:00Z",
    "agenteIaActivo": true,
    "agenteModo": "hibrido", // texto, audio, hibrido
    "agenteProvider": "groq", // groq, openai
    "limiteMensajesDia": 200,
    "limiteAudioMinDia": 60,
    "mensajesHoy": 45,
    "audioMinutosHoy": 12
  }
}
```

### POST /whatsapp/config
```typescript
// Request
{
  "agenteIaActivo": true,
  "agenteModo": "hibrido",
  "agenteProvider": "groq"
}

// Response
{
  "success": true,
  "data": { /* config actualizada */ },
  "message": "Configuración actualizada"
}
```

### GET /whatsapp/qr
```typescript
// Response
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgo...",
    "expiraEn": 120, // segundos
    "estado": "esperando_escaneo"
  }
}
```

### GET /agente-ia/uso
```typescript
// Response - Uso del mes actual
{
  "success": true,
  "data": {
    "periodo": "2025-01",
    "totales": {
      "mensajesTexto": 1250,
      "mensajesAudio": 320,
      "audioSegundos": 9600,
      "tokensConsumidos": 450000
    },
    "acciones": {
      "inventarioEntradas": 89,
      "inventarioConsultas": 156,
      "ventasConsultadas": 45,
      "alertasEnviadas": 12
    },
    "providers": {
      "groqRequests": 1520,
      "openaiRequests": 50
    },
    "limite": {
      "mensajesTexto": 6000,
      "audioMinutos": 1800,
      "porcentajeUsado": 26
    }
  }
}
```

---

## 🌐 LANDING PAGE (⭐ NUEVO)

### Endpoints Públicos (sin auth)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/t/:subdominio` | Datos landing completa | No |
| GET | `/t/:subdominio/productos` | Productos destacados | No |
| GET | `/t/:subdominio/qr/:productoId` | Info producto por QR | No |
| POST | `/t/:subdominio/contacto` | Enviar formulario contacto | No |

### Endpoints Admin
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/landing/config` | Obtener config landing | admin |
| PUT | `/landing/config` | Actualizar config landing | admin |
| GET | `/landing/secciones` | Listar secciones | admin |
| POST | `/landing/secciones` | Crear sección | admin |
| PUT | `/landing/secciones/:id` | Actualizar sección | admin |
| DELETE | `/landing/secciones/:id` | Eliminar sección | admin |
| PUT | `/landing/secciones/orden` | Reordenar secciones | admin |
| GET | `/landing/testimonios` | Listar testimonios | admin |
| POST | `/landing/testimonios` | Crear testimonio | admin |
| PUT | `/landing/testimonios/:id` | Actualizar testimonio | admin |
| DELETE | `/landing/testimonios/:id` | Eliminar testimonio | admin |
| GET | `/landing/contactos` | Listar contactos/leads | admin |
| PUT | `/landing/contactos/:id` | Actualizar estado contacto | admin |
| GET | `/landing/qr/generate` | Generar QR landing | admin |
| GET | `/landing/qr/producto/:id` | Generar QR producto | admin |

### GET /t/:subdominio
```typescript
// Response - Landing pública
{
  "success": true,
  "data": {
    "empresa": {
      "nombreComercial": "Tienda Fashion",
      "logo": "https://cdn.../logo.png",
      "colorPrimario": "#3B82F6",
      "colorSecundario": "#1E40AF",
      "slogan": "Tu estilo, tu moda"
    },
    "seo": {
      "titulo": "Tienda Fashion - Moda en Lima",
      "descripcion": "La mejor tienda de moda en Lima",
      "ogImagen": "https://cdn.../og.jpg"
    },
    "tracking": {
      "ga4Id": "G-XXXXXXXXXX",
      "metaPixelId": "1234567890",
      "tiktokPixelId": "XXXXXXXXXX"
    },
    "secciones": [
      {
        "tipo": "hero",
        "titulo": "Nueva Colección 2025",
        "subtitulo": "Descubre las últimas tendencias",
        "imagenUrl": "https://cdn.../hero.jpg",
        "botonTexto": "Ver Colección",
        "botonUrl": "/productos",
        "estilo": "gradient"
      },
      {
        "tipo": "products",
        "titulo": "Productos Destacados"
      }
    ],
    "testimonios": [
      {
        "nombreCliente": "María García",
        "testimonio": "Excelente calidad y atención",
        "rating": 5,
        "avatarUrl": "https://cdn.../avatar.jpg"
      }
    ],
    "contacto": {
      "whatsapp": "+51987654321",
      "email": "contacto@tienda.com",
      "direccion": "Av. Principal 123, Lima"
    }
  }
}
```

### POST /t/:subdominio/contacto
```typescript
// Request
{
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "987654321",
  "mensaje": "Me interesa el producto X",
  "utmSource": "facebook",
  "utmMedium": "cpc",
  "utmCampaign": "verano2025"
}

// Response
{
  "success": true,
  "message": "Mensaje enviado correctamente"
}
```

### POST /landing/secciones
```typescript
// Request
{
  "tipo": "hero", // hero, features, products, testimonials, contact, cta, gallery, about
  "orden": 1,
  "titulo": "Bienvenido",
  "subtitulo": "Tu tienda de confianza",
  "contenido": "Texto largo...",
  "imagenUrl": "https://cdn.../imagen.jpg",
  "botonTexto": "Ver más",
  "botonUrl": "/productos",
  "botonWhatsapp": false,
  "colorFondo": "#FFFFFF",
  "colorTexto": "#000000",
  "estilo": "default"
}

// Response
{
  "success": true,
  "data": { /* sección creada */ }
}
```

---

## 💳 PLANES Y SUSCRIPCIONES (⭐ NUEVO - Billing)

### Endpoints Públicos
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/planes` | Listar planes disponibles | No |
| GET | `/addons` | Listar addons disponibles | No |

### Endpoints Admin
| Método | Endpoint | Descripción | Rol |
|--------|----------|-------------|-----|
| GET | `/suscripcion` | Ver suscripción actual | admin |
| POST | `/suscripcion/upgrade` | Cambiar de plan | admin |
| POST | `/suscripcion/addon` | Agregar addon | admin |
| DELETE | `/suscripcion/addon/:id` | Quitar addon | admin |
| POST | `/suscripcion/cancelar` | Cancelar suscripción | admin |
| GET | `/pagos` | Historial de pagos | admin |
| GET | `/pagos/:id` | Detalle de pago | admin |
| GET | `/pagos/:id/factura` | Descargar factura PDF | admin |

### Endpoints Stripe
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/stripe/checkout` | Crear sesión de checkout | admin |
| POST | `/stripe/portal` | Crear portal de cliente | admin |
| POST | `/webhook/stripe` | Webhook Stripe (interno) | Sistema |

### Endpoints PayPal
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/paypal/create-subscription` | Crear suscripción PayPal | admin |
| POST | `/paypal/capture` | Capturar pago | admin |
| POST | `/webhook/paypal` | Webhook PayPal (interno) | Sistema |

### GET /planes
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "basico",
      "nombre": "Plan Básico",
      "descripcion": "Perfecto para empezar",
      "precioMensual": 18.00,
      "precioAnual": 180.00,
      "moneda": "USD",
      "limites": {
        "maxSucursales": 1,
        "maxUsuarios": 2,
        "maxProductos": 500,
        "maxVentasMes": 1000
      },
      "features": {
        "incluyeReportes": true,
        "incluyeMultimoneda": false,
        "incluyeApi": false,
        "incluyeSoportePrioritario": false
      }
    },
    {
      "id": "uuid",
      "codigo": "profesional",
      "nombre": "Plan Profesional",
      "descripcion": "Para negocios en crecimiento",
      "precioMensual": 35.00,
      "precioAnual": 350.00,
      "moneda": "USD",
      "limites": {
        "maxSucursales": 3,
        "maxUsuarios": 10,
        "maxProductos": 5000,
        "maxVentasMes": 10000
      },
      "features": {
        "incluyeReportes": true,
        "incluyeMultimoneda": true,
        "incluyeApi": true,
        "incluyeSoportePrioritario": false
      }
    }
  ]
}
```

### GET /addons
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "facturacion",
      "nombre": "Facturación Electrónica",
      "descripcion": "Boletas y facturas SUNAT",
      "precioMensual": 5.00,
      "categoria": "integracion"
    },
    {
      "id": "uuid",
      "codigo": "agente_ia",
      "nombre": "Agente IA WhatsApp",
      "descripcion": "Inventario por voz/texto",
      "precioMensual": 2.00,
      "categoria": "automatizacion"
    }
  ]
}
```

### GET /suscripcion
```typescript
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "plan": {
      "codigo": "profesional",
      "nombre": "Plan Profesional"
    },
    "ciclo": "mensual",
    "precioBase": 35.00,
    "precioAddons": 7.00,
    "precioTotal": 42.00,
    "moneda": "USD",
    "fechaInicio": "2025-01-01T00:00:00Z",
    "fechaProximoCobro": "2025-02-01T00:00:00Z",
    "estado": "activa",
    "gateway": "stripe",
    "metodoPago": {
      "tipo": "card",
      "ultimos4": "4242",
      "marca": "visa"
    },
    "addons": [
      {
        "codigo": "facturacion",
        "nombre": "Facturación Electrónica",
        "precio": 5.00,
        "fechaActivacion": "2025-01-01T00:00:00Z"
      },
      {
        "codigo": "agente_ia",
        "nombre": "Agente IA WhatsApp",
        "precio": 2.00,
        "fechaActivacion": "2025-01-05T00:00:00Z"
      }
    ]
  }
}
```

### POST /stripe/checkout
```typescript
// Request
{
  "planId": "uuid",
  "ciclo": "mensual", // mensual, anual
  "addonIds": ["uuid1", "uuid2"],
  "successUrl": "https://app.tupos.com/billing/success",
  "cancelUrl": "https://app.tupos.com/billing/cancel"
}

// Response
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_xxxxx",
    "sessionId": "cs_xxxxx"
  }
}
```

### POST /suscripcion/addon
```typescript
// Request
{
  "addonId": "uuid"
}

// Response
{
  "success": true,
  "data": {
    "addon": {
      "codigo": "agente_ia",
      "nombre": "Agente IA WhatsApp",
      "precio": 2.00
    },
    "nuevoTotal": 44.00
  },
  "message": "Addon agregado correctamente"
}
```

### GET /pagos
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numero": "PAY-2025-00001",
      "concepto": "Plan Profesional + Addons - Enero 2025",
      "monto": 42.00,
      "moneda": "USD",
      "estado": "completado",
      "fechaPago": "2025-01-01T00:00:00Z",
      "gateway": "stripe",
      "metodoPago": "visa ****4242",
      "facturaUrl": "https://pay.stripe.com/invoice/xxxxx"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

## 🔐 GESTIÓN DE ROLES Y PERMISOS (⭐ NUEVO - RBAC)

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/roles` | Listar roles disponibles | `config.usuarios` |
| POST | `/roles` | Crear rol personalizado | `config.roles` |
| GET | `/roles/:id` | Ver detalle de rol con permisos | `config.roles` |
| PUT | `/roles/:id` | Editar rol personalizado | `config.roles` |
| DELETE | `/roles/:id` | Eliminar rol personalizado | `config.roles` |
| GET | `/permisos` | Listar todos los permisos | `config.roles` |
| GET | `/permisos/modulos` | Listar permisos agrupados por módulo | `config.roles` |
| PUT | `/usuarios/:id/rol` | Cambiar rol de usuario | `config.usuarios` |
| PUT | `/usuarios/:id/permisos-especiales` | Asignar permisos extra | `config.usuarios` |
| GET | `/usuarios/:id/permisos` | Ver permisos efectivos del usuario | `config.usuarios` |
| GET | `/auditoria/roles` | Ver historial de cambios de roles | `config.roles` |

### GET /roles
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "admin",
      "nombre": "Administrador",
      "descripcion": "Control total de la empresa",
      "nivel": 90,
      "esSistema": true,
      "cantidadUsuarios": 2
    },
    {
      "id": "uuid",
      "codigo": "encargado_turno",
      "nombre": "Encargado de Turno",
      "descripcion": "Cajero con permisos extra",
      "nivel": 60,
      "esSistema": false,
      "cantidadUsuarios": 3
    }
  ]
}
```

### POST /roles
```typescript
// Request - Crear rol personalizado
{
  "codigo": "encargado_turno",
  "nombre": "Encargado de Turno",
  "descripcion": "Cajero con permisos de supervisor parcial",
  "nivel": 60,
  "permisos": [
    "productos.ver",
    "productos.crear",
    "ventas.crear",
    "ventas.ver",
    "ventas.ver_todas",
    "caja.apertura",
    "caja.cierre",
    "reportes.ventas"
  ],
  "configuracion": {
    "descuentoMaximo": 25,
    "puedeAnularVenta": false
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "codigo": "encargado_turno",
    "nombre": "Encargado de Turno"
  },
  "message": "Rol creado correctamente"
}
```

### PUT /usuarios/:id/rol
```typescript
// Request - Cambiar rol (ascender/degradar)
{
  "rolId": "uuid-del-nuevo-rol",
  "motivo": "Promoción por buen desempeño"
}

// Response
{
  "success": true,
  "data": {
    "usuario": {
      "id": "uuid",
      "nombre": "Juan Pérez",
      "rolAnterior": { "codigo": "cajero", "nombre": "Cajero" },
      "rolNuevo": { "codigo": "supervisor", "nombre": "Supervisor" }
    }
  },
  "message": "Rol actualizado correctamente"
}
```

### PUT /usuarios/:id/permisos-especiales
```typescript
// Request - Override permisos del rol
{
  "descuentoMaximo": 20,
  "puedeAnularVenta": true,
  "puedeVerCostos": false,
  "permisosExtra": [
    "inventario.ver",
    "reportes.ventas"
  ]
}

// Response
{
  "success": true,
  "data": {
    "permisosEfectivos": ["ventas.crear", "ventas.ver", "inventario.ver", "reportes.ventas"],
    "descuentoMaximo": 20,
    "puedeAnularVenta": true
  },
  "message": "Permisos especiales actualizados"
}
```

### GET /usuarios/:id/permisos
```typescript
// Response - Permisos efectivos (rol + especiales)
{
  "success": true,
  "data": {
    "rol": {
      "codigo": "cajero",
      "nombre": "Cajero",
      "nivel": 50
    },
    "permisosDelRol": [
      "ventas.crear",
      "ventas.ver",
      "caja.apertura",
      "caja.cierre"
    ],
    "permisosEspeciales": [
      "inventario.ver",
      "reportes.ventas"
    ],
    "permisosEfectivos": [
      "ventas.crear",
      "ventas.ver",
      "caja.apertura",
      "caja.cierre",
      "inventario.ver",
      "reportes.ventas"
    ],
    "configuracion": {
      "descuentoMaximo": 20,
      "puedeAnularVenta": true,
      "puedeVerCostos": false
    }
  }
}
```

---

## 📋 AUDITORÍA GENERAL (⭐ NUEVO)

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/auditoria` | Listar acciones de MI empresa | `config.auditoria` |
| GET | `/auditoria/:id` | Ver detalle de acción | `config.auditoria` |
| GET | `/auditoria/exportar` | Exportar a Excel | `config.auditoria` |
| GET | `/auditoria/estadisticas` | Stats por módulo/usuario | `config.auditoria` |

### GET /auditoria

```typescript
// Query params
?modulo=ventas          // Filtrar por módulo
&accion=anular          // Filtrar por acción
&usuario_id=uuid        // Filtrar por usuario
&fecha_desde=2025-01-01
&fecha_hasta=2025-01-31
&page=1
&limit=50

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "usuario": {
        "id": "uuid",
        "nombre": "María García",
        "rol": "supervisor"
      },
      "modulo": "ventas",
      "accion": "anular",
      "descripcion": "Anuló venta #V-001234 por S/150.00 - Motivo: Devolución",
      "entidad": {
        "tipo": "venta",
        "id": "uuid-venta"
      },
      "sucursal": "Sucursal Norte",
      "ip_address": "192.168.1.100",
      "exitoso": true,
      "created_at": "2025-01-10T10:45:00Z"
    }
  ],
  "pagination": {
    "total": 1234,
    "page": 1,
    "limit": 50
  }
}
```

### GET /auditoria/:id

```typescript
// Response - Detalle con datos completos
{
  "success": true,
  "data": {
    "id": "uuid",
    "usuario": { "nombre": "María García", "rol": "supervisor" },
    "modulo": "productos",
    "accion": "editar",
    "descripcion": "Editó producto 'Camiseta Básica' - Cambió precio",
    "datos_anteriores": {
      "precio_venta": 25.00,
      "nombre": "Camiseta Básica"
    },
    "datos_nuevos": {
      "precio_venta": 29.90,
      "nombre": "Camiseta Básica"
    },
    "created_at": "2025-01-10T10:45:00Z"
  }
}
```

---

## 👑 SUPER ADMIN (⭐ NUEVO - Panel del dueño del SaaS)

> Estos endpoints son EXCLUSIVOS del Super Admin (nivel 100)

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/super-admin/dashboard` | Métricas globales del SaaS | Super Admin |
| GET | `/super-admin/empresas` | Listar todas las empresas | Super Admin |
| GET | `/super-admin/empresas/:id` | Detalle de empresa | Super Admin |
| PUT | `/super-admin/empresas/:id/estado` | Suspender/Activar empresa | Super Admin |
| DELETE | `/super-admin/empresas/:id` | Eliminar empresa | Super Admin |
| POST | `/super-admin/impersonate` | Acceder como admin de empresa | Super Admin |
| GET | `/super-admin/auditoria` | Log global de todas las empresas | Super Admin |
| GET | `/super-admin/billing` | Ingresos y pagos globales | Super Admin |
| GET | `/super-admin/planes` | Listar todos los planes | Super Admin |
| POST | `/super-admin/planes` | Crear nuevo plan | Super Admin |
| PUT | `/super-admin/planes/:id` | Editar plan (nombre, precio, límites) | Super Admin |
| DELETE | `/super-admin/planes/:id` | Eliminar plan (si no tiene suscripciones) | Super Admin |
| POST | `/super-admin/planes/:id/sync-gateways` | Sincronizar precios con Stripe/PayPal | Super Admin |
| GET | `/super-admin/addons` | Listar todos los addons | Super Admin |
| POST | `/super-admin/addons` | Crear nuevo addon | Super Admin |
| PUT | `/super-admin/addons/:id` | Editar addon | Super Admin |
| DELETE | `/super-admin/addons/:id` | Eliminar addon | Super Admin |
| POST | `/super-admin/addons/:id/sync-gateways` | Sincronizar con Stripe/PayPal | Super Admin |
| GET | `/super-admin/errores` | Logs de errores del sistema | Super Admin |

### GET /super-admin/dashboard

```typescript
// Response - Métricas globales
{
  "success": true,
  "data": {
    "mrr": 15250.00,
    "arr": 183000.00,
    "empresas": {
      "activas": 342,
      "trial": 45,
      "suspendidas": 3,
      "total": 390
    },
    "usuarios": {
      "totales": 1250,
      "activos_hoy": 189
    },
    "metricas": {
      "churn_mensual": 2.3,
      "ltv_promedio": 450.00,
      "arpu": 44.60
    },
    "addons_populares": [
      { "addon": "facturacion", "cantidad": 120, "mrr": 600 },
      { "addon": "woocommerce", "cantidad": 45, "mrr": 360 },
      { "addon": "agente_ia", "cantidad": 89, "mrr": 178 }
    ],
    "planes_distribucion": {
      "trial": 45,
      "basico": 180,
      "emprendedor": 95,
      "profesional": 22
    }
  }
}
```

### POST /super-admin/impersonate

```typescript
// Request - Acceder como admin de una empresa
{
  "empresa_id": "uuid-empresa",
  "usuario_id": "uuid-usuario",  // Opcional, default = admin de la empresa
  "motivo": "Soporte ticket #1234"
}

// Response
{
  "success": true,
  "data": {
    "token": "jwt-temporal-1-hora",
    "expira": "2025-01-11T15:00:00Z",
    "empresa": {
      "id": "uuid",
      "nombre": "Farmacia San Juan"
    },
    "usuario_impersonado": {
      "id": "uuid",
      "nombre": "Juan Admin",
      "rol": "admin"
    }
  },
  "warning": "Todas las acciones quedan registradas en auditoría"
}
```

### PUT /super-admin/empresas/:id/estado

```typescript
// Request - Suspender empresa
{
  "estado": "suspendida",  // activa, suspendida, eliminada
  "motivo": "Pago vencido hace 30 días",
  "notificar": true        // Enviar email al admin
}

// Response
{
  "success": true,
  "mensaje": "Empresa suspendida correctamente",
  "notificacion_enviada": true
}
```

### GET /super-admin/planes

```typescript
// Response - Lista de planes con estadísticas
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "codigo": "emprendedor",
      "nombre": "Emprendedor",
      "descripcion": "Para negocios en crecimiento",
      "precio_mensual": 25.00,
      "precio_anual": 250.00,
      "moneda": "USD",
      "max_sucursales": 2,
      "max_usuarios": 5,
      "max_productos": 2000,
      "caracteristicas": ["2 sucursales", "5 usuarios", "1 integración e-commerce"],
      "stripe_price_id_mensual": "price_1234",
      "stripe_price_id_anual": "price_5678",
      "paypal_plan_id_mensual": "P-12345",
      "activo": true,
      "orden": 2,
      "destacado": true,
      // Estadísticas en tiempo real
      "estadisticas": {
        "suscripciones_activas": 95,
        "mrr": 2375.00,
        "nuevos_ultimo_mes": 12
      }
    }
  ]
}
```

### POST /super-admin/planes

```typescript
// Request - Crear nuevo plan
{
  "codigo": "starter",
  "nombre": "Starter",
  "descripcion": "Ideal para probar",
  "precio_mensual": 12.00,
  "precio_anual": 120.00,
  "max_sucursales": 1,
  "max_usuarios": 2,
  "max_productos": 200,
  "caracteristicas": ["1 sucursal", "2 usuarios", "200 productos"],
  "orden": 1,
  "activo": true
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid-nuevo-plan",
    "codigo": "starter",
    "stripe_synced": false,  // Necesita sincronizar
    "paypal_synced": false
  },
  "message": "Plan creado. Ejecuta sync-gateways para habilitar pagos"
}
```

### PUT /super-admin/planes/:id

```typescript
// Request - Editar precio (afecta SOLO nuevos suscriptores)
{
  "precio_mensual": 15.00,
  "precio_anual": 150.00,
  "max_productos": 300
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "cambios": {
      "precio_mensual": { "anterior": 12.00, "nuevo": 15.00 },
      "precio_anual": { "anterior": 120.00, "nuevo": 150.00 }
    },
    "sync_requerido": true,  // Precios cambiaron, necesita sync
    "suscripciones_actuales": 45  // NO se afectan
  },
  "warning": "Los suscriptores actuales mantienen su precio. Sincroniza con Stripe/PayPal para aplicar nuevos precios"
}
```

### POST /super-admin/planes/:id/sync-gateways

```typescript
// Request - Sincronizar con pasarelas de pago
{
  "stripe": true,
  "paypal": true
}

// Response
{
  "success": true,
  "data": {
    "stripe": {
      "synced": true,
      "price_id_mensual": "price_new123",
      "price_id_anual": "price_new456"
    },
    "paypal": {
      "synced": true,
      "plan_id_mensual": "P-new789",
      "plan_id_anual": "P-new012"
    }
  },
  "message": "Precios sincronizados con Stripe y PayPal"
}
```

### PUT /super-admin/addons/:id

```typescript
// Request - Editar addon
{
  "nombre": "Agente IA Pro",
  "precio_mensual": 6.00,  // Subir de $5 a $6
  "caracteristicas": ["200 min audio/mes", "500 mensajes/mes", "Alertas automáticas"]
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "cambios": {
      "precio_mensual": { "anterior": 5.00, "nuevo": 6.00 }
    },
    "suscripciones_actuales": 89,  // Mantienen precio anterior
    "sync_requerido": true
  }
}
```

---

## 🛒 INTEGRACIONES E-COMMERCE (⭐ NUEVO - Addon)

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| GET | `/integraciones/ecommerce` | Listar integraciones | `config.integraciones` |
| POST | `/integraciones/ecommerce` | Crear integración | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id` | Ver detalle | `config.integraciones` |
| PUT | `/integraciones/ecommerce/:id` | Actualizar config | `config.integraciones` |
| DELETE | `/integraciones/ecommerce/:id` | Eliminar integración | `config.integraciones` |
| POST | `/integraciones/ecommerce/:id/test` | Probar conexión | `config.integraciones` |
| POST | `/integraciones/ecommerce/:id/sync` | Forzar sincronización | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id/logs` | Ver logs de sync | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id/productos` | Ver productos sincronizados | `config.integraciones` |
| GET | `/integraciones/ecommerce/:id/pedidos` | Ver pedidos importados | `config.integraciones` |
| POST | `/webhook/woocommerce/:empresaId` | Webhook WooCommerce | Sistema |
| POST | `/webhook/shopify/:empresaId` | Webhook Shopify | Sistema |

### POST /integraciones/ecommerce
```typescript
// Request - Crear integración WooCommerce
{
  "plataforma": "woocommerce",
  "nombre": "Mi Tienda WordPress",
  "config": {
    "storeUrl": "https://mitienda.com",
    "consumerKey": "ck_xxxxxxxxxxxxx",
    "consumerSecret": "cs_xxxxxxxxxxxxx"
  },
  "sincronizacion": {
    "productos": true,
    "stock": true,
    "pedidos": true,
    "intervaloMinutos": 15
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "plataforma": "woocommerce",
    "estado": "configurando",
    "mensaje": "Conexión establecida. Configure el mapeo de categorías."
  }
}
```

### POST /integraciones/ecommerce/:id/test
```typescript
// Response
{
  "success": true,
  "data": {
    "conexion": "exitosa",
    "version": "wc/v3",
    "tienda": "Mi Tienda",
    "productosEnTienda": 234,
    "pedidosPendientes": 5
  }
}
```

### POST /integraciones/ecommerce/:id/sync
```typescript
// Request
{
  "tipo": "completa",  // completa, productos, stock, pedidos
  "direccion": "bidireccional"
}

// Response
{
  "success": true,
  "data": {
    "productosActualizados": 45,
    "productosCreados": 12,
    "stockActualizado": 120,
    "pedidosImportados": 3,
    "errores": []
  }
}
```

### GET /integraciones/ecommerce/:id/pedidos
```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "externalOrderId": "WC-1234",
      "externalOrderNumber": "#1234",
      "estadoExterno": "processing",
      "total": 150.00,
      "clienteNombre": "Juan Pérez",
      "clienteEmail": "juan@email.com",
      "fechaPedido": "2025-01-10T14:30:00Z",
      "procesado": true,
      "ventaId": "uuid-venta-pos"
    }
  ],
  "meta": { "page": 1, "total": 25 }
}
```

---

## 📋 CÓDIGOS DE ERROR

| Código | Descripción |
|--------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Credenciales inválidas |
| `AUTH_TOKEN_EXPIRED` | Token expirado |
| `AUTH_UNAUTHORIZED` | No autorizado |
| `AUTH_FORBIDDEN` | Sin permisos |
| `VALIDATION_ERROR` | Error de validación |
| `RESOURCE_NOT_FOUND` | Recurso no encontrado |
| `RESOURCE_ALREADY_EXISTS` | Recurso ya existe |
| `STOCK_INSUFFICIENT` | Stock insuficiente |
| `CAJA_NOT_OPEN` | Caja no abierta |
| `CAJA_ALREADY_OPEN` | Ya hay caja abierta |
| `VENTA_CANNOT_CANCEL` | Venta no se puede anular |
| `FILE_TOO_LARGE` | Archivo muy grande |
| `FILE_INVALID_TYPE` | Tipo de archivo no permitido |
