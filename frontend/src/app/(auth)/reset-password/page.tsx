'use client';

/**
 * @file page.tsx
 * @description Reset Password Page - Restablecer contrasena con token
 */

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from '@/shared/motion';
import { Lock, Eye, EyeOff, ArrowLeft, Moon, Sun, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import { useResetPassword } from '@/application/hooks/mutations/use-auth';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-[#00932C] border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [isDark, setIsDark] = useState(true);
  const [success, setSuccess] = useState(false);

  const resetMutation = useResetPassword();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setIsDark(saved === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const validate = () => {
    const newErrors: { password?: string; confirm?: string } = {};
    if (!password) newErrors.password = 'La contrasena es obligatoria';
    else if (password.length < 6) newErrors.password = 'Minimo 6 caracteres';
    else if (password.length > 100) newErrors.password = 'Maximo 100 caracteres';

    if (!confirmPassword) newErrors.confirm = 'Confirma tu contrasena';
    else if (password !== confirmPassword) newErrors.confirm = 'Las contrasenas no coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await resetMutation.mutateAsync({ token, password, confirmPassword });
      setSuccess(true);
    } catch {
      // Error handled by mutation hook
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F4F4F4] to-white'
      }`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Enlace invalido
          </h1>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Este enlace no es valido o ha expirado. Solicita uno nuevo.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#00932C] hover:text-[#00932C] transition-colors"
          >
            Solicitar nuevo enlace
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex items-center justify-center p-4 overflow-hidden transition-colors duration-500 ${
      isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F4F4F4] to-white'
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
          <div className="absolute top-0 -left-40 w-80 h-80 bg-[#CCE9D5]/400 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" />
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
                <div className="w-14 h-14 bg-[#00932C] rounded-xl flex items-center justify-center shadow-lg shadow-[#00932C]/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00932C] to-[#00932C] rounded-xl blur opacity-30 animate-pulse" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className={`text-2xl font-bold mt-6 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {success ? 'Contrasena actualizada' : 'Nueva contrasena'}
                </h1>
                <p className={`mt-2 text-sm transition-colors duration-300 ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  {success
                    ? 'Ya puedes iniciar sesion con tu nueva contrasena'
                    : 'Ingresa tu nueva contrasena'}
                </p>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
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
                  <Link
                    href="/login"
                    className={`inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg transition-all ${
                      isDark
                        ? 'bg-white text-black hover:bg-zinc-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    Iniciar sesion
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
                  {/* Password */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}>
                      <Lock className="w-4 h-4" />
                      Nueva contrasena
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                        placeholder="Minimo 6 caracteres"
                        className={`
                          w-full h-12 px-4 pr-12 border rounded-lg transition-all duration-300 outline-none
                          ${isDark
                            ? 'bg-zinc-800/50 text-white placeholder-zinc-500'
                            : 'bg-white text-slate-900 placeholder-slate-400'
                          }
                          ${errors.password
                            ? 'border-red-500/50 focus:border-red-500'
                            : isDark
                              ? 'border-zinc-700 hover:border-zinc-600 focus:border-[#00932C]'
                              : 'border-slate-300 hover:border-slate-400 focus:border-[#00932C]'
                          }
                        `}
                        disabled={resetMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                          isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400">
                        {errors.password}
                      </motion.p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}>
                      <Lock className="w-4 h-4" />
                      Confirmar contrasena
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((prev) => ({ ...prev, confirm: undefined })); }}
                        placeholder="Repite tu contrasena"
                        className={`
                          w-full h-12 px-4 pr-12 border rounded-lg transition-all duration-300 outline-none
                          ${isDark
                            ? 'bg-zinc-800/50 text-white placeholder-zinc-500'
                            : 'bg-white text-slate-900 placeholder-slate-400'
                          }
                          ${errors.confirm
                            ? 'border-red-500/50 focus:border-red-500'
                            : isDark
                              ? 'border-zinc-700 hover:border-zinc-600 focus:border-[#00932C]'
                              : 'border-slate-300 hover:border-slate-400 focus:border-[#00932C]'
                          }
                        `}
                        disabled={resetMutation.isPending}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                          isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirm && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400">
                        {errors.confirm}
                      </motion.p>
                    )}
                  </div>

                  {/* Password strength hint */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              password.length >= level * 3
                                ? level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-amber-500' : level <= 3 ? 'bg-cyan-500' : 'bg-emerald-500'
                                : isDark ? 'bg-zinc-700' : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        {password.length < 6 ? 'Muy corta' : password.length < 9 ? 'Aceptable' : password.length < 12 ? 'Buena' : 'Excelente'}
                      </p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={resetMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative w-full h-12 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden ${
                      isDark
                        ? 'bg-white text-black'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    {resetMutation.isPending ? (
                      <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                        isDark ? 'border-black' : 'border-white'
                      }`} />
                    ) : (
                      <span>Cambiar contrasena</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00932C] to-[#00932C] opacity-0 group-hover:opacity-10 transition-opacity" />
                  </motion.button>

                  {/* Back to login */}
                  <div className="text-center">
                    <Link
                      href="/login"
                      className={`inline-flex items-center gap-2 text-sm transition-colors ${
                        isDark ? 'text-zinc-400 hover:text-[#00932C]' : 'text-slate-500 hover:text-[#00932C]'
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
