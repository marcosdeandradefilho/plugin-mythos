# Plugin Mythos para ChatGPT

Plugin que transforma o ChatGPT num estúdio de apresentações e páginas web. Ele cria **slides**, **sites e landing pages** e **experiências interativas** (quizzes, flashcards, simulações, jogos, dashboards) e mostra o resultado **renderizado dentro da conversa**. Cada resultado vem com um link que abre em tela cheia, baixa um HTML autocontido e imprime em PDF.

- Servidor MCP em produção: `https://plugin-mythos.vercel.app/mcp`
- Página do projeto e demonstrações: https://plugin-mythos.vercel.app

Construído sobre a documentação oficial de plugins da OpenAI (outubro de 2026): servidor MCP remoto com UI no padrão aberto **MCP Apps** (`text/html;profile=mcp-app`, `_meta.ui.resourceUri`), skills empacotadas e manifesto portátil **Agent Plugins** (`plugin.json` + `mcp.json`), com manifesto de compatibilidade `.codex-plugin/plugin.json`.

## Instalar

### No ChatGPT (web, recomendado)
1. Abra **https://chatgpt.com/plugins**, clique em **+** e escolha **Add custom MCP server**. Se a opção não aparecer, ative o **Developer mode** em Configurações → Apps → Avançado. A disponibilidade depende do plano e das políticas do seu workspace.
2. Em **Connection**, cole `https://plugin-mythos.vercel.app/mcp`. Autenticação: **No authentication**.
3. Leia o aviso, clique em **I understand and want to continue** e depois em **Create as a plugin**.
4. Confira as 4 ferramentas descobertas. Abra uma conversa nova, digite **@**, escolha o Mythos e peça, por exemplo: *"Crie uma apresentação de 10 slides sobre o Modernismo brasileiro para o ensino médio"*.

### No app desktop do ChatGPT e no Codex (plugin completo, com skills)
Este repositório já é um marketplace (`.agents/plugins/marketplace.json`):

```bash
codex plugin marketplace add marcosdeandradefilho/plugin-mythos
```

Reinicie o app desktop, abra o **Plugins Directory**, escolha o marketplace **Mythos** e instale. O pacote fica em [`plugins/plugin-mythos/`](plugins/plugin-mythos).

### Publicar para o seu workspace ou no diretório público
- Workspace (admins): em chatgpt.com/plugins → **Personal** → menu ⋯ do plugin → **Publish**.
- Diretório público: envie pelo portal de submissão da OpenAI com o endpoint `https://plugin-mythos.vercel.app/mcp`. Para a verificação de domínio, defina a variável `OPENAI_APPS_CHALLENGE` na Vercel com o token do portal; ele é servido em `/.well-known/openai-apps-challenge`.

## Ferramentas MCP

| Ferramenta | O que faz |
| --- | --- |
| `mythos_design_brief` | Entrega ao modelo o método de design: narrativa, temas recomendados, catálogo de layouts e seções, regras de texto e de imagem, barra de qualidade. |
| `mythos_render_slides` | Renderiza um deck 16:9: 18 layouts, gráficos SVG animados, estatísticas com contagem, linha do tempo, comparação, tabela, código, quiz, flashcards, notas do apresentador, visão geral e tela cheia. |
| `mythos_render_site` | Renderiza site ou landing page responsiva: menu fixo, hero, recursos, seções com imagem ou gráfico, números, depoimentos, preços, FAQ, linha do tempo, galeria, equipe, formulário, CTA e rodapé. |
| `mythos_render_html` | Renderiza qualquer HTML autocontido (jogos, simulações, quizzes com pontuação, dashboards, decks sob medida). |

As três ferramentas de renderização devolvem `warnings`, um crítico de qualidade objetivo: bullets demais, títulos longos, layouts repetidos, quiz sem resposta válida, gráfico com dados desalinhados, imagens de hosts bloqueados. O modelo é instruído a corrigir e renderizar de novo antes de responder.

Temas: `aurora`, `editorial`, `noir`, `minimal`, `oceano`, `solar`, `terra`, `neon`, `academia`, `corporate`, ou um tema próprio (`{"base":"minimal","accent":"#E4572E","headingFont":"Poppins"}`).

## Como funciona

```
ChatGPT ──tools/call──▶ /mcp (Vercel, sem estado)
   │                        │ valida (zod) · critica (lint) · comprime o conteúdo no link
   │◀── structuredContent + _meta ──┘
   ▼
Widget MCP Apps (iframe no chat) ── motor Mythos ──▶ slides / site / HTML
   └── "Abrir link" ─▶ /view#d=<conteúdo comprimido> ─▶ tela cheia · baixar HTML · PDF
```

- **Sem banco de dados.** O conteúdo viaja comprimido (deflate + base64url) depois do `#` do link, parte que o navegador não envia ao servidor.
- **Um motor só** (`engine/mythos-engine.js`, sem dependências) roda no widget, na página `/view` e no HTML exportado.

## Estrutura

```
plugin-mythos/
├── .agents/plugins/marketplace.json   marketplace do repositório
├── plugins/plugin-mythos/              pacote do plugin
│   ├── plugin.json                     manifesto portátil (Agent Plugins 1.0.0) + extensions.com.openai
│   ├── mcp.json                        servidor MCP (streamable-http)
│   ├── .codex-plugin/plugin.json       manifesto de compatibilidade
│   ├── .mcp.json                       MCP no formato de compatibilidade
│   ├── skills/                         mythos-slides · mythos-site · mythos-interactive · setup
│   └── assets/                         ícone e logo
├── api/mcp.js                          função Vercel do endpoint /mcp
├── lib/                                servidor MCP, brief de design, crítico, catálogo
├── engine/                             motor de renderização e shell do widget
├── public/                             landing, /view, privacidade, termos
└── test/                               teste MCP de ponta a ponta e host simulado
```

## Desenvolvimento

```bash
npm install
npm test            # 32 verificações MCP (initialize, tools, recurso de UI, render, crítico, validação)
npm run dev         # http://localhost:8787  ·  /mcp  ·  /harness?k=slides|site|html (host simulado)
node test/mcp.test.mjs https://plugin-mythos.vercel.app/mcp   # testa a produção
```

Deploy: `vercel deploy --prod` (time `marcos-de-andrades-projects`).

## Limites conhecidos
- Dentro do ChatGPT o widget só carrega imagens e scripts dos hosts listados em `lib/catalog.js` (CSP). No link compartilhável não há essa restrição.
- O widget não faz requisições de rede; dados precisam vir embutidos no conteúdo.
- A qualidade do texto depende do modelo que o ChatGPT estiver usando; o plugin fornece o método, os layouts, o motor visual e a crítica.

Licença MIT.
