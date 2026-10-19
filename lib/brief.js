// Brief de design: o método que o modelo segue antes de renderizar.
import { THEMES, SLIDE_LAYOUTS, SITE_SECTIONS, VISUALS, ICON_NAMES, RESOURCE_DOMAINS } from './catalog.js';

const THEME_HINTS = [
  [/\b(ai|ia|tech|software|startup|saas|cloud|dados?|data|cyber|digital|futur)/i, ['aurora', 'oceano', 'neon']],
  [/\b(aula|class|lesson|curso|course|escola|school|universi|pesquisa|research|tese|thesis|acad|enem|enade|professor)/i, ['academia', 'editorial', 'minimal']],
  [/\b(literatura|poesia|poem|livro|book|hist[oó]ria|history|cultura|culture|arte|art|ensaio|essay|jornal)/i, ['editorial', 'terra', 'noir']],
  [/\b(finan|invest|relat[oó]rio|report|quarter|trimestr|vendas|sales|b2b|corporat|empresa|board|kpi)/i, ['corporate', 'minimal', 'oceano']],
  [/\b(sa[uú]de|health|ci[eê]ncia|science|clima|climate|engenharia|engineering|medic)/i, ['oceano', 'minimal', 'academia']],
  [/\b(sustent|eco|natureza|nature|bem-estar|wellness|yoga|arquitetura|architecture|food|comida|caf[eé])/i, ['terra', 'solar', 'editorial']],
  [/\b(evento|event|festa|party|marketing|lan[cç]amento|launch|promo|kids|crian[cç]a)/i, ['solar', 'neon', 'aurora']],
  [/\b(game|jogo|m[uú]sica|music|creator|criador|streetwear|moda|fashion|cinema|film)/i, ['neon', 'noir', 'aurora']],
  [/\b(pitch|investidor|investor|manifesto|impact|impacto|luxo|luxury)/i, ['noir', 'aurora', 'minimal']]
];

export function recommendThemes(text) {
  const scores = {};
  for (const [re, list] of THEME_HINTS) {
    if (re.test(text)) list.forEach((t, i) => { scores[t] = (scores[t] || 0) + (3 - i); });
  }
  const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  return (ranked.length ? ranked : ['aurora', 'minimal', 'editorial']).slice(0, 3);
}

const STRUCTURES = {
  slides: {
    pitch: 'title → statement (the problem in one line) → stats (size of the pain) → bullets/image (solution) → steps (how it works) → chart (traction) → comparison (vs alternatives) → cards (business model) → timeline (roadmap) → cards (team) → closing (the ask)',
    aula: 'title → agenda → section → bullets (concept, reveal:true) → image/quote (example) → cards flip:true (key terms) → steps (method) → chart/table (evidence) → quiz (check understanding) ×2 → statement (big idea) → closing (summary + task)',
    relatorio: 'title → statement (headline result) → stats (KPIs) → chart (trend) → chart (breakdown) → table (detail) → comparison (plan vs actual) → bullets (risks) → steps (next actions) → closing',
    palestra: 'title → quote/statement (hook) → section → story slides (image + short text) → stats → chart → cards → statement (turning point) → steps (what to do) → closing',
    treinamento: 'title → agenda → section → steps → code/table → cards flip:true → quiz → bullets (checklist) → closing'
  },
  site: {
    produto: 'hero (promise + CTA) → logos → features → split (how it works, with chart or image) → stats → testimonials → pricing → faq → cta → footer',
    curso: 'hero → stats → split (who it is for) → steps (curriculum/modules) → team (instructor) → testimonials → pricing → faq → cta',
    evento: 'hero (date/place in subtitle) → stats → timeline (agenda) → team (speakers) → gallery → faq → contact → footer',
    portfolio: 'hero (variant split) → gallery → split (about) → timeline (career) → testimonials → contact',
    institucional: 'hero → split (mission) → features (services) → stats → team → testimonials → contact → footer'
  },
  interactive: {
    quiz: 'Use mythos_render_slides with quiz slides interleaved with content, or mythos_render_html for scored quizzes with timer, progress and final score.',
    flashcards: 'Use mythos_render_slides with layout "cards" and flip:true (front = term, back = definition).',
    simulacao: 'Use mythos_render_html: one self-contained file with sliders/inputs that recompute a chart or result live (canvas or inline SVG).',
    jogo: 'Use mythos_render_html: canvas game loop with requestAnimationFrame, keyboard + touch controls, score, restart.',
    dashboard: 'Use mythos_render_site with stats + chart sections, or mythos_render_html with filters that update inline SVG charts.'
  }
};

export function buildBrief({ kind, topic, audience, goal, tone, language }) {
  const ctx = [topic, audience, goal, tone].filter(Boolean).join(' ');
  const themes = recommendThemes(ctx);
  const lang = language || 'match the user';
  const k = kind === 'site' ? 'site' : kind === 'interactive' || kind === 'html' ? 'interactive' : 'slides';
  const L = [];
  L.push(`# Mythos design brief: ${kind}`);
  L.push(`Topic: ${topic || '(not given)'} · Audience: ${audience || '(infer and state it)'} · Goal: ${goal || '(infer: inform, persuade, teach or sell)'} · Language: ${lang}`);
  L.push('');
  L.push('## Method (do every step, silently, before rendering)');
  L.push('1. **Intent.** Write the one sentence the audience must remember (the "big idea"). Every slide/section must serve it.');
  L.push('2. **Narrative.** Pick a structure below and adapt it. Situation → complication → resolution; or problem → solution → proof → action.');
  L.push('3. **Script.** Draft the real content: specific facts, numbers, examples, names. No placeholders like "Lorem ipsum", "Your text here" or "[insert]". If a fact is unknown, phrase it as a question to the user or mark it clearly as an example.');
  L.push('4. **Design.** Choose one theme and keep it. Vary layouts (never 3 identical in a row). Numbers become stats or charts; sequences become steps or timelines; contrasts become comparison; definitions become flip cards.');
  L.push('5. **Copy discipline.** Titles are assertions (≤ 10 words), not topics. Max 6 bullets, ≤ 15 words each. One idea per slide. Detail goes into speaker notes.');
  L.push('6. **Render** with the matching tool, then read the returned warnings. If there are warnings, fix them and render again before answering.');
  L.push('7. **Deliver.** Share the shareable link (viewUrl), summarize the structure in 2-3 lines and offer concrete refinements (tone, length, theme, extra slides, export).');
  L.push('');
  L.push(`## Recommended themes for this topic: ${themes.map((t) => `**${t}**`).join(', ')}`);
  for (const [name, desc] of Object.entries(THEMES)) L.push(`- ${name}: ${desc}`);
  L.push('Custom brand: theme: {"base":"minimal","accent":"#E4572E","accent2":"#2E86AB","headingFont":"Poppins","bodyFont":"Inter"} (hex colors, Google Fonts names).');
  L.push('');
  L.push('## Structures');
  for (const [name, seq] of Object.entries(STRUCTURES[k])) L.push(`- **${name}**: ${seq}`);
  L.push('');
  if (k === 'slides' || k === 'interactive') {
    L.push('## Slide layouts (field "layout")');
    for (const [name, desc] of Object.entries(SLIDE_LAYOUTS)) L.push(`- **${name}**: ${desc}`);
    L.push('Every slide accepts: notes (speaker notes), background ("gradient" | "accent" | "surface" | hex color | https image URL), visual (generative art: ' + VISUALS.join(', ') + ').');
    L.push('');
  }
  if (k === 'site' || k === 'interactive') {
    L.push('## Site sections (field "type")');
    for (const [name, desc] of Object.entries(SITE_SECTIONS)) L.push(`- **${name}**: ${desc}`);
    L.push('Any section can set navLabel to appear in the top menu, and id for anchors. nav: {brand, icon, links:[{label,url:"#id"}], cta}.');
    L.push('');
  }
  L.push('## Text formatting inside any string');
  L.push('**bold**, *italic*, ==highlight==, `code`, [link](https://...), and {gradient words} in titles.');
  L.push('');
  L.push(`## Icons (field "icon")\n${ICON_NAMES.join(', ')} — or a single emoji.`);
  L.push('');
  L.push('## Images');
  L.push('- Never invent photo URLs: they break. Use images only when the user supplied the URL, or use the built-in generative "visual" art, icons, charts and gradients, which always render.');
  L.push('- Generic placeholder photos: https://picsum.photos/seed/<word>/1200/800 (random but valid).');
  L.push(`- Hosts that load inside ChatGPT: ${RESOURCE_DOMAINS.join(', ')}. Others only load in the shareable link.`);
  L.push('');
  if (k === 'interactive') {
    L.push('## Rules for mythos_render_html');
    L.push('- One complete, self-contained HTML document: inline <style> and <script>; libraries only from cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com or esm.sh.');
    L.push('- Responsive (works at 360px and in fullscreen), keyboard accessible, visible focus, color contrast ≥ 4.5:1, prefers-reduced-motion respected.');
    L.push('- No network requests (embed data inline). No alert/prompt/confirm. Wrap localStorage in try/catch.');
    L.push('- Polish: CSS variables for a palette, a real typographic scale, transitions of 150-300 ms, empty/loading/end states, a restart button for games and quizzes.');
    L.push('- For a deck with custom interactivity, implement slide navigation (arrows, click, swipe), progress bar and slide counter.');
    L.push('');
  }
  L.push('## Quality bar');
  L.push('Before calling the render tool, check: big idea present · narrative arc · no placeholders · varied layouts · numbers visualized · consistent theme · notes on content slides · clear call to action.');
  return { text: L.join('\n'), themes, structures: STRUCTURES[k] };
}
