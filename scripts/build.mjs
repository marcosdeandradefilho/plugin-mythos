// Copia o motor para public/ (servido em /engine.js) e gera public/demos.js a partir das fixtures.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { deck, site, html } from '../test/fixtures.mjs';

mkdirSync('public', { recursive: true });
copyFileSync('engine/mythos-engine.js', 'public/engine.js');
writeFileSync('public/demos.js', `window.MYTHOS_DEMOS = ${JSON.stringify({ deck, site, html })};\n`);
console.log('build: public/engine.js e public/demos.js atualizados');
