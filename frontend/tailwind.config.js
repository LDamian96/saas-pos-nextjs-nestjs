/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // shadcn aliases (back-compat)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          hover: 'hsl(var(--accent-hover))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Lima Operativa tokens
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          2: 'hsl(var(--surface-2))',
          3: 'hsl(var(--surface-3))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          muted: 'hsl(var(--ink-muted))',
          soft: 'hsl(var(--ink-soft))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        // Legacy POS aliases para no romper código existente
        pos: {
          success: 'hsl(var(--success))',
          warning: 'hsl(var(--warning))',
          danger: 'hsl(var(--danger))',
          info: 'hsl(var(--info))',
        },
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        DEFAULT: 'var(--r-sm)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Custom scale matching design-system.md
        'caps': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
        'body-s': ['0.8125rem', { lineHeight: '1.5' }],
        'body-m': ['0.9375rem', { lineHeight: '1.55' }],
        'body-l': ['1.0625rem', { lineHeight: '1.5' }],
        'display-m': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-l': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 160ms ease-in',
        'fade-in-up': 'fade-in-up 240ms ease-out',
        'modal-in': 'modal-in 220ms ease-out',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
