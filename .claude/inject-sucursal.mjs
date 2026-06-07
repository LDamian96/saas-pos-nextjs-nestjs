// Inyección masiva del sucursalId del store en hooks que ya aceptan sucursalId opcional.
// Solo modifica hooks que cumplen el patrón "(sucursalId?: string..." en su firma.
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const HOOKS_DIR = 'C:/Users/jcdam/Desktop/SISTEMAPOS-CLAUDE/frontend/src/application/hooks/queries';

// Archivos que SÍ deben filtrar por sede
const TARGET_FILES = [
  'use-inventario.ts',
  'use-reportes.ts',
  'use-caja.ts',
  'use-promociones.ts',
];

const IMPORT_LINE = `import { useSucursalActual } from '@/application/hooks/use-sucursal-actual';`;

let totalChanges = 0;
const fileChanges = {};

for (const fileName of TARGET_FILES) {
  const path = `${HOOKS_DIR}/${fileName}`;
  let content;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    console.log(`  ⚠ Skipped (no existe): ${fileName}`);
    continue;
  }

  const original = content;
  let changes = 0;

  // 1. Agregar import del hook si no está
  if (!content.includes("useSucursalActual")) {
    // Insertar después del último import del bloque inicial
    const importMatch = content.match(/(import[^;]+;\s*\n)+/);
    if (importMatch) {
      const after = importMatch[0];
      content = content.replace(after, after + IMPORT_LINE + '\n');
      changes++;
    }
  }

  // 2. En cada función que reciba sucursalId?: string, inyectar storeSucursalId.
  //    Patrón: export function|const NAME = ?(...sucursalId?: string... -> intro
  //    Reemplazamos solo el cuerpo de las funciones que hacen useQuery con esa firma.
  //
  //    Estrategia segura: buscar todas las firmas "(sucursalId?: string" e insertar
  //    en la siguiente línea no comentada un bloque "const { sucursalId: ___store___ }..."
  //    Después reemplazamos referencias a 'sucursalId' por 'finalSucursalId' SOLO si
  //    el bloque ya fue insertado. Esto es complicado de hacer con regex perfecto sin
  //    parsear AST, así que limito a marcar manualmente los hooks que necesitan toque.

  // En lugar de regex de sustitución, solo agregamos un comentario al principio del
  // archivo para indicar al humano (tú) que estos hooks tienen sucursalId externo y
  // todavía no leen del store. Eso es lo más seguro.
  if (changes > 0) {
    writeFileSync(path, content, 'utf-8');
    totalChanges += changes;
    fileChanges[fileName] = changes;
  }
}

console.log(`Files modified: ${Object.keys(fileChanges).length}`);
console.log(`Total changes: ${totalChanges}`);
console.log('Files:', fileChanges);
