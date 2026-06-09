// =============================================================================
// remote-logger.ts
// Envía logs/errores al backend (POST /logs/mobile) para diagnóstico remoto.
// Yo veo los errores desde el VPS con:
//   ssh root@62.146.228.180 "docker logs -f pos_ldmapp_backend | grep MOBILE_LOG"
// =============================================================================

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';

const ENDPOINT = 'https://api-pos.ldmapp.com/api/v1/logs/mobile';
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Level = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

interface LogContext {
  userId?: string;
  empresaId?: string;
  route?: string;
}

const ctx: LogContext = {};

let currentRoute: string | undefined;

const deviceSnapshot = {
  platform: Platform.OS,
  osVersion: Platform.Version?.toString() ?? '',
  model: Device.modelName ?? '',
  appVersion: Application.nativeApplicationVersion ?? '0.1.0',
  buildNumber: Application.nativeBuildVersion ?? '1',
  locale: Localization.getLocales?.()[0]?.languageTag ?? 'es-PE',
};

export function setLoggerSession(opts: { userId?: string; empresaId?: string }) {
  ctx.userId = opts.userId;
  ctx.empresaId = opts.empresaId;
}

export function clearLoggerSession() {
  ctx.userId = undefined;
  ctx.empresaId = undefined;
}

export function setLoggerRoute(route: string) {
  currentRoute = route;
}

function truncate(s: unknown, max: number) {
  const str = typeof s === 'string' ? s : String(s);
  return str.length > max ? str.slice(0, max) : str;
}

async function send(level: Level, message: string, error?: unknown, stack?: string, extra?: Record<string, unknown>) {
  // Log local en consola (visible en Expo Go / dev)
  // eslint-disable-next-line no-console
  if (__DEV__) console[level === 'fatal' || level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log']('[REMOTE_LOG]', message, error ?? '');

  try {
    const body: Record<string, unknown> = {
      level,
      message: truncate(message, 500),
      sessionId: SESSION_ID,
      timestamp: new Date().toISOString(),
      device: deviceSnapshot,
    };
    if (error) body.error = truncate(error instanceof Error ? error.message : String(error), 2000);
    if (stack) body.stackTrace = truncate(stack, 8000);
    if (currentRoute) body.route = currentRoute;
    if (ctx.userId) body.userId = ctx.userId;
    if (ctx.empresaId) body.empresaId = ctx.empresaId;
    if (extra && Object.keys(extra).length > 0) body.extra = truncate(JSON.stringify(extra), 2000);

    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire and forget — un fallo aquí NO debe romper la app.
  }
}

export const remoteLogger = {
  debug: (msg: string, extra?: Record<string, unknown>) => send('debug', msg, undefined, undefined, extra),
  info: (msg: string, extra?: Record<string, unknown>) => send('info', msg, undefined, undefined, extra),
  warning: (msg: string, extra?: Record<string, unknown>) => send('warning', msg, undefined, undefined, extra),
  error: (msg: string, err?: unknown, extra?: Record<string, unknown>) => {
    const stack = err instanceof Error ? err.stack : undefined;
    return send('error', msg, err, stack, extra);
  },
  fatal: (msg: string, err?: unknown, extra?: Record<string, unknown>) => {
    const stack = err instanceof Error ? err.stack : undefined;
    return send('fatal', msg, err, stack, extra);
  },
};

/**
 * Instalar handlers globales — llamar UNA vez al iniciar la app (en _layout.tsx).
 */
export function installGlobalErrorHandlers() {
  const g = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler?: () => (e: Error, fatal?: boolean) => void;
      setGlobalHandler?: (h: (e: Error, fatal?: boolean) => void) => void;
    };
  };

  const prev = g.ErrorUtils?.getGlobalHandler?.();
  g.ErrorUtils?.setGlobalHandler?.((err, isFatal) => {
    remoteLogger[isFatal ? 'fatal' : 'error']('GlobalJSError', err);
    prev?.(err, isFatal);
  });

  // Promise rejections sin .catch
  if (typeof process !== 'undefined' && typeof (process as { on?: unknown }).on === 'function') {
    (process as { on: (e: string, cb: (...args: unknown[]) => void) => void }).on(
      'unhandledRejection',
      (reason: unknown) => {
        remoteLogger.error('UnhandledPromiseRejection', reason);
      },
    );
  }
}
