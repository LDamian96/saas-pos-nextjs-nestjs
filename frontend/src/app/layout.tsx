import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/presentation/providers/query-provider';
import { ThemeSync } from '@/presentation/components/common/theme-sync';
import { InstallPWABanner } from '@/presentation/components/common/install-pwa-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'POS SaaS - Sistema de Punto de Venta',
  description: 'Sistema de Punto de Venta moderno y facil de usar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Prevent flash + fix Android nav bar color */}
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
          if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}
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
