// Reemplazo masivo purple/cyan → DineTrack green
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const SRC = 'C:/Users/jcdam/Desktop/SISTEMAPOS-CLAUDE/frontend/src';

const replacements = [
  // Gradients principales
  ['bg-gradient-to-r from-purple-600 to-cyan-600',           'bg-[#00932C] hover:bg-[#006920]'],
  ['bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500', 'bg-[#00932C] hover:bg-[#006920]'],
  ['bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-600', 'bg-[#00932C] hover:bg-[#006920]'],
  ['bg-gradient-to-br from-purple-500 to-cyan-500',          'bg-[#00932C]'],
  ['bg-gradient-to-br from-purple-600 to-cyan-600',          'bg-[#00932C]'],
  ['bg-gradient-to-r from-amber-500 to-orange-600',          'bg-[#0C0C0C] hover:bg-black'],
  ['from-purple-500 to-cyan-500',                            'from-[#00932C] to-[#00932C]'],
  ['from-purple-600 to-cyan-600',                            'from-[#00932C] to-[#006920]'],

  // Sombras purple → green
  ['shadow-purple-500/40',  'shadow-[#00932C]/30'],
  ['shadow-purple-500/30',  'shadow-[#00932C]/25'],
  ['shadow-purple-500/25',  'shadow-[#00932C]/20'],
  ['shadow-purple-500/20',  'shadow-[#00932C]/15'],
  ['shadow-purple-500/5',   'shadow-[#00932C]/10'],
  ['hover:shadow-purple-500/40', 'hover:shadow-[#00932C]/30'],
  ['shadow-amber-500/20',   'shadow-[#0C0C0C]/15'],

  // Texto purple → green
  ['text-purple-700',  'text-[#006920]'],
  ['text-purple-600',  'text-[#00932C]'],
  ['text-purple-500',  'text-[#00932C]'],
  ['text-purple-400',  'text-[#00932C]'],
  ['text-purple-300',  'text-[#86D49A]'],
  ['hover:text-purple-700', 'hover:text-[#006920]'],
  ['hover:text-purple-400', 'hover:text-[#86D49A]'],
  ['hover:text-purple-300', 'hover:text-[#86D49A]'],

  // Backgrounds purple → green
  ['bg-purple-50',          'bg-[#CCE9D5]/40'],
  ['bg-purple-100',         'bg-[#CCE9D5]'],
  ['bg-purple-500/10',      'bg-[#CCE9D5]/30'],
  ['bg-purple-500/20',      'bg-[#CCE9D5]/40'],
  ['bg-purple-500',         'bg-[#00932C]'],
  ['bg-purple-600',         'bg-[#00932C]'],

  // Focus rings y bordes
  ['focus-visible:ring-purple-500/50', 'focus-visible:ring-[#00932C]/50'],
  ['focus:ring-purple-500',  'focus:ring-[#00932C]'],
  ['border-purple-500',      'border-[#00932C]'],
  ['hover:border-purple-300', 'hover:border-[#00932C]/40'],

  // Fondos generales página
  ['bg-slate-50',  'bg-[#F4F4F4]'],
  ['from-slate-50 to-slate-100', 'from-[#F4F4F4] to-white'],
];

const files = globSync(`${SRC}/**/*.{ts,tsx,jsx,js}`, { nodir: true });

let totalFiles = 0;
let totalReplacements = 0;
const fileChanges = {};

for (const file of files) {
  const original = readFileSync(file, 'utf-8');
  let content = original;
  let fileRepl = 0;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      const count = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      content = content.split(from).join(to);
      fileRepl += count;
    }
  }
  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    totalFiles++;
    totalReplacements += fileRepl;
    const short = file.replace(SRC + '/', '');
    fileChanges[short] = fileRepl;
  }
}

console.log(`Files modified: ${totalFiles}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log('Top changed files:');
Object.entries(fileChanges)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([f, n]) => console.log(`  ${n}\t${f}`));
