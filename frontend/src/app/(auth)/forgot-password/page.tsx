'use client';

/**
 * @file page.tsx
 * @description Forgot Password Page - Solicitar recuperacion de contrasena
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Send, Moon, Sun, Sparkles, CheckCircle } from 'lucide-react';
import { useForgotPassword } from '@/application/hooks/mutations/use-auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isDark, setIsDark] = useState(true);
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const validateEmail = (value: string) => {
    if (!value) return 'El correo es obligatorio';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ingresa un correo valido';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError('');
    try {
      await forgotMutation.mutateAsync({ email });
      setSent(true);
    } catch {
      // Error handled by mutation hook
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-black' : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Grid pattern */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isDark
          ? 'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]'
          : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:32px_32px]'
      }`} />

      {/* Gradient orbs */}
      {isDark ? (
        <>
          <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" />
        </>
      ) : (
        <>
          <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-300 rounded-full filter blur-[128px] opacity-40" />
          <div className="absolute top-0 -right-40 w-80 h-80 bg-cyan-300 rounded-full filter blur-[128px] opacity-40" />
        </>
      )}

      {/* Radial overlay */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isDark
          ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]'
          : 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.5)_100%)]'
      }`} />

      {/* Theme Toggle */}
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
            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <Sun className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
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
          <div className={`relative backdrop-blur-xl border rounded-2xl p-8 shadow-2xl transition-all duration-500 ${
            isDark
              ? 'bg-zinc-900/50 border-zinc-800'
              : 'bg-white/80 border-slate-200'
          }`}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="relative inline-flex"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-30 animate-pulse" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className={`text-2xl font-bold mt-6 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {sent ? 'Correo enviado' : 'Recuperar contrasena'}
                </h1>
                <p className={`mt-2 text-sm transition-colors duration-300 ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  {sent
                    ? 'Revisa tu bandeja de entrada'
                    : 'Te enviaremos un enlace para restablecer tu contrasena'}
                </p>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Si el correo <span className="font-medium">{email}</span> esta registrado, recibiras las instrucciones para cambiar tu contrasena.
                  </p>
                  <Link
                    href="/login"
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                      isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-500'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a iniciar sesion
                  </Link>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit}
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
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                      placeholder="tu@email.com"
                      className={`
                        w-full h-12 px-4 border rounded-lg transition-all duration-300 outline-none
                        ${isDark
                          ? 'bg-zinc-800/50 text-white placeholder-zinc-500'
                          : 'bg-white text-slate-900 placeholder-slate-400'
                        }
                        ${emailError
                          ? 'border-red-500/50 focus:border-red-500'
                          : isDark
                            ? 'border-zinc-700 hover:border-zinc-600 focus:border-purple-500'
                            : 'border-slate-300 hover:border-slate-400 focus:border-purple-500'
                        }
                      `}
                      disabled={forgotMutation.isPending}
                    />
                    {emailError && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400">
                        {emailError}
                      </motion.p>
                    )}
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={forgotMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative w-full h-12 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden ${
                      isDark
                        ? 'bg-white text-black'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {forgotMutation.isPending ? (
                      <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                        isDark ? 'border-black' : 'border-white'
                      }`} />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar instrucciones</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                  </motion.button>

                  {/* Back to login */}
                  <div className="text-center">
                    <Link
                      href="/login"
                      className={`inline-flex items-center gap-2 text-sm transition-colors ${
                        isDark ? 'text-zinc-400 hover:text-purple-400' : 'text-slate-500 hover:text-purple-600'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver a iniciar sesion
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
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
