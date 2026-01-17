# 📁 ESTRUCTURA DEL PROYECTO

## 🏗️ ARQUITECTURA: CLEAN ARCHITECTURE + DDD + SOLID

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLEAN ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                      PRESENTATION LAYER                         │      │
│    │              (Controllers, DTOs, Decorators)                    │      │
│    │                     NestJS / NextJS                             │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                      APPLICATION LAYER                          │      │
│    │           (Use Cases, Application Services, DTOs)               │      │
│    │              Orquestación de la lógica de negocio               │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                        DOMAIN LAYER                             │      │
│    │    (Entities, Value Objects, Domain Services, Repositories)     │      │
│    │                   Reglas de negocio puras                       │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
│                                   ▼                                          │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                    INFRASTRUCTURE LAYER                         │      │
│    │       (Database, External APIs, Cache, File System)             │      │
│    │              Implementaciones concretas                         │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PRINCIPIOS SOLID APLICADOS

| Principio | Aplicación en el Proyecto |
|-----------|---------------------------|
| **S** - Single Responsibility | Cada clase tiene una única razón para cambiar. `VentaService` solo maneja ventas, `InventarioService` solo inventario |
| **O** - Open/Closed | Uso de interfaces y Strategy Pattern para extender sin modificar. Nuevos métodos de pago sin cambiar código existente |
| **L** - Liskov Substitution | Todas las implementaciones de `IPaymentGateway` son intercambiables |
| **I** - Interface Segregation | Interfaces pequeñas y específicas: `IProductRepository`, `IVentaRepository` separadas |
| **D** - Dependency Inversion | Los módulos de alto nivel dependen de abstracciones (interfaces), no de implementaciones concretas |

---

## 🧩 DESIGN PATTERNS UTILIZADOS

| Patrón | Uso en el Proyecto |
|--------|-------------------|
| **Repository** | Abstracción de acceso a datos: `ProductoRepository`, `VentaRepository` |
| **Factory** | Creación de objetos complejos: `VentaFactory`, `PromocionFactory` |
| **Strategy** | Cálculo de descuentos: `DescuentoPorcentajeStrategy`, `DescuentoMontoFijoStrategy` |
| **Observer** | Eventos de dominio: `VentaCompletadaEvent` → notificar inventario, caja |
| **Decorator** | Guards y middlewares en NestJS |
| **Adapter** | Integración con APIs externas: `YapeAdapter`, `MercadoPagoAdapter` |
| **Singleton** | Conexiones a BD, Redis cache |
| **Builder** | Construcción de queries complejas, reportes |
| **Specification** | Filtros de búsqueda: `ProductoActivoSpecification`, `StockBajoSpecification` |

---

## 📦 ESTRUCTURA GENERAL

```
SISTEMAPOS-CLAUDE/
├── 📁 docs/
│   └── 📁 arquitectura/
│       ├── 00-INDICE-GENERAL.md
│       ├── 01-STACK-TECNOLOGICO.md
│       ├── 02-ESTRUCTURA-PROYECTO.md      # Este archivo
│       └── ... (demás documentos)
│
├── 📁 backend/                             # NestJS - Puerto 4000
│   └── 📁 src/
│       ├── 📁 core/                        # DOMAIN + APPLICATION LAYERS
│       ├── 📁 infrastructure/              # INFRASTRUCTURE LAYER
│       ├── 📁 presentation/                # PRESENTATION LAYER
│       └── 📁 shared/                      # Código compartido
│
├── 📁 frontend/                            # NextJS - Puerto 3000
│   └── 📁 src/
│       ├── 📁 core/                        # Domain types, interfaces
│       ├── 📁 application/                 # Services, stores, hooks
│       ├── 📁 infrastructure/              # API clients, adapters
│       └── 📁 presentation/                # Components, pages
│
├── docker-compose.yml
└── README.md
```

---

## 📦 BACKEND - CLEAN ARCHITECTURE + DDD

```
backend/
├── 📁 src/
│   │
│   ├── 📁 core/                                    # ⭐ NÚCLEO (Domain + Application)
│   │   │
│   │   ├── 📁 domain/                              # 🔴 DOMAIN LAYER (Reglas de negocio)
│   │   │   │
│   │   │   ├── 📁 entities/                        # Entidades de dominio
│   │   │   │   ├── producto.entity.ts              # Entidad con lógica de negocio
│   │   │   │   ├── variante.entity.ts
│   │   │   │   ├── venta.entity.ts
│   │   │   │   ├── venta-detalle.entity.ts
│   │   │   │   ├── caja.entity.ts
│   │   │   │   ├── cliente.entity.ts
│   │   │   │   ├── usuario.entity.ts
│   │   │   │   ├── empresa.entity.ts
│   │   │   │   ├── sucursal.entity.ts
│   │   │   │   ├── categoria.entity.ts
│   │   │   │   ├── promocion.entity.ts
│   │   │   │   ├── stock.entity.ts
│   │   │   │   └── movimiento-inventario.entity.ts
│   │   │   │
│   │   │   ├── 📁 value-objects/                   # Objetos de valor inmutables
│   │   │   │   ├── money.vo.ts                     # Manejo de dinero/decimales
│   │   │   │   ├── email.vo.ts                     # Email validado
│   │   │   │   ├── phone.vo.ts                     # Teléfono validado
│   │   │   │   ├── ruc.vo.ts                       # RUC validado
│   │   │   │   ├── dni.vo.ts                       # DNI validado
│   │   │   │   ├── sku.vo.ts                       # SKU validado
│   │   │   │   ├── barcode.vo.ts                   # Código de barras
│   │   │   │   ├── percentage.vo.ts                # Porcentaje (0-100)
│   │   │   │   ├── quantity.vo.ts                  # Cantidad positiva
│   │   │   │   ├── slug.vo.ts                      # Slug URL
│   │   │   │   └── address.vo.ts                   # Dirección completa
│   │   │   │
│   │   │   ├── 📁 aggregates/                      # Aggregates (raíz de agregado)
│   │   │   │   ├── producto.aggregate.ts           # Producto + Variantes + Stock
│   │   │   │   ├── venta.aggregate.ts              # Venta + Detalles + Pagos
│   │   │   │   └── caja.aggregate.ts               # Caja + Movimientos
│   │   │   │
│   │   │   ├── 📁 domain-services/                 # Servicios de dominio
│   │   │   │   ├── precio-calculator.service.ts    # Cálculo de precios con descuentos
│   │   │   │   ├── promocion-evaluator.service.ts  # Evaluación de promociones
│   │   │   │   ├── stock-validator.service.ts      # Validación de stock disponible
│   │   │   │   └── venta-validator.service.ts      # Validación de reglas de venta
│   │   │   │
│   │   │   ├── 📁 repository-interfaces/           # Contratos de repositorios
│   │   │   │   ├── producto.repository.interface.ts
│   │   │   │   ├── variante.repository.interface.ts
│   │   │   │   ├── venta.repository.interface.ts
│   │   │   │   ├── cliente.repository.interface.ts
│   │   │   │   ├── usuario.repository.interface.ts
│   │   │   │   ├── empresa.repository.interface.ts
│   │   │   │   ├── categoria.repository.interface.ts
│   │   │   │   ├── inventario.repository.interface.ts
│   │   │   │   ├── caja.repository.interface.ts
│   │   │   │   └── promocion.repository.interface.ts
│   │   │   │
│   │   │   ├── 📁 events/                          # Eventos de dominio
│   │   │   │   ├── base.event.ts
│   │   │   │   ├── venta-completada.event.ts
│   │   │   │   ├── stock-bajo.event.ts
│   │   │   │   ├── caja-cerrada.event.ts
│   │   │   │   └── producto-creado.event.ts
│   │   │   │
│   │   │   ├── 📁 exceptions/                      # Excepciones de dominio
│   │   │   │   ├── domain.exception.ts
│   │   │   │   ├── stock-insuficiente.exception.ts
│   │   │   │   ├── caja-cerrada.exception.ts
│   │   │   │   ├── venta-invalida.exception.ts
│   │   │   │   └── producto-no-encontrado.exception.ts
│   │   │   │
│   │   │   ├── 📁 specifications/                  # Specification Pattern
│   │   │   │   ├── base.specification.ts
│   │   │   │   ├── producto-activo.specification.ts
│   │   │   │   ├── stock-bajo.specification.ts
│   │   │   │   ├── promocion-vigente.specification.ts
│   │   │   │   └── venta-anulable.specification.ts
│   │   │   │
│   │   │   └── 📁 strategies/                      # Strategy Pattern
│   │   │       ├── 📁 descuento/
│   │   │       │   ├── descuento.strategy.interface.ts
│   │   │       │   ├── descuento-porcentaje.strategy.ts
│   │   │       │   ├── descuento-monto-fijo.strategy.ts
│   │   │       │   └── descuento-promocion.strategy.ts
│   │   │       │
│   │   │       └── 📁 promocion/
│   │   │           ├── promocion.strategy.interface.ts
│   │   │           ├── compra-x-lleva-y.strategy.ts      # Compra 3, lleva 4
│   │   │           ├── descuento-unidad-n.strategy.ts    # 3ra unidad 20% off
│   │   │           ├── precio-fijo.strategy.ts           # Precio especial
│   │   │           └── monto-minimo.strategy.ts          # Descuento por monto
│   │   │
│   │   └── 📁 application/                         # 🟡 APPLICATION LAYER
│   │       │
│   │       ├── 📁 use-cases/                       # Casos de uso
│   │       │   │
│   │       │   ├── 📁 auth/
│   │       │   │   ├── login.use-case.ts
│   │       │   │   ├── register.use-case.ts
│   │       │   │   ├── refresh-token.use-case.ts
│   │       │   │   └── logout.use-case.ts
│   │       │   │
│   │       │   ├── 📁 productos/
│   │       │   │   ├── crear-producto.use-case.ts
│   │       │   │   ├── actualizar-producto.use-case.ts
│   │       │   │   ├── eliminar-producto.use-case.ts
│   │       │   │   ├── buscar-productos.use-case.ts
│   │       │   │   ├── obtener-producto.use-case.ts
│   │       │   │   ├── crear-variante.use-case.ts
│   │       │   │   └── actualizar-variante.use-case.ts
│   │       │   │
│   │       │   ├── 📁 ventas/
│   │       │   │   ├── crear-venta.use-case.ts
│   │       │   │   ├── anular-venta.use-case.ts
│   │       │   │   ├── obtener-venta.use-case.ts
│   │       │   │   ├── listar-ventas.use-case.ts
│   │       │   │   └── aplicar-descuento.use-case.ts
│   │       │   │
│   │       │   ├── 📁 inventario/
│   │       │   │   ├── registrar-entrada.use-case.ts
│   │       │   │   ├── registrar-salida.use-case.ts
│   │       │   │   ├── ajustar-stock.use-case.ts
│   │       │   │   ├── transferir-stock.use-case.ts
│   │       │   │   └── obtener-kardex.use-case.ts
│   │       │   │
│   │       │   ├── 📁 caja/
│   │       │   │   ├── abrir-caja.use-case.ts
│   │       │   │   ├── cerrar-caja.use-case.ts
│   │       │   │   ├── registrar-movimiento.use-case.ts
│   │       │   │   └── obtener-estado-caja.use-case.ts
│   │       │   │
│   │       │   ├── 📁 promociones/
│   │       │   │   ├── crear-promocion.use-case.ts
│   │       │   │   ├── aplicar-promociones.use-case.ts
│   │       │   │   └── validar-promocion.use-case.ts
│   │       │   │
│   │       │   ├── 📁 clientes/
│   │       │   │   ├── crear-cliente.use-case.ts
│   │       │   │   ├── actualizar-cliente.use-case.ts
│   │       │   │   └── buscar-clientes.use-case.ts
│   │       │   │
│   │       │   ├── 📁 reportes/
│   │       │   │   ├── reporte-ventas.use-case.ts
│   │       │   │   ├── reporte-inventario.use-case.ts
│   │       │   │   ├── reporte-caja.use-case.ts
│   │       │   │   └── reporte-productos.use-case.ts
│   │       │   │
│   │       │   └── 📁 import-export/
│   │       │       ├── importar-productos.use-case.ts
│   │       │       ├── exportar-productos.use-case.ts
│   │       │       └── validar-archivo.use-case.ts
│   │       │
│   │       ├── 📁 services/                        # Application Services
│   │       │   ├── auth.service.ts
│   │       │   ├── producto.service.ts
│   │       │   ├── venta.service.ts
│   │       │   ├── inventario.service.ts
│   │       │   ├── caja.service.ts
│   │       │   ├── cliente.service.ts
│   │       │   ├── promocion.service.ts
│   │       │   ├── reporte.service.ts
│   │       │   └── import-export.service.ts
│   │       │
│   │       ├── 📁 dto/                             # Data Transfer Objects
│   │       │   ├── 📁 auth/
│   │       │   │   ├── login.dto.ts
│   │       │   │   ├── register.dto.ts
│   │       │   │   └── token-response.dto.ts
│   │       │   │
│   │       │   ├── 📁 producto/
│   │       │   │   ├── create-producto.dto.ts
│   │       │   │   ├── update-producto.dto.ts
│   │       │   │   ├── producto-response.dto.ts
│   │       │   │   ├── create-variante.dto.ts
│   │       │   │   └── variante-response.dto.ts
│   │       │   │
│   │       │   ├── 📁 venta/
│   │       │   │   ├── create-venta.dto.ts
│   │       │   │   ├── venta-item.dto.ts
│   │       │   │   ├── venta-pago.dto.ts
│   │       │   │   └── venta-response.dto.ts
│   │       │   │
│   │       │   ├── 📁 inventario/
│   │       │   │   ├── movimiento.dto.ts
│   │       │   │   ├── ajuste.dto.ts
│   │       │   │   └── transferencia.dto.ts
│   │       │   │
│   │       │   ├── 📁 caja/
│   │       │   │   ├── apertura-caja.dto.ts
│   │       │   │   ├── cierre-caja.dto.ts
│   │       │   │   └── movimiento-caja.dto.ts
│   │       │   │
│   │       │   └── 📁 common/
│   │       │       ├── pagination.dto.ts
│   │       │       ├── filter.dto.ts
│   │       │       └── response.dto.ts
│   │       │
│   │       ├── 📁 ports/                           # Puertos (interfaces)
│   │       │   ├── 📁 inbound/                     # Puertos de entrada
│   │       │   │   ├── auth.port.ts
│   │       │   │   ├── producto.port.ts
│   │       │   │   └── venta.port.ts
│   │       │   │
│   │       │   └── 📁 outbound/                    # Puertos de salida
│   │       │       ├── email.port.ts
│   │       │       ├── payment-gateway.port.ts
│   │       │       ├── file-storage.port.ts
│   │       │       └── cache.port.ts
│   │       │
│   │       ├── 📁 event-handlers/                  # Manejadores de eventos
│   │       │   ├── venta-completada.handler.ts
│   │       │   ├── stock-bajo.handler.ts
│   │       │   └── caja-cerrada.handler.ts
│   │       │
│   │       ├── 📁 factories/                       # Factory Pattern
│   │       │   ├── venta.factory.ts
│   │       │   ├── promocion.factory.ts
│   │       │   └── reporte.factory.ts
│   │       │
│   │       └── 📁 mappers/                         # Entity <-> DTO mappers
│   │           ├── producto.mapper.ts
│   │           ├── venta.mapper.ts
│   │           ├── cliente.mapper.ts
│   │           └── usuario.mapper.ts
│   │
│   ├── 📁 infrastructure/                          # 🟢 INFRASTRUCTURE LAYER
│   │   │
│   │   ├── 📁 persistence/                         # Base de datos
│   │   │   │
│   │   │   ├── 📁 prisma/
│   │   │   │   ├── prisma.service.ts               # Servicio Prisma NestJS
│   │   │   │   ├── prisma.module.ts                # Módulo Prisma
│   │   │   │   │
│   │   │   │   └── 📁 repositories/                # Implementación de repositorios
│   │   │   │       ├── producto.repository.ts
│   │   │   │       ├── variante.repository.ts
│   │   │   │       ├── venta.repository.ts
│   │   │   │       ├── cliente.repository.ts
│   │   │   │       ├── usuario.repository.ts
│   │   │   │       ├── empresa.repository.ts
│   │   │   │       ├── categoria.repository.ts
│   │   │   │       ├── inventario.repository.ts
│   │   │   │       ├── caja.repository.ts
│   │   │   │       ├── promocion.repository.ts
│   │   │   │       └── base.repository.ts
│   │   │   │
│   │   │   └── 📁 mappers/                         # Prisma Model <-> Domain Entity
│   │   │       ├── producto.persistence-mapper.ts
│   │   │       ├── venta.persistence-mapper.ts
│   │   │       └── cliente.persistence-mapper.ts
│   │   │
│   │   ├── 📁 cache/                               # Cache (Redis)
│   │   │   ├── redis.service.ts
│   │   │   ├── cache.adapter.ts
│   │   │   └── cache-keys.ts
│   │   │
│   │   ├── 📁 external-services/                   # Servicios externos
│   │   │   │
│   │   │   ├── 📁 payment/                         # Adapter Pattern
│   │   │   │   ├── payment-gateway.adapter.ts
│   │   │   │   ├── mercadopago.adapter.ts
│   │   │   │   ├── culqi.adapter.ts
│   │   │   │   └── yape.adapter.ts
│   │   │   │
│   │   │   ├── 📁 email/
│   │   │   │   ├── email.adapter.ts
│   │   │   │   └── nodemailer.adapter.ts
│   │   │   │
│   │   │   └── 📁 storage/
│   │   │       ├── storage.adapter.ts
│   │   │       ├── local-storage.adapter.ts
│   │   │       └── s3-storage.adapter.ts
│   │   │
│   │   ├── 📁 file-processing/                     # Procesamiento de archivos
│   │   │   ├── excel.processor.ts
│   │   │   ├── csv.processor.ts
│   │   │   └── pdf.generator.ts
│   │   │
│   │   └── 📁 config/                              # Configuraciones
│   │       ├── redis.config.ts
│   │       ├── jwt.config.ts
│   │       ├── upload.config.ts
│   │       └── app.config.ts
│   │
│   ├── 📁 presentation/                            # 🔵 PRESENTATION LAYER
│   │   │
│   │   ├── 📁 http/                                # API REST
│   │   │   │
│   │   │   ├── 📁 controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── producto.controller.ts
│   │   │   │   ├── variante.controller.ts
│   │   │   │   ├── categoria.controller.ts
│   │   │   │   ├── marca.controller.ts
│   │   │   │   ├── cliente.controller.ts
│   │   │   │   ├── venta.controller.ts
│   │   │   │   ├── inventario.controller.ts
│   │   │   │   ├── caja.controller.ts
│   │   │   │   ├── promocion.controller.ts
│   │   │   │   ├── reporte.controller.ts
│   │   │   │   ├── import-export.controller.ts
│   │   │   │   ├── impresion.controller.ts
│   │   │   │   ├── empresa.controller.ts
│   │   │   │   ├── sucursal.controller.ts
│   │   │   │   ├── usuario.controller.ts
│   │   │   │   └── upload.controller.ts
│   │   │   │
│   │   │   ├── 📁 decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── current-tenant.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── public.decorator.ts
│   │   │   │
│   │   │   ├── 📁 guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   ├── tenant.guard.ts
│   │   │   │   └── throttle.guard.ts
│   │   │   │
│   │   │   ├── 📁 interceptors/
│   │   │   │   ├── transform.interceptor.ts
│   │   │   │   ├── timeout.interceptor.ts
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   └── cache.interceptor.ts
│   │   │   │
│   │   │   ├── 📁 filters/
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   ├── domain-exception.filter.ts
│   │   │   │   └── validation.filter.ts
│   │   │   │
│   │   │   ├── 📁 pipes/
│   │   │   │   ├── validation.pipe.ts
│   │   │   │   ├── parse-uuid.pipe.ts
│   │   │   │   └── sanitize.pipe.ts
│   │   │   │
│   │   │   └── 📁 middlewares/
│   │   │       ├── tenant.middleware.ts
│   │   │       └── logger.middleware.ts
│   │   │
│   │   └── 📁 modules/                             # Módulos NestJS
│   │       ├── auth.module.ts
│   │       ├── producto.module.ts
│   │       ├── venta.module.ts
│   │       ├── inventario.module.ts
│   │       ├── caja.module.ts
│   │       ├── cliente.module.ts
│   │       ├── promocion.module.ts
│   │       ├── reporte.module.ts
│   │       ├── import-export.module.ts
│   │       ├── impresion.module.ts
│   │       ├── empresa.module.ts
│   │       ├── usuario.module.ts
│   │       └── upload.module.ts
│   │
│   ├── 📁 shared/                                  # Código compartido
│   │   │
│   │   ├── 📁 constants/
│   │   │   ├── app.constants.ts
│   │   │   ├── injection-tokens.ts
│   │   │   └── error-messages.ts
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── common.types.ts
│   │   │   └── request.types.ts
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── slug.util.ts
│   │   │   ├── hash.util.ts
│   │   │   ├── date.util.ts
│   │   │   └── number.util.ts
│   │   │
│   │   └── 📁 helpers/
│   │       ├── pagination.helper.ts
│   │       └── response.helper.ts
│   │
│   ├── app.module.ts                               # Módulo raíz
│   └── main.ts                                     # Entry point
│
├── 📁 prisma/                                      # Prisma ORM
│   ├── schema.prisma                              # Esquema de base de datos
│   ├── migrations/                                # Migraciones generadas
│   └── seed.ts                                    # Seeds de datos
│
├── 📁 uploads/                                     # Archivos subidos
├── 📁 templates/                                   # Templates Excel
├── .env
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 🎨 FRONTEND - CLEAN ARCHITECTURE

```
frontend/
├── 📁 src/
│   │
│   ├── 📁 core/                                    # 🔴 DOMAIN LAYER
│   │   │
│   │   ├── 📁 domain/
│   │   │   ├── 📁 entities/                        # Tipos de entidades
│   │   │   │   ├── producto.entity.ts
│   │   │   │   ├── variante.entity.ts
│   │   │   │   ├── venta.entity.ts
│   │   │   │   ├── cliente.entity.ts
│   │   │   │   ├── usuario.entity.ts
│   │   │   │   └── caja.entity.ts
│   │   │   │
│   │   │   ├── 📁 value-objects/
│   │   │   │   ├── money.vo.ts
│   │   │   │   └── percentage.vo.ts
│   │   │   │
│   │   │   └── 📁 interfaces/
│   │   │       ├── repository.interface.ts
│   │   │       └── service.interface.ts
│   │   │
│   │   └── 📁 ports/                               # Contratos
│   │       ├── auth.port.ts
│   │       ├── producto.port.ts
│   │       ├── venta.port.ts
│   │       └── storage.port.ts
│   │
│   ├── 📁 application/                             # 🟡 APPLICATION LAYER
│   │   │
│   │   ├── 📁 services/                            # API Services
│   │   │   ├── auth.service.ts
│   │   │   ├── producto.service.ts
│   │   │   ├── categoria.service.ts
│   │   │   ├── venta.service.ts
│   │   │   ├── inventario.service.ts
│   │   │   ├── caja.service.ts
│   │   │   ├── cliente.service.ts
│   │   │   ├── promocion.service.ts
│   │   │   ├── reporte.service.ts
│   │   │   └── import-export.service.ts
│   │   │
│   │   ├── 📁 stores/                              # State Management (Zustand)
│   │   │   ├── auth.store.ts
│   │   │   ├── cart.store.ts
│   │   │   ├── pos.store.ts
│   │   │   ├── ui.store.ts
│   │   │   └── notification.store.ts
│   │   │
│   │   ├── 📁 hooks/                               # Custom Hooks
│   │   │   ├── 📁 queries/                         # React Query hooks
│   │   │   │   ├── use-productos.ts
│   │   │   │   ├── use-categorias.ts
│   │   │   │   ├── use-ventas.ts
│   │   │   │   ├── use-clientes.ts
│   │   │   │   └── use-reportes.ts
│   │   │   │
│   │   │   ├── 📁 mutations/
│   │   │   │   ├── use-create-producto.ts
│   │   │   │   ├── use-create-venta.ts
│   │   │   │   └── use-update-stock.ts
│   │   │   │
│   │   │   └── 📁 utils/
│   │   │       ├── use-auth.ts
│   │   │       ├── use-cart.ts
│   │   │       ├── use-barcode-scanner.ts
│   │   │       ├── use-print.ts
│   │   │       ├── use-debounce.ts
│   │   │       ├── use-local-storage.ts
│   │   │       └── use-media-query.ts
│   │   │
│   │   ├── 📁 validators/                          # Validaciones (Zod)
│   │   │   ├── auth.validator.ts
│   │   │   ├── producto.validator.ts
│   │   │   ├── venta.validator.ts
│   │   │   └── cliente.validator.ts
│   │   │
│   │   └── 📁 mappers/
│   │       ├── producto.mapper.ts
│   │       └── venta.mapper.ts
│   │
│   ├── 📁 infrastructure/                          # 🟢 INFRASTRUCTURE LAYER
│   │   │
│   │   ├── 📁 api/                                 # HTTP Client
│   │   │   ├── axios-instance.ts
│   │   │   ├── api-client.ts
│   │   │   └── interceptors.ts
│   │   │
│   │   ├── 📁 adapters/                            # Adapter Pattern
│   │   │   ├── local-storage.adapter.ts
│   │   │   └── session-storage.adapter.ts
│   │   │
│   │   └── 📁 config/
│   │       ├── api.config.ts
│   │       └── query-client.config.ts
│   │
│   ├── 📁 presentation/                            # 🔵 PRESENTATION LAYER
│   │   │
│   │   ├── 📁 app/                                 # Next.js App Router
│   │   │   │
│   │   │   ├── 📁 (auth)/                          # Rutas de autenticación
│   │   │   │   ├── 📁 login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 forgot-password/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── 📁 (dashboard)/                     # Dashboard principal
│   │   │   │   ├── 📁 dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 catalogos/
│   │   │   │   │   ├── 📁 categorias/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── 📁 [id]/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── 📁 marcas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── 📁 atributos/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 productos/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── 📁 nuevo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── 📁 [id]/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── 📁 editar/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── 📁 import-export/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 inventario/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── 📁 entradas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── 📁 salidas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── 📁 kardex/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 ventas/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── 📁 [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 caja/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── 📁 historial/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 clientes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── 📁 [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 promociones/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── 📁 [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 reportes/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── 📁 ventas/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── 📁 inventario/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 configuracion/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── 📁 empresa/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── 📁 sucursales/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── 📁 usuarios/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── 📁 impresion/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── 📁 (pos)/                           # Punto de Venta
│   │   │   │   ├── 📁 pos/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── 📁 (landing)/                       # Landing público
│   │   │   │   ├── page.tsx
│   │   │   │   ├── 📁 catalogo/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 nosotros/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 contacto/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── 📁 components/
│   │   │   │
│   │   │   ├── 📁 ui/                              # shadcn/ui
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 layout/
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── sidebar-item.tsx
│   │   │   │   │   └── sidebar-section.tsx
│   │   │   │   ├── header/
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   └── user-menu.tsx
│   │   │   │   └── footer.tsx
│   │   │   │
│   │   │   ├── 📁 features/                        # Componentes por feature
│   │   │   │   │
│   │   │   │   ├── 📁 auth/
│   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   └── register-form.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 productos/
│   │   │   │   │   ├── producto-form.tsx
│   │   │   │   │   ├── producto-card.tsx
│   │   │   │   │   ├── producto-table.tsx
│   │   │   │   │   ├── variante-form.tsx
│   │   │   │   │   └── variante-selector.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 pos/
│   │   │   │   │   ├── pos-layout.tsx
│   │   │   │   │   ├── product-grid.tsx
│   │   │   │   │   ├── cart/
│   │   │   │   │   │   ├── cart.tsx
│   │   │   │   │   │   ├── cart-item.tsx
│   │   │   │   │   │   └── cart-summary.tsx
│   │   │   │   │   ├── barcode-scanner.tsx
│   │   │   │   │   ├── quick-search.tsx
│   │   │   │   │   ├── payment-modal.tsx
│   │   │   │   │   ├── discount-modal.tsx
│   │   │   │   │   └── receipt-preview.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 inventario/
│   │   │   │   │   ├── stock-table.tsx
│   │   │   │   │   ├── movimiento-form.tsx
│   │   │   │   │   └── kardex-table.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 ventas/
│   │   │   │   │   ├── venta-table.tsx
│   │   │   │   │   └── venta-detail.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 caja/
│   │   │   │   │   ├── caja-status.tsx
│   │   │   │   │   ├── apertura-form.tsx
│   │   │   │   │   └── cierre-form.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 clientes/
│   │   │   │   │   ├── cliente-form.tsx
│   │   │   │   │   └── cliente-table.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 reportes/
│   │   │   │   │   ├── sales-chart.tsx
│   │   │   │   │   ├── inventory-chart.tsx
│   │   │   │   │   └── revenue-chart.tsx
│   │   │   │   │
│   │   │   │   ├── 📁 print/
│   │   │   │   │   ├── ticket-template.tsx
│   │   │   │   │   └── print-button.tsx
│   │   │   │   │
│   │   │   │   └── 📁 import-export/
│   │   │   │       ├── import-modal.tsx
│   │   │   │       ├── export-button.tsx
│   │   │   │       └── preview-table.tsx
│   │   │   │
│   │   │   └── 📁 common/
│   │   │       ├── loading-spinner.tsx
│   │   │       ├── empty-state.tsx
│   │   │       ├── confirm-dialog.tsx
│   │   │       ├── image-upload.tsx
│   │   │       ├── search-input.tsx
│   │   │       ├── data-table/
│   │   │       │   ├── data-table.tsx
│   │   │       │   ├── columns.tsx
│   │   │       │   └── toolbar.tsx
│   │   │       └── form/
│   │   │           ├── form-field.tsx
│   │   │           └── form-section.tsx
│   │   │
│   │   └── 📁 providers/
│   │       ├── app-providers.tsx
│   │       ├── query-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── toast-provider.tsx
│   │
│   └── 📁 shared/                                  # Código compartido
│       │
│       ├── 📁 constants/
│       │   ├── routes.ts
│       │   ├── api-endpoints.ts
│       │   └── config.ts
│       │
│       ├── 📁 types/
│       │   ├── api.types.ts
│       │   └── common.types.ts
│       │
│       └── 📁 utils/
│           ├── cn.ts                               # classnames utility
│           ├── format.ts                           # Formateo de datos
│           └── date.ts                             # Utilidades de fecha
│
├── 📁 public/
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔄 FLUJO DE DEPENDENCIAS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY RULE                                      │
│           Las dependencias apuntan HACIA ADENTRO (hacia el dominio)         │
└─────────────────────────────────────────────────────────────────────────────┘

                    PRESENTATION
                         │
                         ▼
         ┌───────────────────────────────┐
         │        APPLICATION            │
         │   (Use Cases, Services)       │
         └───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │          DOMAIN               │
         │   (Entities, Interfaces)      │ ◄── El núcleo NO depende de nada
         └───────────────────────────────┘
                         ▲
                         │
         ┌───────────────────────────────┐
         │       INFRASTRUCTURE          │
         │   (Repositories, APIs)        │
         └───────────────────────────────┘
```

---

## 📋 EJEMPLO: CREAR VENTA (Flujo Completo)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION: Controller recibe request                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│   POST /ventas                                                              │
│   └── VentaController.crearVenta(dto: CreateVentaDto)                      │
│       └── Valida DTO con ValidationPipe                                    │
│       └── Llama a CrearVentaUseCase                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. APPLICATION: Use Case orquesta la lógica                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│   CrearVentaUseCase.execute(command)                                        │
│   └── Valida caja abierta (CajaRepository)                                 │
│   └── Valida stock disponible (StockValidator - Domain Service)            │
│   └── Aplica promociones (PromocionEvaluator - Domain Service)             │
│   └── Calcula totales (PrecioCalculator - Domain Service)                  │
│   └── Crea entidad Venta (VentaFactory)                                    │
│   └── Guarda venta (VentaRepository)                                       │
│   └── Actualiza stock (InventarioRepository)                               │
│   └── Emite evento VentaCompletadaEvent                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. DOMAIN: Lógica de negocio pura                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│   Venta Entity                                                              │
│   └── agregarItem(producto, cantidad, precio)                              │
│   └── aplicarDescuento(descuento: Money)                                   │
│   └── calcularTotal(): Money                                               │
│   └── validar(): throws DomainException                                    │
│                                                                              │
│   Money Value Object                                                         │
│   └── Inmutable, siempre válido                                            │
│   └── add(), subtract(), multiply()                                        │
│                                                                              │
│   DescuentoStrategy (Strategy Pattern)                                       │
│   └── DescuentoPorcentajeStrategy.calcular(subtotal)                       │
│   └── DescuentoMontoFijoStrategy.calcular(subtotal)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. INFRASTRUCTURE: Persistencia y servicios externos                        │
├─────────────────────────────────────────────────────────────────────────────┤
│   VentaRepository (Prisma Implementation)                                    │
│   └── save(venta: Venta): Promise<Venta>                                   │
│   └── Mapea Domain Entity ↔ Prisma Model                                   │
│                                                                              │
│   EventEmitter (Observer Pattern)                                            │
│   └── VentaCompletadaHandler                                               │
│       └── Actualiza movimientos de caja                                    │
│       └── Invalida cache de stock                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 RESUMEN DE PATRONES POR CAPA

| Capa | Patrones Utilizados |
|------|---------------------|
| **Domain** | Entity, Value Object, Aggregate, Domain Service, Specification, Strategy |
| **Application** | Use Case, Factory, Mapper, DTO, Event Handler |
| **Infrastructure** | Repository (impl), Adapter, Singleton (conexiones) |
| **Presentation** | Decorator, Guard, Interceptor, Filter, Pipe |

---

## ⚠️ REGLAS IMPORTANTES

1. **El Domain NUNCA importa de otras capas**
2. **Los Use Cases orquestan, NO contienen lógica de negocio**
3. **Las Entities contienen comportamiento, no solo datos**
4. **Value Objects son INMUTABLES**
5. **Repositories devuelven Domain Entities, no ORM Entities**
6. **Los DTOs pertenecen a Application/Presentation, NO al Domain**
