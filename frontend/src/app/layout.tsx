import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/presentation/providers/query-provider';
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
    <html lang="es">
      <body>
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
