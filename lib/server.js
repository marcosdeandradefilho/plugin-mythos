// Servidor MCP do Plugin Mythos: ferramentas, recurso de UI (MCP Apps) e instruções do servidor.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { deflateRawSync } from 'node:zlib';
import { assets } from './assets.js';
import { THEME_NAMES, SLIDE_LAYOUT_NAMES, SITE_SECTION_NAMES, VISUALS, RESOURCE_DOMAINS } from './catalog.js';
import { buildBrief } from './brief.js';
import { lintSlides, lintSite, lintHtml, wrapHtml } from './lint.js';

export const VERSION = '1.0.0';
export const WIDGET_URI = 'ui://mythos/studio-v1.html';
export const MIME = 'text/html;profile=mcp-app';
const MAX_URL = 1_500_000;

export const INSTRUCTIONS = `Plugin Mythos turns ChatGPT into a presentation and web design studio. It renders slide decks, websites/landing pages and interactive HTML (quizzes, flashcards, simulations, games, dashboards) live inside the chat, with a shareable link that also offers HTML download and PDF printing.

Workflow for any request to create slides, a presentation, a deck, a lecture, a pitch, a website, a landing page, a page, an interactive lesson, a quiz or similar:
1. Call mythos_design_brief once (kind + topic + audience + goal) and follow its method.
2. Write the real content yourself: specific, accurate, no placeholders, in the user's language.
3. Call mythos_render_slides (decks), mythos_render_site (sites/landing pages) or mythos_render_html (custom interactivity or fully bespoke designs).
4. Read "warnings" in the result. If any exist, fix the content and render again before replying.
5. Reply with the viewUrl link, a 2-3 line summary of the structure, and 2-3 concrete refinement options.
To edit an existing result, render again with the full updated content (rendering is stateless).
Never invent image URLs; use the built-in generative visuals, icons and charts unless the user provided images.`;

const S = z.string();
const opt = (t) => t.optional();

const Cta = z.union([S, z.object({ label: S, url: opt(S).describe('https URL or #section-id') }).passthrough()]);
const Chart = z.object({
  type: z.enum(['bar', 'line', 'area', 'pie', 'donut', 'hbar']).describe('Chart type'),
  labels: opt(z.array(S)).describe('Category labels (x axis or slices)'),
  series: opt(z.array(z.object({ name: opt(S), values: z.array(z.number()), color: opt(S) }).passthrough())).describe('One or more numeric series aligned with labels'),
  data: opt(z.array(z.object({ label: S, value: z.number() }))).describe('Alternative single-series format'),
  prefix: opt(S).describe('e.g. "R$ " or "$"'),
  suffix: opt(S).describe('e.g. "%" or " mi"'),
  stacked: opt(z.boolean()),
  centerLabel: opt(S).describe('Donut center text')
}).passthrough();
const Item = z.object({
  title: opt(S), text: opt(S), date: opt(S), label: opt(S), icon: opt(S).describe('Icon name or emoji'), back: opt(S).describe('Back side text for flip cards')
}).passthrough();
const Column = z.object({ heading: opt(S), icon: opt(S), text: opt(S), bullets: opt(z.array(S)) }).passthrough();
const ThemeObj = z.object({
  base: opt(z.enum(THEME_NAMES)), accent: opt(S), accent2: opt(S), bg: opt(S), surface: opt(S), text: opt(S), muted: opt(S),
  headingFont: opt(S).describe('Google Fonts family name'), bodyFont: opt(S), dark: opt(z.boolean()), radius: opt(z.number())
}).passthrough();
const Theme = z.union([z.enum(THEME_NAMES), ThemeObj]).describe(`Theme name (${THEME_NAMES.join(', ')}) or a custom object based on one.`);

const Slide = z.object({
  layout: z.enum(SLIDE_LAYOUT_NAMES).describe('Slide layout; see mythos_design_brief for the catalog'),
  title: opt(S).describe('Assertion-style title; wrap words in {braces} for gradient on title/statement/closing'),
  subtitle: opt(S), kicker: opt(S).describe('Small uppercase label above the title'), text: opt(S),
  bullets: opt(z.array(z.union([S, z.object({ text: S, icon: opt(S), detail: opt(S) })]))).describe('Max 6'),
  reveal: opt(z.boolean()).describe('Reveal bullets one click at a time'),
  image: opt(S).describe('https image URL (only if real/provided)'), imageSide: opt(z.enum(['left', 'right', 'full'])), caption: opt(S), alt: opt(S),
  visual: opt(z.enum(VISUALS)).describe('Generative art when there is no image'),
  quote: opt(S), author: opt(S), role: opt(S), date: opt(S), event: opt(S), number: opt(z.union([S, z.number()])),
  stats: opt(z.array(z.object({ value: S, label: S, detail: opt(S) }))),
  chart: opt(Chart), source: opt(S),
  items: opt(z.array(z.union([S, Item]))).describe('timeline/steps/agenda items'),
  cards: opt(z.array(Item)), flip: opt(z.boolean()),
  left: opt(Column), right: opt(Column), vs: opt(z.boolean()),
  columns: opt(z.array(S)), rows: opt(z.array(z.array(S))), highlightColumn: opt(z.number().int()),
  code: opt(S), language: opt(S),
  question: opt(S), options: opt(z.array(S)), answer: opt(z.number().int()).describe('0-based index of the correct option'), explanation: opt(S),
  cta: opt(Cta), contact: opt(z.array(S)), html: opt(S),
  background: opt(S).describe('"gradient" | "accent" | "surface" | hex color | https image URL'),
  notes: opt(S).describe('Speaker notes: what to say on this slide')
}).passthrough();

const Section = z.object({
  type: z.enum(SITE_SECTION_NAMES).describe('Section type; see mythos_design_brief for the catalog'),
  id: opt(S), navLabel: opt(S).describe('Adds this section to the top menu'),
  title: opt(S), subtitle: opt(S), kicker: opt(S), text: opt(S), badge: opt(S), note: opt(S),
  variant: opt(z.enum(['centered', 'split'])), image: opt(S), alt: opt(S), visual: opt(z.enum(VISUALS)),
  primaryCta: opt(Cta), secondaryCta: opt(Cta), cta: opt(Cta), button: opt(Cta),
  items: opt(z.array(z.union([S, z.object({}).passthrough()]))).describe('features/steps/timeline/testimonials/faq/team/logos items'),
  stats: opt(z.array(z.object({ value: S, label: S }))),
  plans: opt(z.array(z.object({ name: S, price: opt(S), period: opt(S), description: opt(S), features: opt(z.array(S)), cta: opt(Cta), highlighted: opt(z.boolean()), tag: opt(S) }).passthrough())),
  bullets: opt(z.array(S)), reverse: opt(z.boolean()), chart: opt(Chart), source: opt(S),
  images: opt(z.array(z.union([S, z.object({ image: S, caption: opt(S) })]))), columns: opt(z.number().int()),
  fields: opt(z.array(z.object({ name: opt(S), label: S, type: opt(S), required: opt(z.boolean()), options: opt(z.array(S)), placeholder: opt(S) }))),
  action: opt(S).describe('https endpoint that receives the contact form POST'),
  paragraphs: opt(z.array(S)), links: opt(z.array(z.union([S, z.object({ label: S, url: opt(S) })]))), html: opt(S)
}).passthrough();

const Output = {
  kind: z.enum(['slides', 'site', 'html']),
  title: S,
  viewUrl: S.describe('Shareable link: opens the result full-page with download (HTML) and print (PDF)'),
  count: z.number().int(),
  theme: S,
  warnings: z.array(S).describe('Quality issues to fix before replying; empty means it passed')
};

function encodePayload(payload) {
  return deflateRawSync(Buffer.from(JSON.stringify(payload), 'utf8'), { level: 9 }).toString('base64url');
}

function themeLabel(th) {
  if (typeof th === 'string') return th;
  if (th && typeof th === 'object') return `custom (${th.base || 'aurora'})`;
  return 'aurora';
}

function result({ payload, warnings, count, baseUrl, label }) {
  let viewUrl = `${baseUrl}/view#d=${encodePayload(payload)}`;
  if (viewUrl.length > MAX_URL) {
    warnings = [...warnings, `Content is very large (${Math.round(viewUrl.length / 1024)} KB link); some browsers may truncate it. Reduce inline data or images.`];
  }
  const structuredContent = { kind: payload.kind, title: payload.title, viewUrl, count, theme: payload.kind === 'html' ? 'custom' : themeLabel(payload.theme), warnings };
  const lines = [
    `Rendered ${label}: "${payload.title}" (${count} ${payload.kind === 'slides' ? 'slides' : payload.kind === 'site' ? 'sections' : 'KB'}, theme ${structuredContent.theme}).`,
    `Shareable link (fullscreen view, HTML download, PDF print): ${viewUrl}`,
    warnings.length ? `Warnings to fix before replying (render again after fixing):\n- ${warnings.join('\n- ')}` : 'Quality check passed with no warnings.'
  ];
  return {
    content: [{ type: 'text', text: lines.join('\n') }],
    structuredContent,
    _meta: { 'mythos/payload': payload }
  };
}

const UI_META = (invoking, invoked) => ({
  ui: { resourceUri: WIDGET_URI },
  'openai/outputTemplate': WIDGET_URI,
  'openai/toolInvocation/invoking': invoking,
  'openai/toolInvocation/invoked': invoked
});

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export function createMythosServer({ baseUrl }) {
  const server = new McpServer(
    { name: 'plugin-mythos', title: 'Plugin Mythos', version: VERSION },
    { instructions: INSTRUCTIONS }
  );

  server.registerResource(
    'mythos-studio',
    WIDGET_URI,
    { title: 'Mythos Studio', description: 'Interactive viewer for Mythos slide decks, websites and HTML experiences.', mimeType: MIME },
    async () => ({
      contents: [{
        uri: WIDGET_URI,
        mimeType: MIME,
        text: assets().widget,
        _meta: {
          ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: RESOURCE_DOMAINS } },
          'openai/widgetDescription': 'Shows the rendered deck, website or interactive page. The user can navigate, go fullscreen and open the shareable link.',
          'openai/widgetPrefersBorder': false,
          'openai/widgetCSP': { connect_domains: [], resource_domains: RESOURCE_DOMAINS, redirect_domains: [baseUrl] }
        }
      }]
    })
  );

  server.registerTool(
    'mythos_design_brief',
    {
      title: 'Design brief',
      description: 'Call this FIRST whenever the user wants slides, a presentation, a website, a landing page or an interactive page. Returns the Mythos design method, recommended themes, narrative structures, the full layout/section catalog and the quality bar to follow before rendering.',
      inputSchema: {
        kind: z.enum(['slides', 'site', 'interactive']).describe('slides = deck/presentation/lesson; site = website/landing page; interactive = quiz, flashcards, simulation, game, dashboard or bespoke HTML'),
        topic: S.describe('What it is about'),
        audience: opt(S), goal: opt(S).describe('inform, persuade, teach, sell, report…'),
        tone: opt(S), language: opt(S).describe('Language of the content, e.g. pt-BR')
      },
      outputSchema: { recommendedThemes: z.array(S), structures: z.record(S, S) },
      annotations: READ_ONLY,
      _meta: { 'openai/toolInvocation/invoking': 'Planejando o design…', 'openai/toolInvocation/invoked': 'Brief pronto' }
    },
    async (args) => {
      const b = buildBrief(args);
      return { content: [{ type: 'text', text: b.text }], structuredContent: { recommendedThemes: b.themes, structures: b.structures } };
    }
  );

  server.registerTool(
    'mythos_render_slides',
    {
      title: 'Render slide deck',
      description: 'Render a presentation (16:9 deck) inside the chat: animated layouts, charts, stats, timelines, flip cards, quizzes, speaker notes, overview grid and fullscreen. Returns a shareable link with HTML download and PDF print. Call mythos_design_brief first. Send the complete deck every time (stateless).',
      inputSchema: {
        title: S.describe('Deck title'),
        theme: opt(Theme),
        lang: opt(S).describe('BCP-47 language of the content, default pt-BR'),
        footer: opt(z.union([S, z.boolean()])).describe('Footer text on content slides, or false to hide'),
        slides: z.array(Slide).min(1).describe('Ordered slides')
      },
      outputSchema: Output,
      annotations: READ_ONLY,
      _meta: UI_META('Desenhando os slides…', 'Slides prontos')
    },
    async (args) => {
      const payload = { v: 1, kind: 'slides', title: args.title, theme: args.theme || 'aurora', lang: args.lang || 'pt-BR', footer: args.footer, slides: args.slides };
      return result({ payload, warnings: lintSlides(args.slides), count: args.slides.length, baseUrl, label: 'slide deck' });
    }
  );

  server.registerTool(
    'mythos_render_site',
    {
      title: 'Render website',
      description: 'Render a responsive website or landing page inside the chat: sticky nav, hero, features, split sections, animated stats, testimonials, pricing, FAQ, timeline, gallery, team, charts, contact form and CTA, with scroll animations. Returns a shareable link with HTML download. Call mythos_design_brief first. Send the complete site every time (stateless).',
      inputSchema: {
        title: S.describe('Site/page title (also the default brand)'),
        theme: opt(Theme),
        lang: opt(S),
        brand: opt(S),
        nav: opt(z.union([z.literal(false), z.object({ brand: opt(S), icon: opt(S), links: opt(z.array(z.union([S, z.object({ label: S, url: opt(S) })]))), cta: opt(Cta) }).passthrough()])),
        sections: z.array(Section).min(1).describe('Ordered page sections')
      },
      outputSchema: Output,
      annotations: READ_ONLY,
      _meta: UI_META('Construindo o site…', 'Site pronto')
    },
    async (args) => {
      const payload = { v: 1, kind: 'site', title: args.title, theme: args.theme || 'aurora', lang: args.lang || 'pt-BR', brand: args.brand, nav: args.nav, sections: args.sections };
      return result({ payload, warnings: lintSite(args.sections), count: args.sections.length, baseUrl, label: 'website' });
    }
  );

  server.registerTool(
    'mythos_render_html',
    {
      title: 'Render custom HTML',
      description: 'Render a complete, self-contained HTML document inside the chat: interactive lessons, scored quizzes, simulations, games, calculators, data dashboards, bespoke slide decks or fully custom websites. Use when the structured slide/site tools cannot express the design or interactivity. Inline CSS/JS; libraries only from cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com or esm.sh. Returns a shareable link. Call mythos_design_brief (kind "interactive") first.',
      inputSchema: {
        title: S,
        html: S.describe('Full HTML document (<!doctype html> … </html>)'),
        purpose: opt(z.enum(['interactive', 'slides', 'site', 'game', 'dashboard', 'other'])),
        lang: opt(S)
      },
      outputSchema: Output,
      annotations: READ_ONLY,
      _meta: UI_META('Montando a experiência…', 'Pronto')
    },
    async (args) => {
      const html = wrapHtml(args.html, args.title, args.lang);
      const payload = { v: 1, kind: 'html', title: args.title, lang: args.lang || 'pt-BR', purpose: args.purpose || 'other', html };
      return result({ payload, warnings: lintHtml(args.html), count: Math.max(1, Math.round(html.length / 1024)), baseUrl, label: 'HTML experience' });
    }
  );

  return server;
}
