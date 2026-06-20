import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('posshop.db');
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS productos_cache (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      sku TEXT,
      precio_venta REAL NOT NULL,
      imagen TEXT,
      categoria_id TEXT,
      categoria_nombre TEXT,
      variante_id TEXT,
      stock REAL DEFAULT 0,
      data TEXT,
      synced_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos_cache(nombre);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos_cache(categoria_id);

    CREATE TABLE IF NOT EXISTS categorias_cache (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      synced_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ventas_pendientes (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_ventas_pending ON ventas_pendientes(synced);
  `);
}

// ============ PRODUCTOS CACHE ============

export async function cacheProductos(productos: any[]) {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM productos_cache');
    for (const p of productos) {
      const variante = p.variantes?.[0];
      await db.runAsync(
        `INSERT OR REPLACE INTO productos_cache
         (id, nombre, sku, precio_venta, imagen, categoria_id, categoria_nombre, variante_id, stock, data, synced_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.nombre,
          p.sku || '',
          Number(p.precioVenta) || 0,
          p.imagenPrincipal || null,
          p.categoria?.id || null,
          p.categoria?.nombre || null,
          variante?.id || null,
          Number(variante?.stock) || 0,
          JSON.stringify(p),
          now,
        ]
      );
    }
  });
}

export async function getProductosFromCache(search?: string, categoriaId?: string | null): Promise<any[]> {
  const db = await getDb();
  let query = 'SELECT data FROM productos_cache WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (LOWER(nombre) LIKE ? OR LOWER(sku) LIKE ?)';
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term);
  }
  if (categoriaId) {
    query += ' AND categoria_id = ?';
    params.push(categoriaId);
  }
  query += ' ORDER BY nombre LIMIT 100';

  const rows = await db.getAllAsync<{ data: string }>(query, params);
  return rows.map((r) => JSON.parse(r.data));
}

export async function getProductosCacheCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM productos_cache');
  return row?.count || 0;
}

// ============ CATEGORIAS CACHE ============

export async function cacheCategorias(categorias: any[]) {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM categorias_cache');
    for (const c of categorias) {
      await db.runAsync(
        'INSERT OR REPLACE INTO categorias_cache (id, nombre, synced_at) VALUES (?, ?, ?)',
        [c.id, c.nombre, now]
      );
    }
  });
}

export async function getCategoriasFromCache(): Promise<any[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; nombre: string }>(
    'SELECT id, nombre FROM categorias_cache ORDER BY nombre'
  );
  return rows;
}

// ============ VENTAS PENDIENTES ============

export async function addVentaPendiente(payload: any): Promise<string> {
  const db = await getDb();
  const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    'INSERT INTO ventas_pendientes (id, payload, created_at, attempts, synced) VALUES (?, ?, ?, 0, 0)',
    [id, JSON.stringify(payload), Date.now()]
  );
  return id;
}

export async function getVentasPendientes(): Promise<Array<{ id: string; payload: any; attempts: number }>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; payload: string; attempts: number }>(
    'SELECT id, payload, attempts FROM ventas_pendientes WHERE synced = 0 ORDER BY created_at ASC'
  );
  return rows.map((r) => ({ id: r.id, payload: JSON.parse(r.payload), attempts: r.attempts }));
}

export async function getVentasPendientesCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM ventas_pendientes WHERE synced = 0'
  );
  return row?.count || 0;
}

export async function markVentaSynced(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM ventas_pendientes WHERE id = ?', [id]);
}

export async function markVentaError(id: string, error: string) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE ventas_pendientes SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    [error, id]
  );
}
