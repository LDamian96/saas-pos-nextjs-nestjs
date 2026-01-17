# 🛡️ SEGURIDAD - OWASP

## ⚠️ NOTA DE DESARROLLO

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Este documento describe la implementación de seguridad                 │
│  basada en OWASP Top 10 y mejores prácticas                            │
│                                                                          │
│  ⚠️ DESARROLLO: Implementar desde el inicio                            │
│  ⚠️ NO dejar la seguridad para después                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 1. AUTENTICACIÓN JWT CON HTTPONLY COOKIES

### Estrategia de Tokens

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOKENS                                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ACCESS TOKEN (Corta duración)                                          │
│  ├── Duración: 15-30 minutos                                            │
│  ├── Almacenamiento: Cookie HTTPOnly                                   │
│  ├── Uso: Autorizar requests a la API                                  │
│  └── NO accesible desde JavaScript (protección XSS)                    │
│                                                                          │
│  REFRESH TOKEN (Larga duración)                                         │
│  ├── Duración: 7-30 días                                                │
│  ├── Almacenamiento: Cookie HTTPOnly separada                          │
│  ├── Uso: Obtener nuevo access token                                   │
│  └── Rotación en cada uso                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementación Backend (NestJS)

```typescript
// src/config/jwt.config.ts
// @reference: 01-STACK-TECNOLOGICO.md

export const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};

export const cookieConfig = {
  accessToken: {
    httpOnly: true,           // NO accesible desde JS
    secure: process.env.NODE_ENV === 'production', // HTTPS en prod
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000,   // 15 minutos
    path: '/',
  },
  refreshToken: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    path: '/api/v1/auth/refresh',    // Solo accesible en refresh
  },
};
```

```typescript
// src/modules/auth/auth.service.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (tabla: usuarios)

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { cookieConfig } from '../../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(email: string, password: string, res: Response) {
    // 1. Buscar usuario
    const usuario = await this.usuariosService.findByEmail(email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está bloqueado
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      throw new UnauthorizedException('Cuenta bloqueada temporalmente');
    }

    // 3. Verificar password
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValid) {
      // Incrementar intentos fallidos
      await this.incrementarIntentosFallidos(usuario);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Resetear intentos fallidos
    await this.resetearIntentosFallidos(usuario);

    // 5. Generar tokens
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresa_id: usuario.empresa_id,
      rol: usuario.rol.codigo,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: usuario.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );

    // 6. Guardar refresh token hasheado en BD
    await this.guardarRefreshToken(usuario.id, refreshToken);

    // 7. Setear cookies HTTPOnly
    res.cookie('access_token', accessToken, cookieConfig.accessToken);
    res.cookie('refresh_token', refreshToken, cookieConfig.refreshToken);

    // 8. Actualizar último login
    await this.actualizarUltimoLogin(usuario.id);

    return {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol.codigo,
      },
    };
  }

  async logout(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logout exitoso' };
  }

  private async incrementarIntentosFallidos(usuario: any) {
    const intentos = usuario.intentos_fallidos + 1;
    const bloqueado_hasta = intentos >= 5
      ? new Date(Date.now() + 15 * 60 * 1000) // 15 min
      : null;

    await this.usuariosService.update(usuario.id, {
      intentos_fallidos: intentos,
      bloqueado_hasta,
    });
  }
}
```

```typescript
// src/common/guards/jwt-auth.guard.ts

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si es ruta pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }
    return user;
  }
}
```

```typescript
// src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extraer token de cookie HTTPOnly
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Verificar que el usuario existe y está activo
    const usuario = await this.usuariosService.findById(payload.sub);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
      email: payload.email,
      empresa_id: payload.empresa_id,
      rol: payload.rol,
    };
  }
}
```

---

## 🔒 2. PROTECCIÓN CSRF

```typescript
// main.ts
import * as csurf from 'csurf';

// Habilitar CSRF para cookies
// NOTA: Con cookies HTTPOnly + SameSite=Strict, CSRF es menos crítico
// pero se añade como capa adicional
app.use(csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
  },
}));
```

---

## 🛡️ 3. PROTECCIÓN CONTRA INYECCIÓN SQL

### Prisma (Seguro por defecto)

```typescript
// ✅ CORRECTO - Prisma usa parámetros preparados automáticamente
async buscarProductos(busqueda: string, empresaId: string) {
  return this.prisma.producto.findMany({
    where: {
      empresaId,
      nombre: {
        contains: busqueda,
        mode: 'insensitive',
      },
    },
  });
}

// ❌ INCORRECTO - Nunca usar queryRaw con interpolación
async buscarProductos(busqueda: string) {
  return this.prisma.$queryRawUnsafe(
    `SELECT * FROM productos WHERE nombre LIKE '%${busqueda}%'`
  );
}

// ✅ CORRECTO - Si necesitas raw query, usar $queryRaw con template literal
async buscarProductos(busqueda: string, empresaId: string) {
  return this.prisma.$queryRaw`
    SELECT * FROM productos
    WHERE empresa_id = ${empresaId}
    AND nombre ILIKE ${'%' + busqueda + '%'}
  `;
}
```

---

## 🧹 4. SANITIZACIÓN DE INPUTS

```typescript
// src/common/pipes/sanitize.pipe.ts

import { PipeTransform, Injectable } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [], // No permitir HTML
        allowedAttributes: {},
      });
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeObject(obj: any): any {
    const sanitized: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeHtml(obj[key], {
          allowedTags: [],
          allowedAttributes: {},
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }
}
```

```typescript
// Uso en controller
@Post()
@UsePipes(new SanitizePipe())
async crear(@Body() dto: CreateProductoDto) {
  // dto ya viene sanitizado
}
```

---

## 🚫 5. RATE LIMITING

```typescript
// src/app.module.ts

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,      // 1 segundo
        limit: 3,       // 3 requests por segundo
      },
      {
        name: 'medium',
        ttl: 10000,     // 10 segundos
        limit: 20,      // 20 requests por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000,     // 1 minuto
        limit: 100,     // 100 requests por minuto
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

```typescript
// Rate limiting específico por endpoint
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  async login() {}
}
```

---

## 🔐 6. HEADERS DE SEGURIDAD (HELMET)

```typescript
// main.ts

import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

---

## 🏢 7. MULTI-TENANT SECURITY

```typescript
// src/common/guards/tenant.guard.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (empresa_id en todas las tablas)

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin puede acceder a todo
    if (user.rol === 'super_admin') {
      return true;
    }

    // Verificar que empresa_id del recurso coincida con el usuario
    const resourceEmpresaId = request.params.empresaId || request.body.empresa_id;

    if (resourceEmpresaId && resourceEmpresaId !== user.empresa_id) {
      throw new ForbiddenException('No tienes acceso a este recurso');
    }

    return true;
  }
}
```

```typescript
// src/common/interceptors/tenant.interceptor.ts
// Inyectar empresa_id automáticamente en todas las consultas

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Inyectar empresa_id en body y query
    if (user && user.empresa_id) {
      if (request.body) {
        request.body.empresa_id = user.empresa_id;
      }
      if (request.query) {
        request.query.empresa_id = user.empresa_id;
      }
    }

    return next.handle();
  }
}
```

---

## 🔒 8. VALIDACIÓN DE DATOS

```typescript
// src/modules/productos/dto/create-producto.dto.ts
// @reference: 03-BASE-DATOS-COMPLETA.md (tabla: productos)

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  nombre: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  descripcion_corta?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    allowedAttributes: {},
  }))
  descripcion_larga?: string;

  @IsUUID()
  @IsNotEmpty()
  categoria_id: string;

  @IsUUID()
  @IsOptional()
  marca_id?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_venta: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  precio_compra?: number;

  @IsEnum(['simple', 'variable'])
  @IsOptional()
  tipo?: string = 'simple';

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;
}
```

---

## 📝 9. LOGGING DE SEGURIDAD

```typescript
// src/common/interceptors/logging.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Security');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user } = request;
    const userAgent = request.get('user-agent') || '';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms - ${ip} - ${userAgent} - User: ${user?.id || 'anonymous'}`
          );
        },
        error: (error) => {
          this.logger.error(
            `${method} ${url} ${error.status || 500} - ${ip} - User: ${user?.id || 'anonymous'} - Error: ${error.message}`
          );
        },
      }),
    );
  }
}
```

---

## 🔑 10. HASH DE PASSWORDS

```typescript
// src/common/utils/hash.util.ts

import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## 📋 CHECKLIST DE SEGURIDAD

```
AUTENTICACIÓN
□ JWT con cookies HTTPOnly
□ Tokens de corta duración (15 min)
□ Refresh tokens con rotación
□ Bloqueo por intentos fallidos
□ Logout que invalida tokens

AUTORIZACIÓN
□ Guards de roles
□ Guards de permisos
□ Guard multi-tenant
□ Validación de empresa_id en cada request

DATOS
□ Validación de DTOs
□ Sanitización de inputs
□ Parámetros en queries SQL
□ Escape de caracteres especiales

HEADERS
□ Helmet configurado
□ CORS restrictivo
□ Content-Security-Policy
□ X-Frame-Options

RATE LIMITING
□ Límite global
□ Límite por endpoint sensible
□ Límite en login

LOGGING
□ Log de accesos
□ Log de errores
□ Log de acciones sensibles
□ No loguear datos sensibles
```
