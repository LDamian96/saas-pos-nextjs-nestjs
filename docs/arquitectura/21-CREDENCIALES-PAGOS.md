# CREDENCIALES DE PASARELAS DE PAGO

## Mercado Pago (Peru)

### Credenciales de Prueba (TEST)

```
PUBLIC_KEY=TEST-47571ab9-8016-4bcc-97c8-4edd525d6008
ACCESS_TOKEN=TEST-7533682258184666-121221-10b0bcd47b0afd3cc810111603e6c1d6-2153656036
```

### Obtener Credenciales de Produccion

1. Ir a https://www.mercadopago.com.pe/developers/panel/credentials
2. Iniciar sesion con tu cuenta de Mercado Pago
3. Seleccionar "Credenciales de produccion"
4. Copiar Public Key y Access Token

### Configuracion en el Proyecto

Las credenciales van en el archivo `.env` del backend:

```env
# .env (backend)
MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx
```

### Webhooks (Notificaciones)

Para recibir notificaciones de pagos:

1. Ir a https://www.mercadopago.com.pe/developers/panel/webhooks
2. Configurar la URL de tu backend: `https://tu-dominio.com/api/v1/pagos/webhook/mercadopago`
3. Seleccionar eventos: `payment`, `merchant_order`

---

## PayPal

### Obtener Credenciales

1. Ir a https://developer.paypal.com/
2. Crear cuenta o iniciar sesion
3. Ir a "Dashboard" > "My Apps & Credentials"
4. Crear una aplicacion nueva
5. Copiar Client ID y Secret

### Credenciales de Prueba (Sandbox)

```
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
```

### Credenciales de Produccion (Live)

```
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=live
```

### Configuracion en el Proyecto

```env
# .env (backend)
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
```

### Cuentas de Prueba

PayPal proporciona cuentas sandbox para probar:
1. Ir a https://developer.paypal.com/dashboard/accounts
2. Usar las cuentas "Personal" y "Business" creadas automaticamente
3. El email y password estan en los detalles de cada cuenta

---

## Stripe (Opcional - Internacional)

### Obtener Credenciales

1. Ir a https://dashboard.stripe.com/
2. Crear cuenta
3. Ir a "Developers" > "API Keys"

### Credenciales de Prueba

```
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Configuracion en el Proyecto

```env
# .env (backend)
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

---

## Notas de Seguridad

1. **NUNCA** commitear credenciales de produccion en Git
2. Usar variables de entorno (.env)
3. El archivo `.env` debe estar en `.gitignore`
4. Para produccion, usar servicios de secrets management
5. Rotar credenciales periodicamente

---

## Referencias

- Ver docs/arquitectura/16-PAGOS-SUSCRIPCIONES.md para implementacion detallada
- Ver backend/src/infrastructure/payments/ para el codigo
