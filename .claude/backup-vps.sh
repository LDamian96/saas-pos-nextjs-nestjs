#!/bin/bash
# =============================================================
# BACKUP TOTAL VPS - para migración completa a nuevo servidor
# =============================================================
set -e
PERU_TS=$(TZ='America/Lima' date '+%Y-%m-%d_%H-%M')
VPS_IP="2.24.217.99"
BACKUP_NAME="copia-del-vps-${VPS_IP}-${PERU_TS}"
TMPDIR="/opt/backups/${BACKUP_NAME}"

echo ""
echo "================================================="
echo "  BACKUP VPS → $BACKUP_NAME"
echo "================================================="
mkdir -p "$TMPDIR"/{apps,volumes,nginx,ssl,databases,scripts,docs}

# --- 1. CÓDIGO DE APPS (sin node_modules / .next / dist) ---
echo ""
echo "[1/6] Empaquetando código de apps..."
for d in /opt/pos-shop /opt/catalogo /opt/catalogo-saas /opt/ecommerce \
         /opt/escuelaapp /opt/gymfit /opt/medicita /opt/restaurant-qr \
         /opt/tienda /opt/dragonpe-nutrition /root/nota /root/agencia; do
  if [ -d "$d" ]; then
    name=$(basename "$d")
    echo "  → $name"
    tar -czf "$TMPDIR/apps/${name}.tar.gz" \
      --exclude='node_modules' --exclude='.next' --exclude='dist' \
      --exclude='.git' --exclude='build' --exclude='__pycache__' \
      -C "$(dirname "$d")" "$(basename "$d")" 2>/dev/null || true
  fi
done

# --- 2. VOLÚMENES DOCKER (datos persistentes) ---
echo ""
echo "[2/6] Empaquetando Docker volumes..."
VOLS_DIR="/var/lib/docker/volumes"
for vol in $(docker volume ls -q); do
  if [ -d "$VOLS_DIR/$vol/_data" ]; then
    size=$(du -sm "$VOLS_DIR/$vol/_data" 2>/dev/null | cut -f1)
    if [ "$size" -lt 5000 ]; then  # skip volumes > 5 GB
      echo "  → $vol (${size} MB)"
      tar -czf "$TMPDIR/volumes/${vol}.tar.gz" -C "$VOLS_DIR/$vol" _data 2>/dev/null || true
    else
      echo "  ⚠ $vol (${size} MB) — skipped (>5GB)"
    fi
  fi
done

# --- 3. POSTGRES DUMPS de containers running ---
echo ""
echo "[3/6] Dumps de Postgres..."
for c in $(docker ps --filter "ancestor=postgres:16-alpine" --filter "ancestor=postgres:15-alpine" --format "{{.Names}}"); do
  echo "  → $c"
  user=$(docker exec "$c" sh -c 'echo $POSTGRES_USER' 2>/dev/null)
  db=$(docker exec "$c" sh -c 'echo $POSTGRES_DB' 2>/dev/null)
  if [ -n "$user" ] && [ -n "$db" ]; then
    docker exec -T "$c" pg_dump -U "$user" "$db" 2>/dev/null | gzip > "$TMPDIR/databases/${c}_${db}.sql.gz" || true
  fi
done

# --- 4. NGINX CONFIGS ---
echo ""
echo "[4/6] Configs nginx..."
cp -r /etc/nginx/sites-available "$TMPDIR/nginx/" 2>/dev/null || true
cp -r /etc/nginx/sites-enabled "$TMPDIR/nginx/" 2>/dev/null || true
cp /etc/nginx/nginx.conf "$TMPDIR/nginx/" 2>/dev/null || true

# --- 5. SSL CERTIFICATES ---
echo ""
echo "[5/6] Certificados SSL..."
if [ -d /etc/letsencrypt ]; then
  tar -czf "$TMPDIR/ssl/letsencrypt.tar.gz" -C /etc letsencrypt 2>/dev/null || true
fi

# --- 6. DOCUMENTACIÓN + SCRIPTS ---
echo ""
echo "[6/6] Creando documentación..."

# Lista subdominios con sus targets
{
  echo "# Subdominios y containers"
  echo ""
  echo "| Subdominio | Container | Puerto |"
  echo "|---|---|---|"
  grep -rE "server_name|proxy_pass" /etc/nginx/sites-enabled/ 2>/dev/null \
    | grep -v "#" \
    | awk -F: '{print $2}' \
    | paste - - \
    | head -30
} > "$TMPDIR/docs/subdominios.md"

# Lista de containers
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" > "$TMPDIR/docs/containers.txt"

# Lista de volumes
docker volume ls > "$TMPDIR/docs/volumes.txt"

# Versión de Docker/sistema
{
  echo "=== OS ==="
  cat /etc/os-release
  echo
  echo "=== Docker ==="
  docker --version
  docker compose version
  echo
  echo "=== Nginx ==="
  nginx -v 2>&1
} > "$TMPDIR/docs/system.txt"

# README principal
cat > "$TMPDIR/README.md" << 'EOF'
# Backup VPS - Migración completa

Backup generado para migrar todas las apps a un VPS nuevo idéntico.

## Contenido

```
copia-del-vps-XXX/
├── README.md                    ← este archivo
├── apps/                        ← código de cada app (sin node_modules)
├── volumes/                     ← datos persistentes Docker (BD + uploads)
├── databases/                   ← pg_dump.sql.gz por cada DB
├── nginx/                       ← configs nginx (sites-available/enabled)
├── ssl/                         ← certificados Let's Encrypt
├── scripts/
│   ├── install-vps.sh           ← instala Docker, nginx, certbot
│   └── restore-all.sh           ← restaura todo
└── docs/
    ├── subdominios.md           ← mapeo subdominio → container
    ├── containers.txt           ← lista de containers
    ├── volumes.txt              ← lista de volumes
    └── system.txt               ← versión OS/Docker/Nginx
```

## Migración a VPS nuevo (Ubuntu 22.04/24.04)

### 1. SSH al VPS nuevo y subir este backup

```bash
scp copia-del-vps-*.tar.gz root@NUEVO_IP:/root/
ssh root@NUEVO_IP
cd /root && tar -xzf copia-del-vps-*.tar.gz
cd copia-del-vps-*/
```

### 2. Instalar dependencias del sistema

```bash
bash scripts/install-vps.sh
```

Esto instala: Docker, Docker Compose v2, Nginx, Certbot.

### 3. Restaurar volumes + apps + nginx

```bash
bash scripts/restore-all.sh
```

Esto:
- Descomprime cada `apps/*.tar.gz` a `/opt/` y `/root/`
- Restaura cada Docker volume (`volumes/*.tar.gz` → `/var/lib/docker/volumes/`)
- Copia configs nginx
- Re-emite certificados SSL con certbot (NO copia los viejos por si cambia dominio/IP)

### 4. Levantar containers

```bash
# POS Shop
cd /opt/pos-shop && docker compose -f docker-compose.ldmapp.yml up -d

# Catalogo + Ecommerce
cd /opt/catalogo && docker compose up -d
cd /opt/ecommerce && docker compose up -d

# Resto de apps...
# Ver docs/subdominios.md para mapping completo
```

### 5. Apuntar DNS

Cambia los A records de cada subdominio a la nueva IP del VPS.
Cloudflare se encarga del SSL frontend si lo usas (los certs Let's Encrypt locales son
solo backup, pero al usar Cloudflare no son necesarios para el visitante final).

## Recuperación con BD desde dump

Si los volumes están corruptos o quieres restaurar a otra versión de Postgres:

```bash
# 1. Levanta el container postgres del app vacío
cd /opt/pos-shop && docker compose -f docker-compose.ldmapp.yml up -d pos-postgres

# 2. Restaura el dump
gunzip < databases/pos_ldmapp_postgres_pos_ldmapp_db.sql.gz \
  | docker exec -i pos_ldmapp_postgres psql -U pos_ldmapp -d pos_ldmapp_db
```

## Credenciales y secretos

Los archivos `.env` de cada app están dentro de `apps/<nombre>.tar.gz`. Revisar
las contraseñas de DB y JWT antes de hacer público.

EOF

# install-vps.sh
cat > "$TMPDIR/scripts/install-vps.sh" << 'EOF'
#!/bin/bash
set -e
echo "Instalando Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

echo "Instalando Nginx + Certbot..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx

echo "Verificando..."
docker --version
docker compose version
nginx -v

echo ""
echo "OK. Siguiente: bash scripts/restore-all.sh"
EOF
chmod +x "$TMPDIR/scripts/install-vps.sh"

# restore-all.sh
cat > "$TMPDIR/scripts/restore-all.sh" << 'EOF'
#!/bin/bash
set -e
BASE="$(cd "$(dirname "$0")/.." && pwd)"

echo "================================================="
echo "  RESTORE DESDE $BASE"
echo "================================================="

echo ""
echo "[1/4] Restaurando apps..."
mkdir -p /opt
for f in "$BASE/apps/"*.tar.gz; do
  name=$(basename "$f" .tar.gz)
  echo "  → $name"
  # nota y agencia van a /root, el resto a /opt
  if [ "$name" = "nota" ] || [ "$name" = "agencia" ]; then
    tar -xzf "$f" -C /root/
  else
    tar -xzf "$f" -C /opt/
  fi
done

echo ""
echo "[2/4] Restaurando Docker volumes..."
# Crear los volumes y descomprimir _data dentro
VOLS="/var/lib/docker/volumes"
for f in "$BASE/volumes/"*.tar.gz; do
  vol=$(basename "$f" .tar.gz)
  echo "  → $vol"
  docker volume create "$vol" >/dev/null
  rm -rf "$VOLS/$vol/_data"
  tar -xzf "$f" -C "$VOLS/$vol/"
done

echo ""
echo "[3/4] Restaurando nginx..."
if [ -d "$BASE/nginx/sites-available" ]; then
  cp -r "$BASE/nginx/sites-available/"* /etc/nginx/sites-available/ 2>/dev/null || true
fi
if [ -d "$BASE/nginx/sites-enabled" ]; then
  cp -r "$BASE/nginx/sites-enabled/"* /etc/nginx/sites-enabled/ 2>/dev/null || true
fi
nginx -t && systemctl reload nginx || echo "⚠ Revisar nginx -t manualmente"

echo ""
echo "[4/4] SSL Let's Encrypt:"
echo "  Los certificados viejos están en ssl/letsencrypt.tar.gz pero NO se copian"
echo "  automáticamente porque dependen del IP del VPS. Para re-emitir:"
echo ""
echo "    certbot --nginx -d pos.ldmapp.com -d api-pos.ldmapp.com"
echo "    certbot --nginx -d catalogo.ldmapp.com -d catalogo-api.ldmapp.com"
echo "    ... (uno por cada subdominio en docs/subdominios.md)"
echo ""
echo "================================================="
echo "  Siguiente paso: levantar containers"
echo "================================================="
echo ""
echo "  cd /opt/pos-shop && docker compose -f docker-compose.ldmapp.yml up -d"
echo "  cd /opt/catalogo && docker compose up -d"
echo "  cd /opt/ecommerce && docker compose up -d"
echo "  cd /opt/gymfit && docker compose up -d"
echo "  cd /opt/medicita && docker compose up -d"
echo "  cd /opt/restaurant-qr && docker compose up -d"
echo "  cd /opt/tienda && docker compose up -d"
echo "  cd /opt/escuelaapp && docker compose up -d"
echo "  cd /opt/dragonpe-nutrition && docker compose up -d"
echo "  cd /opt/catalogo-saas && docker compose up -d"
echo "  cd /root/nota && docker compose up -d"
echo "  cd /root/agencia && docker compose up -d"
echo ""
EOF
chmod +x "$TMPDIR/scripts/restore-all.sh"

echo ""
echo "================================================="
echo "  Empaquetando todo en un solo .tar.gz..."
echo "================================================="
cd /opt/backups
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "✓ /opt/backups/${BACKUP_NAME}.tar.gz   ($SIZE)"
echo ""

# Limpiar temp
rm -rf "$TMPDIR"

echo "DONE"
