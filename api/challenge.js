// Verificação de domínio da submissão pública da OpenAI:
// defina OPENAI_APPS_CHALLENGE na Vercel com o token exibido no portal.
export default function handler(req, res) {
  const token = process.env.OPENAI_APPS_CHALLENGE;
  if (!token) { res.statusCode = 404; res.end('Not configured'); return; }
  res.setHeader('content-type', 'text/plain; charset=utf-8');
  res.end(token.trim());
}
