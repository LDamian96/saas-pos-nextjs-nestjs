import type { Metadata } from 'next';
import { Mulish } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/presentation/providers/query-provider';
import { ThemeSync } from '@/presentation/components/common/theme-sync';
import { InstallPWABanner } from '@/presentation/components/common/install-pwa-banner';
import './globals.css';

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-mulish',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'POS Shop - Punto de Venta',
  description: 'Sistema de Punto de Venta moderno para tu negocio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={mulish.variable}>
      <head>
        {/* Prevent flash + fix Android nav bar color + purge stale Service Worker */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var d=false;
            try{var s=JSON.parse(localStorage.getItem('theme-storage')||'{}');d=!!(s.state&&s.state.isDark)}catch(e){}
            var c=d?'#09090b':'#f8fafc';
            var h=document.documentElement;
            h.className=d?'dark':'';
            h.style.cssText='color-scheme:'+(d?'dark':'light')+';background-color:'+c;
            document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=c});
          })();
          // Service Worker: registramos el kill-switch para limpiar SW antiguo y caches.
          // Tras activarse se auto-desinstala y nunca volverá a interceptar peticiones.
          if('serviceWorker' in navigator){
            navigator.serviceWorker.getRegistrations().then(function(regs){
              regs.forEach(function(r){r.unregister()});
            }).catch(function(){});
            if('caches' in window){
              caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k)})}).catch(function(){});
            }
          }
        `}} />
        <meta name="theme-color" content="#f8fafc" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="POS Shop" />
        <meta name="apple-mobile-web-app-title" content="POS Shop" />
      </head>
      <body>
        <ThemeSync />
        <InstallPWABanner />
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster
          position="top-center"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: { fontSize: '16px' },
          }}
        />
      </body>
    </html>
  );
}
