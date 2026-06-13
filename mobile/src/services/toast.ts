// =============================================================================
// toast.ts — Wrapper sobre burnt para toasts NATIVOS (SF Symbols iOS,
// Material 3 Android). Se ven 100% nativos, no como toasts RN.
// =============================================================================

import { alert as burntAlert, toast as burntToast } from 'burnt';

interface Opts {
  title: string;
  message?: string;
}

export function toastSuccess({ title, message }: Opts) {
  burntToast({
    title,
    message,
    preset: 'done',
    haptic: 'success',
    duration: 2.2,
  });
}

export function toastError({ title, message }: Opts) {
  burntToast({
    title,
    message,
    preset: 'error',
    haptic: 'error',
    duration: 3.5,
  });
}

export function toastInfo({ title, message }: Opts) {
  burntToast({
    title,
    message,
    preset: 'none',
    haptic: 'none',
    duration: 2,
  });
}

export function toastWarn({ title, message }: Opts) {
  burntToast({
    title,
    message,
    preset: 'none',
    haptic: 'warning',
    duration: 2.6,
  });
}

export function dialogConfirm(opts: {
  title: string;
  message?: string;
  okLabel?: string;
  cancelLabel?: string;
}) {
  return burntAlert({
    title: opts.title,
    message: opts.message ?? '',
    preset: 'none',
    duration: 4,
  });
}
