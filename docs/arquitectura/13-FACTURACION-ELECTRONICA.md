# 🧾 FACTURACIÓN ELECTRÓNICA - PERÚ (SUNAT)

## ⚠️ IMPORTANTE

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MÓDULO OPCIONAL (ADDON)                                                │
│                                                                          │
│  ✅ Este módulo solo está disponible con el addon de facturación        │
│  ✅ Costo adicional: $5 USD/mes                                         │
│  ✅ Proveedores soportados: Nubefact, API SUNAT (PSE)                  │
│  ✅ El usuario puede elegir qué proveedor usar                          │
│                                                                          │
│  Sin el addon, el sistema solo emite tickets internos (sin SUNAT)       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 TIPOS DE COMPROBANTES

| Código | Tipo | Descripción | Envío a SUNAT |
|--------|------|-------------|---------------|
| 01 | Factura | Para clientes con RUC | Inmediato |
| 03 | Boleta | Para clientes con DNI | Resumen Diario |
| 07 | Nota de Crédito | Anulación/Corrección | Inmediato |
| 08 | Nota de Débito | Cargos adicionales | Inmediato |

---

## 🏢 PROVEEDORES SOPORTADOS

### 1. Nubefact (OSE) - Recomendado

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NUBEFACT - Operador de Servicios Electrónicos                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Tipo: OSE (Operador de Servicios Electrónicos)                         │
│  Web: https://www.nubefact.com                                          │
│                                                                          │
│  Ventajas:                                                               │
│  ├── No necesitas certificado digital propio                            │
│  ├── Ellos firman los comprobantes por ti                               │
│  ├── API simple y bien documentada                                      │
│  ├── Soporte incluido                                                   │
│  └── Resumen Diario automático                                          │
│                                                                          │
│  Precios (referencia 2024):                                             │
│  ├── Plan Básico: S/.70/mes (hasta 500 comprobantes)                   │
│  ├── Plan Pro: S/.120/mes (hasta 2000 comprobantes)                    │
│  └── Plan Enterprise: S/.200/mes (ilimitado)                           │
│                                                                          │
│  URL API Demo: https://demo.nubefact.com/api                           │
│  URL API Prod: https://api.nubefact.com/api                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. API SUNAT / Lucode (PSE)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  API SUNAT (PSE) - Proveedor de Servicios Electrónicos                  │
├─────────────────────────────────────────────────────────────────────────┤
│  Tipo: PSE (conecta directo con SUNAT)                                  │
│  Web: https://apisunat.com                                              │
│                                                                          │
│  Ventajas:                                                               │
│  ├── Más económico para alto volumen                                    │
│  ├── Conexión directa con SUNAT                                         │
│  └── Planes muy flexibles                                               │
│                                                                          │
│  Desventajas:                                                            │
│  ├── Necesitas certificado digital propio                               │
│  └── Debes gestionar el Resumen Diario manualmente                     │
│                                                                          │
│  Precios (referencia 2024):                                             │
│  ├── Básico: S/.8/mes (100 comprobantes)                               │
│  ├── Profesional: S/.15/mes (500 comprobantes)                         │
│  └── Ilimitado: S/.35/mes                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO DE FACTURACIÓN

### Factura (Envío Inmediato)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE FACTURA                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. VENTA EN POS                                                         │
│     └── Cliente con RUC → Tipo: Factura                                 │
│                                                                          │
│  2. CREAR COMPROBANTE                                                    │
│     └── Generar datos del comprobante                                   │
│     └── Guardar en BD con estado "pendiente"                            │
│                                                                          │
│  3. ENVIAR A SUNAT (inmediato)                                          │
│     └── Llamar API del proveedor (Nubefact/SUNAT)                       │
│     └── Esperar respuesta                                               │
│                                                                          │
│  4. PROCESAR RESPUESTA                                                   │
│     ├── Si OK → estado = "aceptado"                                     │
│     │   └── Guardar hash, CDR, XML firmado                             │
│     │   └── Generar PDF                                                 │
│     │                                                                    │
│     └── Si ERROR → estado = "rechazado"                                 │
│         └── Guardar código y mensaje de error                           │
│         └── Notificar al usuario                                        │
│                                                                          │
│  5. ENTREGAR AL CLIENTE                                                  │
│     └── Imprimir ticket con QR                                          │
│     └── Enviar PDF por email (opcional)                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Boleta (Resumen Diario)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE BOLETA (Resumen Diario)                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DURANTE EL DÍA:                                                         │
│  ───────────────                                                         │
│  1. VENTA EN POS                                                         │
│     └── Cliente con DNI → Tipo: Boleta                                  │
│                                                                          │
│  2. CREAR COMPROBANTE                                                    │
│     └── Generar datos del comprobante                                   │
│     └── Guardar en BD con estado "pendiente"                            │
│     └── NO enviar a SUNAT todavía                                       │
│                                                                          │
│  3. ENTREGAR AL CLIENTE                                                  │
│     └── Imprimir ticket (pre-impreso)                                   │
│     └── QR con datos del comprobante                                    │
│                                                                          │
│  AL FINAL DEL DÍA (23:00 o manual):                                     │
│  ──────────────────────────────────                                      │
│  4. GENERAR RESUMEN DIARIO                                               │
│     └── Agrupar todas las boletas del día                               │
│     └── Crear XML de resumen (RC-YYYYMMDD-###)                         │
│                                                                          │
│  5. ENVIAR RESUMEN A SUNAT                                               │
│     └── 1 sola llamada API para TODAS las boletas                       │
│     └── SUNAT devuelve ticket de recepción                              │
│                                                                          │
│  6. CONSULTAR ESTADO (después de unos minutos)                          │
│     └── Consultar con el ticket                                         │
│     └── Si OK → marcar boletas como "aceptadas"                         │
│     └── Si ERROR → reintentar o corregir                                │
│                                                                          │
│  VENTAJA: 100 boletas = 1 llamada API (ahorro de costos)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💰 COMPARATIVA DE COSTOS

### Escenario: 1000 ventas/mes (70% boletas, 30% facturas)

| Proveedor | Boletas (700) | Facturas (300) | Total/mes |
|-----------|---------------|----------------|-----------|
| **Nubefact Básico** | Incluidas | Incluidas | S/.70 |
| **API SUNAT Ilimitado** | ~23 llamadas (resumen diario) | 300 llamadas | S/.35 |

### Cálculo Resumen Diario
```
700 boletas ÷ 30 días = ~23 boletas/día
23 boletas = 1 resumen diario = 1 llamada API

Sin Resumen Diario: 700 llamadas
Con Resumen Diario: 30 llamadas

AHORRO: 96% menos llamadas API
```

---

## 🏗️ ARQUITECTURA - ADAPTER PATTERN

```typescript
// backend/src/infrastructure/external-services/facturacion/

// Interface común para todos los proveedores
export interface IFacturacionAdapter {
  enviarComprobante(comprobante: ComprobanteDTO): Promise<RespuestaSunat>;
  consultarComprobante(serie: string, numero: number): Promise<EstadoComprobante>;
  enviarResumenDiario(resumen: ResumenDiarioDTO): Promise<TicketSunat>;
  consultarResumen(ticket: string): Promise<EstadoResumen>;
  anularComprobante(serie: string, numero: number, motivo: string): Promise<RespuestaSunat>;
}

// Implementación Nubefact
export class NubefactAdapter implements IFacturacionAdapter {
  constructor(
    private readonly apiToken: string,
    private readonly apiUrl: string,
  ) {}

  async enviarComprobante(comprobante: ComprobanteDTO): Promise<RespuestaSunat> {
    // Transformar a formato Nubefact
    const payload = this.transformToNubefact(comprobante);

    const response = await axios.post(this.apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    return this.parseResponse(response.data);
  }

  // ... otros métodos
}

// Implementación API SUNAT
export class ApiSunatAdapter implements IFacturacionAdapter {
  constructor(
    private readonly config: ApiSunatConfig,
  ) {}

  async enviarComprobante(comprobante: ComprobanteDTO): Promise<RespuestaSunat> {
    // Generar XML UBL 2.1
    const xml = this.generarXML(comprobante);

    // Firmar con certificado digital
    const xmlFirmado = this.firmarXML(xml);

    // Enviar a SUNAT
    const response = await this.enviarASunat(xmlFirmado);

    return this.parseResponse(response);
  }

  // ... otros métodos
}

// Factory para crear el adapter correcto
export class FacturacionAdapterFactory {
  static create(config: FacturacionConfig): IFacturacionAdapter {
    switch (config.proveedor) {
      case 'nubefact':
        return new NubefactAdapter(config.api_token, config.api_url);
      case 'sunat_api':
        return new ApiSunatAdapter(config);
      default:
        throw new Error(`Proveedor no soportado: ${config.proveedor}`);
    }
  }
}
```

---

## 📡 EJEMPLO API NUBEFACT

### Enviar Factura

```typescript
// POST https://api.nubefact.com/api/v1/[ruc]

const payload = {
  operacion: "generar_comprobante",
  tipo_de_comprobante: 1,  // 1=Factura, 2=Boleta
  serie: "F001",
  numero: 1,
  sunat_transaction: 1,    // 1=Venta interna
  cliente_tipo_de_documento: 6,  // 6=RUC
  cliente_numero_de_documento: "20123456789",
  cliente_denominacion: "EMPRESA SAC",
  cliente_direccion: "AV. PRINCIPAL 123",
  cliente_email: "cliente@empresa.com",
  fecha_de_emision: "2024-01-15",
  moneda: 1,  // 1=PEN, 2=USD
  tipo_de_cambio: "",
  porcentaje_de_igv: 18.00,
  descuento_global: "",
  total_descuento: "",
  total_anticipo: "",
  total_gravada: 100.00,
  total_inafecta: "",
  total_exonerada: "",
  total_igv: 18.00,
  total_gratuita: "",
  total_otros_cargos: "",
  total: 118.00,
  percepcion_tipo: "",
  percepcion_base_imponible: "",
  total_percepcion: "",
  total_incluido_percepcion: "",
  detraccion: false,
  observaciones: "",
  documento_que_se_modifica_tipo: "",
  documento_que_se_modifica_serie: "",
  documento_que_se_modifica_numero: "",
  tipo_de_nota_de_credito: "",
  tipo_de_nota_de_debito: "",
  enviar_automaticamente_a_la_sunat: true,
  enviar_automaticamente_al_cliente: true,
  codigo_unico: "",
  condiciones_de_pago: "",
  medio_de_pago: "",
  placa_vehiculo: "",
  orden_compra_servicio: "",
  tabla_personalizada_codigo: "",
  formato_de_pdf: "",
  items: [
    {
      unidad_de_medida: "NIU",
      codigo: "PROD-001",
      descripcion: "Producto de ejemplo",
      cantidad: 2,
      valor_unitario: 50.00,
      precio_unitario: 59.00,
      descuento: "",
      subtotal: 100.00,
      tipo_de_igv: 1,  // 1=Gravado
      igv: 18.00,
      total: 118.00,
      anticipo_regularizacion: false,
      anticipo_documento_serie: "",
      anticipo_documento_numero: ""
    }
  ]
};

// Respuesta exitosa
const response = {
  aceptada_por_sunat: true,
  sunat_description: "La Factura numero F001-1, ha sido aceptada",
  sunat_note: "",
  sunat_responsecode: "0",
  sunat_soap_error: "",
  hash_cpe: "xYz123...",
  hash_code: "0000-0000-0000",
  pdf_zip_base64: "UEsDBBQ...",  // PDF en base64
  xml_zip_base64: "UEsDBBQ...",  // XML firmado en base64
  cdr_zip_base64: "UEsDBBQ...",  // CDR (respuesta SUNAT) en base64
  enlace_del_pdf: "https://...",
  cadena_para_codigo_qr: "20123456789|01|F001|1|18.00|118.00|..."
};
```

### Resumen Diario (Boletas)

```typescript
// POST https://api.nubefact.com/api/v1/[ruc]

const payload = {
  operacion: "generar_resumen",
  tipo_de_resumen: 1,  // 1=Resumen diario, 2=Comunicación de baja
  fecha_de_emision_de_documentos: "2024-01-15",
  fecha_de_generacion_de_resumen: "2024-01-16",
  enviar_automaticamente_a_la_sunat: true,
  documentos: [
    {
      serie: "B001",
      numero_inicial: 1,
      numero_final: 50,
      tipo_de_documento: 2,  // 2=Boleta
      total: 5000.00,
      total_igv: 900.00,
      total_gravada: 4100.00
    }
  ]
};

// Respuesta
const response = {
  ticket: "1705350000123",  // Ticket para consultar después
  mensaje: "El resumen ha sido enviado correctamente"
};

// Consultar estado del resumen (después de unos minutos)
// GET https://api.nubefact.com/api/v1/[ruc]/resumen/[ticket]
```

---

## 🖨️ TICKET CON QR

El ticket impreso debe incluir un código QR con la siguiente información:

```
[RUC_EMISOR]|[TIPO_COMPROBANTE]|[SERIE]|[NUMERO]|[IGV]|[TOTAL]|[FECHA]|[TIPO_DOC_CLIENTE]|[NRO_DOC_CLIENTE]|[HASH_CPE]

Ejemplo:
20123456789|01|F001|00000001|18.00|118.00|2024-01-15|6|20987654321|xYz123...
```

```
┌─────────────────────────────────────────┐
│           MI EMPRESA SAC                │
│           RUC: 20123456789              │
│         Av. Principal 123               │
│                                         │
│  ═══════════════════════════════════   │
│       FACTURA ELECTRÓNICA              │
│          F001-00000001                  │
│  ═══════════════════════════════════   │
│                                         │
│  Fecha: 15/01/2024  Hora: 14:30        │
│                                         │
│  Cliente: EMPRESA CLIENTE SAC          │
│  RUC: 20987654321                       │
│                                         │
│  ─────────────────────────────────────  │
│  Cant.  Descripción          Importe   │
│  ─────────────────────────────────────  │
│    2    Producto ejemplo      S/118.00 │
│                                         │
│  ─────────────────────────────────────  │
│  Subtotal:                    S/100.00 │
│  IGV (18%):                    S/18.00 │
│  ─────────────────────────────────────  │
│  TOTAL:                       S/118.00 │
│  ─────────────────────────────────────  │
│                                         │
│  Representación impresa de la          │
│  Factura Electrónica                   │
│                                         │
│         ┌─────────────┐                │
│         │   [QR CODE] │                │
│         │             │                │
│         └─────────────┘                │
│                                         │
│  Hash: xYz123...                        │
│  Consulte en: sunat.gob.pe             │
│                                         │
│  ¡Gracias por su compra!               │
└─────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURACIÓN EN FRONTEND

### Pantalla de Configuración

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE FACTURACIÓN ELECTRÓNICA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Estado: ● Activo (addon contratado)                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  PROVEEDOR                                                               │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  ( ) Nubefact (OSE) - Recomendado                                       │
│      No necesita certificado digital propio                             │
│                                                                          │
│  (●) API SUNAT (PSE)                                                    │
│      Conexión directa con SUNAT                                         │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  CREDENCIALES                                                            │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  Token API:     [••••••••••••••••••••••••]   [Validar]                  │
│  Modo:          [● Demo] [ Producción ]                                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  DATOS DEL EMISOR                                                        │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  RUC:            [20123456789        ]                                  │
│  Razón Social:   [MI EMPRESA SAC     ]                                  │
│  Dirección:      [AV. PRINCIPAL 123  ]                                  │
│  Ubigeo:         [150101 - Lima      ]                                  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  SERIES                                                                  │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  Serie Factura:           [F001]  Correlativo: 00000001                 │
│  Serie Boleta:            [B001]  Correlativo: 00000001                 │
│  Serie N/C Factura:       [FC01] Correlativo: 00000001                  │
│  Serie N/C Boleta:        [BC01] Correlativo: 00000001                  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  CONFIGURACIÓN DE ENVÍO                                                  │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  [✓] Enviar comprobantes automáticamente                                │
│  [✓] Enviar PDF al cliente por email                                    │
│                                                                          │
│  Hora de Resumen Diario: [23:00]                                        │
│  (Las boletas se agrupan y envían en un solo resumen)                   │
│                                                                          │
│                          [Guardar Configuración]                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 MÓDULO EN DASHBOARD

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FACTURACIÓN ELECTRÓNICA - Dashboard                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    125      │ │     89      │ │     36      │ │      3      │       │
│  │  Emitidos   │ │  Aceptados  │ │ En Resumen  │ │ Rechazados  │       │
│  │    hoy      │ │   (SUNAT)   │ │  (boletas)  │ │  (revisar)  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  ÚLTIMOS COMPROBANTES                                                    │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  │ Tipo     │ Número      │ Cliente            │ Total   │ Estado    │ │
│  ├──────────┼─────────────┼────────────────────┼─────────┼───────────┤ │
│  │ Factura  │ F001-000125 │ EMPRESA SAC        │ S/590   │ ✓ Aceptado│ │
│  │ Boleta   │ B001-000456 │ JUAN PEREZ         │ S/89    │ ◷ Resumen │ │
│  │ Factura  │ F001-000124 │ COMERCIAL LIMA     │ S/1,200 │ ✓ Aceptado│ │
│  │ Boleta   │ B001-000455 │ MARIA GARCIA       │ S/45    │ ◷ Resumen │ │
│  │ N/Crédito│ FC01-000012 │ EMPRESA SAC        │ S/-118  │ ✓ Aceptado│ │
│                                                                          │
│  ─────────────────────────────────────────────────────────────          │
│  RESUMEN DIARIO PENDIENTE                                                │
│  ─────────────────────────────────────────────────────────────          │
│                                                                          │
│  Fecha: 15/01/2024                                                       │
│  Boletas pendientes: 36                                                  │
│  Total: S/ 4,523.00                                                      │
│                                                                          │
│  [Generar y Enviar Resumen Ahora]                                       │
│                                                                          │
│  Próximo envío automático: Hoy 23:00                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 TABLAS DE BASE DE DATOS

Ver: `docs/arquitectura/03-BASE-DATOS-COMPLETA.md`

- `comprobantes` - Boletas, Facturas, N/C, N/D
- `comprobante_detalles` - Detalle de items
- `resumenes_diarios` - Resúmenes de boletas
- `facturacion_config` - Configuración por empresa
- `facturacion_log` - Log de comunicaciones

---

## 📡 ENDPOINTS API

Ver: `docs/arquitectura/06-API-ENDPOINTS.md` (sección Facturación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/facturacion/config` | Obtener configuración |
| PUT | `/facturacion/config` | Actualizar configuración |
| POST | `/facturacion/config/validar` | Validar credenciales |
| GET | `/facturacion/comprobantes` | Listar comprobantes |
| GET | `/facturacion/comprobantes/:id` | Obtener comprobante |
| POST | `/facturacion/comprobantes` | Crear comprobante |
| POST | `/facturacion/comprobantes/:id/reenviar` | Reenviar a SUNAT |
| GET | `/facturacion/comprobantes/:id/pdf` | Descargar PDF |
| GET | `/facturacion/comprobantes/:id/xml` | Descargar XML |
| POST | `/facturacion/resumen-diario` | Generar resumen |
| GET | `/facturacion/resumen-diario/:id/estado` | Consultar estado |
| GET | `/facturacion/dashboard` | Dashboard facturación |

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Certificado Digital (solo API SUNAT)
```
- Necesitas certificado digital emitido por entidad autorizada
- Costo aproximado: S/.200 - S/.500 por año
- Con Nubefact NO necesitas certificado (ellos firman por ti)
```

### 2. Contingencia
```
- Si SUNAT no responde, guardar comprobante con estado "pendiente"
- Reintentar automáticamente cada X minutos
- Las boletas se pueden enviar hasta 7 días después
- Las facturas deben enviarse el mismo día (hasta las 23:59)
```

### 3. Anulación
```
- Facturas: Se anulan con Nota de Crédito
- Boletas: Se anulan con Comunicación de Baja (hasta 7 días)
- Después de 7 días: Solo Nota de Crédito
```

### 4. Formatos de Archivo
```
- XML: Formato UBL 2.1 (estándar SUNAT)
- PDF: Representación impresa del comprobante
- CDR: Constancia de Recepción (respuesta de SUNAT)
```
