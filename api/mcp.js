import { handleMcp } from '../lib/http.js';

// Função Node da Vercel. A Vercel já entrega o corpo JSON em req.body.
export default async function handler(req, res) {
  const body = req.method === 'POST' ? req.body : undefined;
  await handleMcp(req, res, typeof body === 'string' ? JSON.parse(body || 'null') : body);
}
