/**
 * @file jwt.config.ts
 * @description Configuracion de JWT y cookies HTTPOnly
 *
 * @references
 * - Seguridad: ver docs/arquitectura/04-SEGURIDAD-OWASP.md
 */

export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
    expiresIn: '15m', // 15 minutos
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
    expiresIn: '7d', // 7 dias
  },
};

export const cookieConfig = {
  accessToken: {
    httpOnly: true, // NO accesible desde JavaScript
    secure: process.env.COOKIE_SECURE === 'true', // HTTPS only when explicitly enabled
    sameSite: 'lax' as const,
    maxAge: 15 * 60 * 1000, // 15 minutos
    path: '/',
  },
  refreshToken: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    path: '/api/v1/auth/refresh',
  },
};

// Configuracion de bloqueo por intentos fallidos
export const securityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutos
  passwordSaltRounds: 12,
};
