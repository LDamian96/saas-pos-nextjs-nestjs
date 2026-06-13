// =============================================================================
// remote-logger.ts — Envía logs/errores al backend para diagnóstico remoto.
// Ver desde el VPS: ssh root@62.146.228.180 "docker logs -f pos_ldmapp_backend | grep MOBILE_LOG"
// =============================================================================

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';

const ENDPOINT = 'https://api-pos.ldmapp.com/api/v1/logs/mobile';
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

type Level = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

const ctx: { userId?: string; empresaId?: string } = {};
let currentRoute: string | undefined;

const device = {
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

async function send(level: Level, msg: string, err?: unknown, stack?: string, extra?: Record<string, unknown>) {
  if (__DEV__) {
    const fn = level === 'fatal' || level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    // eslint-disable-next-line no-console
    console[fn]('[REMOTE_LOG]', msg, err ?? '');
  }
  try {
    const body: Record<string, unknown> = {
      level,
      message: truncate(msg, 500),
      sessionId: SESSION_ID,
      timestamp: new Date().toISOString(),
      device,
    };
    if (err) body.error = truncate(err instanceof Error ? err.message : String(err), 2000);
    if (stack) body.stackTrace = truncate(stack, 8000);
    if (currentRoute) body.route = currentRoute;
    if (ctx.userId) body.userId = ctx.userId;
    if (ctx.empresaId) body.empresaId = ctx.empresaId;
    if (extra) body.extra = truncate(JSON.stringify(extra), 2000);

    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Fire and forget — no debe romper la app
  }
}

export const remoteLogger = {
  debug: (m: string, e?: Record<string, unknown>) => send('debug', m, undefined, undefined, e),
  info: (m: string, e?: Record<string, unknown>) => send('info', m, undefined, undefined, e),
  warning: (m: string, e?: Record<string, unknown>) => send('warning', m, undefined, undefined, e),
  error: (m: string, err?: unknown, extra?: Record<string, unknown>) => {
    const s = err instanceof Error ? err.stack : undefined;
    return send('error', m, err, s, extra);
  },
  fatal: (m: string, err?: unknown, extra?: Record<string, unknown>) => {
    const s = err instanceof Error ? err.stack : undefined;
    return send('fatal', m, err, s, extra);
  },
};

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
}
