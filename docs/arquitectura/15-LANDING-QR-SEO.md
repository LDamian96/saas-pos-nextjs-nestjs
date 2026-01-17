# 15. LANDING PAGE + QR + SEO + ADS

## ARQUITECTURA LANDING MULTI-TENANT

```
+-------------------------------------------------------------------+
|                    ARQUITECTURA LANDING                           |
+-------------------------------------------------------------------+
|                                                                   |
|  DOMINIOS                                                         |
|  +-------------------------------------------------------------+  |
|  |                                                             |  |
|  |  Subdominio (incluido):                                    |  |
|  |  tiendarosa.tupos.com --> Landing Tienda Rosa              |  |
|  |                                                             |  |
|  |  Dominio personalizado (opcional):                         |  |
|  |  www.tiendarosa.com --> Landing Tienda Rosa                |  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
|  QR CODE                                                          |
|  +-------------------------------------------------------------+  |
|  |                                                             |  |
|  |  [QR] --> tupos.com/t/tiendarosa --> Landing               |  |
|  |  [QR] --> tupos.com/t/tiendarosa/producto-slug --> Prod    |  |
|  |                                                             |  |
|  |  Uso: Imprimir en tickets, tarjetas, vitrina               |  |
|  |                                                             |  |
|  +-------------------------------------------------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## TABLAS DE BASE DE DATOS

### Tabla: empresa_seo (Actualizada)

```sql
CREATE TABLE empresa_seo (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- SEO Basico
    titulo                  VARCHAR(70),            -- Meta title
    descripcion             VARCHAR(160),           -- Meta description
    keywords                VARCHAR(500),           -- Keywords separados por coma

    -- Open Graph (redes sociales)
    og_titulo               VARCHAR(100),
    og_descripcion          VARCHAR(200),
    og_imagen               VARCHAR(500),           -- Imagen 1200x630

    -- Twitter Card
    twitter_titulo          VARCHAR(70),
    twitter_descripcion     VARCHAR(200),
    twitter_imagen          VARCHAR(500),

    -- Verificacion de sitio
    google_site_verification VARCHAR(100),
    bing_site_verification  VARCHAR(100),

    -- Analytics
    google_analytics_id     VARCHAR(20),            -- G-XXXXXXXXXX
    google_tag_manager_id   VARCHAR(20),            -- GTM-XXXXXXX

    -- Pixels de publicidad
    facebook_pixel_id       VARCHAR(20),
    tiktok_pixel_id         VARCHAR(20),
    linkedin_pixel_id       VARCHAR(20),

    -- Redes sociales
    facebook_url            VARCHAR(300),
    instagram_url           VARCHAR(300),
    tiktok_url              VARCHAR(300),
    youtube_url             VARCHAR(300),
    twitter_url             VARCHAR(300),
    linkedin_url            VARCHAR(300),
    whatsapp_url            VARCHAR(300),           -- wa.me/51987654321

    -- Informacion de contacto (Schema)
    telefono_contacto       VARCHAR(20),
    email_contacto          VARCHAR(150),
    direccion_contacto      TEXT,
    ciudad                  VARCHAR(100),
    region                  VARCHAR(100),
    codigo_postal           VARCHAR(20),
    latitud                 DECIMAL(10, 8),
    longitud                DECIMAL(11, 8),
    horario_atencion        VARCHAR(200),           -- "Lun-Sab: 9am-8pm"

    -- Schema.org
    tipo_negocio            VARCHAR(50) DEFAULT 'LocalBusiness',
    -- LocalBusiness, Store, ClothingStore, Pharmacy, etc
    rango_precios           VARCHAR(10) DEFAULT '$$',  -- $, $$, $$$

    -- Configuracion landing
    landing_activa          BOOLEAN DEFAULT true,
    mostrar_precios         BOOLEAN DEFAULT true,
    mostrar_stock           BOOLEAN DEFAULT false,
    permitir_contacto       BOOLEAN DEFAULT true,
    permitir_whatsapp       BOOLEAN DEFAULT true,

    -- QR Code
    qr_landing_url          VARCHAR(500),           -- URL generada del QR
    qr_landing_imagen       VARCHAR(500),           -- Imagen QR almacenada
    qr_color_primario       VARCHAR(7) DEFAULT '#000000',
    qr_color_fondo          VARCHAR(7) DEFAULT '#FFFFFF',
    qr_incluir_logo         BOOLEAN DEFAULT true,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_empresa_seo UNIQUE (empresa_id)
);

CREATE INDEX idx_empresa_seo ON empresa_seo(empresa_id);
```

### Campos empresa_seo

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| id | UUID | Auto | Identificador |
| empresa_id | UUID | Si | FK empresa |
| titulo | VARCHAR(70) | No | Meta title |
| descripcion | VARCHAR(160) | No | Meta description |
| keywords | VARCHAR(500) | No | Keywords SEO |
| og_titulo | VARCHAR(100) | No | Open Graph titulo |
| og_descripcion | VARCHAR(200) | No | Open Graph desc |
| og_imagen | VARCHAR(500) | No | OG imagen |
| twitter_titulo | VARCHAR(70) | No | Twitter titulo |
| twitter_descripcion | VARCHAR(200) | No | Twitter desc |
| twitter_imagen | VARCHAR(500) | No | Twitter imagen |
| google_site_verification | VARCHAR(100) | No | Google verification |
| bing_site_verification | VARCHAR(100) | No | Bing verification |
| google_analytics_id | VARCHAR(20) | No | GA4 ID |
| google_tag_manager_id | VARCHAR(20) | No | GTM ID |
| facebook_pixel_id | VARCHAR(20) | No | FB Pixel |
| tiktok_pixel_id | VARCHAR(20) | No | TikTok Pixel |
| linkedin_pixel_id | VARCHAR(20) | No | LinkedIn Pixel |
| facebook_url | VARCHAR(300) | No | URL Facebook |
| instagram_url | VARCHAR(300) | No | URL Instagram |
| tiktok_url | VARCHAR(300) | No | URL TikTok |
| youtube_url | VARCHAR(300) | No | URL YouTube |
| twitter_url | VARCHAR(300) | No | URL Twitter |
| linkedin_url | VARCHAR(300) | No | URL LinkedIn |
| whatsapp_url | VARCHAR(300) | No | URL WhatsApp |
| telefono_contacto | VARCHAR(20) | No | Telefono |
| email_contacto | VARCHAR(150) | No | Email |
| direccion_contacto | TEXT | No | Direccion |
| ciudad | VARCHAR(100) | No | Ciudad |
| region | VARCHAR(100) | No | Region/Estado |
| codigo_postal | VARCHAR(20) | No | Codigo postal |
| latitud | DECIMAL(10,8) | No | Latitud mapa |
| longitud | DECIMAL(11,8) | No | Longitud mapa |
| horario_atencion | VARCHAR(200) | No | Horario |
| tipo_negocio | VARCHAR(50) | No | Schema.org type |
| rango_precios | VARCHAR(10) | No | Rango precios |
| landing_activa | BOOLEAN | No | Landing activa |
| mostrar_precios | BOOLEAN | No | Mostrar precios |
| mostrar_stock | BOOLEAN | No | Mostrar stock |
| permitir_contacto | BOOLEAN | No | Form contacto |
| permitir_whatsapp | BOOLEAN | No | Boton WhatsApp |
| qr_landing_url | VARCHAR(500) | No | URL del QR |
| qr_landing_imagen | VARCHAR(500) | No | Imagen QR |
| qr_color_primario | VARCHAR(7) | No | Color QR |
| qr_color_fondo | VARCHAR(7) | No | Fondo QR |
| qr_incluir_logo | BOOLEAN | No | Logo en QR |
| created_at | TIMESTAMP | Auto | Creacion |
| updated_at | TIMESTAMP | Auto | Actualizacion |

---

### Tabla: landing_secciones

```sql
-- Secciones personalizables del landing
CREATE TABLE landing_secciones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Identificador
    tipo                    VARCHAR(50) NOT NULL,
    -- hero, productos_destacados, categorias, testimonios,
    -- nosotros, contacto, banner, galeria, video

    -- Configuracion
    titulo                  VARCHAR(200),
    subtitulo               VARCHAR(300),
    contenido               TEXT,                   -- HTML o texto
    imagen                  VARCHAR(500),
    imagen_movil            VARCHAR(500),           -- Imagen responsive
    video_url               VARCHAR(500),
    color_fondo             VARCHAR(7),
    color_texto             VARCHAR(7),

    -- Boton CTA
    cta_texto               VARCHAR(50),
    cta_url                 VARCHAR(500),
    cta_estilo              VARCHAR(20) DEFAULT 'primary', -- primary, secondary, outline

    -- Orden y visibilidad
    orden                   INTEGER DEFAULT 0,
    activo                  BOOLEAN DEFAULT true,
    visible_desktop         BOOLEAN DEFAULT true,
    visible_movil           BOOLEAN DEFAULT true,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landing_secciones_empresa ON landing_secciones(empresa_id);
CREATE INDEX idx_landing_secciones_orden ON landing_secciones(orden);
```

---

### Tabla: landing_testimonios

```sql
CREATE TABLE landing_testimonios (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Testimonio
    nombre                  VARCHAR(100) NOT NULL,
    cargo                   VARCHAR(100),           -- "Cliente frecuente"
    avatar                  VARCHAR(500),
    testimonio              TEXT NOT NULL,
    estrellas               INTEGER DEFAULT 5,      -- 1-5

    -- Orden y estado
    orden                   INTEGER DEFAULT 0,
    activo                  BOOLEAN DEFAULT true,
    destacado               BOOLEAN DEFAULT false,

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_testimonios_empresa ON landing_testimonios(empresa_id);
```

---

### Tabla: landing_contactos

```sql
-- Mensajes recibidos desde el formulario de contacto
CREATE TABLE landing_contactos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id              UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Datos del contacto
    nombre                  VARCHAR(100) NOT NULL,
    email                   VARCHAR(150),
    telefono                VARCHAR(20),
    mensaje                 TEXT NOT NULL,

    -- Seguimiento
    leido                   BOOLEAN DEFAULT false,
    respondido              BOOLEAN DEFAULT false,
    notas                   TEXT,

    -- Origen
    origen                  VARCHAR(50) DEFAULT 'landing',  -- landing, qr, whatsapp
    url_origen              VARCHAR(500),
    utm_source              VARCHAR(100),
    utm_medium              VARCHAR(100),
    utm_campaign            VARCHAR(100),

    -- Auditoria
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    respondido_at           TIMESTAMP,
    respondido_por          UUID REFERENCES usuarios(id)
);

CREATE INDEX idx_contactos_empresa ON landing_contactos(empresa_id);
CREATE INDEX idx_contactos_fecha ON landing_contactos(created_at);
CREATE INDEX idx_contactos_leido ON landing_contactos(leido);
```

---

## RUTAS LANDING

### Estructura de URLs

```
LANDING PRINCIPAL
/t/{subdominio}                 --> Landing home
/t/{subdominio}/catalogo        --> Catalogo productos
/t/{subdominio}/catalogo/{slug} --> Detalle producto
/t/{subdominio}/nosotros        --> Pagina nosotros
/t/{subdominio}/contacto        --> Formulario contacto

DOMINIO PERSONALIZADO (si tiene)
tiendarosa.com/                 --> Landing home
tiendarosa.com/catalogo         --> Catalogo
tiendarosa.com/producto/{slug}  --> Producto
```

### Rutas Frontend (Next.js)

```
frontend/src/presentation/app/
├── (landing)/
│   ├── t/
│   │   └── [subdominio]/
│   │       ├── page.tsx                 --> Home landing
│   │       ├── catalogo/
│   │       │   ├── page.tsx             --> Lista productos
│   │       │   └── [slug]/
│   │       │       └── page.tsx         --> Detalle producto
│   │       ├── nosotros/
│   │       │   └── page.tsx             --> Nosotros
│   │       └── contacto/
│   │           └── page.tsx             --> Contacto
│   └── layout.tsx                       --> Layout landing
```

---

## QR CODE SYSTEM

### Generacion de QR

```typescript
// backend/src/modules/seo/services/qr.service.ts
import QRCode from 'qrcode';

@Injectable()
export class QRService {
  async generateLandingQR(empresaId: string): Promise<string> {
    const empresa = await this.empresaRepo.findById(empresaId);
    const url = `${process.env.FRONTEND_URL}/t/${empresa.subdominio}`;

    const qrOptions = {
      width: 512,
      margin: 2,
      color: {
        dark: empresa.seo.qr_color_primario || '#000000',
        light: empresa.seo.qr_color_fondo || '#FFFFFF',
      },
    };

    const qrDataUrl = await QRCode.toDataURL(url, qrOptions);

    // Si incluye logo, procesamos la imagen
    if (empresa.seo.qr_incluir_logo && empresa.logo) {
      return this.addLogoToQR(qrDataUrl, empresa.logo);
    }

    return qrDataUrl;
  }

  async generateProductQR(empresaId: string, productoSlug: string): Promise<string> {
    const empresa = await this.empresaRepo.findById(empresaId);
    const url = `${process.env.FRONTEND_URL}/t/${empresa.subdominio}/catalogo/${productoSlug}`;

    return QRCode.toDataURL(url);
  }
}
```

### Uso del QR

```
+-------------------------------------------------------------------+
|  USOS DEL QR CODE                                                 |
+-------------------------------------------------------------------+
|                                                                   |
|  1. TICKET DE VENTA                                               |
|     +-------------------------+                                   |
|     |  TIENDA ROSA            |                                   |
|     |  Ticket #1234           |                                   |
|     |  ...                    |                                   |
|     |  Total: S/. 45.50       |                                   |
|     |                         |                                   |
|     |  [QR CODE]              |   --> Escanear para ver          |
|     |  Visitanos en:          |       catalogo completo          |
|     |  tiendarosa.tupos.com   |                                   |
|     +-------------------------+                                   |
|                                                                   |
|  2. TARJETA DE PRESENTACION                                       |
|     +-------------------------+                                   |
|     |  TIENDA ROSA            |                                   |
|     |  Tu tienda de moda      |                                   |
|     |                         |                                   |
|     |  [QR CODE]              |   --> Ver productos y            |
|     |                         |       contactar por WA           |
|     +-------------------------+                                   |
|                                                                   |
|  3. VITRINA / LOCAL                                               |
|     Poster con QR grande para que clientes escaneen               |
|                                                                   |
|  4. REDES SOCIALES                                                |
|     Imagen del QR para stories/posts                              |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## SEO PROFESIONAL

### Meta Tags Dinamicos

```tsx
// frontend/src/presentation/app/(landing)/t/[subdominio]/page.tsx
import { Metadata } from 'next';
import { getLandingData } from '@/application/services/landing.service';

interface Props {
  params: { subdominio: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getLandingData(params.subdominio);

  if (!data) return { title: 'No encontrado' };

  return {
    title: data.seo.titulo || data.empresa.nombreComercial,
    description: data.seo.descripcion || `Bienvenido a ${data.empresa.nombreComercial}`,
    keywords: data.seo.keywords?.split(','),

    openGraph: {
      type: 'website',
      locale: 'es_PE',
      url: `https://tupos.com/t/${params.subdominio}`,
      siteName: data.empresa.nombreComercial,
      title: data.seo.og_titulo || data.seo.titulo,
      description: data.seo.og_descripcion || data.seo.descripcion,
      images: [
        {
          url: data.seo.og_imagen || data.empresa.logo,
          width: 1200,
          height: 630,
          alt: data.empresa.nombreComercial,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: data.seo.twitter_titulo || data.seo.titulo,
      description: data.seo.twitter_descripcion || data.seo.descripcion,
      images: [data.seo.twitter_imagen || data.seo.og_imagen],
    },

    robots: {
      index: data.seo.landing_activa,
      follow: data.seo.landing_activa,
    },

    verification: {
      google: data.seo.google_site_verification,
    },

    alternates: {
      canonical: data.empresa.dominioPersonalizado
        ? `https://${data.empresa.dominioPersonalizado}`
        : `https://tupos.com/t/${params.subdominio}`,
    },
  };
}
```

### Schema.org Dinamico

```tsx
// frontend/src/presentation/components/seo/schema-landing.tsx
interface Props {
  empresa: Empresa;
  seo: EmpresaSEO;
}

export function SchemaLanding({ empresa, seo }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': seo.tipo_negocio || 'LocalBusiness',
    name: empresa.nombreComercial,
    description: seo.descripcion,
    url: empresa.dominioPersonalizado
      ? `https://${empresa.dominioPersonalizado}`
      : `https://tupos.com/t/${empresa.subdominio}`,
    telephone: seo.telefono_contacto,
    email: seo.email_contacto,
    address: {
      '@type': 'PostalAddress',
      streetAddress: seo.direccion_contacto,
      addressLocality: seo.ciudad,
      addressRegion: seo.region,
      postalCode: seo.codigo_postal,
      addressCountry: 'PE',
    },
    geo: seo.latitud && seo.longitud ? {
      '@type': 'GeoCoordinates',
      latitude: seo.latitud,
      longitude: seo.longitud,
    } : undefined,
    openingHours: seo.horario_atencion,
    image: empresa.logo,
    logo: empresa.logo,
    priceRange: seo.rango_precios,
    sameAs: [
      seo.facebook_url,
      seo.instagram_url,
      seo.tiktok_url,
      seo.youtube_url,
      seo.twitter_url,
      seo.linkedin_url,
    ].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

---

## TRACKING Y ADS

### Google Analytics 4

```tsx
// frontend/src/presentation/components/tracking/ga4.tsx
'use client';

import Script from 'next/script';

interface Props {
  gaId: string;
}

export function GoogleAnalytics({ gaId }: Props) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}
```

### Facebook Pixel

```tsx
// frontend/src/presentation/components/tracking/facebook-pixel.tsx
'use client';

import Script from 'next/script';

interface Props {
  pixelId: string;
}

export function FacebookPixel({ pixelId }: Props) {
  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
}
```

### TikTok Pixel

```tsx
// frontend/src/presentation/components/tracking/tiktok-pixel.tsx
'use client';

import Script from 'next/script';

interface Props {
  pixelId: string;
}

export function TikTokPixel({ pixelId }: Props) {
  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${pixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}
```

### Eventos de Tracking

```typescript
// frontend/src/application/services/tracking.service.ts
export const tracking = {
  // Ver producto
  viewProduct: (producto: any) => {
    // GA4
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'PEN',
        value: producto.precio_venta,
        items: [{
          item_id: producto.sku,
          item_name: producto.nombre,
          item_category: producto.categoria?.nombre,
        }],
      });
    }

    // Facebook
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [producto.sku],
        content_name: producto.nombre,
        content_type: 'product',
        value: producto.precio_venta,
        currency: 'PEN',
      });
    }

    // TikTok
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: producto.sku,
        content_name: producto.nombre,
        price: producto.precio_venta,
        currency: 'PEN',
      });
    }
  },

  // Click en WhatsApp
  whatsappClick: () => {
    if (window.gtag) {
      window.gtag('event', 'contact', {
        method: 'whatsapp',
      });
    }
    if (window.fbq) {
      window.fbq('track', 'Contact');
    }
  },

  // Enviar formulario contacto
  submitContact: () => {
    if (window.gtag) {
      window.gtag('event', 'generate_lead');
    }
    if (window.fbq) {
      window.fbq('track', 'Lead');
    }
    if (window.ttq) {
      window.ttq.track('SubmitForm');
    }
  },
};
```

---

## ENDPOINTS API

### Endpoints Landing (Publicos)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/public/landing/{subdominio}` | Datos landing | No |
| GET | `/public/landing/{subdominio}/productos` | Productos visibles | No |
| GET | `/public/landing/{subdominio}/productos/{slug}` | Detalle producto | No |
| GET | `/public/landing/{subdominio}/categorias` | Categorias | No |
| POST | `/public/landing/{subdominio}/contacto` | Enviar contacto | No |

### Endpoints SEO (Admin)

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/seo/config` | Obtener config SEO | Admin |
| PUT | `/seo/config` | Actualizar config SEO | Admin |
| GET | `/seo/qr/landing` | Obtener QR landing | Admin |
| POST | `/seo/qr/regenerar` | Regenerar QR | Admin |
| GET | `/seo/contactos` | Listar contactos | Admin |
| PUT | `/seo/contactos/{id}` | Marcar como leido | Admin |

### Endpoints Secciones Landing

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/landing/secciones` | Listar secciones | Admin |
| POST | `/landing/secciones` | Crear seccion | Admin |
| PUT | `/landing/secciones/{id}` | Editar seccion | Admin |
| DELETE | `/landing/secciones/{id}` | Eliminar seccion | Admin |
| PUT | `/landing/secciones/orden` | Reordenar secciones | Admin |

### GET /public/landing/{subdominio}

```typescript
// Response
{
  "success": true,
  "data": {
    "empresa": {
      "nombreComercial": "Tienda Rosa",
      "logo": "/uploads/logo.png",
      "slogan": "Tu tienda de moda",
      "colorPrimario": "#FF69B4",
      "colorSecundario": "#FFB6C1"
    },
    "seo": {
      "titulo": "Tienda Rosa - Moda y Accesorios",
      "descripcion": "La mejor tienda de moda...",
      "og_imagen": "/uploads/og-image.jpg",
      "whatsapp_url": "https://wa.me/51987654321"
    },
    "secciones": [
      {
        "tipo": "hero",
        "titulo": "Nueva Coleccion 2026",
        "imagen": "/uploads/hero.jpg",
        "cta_texto": "Ver Catalogo",
        "cta_url": "/catalogo"
      }
    ],
    "productosDestacados": [...],
    "categorias": [...],
    "testimonios": [...]
  }
}
```

---

## CONFIGURACION FRONTEND

### Pagina Landing Home

```tsx
// frontend/src/presentation/app/(landing)/t/[subdominio]/page.tsx
import { getLandingData } from '@/application/services/landing.service';
import { HeroSection } from '@/presentation/components/landing/hero-section';
import { ProductosDestacados } from '@/presentation/components/landing/productos-destacados';
import { Categorias } from '@/presentation/components/landing/categorias';
import { Testimonios } from '@/presentation/components/landing/testimonios';
import { ContactoCTA } from '@/presentation/components/landing/contacto-cta';
import { WhatsAppButton } from '@/presentation/components/landing/whatsapp-button';
import { SchemaLanding } from '@/presentation/components/seo/schema-landing';
import { GoogleAnalytics } from '@/presentation/components/tracking/ga4';
import { FacebookPixel } from '@/presentation/components/tracking/facebook-pixel';
import { TikTokPixel } from '@/presentation/components/tracking/tiktok-pixel';
import { notFound } from 'next/navigation';

interface Props {
  params: { subdominio: string };
}

export default async function LandingPage({ params }: Props) {
  const data = await getLandingData(params.subdominio);

  if (!data || !data.seo.landing_activa) {
    notFound();
  }

  return (
    <>
      {/* SEO Schema */}
      <SchemaLanding empresa={data.empresa} seo={data.seo} />

      {/* Tracking */}
      {data.seo.google_analytics_id && (
        <GoogleAnalytics gaId={data.seo.google_analytics_id} />
      )}
      {data.seo.facebook_pixel_id && (
        <FacebookPixel pixelId={data.seo.facebook_pixel_id} />
      )}
      {data.seo.tiktok_pixel_id && (
        <TikTokPixel pixelId={data.seo.tiktok_pixel_id} />
      )}

      {/* Secciones dinamicas */}
      {data.secciones.map((seccion) => {
        switch (seccion.tipo) {
          case 'hero':
            return <HeroSection key={seccion.id} data={seccion} empresa={data.empresa} />;
          case 'productos_destacados':
            return <ProductosDestacados key={seccion.id} productos={data.productosDestacados} />;
          case 'categorias':
            return <Categorias key={seccion.id} categorias={data.categorias} />;
          case 'testimonios':
            return <Testimonios key={seccion.id} testimonios={data.testimonios} />;
          case 'contacto':
            return <ContactoCTA key={seccion.id} data={seccion} seo={data.seo} />;
          default:
            return null;
        }
      })}

      {/* WhatsApp flotante */}
      {data.seo.permitir_whatsapp && data.seo.whatsapp_url && (
        <WhatsAppButton url={data.seo.whatsapp_url} />
      )}
    </>
  );
}
```

---

## SITEMAP Y ROBOTS

### Sitemap Dinamico

```tsx
// frontend/src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getAllLandings, getAllPublicProducts } from '@/application/services/public.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tupos.com';

  // Paginas estaticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
  ];

  // Landings de empresas
  const landings = await getAllLandings();
  const landingPages = landings.map((l) => ({
    url: `${baseUrl}/t/${l.subdominio}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Productos publicos
  const productos = await getAllPublicProducts();
  const productPages = productos.map((p) => ({
    url: `${baseUrl}/t/${p.empresa_subdominio}/catalogo/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...landingPages, ...productPages];
}
```

### Robots.txt

```tsx
// frontend/src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tupos.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/t/', '/'],
        disallow: [
          '/api/',
          '/login',
          '/register',
          '/dashboard/',
          '/pos',
          '/configuracion/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## REFERENCIAS

- Ver: `03-BASE-DATOS-COMPLETA.md` (tabla empresa_seo)
- Ver: `06-API-ENDPOINTS.md` (seccion SEO y Landing)
- Ver: `07-FRONTEND-RUTAS.md` (rutas landing)
- Ver: `08-SEO-TRACKING.md` (configuracion detallada tracking)
