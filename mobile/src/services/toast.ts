// =============================================================================
// toast.ts — Wrapper sobre react-native-toast-message (ya configurado).
// =============================================================================

import Toast from 'react-native-toast-message';

interface Opts {
  title: string;
  message?: string;
}

export function toastSuccess({ title, message }: Opts) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 2200,
  });
}

export function toastError({ title, message }: Opts) {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 3500,
  });
}

export function toastInfo({ title, message }: Opts) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 2000,
  });
}

export function toastWarn({ title, message }: Opts) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 2600,
  });
}
