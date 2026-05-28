import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/presentation/providers/query-provider';
import { ThemeSync } from '@/presentation/components/common/theme-sync';
import { InstallPWABanner } from '@/presentation/components/common/install-pwa-banner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'POS Shop · Punto de venta',
  description: 'Sistema POS para tu negocio. Caja, ventas, inventario y facturación electrónica en un solo lugar.',
  applicationName: 'POS Shop',
  appleWebApp: { capable: true, title: 'POS Shop', statusBarStyle: 'black-translucent' },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0F151F' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <head>
        {/* Anti-flash: aplica clase dark + bg correcto antes de hidratar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var d=false;
                try{var s=JSON.parse(localStorage.getItem('theme-storage')||'{}');d=!!(s.state&&s.state.isDark)}catch(e){}
                var c=d?'#0F151F':'#FAF7F2';
                var h=document.documentElement;
                h.className=(h.className+' '+(d?'dark':'')).trim();
                h.style.cssText='color-scheme:'+(d?'dark':'light')+';background-color:'+c;
                document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=c});
              })();
              if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){});}
            `,
          }}
        />
      </head>
      <body className="bg-surface text-ink font-sans antialiased">
        <ThemeSync />
        <InstallPWABanner />
        <QueryProvider>{children}</QueryProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3500}
          theme="system"
          toastOptions={{
            classNames: {
              toast: 'glass !rounded-md !border-border/60 !shadow-2',
              title: '!text-ink !font-medium',
              description: '!text-ink-muted',
            },
          }}
        />
      </body>
    </html>
  );
}
