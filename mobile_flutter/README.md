# POS Shop · Mobile (Flutter)

App móvil del POS Shop construida con Flutter, arquitectura Clean + SOLID,
animaciones premium tipo GSAP-mobile y autenticación biométrica.

> Backend compartido: `https://api-pos.ldmapp.com` (NestJS desplegado en VPS).

## Stack

- **Flutter** ≥ 3.27 / **Dart** ≥ 3.5
- **Riverpod 2** (state)
- **go_router** (routing)
- **dio + retrofit** (HTTP)
- **drift** (SQLite offline queue)
- **flutter_secure_storage** (tokens, PIN hash)
- **local_auth** (huella / Face ID)
- **flutter_animate + rive + lottie** (animaciones)

## Arquitectura

```
lib/
├── app/                # Config raíz (theme, router, constants)
├── core/               # Capa transversal (network, storage, errors, widgets)
└── features/           # Cada feature independiente con domain / data / presentation
    ├── auth/
    ├── home/
    ├── sales/
    ├── products/
    ├── cash/
    └── settings/
```

Cada feature sigue **Clean Architecture**:

- `domain/` — entidades, contratos de repositorio, use cases (puro Dart)
- `data/` — implementación, datasources remote/local, modelos
- `presentation/` — providers (Riverpod), pages, widgets

## Comandos

```bash
flutter pub get
flutter run
flutter build apk --release --split-per-abi
```

## Distribución

Configurado para **Codemagic** (`codemagic.yaml`). Al hacer push a master,
genera APK release y publica URL descargable.
