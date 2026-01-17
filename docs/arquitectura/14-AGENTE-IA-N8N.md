# 14. AGENTE IA + N8N + WHATSAPP

## ARQUITECTURA COMPLETA

```
+-------------------------------------------------------------------+
|                    ARQUITECTURA AGENTE IA                         |
+-------------------------------------------------------------------+
|                                                                   |
|   CLIENTE                                                         |
|   +---------------+                                               |
|   |   WhatsApp    |                                               |
|   |   Usuario     |                                               |
|   +-------+-------+                                               |
|           |                                                       |
|           | Audio/Texto                                           |
|           v                                                       |
|   +---------------+     +---------------+     +---------------+   |
|   |   Evolution   |     |     N8N       |     |    GROQ       |   |
|   |     API       |---->|   Workflow    |---->|   (Gratis)    |   |
|   |  (WhatsApp)   |     |               |     |   Whisper     |   |
|   +---------------+     +-------+-------+     |   + Llama     |   |
|                                 |             +---------------+   |
|                                 |                     |           |
|                                 v                     v           |
|                         +---------------+     +---------------+   |
|                         |   Tu API      |     |   OpenAI      |   |
|                         |   NestJS      |<----|   (Backup)    |   |
|                         +-------+-------+     +---------------+   |
|                                 |                                 |
|                                 v                                 |
|                         +---------------+                         |
|                         |  PostgreSQL   |                         |
|                         |  (Tu BD)      |                         |
|                         +---------------+                         |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## TABLAS DE BASE DE DATOS

### Tabla: integraciones_whatsapp

```sql
CREATE TABLE integraciones_whatsapp (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Evolution API
    instancia_id            VARCHAR(100),           -- ID de instancia en Evolution
    instancia_nombre        VARCHAR(100),           -- Nombre de la instancia
    api_key                 VARCHAR(255),           -- API Key de Evolution

    -- Estado de conexion
    estado                  VARCHAR(20) DEFAULT 'desconectado',
    -- Estados: desconectado, escaneando_qr, conectado, error

    -- Datos del WhatsApp conectado
    telefono                VARCHAR(20),            -- Numero conectado
    nombre_perfil           VARCHAR(100),           -- Nombre del perfil
    foto_perfil             VARCHAR(500),           -- URL foto perfil

    -- Webhook
    webhook_url             VARCHAR(500),           -- URL del webhook N8N
    webhook_secret          VARCHAR(100),           -- Secret para validar

    -- Funciones habilitadas
    entrada_inventario      BOOLEAN DEFAULT true,   -- Registrar entradas por voz/texto
    salida_inventario       BOOLEAN DEFAULT true,   -- Registrar salidas por voz/texto
    consulta_stock          BOOLEAN DEFAULT true,   -- Consultar stock
    alertas_stock           BOOLEAN DEFAULT false,  -- Alertas automaticas stock bajo
    alertas_vencimiento     BOOLEAN DEFAULT false,  -- Alertas productos por vencer
    reporte_diario          BOOLEAN DEFAULT false,  -- Enviar reporte al cierre
    notif_ventas            BOOLEAN DEFAULT false,  -- Notificar cada venta

    -- Limites del plan
    plan_agente             VARCHAR(20) DEFAULT 'basico',  -- basico, pro, business
    minutos_audio_mes       INTEGER DEFAULT 60,     -- Minutos de audio incluidos
    mensajes_texto_mes      INTEGER DEFAULT 200,    -- Mensajes texto incluidos
    minutos_usados          INTEGER DEFAULT 0,      -- Minutos usados este mes
    mensajes_usados         INTEGER DEFAULT 0,      -- Mensajes usados este mes

    -- Configuracion de alertas
    hora_alerta_stock       TIME DEFAULT '08:00',
    hora_alerta_vencimiento TIME DEFAULT '08:00',
    hora_reporte_diario     TIME DEFAULT '21:00',

    -- Usuarios autorizados (numeros que pueden usar el bot)
    usuarios_autorizados    TEXT[],                 -- Array de numeros autorizados

    -- Timestamps
    conectado_at            TIMESTAMP,
    desconectado_at         TIMESTAMP,
    ultimo_mensaje_at       TIMESTAMP,

    -- Auditoria
    activo                  BOOLEAN DEFAULT true,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_whatsapp_empresa UNIQUE (empresa_id),
    CONSTRAINT chk_estado CHECK (estado IN ('desconectado', 'escaneando_qr', 'conectado', 'error')),
    CONSTRAINT chk_plan_agente CHECK (plan_agente IN ('basico', 'pro', 'business'))
);

CREATE INDEX idx_whatsapp_empresa ON integraciones_whatsapp(empresa_id);
CREATE INDEX idx_whatsapp_estado ON integraciones_whatsapp(estado);
```

### Campos integraciones_whatsapp

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador unico |
| empresa_id | UUID | Si | FK empresa |
| instancia_id | VARCHAR(100) | No | ID Evolution API |
| instancia_nombre | VARCHAR(100) | No | Nombre instancia |
| api_key | VARCHAR(255) | No | API Key Evolution |
| estado | VARCHAR(20) | No | Estado conexion |
| telefono | VARCHAR(20) | No | Numero conectado |
| nombre_perfil | VARCHAR(100) | No | Nombre perfil WA |
| foto_perfil | VARCHAR(500) | No | Foto perfil |
| webhook_url | VARCHAR(500) | No | URL webhook N8N |
| webhook_secret | VARCHAR(100) | No | Secret webhook |
| entrada_inventario | BOOLEAN | No | Funcion entrada |
| salida_inventario | BOOLEAN | No | Funcion salida |
| consulta_stock | BOOLEAN | No | Funcion consulta |
| alertas_stock | BOOLEAN | No | Alertas stock |
| alertas_vencimiento | BOOLEAN | No | Alertas venc |
| reporte_diario | BOOLEAN | No | Reporte diario |
| notif_ventas | BOOLEAN | No | Notif ventas |
| plan_agente | VARCHAR(20) | No | Plan contratado |
| minutos_audio_mes | INTEGER | No | Limite audio |
| mensajes_texto_mes | INTEGER | No | Limite texto |
| minutos_usados | INTEGER | No | Audio usado |
| mensajes_usados | INTEGER | No | Texto usado |
| hora_alerta_stock | TIME | No | Hora alerta stock |
| hora_alerta_vencimiento | TIME | No | Hora alerta venc |
| hora_reporte_diario | TIME | No | Hora reporte |
| usuarios_autorizados | TEXT[] | No | Numeros autorizados |
| conectado_at | TIMESTAMP | No | Fecha conexion |
| desconectado_at | TIMESTAMP | No | Fecha desconexion |
| ultimo_mensaje_at | TIMESTAMP | No | Ultimo mensaje |
| activo | BOOLEAN | No | Activo |
| created_at | TIMESTAMP | Auto | Fecha creacion |
| updated_at | TIMESTAMP | Auto | Actualizacion |

---

### Tabla: uso_agente_ia

```sql
-- Log de uso para facturacion y metricas
CREATE TABLE uso_agente_ia (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    integracion_id          UUID NOT NULL REFERENCES integraciones_whatsapp(id) ON DELETE CASCADE,

    -- Tipo de uso
    tipo                    VARCHAR(20) NOT NULL,   -- audio, texto

    -- Detalles audio
    duracion_segundos       INTEGER,                -- Solo para audio
    archivo_audio_url       VARCHAR(500),           -- URL temporal del audio

    -- Texto procesado
    texto_entrada           TEXT,                   -- Mensaje del usuario
    texto_salida            TEXT,                   -- Respuesta del bot

    -- Resultado
    json_extraido           JSONB,                  -- JSON extraido por la IA
    accion_realizada        VARCHAR(50),            -- entrada, salida, consulta, etc
    exito                   BOOLEAN DEFAULT true,
    error_mensaje           TEXT,

    -- Tokens/Costos
    modelo_stt              VARCHAR(50),            -- groq-whisper, openai-whisper
    modelo_llm              VARCHAR(50),            -- groq-llama, openai-gpt4
    tokens_entrada          INTEGER,
    tokens_salida           INTEGER,
    costo_estimado_usd      DECIMAL(10,6),

    -- Metadata
    numero_remitente        VARCHAR(20),            -- Numero que envio
    message_id              VARCHAR(100),           -- ID mensaje WhatsApp

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uso_ia_empresa ON uso_agente_ia(empresa_id);
CREATE INDEX idx_uso_ia_integracion ON uso_agente_ia(integracion_id);
CREATE INDEX idx_uso_ia_fecha ON uso_agente_ia(created_at);
CREATE INDEX idx_uso_ia_tipo ON uso_agente_ia(tipo);
```

### Campos uso_agente_ia

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador |
| empresa_id | UUID | Si | FK empresa |
| integracion_id | UUID | Si | FK integracion |
| tipo | VARCHAR(20) | Si | audio o texto |
| duracion_segundos | INTEGER | No | Duracion audio |
| archivo_audio_url | VARCHAR(500) | No | URL audio |
| texto_entrada | TEXT | No | Mensaje usuario |
| texto_salida | TEXT | No | Respuesta bot |
| json_extraido | JSONB | No | JSON procesado |
| accion_realizada | VARCHAR(50) | No | Tipo accion |
| exito | BOOLEAN | No | Si fue exitoso |
| error_mensaje | TEXT | No | Mensaje error |
| modelo_stt | VARCHAR(50) | No | Modelo STT usado |
| modelo_llm | VARCHAR(50) | No | Modelo LLM usado |
| tokens_entrada | INTEGER | No | Tokens input |
| tokens_salida | INTEGER | No | Tokens output |
| costo_estimado_usd | DECIMAL(10,6) | No | Costo estimado |
| numero_remitente | VARCHAR(20) | No | Numero origen |
| message_id | VARCHAR(100) | No | ID mensaje WA |
| created_at | TIMESTAMP | Auto | Fecha creacion |

---

## FLUJO DE PROCESAMIENTO

### 1. Mensaje de Audio (Entrada de Inventario)

```
+-------------------------------------------------------------------+
|  FLUJO: AUDIO -> TEXTO -> JSON -> BASE DE DATOS                   |
+-------------------------------------------------------------------+

Usuario envia audio: "Llegaron cincuenta cajas de coca cola"
                |
                v
+---------------+---------------+
|   EVOLUTION API (Webhook)     |
|   Recibe audio MP3/OGG        |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: Descargar Audio        |
|   GET audio URL               |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: GROQ Whisper (Gratis)  |
|   POST /audio/transcriptions  |
|                               |
|   Response:                   |
|   "llegaron cincuenta cajas   |
|    de coca cola"              |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: GROQ Llama (Gratis)    |
|   POST /chat/completions      |
|                               |
|   Prompt:                     |
|   "Extrae datos de inventario"|
|   "Responde SOLO JSON"        |
|                               |
|   Response:                   |
|   {                           |
|     "accion": "entrada",      |
|     "producto": "coca cola",  |
|     "cantidad": 50,           |
|     "unidad": "cajas"         |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: Tu API NestJS          |
|   POST /api/v1/inventario/    |
|        movimientos/voz        |
|                               |
|   Body: JSON extraido         |
|                               |
|   - Busca producto similar    |
|   - Crea movimiento           |
|   - Actualiza stock           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: Evolution API          |
|   POST /message/sendText      |
|                               |
|   "Registre entrada de        |
|    50 cajas de Coca Cola.     |
|    Stock actual: 150"         |
+---------------+---------------+
```

### 2. Mensaje de Texto (Consulta de Stock)

```
+-------------------------------------------------------------------+
|  FLUJO: TEXTO -> JSON -> BASE DE DATOS -> RESPUESTA               |
+-------------------------------------------------------------------+

Usuario escribe: "cuanto stock tengo de coca cola"
                |
                v
+---------------+---------------+
|   EVOLUTION API (Webhook)     |
|   Recibe texto                |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: GROQ Llama (Gratis)    |
|   POST /chat/completions      |
|                               |
|   {                           |
|     "accion": "consulta",     |
|     "producto": "coca cola"   |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: Tu API NestJS          |
|   GET /api/v1/inventario/     |
|       stock/buscar            |
|   ?query=coca+cola            |
|                               |
|   Response:                   |
|   [{                          |
|     "nombre": "Coca Cola 500ml",|
|     "stock": 150              |
|   }, {                        |
|     "nombre": "Coca Cola 1L", |
|     "stock": 80               |
|   }]                          |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   N8N: Evolution API          |
|   POST /message/sendText      |
|                               |
|   "Stock de Coca Cola:        |
|    - 500ml: 150 unidades      |
|    - 1L: 80 unidades"         |
+---------------+---------------+
```

---

## CASOS DE USO DETALLADOS

### CASO 1: Entrada de Inventario

**Trigger:** Usuario envia audio/texto
**Ejemplos de mensajes:**
- "Llegaron 50 cajas de coca cola"
- "Recibi 100 unidades de arroz del proveedor Garcia"
- "entrada 20 polos talla M color rojo"

**JSON Esperado:**
```json
{
  "accion": "entrada",
  "producto": "coca cola",
  "cantidad": 50,
  "unidad": "cajas",
  "proveedor": null,
  "notas": null
}
```

**Respuesta del Bot:**
```
Registre entrada:
- Producto: Coca Cola 500ml
- Cantidad: 50 cajas
- Stock anterior: 100
- Stock actual: 150
```

**Plan:** Basico, Pro, Business

---

### CASO 2: Salida de Inventario

**Trigger:** Usuario envia audio/texto
**Ejemplos de mensajes:**
- "Vendi 5 polos talla M"
- "Salieron 10 coca colas"
- "Se danaron 3 yogures, darlos de baja"

**JSON Esperado:**
```json
{
  "accion": "salida",
  "producto": "polos talla M",
  "cantidad": 5,
  "motivo": "venta",
  "notas": null
}
```

**Respuesta del Bot:**
```
Registre salida:
- Producto: Polo Talla M
- Cantidad: 5
- Stock restante: 25
- Alerta: Stock bajo (minimo: 20)
```

**Plan:** Basico, Pro, Business

---

### CASO 3: Consulta de Stock

**Trigger:** Usuario pregunta por stock
**Ejemplos de mensajes:**
- "Cuantas coca colas tengo?"
- "stock de polos"
- "Que productos estan por agotarse?"

**JSON Esperado:**
```json
{
  "accion": "consulta",
  "producto": "coca cola",
  "tipo_consulta": "stock"
}
```

**Respuesta del Bot:**
```
Stock de Coca Cola:
- 500ml: 150 unidades
- 1L: 80 unidades
- 2L: 15 unidades (BAJO)
```

**Plan:** Basico, Pro, Business

---

### CASO 4: Alerta de Stock Bajo (Automatica)

**Trigger:** Cron job diario (hora configurada)
**Condicion:** stock_actual < stock_minimo

**Mensaje Automatico:**
```
ALERTA STOCK BAJO

Productos por agotarse:
- Coca Cola 500ml: 5 uds (min: 20)
- Pan integral: 3 uds (min: 10)
- Leche Gloria: 8 uds (min: 15)

Responde 'detalles' para mas info
```

**Plan:** Pro, Business

---

### CASO 5: Alerta de Vencimiento (Automatica)

**Trigger:** Cron job diario (hora configurada)
**Condicion:** fecha_vencimiento < hoy + dias_alerta

**Mensaje Automatico:**
```
PRODUCTOS POR VENCER

Proximos 7 dias:
- Yogurt Fresa (Lote: L2024-001)
  Vence: 15/01/2026 - Stock: 25
- Queso fresco (Lote: QF-889)
  Vence: 18/01/2026 - Stock: 10

Considera hacer promocion
```

**Plan:** Pro, Business

---

### CASO 6: Reporte Diario (Automatico)

**Trigger:** Cron job diario (hora configurada)

**Mensaje Automatico:**
```
RESUMEN DEL DIA - 11/01/2026

Ventas: S/. 1,250.00
Tickets: 45
Productos vendidos: 128

Top 3 productos:
1. Coca Cola 500ml (35 uds)
2. Pan frances (50 uds)
3. Galletas (28 uds)

vs ayer: +15%
```

**Plan:** Pro, Business

---

### CASO 7: Notificacion de Venta (Tiempo Real)

**Trigger:** Webhook cuando se crea venta

**Mensaje Automatico (al dueno):**
```
Nueva venta #1234

Cliente: Juan Perez
Total: S/. 45.50
Productos: 3 items
Cajero: Maria
Hora: 3:45 PM
```

**Plan:** Business

---

## PLANES Y LIMITES

### Plan Basico (+$2/mes)

```
+-------------------------------------------+
|  AGENTE IA BASICO - $2/mes                |
+-------------------------------------------+
|  Incluye:                                 |
|  - 60 minutos de audio/mes               |
|  - 200 mensajes de texto/mes             |
|                                           |
|  Funciones:                               |
|  [x] Entrada de inventario               |
|  [x] Salida de inventario                |
|  [x] Consulta de stock                   |
|  [ ] Alertas de stock bajo               |
|  [ ] Alertas de vencimiento              |
|  [ ] Reporte diario                      |
|  [ ] Notificacion de ventas              |
|                                           |
|  Costo real (Groq): $0                   |
|  Tu ganancia: $2 (100%)                  |
+-------------------------------------------+
```

### Plan Pro (+$5/mes)

```
+-------------------------------------------+
|  AGENTE IA PRO - $5/mes                   |
+-------------------------------------------+
|  Incluye:                                 |
|  - 300 minutos de audio/mes              |
|  - 1,000 mensajes de texto/mes           |
|                                           |
|  Funciones:                               |
|  [x] Entrada de inventario               |
|  [x] Salida de inventario                |
|  [x] Consulta de stock                   |
|  [x] Alertas de stock bajo (diarias)     |
|  [x] Alertas de vencimiento              |
|  [x] Reporte diario automatico           |
|  [ ] Notificacion de ventas              |
|                                           |
|  Costo real (Groq): $0                   |
|  Tu ganancia: $5 (100%)                  |
+-------------------------------------------+
```

### Plan Business (+$15/mes)

```
+-------------------------------------------+
|  AGENTE IA BUSINESS - $15/mes             |
+-------------------------------------------+
|  Incluye:                                 |
|  - 1,000 minutos de audio/mes            |
|  - 5,000 mensajes de texto/mes           |
|                                           |
|  Funciones:                               |
|  [x] Entrada de inventario               |
|  [x] Salida de inventario                |
|  [x] Consulta de stock                   |
|  [x] Alertas de stock bajo               |
|  [x] Alertas de vencimiento              |
|  [x] Reporte diario automatico           |
|  [x] Notificacion por cada venta         |
|  [x] Comandos personalizados             |
|  [x] Multi-usuario WhatsApp              |
|                                           |
|  Costo real (Groq/OpenAI mix): ~$3       |
|  Tu ganancia: $12 (80%)                  |
+-------------------------------------------+
```

---

## LIMITES GROQ (GRATIS)

```
+-------------------------------------------+
|  GROQ FREE TIER (por dia)                 |
+-------------------------------------------+
|                                           |
|  WHISPER (Audio a Texto)                  |
|  - 7,200 segundos/hora                   |
|  - = 120 minutos/hora                    |
|  - = ~2,000 minutos/dia                  |
|                                           |
|  LLAMA 3.3 70B (Texto a JSON)            |
|  - 30 requests/minuto                    |
|  - 1,800 requests/hora                   |
|  - = ~14,400 requests/dia                |
|                                           |
+-------------------------------------------+
|  CAPACIDAD TOTAL DIARIA:                  |
|  - ~4,000 audios de 30 seg               |
|  - ~14,400 textos                        |
|  - Suficiente para ~400 clientes activos |
+-------------------------------------------+
```

---

## CONFIGURACION N8N

### Workflow Principal: Procesar Mensaje WhatsApp

```json
{
  "name": "POS - Procesar Mensaje WhatsApp",
  "nodes": [
    {
      "name": "Webhook WhatsApp",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp-{{$env.EMPRESA_ID}}",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Validar Empresa",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.API_URL}}/api/v1/whatsapp/validar",
        "method": "POST",
        "body": {
          "empresa_id": "={{$json.empresa_id}}",
          "numero": "={{$json.from}}"
        }
      }
    },
    {
      "name": "Es Audio?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.messageType}}",
              "value2": "audioMessage"
            }
          ]
        }
      }
    },
    {
      "name": "Descargar Audio",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{$json.audioUrl}}",
        "method": "GET",
        "responseFormat": "file"
      }
    },
    {
      "name": "Groq Whisper",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.groq.com/openai/v1/audio/transcriptions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.GROQ_API_KEY}}"
        },
        "bodyContentType": "multipart-form-data",
        "body": {
          "file": "={{$binary.data}}",
          "model": "whisper-large-v3"
        }
      }
    },
    {
      "name": "Groq Llama (Extraer JSON)",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.GROQ_API_KEY}}"
        },
        "body": {
          "model": "llama-3.3-70b-versatile",
          "messages": [
            {
              "role": "system",
              "content": "Eres un asistente de inventario. Extrae los datos del mensaje y responde SOLO con JSON valido. Acciones posibles: entrada, salida, consulta, otro."
            },
            {
              "role": "user",
              "content": "={{$json.text}}"
            }
          ],
          "response_format": { "type": "json_object" }
        }
      }
    },
    {
      "name": "Procesar en API",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.API_URL}}/api/v1/inventario/movimientos/voz",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.API_TOKEN}}"
        },
        "body": "={{$json.choices[0].message.content}}"
      }
    },
    {
      "name": "Enviar Respuesta WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.EVOLUTION_URL}}/message/sendText/{{$env.INSTANCIA}}",
        "method": "POST",
        "headers": {
          "apikey": "{{$env.EVOLUTION_API_KEY}}"
        },
        "body": {
          "number": "={{$json.from}}",
          "text": "={{$json.respuesta}}"
        }
      }
    }
  ]
}
```

### Workflow: Alerta Stock Bajo (Cron)

```json
{
  "name": "POS - Alerta Stock Bajo",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "triggerTimes": {
          "item": [{ "hour": 8, "minute": 0 }]
        }
      }
    },
    {
      "name": "Obtener Empresas con Alerta Activa",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.API_URL}}/api/v1/whatsapp/alertas-activas",
        "method": "GET"
      }
    },
    {
      "name": "Loop Empresas",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Obtener Productos Stock Bajo",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.API_URL}}/api/v1/inventario/stock-bajo",
        "method": "GET",
        "headers": {
          "x-empresa-id": "={{$json.empresa_id}}"
        }
      }
    },
    {
      "name": "Hay Productos?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.data.length}}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      }
    },
    {
      "name": "Formatear Mensaje",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "const productos = items[0].json.data;\nlet mensaje = 'ALERTA STOCK BAJO\\n\\nProductos por agotarse:\\n';\nproductos.forEach(p => {\n  mensaje += `- ${p.nombre}: ${p.stock} uds (min: ${p.stock_minimo})\\n`;\n});\nmensaje += '\\nResponde \"detalles\" para mas info';\nreturn [{ json: { mensaje } }];"
      }
    },
    {
      "name": "Enviar WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{$env.EVOLUTION_URL}}/message/sendText/{{$json.instancia}}",
        "method": "POST",
        "body": {
          "number": "={{$json.telefono_admin}}",
          "text": "={{$json.mensaje}}"
        }
      }
    }
  ]
}
```

---

## ENDPOINTS API

### Endpoints WhatsApp

| Metodo | Endpoint | Descripcion | Rol |
|--------|----------|-------------|-----|
| GET | `/whatsapp/config` | Obtener configuracion | Admin |
| PUT | `/whatsapp/config` | Actualizar configuracion | Admin |
| POST | `/whatsapp/conectar` | Iniciar conexion (genera QR) | Admin |
| POST | `/whatsapp/desconectar` | Desconectar WhatsApp | Admin |
| GET | `/whatsapp/qr` | Obtener codigo QR actual | Admin |
| GET | `/whatsapp/estado` | Estado de conexion | Admin |
| POST | `/whatsapp/validar` | Validar numero autorizado | Sistema |
| GET | `/whatsapp/uso` | Obtener uso del mes | Admin |
| GET | `/whatsapp/historial` | Historial de mensajes | Admin |

### Endpoints Inventario (para N8N)

| Metodo | Endpoint | Descripcion | Rol |
|--------|----------|-------------|-----|
| POST | `/inventario/movimientos/voz` | Procesar movimiento por voz | Sistema |
| GET | `/inventario/stock/buscar` | Buscar productos | Sistema |
| GET | `/inventario/stock-bajo` | Listar stock bajo | Sistema |
| GET | `/inventario/por-vencer` | Listar por vencer | Sistema |

### POST /whatsapp/conectar

```typescript
// Response
{
  "success": true,
  "data": {
    "instancia_id": "pos-empresa-abc123",
    "qr_code": "data:image/png;base64,...",
    "qr_expira": "2026-01-11T15:30:00Z",
    "estado": "escaneando_qr"
  }
}
```

### POST /inventario/movimientos/voz

```typescript
// Request (desde N8N)
{
  "empresa_id": "uuid",
  "numero_origen": "51987654321",
  "tipo_mensaje": "audio",
  "texto_transcrito": "llegaron cincuenta cajas de coca cola",
  "json_extraido": {
    "accion": "entrada",
    "producto": "coca cola",
    "cantidad": 50,
    "unidad": "cajas"
  }
}

// Response
{
  "success": true,
  "data": {
    "movimiento_id": "uuid",
    "producto": {
      "id": "uuid",
      "nombre": "Coca Cola 500ml"
    },
    "cantidad": 50,
    "stock_anterior": 100,
    "stock_nuevo": 150,
    "mensaje_respuesta": "Registre entrada de 50 cajas de Coca Cola 500ml. Stock actual: 150"
  }
}
```

---

## PROMPT SISTEMA PARA LLAMA

```
Eres un asistente de inventario para un sistema POS. Tu trabajo es extraer informacion estructurada de mensajes de voz o texto.

REGLAS:
1. Responde SOLO con JSON valido
2. No agregues texto adicional
3. Si no entiendes algo, usa null

ACCIONES POSIBLES:
- "entrada": Mercaderia que llega/ingresa
- "salida": Mercaderia que sale/vende/se dana
- "consulta": Pregunta sobre stock
- "compra_proveedor": Registrar compra/deuda con proveedor (puede incluir pago parcial)
- "pago_proveedor": Registrar pago a proveedor
- "deuda_proveedor": Consultar cuanto debemos a UN proveedor especifico
- "deuda_total": Consultar cuanto debemos a TODOS los proveedores
- "otro": Mensaje no relacionado con inventario

FORMATO DE RESPUESTA:
{
  "accion": "entrada|salida|consulta|compra_proveedor|pago_proveedor|deuda_proveedor|deuda_total|otro",
  "productos": [                                    // Array para multiples productos
    {"nombre": "producto1", "cantidad": 10, "monto": 100},
    {"nombre": "producto2", "cantidad": 5, "monto": 50}
  ] o null,
  "producto": "nombre del producto" o null,         // Para un solo producto (retrocompatible)
  "cantidad": numero o null,
  "unidad": "cajas|unidades|kg|etc" o null,
  "proveedor": "nombre proveedor" o null,
  "monto_total": numero (total de la compra) o null,
  "monto_pagado": numero (cuanto pago en el momento) o null,
  "motivo": "venta|dano|vencimiento|etc" o null,
  "notas": "informacion adicional" o null
}

EJEMPLOS:

Entrada: "llegaron 50 cajas de coca cola"
Salida: {"accion":"entrada","producto":"coca cola","cantidad":50,"unidad":"cajas","productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":null,"notas":null}

Entrada: "vendi 5 polos talla M"
Salida: {"accion":"salida","producto":"polos talla M","cantidad":5,"unidad":null,"productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":"venta","notas":null}

Entrada: "cuanto stock tengo de arroz"
Salida: {"accion":"consulta","producto":"arroz","cantidad":null,"unidad":null,"productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":null,"notas":null}

Entrada: "la tienda X nos dejo 20 pollos y le debemos 100 soles"
Salida: {"accion":"compra_proveedor","producto":"pollos","cantidad":20,"unidad":null,"productos":null,"proveedor":"tienda X","monto_total":100,"monto_pagado":null,"motivo":null,"notas":null}

Entrada: "tienda X nos dejo 20 pollos a 100, 50 cervezas a 200, le pagamos 100"
Salida: {"accion":"compra_proveedor","producto":null,"cantidad":null,"unidad":null,"productos":[{"nombre":"pollos","cantidad":20,"monto":100},{"nombre":"cervezas","cantidad":50,"monto":200}],"proveedor":"tienda X","monto_total":300,"monto_pagado":100,"motivo":null,"notas":null}

Entrada: "tienda X nos dejo 40 gaseosas a 400, le pagamos todo"
Salida: {"accion":"compra_proveedor","producto":"gaseosas","cantidad":40,"unidad":null,"productos":null,"proveedor":"tienda X","monto_total":400,"monto_pagado":400,"motivo":null,"notas":null}

Entrada: "pagamos a la tienda X 50 soles"
Salida: {"accion":"pago_proveedor","producto":null,"cantidad":null,"unidad":null,"productos":null,"proveedor":"tienda X","monto_total":null,"monto_pagado":50,"motivo":null,"notas":null}

Entrada: "cuanto le debemos a tienda X"
Salida: {"accion":"deuda_proveedor","producto":null,"cantidad":null,"unidad":null,"productos":null,"proveedor":"tienda X","monto_total":null,"monto_pagado":null,"motivo":null,"notas":null}

Entrada: "cuanto debo en total" o "cuanto debo a todos mis proveedores"
Salida: {"accion":"deuda_total","producto":null,"cantidad":null,"unidad":null,"productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":null,"notas":null}

Entrada: "a quienes les debo"
Salida: {"accion":"deuda_total","producto":null,"cantidad":null,"unidad":null,"productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":null,"notas":"listar proveedores"}

Entrada: "hola como estas"
Salida: {"accion":"otro","producto":null,"cantidad":null,"unidad":null,"productos":null,"proveedor":null,"monto_total":null,"monto_pagado":null,"motivo":null,"notas":"saludo"}
```

---

## FLUJO DE PROVEEDORES Y CUENTAS POR PAGAR

### Identificacion del Proveedor

El agente IA identifica proveedores usando **fuzzy matching** en `nombre_comercial` o `razon_social`:

```
Usuario dice: "la tienda juan nos dejo mercaderia"
                |
                v
        +-----------------------+
        |   Buscar proveedor    |
        |   en base de datos    |
        +-----------------------+
                |
        +-------+-------+
        |               |
    ENCONTRADO     NO ENCONTRADO
        |               |
        v               v
    Usar ID         Preguntar:
    existente       "No encontre ese proveedor.
                     ¿Quieres que lo cree?"
```

### Ejemplo Completo: Compra a Proveedor

```
+-------------------------------------------------------------------+
|  FLUJO: COMPRA A PROVEEDOR                                         |
+-------------------------------------------------------------------+

Usuario: "La tienda X nos dejo 20 pollos y le debemos 100 soles"
                |
                v
+---------------+---------------+
|   IA extrae JSON:             |
|   {                           |
|     "accion": "compra_proveedor",
|     "producto": "pollos",     |
|     "cantidad": 20,           |
|     "proveedor": "tienda X",  |
|     "monto": 100              |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   API Backend:                |
|   1. Buscar proveedor         |
|      "tienda X" (fuzzy match) |
|   2. Si no existe, crear      |
|   3. Crear registro compra    |
|   4. Actualizar deuda         |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   Base de Datos:              |
|                               |
|   compras:                    |
|   - numero: CMP-001           |
|   - proveedor_id: uuid        |
|   - total: 100.00             |
|   - estado_pago: pendiente    |
|                               |
|   compra_detalles:            |
|   - producto_texto: "pollos"  |
|   - cantidad: 20              |
|   - precio_unitario: 5.00     |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   Respuesta al usuario:       |
|                               |
|   "Registre compra a Tienda X:|
|    - 20 pollos por S/ 100.00  |
|    Deuda total: S/ 100.00"    |
+---------------+---------------+
```

### Ejemplo: Segundo Pedido del Mismo Proveedor

```
Usuario: "La tienda X nos volvio a dejar 50 cervezas, le debemos 10 soles"
                |
                v
+---------------+---------------+
|   API Backend:                |
|   1. Buscar proveedor         |
|      "tienda X" -> ENCONTRADO |
|   2. Crear nueva compra       |
|   3. SUMAR a deuda existente  |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   compras:                    |
|   [CMP-001] pollos  S/ 100    |
|   [CMP-002] cervezas S/ 10    |
|                               |
|   Deuda total: S/ 110.00      |
+---------------+---------------+
                |
                v
|   "Registre compra a Tienda X:|
|    - 50 cervezas por S/ 10.00 |
|    Deuda anterior: S/ 100.00  |
|    Deuda total: S/ 110.00"    |
```

### Ejemplo: Pago a Proveedor

```
Usuario: "Pagamos a la tienda X 50 soles"
                |
                v
+---------------+---------------+
|   IA extrae JSON:             |
|   {                           |
|     "accion": "pago_proveedor",
|     "proveedor": "tienda X",  |
|     "monto": 50               |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   API Backend:                |
|   1. Buscar proveedor         |
|   2. Registrar pago           |
|   3. Actualizar deuda         |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   pagos_proveedor:            |
|   - numero: PAG-001           |
|   - proveedor_id: uuid        |
|   - monto: 50.00              |
|                               |
|   Deuda anterior: S/ 110.00   |
|   Pago: S/ 50.00              |
|   Deuda actual: S/ 60.00      |
+---------------+---------------+
                |
                v
|   "Registre pago a Tienda X:  |
|    - Monto: S/ 50.00          |
|    Deuda anterior: S/ 110.00  |
|    Deuda pendiente: S/ 60.00" |
```

### Ejemplo: Consulta de Deuda a UN Proveedor

```
Usuario: "Cuanto le debemos a tienda X"
                |
                v
+---------------+---------------+
|   IA extrae JSON:             |
|   {                           |
|     "accion": "deuda_proveedor",
|     "proveedor": "tienda X"   |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   API consulta vista:         |
|   cuenta_corriente_proveedor  |
|   WHERE proveedor ILIKE       |
|   '%tienda x%'                |
+---------------+---------------+
                |
                v
|   "Deuda con Tienda X:        |
|    - Total compras: S/ 110.00 |
|    - Total pagado: S/ 50.00   |
|    - Saldo pendiente: S/ 60.00|
|                               |
|    Compras pendientes:        |
|    - CMP-001: S/ 50.00 (parcial)
|    - CMP-002: S/ 10.00        |
|                               |
|    Ultima compra: hace 2 dias |
|    Ultimo pago: hoy"          |
```

### Ejemplo: Consulta de Deuda TOTAL (Todos los Proveedores)

```
Usuario: "Cuanto debo en total" o "A quienes les debo"
                |
                v
+---------------+---------------+
|   IA extrae JSON:             |
|   {                           |
|     "accion": "deuda_total"   |
|   }                           |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   API: GET                    |
|   /proveedores/deuda-total    |
+---------------+---------------+
                |
                v
+---------------+---------------+
|   SELECT                      |
|     SUM(saldo_pendiente)      |
|   FROM                        |
|     cuenta_corriente_proveedor|
|   WHERE empresa_id = 'xxx'    |
+---------------+---------------+
                |
                v
|   "Deuda total: S/ 850.00     |
|                               |
|    Proveedores con deuda:     |
|    1. Tienda X     - S/ 200   |
|    2. Distribuidora - S/ 350  |
|    3. Mayorista    - S/ 300   |
|                               |
|    Total proveedores: 3"      |
```

### Respuestas del Bot

**Compra registrada:**
```
Registre compra a [PROVEEDOR]:
- [CANTIDAD] [PRODUCTO] por S/ [MONTO]
- Deuda total con este proveedor: S/ [DEUDA_TOTAL]
```

**Pago registrado:**
```
Registre pago a [PROVEEDOR]:
- Monto pagado: S/ [MONTO]
- Deuda anterior: S/ [DEUDA_ANTERIOR]
- Deuda pendiente: S/ [DEUDA_ACTUAL]
```

**Proveedor no encontrado:**
```
No encontre al proveedor "[NOMBRE]".
¿Quieres que lo registre? Responde "si" para crearlo.
```

**Proveedor creado automaticamente:**
```
Cree nuevo proveedor: [NOMBRE]
Registre compra de [CANTIDAD] [PRODUCTO] por S/ [MONTO]
```

**Compra con pago parcial:**
```
Registre compra a [PROVEEDOR]:
- 20 pollos por S/ 100.00
- 50 cervezas por S/ 200.00
- Total: S/ 300.00
- Pagado: S/ 100.00
- Pendiente: S/ 200.00
```

**Deuda total (todos los proveedores):**
```
Deuda total con proveedores: S/ 850.00

Detalle por proveedor:
1. Tienda X      - S/ 200.00
2. Distribuidora - S/ 350.00
3. Mayorista     - S/ 300.00

Total proveedores con deuda: 3
```

**Lista de proveedores con deuda:**
```
Proveedores con deuda pendiente:

1. Tienda X
   - Deuda: S/ 200.00
   - Ultima compra: hace 2 dias

2. Distribuidora
   - Deuda: S/ 350.00
   - Ultima compra: hace 5 dias

3. Mayorista
   - Deuda: S/ 300.00
   - Ultima compra: hoy
```

---

## VARIABLES DE ENTORNO N8N

```env
# API POS
API_URL=http://localhost:4000
API_TOKEN=tu-token-servicio

# Groq (Gratis)
GROQ_API_KEY=gsk_xxxxxxxxxx

# OpenAI (Backup)
OPENAI_API_KEY=sk-xxxxxxxxxx

# Evolution API
EVOLUTION_URL=http://localhost:8080
EVOLUTION_API_KEY=tu-api-key

# Base de datos (para queries directas si necesario)
DATABASE_URL=postgresql://user:pass@localhost:5435/pos
```

---

## COSTOS Y RENTABILIDAD

### Costo por Interaccion

| Tipo | Groq (Gratis) | OpenAI (Backup) |
|------|---------------|-----------------|
| 1 min audio | $0 | $0.006 |
| 1 mensaje texto | $0 | $0.000375 |
| Audio + LLM (30 seg) | $0 | $0.0034 |

### Rentabilidad por Plan

| Plan | Precio | Costo Real | Ganancia | Margen |
|------|--------|------------|----------|--------|
| Basico | $2/mes | $0 | $2 | 100% |
| Pro | $5/mes | $0 | $5 | 100% |
| Business | $15/mes | ~$3 | $12 | 80% |

### Capacidad Groq Gratis

| Clientes | Uso/dia | Groq Cubre | OpenAI Backup | Costo/mes |
|----------|---------|------------|---------------|-----------|
| 100 | 1,000 msg | 100% | 0% | $0 |
| 200 | 2,000 msg | 100% | 0% | $0 |
| 400 | 4,000 msg | 100% | 0% | $0 |
| 600 | 6,000 msg | 70% | 30% | ~$15 |
| 1,000 | 10,000 msg | 40% | 60% | ~$50 |

---

## ARQUITECTURA MULTI-TENANT

```
+-------------------------------------------------------------------+
|  MULTI-TENANT WHATSAPP                                            |
+-------------------------------------------------------------------+
|                                                                   |
|  Evolution API (Self-hosted en tu VPS)                            |
|  +-------------------------------------------------------------+  |
|  |                                                             |  |
|  |  Instancia: pos-empresa-001    Instancia: pos-empresa-002  |  |
|  |  +-------------------------+   +-------------------------+ |  |
|  |  | Empresa: Tienda Rosa    |   | Empresa: Bodega Juan    | |  |
|  |  | Tel: +51 987654321      |   | Tel: +51 912345678      | |  |
|  |  | Estado: Conectado       |   | Estado: Conectado       | |  |
|  |  +-------------------------+   +-------------------------+ |  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  Cada empresa:                                                    |
|  1. Escanea su propio QR                                         |
|  2. Conecta su WhatsApp personal/business                        |
|  3. Tiene su webhook independiente                               |
|  4. Sus datos estan aislados                                     |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## REFERENCIAS

- Evolution API: https://doc.evolution-api.com/
- Groq: https://console.groq.com/
- N8N: https://docs.n8n.io/
- Ver tambien: `06-API-ENDPOINTS.md` (seccion WhatsApp)
- Ver tambien: `03-BASE-DATOS-COMPLETA.md` (tablas WhatsApp)
