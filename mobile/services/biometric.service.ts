// =============================================================================
// biometric.service.ts — Login con huella digital / Face ID.
// Guarda email + password (encriptado) en SecureStore. Al login, pide huella,
// si OK lee credenciales y devuelve para invocar el login normal.
// =============================================================================

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY_EMAIL = 'biometric_email';
const KEY_PASSWORD = 'biometric_password';
const KEY_ENABLED = 'biometric_enabled';

export interface BiometricStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  saved: boolean;
}

/** Estado del dispositivo + si hay credenciales guardadas */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = hasHardware
    ? await LocalAuthentication.supportedAuthenticationTypesAsync()
    : [];
  const enabled = await SecureStore.getItemAsync(KEY_ENABLED);
  const email = await SecureStore.getItemAsync(KEY_EMAIL);
  return { hasHardware, isEnrolled, supportedTypes, saved: enabled === '1' && !!email };
}

/** Solicita huella al usuario */
export async function promptBiometric(reason = 'Verifica tu huella para entrar'): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Usar credenciales',
      disableDeviceFallback: false,
      cancelLabel: 'Cancelar',
    });
    return result.success;
  } catch {
    return false;
  }
}

/** Guardar credenciales cifradas y habilitar el login biometrico */
export async function enableBiometricLogin(email: string, password: string): Promise<boolean> {
  const ok = await promptBiometric('Confirma tu huella para activarla');
  if (!ok) return false;
  await SecureStore.setItemAsync(KEY_EMAIL, email);
  await SecureStore.setItemAsync(KEY_PASSWORD, password);
  await SecureStore.setItemAsync(KEY_ENABLED, '1');
  return true;
}

export async function disableBiometricLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_EMAIL);
  await SecureStore.deleteItemAsync(KEY_PASSWORD);
  await SecureStore.deleteItemAsync(KEY_ENABLED);
}

/** Recuperar credenciales tras autenticar con huella */
export async function loginWithBiometric(): Promise<{ email: string; password: string } | null> {
  const status = await getBiometricStatus();
  if (!status.hasHardware || !status.isEnrolled || !status.saved) return null;
  const ok = await promptBiometric();
  if (!ok) return null;
  const email = await SecureStore.getItemAsync(KEY_EMAIL);
  const password = await SecureStore.getItemAsync(KEY_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}
