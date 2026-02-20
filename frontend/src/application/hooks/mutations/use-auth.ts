/**
 * @file use-auth.ts
 * @description Hooks de autenticación con React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService, LoginDto, RegisterDto, ForgotPasswordDto, ResetPasswordDto } from '@/application/services/auth.service';
import { useAuthStore } from '@/application/stores/auth.store';

export const useLogin = () => {
  const router = useRouter();
  const setUsuario = useAuthStore((state) => state.setUsuario);

  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    onSuccess: (data) => {
      setUsuario(data.data.usuario);
      toast.success('Bienvenido al sistema');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Usuario o contrasena incorrectos';
      toast.error(message);
    },
  });
};

export const useRegister = () => {
  const router = useRouter();
  const setUsuario = useAuthStore((state) => state.setUsuario);

  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
    onSuccess: (data) => {
      setUsuario(data.data.usuario);
      toast.success('Empresa registrada correctamente');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrar. Intenta de nuevo';
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
      toast.success('Sesion cerrada');
      router.push('/login');
    },
    onError: () => {
      // Aunque falle, cerramos sesion localmente
      logout();
      queryClient.clear();
      router.push('/login');
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => authService.forgotPassword(dto),
    onSuccess: () => {
      toast.success('Si el correo existe, recibiras instrucciones para recuperar tu contrasena');
    },
    onError: () => {
      toast.error('No se pudo enviar el correo. Intenta de nuevo');
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
    onSuccess: () => {
      toast.success('Contrasena actualizada correctamente');
      router.push('/login');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'No se pudo cambiar la contrasena. El enlace puede haber expirado';
      toast.error(message);
    },
  });
};

export const useCurrentUser = () => {
  const setUsuario = useAuthStore((state) => state.setUsuario);
  const setLoading = useAuthStore((state) => state.setLoading);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const usuario = await authService.getMe();
        setUsuario(usuario);
        return usuario;
      } catch (error) {
        setUsuario(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
