'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Moon, Sun, AlertCircle } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/application/validators/auth.validator';
import { useLogin } from '@/application/hooks/mutations/use-auth';
import { useThemeStore } from '@/application/stores/theme.store';

function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect width="36" height="36" rx="10" fill="hsl(var(--brand))" />
      <path
        d="M9 12.5C9 11.1193 10.1193 10 11.5 10H22.5C25.5376 10 28 12.4624 28 15.5C28 18.5376 25.5376 21 22.5 21H14V25.5C14 26.3284 13.3284 27 12.5 27H11.5C10.1193 27 9 25.8807 9 24.5V12.5Z"
        fill="hsl(var(--accent))"
      />
      <circle cx="22" cy="15.5" r="1.5" fill="hsl(var(--brand))" />
    </svg>
  );
}

/* Ticket de venta ficticio que se anima para refuerzo del dominio */
function TicketVisual() {
  const items = [
    { sku: 'P-0008', name: 'Adidas Gazelle Bold', qty: 1, price: 399.9 },
    { sku: 'P-0028', name: 'Polo Trefoil Blanco', qty: 2, price: 119.9 },
    { sku: 'P-0078', name: 'Gorra Heritage86', qty: 1, price: 89.9 },
  ];
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const igv = total * 0.18;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative max-w-[320px] w-full bg-surface-2 border border-border rounded-md shadow-3 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-brand text-brand-foreground px-5 py-3 flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-sm tracking-tight">TIENDA DEMO</p>
          <p className="text-[11px] opacity-70 font-mono tabular">RUC 20512345678</p>
        </div>
        <span className="text-[10px] font-mono caps text-accent">BOLETA</span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-2.5">
        <div className="flex justify-between text-[11px] text-ink-muted font-mono tabular">
          <span>B001-00042</span>
          <span>28/05/2026 12:33</span>
        </div>

        <div className="border-t border-dashed border-border pt-3 space-y-2">
          {items.map((it, i) => (
            <motion.div
              key={it.sku}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.3 }}
              className="flex items-start justify-between text-body-s"
            >
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-ink font-medium truncate leading-tight">{it.name}</p>
                <p className="text-[10px] text-ink-soft font-mono tabular">
                  {it.qty} × S/ {it.price.toFixed(2)}
                </p>
              </div>
              <span className="font-mono tabular text-ink font-medium whitespace-nowrap">
                S/ {(it.qty * it.price).toFixed(2)}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-dashed border-border pt-3 space-y-1.5">
          <div className="flex justify-between text-body-s text-ink-muted">
            <span>Subtotal</span>
            <span className="font-mono tabular">S/ {(total - igv).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-body-s text-ink-muted">
            <span>IGV (18%)</span>
            <span className="font-mono tabular">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-border">
            <span className="font-display font-semibold text-ink">TOTAL</span>
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 220 }}
              className="font-mono tabular text-display-m text-accent font-bold"
            >
              S/ {total.toFixed(2)}
            </motion.span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[10px] font-mono tabular text-ink-soft">
          <span>YAPE · ****1234</span>
          <span>Cajero: Carlos</span>
        </div>
      </div>

      {/* Bottom serrated edge */}
      <div className="h-3 bg-surface relative">
        <svg className="absolute inset-x-0 bottom-0 w-full" viewBox="0 0 320 12" preserveAspectRatio="none" aria-hidden>
          <path
            d="M0 0L10 12L20 0L30 12L40 0L50 12L60 0L70 12L80 0L90 12L100 0L110 12L120 0L130 12L140 0L150 12L160 0L170 12L180 0L190 12L200 0L210 12L220 0L230 12L240 0L250 12L260 0L270 12L280 0L290 12L300 0L310 12L320 0V12H0V0Z"
            fill="hsl(var(--surface))"
          />
        </svg>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { isDark, toggleTheme } = useThemeStore();
  const loginMutation = useLogin();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  const handleDemo = (type: 'superadmin' | 'admin') => {
    const email = type === 'superadmin' ? 'superadmin@pos-saas.com' : 'admin@demo.com';
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'admin123', { shouldValidate: true });
    onSubmit({ email, password: 'admin123' });
  };

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col lg:flex-row">
      {/* Toggle tema flotante */}
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
        className="fixed top-4 right-4 z-20 p-2.5 rounded-sm bg-surface-2 border border-border text-ink-muted hover:text-ink shadow-1 transition-colors"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'sun' : 'moon'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="block"
          >
            {isDark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* — Panel izquierdo: marca + ticket visual — */}
      <aside className="hidden lg:flex lg:w-[52%] xl:w-1/2 relative bg-brand text-brand-foreground items-center justify-center px-12 py-10 overflow-hidden">
        {/* Patrón sutil de fondo (sin gradient orb) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        {/* Línea acento horizontal sutil */}
        <div className="absolute top-0 left-12 right-12 h-px bg-accent/40" aria-hidden />
        <div className="absolute bottom-0 left-12 right-12 h-px bg-accent/20" aria-hidden />

        <div className="relative max-w-md w-full">
          <div className="flex items-center gap-3 mb-10">
            <BrandMark size={44} />
            <div className="leading-tight">
              <p className="font-display font-bold text-xl tracking-tight">POS Shop</p>
              <p className="text-[11px] font-mono caps opacity-60">Punto de venta · ldmapp.com</p>
            </div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-display text-display-l text-brand-foreground leading-tight tracking-tight"
          >
            Tu caja te espera.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-3 text-body-m opacity-75 max-w-sm leading-relaxed"
          >
            Cobra rápido con boleta, factura y ticket. Yape, Plin, efectivo o tarjeta. Inventario y reportes en tiempo real.
          </motion.p>

          {/* Ticket visual */}
          <div className="mt-12 flex justify-center">
            <TicketVisual />
          </div>

          {/* Métricas pie de panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="mt-10 grid grid-cols-3 gap-6 max-w-md"
          >
            {[
              { v: 'IGV 18%', l: 'Cálculo automático' },
              { v: 'SUNAT', l: 'Boletas y facturas' },
              { v: '24/7', l: 'En la nube' },
            ].map((s) => (
              <div key={s.v}>
                <p className="font-display font-bold text-base text-accent">{s.v}</p>
                <p className="text-[11px] opacity-60 mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </aside>

      {/* — Panel derecho: formulario — */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Brand mobile */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <BrandMark size={36} />
            <div className="leading-tight">
              <p className="font-display font-bold text-lg tracking-tight text-ink">POS Shop</p>
              <p className="caps text-[10px]">Punto de venta</p>
            </div>
          </div>

          <h1 className="font-display text-display-l text-ink leading-tight">
            Ingresar
          </h1>
          <p className="mt-2 text-body-m text-ink-muted">
            Accede a tu tienda para comenzar a vender.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="caps mb-1.5 block">Correo</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@mitienda.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={loginMutation.isPending}
                className={`w-full h-11 px-3.5 bg-surface-2 border rounded-sm text-body-m text-ink placeholder:text-ink-soft outline-none transition-colors disabled:opacity-50
                  ${errors.email ? 'border-danger' : 'border-border focus:border-ink hover:border-border-strong'}`}
              />
              {errors.email && (
                <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-body-s text-danger">
                  <AlertCircle size={14} strokeWidth={2} /> {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="password" className="caps">Contraseña</label>
                <Link href="/forgot-password" className="text-body-s text-ink-muted hover:text-accent transition-colors">
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  disabled={loginMutation.isPending}
                  className={`w-full h-11 pl-3.5 pr-11 bg-surface-2 border rounded-sm text-body-m text-ink placeholder:text-ink-soft outline-none transition-colors disabled:opacity-50
                    ${errors.password ? 'border-danger' : 'border-border focus:border-ink hover:border-border-strong'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-soft hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 flex items-center gap-1.5 text-body-s text-danger">
                  <AlertCircle size={14} strokeWidth={2} /> {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-sm bg-accent text-accent-foreground font-medium text-body-m
                hover:bg-accent-hover active:scale-[0.985] transition-[background,transform] duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-1"
            >
              {loginMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Acceso demo */}
          <div className="mt-8">
            <div className="flex items-center gap-3 text-ink-soft mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="caps">Probar con demo</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('admin')}
                disabled={loginMutation.isPending}
                className="h-10 rounded-sm border border-border bg-surface-2 hover:bg-surface-3 text-body-s text-ink transition-colors disabled:opacity-50 text-left px-3"
              >
                <span className="block font-medium">Tienda Demo</span>
                <span className="block text-[11px] text-ink-muted">Admin negocio</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('superadmin')}
                disabled={loginMutation.isPending}
                className="h-10 rounded-sm border border-border bg-surface-2 hover:bg-surface-3 text-body-s text-ink transition-colors disabled:opacity-50 text-left px-3"
              >
                <span className="block font-medium">SaaS</span>
                <span className="block text-[11px] text-ink-muted">Super admin</span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-body-s text-ink-muted text-center">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-ink hover:text-accent font-medium underline underline-offset-4 decoration-border-strong transition-colors">
              Registra tu empresa
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
