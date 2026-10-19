// Crítico de qualidade: devolve avisos objetivos para o modelo corrigir e renderizar de novo.
import { SLIDE_LAYOUT_NAMES, SITE_SECTION_NAMES, RESOURCE_DOMAINS } from './catalog.js';

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const textOf = (b) => (b && typeof b === 'object' ? b.text || b.title || '' : b);

function originOf(url) {
  try { return new URL(url).origin; } catch { return null; }
}

function checkImage(url, where, out) {
  if (!url) return;
  if (!/^https:\/\//i.test(url) && !/^data:image\//i.test(url)) {
    out.push(`${where}: image must be an https URL (ignored: "${String(url).slice(0, 60)}").`);
    return;
  }
  const o = originOf(url);
  if (o && /^https/.test(o) && !RESOURCE_DOMAINS.includes(o)) {
    out.push(`${where}: image host ${o} is outside the widget allowlist, so it is blocked inside ChatGPT (it still shows in the shareable link). Prefer an allowed host or a generative "visual".`);
  }
}

function checkChart(ch, where, out) {
  if (!ch) return;
  const series = ch.series || (ch.data ? [{ values: ch.data.map((d) => d.value) }] : ch.values ? [{ values: ch.values }] : []);
  if (!series.length) out.push(`${where}: chart has no data.`);
  const n = ch.labels ? ch.labels.length : ch.data ? ch.data.length : null;
  series.forEach((s, i) => {
    if (n != null && s.values && s.values.length !== n) out.push(`${where}: chart series ${i + 1} has ${s.values.length} values but there are ${n} labels.`);
  });
}

export function lintSlides(slides) {
  const out = [];
  if (!Array.isArray(slides) || slides.length === 0) return ['No slides were provided.'];
  if (slides.length < 3) out.push(`Only ${slides.length} slide(s): a complete deck usually needs a title, 3+ content slides and a closing.`);
  if (slides.length > 40) out.push(`${slides.length} slides is long; consider splitting or moving detail into speaker notes.`);
  const first = String(slides[0]?.layout || 'title');
  if (!['title', 'cover'].includes(first)) out.push('Slide 1 is not a "title" layout; decks open stronger with a title slide.');
  let run = 1;
  let withNotes = 0;
  slides.forEach((s, i) => {
    const n = `Slide ${i + 1}`;
    const lay = String(s?.layout || (i === 0 ? 'title' : 'bullets')).toLowerCase();
    if (!SLIDE_LAYOUT_NAMES.includes(lay) && !['cover', 'two-column', 'compare', 'process', 'grid', 'flashcards', 'end', 'big', 'text', 'content'].includes(lay)) out.push(`${n}: unknown layout "${lay}", rendered as "bullets".`);
    if (s?.notes) withNotes += 1;
    if (i > 0 && String(slides[i - 1]?.layout) === String(s?.layout)) run += 1; else run = 1;
    if (run === 3) out.push(`${n}: third "${lay}" slide in a row; vary layouts (stats, chart, cards, quote, statement) to keep rhythm.`);
    const title = s?.title || s?.question || '';
    if (!title && !['quote', 'statement'].includes(lay)) out.push(`${n}: missing title.`);
    if (words(title) > 14) out.push(`${n}: title has ${words(title)} words; aim for ≤ 10 (an assertion, not a topic).`);
    const bullets = Array.isArray(s?.bullets) ? s.bullets : [];
    if (bullets.length > 6) out.push(`${n}: ${bullets.length} bullets; max 6. Split the slide or use "cards"/"steps".`);
    bullets.forEach((b, k) => { if (words(textOf(b)) > 22) out.push(`${n}: bullet ${k + 1} has ${words(textOf(b))} words; keep bullets ≤ 15 words and move detail to notes.`); });
    if (words(s?.text) > 60) out.push(`${n}: paragraph has ${words(s.text)} words; slides are not documents. Keep ≤ 40 words.`);
    if (lay === 'quiz') {
      const opts = Array.isArray(s?.options) ? s.options : [];
      if (opts.length < 2) out.push(`${n}: quiz needs at least 2 options.`);
      if (!(Number.isInteger(s?.answer) && s.answer >= 0 && s.answer < opts.length)) out.push(`${n}: quiz "answer" must be the 0-based index of the correct option.`);
    }
    if (lay === 'chart' && !s?.chart) out.push(`${n}: chart layout without "chart" data.`);
    checkChart(s?.chart, n, out);
    checkImage(s?.image, n, out);
    if (typeof s?.background === 'string' && /^https?:/i.test(s.background)) checkImage(s.background, `${n} background`, out);
    if (lay === 'stats' && (!Array.isArray(s?.stats) || !s.stats.length)) out.push(`${n}: stats layout without "stats".`);
  });
  if (slides.length >= 5 && withNotes === 0) out.push('No speaker notes: add "notes" to content slides with what the presenter should say.');
  return out;
}

export function lintSite(sections) {
  const out = [];
  if (!Array.isArray(sections) || sections.length === 0) return ['No sections were provided.'];
  const types = sections.map((s) => String(s?.type || 'text').toLowerCase());
  if (types[0] !== 'hero') out.push('The first section is not a "hero"; landing pages convert better with a hero that states the promise.');
  if (sections.length < 4) out.push(`Only ${sections.length} sections; a complete page usually has hero, value (features/split), proof (stats/testimonials) and a CTA.`);
  if (!types.some((t) => ['cta', 'contact', 'pricing'].includes(t)) && !sections[0]?.primaryCta) out.push('No call to action: add a "cta", "contact" or "pricing" section.');
  sections.forEach((s, i) => {
    const n = `Section ${i + 1} (${types[i]})`;
    if (!SITE_SECTION_NAMES.includes(types[i]) && !['process', 'about', 'content', 'form', 'newsletter'].includes(types[i])) out.push(`${n}: unknown type, rendered as "text".`);
    const items = s?.items || s?.plans || s?.stats || s?.images;
    if (Array.isArray(items) && items.length > 8 && types[i] !== 'faq' && types[i] !== 'logos') out.push(`${n}: ${items.length} items; keep 3-6 for scannability.`);
    if (types[i] === 'hero' && words(s?.title) > 14) out.push(`${n}: hero title has ${words(s.title)} words; aim for ≤ 10.`);
    checkImage(s?.image, n, out);
    (s?.images || []).forEach((g, k) => checkImage(typeof g === 'string' ? g : g?.image, `${n} image ${k + 1}`, out));
    checkChart(s?.chart, n, out);
  });
  return out;
}

export function lintHtml(html) {
  const out = [];
  const h = String(html || '');
  if (h.length < 200) out.push('HTML is very short; send a complete, self-contained document.');
  if (h.length > 400000) out.push(`HTML is ${Math.round(h.length / 1024)} KB; very large documents make the shareable link long. Trim inline data.`);
  if (!/<meta[^>]+viewport/i.test(h)) out.push('Missing <meta name="viewport">; it was added automatically.');
  if (/\balert\(|\bprompt\(|\bconfirm\(/.test(h)) out.push('alert/prompt/confirm are blocked inside the ChatGPT sandbox; use in-page UI instead.');
  const srcs = [...h.matchAll(/<(?:script|link|img)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
  const blocked = [...new Set(srcs.map(originOf).filter((o) => o && !RESOURCE_DOMAINS.includes(o)))];
  if (blocked.length) out.push(`External hosts outside the widget allowlist (blocked inside ChatGPT, fine in the shareable link): ${blocked.join(', ')}.`);
  if (/fetch\(|XMLHttpRequest/.test(h)) out.push('Network requests are blocked inside the widget (no connect domains). Embed data inline.');
  return out;
}

export function wrapHtml(html, title, lang) {
  let h = String(html || '').trim();
  if (!/<html[\s>]/i.test(h)) {
    h = `<!doctype html>\n<html lang="${lang || 'pt-BR'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${String(title || 'Mythos').replace(/[<>&]/g, '')}</title></head><body>\n${h}\n</body></html>`;
  } else if (!/<meta[^>]+viewport/i.test(h)) {
    h = h.replace(/<head([^>]*)>/i, '<head$1><meta name="viewport" content="width=device-width,initial-scale=1">');
  }
  if (!/^<!doctype/i.test(h)) h = '<!doctype html>\n' + h;
  return h;
}
