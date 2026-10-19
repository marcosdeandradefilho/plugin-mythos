// Adaptador HTTP (Node req/res) para o transporte Streamable HTTP do MCP, em modo stateless.
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMythosServer } from './server.js';

export function baseUrlFrom(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (/^(localhost|127\.)/.test(host) ? 'http' : 'https');
  return `${String(proto).split(',')[0]}://${String(host).split(',')[0]}`;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, mcp-session-id, mcp-protocol-version, authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

export async function handleMcp(req, res, parsedBody) {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed. Use POST (Streamable HTTP, stateless).' }, id: null }));
    return;
  }
  // Clientes que não anunciam JSON e SSE no Accept recebiam 406 do SDK; o servidor responde
  // sempre em JSON, então normalizamos o cabeçalho em vez de recusar.
  const accept = String(req.headers.accept || '');
  if (!(accept.includes('application/json') && accept.includes('text/event-stream'))) {
    req.headers.accept = 'application/json, text/event-stream';
    const raw = req.rawHeaders;
    if (Array.isArray(raw)) {
      const i = raw.findIndex((h, k) => k % 2 === 0 && h.toLowerCase() === 'accept');
      if (i >= 0) raw[i + 1] = req.headers.accept; else raw.push('Accept', req.headers.accept);
    }
  }
  const server = createMythosServer({ baseUrl: baseUrlFrom(req) });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { transport.close(); server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (err) {
    console.error('MCP error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null }));
    }
  }
}
