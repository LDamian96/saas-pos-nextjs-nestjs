'use client';

/**
 * @file page.tsx
 * @description Login Page - Estilo v0/Vercel con Dark/Light mode
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from '@/shared/motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Sparkles, Moon, Sun } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/application/validators/auth.validator';
import { useLogin } from '@/application/hooks/mutations/use-auth';
import { useThemeStore } from '@/application/stores/theme.store';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { isDark, toggleTheme } = useThemeStore();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  const handleDemoLogin = (type: 'superadmin' | 'admin') => {
    const email = type === 'superadmin' ? 'superadmin@pos-saas.com' : 'admin@demo.com';
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'admin123', { shouldValidate: true });
    // Call onSubmit directly to avoid validation timing issues
    onSubmit({ email, password: 'admin123' });
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F4F4F4] to-white'
    }`}>
      {/* Grid pattern background */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isDark
          ? 'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]'
          : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px]'
      }`} />

      {/* Gradient orbs - solo en dark mode */}
      {isDark && (
        <>
          <div className="absolute top-0 -left-40 w-80 h-80 bg-[#CCE9D5]/400 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" />
        </>
      )}

      {/* Light mode orbs */}
      {!isDark && (
        <>
          <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-300 rounded-full filter blur-[128px] opacity-40" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-cyan-300 rounded-full filter blur-[128px] opacity-40" />
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-300 rounded-full filter blur-[128px] opacity-30" />
        </>
      )}

      {/* Radial gradient overlay */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]'
          : 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.5)_100%)]'
      }`} />

      {/* Theme Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 p-3 rounded-full transition-all duration-300 ${
          isDark
            ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400'
            : 'bg-white hover:bg-slate-100 text-slate-700 shadow-lg'
        }`}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative">
          {/* Card con efecto glass */}
          <div className={`relative backdrop-blur-xl border rounded-2xl p-8 shadow-2xl transition-all duration-500 ${
            isDark
              ? 'bg-zinc-900/50 border-zinc-800'
              : 'bg-white/80 border-slate-200'
          }`}>
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8">
              {/* Logo animado */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="relative inline-flex"
              >
                <div className="w-14 h-14 bg-[#00932C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00932C]/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00932C] to-[#00932C] rounded-xl blur opacity-30 animate-pulse" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className={`text-2xl font-bold mt-6 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Bienvenido de nuevo
                </h1>
                <p className={`mt-2 text-sm transition-colors duration-300 ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  Ingresa a tu cuenta para continuar
                </p>
              </motion.div>
            </div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Email Field */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  <Mail className="w-4 h-4" />
                  Correo electronico
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    {...register('email')}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="tu@email.com"
                    className={`
                      w-full h-12 px-4 border rounded-lg transition-all duration-300 outline-none
                      ${isDark
                        ? 'bg-zinc-800/50 text-white placeholder-zinc-500'
                        : 'bg-white text-slate-900 placeholder-slate-400'
                      }
                      ${errors.email
                        ? 'border-red-500/50 focus:border-red-500'
                        : focusedField === 'email'
                          ? 'border-[#00932C] shadow-lg shadow-purple-500/10'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600'
                            : 'border-slate-300 hover:border-slate-400'
                      }
                    `}
                    disabled={loginMutation.isPending}
                  />
                  {focusedField === 'email' && !errors.email && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl -z-10" />
                  )}
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}>
                  <Lock className="w-4 h-4" />
                  Contrasena
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={`
                      w-full h-12 px-4 pr-12 border rounded-lg transition-all duration-300 outline-none
                      ${isDark
                        ? 'bg-zinc-800/50 text-white placeholder-zinc-500'
                        : 'bg-white text-slate-900 placeholder-slate-400'
                      }
                      ${errors.password
                        ? 'border-red-500/50 focus:border-red-500'
                        : focusedField === 'password'
                          ? 'border-[#00932C] shadow-lg shadow-purple-500/10'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600'
                            : 'border-slate-300 hover:border-slate-400'
                      }
                    `}
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  {focusedField === 'password' && !errors.password && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl -z-10" />
                  )}
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className={`text-sm transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-[#00932C]' : 'text-slate-500 hover:text-[#00932C]'
                  }`}
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loginMutation.isPending}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`relative w-full h-12 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden ${
                  isDark
                    ? 'bg-white text-black'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {loginMutation.isPending ? (
                  <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                    isDark ? 'border-black' : 'border-white'
                  }`} />
                ) : (
                  <>
                    <span>Iniciar Sesion</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                {/* Button hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00932C] to-[#00932C] opacity-0 group-hover:opacity-10 transition-opacity" />
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t transition-colors duration-300 ${
                    isDark ? 'border-zinc-800' : 'border-slate-200'
                  }`} />
                </div>
                <div className="relative flex justify-center">
                  <span className={`px-4 text-sm transition-colors duration-300 ${
                    isDark ? 'text-zinc-500 bg-zinc-900/50' : 'text-slate-500 bg-white/80'
                  }`}>o continua con</span>
                </div>
              </div>

              {/* Demo Buttons */}
              <div className="space-y-3">
                <motion.button
                  type="button"
                  onClick={() => handleDemoLogin('superadmin')}
                  disabled={loginMutation.isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative w-full h-12 bg-[#0C0C0C] hover:bg-black text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden shadow-lg shadow-[#0C0C0C]/15"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Super Admin (Dueno del SaaS)</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={loginMutation.isPending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative w-full h-12 bg-[#00932C] hover:bg-[#006920] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden shadow-lg shadow-[#00932C]/15"
                >
                  <Zap className="w-5 h-5" />
                  <span>Admin Negocio (Tienda Demo)</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.button>
              </div>
            </motion.form>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                No tienes cuenta?{' '}
                <Link
                  href="/register"
                  className="text-[#00932C] hover:text-[#00932C] font-medium transition-colors"
                >
                  Registra tu empresa
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Features badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4 mt-6"
          >
            {['Seguro', 'Rapido', 'Multi-tenant'].map((feature) => (
              <div
                key={feature}
                className={`flex items-center gap-1.5 text-xs transition-colors duration-300 ${
                  isDark ? 'text-zinc-500' : 'text-slate-500'
                }`}
              >
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className={`text-sm transition-colors duration-300 ${
          isDark ? 'text-zinc-600' : 'text-slate-400'
        }`}>
          Powered by <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>POS SaaS</span>
        </p>
      </div>
    </div>
  );
}
