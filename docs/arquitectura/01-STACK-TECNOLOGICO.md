# 🛠️ STACK TECNOLÓGICO

## ⚠️ IMPORTANTE: VERSIONES POR DEFECTO

**NO especificamos versiones.** Usar siempre `npm install` sin versión para obtener la última estable.

```bash
# ✅ CORRECTO - Versión por defecto
npm install next

# ❌ INCORRECTO - No especificar versiones
npm install next@14.0.0
```

---

## 📦 BACKEND - NestJS (Puerto 4000)

### Instalación

```bash
# Crear proyecto NestJS
npx @nestjs/cli new backend
cd backend

# ============================================
# CORE NESTJS
# ============================================
npm install @nestjs/config
npm install @prisma/client
npm install prisma --save-dev
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install @nestjs/throttler
npm install @nestjs/cache-manager cache-manager

# ============================================
# SEGURIDAD
# ============================================
npm install bcrypt
npm install helmet
npm install hpp
npm install cookie-parser
npm install sanitize-html

# ============================================
# VALIDACIÓN
# ============================================
npm install class-validator class-transformer

# ============================================
# REDIS
# ============================================
npm install ioredis @nestjs-modules/ioredis
npm install cache-manager-ioredis-yet

# ============================================
# ARCHIVOS
# ============================================
npm install multer
npm install sharp
npm install xlsx
npm install pdfkit

# ============================================
# UTILIDADES
# ============================================
npm install uuid
npm install slugify

# ============================================
# TIPOS (DevDependencies)
# ============================================
npm install -D @types/bcrypt
npm install -D @types/passport-jwt
npm install -D @types/passport-local
npm install -D @types/multer
npm install -D @types/cookie-parser
npm install -D @types/hpp
```

### Configuración main.ts

```typescript
// backend/src/main.ts
// ⚠️ SOLO DESARROLLO - NO PRODUCCIÓN

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad
  app.use(helmet());
  app.use(cookieParser());

  // CORS para desarrollo
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Prefijo API
  app.setGlobalPrefix('api/v1');

  await app.listen(4000);
  console.log('🚀 Backend corriendo en http://localhost:4000');
}
bootstrap();
```

---

## 🎨 FRONTEND - NextJS (Puerto 3000)

### Instalación

```bash
# Crear proyecto NextJS con TypeScript y Tailwind
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

cd frontend

# ============================================
# SHADCN/UI - Diseño Ultra Moderno
# ============================================
npx shadcn-ui@latest init
# Responder: TypeScript: Yes, Style: Default, Color: Slate, CSS variables: Yes

# Componentes shadcn (agregar según necesidad)
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add form
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress

# ============================================
# ANIMACIONES - Framer Motion (Full animations)
# ============================================
npm install framer-motion

# ============================================
# TOASTER MODERNO - Sonner (Ultra estético)
# ============================================
npm install sonner

# ============================================
# TEMAS
# ============================================
npm install next-themes

# ============================================
# ESTADO Y DATA FETCHING
# ============================================
npm install @tanstack/react-query
npm install zustand
npm install axios

# ============================================
# FORMULARIOS Y VALIDACIÓN
# ============================================
npm install react-hook-form
npm install @hookform/resolvers
npm install zod

# ============================================
# TABLAS
# ============================================
npm install @tanstack/react-table

# ============================================
# ICONOS
# ============================================
npm install lucide-react

# ============================================
# CÓDIGO DE BARRAS / QR
# ============================================
npm install html5-qrcode

# ============================================
# EXCEL / CSV
# ============================================
npm install xlsx
npm install papaparse
npm install -D @types/papaparse

# ============================================
# IMPRESIÓN
# ============================================
npm install react-to-print

# ============================================
# FECHAS
# ============================================
npm install date-fns

# ============================================
# CHARTS / GRÁFICOS
# ============================================
npm install recharts

# ============================================
# DRAG & DROP (para upload)
# ============================================
npm install react-dropzone
```

### Configuración next.config.js

```javascript
// frontend/next.config.js
// ⚠️ SOLO DESARROLLO - NO PRODUCCIÓN

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:4000/api/v1',
  },
};

module.exports = nextConfig;
```

---

## 🎭 FRAMER MOTION - Animaciones

### Configuración Base

```tsx
// frontend/src/shared/utils/animations.ts

// Transiciones de página
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

// Fade in suave
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
};

// Slide desde izquierda
export const slideInLeft = {
  initial: { x: -30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 },
};

// Slide desde derecha
export const slideInRight = {
  initial: { x: 30, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: { duration: 0.3 },
};

// Scale up (para modales, cards)
export const scaleUp = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 },
};

// Stagger children (para listas)
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Hover effects
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2 },
};

// Button press
export const buttonPress = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};
```

### Ejemplo de Uso

```tsx
// Ejemplo: Lista animada
'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/utils/animations';

export function ProductList({ products }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-4 gap-4"
    >
      {products.map((product) => (
        <motion.div
          key={product.id}
          variants={staggerItem}
          whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
          className="p-4 bg-card rounded-lg"
        >
          {product.name}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

## 🍞 SONNER - Toaster Moderno

### Configuración

```tsx
// frontend/src/presentation/app/layout.tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </body>
    </html>
  );
}
```

### Uso de Sonner

```tsx
// Uso en cualquier componente
import { toast } from 'sonner';

// Success
toast.success('Producto creado exitosamente');

// Error
toast.error('Error al guardar');

// Warning
toast.warning('Stock bajo');

// Info
toast.info('Procesando...');

// Loading con promesa
toast.promise(saveProduct(), {
  loading: 'Guardando producto...',
  success: 'Producto guardado',
  error: 'Error al guardar',
});

// Custom con acción
toast('Venta completada', {
  description: 'Total: S/ 150.00',
  action: {
    label: 'Imprimir',
    onClick: () => handlePrint(),
  },
});

// Con duración personalizada
toast.success('Guardado', { duration: 2000 });
```

---

## 🗄️ DOCKER - PostgreSQL + Redis

### docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pos_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: pos_user
      POSTGRES_PASSWORD: pos_password_2024
      POSTGRES_DB: pos_database
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - pos_network

  redis:
    image: redis:7-alpine
    container_name: pos_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis_password_2024
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - pos_network

volumes:
  postgres_data:
  redis_data:

networks:
  pos_network:
    driver: bridge
```

### Comandos Docker

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## ⚙️ VARIABLES DE ENTORNO

### Backend (.env)

```env
# ⚠️ DESARROLLO - NO SUBIR A GIT

NODE_ENV=development
PORT=4000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=pos_user
DB_PASSWORD=pos_password_2024
DB_DATABASE=pos_database

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_2024

# JWT
JWT_SECRET=super_secreto_jwt_desarrollo_2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refresh_secret_desarrollo_2024
JWT_REFRESH_EXPIRES_IN=7d

# Cookies
COOKIE_SECRET=cookie_secret_2024

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
# ⚠️ DESARROLLO - NO SUBIR A GIT

NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_NAME=POS System
```

---

## 🎨 TAILWIND CONFIG

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-10px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 📝 RESUMEN DE PUERTOS

```
┌─────────────────────────────────────────────────────────────┐
│  DESARROLLO                                                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend (NextJS):     http://localhost:3000               │
│  Backend (NestJS):      http://localhost:4000               │
│  API Endpoints:         http://localhost:4000/api/v1        │
│  PostgreSQL:            localhost:5432                       │
│  Redis:                 localhost:6379                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 INICIO RÁPIDO

```bash
# 1. Clonar e instalar
git clone <repo>
cd SISTEMAPOS-CLAUDE

# 2. Docker (PostgreSQL + Redis)
docker-compose up -d

# 3. Backend
cd backend
npm install
npm run start:dev

# 4. Frontend (nueva terminal)
cd frontend
npm install
npm run dev

# Listo!
# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
```
