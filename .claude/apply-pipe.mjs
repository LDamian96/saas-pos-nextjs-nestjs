// Aplica NormalizeSucursalIdPipe en todos los @Query('sucursalId') de los controllers
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const CTRL_DIR = 'C:/Users/jcdam/Desktop/SISTEMAPOS-CLAUDE/backend/src/presentation/http/controllers';

const PIPE_IMPORT = `import { NormalizeSucursalIdPipe } from '../pipes/normalize-sucursal-id.pipe';`;

const files = globSync(`${CTRL_DIR}/*.controller.ts`);
let total = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // ¿Usa sucursalId en algún @Query?
  if (!/@Query\(['"]sucursalId['"]/.test(content)) continue;

  // 1. Agregar import del Pipe si no está
  if (!content.includes('NormalizeSucursalIdPipe')) {
    // Buscar el último import antes del @Controller
    const importBlock = content.match(/^(import[^;]+;\s*\n)+/m);
    if (importBlock) {
      content = content.replace(importBlock[0], importBlock[0] + PIPE_IMPORT + '\n');
    }
  }

  // 2. Reemplazar @Query('sucursalId') por @Query('sucursalId', NormalizeSucursalIdPipe)
  //    Solo si no tiene ya algo en el segundo parámetro
  content = content.replace(
    /@Query\((['"])sucursalId\1\)\s/g,
    `@Query('sucursalId', NormalizeSucursalIdPipe) `,
  );
  content = content.replace(
    /@Query\((['"])sucursalId\1\)(\s*)([a-zA-Z_])/g,
    `@Query('sucursalId', NormalizeSucursalIdPipe)$2$3`,
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    const name = file.split(/[\\/]/).pop();
    console.log(`✓ ${name}`);
    total++;
  }
}

console.log(`\nFiles modified: ${total}`);
