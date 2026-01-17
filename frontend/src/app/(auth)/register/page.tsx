'use client';

/**
 * @file page.tsx
 * @description Pagina de Registro - Empresa + Usuario Admin
 *
 * @references
 * - UX: ver docs/arquitectura/19-UX-UI-GUIDELINES.md
 * - Backend: ver backend/src/core/application/dto/auth/register.dto.ts
 * - Regla: SI UN NINO DE 10 ANOS NO PUEDE USARLO, ESTA MAL DISENADO
 */

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { registerSchema, type RegisterFormData } from '@/application/validators/auth.validator';
import { useRegister } from '@/application/hooks/mutations/use-auth';

type Step = 'empresa' | 'usuario';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<Step>('empresa');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      empresa: {
        nombre: '',
        ruc: '',
        email: '',
        telefono: '',
      },
      usuario: {
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
    },
  });

  const handleNextStep = async () => {
    const isValid = await trigger(['empresa.nombre', 'empresa.ruc', 'empresa.email', 'empresa.telefono']);
    if (isValid) {
      setCurrentStep('usuario');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep('empresa');
  };

  const onSubmit = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync({
      empresa: {
        nombre: data.empresa.nombre,
        ruc: data.empresa.ruc || undefined,
        email: data.empresa.email || undefined,
        telefono: data.empresa.telefono || undefined,
      },
      usuario: {
        nombre: data.usuario.nombre,
        apellido: data.usuario.apellido,
        email: data.usuario.email,
        password: data.usuario.password,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg"
    >
      {/* Logo y Titulo */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">POS</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Registra tu Empresa</h1>
        <p className="text-gray-500 mt-2">Crea tu cuenta en menos de 2 minutos</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              currentStep === 'empresa'
                ? 'bg-blue-600 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {currentStep === 'usuario' ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              '1'
            )}
          </div>
          <span className="text-sm font-medium text-gray-600">Empresa</span>
        </div>
        <div className={`w-12 h-1 mx-2 rounded ${currentStep === 'usuario' ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
              currentStep === 'usuario'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium text-gray-600">Tu Cuenta</span>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {currentStep === 'empresa' && (
            <motion.div
              key="empresa"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Nombre Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de tu negocio *
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <input
                    type="text"
                    {...register('empresa.nombre')}
                    placeholder="Ej: Mi Tienda SAC"
                    className={`w-full h-14 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.empresa?.nombre
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                </div>
                {errors.empresa?.nombre && (
                  <p className="mt-1 text-sm text-red-500">{errors.empresa.nombre.message}</p>
                )}
              </div>

              {/* RUC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC (opcional)
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <input
                    type="text"
                    {...register('empresa.ruc')}
                    placeholder="20123456789"
                    maxLength={11}
                    className={`w-full h-14 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.empresa?.ruc
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                </div>
                {errors.empresa?.ruc && (
                  <p className="mt-1 text-sm text-red-500">{errors.empresa.ruc.message}</p>
                )}
              </div>

              {/* Email Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contacto (opcional)
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    {...register('empresa.email')}
                    placeholder="contacto@empresa.com"
                    className={`w-full h-14 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.empresa?.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                </div>
                {errors.empresa?.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.empresa.email.message}</p>
                )}
              </div>

              {/* Telefono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefono (opcional)
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                    type="tel"
                    {...register('empresa.telefono')}
                    placeholder="987654321"
                    className={`w-full h-14 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.empresa?.telefono
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                </div>
                {errors.empresa?.telefono && (
                  <p className="mt-1 text-sm text-red-500">{errors.empresa.telefono.message}</p>
                )}
              </div>

              {/* Boton Siguiente */}
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-6"
              >
                Siguiente
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </motion.div>
          )}

          {currentStep === 'usuario' && (
            <motion.div
              key="usuario"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Nombre y Apellido en fila */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    {...register('usuario.nombre')}
                    placeholder="Juan"
                    className={`w-full h-14 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.usuario?.nombre
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                  {errors.usuario?.nombre && (
                    <p className="mt-1 text-sm text-red-500">{errors.usuario.nombre.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    {...register('usuario.apellido')}
                    placeholder="Perez"
                    className={`w-full h-14 px-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.usuario?.apellido
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                  {errors.usuario?.apellido && (
                    <p className="mt-1 text-sm text-red-500">{errors.usuario.apellido.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu correo electronico *
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    {...register('usuario.email')}
                    placeholder="tu@email.com"
                    className={`w-full h-14 pl-12 pr-4 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.usuario?.email
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                </div>
                {errors.usuario?.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.usuario.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contrasena *
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('usuario.password')}
                    placeholder="Minimo 6 caracteres"
                    className={`w-full h-14 pl-12 pr-12 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.usuario?.password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.usuario?.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.usuario.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contrasena *
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('usuario.confirmPassword')}
                    placeholder="Repite tu contrasena"
                    className={`w-full h-14 pl-12 pr-12 text-base border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.usuario?.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={registerMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.usuario?.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.usuario.confirmPassword.message}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 h-14 border-2 border-gray-200 hover:border-gray-300 text-gray-700 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  disabled={registerMutation.isPending}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Atras
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerMutation.isPending ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Crear Cuenta
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Login */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Iniciar Sesion
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
