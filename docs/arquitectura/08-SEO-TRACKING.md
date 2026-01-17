# 🌐 SEO Y TRACKING

## 📋 CONFIGURACIÓN SEO PROFESIONAL

### Tabla: empresa_seo
```sql
-- Ver 03-BASE-DATOS-COMPLETA.md para estructura completa
-- Campos principales para SEO:
- titulo, descripcion, keywords
- og_titulo, og_descripcion, og_imagen
- google_analytics_id, facebook_pixel_id, tiktok_pixel_id
- google_tag_manager_id
- schema_markup (JSON-LD)
```

---

## 🔍 META TAGS DINÁMICOS

### Layout Principal (Next.js)
```tsx
// frontend/src/presentation/app/(landing)/layout.tsx
import { Metadata } from 'next';
import { getSEOConfig } from '@/application/services/seo.service';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSEOConfig();

  return {
    title: {
      default: seo.titulo,
      template: `%s | ${seo.nombre_empresa}`,
    },
    description: seo.descripcion,
    keywords: seo.keywords?.split(',').map(k => k.trim()),
    authors: [{ name: seo.nombre_empresa }],
    creator: seo.nombre_empresa,
    publisher: seo.nombre_empresa,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'es_PE',
      url: seo.url_sitio,
      siteName: seo.nombre_empresa,
      title: seo.og_titulo || seo.titulo,
      description: seo.og_descripcion || seo.descripcion,
      images: [
        {
          url: seo.og_imagen,
          width: 1200,
          height: 630,
          alt: seo.nombre_empresa,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: seo.og_titulo || seo.titulo,
      description: seo.og_descripcion || seo.descripcion,
      images: [seo.og_imagen],
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verificación
    verification: {
      google: seo.google_site_verification,
    },

    // Alternates
    alternates: {
      canonical: seo.url_sitio,
    },
  };
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

### Meta Tags para Producto
```tsx
// frontend/src/presentation/app/(landing)/catalogo/[slug]/page.tsx
import { Metadata } from 'next';
import { getProductBySlug } from '@/application/services/producto.service';
import { getSEOConfig } from '@/application/services/seo.service';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [producto, seo] = await Promise.all([
    getProductBySlug(params.slug),
    getSEOConfig(),
  ]);

  if (!producto) {
    return {
      title: 'Producto no encontrado',
    };
  }

  const precio = producto.precio_oferta || producto.precio_venta;

  return {
    title: producto.nombre,
    description: producto.descripcion_corta || `${producto.nombre} - ${producto.categoria.nombre}`,

    openGraph: {
      type: 'product',
      title: producto.nombre,
      description: producto.descripcion_corta,
      url: `${seo.url_sitio}/catalogo/${producto.slug}`,
      images: [
        {
          url: producto.imagen_principal,
          width: 800,
          height: 800,
          alt: producto.nombre,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: producto.nombre,
      description: producto.descripcion_corta,
      images: [producto.imagen_principal],
    },

    other: {
      'product:price:amount': precio.toString(),
      'product:price:currency': 'PEN',
      'product:availability': producto.stock_total > 0 ? 'in stock' : 'out of stock',
      'product:category': producto.categoria.nombre,
      'product:brand': producto.marca?.nombre || '',
    },
  };
}
```

---

## 📊 SCHEMA MARKUP (JSON-LD)

### Schema para Empresa (LocalBusiness)
```tsx
// frontend/src/presentation/components/seo/schema-empresa.tsx
import { getSEOConfig } from '@/application/services/seo.service';

export async function SchemaEmpresa() {
  const seo = await getSEOConfig();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: seo.nombre_empresa,
    description: seo.descripcion,
    url: seo.url_sitio,
    telephone: seo.telefono,
    email: seo.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: seo.direccion,
      addressLocality: seo.ciudad,
      addressRegion: seo.region,
      addressCountry: 'PE',
    },
    geo: seo.latitud && seo.longitud ? {
      '@type': 'GeoCoordinates',
      latitude: seo.latitud,
      longitude: seo.longitud,
    } : undefined,
    openingHours: seo.horario_atencion,
    image: seo.og_imagen,
    priceRange: seo.rango_precios || '$$',
    sameAs: [
      seo.facebook_url,
      seo.instagram_url,
      seo.tiktok_url,
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

### Schema para Producto
```tsx
// frontend/src/presentation/components/seo/schema-producto.tsx
import { Producto } from '@/core/domain/entities/producto.entity';

interface Props {
  producto: Producto;
  urlBase: string;
}

export function SchemaProducto({ producto, urlBase }: Props) {
  const precio = producto.precio_oferta || producto.precio_venta;
  const disponibilidad = producto.stock_total > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    description: producto.descripcion_corta,
    image: producto.imagenes.map(img => img.url),
    sku: producto.sku,
    gtin13: producto.codigo_barras,
    brand: producto.marca ? {
      '@type': 'Brand',
      name: producto.marca.nombre,
    } : undefined,
    category: producto.categoria.nombre,
    offers: {
      '@type': 'Offer',
      url: `${urlBase}/catalogo/${producto.slug}`,
      priceCurrency: 'PEN',
      price: precio,
      availability: disponibilidad,
      seller: {
        '@type': 'Organization',
        name: 'Tienda',
      },
    },
    aggregateRating: producto.rating ? {
      '@type': 'AggregateRating',
      ratingValue: producto.rating,
      reviewCount: producto.review_count,
    } : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Schema para BreadcrumbList
```tsx
// frontend/src/presentation/components/seo/schema-breadcrumb.tsx
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function SchemaBreadcrumb({ items }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
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

## 📈 GOOGLE ANALYTICS 4

### Componente de Tracking
```tsx
// frontend/src/presentation/components/tracking/google-analytics.tsx
'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  gaId: string;
}

export function GoogleAnalytics({ gaId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && window.gtag) {
      window.gtag('config', gaId, {
        page_path: pathname + (searchParams?.toString() ? `?${searchParams}` : ''),
      });
    }
  }, [pathname, searchParams, gaId]);

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
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
```

### Eventos Personalizados GA4
```tsx
// frontend/src/application/services/analytics.service.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    ttq: any;
  }
}

export const analytics = {
  // Evento de visualización de producto
  viewProduct: (producto: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'PEN',
        value: producto.precio_venta,
        items: [{
          item_id: producto.sku,
          item_name: producto.nombre,
          item_category: producto.categoria?.nombre,
          item_brand: producto.marca?.nombre,
          price: producto.precio_venta,
        }],
      });
    }
  },

  // Evento de agregar al carrito
  addToCart: (producto: any, cantidad: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'PEN',
        value: producto.precio_venta * cantidad,
        items: [{
          item_id: producto.sku,
          item_name: producto.nombre,
          item_category: producto.categoria?.nombre,
          price: producto.precio_venta,
          quantity: cantidad,
        }],
      });
    }
  },

  // Evento de inicio de checkout
  beginCheckout: (items: any[], total: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'PEN',
        value: total,
        items: items.map(item => ({
          item_id: item.sku,
          item_name: item.nombre,
          price: item.precio,
          quantity: item.cantidad,
        })),
      });
    }
  },

  // Evento de compra completada
  purchase: (venta: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: venta.numero,
        value: venta.total,
        currency: 'PEN',
        tax: venta.igv,
        items: venta.detalles.map((item: any) => ({
          item_id: item.sku,
          item_name: item.nombre,
          price: item.precio_unitario,
          quantity: item.cantidad,
        })),
      });
    }
  },

  // Evento de búsqueda
  search: (query: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: query,
      });
    }
  },

  // Evento de contacto
  contact: (metodo: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_lead', {
        method: metodo,
      });
    }
  },
};
```

---

## 📱 FACEBOOK PIXEL

### Componente de Tracking
```tsx
// frontend/src/presentation/components/tracking/facebook-pixel.tsx
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  pixelId: string;
}

export function FacebookPixel({ pixelId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

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
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
```

### Eventos Facebook Pixel
```tsx
// frontend/src/application/services/facebook-pixel.service.ts
export const fbPixel = {
  // Ver producto
  viewContent: (producto: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [producto.sku],
        content_name: producto.nombre,
        content_category: producto.categoria?.nombre,
        content_type: 'product',
        value: producto.precio_venta,
        currency: 'PEN',
      });
    }
  },

  // Agregar al carrito
  addToCart: (producto: any, cantidad: number) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [producto.sku],
        content_name: producto.nombre,
        content_type: 'product',
        value: producto.precio_venta * cantidad,
        currency: 'PEN',
      });
    }
  },

  // Iniciar checkout
  initiateCheckout: (items: any[], total: number) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: items.map(item => item.sku),
        content_type: 'product',
        num_items: items.length,
        value: total,
        currency: 'PEN',
      });
    }
  },

  // Compra completada
  purchase: (venta: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: venta.detalles.map((item: any) => item.sku),
        content_type: 'product',
        num_items: venta.detalles.length,
        value: venta.total,
        currency: 'PEN',
      });
    }
  },

  // Lead (contacto)
  lead: (datos: any) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', datos);
    }
  },

  // Búsqueda
  search: (query: string) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Search', {
        search_string: query,
      });
    }
  },
};
```

---

## 🎵 TIKTOK PIXEL

### Componente de Tracking
```tsx
// frontend/src/presentation/components/tracking/tiktok-pixel.tsx
'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface Props {
  pixelId: string;
}

export function TikTokPixel({ pixelId }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && window.ttq) {
      window.ttq.page();
    }
  }, [pathname]);

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

### Eventos TikTok Pixel
```tsx
// frontend/src/application/services/tiktok-pixel.service.ts
export const tiktokPixel = {
  // Ver producto
  viewContent: (producto: any) => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: producto.sku,
        content_name: producto.nombre,
        content_category: producto.categoria?.nombre,
        content_type: 'product',
        price: producto.precio_venta,
        currency: 'PEN',
      });
    }
  },

  // Agregar al carrito
  addToCart: (producto: any, cantidad: number) => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: producto.sku,
        content_name: producto.nombre,
        content_type: 'product',
        quantity: cantidad,
        price: producto.precio_venta,
        value: producto.precio_venta * cantidad,
        currency: 'PEN',
      });
    }
  },

  // Iniciar checkout
  initiateCheckout: (items: any[], total: number) => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('InitiateCheckout', {
        content_type: 'product',
        quantity: items.length,
        value: total,
        currency: 'PEN',
      });
    }
  },

  // Compra completada
  completePayment: (venta: any) => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('CompletePayment', {
        content_type: 'product',
        quantity: venta.detalles.length,
        value: venta.total,
        currency: 'PEN',
      });
    }
  },

  // Búsqueda
  search: (query: string) => {
    if (typeof window !== 'undefined' && window.ttq) {
      window.ttq.track('Search', {
        query: query,
      });
    }
  },
};
```

---

## 🏷️ GOOGLE TAG MANAGER

### Componente GTM
```tsx
// frontend/src/presentation/components/tracking/google-tag-manager.tsx
'use client';

import Script from 'next/script';

interface Props {
  gtmId: string;
}

export function GoogleTagManager({ gtmId }: Props) {
  return (
    <>
      {/* GTM Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />

      {/* GTM Noscript (en body) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}
```

### Data Layer Push
```tsx
// frontend/src/application/services/data-layer.service.ts
declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const dataLayer = {
  push: (data: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(data);
    }
  },

  // E-commerce events
  viewItem: (producto: any) => {
    dataLayer.push({
      event: 'view_item',
      ecommerce: {
        items: [{
          item_id: producto.sku,
          item_name: producto.nombre,
          item_category: producto.categoria?.nombre,
          item_brand: producto.marca?.nombre,
          price: producto.precio_venta,
        }],
      },
    });
  },

  addToCart: (producto: any, cantidad: number) => {
    dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        items: [{
          item_id: producto.sku,
          item_name: producto.nombre,
          price: producto.precio_venta,
          quantity: cantidad,
        }],
      },
    });
  },

  purchase: (venta: any) => {
    dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: venta.numero,
        value: venta.total,
        currency: 'PEN',
        tax: venta.igv,
        items: venta.detalles.map((item: any) => ({
          item_id: item.sku,
          item_name: item.nombre,
          price: item.precio_unitario,
          quantity: item.cantidad,
        })),
      },
    });
  },
};
```

---

## 🔗 INTEGRACIÓN EN LAYOUT PRINCIPAL

### Provider de Tracking
```tsx
// frontend/src/presentation/providers/tracking-provider.tsx
'use client';

import { GoogleAnalytics } from '../components/tracking/google-analytics';
import { FacebookPixel } from '../components/tracking/facebook-pixel';
import { TikTokPixel } from '../components/tracking/tiktok-pixel';
import { GoogleTagManager } from '../components/tracking/google-tag-manager';

interface Props {
  config: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    tiktokPixelId?: string;
    googleTagManagerId?: string;
  };
  children: React.ReactNode;
}

export function TrackingProvider({ config, children }: Props) {
  return (
    <>
      {config.googleTagManagerId && (
        <GoogleTagManager gtmId={config.googleTagManagerId} />
      )}
      {config.googleAnalyticsId && (
        <GoogleAnalytics gaId={config.googleAnalyticsId} />
      )}
      {config.facebookPixelId && (
        <FacebookPixel pixelId={config.facebookPixelId} />
      )}
      {config.tiktokPixelId && (
        <TikTokPixel pixelId={config.tiktokPixelId} />
      )}
      {children}
    </>
  );
}
```

### Layout con Tracking
```tsx
// frontend/src/presentation/app/(landing)/layout.tsx
import { TrackingProvider } from '@/presentation/providers/tracking-provider';
import { SchemaEmpresa } from '@/presentation/components/seo/schema-empresa';
import { getSEOConfig } from '@/application/services/seo.service';

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seo = await getSEOConfig();

  const trackingConfig = {
    googleAnalyticsId: seo.google_analytics_id,
    facebookPixelId: seo.facebook_pixel_id,
    tiktokPixelId: seo.tiktok_pixel_id,
    googleTagManagerId: seo.google_tag_manager_id,
  };

  return (
    <TrackingProvider config={trackingConfig}>
      <SchemaEmpresa />
      {children}
    </TrackingProvider>
  );
}
```

---

## 🗺️ SITEMAP DINÁMICO

```tsx
// frontend/src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { getPublicProducts } from '@/application/services/producto.service';
import { getCategories } from '@/application/services/categoria.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tienda.com';

  // Páginas estáticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Categorías dinámicas
  const categorias = await getCategories();
  const categoryPages = categorias.map((cat) => ({
    url: `${baseUrl}/catalogo?categoria=${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Productos dinámicos
  const productos = await getPublicProducts();
  const productPages = productos.map((prod) => ({
    url: `${baseUrl}/catalogo/${prod.slug}`,
    lastModified: new Date(prod.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
```

---

## 🤖 ROBOTS.TXT

```tsx
// frontend/src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tienda.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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

## ⚙️ CONFIGURACIÓN SEO EN BACKEND

### Endpoint de Configuración
```typescript
// backend/src/presentation/http/controllers/seo.controller.ts
@Controller('seo')
@UseGuards(JwtAuthGuard)
export class SEOController {
  constructor(private readonly seoService: SEOService) {}

  @Get('config')
  @Public() // Público para el landing
  async getConfig(@CurrentTenant() empresaId: string) {
    return this.seoService.getConfig(empresaId);
  }

  @Put('config')
  @Roles('admin')
  async updateConfig(
    @CurrentTenant() empresaId: string,
    @Body() dto: UpdateSEOConfigDto,
  ) {
    return this.seoService.updateConfig(empresaId, dto);
  }
}
```

### DTO de Configuración SEO
```typescript
// backend/src/core/application/dto/seo/update-seo-config.dto.ts
export class UpdateSEOConfigDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsString()
  og_titulo?: string;

  @IsOptional()
  @IsString()
  og_descripcion?: string;

  @IsOptional()
  @IsUrl()
  og_imagen?: string;

  @IsOptional()
  @IsString()
  google_analytics_id?: string;

  @IsOptional()
  @IsString()
  facebook_pixel_id?: string;

  @IsOptional()
  @IsString()
  tiktok_pixel_id?: string;

  @IsOptional()
  @IsString()
  google_tag_manager_id?: string;

  @IsOptional()
  @IsUrl()
  facebook_url?: string;

  @IsOptional()
  @IsUrl()
  instagram_url?: string;

  @IsOptional()
  @IsUrl()
  tiktok_url?: string;
}
```
