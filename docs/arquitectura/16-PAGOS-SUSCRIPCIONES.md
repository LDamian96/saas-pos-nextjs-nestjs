# 16. PAGOS Y SUSCRIPCIONES (PayPal + Stripe)

## ARQUITECTURA DE PAGOS

```
+-------------------------------------------------------------------+
|                    FLUJO DE SUSCRIPCION                           |
+-------------------------------------------------------------------+
|                                                                   |
|  1. Usuario selecciona plan                                       |
|                    |                                               |
|                    v                                               |
|  2. Elige metodo de pago                                          |
|     +-------------------+    +-------------------+                 |
|     |      PayPal       |    |      Stripe       |                 |
|     |  (Tarjeta/PayPal) |    |  (Tarjeta/Crypto) |                 |
|     +-------------------+    +-------------------+                 |
|                    |                                               |
|                    v                                               |
|  3. Procesa pago recurrente                                       |
|                    |                                               |
|                    v                                               |
|  4. Webhook notifica a tu API                                     |
|                    |                                               |
|                    v                                               |
|  5. Actualiza suscripcion en BD                                   |
|     - Activa plan                                                 |
|     - Activa addons                                               |
|     - Registra pago                                               |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## TABLAS DE BASE DE DATOS

### Tabla: planes

```sql
CREATE TABLE planes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificador
    codigo                  VARCHAR(50) UNIQUE NOT NULL,  -- basico, pro, business
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Precios (USD)
    precio_mensual          DECIMAL(10,2) NOT NULL,
    precio_anual            DECIMAL(10,2),               -- Con descuento
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- IDs de Stripe/PayPal
    stripe_price_id_mensual VARCHAR(100),                -- price_xxxxx
    stripe_price_id_anual   VARCHAR(100),
    paypal_plan_id_mensual  VARCHAR(100),                -- P-xxxxx
    paypal_plan_id_anual    VARCHAR(100),

    -- Limites
    max_sucursales          INTEGER DEFAULT 1,
    max_usuarios            INTEGER DEFAULT 2,
    max_productos           INTEGER,                     -- NULL = ilimitado

    -- Caracteristicas (JSON)
    caracteristicas         JSONB DEFAULT '[]',
    -- ["Productos ilimitados", "2 usuarios", "Reportes basicos"]

    -- Orden y estado
    orden                   INTEGER DEFAULT 0,
    destacado               BOOLEAN DEFAULT false,       -- Mostrar como recomendado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Planes iniciales
INSERT INTO planes (codigo, nombre, descripcion, precio_mensual, precio_anual, max_sucursales, max_usuarios, max_productos, caracteristicas, orden, destacado) VALUES
('basico', 'Basico', 'Ideal para empezar', 18.00, 180.00, 1, 2, 500,
 '["1 sucursal", "2 usuarios", "500 productos", "Tickets ilimitados", "Reportes basicos"]',
 1, false),
('pro', 'Pro', 'Para negocios en crecimiento', 35.00, 350.00, 3, 10, NULL,
 '["3 sucursales", "10 usuarios", "Productos ilimitados", "Reportes avanzados", "Multi-caja"]',
 2, true),
('business', 'Business', 'Para grandes empresas', 60.00, 600.00, NULL, NULL, NULL,
 '["Sucursales ilimitadas", "Usuarios ilimitados", "API access", "Soporte prioritario"]',
 3, false);
```

### Campos planes

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador |
| codigo | VARCHAR(50) | Si | Codigo unico |
| nombre | VARCHAR(100) | Si | Nombre plan |
| descripcion | TEXT | No | Descripcion |
| precio_mensual | DECIMAL(10,2) | Si | Precio mensual |
| precio_anual | DECIMAL(10,2) | No | Precio anual |
| moneda | VARCHAR(3) | No | Moneda (USD) |
| stripe_price_id_mensual | VARCHAR(100) | No | ID Stripe mensual |
| stripe_price_id_anual | VARCHAR(100) | No | ID Stripe anual |
| paypal_plan_id_mensual | VARCHAR(100) | No | ID PayPal mensual |
| paypal_plan_id_anual | VARCHAR(100) | No | ID PayPal anual |
| max_sucursales | INTEGER | No | Limite sucursales |
| max_usuarios | INTEGER | No | Limite usuarios |
| max_productos | INTEGER | No | Limite productos |
| caracteristicas | JSONB | No | Lista features |
| orden | INTEGER | No | Orden display |
| destacado | BOOLEAN | No | Plan destacado |
| activo | BOOLEAN | No | Activo |
| created_at | TIMESTAMP | Auto | Creacion |
| updated_at | TIMESTAMP | Auto | Actualizacion |

---

### Tabla: addons

```sql
CREATE TABLE addons (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificador
    codigo                  VARCHAR(50) UNIQUE NOT NULL,
    nombre                  VARCHAR(100) NOT NULL,
    descripcion             TEXT,

    -- Precios (USD)
    precio_mensual          DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- IDs de Stripe/PayPal
    stripe_price_id         VARCHAR(100),
    paypal_plan_id          VARCHAR(100),

    -- Caracteristicas
    caracteristicas         JSONB DEFAULT '[]',

    -- Tipo
    tipo                    VARCHAR(50),
    -- facturacion, agente_ia_basico, agente_ia_pro, agente_ia_business, ecommerce

    -- Estado
    activo                  BOOLEAN DEFAULT true,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addons iniciales
INSERT INTO addons (codigo, nombre, descripcion, precio_mensual, tipo, caracteristicas) VALUES
('facturacion', 'Facturacion Electronica', 'Boletas y Facturas SUNAT', 5.00, 'facturacion',
 '["Boletas electronicas", "Facturas electronicas", "Notas de credito", "Integracion SUNAT"]'),
('agente_ia_basico', 'Agente IA Basico', 'WhatsApp + IA para inventario', 2.00, 'agente_ia',
 '["60 min audio/mes", "200 mensajes/mes", "Entrada/salida inventario", "Consulta stock"]'),
('agente_ia_pro', 'Agente IA Pro', 'IA con alertas automaticas', 5.00, 'agente_ia',
 '["300 min audio/mes", "1000 mensajes/mes", "Alertas stock", "Reporte diario"]'),
('agente_ia_business', 'Agente IA Business', 'IA completo empresarial', 15.00, 'agente_ia',
 '["1000 min audio/mes", "5000 mensajes/mes", "Notificacion ventas", "Multi-usuario"]);
```

---

### Tabla: suscripciones

```sql
CREATE TABLE suscripciones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plan_id                 UUID NOT NULL REFERENCES planes(id),

    -- IDs externos
    stripe_subscription_id  VARCHAR(100),            -- sub_xxxxx
    stripe_customer_id      VARCHAR(100),            -- cus_xxxxx
    paypal_subscription_id  VARCHAR(100),            -- I-xxxxx

    -- Facturacion
    periodo                 VARCHAR(20) DEFAULT 'mensual',  -- mensual, anual
    precio_actual           DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',

    -- Estado
    estado                  VARCHAR(30) DEFAULT 'activa',
    -- activa, cancelada, pausada, vencida, trial, pendiente_pago

    -- Fechas
    fecha_inicio            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin               TIMESTAMP,               -- NULL = activa
    fecha_proximo_pago      TIMESTAMP,
    fecha_cancelacion       TIMESTAMP,

    -- Trial
    es_trial                BOOLEAN DEFAULT false,
    trial_termina           TIMESTAMP,

    -- Metadata
    metodo_pago             VARCHAR(20),             -- stripe, paypal
    ultimo_4_digitos        VARCHAR(4),              -- Ultimos 4 digitos tarjeta
    marca_tarjeta           VARCHAR(20),             -- visa, mastercard

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelado_por           UUID REFERENCES usuarios(id),
    motivo_cancelacion      TEXT,

    CONSTRAINT uk_suscripcion_empresa UNIQUE (empresa_id)
);

CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_suscripciones_stripe ON suscripciones(stripe_subscription_id);
CREATE INDEX idx_suscripciones_paypal ON suscripciones(paypal_subscription_id);
```

### Campos suscripciones

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador |
| empresa_id | UUID | Si | FK empresa |
| plan_id | UUID | Si | FK plan |
| stripe_subscription_id | VARCHAR(100) | No | ID Stripe |
| stripe_customer_id | VARCHAR(100) | No | Customer Stripe |
| paypal_subscription_id | VARCHAR(100) | No | ID PayPal |
| periodo | VARCHAR(20) | No | mensual/anual |
| precio_actual | DECIMAL(10,2) | Si | Precio pagado |
| moneda | VARCHAR(3) | No | Moneda |
| estado | VARCHAR(30) | No | Estado actual |
| fecha_inicio | TIMESTAMP | No | Inicio |
| fecha_fin | TIMESTAMP | No | Fin |
| fecha_proximo_pago | TIMESTAMP | No | Proximo cobro |
| fecha_cancelacion | TIMESTAMP | No | Cancelacion |
| es_trial | BOOLEAN | No | Es prueba |
| trial_termina | TIMESTAMP | No | Fin trial |
| metodo_pago | VARCHAR(20) | No | stripe/paypal |
| ultimo_4_digitos | VARCHAR(4) | No | Ultimos digitos |
| marca_tarjeta | VARCHAR(20) | No | Marca tarjeta |
| created_at | TIMESTAMP | Auto | Creacion |
| updated_at | TIMESTAMP | Auto | Actualizacion |
| cancelado_por | UUID | No | Usuario cancelacion |
| motivo_cancelacion | TEXT | No | Motivo |

---

### Tabla: suscripcion_addons

```sql
CREATE TABLE suscripcion_addons (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suscripcion_id          UUID NOT NULL REFERENCES suscripciones(id) ON DELETE CASCADE,
    addon_id                UUID NOT NULL REFERENCES addons(id),

    -- IDs externos
    stripe_subscription_item_id VARCHAR(100),        -- si_xxxxx
    paypal_addon_id         VARCHAR(100),

    -- Precio
    precio_actual           DECIMAL(10,2) NOT NULL,

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'activo',  -- activo, cancelado
    fecha_inicio            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion       TIMESTAMP,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_suscripcion_addon UNIQUE (suscripcion_id, addon_id)
);

CREATE INDEX idx_suscripcion_addons ON suscripcion_addons(suscripcion_id);
```

---

### Tabla: pagos

```sql
CREATE TABLE pagos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    suscripcion_id          UUID REFERENCES suscripciones(id),

    -- IDs externos
    stripe_payment_intent_id VARCHAR(100),           -- pi_xxxxx
    stripe_invoice_id       VARCHAR(100),            -- in_xxxxx
    paypal_capture_id       VARCHAR(100),            -- xxxxx

    -- Monto
    monto                   DECIMAL(10,2) NOT NULL,
    moneda                  VARCHAR(3) DEFAULT 'USD',
    monto_local             DECIMAL(10,2),           -- En moneda local (PEN)
    tipo_cambio             DECIMAL(10,4),

    -- Concepto
    concepto                VARCHAR(200),            -- "Plan Pro - Enero 2026"
    tipo                    VARCHAR(30),             -- suscripcion, addon, upgrade, renovacion

    -- Estado
    estado                  VARCHAR(20) DEFAULT 'pendiente',
    -- pendiente, completado, fallido, reembolsado

    -- Metodo
    metodo_pago             VARCHAR(20),             -- stripe, paypal
    marca_tarjeta           VARCHAR(20),
    ultimo_4_digitos        VARCHAR(4),

    -- Fechas
    fecha_pago              TIMESTAMP,
    fecha_vencimiento       TIMESTAMP,

    -- Facturacion
    requiere_factura        BOOLEAN DEFAULT false,
    factura_emitida         BOOLEAN DEFAULT false,
    factura_numero          VARCHAR(50),

    -- Metadata
    metadata                JSONB,                   -- Datos adicionales

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pagos_empresa ON pagos(empresa_id);
CREATE INDEX idx_pagos_suscripcion ON pagos(suscripcion_id);
CREATE INDEX idx_pagos_stripe ON pagos(stripe_payment_intent_id);
CREATE INDEX idx_pagos_paypal ON pagos(paypal_capture_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
```

### Campos pagos

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador |
| empresa_id | UUID | Si | FK empresa |
| suscripcion_id | UUID | No | FK suscripcion |
| stripe_payment_intent_id | VARCHAR(100) | No | ID Stripe |
| stripe_invoice_id | VARCHAR(100) | No | Invoice Stripe |
| paypal_capture_id | VARCHAR(100) | No | ID PayPal |
| monto | DECIMAL(10,2) | Si | Monto USD |
| moneda | VARCHAR(3) | No | Moneda |
| monto_local | DECIMAL(10,2) | No | Monto PEN |
| tipo_cambio | DECIMAL(10,4) | No | Tipo cambio |
| concepto | VARCHAR(200) | No | Concepto |
| tipo | VARCHAR(30) | No | Tipo pago |
| estado | VARCHAR(20) | No | Estado |
| metodo_pago | VARCHAR(20) | No | Metodo |
| marca_tarjeta | VARCHAR(20) | No | Marca |
| ultimo_4_digitos | VARCHAR(4) | No | Ultimos 4 |
| fecha_pago | TIMESTAMP | No | Fecha pago |
| fecha_vencimiento | TIMESTAMP | No | Vencimiento |
| requiere_factura | BOOLEAN | No | Necesita factura |
| factura_emitida | BOOLEAN | No | Ya emitida |
| factura_numero | VARCHAR(50) | No | Numero factura |
| metadata | JSONB | No | Datos extra |
| created_at | TIMESTAMP | Auto | Creacion |
| updated_at | TIMESTAMP | Auto | Actualizacion |

---

## CONFIGURACION STRIPE

### Variables de Entorno

```env
# Stripe (Modo Test)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe (Modo Produccion)
# STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
# STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Servicio Stripe

```typescript
// backend/src/modules/pagos/services/stripe.service.ts
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  // Crear cliente
  async createCustomer(empresa: Empresa, usuario: Usuario): Promise<string> {
    const customer = await this.stripe.customers.create({
      email: usuario.email,
      name: empresa.nombreComercial,
      metadata: {
        empresa_id: empresa.id,
        usuario_id: usuario.id,
      },
    });
    return customer.id;
  }

  // Crear suscripcion
  async createSubscription(
    customerId: string,
    priceId: string,
    addonPriceIds: string[] = [],
  ): Promise<Stripe.Subscription> {
    const items = [{ price: priceId }];
    addonPriceIds.forEach(id => items.push({ price: id }));

    return this.stripe.subscriptions.create({
      customer: customerId,
      items,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // Crear Checkout Session
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,
      },
    });
  }

  // Cancelar suscripcion
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  // Cambiar plan
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  // Agregar addon
  async addAddon(
    subscriptionId: string,
    addonPriceId: string,
  ): Promise<Stripe.SubscriptionItem> {
    return this.stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: addonPriceId,
    });
  }

  // Remover addon
  async removeAddon(subscriptionItemId: string): Promise<Stripe.DeletedSubscriptionItem> {
    return this.stripe.subscriptionItems.del(subscriptionItemId);
  }

  // Construir evento de webhook
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET'),
    );
  }
}
```

### Webhook Stripe

```typescript
// backend/src/modules/pagos/controllers/stripe-webhook.controller.ts
@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private stripeService: StripeService,
    private suscripcionService: SuscripcionService,
    private pagoService: PagoService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );
    } catch (err) {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    // Activar suscripcion
    await this.suscripcionService.activar({
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Registrar pago
    await this.pagoService.registrar({
      stripeInvoiceId: invoice.id,
      monto: invoice.amount_paid / 100,
      estado: 'completado',
    });

    // Renovar suscripcion
    await this.suscripcionService.renovar(invoice.subscription as string);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Marcar pago fallido
    await this.pagoService.registrar({
      stripeInvoiceId: invoice.id,
      monto: invoice.amount_due / 100,
      estado: 'fallido',
    });

    // Notificar al usuario
    // await this.notificacionService.enviar(...)
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    await this.suscripcionService.cancelar(subscription.id);
  }
}
```

---

## CONFIGURACION PAYPAL

### Variables de Entorno

```env
# PayPal (Modo Sandbox)
PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxx
PAYPAL_MODE=sandbox

# PayPal (Modo Produccion)
# PAYPAL_MODE=live
```

### Servicio PayPal

```typescript
// backend/src/modules/pagos/services/paypal.service.ts
import { Injectable } from '@nestjs/common';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor(private config: ConfigService) {
    const environment = config.get('PAYPAL_MODE') === 'live'
      ? new paypal.core.LiveEnvironment(
          config.get('PAYPAL_CLIENT_ID'),
          config.get('PAYPAL_CLIENT_SECRET'),
        )
      : new paypal.core.SandboxEnvironment(
          config.get('PAYPAL_CLIENT_ID'),
          config.get('PAYPAL_CLIENT_SECRET'),
        );

    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  // Crear plan de suscripcion
  async createPlan(plan: Plan): Promise<string> {
    const request = {
      product_id: 'POS-SAAS',
      name: plan.nombre,
      description: plan.descripcion,
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: plan.precio_mensual.toString(),
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    };

    const response = await this.client.execute({
      path: '/v1/billing/plans',
      method: 'POST',
      body: request,
    });

    return response.result.id;
  }

  // Crear suscripcion
  async createSubscription(
    planId: string,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<{ id: string; approvalUrl: string }> {
    const request = {
      plan_id: planId,
      application_context: {
        brand_name: 'POS SaaS',
        locale: 'es-PE',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const response = await this.client.execute({
      path: '/v1/billing/subscriptions',
      method: 'POST',
      body: request,
    });

    const approvalLink = response.result.links.find(
      (link: any) => link.rel === 'approve',
    );

    return {
      id: response.result.id,
      approvalUrl: approvalLink.href,
    };
  }

  // Obtener detalles de suscripcion
  async getSubscription(subscriptionId: string): Promise<any> {
    const response = await this.client.execute({
      path: `/v1/billing/subscriptions/${subscriptionId}`,
      method: 'GET',
    });
    return response.result;
  }

  // Cancelar suscripcion
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    await this.client.execute({
      path: `/v1/billing/subscriptions/${subscriptionId}/cancel`,
      method: 'POST',
      body: { reason },
    });
  }

  // Verificar webhook
  verifyWebhook(
    headers: Record<string, string>,
    body: any,
    webhookId: string,
  ): Promise<boolean> {
    // Implementar verificacion de webhook PayPal
    return true;
  }
}
```

### Webhook PayPal

```typescript
// backend/src/modules/pagos/controllers/paypal-webhook.controller.ts
@Controller('webhooks')
export class PayPalWebhookController {
  constructor(
    private paypalService: PayPalService,
    private suscripcionService: SuscripcionService,
    private pagoService: PagoService,
  ) {}

  @Post('paypal')
  @HttpCode(200)
  async handlePayPalWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
  ) {
    // Verificar webhook
    const isValid = await this.paypalService.verifyWebhook(
      headers,
      body,
      process.env.PAYPAL_WEBHOOK_ID,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = body.event_type;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await this.handleSubscriptionActivated(body.resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.handleSubscriptionCancelled(body.resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        await this.handlePaymentCompleted(body.resource);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await this.handlePaymentFailed(body.resource);
        break;
    }

    return { received: true };
  }

  private async handleSubscriptionActivated(subscription: any) {
    await this.suscripcionService.activarPayPal(subscription.id);
  }

  private async handleSubscriptionCancelled(subscription: any) {
    await this.suscripcionService.cancelarPayPal(subscription.id);
  }

  private async handlePaymentCompleted(payment: any) {
    await this.pagoService.registrarPayPal({
      captureId: payment.id,
      monto: parseFloat(payment.amount.total),
      estado: 'completado',
    });
  }
}
```

---

## ENDPOINTS API

### Endpoints Planes

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/planes` | Listar planes | No |
| GET | `/planes/{codigo}` | Detalle plan | No |
| GET | `/addons` | Listar addons | No |

### Endpoints Suscripciones

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/suscripciones/actual` | Mi suscripcion | Si |
| POST | `/suscripciones/checkout` | Iniciar checkout | Si |
| POST | `/suscripciones/cambiar-plan` | Cambiar plan | Admin |
| POST | `/suscripciones/cancelar` | Cancelar | Admin |
| POST | `/suscripciones/addons/agregar` | Agregar addon | Admin |
| POST | `/suscripciones/addons/quitar` | Quitar addon | Admin |
| GET | `/suscripciones/pagos` | Historial pagos | Admin |

### Endpoints Webhooks

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| POST | `/webhooks/stripe` | Webhook Stripe | No |
| POST | `/webhooks/paypal` | Webhook PayPal | No |

### POST /suscripciones/checkout

```typescript
// Request
{
  "plan_codigo": "pro",
  "periodo": "mensual",           // mensual | anual
  "metodo_pago": "stripe",        // stripe | paypal
  "addons": ["facturacion", "agente_ia_basico"]
}

// Response (Stripe)
{
  "success": true,
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "cs_xxxxx"
  }
}

// Response (PayPal)
{
  "success": true,
  "data": {
    "approval_url": "https://www.paypal.com/checkoutnow?token=...",
    "subscription_id": "I-xxxxx"
  }
}
```

### GET /suscripciones/actual

```typescript
// Response
{
  "success": true,
  "data": {
    "plan": {
      "codigo": "pro",
      "nombre": "Pro",
      "precio_mensual": 35.00
    },
    "estado": "activa",
    "periodo": "mensual",
    "fecha_proximo_pago": "2026-02-11",
    "metodo_pago": "stripe",
    "ultimo_4_digitos": "4242",
    "marca_tarjeta": "visa",
    "addons": [
      {
        "codigo": "facturacion",
        "nombre": "Facturacion Electronica",
        "precio": 5.00
      },
      {
        "codigo": "agente_ia_basico",
        "nombre": "Agente IA Basico",
        "precio": 2.00
      }
    ],
    "total_mensual": 42.00,
    "limites": {
      "sucursales": { "usado": 2, "limite": 3 },
      "usuarios": { "usado": 5, "limite": 10 },
      "productos": { "usado": 234, "limite": null }
    }
  }
}
```

---

## FLUJO DE USUARIO

### 1. Seleccion de Plan (Onboarding)

```
+-------------------------------------------------------------------+
|  PASO 1: Seleccionar Plan                                         |
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------+    +-------------+    +-------------+            |
|  |   BASICO    |    |     PRO     |    |  BUSINESS   |            |
|  |   $18/mes   |    |   $35/mes   |    |   $60/mes   |            |
|  +-------------+    +-------------+    +-------------+            |
|  | 1 sucursal  |    | 3 sucursales|    | Ilimitado   |            |
|  | 2 usuarios  |    | 10 usuarios |    | Ilimitado   |            |
|  | 500 productos|   | Ilimitado   |    | API access  |            |
|  +-------------+    +-------------+    +-------------+            |
|       [ ]           [*] Recomendado      [ ]                      |
|                                                                   |
|                    [Continuar]                                    |
+-------------------------------------------------------------------+
```

### 2. Addons (Opcional)

```
+-------------------------------------------------------------------+
|  PASO 2: Addons (Opcional)                                        |
+-------------------------------------------------------------------+
|                                                                   |
|  [x] Facturacion Electronica (+$5/mes)                           |
|      Boletas y facturas SUNAT                                     |
|                                                                   |
|  [ ] Agente IA Basico (+$2/mes)                                  |
|      WhatsApp + IA para inventario                                |
|                                                                   |
|  [ ] Agente IA Pro (+$5/mes)                                     |
|      Alertas automaticas y reportes                               |
|                                                                   |
|  Resumen:                                                         |
|  Plan Pro:                   $35.00                               |
|  Facturacion Electronica:     $5.00                               |
|  ---------------------------------                                |
|  Total mensual:              $40.00                               |
|                                                                   |
|                    [Continuar al pago]                            |
+-------------------------------------------------------------------+
```

### 3. Metodo de Pago

```
+-------------------------------------------------------------------+
|  PASO 3: Metodo de Pago                                           |
+-------------------------------------------------------------------+
|                                                                   |
|  Selecciona como quieres pagar:                                   |
|                                                                   |
|  +-------------------------+    +-------------------------+       |
|  |    Tarjeta de Credito   |    |         PayPal          |       |
|  |   [Stripe - Seguro]     |    |   [Mas formas de pago]  |       |
|  +-------------------------+    +-------------------------+       |
|           [*]                           [ ]                       |
|                                                                   |
|  [ ] Pago anual (ahorra 2 meses) - $400/año en vez de $480       |
|                                                                   |
|                    [Pagar $40.00]                                 |
+-------------------------------------------------------------------+
```

---

## CREDENCIALES DE PRUEBA

### Stripe (Test Mode)

```
Tarjeta exitosa:        4242 4242 4242 4242
Tarjeta rechazada:      4000 0000 0000 0002
Tarjeta requiere auth:  4000 0025 0000 3155

Fecha vencimiento:      Cualquier fecha futura
CVV:                    Cualquier 3 digitos
```

### PayPal (Sandbox)

```
Email:    sb-buyer@personal.example.com
Password: testpassword

Email vendedor: sb-seller@business.example.com
```

---

## REFERENCIAS

- Stripe Docs: https://stripe.com/docs
- PayPal Docs: https://developer.paypal.com/docs
- Ver: `03-BASE-DATOS-COMPLETA.md` (tablas suscripciones)
- Ver: `06-API-ENDPOINTS.md` (seccion Pagos)
