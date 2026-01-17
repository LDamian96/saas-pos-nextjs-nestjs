/**
 * @file auth.validator.ts
 * @description Validadores Zod para autenticación
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Escribe un correo valido'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria')
    .min(6, 'Minimo 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerEmpresaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la empresa es obligatorio')
    .max(200, 'Maximo 200 caracteres'),
  ruc: z
    .string()
    .regex(/^[0-9]{11}$/, 'El RUC debe tener 11 digitos')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Escribe un correo valido')
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .max(20, 'Maximo 20 caracteres')
    .optional()
    .or(z.literal('')),
});

export const registerUsuarioSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  apellido: z
    .string()
    .min(1, 'El apellido es obligatorio')
    .max(100, 'Maximo 100 caracteres'),
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Escribe un correo valido'),
  password: z
    .string()
    .min(6, 'Minimo 6 caracteres')
    .max(100, 'Maximo 100 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contrasena'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
});

export const registerSchema = z.object({
  empresa: registerEmpresaSchema,
  usuario: registerUsuarioSchema,
});

export type RegisterFormData = z.infer<typeof registerSchema>;
