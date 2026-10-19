// Carrega o motor e o shell do widget uma vez por instância da função.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function load(rel) {
  const tries = [new URL(`../${rel}`, import.meta.url), join(process.cwd(), rel)];
  for (const p of tries) {
    try { return readFileSync(p, 'utf8'); } catch { /* tenta o próximo */ }
  }
  throw new Error(`Arquivo não encontrado: ${rel}`);
}

let cache = null;
export function assets() {
  if (cache) return cache;
  const engine = load('engine/mythos-engine.js');
  const shell = load('engine/widget.html');
  const widget = shell.replace('/*__ENGINE__*/', () => engine);
  cache = { engine, widget };
  return cache;
}
