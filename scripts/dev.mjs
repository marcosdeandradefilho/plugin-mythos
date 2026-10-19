// Servidor local que imita a Vercel: /mcp (MCP), /widget (prévia do widget) e arquivos de public/.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { handleMcp } from '../lib/http.js';
import { assets } from '../lib/assets.js';

const port = Number(process.env.PORT || 8787);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : undefined;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/mcp') {
    const body = req.method === 'POST' ? await readBody(req) : undefined;
    return handleMcp(req, res, body);
  }
  if (url.pathname === '/widget') {
    res.writeHead(200, { 'content-type': TYPES['.html'] });
    return res.end(assets().widget);
  }
  // Host simulado para testar o widget fora do ChatGPT.
  if (url.pathname === '/harness' || url.pathname === '/fixtures.mjs') {
    const f = url.pathname === '/harness' ? 'test/harness.html' : 'test/fixtures.mjs';
    res.writeHead(200, { 'content-type': url.pathname === '/harness' ? TYPES['.html'] : TYPES['.js'] });
    return res.end(await readFile(f));
  }
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!extname(p)) p += '.html';
  const file = normalize(join('public', p));
  if (!file.startsWith('public')) { res.writeHead(403); return res.end(); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(port, () => console.log(`Mythos dev: http://localhost:${port}  (MCP em /mcp)`));
