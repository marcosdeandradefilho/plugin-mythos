// Teste de ponta a ponta com o cliente MCP oficial.
// Uso: node test/mcp.test.mjs [URL do /mcp]  (sem URL, sobe um servidor local temporário)
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createServer } from 'node:http';
import { inflateRawSync } from 'node:zlib';
import { handleMcp } from '../lib/http.js';
import { deck, site, html } from './fixtures.mjs';

let failures = 0;
const ok = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures += 1; };

let url = process.argv[2];
let local;
if (!url) {
  local = createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    await handleMcp(req, res, raw ? JSON.parse(raw) : undefined);
  });
  await new Promise((r) => local.listen(0, r));
  url = `http://localhost:${local.address().port}/mcp`;
}
console.log(`Alvo: ${url}`);

const client = new Client({ name: 'mythos-test', version: '1.0.0' });
await client.connect(new StreamableHTTPClientTransport(new URL(url)));

const info = client.getServerVersion();
ok(info?.name === 'plugin-mythos', `initialize: servidor ${info?.name} ${info?.version}`);
ok(/mythos_design_brief/.test(client.getInstructions() || ''), 'initialize: instruções do servidor presentes');

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
ok(JSON.stringify(names) === JSON.stringify(['mythos_design_brief', 'mythos_render_html', 'mythos_render_site', 'mythos_render_slides']), `tools/list: ${names.join(', ')}`);
for (const t of tools.filter((x) => x.name.startsWith('mythos_render'))) {
  ok(t._meta?.ui?.resourceUri === 'ui://mythos/studio-v1.html', `${t.name}: _meta.ui.resourceUri`);
  ok(t._meta?.['openai/outputTemplate'] === 'ui://mythos/studio-v1.html', `${t.name}: alias openai/outputTemplate`);
  ok(t.annotations?.readOnlyHint === true, `${t.name}: readOnlyHint`);
  ok(!!t.outputSchema, `${t.name}: outputSchema`);
}

const { resources } = await client.listResources();
ok(resources.some((r) => r.uri === 'ui://mythos/studio-v1.html'), 'resources/list: widget listado');
const res = await client.readResource({ uri: 'ui://mythos/studio-v1.html' });
const w = res.contents[0];
ok(w.mimeType === 'text/html;profile=mcp-app', `resources/read: mimeType ${w.mimeType}`);
ok(w.text.includes('window.Mythos') || w.text.includes('global.Mythos'), 'resources/read: motor embutido no widget');
ok(!w.text.includes('/*__ENGINE__*/'), 'resources/read: placeholder substituído');
ok(Array.isArray(w._meta?.ui?.csp?.resourceDomains), 'resources/read: CSP declarada');

const brief = await client.callTool({ name: 'mythos_design_brief', arguments: { kind: 'slides', topic: 'aula de literatura brasileira', audience: 'ensino médio' } });
ok(brief.content[0].text.includes('## Method'), 'brief: método retornado');
ok(brief.structuredContent?.recommendedThemes?.length === 3, `brief: temas ${brief.structuredContent?.recommendedThemes}`);

function decode(viewUrl) {
  const d = viewUrl.split('#d=')[1];
  return JSON.parse(inflateRawSync(Buffer.from(d, 'base64url')).toString('utf8'));
}

const r1 = await client.callTool({ name: 'mythos_render_slides', arguments: deck });
ok(!r1.isError, 'render_slides: sem erro');
ok(r1.structuredContent?.kind === 'slides' && r1.structuredContent.count === deck.slides.length, `render_slides: ${r1.structuredContent?.count} slides`);
ok(r1._meta?.['mythos/payload']?.slides?.length === deck.slides.length, 'render_slides: payload em _meta');
ok(decode(r1.structuredContent.viewUrl).slides.length === deck.slides.length, 'render_slides: viewUrl decodifica');
console.log('      avisos:', JSON.stringify(r1.structuredContent.warnings));

const r2 = await client.callTool({ name: 'mythos_render_site', arguments: site });
ok(!r2.isError && r2.structuredContent?.kind === 'site', `render_site: ${r2.structuredContent?.count} seções`);
ok(decode(r2.structuredContent.viewUrl).sections.length === site.sections.length, 'render_site: viewUrl decodifica');
console.log('      avisos:', JSON.stringify(r2.structuredContent.warnings));

const r3 = await client.callTool({ name: 'mythos_render_html', arguments: html });
ok(!r3.isError && r3.structuredContent?.kind === 'html', 'render_html: ok');
ok(/name="viewport"/.test(decode(r3.structuredContent.viewUrl).html), 'render_html: viewport injetado');
console.log('      avisos:', JSON.stringify(r3.structuredContent.warnings));

const bad = await client.callTool({ name: 'mythos_render_slides', arguments: { title: 'x', slides: [{ layout: 'bullets', bullets: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }] } });
ok(bad.structuredContent?.warnings?.length >= 3, `crítico: ${bad.structuredContent?.warnings?.length} avisos para deck ruim`);

const inval = await client.callTool({ name: 'mythos_render_slides', arguments: { title: 'x', slides: [{ layout: 'nao-existe' }] } }).catch((e) => ({ isError: true, err: e }));
ok(inval.isError === true, 'validação: layout inválido rejeitado pelo schema');

await client.close();
if (local) local.close();
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os testes passaram');
process.exit(failures ? 1 : 0);
