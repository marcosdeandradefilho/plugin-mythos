/*!
 * Plugin Mythos — motor de renderização (slides, sites, HTML interativo)
 * Roda em três lugares com o mesmo código: dentro do widget do ChatGPT (MCP Apps),
 * na página /view (link compartilhável) e no HTML autocontido exportado.
 * Sem dependências. Licença MIT.
 */
(function (global) {
  'use strict';

  var VERSION = '1.0.0';

  /* ------------------------------------------------------------------ *
   * Temas
   * ------------------------------------------------------------------ */
  var THEMES = {
    aurora:    { dark: true,  bg: '#0b0b14', surface: '#151527', text: '#f4f4ff', muted: '#a3a3c2', accent: '#8b5cf6', accent2: '#22d3ee', head: ['Sora', '400;600;700;800'], body: ['Inter', '400;500;600;700'] },
    editorial: { dark: false, bg: '#faf7f2', surface: '#ffffff', text: '#1c1917', muted: '#6b635b', accent: '#b4532a', accent2: '#1f3a5f', head: ['Fraunces', '400;600;800'], body: ['DM Sans', '400;500;700'] },
    noir:      { dark: true,  bg: '#0a0a0a', surface: '#161616', text: '#fafafa', muted: '#a1a1a1', accent: '#ff3d2e', accent2: '#ffd60a', head: ['Bricolage Grotesque', '400;600;800'], body: ['Inter', '400;500;600;700'] },
    minimal:   { dark: false, bg: '#ffffff', surface: '#f5f5f4', text: '#111111', muted: '#6b7280', accent: '#111111', accent2: '#2563eb', head: ['Inter', '400;500;600;700;800'], body: ['Inter', '400;500;600;700'] },
    oceano:    { dark: true,  bg: '#04111f', surface: '#0b2238', text: '#e6f1ff', muted: '#8fb3d9', accent: '#38bdf8', accent2: '#34d399', head: ['Space Grotesk', '400;500;700'], body: ['Manrope', '400;500;700'] },
    solar:     { dark: false, bg: '#fff8eb', surface: '#ffffff', text: '#2a1a05', muted: '#7c6448', accent: '#f97316', accent2: '#e11d48', head: ['Outfit', '400;600;800'], body: ['Outfit', '400;500;600'] },
    terra:     { dark: false, bg: '#f3efe6', surface: '#fffdf8', text: '#2b2a24', muted: '#6f6a5c', accent: '#4d7c0f', accent2: '#a16207', head: ['Instrument Serif', '400'], body: ['Manrope', '400;500;700'] },
    neon:      { dark: true,  bg: '#07010f', surface: '#120a24', text: '#f5f3ff', muted: '#b4a6d8', accent: '#f0abfc', accent2: '#22d3ee', head: ['Space Grotesk', '400;500;700'], body: ['Inter', '400;500;600;700'] },
    academia:  { dark: false, bg: '#f7f7fb', surface: '#ffffff', text: '#1e1b4b', muted: '#57577a', accent: '#4338ca', accent2: '#0f766e', head: ['Playfair Display', '500;700;800'], body: ['Source Sans 3', '400;600;700'] },
    corporate: { dark: false, bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', accent: '#2563eb', accent2: '#0ea5e9', head: ['Manrope', '500;700;800'], body: ['Inter', '400;500;600;700'] }
  };

  var I18N = {
    pt: { prev: 'Anterior', next: 'Próximo', overview: 'Visão geral', notes: 'Notas do apresentador', fullscreen: 'Tela cheia', of: 'de', correct: 'Correto!', wrong: 'Não é essa.', answer: 'Resposta', send: 'Enviar', sent: 'Formulário de demonstração: conecte um endereço de envio (campo "action") para receber mensagens.', menu: 'Menu', flip: 'Clique para virar', noNotes: 'Sem notas para este slide.' },
    en: { prev: 'Previous', next: 'Next', overview: 'Overview', notes: 'Speaker notes', fullscreen: 'Fullscreen', of: 'of', correct: 'Correct!', wrong: 'Not quite.', answer: 'Answer', send: 'Send', sent: 'Demo form: set an "action" URL to receive messages.', menu: 'Menu', flip: 'Click to flip', noNotes: 'No notes for this slide.' },
    es: { prev: 'Anterior', next: 'Siguiente', overview: 'Vista general', notes: 'Notas del presentador', fullscreen: 'Pantalla completa', of: 'de', correct: '¡Correcto!', wrong: 'No es esa.', answer: 'Respuesta', send: 'Enviar', sent: 'Formulario de demostración: define una URL "action" para recibir mensajes.', menu: 'Menú', flip: 'Haz clic para girar', noNotes: 'Sin notas para esta diapositiva.' }
  };
  function t(lang) { var k = String(lang || 'pt').slice(0, 2).toLowerCase(); return I18N[k] || I18N.pt; }

  /* ------------------------------------------------------------------ *
   * Utilitários
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Markdown mínimo em linha, aplicado sobre texto já escapado.
  function md(s) {
    var h = esc(s);
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    h = h.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    h = h.replace(/\n/g, '<br>');
    return h;
  }
  function safeUrl(u) {
    if (typeof u !== 'string') return '';
    u = u.trim();
    if (/^https:\/\//i.test(u) || /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(u)) return u;
    return '';
  }
  function isColor(c) { return typeof c === 'string' && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\()/i.test(c.trim()); }
  function arr(a) { return Array.isArray(a) ? a : (a == null || a === '' ? [] : [a]); }
  function hash(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function slug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secao'; }
  function fmtNum(v, lang) { try { return new Intl.NumberFormat(lang || 'pt-BR', { maximumFractionDigits: 2 }).format(v); } catch (e) { return String(v); } }
  var uid = 0;
  function nid(p) { uid += 1; return (p || 'm') + uid; }

  function hexToRgb(hex) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function onColor(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return '#ffffff';
    var l = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    var lum = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    return lum > 0.45 ? '#0b0b0f' : '#ffffff';
  }

  function resolveTheme(input) {
    var base = THEMES.aurora, over = {};
    if (typeof input === 'string') base = THEMES[input.toLowerCase().trim()] || THEMES.aurora;
    else if (input && typeof input === 'object') { over = input; base = THEMES[String(input.base || input.name || '').toLowerCase()] || THEMES.aurora; }
    var th = {};
    for (var k in base) th[k] = base[k];
    ['bg', 'surface', 'text', 'muted', 'accent', 'accent2'].forEach(function (key) { if (isColor(over[key])) th[key] = over[key].trim(); });
    if (typeof over.dark === 'boolean') th.dark = over.dark;
    if (typeof over.headingFont === 'string' && over.headingFont.trim()) th.head = [over.headingFont.trim(), ''];
    if (typeof over.bodyFont === 'string' && over.bodyFont.trim()) th.body = [over.bodyFont.trim(), ''];
    th.radius = typeof over.radius === 'number' ? over.radius : 18;
    return th;
  }

  function fontHref(th) {
    var fams = {}, out = [];
    [th.head, th.body, ['JetBrains Mono', '400;600']].forEach(function (f) {
      if (!f || fams[f[0]]) return;
      fams[f[0]] = 1;
      out.push('family=' + encodeURIComponent(f[0]).replace(/%20/g, '+') + (f[1] ? ':wght@' + f[1] : ''));
    });
    return 'https://fonts.googleapis.com/css2?' + out.join('&') + '&display=swap';
  }

  function themeVars(th) {
    return [
      '--m-bg:' + th.bg, '--m-surface:' + th.surface, '--m-text:' + th.text, '--m-muted:' + th.muted,
      '--m-accent:' + th.accent, '--m-accent2:' + th.accent2, '--m-on-accent:' + onColor(th.accent),
      '--m-head:"' + th.head[0] + '",ui-sans-serif,system-ui,sans-serif',
      '--m-body:"' + th.body[0] + '",ui-sans-serif,system-ui,sans-serif',
      '--m-radius:' + th.radius + 'px', 'color-scheme:' + (th.dark ? 'dark' : 'light')
    ].join(';');
  }

  /* ------------------------------------------------------------------ *
   * Ícones (traço, 24x24)
   * ------------------------------------------------------------------ */
  var ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    note: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>'
  };
  var ICON_ALIAS = { brain: 'lightbulb', idea: 'lightbulb', ideia: 'lightbulb', growth: 'trending', crescimento: 'trending', money: 'dollar', dinheiro: 'dollar', team: 'users', equipe: 'users', security: 'shield', seguranca: 'shield', speed: 'zap', rapido: 'zap', ai: 'sparkles', ia: 'sparkles', magic: 'sparkles', education: 'graduation', educacao: 'graduation', school: 'graduation', escola: 'graduation', data: 'chart', dados: 'chart', time: 'clock', tempo: 'clock', world: 'globe', mundo: 'globe', love: 'heart', location: 'pin', local: 'pin', email: 'mail', gear: 'settings', warning: 'alert', aviso: 'alert', goal: 'target', meta: 'target', objetivo: 'target', launch: 'rocket', lancamento: 'rocket', check: 'check', ok: 'check', livro: 'book', video: 'play', write: 'pen', escrever: 'pen', shop: 'cart', compra: 'cart', loja: 'cart', nature: 'leaf', natureza: 'leaf', sustentabilidade: 'leaf', foto: 'camera', photo: 'camera', tech: 'cpu', tecnologia: 'cpu', chat: 'message', conversa: 'message', award: 'trophy', premio: 'trophy', map: 'compass', direction: 'compass', cycle: 'refresh', ciclo: 'refresh', work: 'briefcase', trabalho: 'briefcase', view: 'eye', visao: 'eye', casa: 'home' };

  function icon(name, cls) {
    if (!name) return '';
    var key = String(name).toLowerCase().trim().normalize('NFD').replace(/\p{M}/gu, '');
    key = ICON_ALIAS[key] || key;
    if (ICONS[key]) return '<svg class="' + (cls || 'm-ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[key] + '</svg>';
    if (String(name).length <= 4) return '<span class="' + (cls || 'm-ico') + ' m-emoji" aria-hidden="true">' + esc(name) + '</span>';
    return '<svg class="' + (cls || 'm-ico') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.sparkles + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Arte generativa (fundos decorativos determinísticos)
   * ------------------------------------------------------------------ */
  function genArt(seed, variant) {
    var r = rng(hash(seed || 'mythos'));
    var id = nid('ga');
    var kinds = ['orbs', 'waves', 'grid', 'dots', 'rings'];
    var v = kinds.indexOf(variant) >= 0 ? variant : kinds[Math.floor(r() * kinds.length)];
    var s = '<svg class="m-art-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
    s += '<defs><filter id="' + id + 'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>';
    s += '<radialGradient id="' + id + 'r"><stop offset="0" stop-color="var(--m-accent)" stop-opacity=".9"/><stop offset="1" stop-color="var(--m-accent)" stop-opacity="0"/></radialGradient>';
    s += '<linearGradient id="' + id + 'l" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="var(--m-accent)"/><stop offset="1" stop-color="var(--m-accent2)"/></linearGradient></defs>';
    var i;
    if (v === 'orbs') {
      s += '<g filter="url(#' + id + 'b)" opacity=".75">';
      for (i = 0; i < 5; i++) s += '<circle cx="' + Math.round(r() * 1280) + '" cy="' + Math.round(r() * 720) + '" r="' + Math.round(120 + r() * 220) + '" fill="' + (i % 2 ? 'var(--m-accent2)' : 'var(--m-accent)') + '" opacity="' + (0.35 + r() * 0.45).toFixed(2) + '"/>';
      s += '</g>';
    } else if (v === 'waves') {
      for (i = 0; i < 6; i++) {
        var y0 = 380 + i * 48, amp = 30 + r() * 60, ph = r() * 6.28, d = 'M0 ' + y0;
        for (var x = 0; x <= 1280; x += 40) d += ' L' + x + ' ' + (y0 + Math.sin(x / 180 + ph) * amp).toFixed(1);
        d += ' L1280 720 L0 720Z';
        s += '<path d="' + d + '" fill="url(#' + id + 'l)" opacity="' + (0.10 + i * 0.06).toFixed(2) + '"/>';
      }
    } else if (v === 'grid') {
      s += '<g stroke="var(--m-accent)" stroke-opacity=".22" stroke-width="1">';
      for (i = 0; i <= 24; i++) s += '<line x1="' + (640 + (i - 12) * 40) + '" y1="380" x2="' + (640 + (i - 12) * 160) + '" y2="720"/>';
      for (i = 0; i < 9; i++) { var yy = 380 + Math.pow(i / 8, 1.8) * 340; s += '<line x1="0" x2="1280" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>'; }
      s += '</g><circle cx="640" cy="360" r="260" fill="url(#' + id + 'r)" opacity=".55"/>';
    } else if (v === 'dots') {
      s += '<g fill="var(--m-accent)">';
      for (var gx = 0; gx < 32; gx++) for (var gy = 0; gy < 18; gy++) {
        var dx = gx - 24, dy = gy - 6, dist = Math.sqrt(dx * dx + dy * dy);
        var op = Math.max(0, 0.65 - dist / 18);
        if (op > 0.03) s += '<circle cx="' + (gx * 40 + 20) + '" cy="' + (gy * 40 + 20) + '" r="' + (2 + op * 4).toFixed(1) + '" opacity="' + op.toFixed(2) + '"/>';
      }
      s += '</g>';
    } else {
      s += '<g fill="none" stroke="url(#' + id + 'l)">';
      var cx = 900 + r() * 200, cy = 200 + r() * 300;
      for (i = 1; i <= 9; i++) s += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + (i * 46) + '" stroke-width="' + (1 + (9 - i) * 0.25).toFixed(2) + '" opacity="' + (0.85 - i * 0.08).toFixed(2) + '"/>';
      s += '</g>';
    }
    return s + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * Gráficos SVG
   * ------------------------------------------------------------------ */
  var PALETTE = ['var(--m-accent)', 'var(--m-accent2)', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];

  function normChart(c) {
    if (!c || typeof c !== 'object') return null;
    var labels = c.labels, series = c.series;
    if (!series && Array.isArray(c.data)) {
      labels = c.data.map(function (d) { return d.label; });
      series = [{ name: c.name || '', values: c.data.map(function (d) { return d.value; }) }];
    }
    if (!series && Array.isArray(c.values)) series = [{ name: c.name || '', values: c.values }];
    series = arr(series).map(function (s, i) {
      return { name: String(s && s.name != null ? s.name : ''), values: arr(s && (s.values || s.data)).map(function (v) { return Number(v) || 0; }), color: isColor(s && s.color) ? s.color : PALETTE[i % PALETTE.length] };
    });
    labels = arr(labels).map(String);
    if (!labels.length && series[0]) labels = series[0].values.map(function (_, i) { return String(i + 1); });
    return { type: String(c.type || 'bar').toLowerCase(), labels: labels, series: series, prefix: c.prefix || '', suffix: c.suffix || c.unit || '', stacked: !!c.stacked, max: Number(c.max) || 0, center: c.centerLabel || c.center || '' };
  }
  function niceMax(v) { if (!(v > 0)) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
  function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function legend(c, lang, withValues) {
    if (c.series.length < 2 && !withValues) return '';
    var items;
    if (withValues) {
      var vals = c.series[0].values, tot = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
      items = c.labels.map(function (l, i) { return '<span class="m-lg"><i style="background:' + PALETTE[i % PALETTE.length] + '"></i>' + esc(l) + ' <b>' + esc(c.prefix + fmtNum(vals[i] || 0, lang) + c.suffix) + '</b> <small>' + Math.round((vals[i] || 0) / tot * 100) + '%</small></span>'; });
    } else {
      items = c.series.map(function (s) { return '<span class="m-lg"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; });
    }
    return '<div class="m-legend">' + items.join('') + '</div>';
  }

  function chartSvg(raw, lang) {
    var c = normChart(raw);
    if (!c || !c.series.length) return '<div class="m-chart-empty">—</div>';
    var fmt = function (v) { return c.prefix + fmtNum(v, lang) + c.suffix; };
    var W = 800, H = 420, s = '', i, j;
    if (c.type === 'pie' || c.type === 'donut' || c.type === 'doughnut') {
      var vals = c.series[0].values, tot = vals.reduce(function (a, b) { return a + b; }, 0) || 1, acc = 0;
      var donut = c.type !== 'pie', R = donut ? 150 : 80, SW = donut ? 64 : 160;
      s += '<svg class="m-chart-svg" viewBox="0 0 400 400" role="img"><g transform="rotate(-90 200 200)">';
      for (i = 0; i < vals.length; i++) {
        var pct = vals[i] / tot * 100;
        s += '<circle class="m-arc" cx="200" cy="200" r="' + R + '" fill="none" stroke="' + PALETTE[i % PALETTE.length] + '" stroke-width="' + SW + '" pathLength="100" stroke-dasharray="' + Math.max(pct - (donut ? 0.6 : 0), 0).toFixed(2) + ' ' + (100 - pct + (donut ? 0.6 : 0)).toFixed(2) + '" stroke-dashoffset="' + (-acc).toFixed(2) + '" style="--d:' + i + '"/>';
        acc += pct;
      }
      s += '</g>';
      if (donut) s += '<text x="200" y="196" text-anchor="middle" class="m-donut-v">' + esc(c.center || fmt(tot)) + '</text><text x="200" y="228" text-anchor="middle" class="m-axis">' + esc(c.series[0].name || '') + '</text>';
      s += '</svg>';
      return '<figure class="m-chart m-chart-round">' + s + legend(c, lang, true) + '</figure>';
    }
    if (c.type === 'hbar' || c.type === 'horizontal') {
      var n = c.labels.length, rowH = Math.min(56, 360 / Math.max(n, 1)), Lh = 200, mx = c.max || niceMax(Math.max.apply(null, c.series[0].values.concat([0])));
      H = n * rowH + 20;
      s += '<svg class="m-chart-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img">';
      for (i = 0; i < n; i++) {
        var v = c.series[0].values[i] || 0, bw = (W - Lh - 110) * v / mx, y = 10 + i * rowH;
        s += '<text x="' + (Lh - 14) + '" y="' + (y + rowH / 2 + 6) + '" text-anchor="end" class="m-axis m-axis-strong">' + esc(trunc(c.labels[i], 24)) + '</text>';
        s += '<rect x="' + Lh + '" y="' + (y + rowH * 0.18) + '" width="' + (W - Lh - 110) + '" height="' + (rowH * 0.64) + '" rx="6" class="m-track"/>';
        s += '<rect class="m-hbar" x="' + Lh + '" y="' + (y + rowH * 0.18) + '" width="' + Math.max(bw, 2).toFixed(1) + '" height="' + (rowH * 0.64) + '" rx="6" fill="' + c.series[0].color + '" style="--d:' + i + '"/>';
        s += '<text x="' + (Lh + bw + 10).toFixed(1) + '" y="' + (y + rowH / 2 + 6) + '" class="m-val">' + esc(fmt(v)) + '</text>';
      }
      return '<figure class="m-chart">' + s + '</svg></figure>';
    }
    var L = 70, R2 = 20, T = 24, B = 56, pw = W - L - R2, ph = H - T - B, nL = Math.max(c.labels.length, 1);
    var all = [];
    if (c.stacked) for (i = 0; i < nL; i++) all.push(c.series.reduce(function (a, se) { return a + (se.values[i] || 0); }, 0));
    else c.series.forEach(function (se) { all = all.concat(se.values); });
    var max = c.max || niceMax(Math.max.apply(null, all.concat([0])));
    s += '<svg class="m-chart-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img">';
    for (i = 0; i <= 4; i++) {
      var gy = T + ph - ph * i / 4;
      s += '<line x1="' + L + '" x2="' + (W - R2) + '" y1="' + gy + '" y2="' + gy + '" class="m-gridline"/><text x="' + (L - 10) + '" y="' + (gy + 5) + '" text-anchor="end" class="m-axis">' + esc(fmt(max * i / 4)) + '</text>';
    }
    var step = Math.ceil(nL / 12);
    if (c.type === 'line' || c.type === 'area') {
      c.series.forEach(function (se, k) {
        var pts = se.values.map(function (v, ix) { return [L + (nL === 1 ? pw / 2 : pw * ix / (nL - 1)), T + ph - ph * v / max]; });
        var d = pts.map(function (p, ix) { return (ix ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        if (c.type === 'area' || c.series.length === 1) s += '<path d="' + d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (T + ph) + ' L' + pts[0][0].toFixed(1) + ' ' + (T + ph) + 'Z" fill="' + se.color + '" opacity="' + (c.type === 'area' ? 0.22 : 0.10) + '" class="m-areafill"/>';
        s += '<path class="m-line" d="' + d + '" fill="none" stroke="' + se.color + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" style="--d:' + k + '"/>';
        pts.forEach(function (p, ix) {
          s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5" fill="var(--m-bg)" stroke="' + se.color + '" stroke-width="3" class="m-dot"/>';
          if (c.series.length === 1 && nL <= 10) s += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] - 14).toFixed(1) + '" text-anchor="middle" class="m-val">' + esc(fmt(se.values[ix])) + '</text>';
        });
      });
      for (i = 0; i < nL; i += step) s += '<text x="' + (L + (nL === 1 ? pw / 2 : pw * i / (nL - 1))).toFixed(1) + '" y="' + (T + ph + 28) + '" text-anchor="middle" class="m-axis">' + esc(trunc(c.labels[i], 12)) + '</text>';
    } else {
      var gw = pw / nL, sc = c.series.length;
      var bwid = c.stacked ? Math.min(gw * 0.58, 120) : Math.min(gw * 0.72 / sc, 90);
      for (i = 0; i < nL; i++) {
        var x0 = L + gw * i + (gw - (c.stacked ? bwid : bwid * sc)) / 2, base = T + ph;
        for (j = 0; j < sc; j++) {
          var val = c.series[j].values[i] || 0, bh = ph * Math.max(val, 0) / max;
          var bx = c.stacked ? x0 : x0 + j * bwid, by = base - bh;
          s += '<rect class="m-bar" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + Math.max(bwid - (c.stacked ? 0 : 4), 2).toFixed(1) + '" height="' + Math.max(bh, 0).toFixed(1) + '" rx="' + (c.stacked ? 2 : 6) + '" fill="' + c.series[j].color + '" style="--d:' + (i * sc + j) + '"/>';
          if (!c.stacked && sc <= 2 && nL <= 12) s += '<text x="' + (bx + (bwid - 4) / 2).toFixed(1) + '" y="' + (by - 8).toFixed(1) + '" text-anchor="middle" class="m-val">' + esc(fmt(val)) + '</text>';
          if (c.stacked) base = by;
        }
        if (i % step === 0) s += '<text x="' + (L + gw * i + gw / 2).toFixed(1) + '" y="' + (T + ph + 28) + '" text-anchor="middle" class="m-axis">' + esc(trunc(c.labels[i], 14)) + '</text>';
      }
    }
    return '<figure class="m-chart">' + s + '</svg>' + legend(c, lang, false) + '</figure>';
  }

  /* ------------------------------------------------------------------ *
   * Realce de código simples
   * ------------------------------------------------------------------ */
  function highlight(code, lang) {
    var hashComments = /^(py|python|bash|sh|shell|yaml|yml|r|ruby|rb|toml)$/i.test(lang || '');
    var re = new RegExp([
      '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/' + (hashComments ? '|#[^\\n]*' : '') + '|<!--[\\s\\S]*?-->)',
      '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`[^`]*`)',
      '\\b(const|let|var|function|return|if|else|elif|for|while|class|def|import|from|export|default|new|async|await|try|catch|except|finally|in|of|true|false|null|undefined|None|True|False|print|public|private|static|void|int|string|lambda|with|as|yield|interface|type|enum|match|case|select|where|insert|update|delete|create|table)\\b',
      '(\\b\\d+(?:\\.\\d+)?\\b)'
    ].join('|'), 'g');
    var out = '', last = 0, m;
    code = String(code || '');
    while ((m = re.exec(code))) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? 'm-c' : m[2] ? 'm-s' : m[3] ? 'm-k' : 'm-n';
      out += '<span class="' + cls + '">' + esc(m[0]) + '</span>';
      last = re.lastIndex;
      if (m[0] === '') re.lastIndex++;
    }
    return out + esc(code.slice(last));
  }

  /* ------------------------------------------------------------------ *
   * CSS do motor (injetado uma vez)
   * ------------------------------------------------------------------ */
  var CSS = [
    '.m-root{background:var(--m-bg);color:var(--m-text);font-family:var(--m-body);-webkit-font-smoothing:antialiased;line-height:1.5;box-sizing:border-box}',
    '.m-root *,.m-root *::before,.m-root *::after{box-sizing:border-box}',
    '.m-root h1,.m-root h2,.m-root h3,.m-root h4{font-family:var(--m-head);line-height:1.08;margin:0;letter-spacing:-.02em;font-weight:700}',
    '.m-root p{margin:0}',
    '.m-root a:not([class]){color:var(--m-accent)}',
    '.m-root code{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:.9em;background:color-mix(in srgb,var(--m-text) 8%,transparent);padding:.1em .35em;border-radius:6px}',
    '.m-root mark{background:color-mix(in srgb,var(--m-accent) 30%,transparent);color:inherit;padding:0 .2em;border-radius:4px}',
    '.m-root strong{font-weight:700;color:var(--m-text)}',
    '.m-ico{width:1em;height:1em;flex:none;display:inline-block;vertical-align:middle}',
    '.m-emoji{font-size:1em;line-height:1;text-align:center}',
    '.m-grad-text{background:linear-gradient(120deg,var(--m-accent),var(--m-accent2));-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.m-kicker{display:inline-flex;align-items:center;gap:.5em;font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:.78em;color:var(--m-accent)}',
    '.m-kicker::before{content:"";width:1.6em;height:2px;background:currentColor;border-radius:2px}',
    '.m-art{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
    '.m-art-svg{width:100%;height:100%;display:block}',
    /* gráficos */
    '.m-chart{margin:0;width:100%}',
    '.m-chart-svg{width:100%;height:auto;display:block;overflow:visible}',
    '.m-chart-round{display:flex;align-items:center;gap:32px}',
    '.m-chart-round .m-chart-svg{width:46%;max-width:420px}',
    '.m-chart-round .m-legend{flex-direction:column;align-items:flex-start;flex:1}',
    '.m-gridline{stroke:color-mix(in srgb,var(--m-text) 12%,transparent);stroke-width:1}',
    '.m-axis{fill:var(--m-muted);font-size:17px;font-family:var(--m-body)}',
    '.m-axis-strong{fill:var(--m-text);font-weight:600;font-size:19px}',
    '.m-val{fill:var(--m-text);font-size:17px;font-weight:700;font-family:var(--m-body)}',
    '.m-donut-v{fill:var(--m-text);font-size:44px;font-weight:800;font-family:var(--m-head)}',
    '.m-track{fill:color-mix(in srgb,var(--m-text) 7%,transparent)}',
    '.m-legend{display:flex;flex-wrap:wrap;gap:10px 20px;justify-content:center;margin-top:12px;font-size:15px;color:var(--m-muted)}',
    '.m-lg{display:inline-flex;align-items:center;gap:8px}.m-lg i{width:12px;height:12px;border-radius:4px;display:inline-block}.m-lg b{color:var(--m-text)}',
    '.m-bar,.m-hbar{transform-box:fill-box}',
    '.m-anim-on .m-bar{transform-origin:bottom;animation:m-grow-y .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d,0)*45ms + 150ms)}',
    '.m-anim-on .m-hbar{transform-origin:left;animation:m-grow-x .9s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--d,0)*70ms + 150ms)}',
    '.m-anim-on .m-line{stroke-dasharray:1;animation:m-draw 1.4s ease both;animation-delay:calc(var(--d,0)*200ms + 150ms)}',
    '.m-anim-on .m-arc{animation:m-fade .8s ease both;animation-delay:calc(var(--d,0)*90ms + 100ms)}',
    '@keyframes m-grow-y{from{transform:scaleY(0)}}@keyframes m-grow-x{from{transform:scaleX(0)}}@keyframes m-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes m-fade{from{opacity:0}}',
    '@keyframes m-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}',
    /* código */
    '.m-pre{margin:0;background:color-mix(in srgb,var(--m-text) 6%,var(--m-surface));border:1px solid color-mix(in srgb,var(--m-text) 10%,transparent);border-radius:var(--m-radius);padding:24px 28px;overflow:auto;font-family:"JetBrains Mono",ui-monospace,monospace;line-height:1.6;white-space:pre;color:var(--m-text);text-align:left}',
    '.m-pre code{background:none;padding:0;font-size:1em}',
    '.m-c{color:var(--m-muted);font-style:italic}.m-s{color:var(--m-accent2)}.m-k{color:var(--m-accent);font-weight:600}.m-n{color:#f59e0b}',

    /* ---------------- DECK ---------------- */
    '.m-deck{position:relative;width:100%;height:100%;overflow:hidden;outline:none;display:flex;flex-direction:column;user-select:none}',
    '.m-viewport{position:relative;flex:1;min-height:0;overflow:hidden}',
    '.m-stage{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center center}',
    '.m-slide{--m-fs:1;position:absolute;inset:0;overflow:hidden;background:var(--m-bg);opacity:0;visibility:hidden;transition:opacity .45s ease,visibility .45s;font-size:calc(var(--m-fs)*26px)}',
    '.m-slide.is-active{opacity:1;visibility:visible}',
    '.m-slide .m-body{position:absolute;inset:0;padding:72px 88px 64px;display:flex;flex-direction:column;justify-content:center;gap:28px;z-index:1;overflow:hidden}',
    '.m-slide .m-a{opacity:0}',
    '.m-slide.is-active .m-a{animation:m-up .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*90ms + 120ms)}',
    '.m-slide h1{font-size:calc(var(--m-fs)*76px);font-weight:800}',
    '.m-slide h2{font-size:calc(var(--m-fs)*50px)}',
    '.m-slide h3{font-size:calc(var(--m-fs)*30px)}',
    '.m-slide .m-sub{font-size:calc(var(--m-fs)*30px);color:var(--m-muted);max-width:980px;line-height:1.4}',
    '.m-slide .m-text{color:var(--m-muted);max-width:1000px}',
    '.m-slide .m-foot{position:absolute;left:88px;right:88px;bottom:26px;display:flex;justify-content:space-between;font-size:15px;color:var(--m-muted);z-index:2;opacity:.8}',
    '.m-slide .m-source{font-size:15px;color:var(--m-muted)}',
    '.m-slide.m-bg-img .m-body{color:#fff}.m-slide.m-bg-img .m-sub,.m-slide.m-bg-img .m-text{color:rgba(255,255,255,.85)}',
    '.m-bgimg{position:absolute;inset:0;background-size:cover;background-position:center}',
    '.m-bgimg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,.35))}',
    '.m-l-title .m-body,.m-l-closing .m-body,.m-l-section .m-body{justify-content:center}',
    '.m-l-title h1 .m-grad-text{display:inline}',
    '.m-meta{display:flex;gap:28px;color:var(--m-muted);font-size:20px}',
    '.m-bullets{list-style:none;margin:0;padding:0;display:grid;gap:18px}',
    '.m-bullets.m-cols-2{grid-template-columns:1fr 1fr;column-gap:48px}',
    '.m-bullets li{display:flex;gap:18px;align-items:flex-start;line-height:1.35}',
    '.m-bullets li .m-bi{flex:none;width:1.5em;height:1.5em;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--m-accent) 16%,transparent);color:var(--m-accent);margin-top:.02em}',
    '.m-bullets li .m-bi .m-ico{width:.85em;height:.85em}',
    '.m-bullets li .m-dot-b{flex:none;width:.45em;height:.45em;border-radius:50%;background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));margin-top:.5em}',
    '.m-frag{transition:opacity .4s ease,transform .4s ease}.m-frag:not(.is-shown){opacity:.12 !important;transform:translateX(-8px)}',
    '.m-split{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center;min-height:0}',
    '.m-split.m-rev{grid-template-columns:.9fr 1.1fr}.m-split.m-rev>:first-child{order:2}',
    '.m-media{position:relative;border-radius:var(--m-radius);overflow:hidden;height:100%;min-height:360px;max-height:560px;background:var(--m-surface);box-shadow:0 30px 60px -20px rgba(0,0,0,.35)}',
    '.m-media img{width:100%;height:100%;object-fit:cover;display:block}',
    '.m-media .m-art{position:absolute}',
    '.m-cap{font-size:16px;color:var(--m-muted);margin-top:10px}',
    '.m-section-num{font-family:var(--m-head);font-size:calc(var(--m-fs)*180px);font-weight:800;line-height:.9;opacity:.9}',
    '.m-quote-mark{width:84px;height:84px;color:var(--m-accent);opacity:.9}',
    '.m-quote-text{font-family:var(--m-head);font-size:calc(var(--m-fs)*50px);line-height:1.22;letter-spacing:-.01em;font-weight:600;max-width:1050px}',
    '.m-quote-by{font-size:22px;color:var(--m-muted)}.m-quote-by b{color:var(--m-text)}',
    '.m-stats{display:grid;gap:24px}',
    '.m-stat{background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent);border-radius:var(--m-radius);padding:30px 28px;display:flex;flex-direction:column;gap:8px}',
    '.m-stat-v{font-family:var(--m-head);font-weight:800;font-size:calc(var(--m-fs)*64px);line-height:1;letter-spacing:-.03em}',
    '.m-stat-l{font-size:calc(var(--m-fs)*22px);font-weight:600}.m-stat-d{font-size:17px;color:var(--m-muted)}',
    '.m-cards{display:grid;gap:22px}',
    '.m-card{position:relative;background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent);border-radius:var(--m-radius);padding:28px;display:flex;flex-direction:column;gap:12px;font-size:calc(var(--m-fs)*21px)}',
    '.m-card h3{font-size:calc(var(--m-fs)*26px)}',
    '.m-card p{color:var(--m-muted);line-height:1.45}',
    '.m-card-ico{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);font-size:26px}',
    '.m-flip{perspective:1200px;cursor:pointer;background:none;border:0;padding:0;font:inherit;color:inherit;text-align:left;display:block;width:100%;min-height:240px}',
    '.m-flip-in{position:relative;width:100%;height:100%;min-height:240px;transition:transform .7s cubic-bezier(.2,.8,.2,1);transform-style:preserve-3d}',
    '.m-flip.is-flipped .m-flip-in{transform:rotateY(180deg)}',
    '.m-flip-f,.m-flip-b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
    '.m-flip-b{transform:rotateY(180deg);background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);justify-content:center}',
    '.m-flip-b p{color:inherit;opacity:.95}',
    '.m-hint{font-size:14px;color:var(--m-muted);margin-top:auto}',
    '.m-timeline{position:relative;display:grid;gap:20px;padding-top:44px}',
    '.m-timeline::before{content:"";position:absolute;left:0;right:0;top:15px;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--m-accent),var(--m-accent2))}',
    '.m-tl{position:relative;display:flex;flex-direction:column;gap:8px;font-size:calc(var(--m-fs)*20px)}',
    '.m-tl::before{content:"";position:absolute;top:-38px;left:0;width:22px;height:22px;border-radius:50%;background:var(--m-bg);border:4px solid var(--m-accent)}',
    '.m-tl-d{font-weight:800;color:var(--m-accent);font-family:var(--m-head);font-size:1.25em}',
    '.m-tl h3{font-size:calc(var(--m-fs)*24px)}.m-tl p{color:var(--m-muted);line-height:1.4}',
    '.m-steps{display:grid;gap:18px;counter-reset:st}',
    '.m-step{display:flex;flex-direction:column;gap:10px;padding:24px;border-radius:var(--m-radius);background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent);font-size:calc(var(--m-fs)*20px)}',
    '.m-step-n{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-family:var(--m-head);background:var(--m-accent);color:var(--m-on-accent);font-size:22px}',
    '.m-step h3{font-size:calc(var(--m-fs)*24px)}.m-step p{color:var(--m-muted);line-height:1.4}',
    '.m-agenda{list-style:none;margin:0;padding:0;display:grid;gap:4px}',
    '.m-agenda li{display:flex;align-items:baseline;gap:28px;padding:14px 0;border-bottom:1px solid color-mix(in srgb,var(--m-text) 10%,transparent);font-size:calc(var(--m-fs)*30px);font-family:var(--m-head);font-weight:600}',
    '.m-agenda li span{color:var(--m-accent);font-size:.8em;min-width:2.2em;font-weight:800}',
    '.m-table{width:100%;border-collapse:separate;border-spacing:0;font-size:calc(var(--m-fs)*21px);background:var(--m-surface);border-radius:var(--m-radius);overflow:hidden;border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent)}',
    '.m-table th{text-align:left;padding:16px 20px;background:color-mix(in srgb,var(--m-accent) 14%,var(--m-surface));font-family:var(--m-head);font-weight:700}',
    '.m-table td{padding:14px 20px;border-top:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);color:var(--m-text)}',
    '.m-table .m-hl{background:color-mix(in srgb,var(--m-accent) 9%,transparent);font-weight:600}',
    '.m-cmp{display:grid;grid-template-columns:1fr 1fr;gap:28px;position:relative}',
    '.m-col{background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent);border-radius:var(--m-radius);padding:32px;display:flex;flex-direction:column;gap:16px}',
    '.m-col h3{display:flex;align-items:center;gap:12px}.m-col .m-ico{color:var(--m-accent)}',
    '.m-col-b{border-color:color-mix(in srgb,var(--m-accent) 50%,transparent);box-shadow:0 0 0 1px color-mix(in srgb,var(--m-accent) 30%,transparent)}',
    '.m-vs{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--m-bg);border:3px solid var(--m-accent);font-weight:800;font-family:var(--m-head);z-index:2}',
    '.m-quiz-opts{display:grid;grid-template-columns:1fr 1fr;gap:16px}',
    '.m-opt{font:inherit;font-size:calc(var(--m-fs)*22px);text-align:left;padding:20px 24px;border-radius:var(--m-radius);border:2px solid color-mix(in srgb,var(--m-text) 14%,transparent);background:var(--m-surface);color:var(--m-text);cursor:pointer;display:flex;gap:14px;align-items:center;transition:transform .15s,border-color .2s,background .2s}',
    '.m-opt:hover{transform:translateY(-2px);border-color:var(--m-accent)}',
    '.m-opt b{width:36px;height:36px;flex:none;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--m-accent) 16%,transparent);color:var(--m-accent)}',
    '.m-opt.is-right{border-color:#10b981;background:color-mix(in srgb,#10b981 16%,var(--m-surface))}',
    '.m-opt.is-wrong{border-color:#ef4444;background:color-mix(in srgb,#ef4444 14%,var(--m-surface));animation:m-shake .4s}',
    '@keyframes m-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
    '.m-feedback{min-height:1.6em;font-size:calc(var(--m-fs)*21px);color:var(--m-muted)}.m-feedback b{color:var(--m-text)}',
    '.m-statement{font-family:var(--m-head);font-size:calc(var(--m-fs)*72px);font-weight:800;line-height:1.08;letter-spacing:-.03em;max-width:1100px}',
    '.m-cta-btn{display:inline-flex;align-items:center;gap:12px;align-self:flex-start;padding:18px 30px;border-radius:999px;background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);font-weight:700;font-size:22px;text-decoration:none}',
    /* controles do deck */
    '.m-progress{height:3px;background:color-mix(in srgb,var(--m-text) 10%,transparent);flex:none}',
    '.m-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--m-accent),var(--m-accent2));transition:width .4s ease}',
    '.m-bar-ui{flex:none;height:46px;display:flex;align-items:center;gap:4px;padding:0 8px;background:color-mix(in srgb,var(--m-bg) 92%,var(--m-text));border-top:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);font-family:var(--m-body)}',
    '.m-btn{appearance:none;border:0;background:transparent;color:var(--m-text);height:34px;min-width:34px;padding:0 10px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font:500 13px/1 var(--m-body);cursor:pointer;opacity:.85}',
    '.m-btn:hover{background:color-mix(in srgb,var(--m-text) 10%,transparent);opacity:1}',
    '.m-btn:focus-visible{outline:2px solid var(--m-accent);outline-offset:1px}',
    '.m-btn .m-ico{width:17px;height:17px}',
    '.m-btn.is-on{background:color-mix(in srgb,var(--m-accent) 22%,transparent);color:var(--m-accent)}',
    '.m-count{font:600 13px/1 var(--m-body);color:var(--m-muted);padding:0 8px;font-variant-numeric:tabular-nums}',
    '.m-spacer{flex:1}',
    '.m-notes{flex:none;max-height:30%;overflow:auto;padding:14px 18px;font-size:15px;line-height:1.55;background:var(--m-surface);border-top:1px solid color-mix(in srgb,var(--m-text) 10%,transparent);color:var(--m-text);display:none;user-select:text}',
    '.m-deck.show-notes .m-notes{display:block}',
    '.m-overview{position:absolute;inset:0;z-index:5;background:var(--m-bg);overflow:auto;padding:20px;display:none;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;align-content:start}',
    '.m-deck.show-overview .m-overview{display:grid}',
    '.m-thumb{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;cursor:pointer;border:2px solid transparent;background:var(--m-surface);padding:0}',
    '.m-thumb.is-cur{border-color:var(--m-accent)}',
    '.m-thumb .m-tn{position:absolute;left:0;top:0;width:1280px;height:720px;pointer-events:none}',
    '.m-thumb .m-slide{opacity:1;visibility:visible;transition:none}',
    '.m-thumb .m-a,.m-thumb .m-slide.is-active .m-a,.m-thumb .m-bar,.m-thumb .m-hbar,.m-thumb .m-line,.m-thumb .m-arc{opacity:1;animation:none!important}',
    '.m-thumb .m-frag{opacity:1!important;transform:none!important}',
    '.m-thumb .m-grad-text{background:none;color:var(--m-accent);-webkit-text-fill-color:currentColor}',
    '.m-thumb span{position:absolute;left:8px;bottom:6px;font:700 12px/1 var(--m-body);background:var(--m-bg);color:var(--m-text);padding:4px 7px;border-radius:6px;z-index:3}',
    '@media print{.m-deck{height:auto;overflow:visible}.m-viewport{overflow:visible}.m-stage{position:static;transform:none!important;width:auto;height:auto}.m-slide{position:relative;width:1280px;height:720px;opacity:1;visibility:visible;page-break-after:always;break-after:page}.m-slide .m-a{opacity:1;animation:none}.m-frag{opacity:1!important;transform:none!important}.m-bar-ui,.m-progress,.m-notes,.m-overview{display:none!important}}',

    /* ---------------- SITE ---------------- */
    '.m-site{container-type:inline-size;font-size:17px;min-height:100%;position:relative}',
    '.m-wrap{width:min(1140px,100%);margin:0 auto;padding:0 28px}',
    '.m-nav{position:sticky;top:0;z-index:20;backdrop-filter:saturate(1.4) blur(14px);-webkit-backdrop-filter:saturate(1.4) blur(14px);background:color-mix(in srgb,var(--m-bg) 78%,transparent);border-bottom:1px solid color-mix(in srgb,var(--m-text) 8%,transparent)}',
    '.m-nav .m-wrap{display:flex;align-items:center;gap:24px;height:66px}',
    '.m-brand{font-family:var(--m-head);font-weight:800;font-size:20px;display:flex;align-items:center;gap:10px;color:var(--m-text);text-decoration:none;letter-spacing:-.02em}',
    '.m-brand-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));display:grid;place-items:center;color:var(--m-on-accent);font-size:15px}',
    '.m-links{display:flex;gap:4px;margin-left:auto;align-items:center}',
    '.m-root .m-links a:not(.m-btn-p){color:var(--m-muted);text-decoration:none;font-weight:500;font-size:15px;padding:8px 12px;border-radius:9px}',
    '.m-root .m-links a:not(.m-btn-p):hover{color:var(--m-text);background:color-mix(in srgb,var(--m-text) 7%,transparent)}',
    '.m-burger{display:none;margin-left:auto}',
    '.m-btn-p,.m-btn-s{display:inline-flex;align-items:center;gap:10px;padding:14px 24px;border-radius:999px;font-weight:700;text-decoration:none;font-size:16px;border:0;cursor:pointer;font-family:var(--m-body);transition:transform .2s,box-shadow .2s}',
    '.m-btn-p{background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);box-shadow:0 10px 30px -10px var(--m-accent)}',
    '.m-btn-p:hover,.m-btn-s:hover{transform:translateY(-2px)}',
    '.m-btn-s{background:color-mix(in srgb,var(--m-text) 8%,transparent);color:var(--m-text)}',
    '.m-links .m-btn-p{padding:9px 16px;font-size:14px;margin-left:8px;color:var(--m-on-accent)}',
    '.m-sec{position:relative;padding:96px 0}',
    '.m-sec-alt{background:color-mix(in srgb,var(--m-surface) 70%,var(--m-bg))}',
    '.m-sec-head{max-width:720px;margin:0 auto 52px;text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center}',
    '.m-sec-head h2{font-size:clamp(30px,4.2cqi,46px)}',
    '.m-sec-head p{color:var(--m-muted);font-size:18px}',
    '.m-hero{position:relative;overflow:hidden;padding:120px 0 104px}',
    '.m-hero .m-art{opacity:.9}',
    '.m-hero-c{position:relative;z-index:1;text-align:center;display:flex;flex-direction:column;align-items:center;gap:22px;max-width:880px;margin:0 auto}',
    '.m-hero h1{font-size:clamp(38px,6.4cqi,76px);font-weight:800;letter-spacing:-.035em}',
    '.m-hero .m-lead{font-size:clamp(17px,2cqi,21px);color:var(--m-muted);max-width:680px}',
    '.m-ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.m-hero-split{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center;position:relative;z-index:1}',
    '.m-hero-split .m-hero-c{text-align:left;align-items:flex-start;margin:0}',
    '.m-hero-split .m-ctas{justify-content:flex-start}',
    '.m-hero-media{position:relative;aspect-ratio:4/3.4;border-radius:calc(var(--m-radius) + 6px);overflow:hidden;background:var(--m-surface);box-shadow:0 40px 80px -30px rgba(0,0,0,.45)}',
    '.m-hero-media img{width:100%;height:100%;object-fit:cover;display:block}',
    '.m-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--m-accent) 14%,transparent);color:var(--m-accent);font-weight:600;font-size:14px;border:1px solid color-mix(in srgb,var(--m-accent) 30%,transparent)}',
    '.m-logos{display:flex;flex-wrap:wrap;justify-content:center;gap:18px 48px;opacity:.75}',
    '.m-logos span{font-family:var(--m-head);font-weight:700;font-size:22px;letter-spacing:-.02em;color:var(--m-muted)}',
    '.m-grid{display:grid;gap:22px;grid-template-columns:repeat(var(--cols,3),1fr)}',
    '.m-fcard{background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);border-radius:var(--m-radius);padding:28px;display:flex;flex-direction:column;gap:12px;transition:transform .25s,box-shadow .25s,border-color .25s}',
    '.m-fcard:hover{transform:translateY(-4px);box-shadow:0 24px 50px -24px rgba(0,0,0,.35);border-color:color-mix(in srgb,var(--m-accent) 35%,transparent)}',
    '.m-fcard h3{font-size:20px}.m-fcard p{color:var(--m-muted);font-size:16px}',
    '.m-fcard .m-card-ico{width:46px;height:46px;font-size:22px;border-radius:12px}',
    '.m-splitsec{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}',
    '.m-splitsec.m-rev>:first-child{order:2}',
    '.m-splitsec h2{font-size:clamp(28px,3.8cqi,42px);margin-bottom:16px}',
    '.m-splitsec p{color:var(--m-muted);font-size:18px}',
    '.m-splitsec .m-chart{max-width:560px;margin:0 auto}',
    '.m-checks{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:12px}',
    '.m-checks li{display:flex;gap:12px;align-items:flex-start}',
    '.m-checks li .m-ico{color:var(--m-accent);width:22px;height:22px;margin-top:1px}',
    '.m-imgbox{position:relative;border-radius:calc(var(--m-radius) + 4px);overflow:hidden;aspect-ratio:4/3;background:var(--m-surface)}',
    '.m-imgbox img{width:100%;height:100%;object-fit:cover;display:block}',
    '.m-sstats{display:grid;grid-template-columns:repeat(var(--cols,4),1fr);gap:20px;text-align:center}',
    '.m-sstat .m-stat-v{font-size:clamp(34px,5cqi,54px)}',
    '.m-sstat .m-stat-l{font-size:16px;color:var(--m-muted);font-weight:500}',
    '.m-tcard{background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);border-radius:var(--m-radius);padding:28px;display:flex;flex-direction:column;gap:18px}',
    '.m-tcard blockquote{margin:0;font-size:17px;line-height:1.6}',
    '.m-person{display:flex;align-items:center;gap:12px}',
    '.m-avatar{width:44px;height:44px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:700;color:var(--m-on-accent);background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));overflow:hidden;font-size:16px}',
    '.m-avatar img{width:100%;height:100%;object-fit:cover}',
    '.m-person b{display:block;font-size:15px}.m-person small{color:var(--m-muted);font-size:14px}',
    '.m-stars{color:#f59e0b;display:flex;gap:2px}.m-stars .m-ico{width:16px;height:16px;fill:currentColor}',
    '.m-plan{position:relative;background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 9%,transparent);border-radius:calc(var(--m-radius) + 4px);padding:32px;display:flex;flex-direction:column;gap:18px}',
    '.m-plan.is-hl{border:2px solid var(--m-accent);box-shadow:0 30px 60px -30px var(--m-accent);transform:translateY(-8px)}',
    '.m-plan-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em}',
    '.m-price{font-family:var(--m-head);font-size:46px;font-weight:800;letter-spacing:-.03em;line-height:1}.m-price small{font-size:16px;color:var(--m-muted);font-weight:500;letter-spacing:0}',
    '.m-plan .m-checks{margin:0}.m-plan .m-btn-p,.m-plan .m-btn-s{justify-content:center;margin-top:auto}',
    '.m-faq{max-width:780px;margin:0 auto;display:grid;gap:12px}',
    '.m-faq details{background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);border-radius:14px;padding:4px 22px}',
    '.m-faq summary{cursor:pointer;list-style:none;padding:16px 0;font-weight:600;display:flex;justify-content:space-between;gap:16px;align-items:center}',
    '.m-faq summary::-webkit-details-marker{display:none}',
    '.m-faq summary::after{content:"+";font-size:24px;color:var(--m-accent);transition:transform .25s;line-height:1}',
    '.m-faq details[open] summary::after{transform:rotate(45deg)}',
    '.m-faq details p{color:var(--m-muted);padding:0 0 18px}',
    '.m-ssteps{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:22px}',
    '.m-ssteps .m-step{font-size:17px}.m-ssteps .m-step h3{font-size:20px}',
    '.m-vtl{max-width:760px;margin:0 auto;position:relative;display:grid;gap:30px;padding-left:36px}',
    '.m-vtl::before{content:"";position:absolute;left:9px;top:6px;bottom:6px;width:3px;border-radius:3px;background:linear-gradient(var(--m-accent),var(--m-accent2))}',
    '.m-vtl-i{position:relative}.m-vtl-i::before{content:"";position:absolute;left:-36px;top:4px;width:21px;height:21px;border-radius:50%;background:var(--m-bg);border:4px solid var(--m-accent)}',
    '.m-vtl-i .m-tl-d{font-size:15px}.m-vtl-i h3{font-size:20px;margin:4px 0}.m-vtl-i p{color:var(--m-muted)}',
    '.m-gallery{display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:14px}',
    '.m-gallery figure{margin:0;position:relative;border-radius:14px;overflow:hidden;aspect-ratio:1;background:var(--m-surface)}',
    '.m-gallery img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}',
    '.m-gallery figure:hover img{transform:scale(1.05)}',
    '.m-gallery figcaption{position:absolute;left:0;right:0;bottom:0;padding:24px 14px 12px;color:#fff;font-size:14px;background:linear-gradient(transparent,rgba(0,0,0,.7))}',
    '.m-ctaband{position:relative;overflow:hidden;border-radius:calc(var(--m-radius) + 10px);padding:72px 48px;text-align:center;background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);display:flex;flex-direction:column;align-items:center;gap:18px}',
    '.m-ctaband h2{font-size:clamp(28px,4cqi,44px);color:inherit}.m-ctaband p{opacity:.9;font-size:18px;max-width:620px}',
    '.m-ctaband .m-btn-p{background:var(--m-on-accent);color:var(--m-accent);box-shadow:none}',
    '.m-ctaband .m-art{opacity:.25}',
    '.m-form{max-width:640px;margin:0 auto;display:grid;gap:14px;background:var(--m-surface);border:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);border-radius:calc(var(--m-radius) + 4px);padding:32px}',
    '.m-form label{display:grid;gap:6px;font-weight:600;font-size:14px}',
    '.m-form input,.m-form textarea,.m-form select{font:inherit;padding:12px 14px;border-radius:12px;border:1px solid color-mix(in srgb,var(--m-text) 16%,transparent);background:var(--m-bg);color:var(--m-text)}',
    '.m-form input:focus,.m-form textarea:focus{outline:2px solid var(--m-accent);outline-offset:0;border-color:transparent}',
    '.m-form-msg{font-size:14px;color:var(--m-muted)}',
    '.m-team{display:grid;grid-template-columns:repeat(var(--cols,4),1fr);gap:22px;text-align:center}',
    '.m-team .m-avatar{width:96px;height:96px;font-size:30px;margin:0 auto 12px}',
    '.m-team b{display:block}.m-team small{color:var(--m-muted)}',
    '.m-footer{padding:40px 0;border-top:1px solid color-mix(in srgb,var(--m-text) 8%,transparent);color:var(--m-muted);font-size:14px}',
    '.m-footer .m-wrap{display:flex;gap:20px;align-items:center;flex-wrap:wrap}',
    '.m-footer nav{display:flex;gap:18px;margin-left:auto;flex-wrap:wrap}.m-root .m-footer a{color:var(--m-muted);text-decoration:none}',
    '.m-rv{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--i,0)*80ms)}',
    '.m-rv.is-in{opacity:1;transform:none}',
    '@container (max-width: 860px){.m-grid,.m-ssteps,.m-gallery,.m-team{--cols:2!important}.m-hero-split,.m-splitsec{grid-template-columns:1fr;gap:36px}.m-splitsec.m-rev>:first-child{order:0}.m-sstats{--cols:2!important}.m-plan.is-hl{transform:none}}',
    '@container (max-width: 640px){.m-links{display:none}.m-burger{display:inline-flex}.m-nav.is-open .m-links{display:flex;position:absolute;top:66px;left:0;right:0;flex-direction:column;align-items:stretch;padding:12px;background:var(--m-bg);border-bottom:1px solid color-mix(in srgb,var(--m-text) 10%,transparent)}.m-grid,.m-ssteps,.m-team{--cols:1!important}.m-gallery{--cols:2!important}.m-sec{padding:64px 0}.m-hero{padding:72px 0 64px}.m-wrap{padding:0 18px}.m-ctaband{padding:48px 22px}.m-chart-round{flex-direction:column}.m-chart-round .m-chart-svg{width:80%}}',
    '@media (prefers-reduced-motion: reduce){.m-root *{animation:none!important;transition:none!important}.m-rv{opacity:1;transform:none}.m-slide .m-a{opacity:1}}'
  ].join('\n');

  function injectCss(doc, th) {
    doc = doc || document;
    if (!doc.getElementById('mythos-css')) {
      var st = doc.createElement('style');
      st.id = 'mythos-css';
      st.textContent = CSS;
      doc.head.appendChild(st);
    }
    var href = fontHref(th);
    if (!doc.querySelector('link[data-mythos-font="' + href + '"]')) {
      var l = doc.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.setAttribute('data-mythos-font', href);
      doc.head.appendChild(l);
    }
  }

  /* ------------------------------------------------------------------ *
   * Slides
   * ------------------------------------------------------------------ */
  function A(i) { return ' m-a" style="--i:' + i; }

  function bulletList(items, reveal, startIdx) {
    items = arr(items);
    var cols = items.length > 6 ? ' m-cols-2' : '';
    return '<ul class="m-bullets' + cols + '">' + items.map(function (b, i) {
      var txt = typeof b === 'object' && b ? (b.text || b.title || '') : b;
      var ic = typeof b === 'object' && b && b.icon ? '<span class="m-bi">' + icon(b.icon) + '</span>' : '<span class="m-dot-b"></span>';
      var sub = typeof b === 'object' && b && b.detail ? '<div class="m-text" style="font-size:.8em">' + md(b.detail) + '</div>' : '';
      return '<li class="' + (reveal ? 'm-frag ' : '') + 'm-a" style="--i:' + (startIdx + i) + '">' + ic + '<div>' + md(txt) + sub + '</div></li>';
    }).join('') + '</ul>';
  }

  function mediaBox(s, seed) {
    var u = safeUrl(s.image);
    if (u) return '<figure class="m-media" style="margin:0"><img src="' + esc(u) + '" alt="' + esc(s.alt || s.caption || s.title || '') + '" loading="lazy"></figure>' + (s.caption ? '<div class="m-cap">' + md(s.caption) + '</div>' : '');
    if (s.chart) return chartSvg(s.chart, s._lang);
    return '<figure class="m-media" style="margin:0"><div class="m-art">' + genArt(seed, s.visual) + '</div></figure>';
  }

  function headBlock(s, i0) {
    var h = '';
    if (s.kicker) h += '<div class="m-kicker' + A(i0) + '">' + esc(s.kicker) + '</div>';
    if (s.title) h += '<h2 class="' + A(i0 + 1).slice(1) + '">' + md(s.title) + '</h2>';
    if (s.subtitle) h += '<p class="m-sub' + A(i0 + 2) + '">' + md(s.subtitle) + '</p>';
    return h;
  }

  function cols(n, max) { return Math.max(1, Math.min(max || 4, n)); }

  var LAYOUTS = {
    title: function (s, ctx) {
      var bg = safeUrl(s.image) ? '' : '<div class="m-art">' + genArt(ctx.seed + s.title, s.visual || 'orbs') + '</div>';
      var meta = [s.author, s.date, s.event].filter(Boolean).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');
      return bg + '<div class="m-body">' + (s.kicker ? '<div class="m-kicker' + A(0) + '">' + esc(s.kicker) + '</div>' : '') +
        '<h1 class="' + A(1).slice(1) + '">' + gradTitle(s.title) + '</h1>' +
        (s.subtitle ? '<p class="m-sub' + A(2) + '">' + md(s.subtitle) + '</p>' : '') +
        (meta ? '<div class="m-meta' + A(3) + '">' + meta + '</div>' : '') + '</div>';
    },
    section: function (s, ctx) {
      return '<div class="m-art" style="opacity:.6">' + genArt(ctx.seed + 'sec' + ctx.index, s.visual || 'rings') + '</div><div class="m-body">' +
        (s.number != null ? '<div class="m-section-num m-grad-text' + A(0) + '">' + esc(s.number) + '</div>' : '') +
        '<h1 class="' + A(1).slice(1) + '">' + md(s.title) + '</h1>' + (s.subtitle ? '<p class="m-sub' + A(2) + '">' + md(s.subtitle) + '</p>' : '') + '</div>';
    },
    bullets: function (s, ctx) {
      var list = bulletList(s.bullets, s.reveal, 3);
      var txt = s.text ? '<p class="m-text' + A(2) + '">' + md(s.text) + '</p>' : '';
      if (s.image || s.chart || s.visual) {
        return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-split' + (s.imageSide === 'left' ? ' m-rev' : '') + '"><div style="display:flex;flex-direction:column;gap:22px">' + txt + list + '</div><div class="m-a" style="--i:4">' + mediaBox(s, ctx.seed + ctx.index) + '</div></div></div>';
      }
      return '<div class="m-body">' + headBlock(s, 0) + txt + list + '</div>';
    },
    image: function (s, ctx) {
      if (s.imageSide === 'full' || s.fullBleed) {
        return '<div class="m-body" style="justify-content:flex-end">' + headBlock(s, 0) + (s.text ? '<p class="m-sub' + A(3) + '">' + md(s.text) + '</p>' : '') + '</div>';
      }
      return '<div class="m-body"><div class="m-split' + (s.imageSide === 'left' ? ' m-rev' : '') + '"><div style="display:flex;flex-direction:column;gap:22px">' + headBlock(s, 0) +
        (s.text ? '<p class="m-text' + A(3) + '">' + md(s.text) + '</p>' : '') + (s.bullets ? bulletList(s.bullets, s.reveal, 4) : '') +
        '</div><div class="m-a" style="--i:2">' + mediaBox(s, ctx.seed + ctx.index) + '</div></div></div>';
    },
    quote: function (s) {
      return '<div class="m-body">' + icon('quote', 'm-quote-mark m-a" style="--i:0') +
        '<blockquote class="m-quote-text' + A(1) + '" style="margin:0">' + md(s.quote || s.text || s.title) + '</blockquote>' +
        ((s.author || s.role) ? '<div class="m-quote-by' + A(2) + '">— <b>' + esc(s.author || '') + '</b>' + (s.role ? ', ' + esc(s.role) : '') + '</div>' : '') + '</div>';
    },
    statement: function (s) {
      return '<div class="m-art" style="opacity:.45">' + genArt('st' + (s.title || s.text), s.visual || 'dots') + '</div><div class="m-body">' + (s.kicker ? '<div class="m-kicker' + A(0) + '">' + esc(s.kicker) + '</div>' : '') +
        '<div class="m-statement' + A(1) + '">' + gradTitle(s.title || s.text) + '</div>' + (s.subtitle ? '<p class="m-sub' + A(2) + '">' + md(s.subtitle) + '</p>' : '') + '</div>';
    },
    stats: function (s) {
      var st = arr(s.stats);
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-stats" style="grid-template-columns:repeat(' + cols(st.length, 4) + ',1fr)">' + st.map(function (x, i) {
        return '<div class="m-stat' + A(3 + i) + '"><div class="m-stat-v m-grad-text" data-count="' + esc(x.value) + '">' + esc(x.value) + '</div><div class="m-stat-l">' + md(x.label || '') + '</div>' + (x.detail ? '<div class="m-stat-d">' + md(x.detail) + '</div>' : '') + '</div>';
      }).join('') + '</div>' + (s.text ? '<p class="m-text' + A(8) + '">' + md(s.text) + '</p>' : '') + '</div>';
    },
    chart: function (s) {
      var side = s.text || s.bullets;
      var ch = '<div class="m-a" style="--i:3">' + chartSvg(s.chart, s._lang) + '</div>';
      var body = side ? '<div class="m-split" style="grid-template-columns:1.35fr .65fr">' + ch + '<div style="display:flex;flex-direction:column;gap:18px">' + (s.text ? '<p class="m-text' + A(4) + '" style="font-size:.95em">' + md(s.text) + '</p>' : '') + (s.bullets ? bulletList(s.bullets, false, 5) : '') + '</div></div>' : ch;
      return '<div class="m-body">' + headBlock(s, 0) + body + (s.source ? '<div class="m-source' + A(9) + '">' + md(s.source) + '</div>' : '') + '</div>';
    },
    timeline: function (s) {
      var it = arr(s.items);
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-timeline" style="grid-template-columns:repeat(' + cols(it.length, 6) + ',1fr)">' + it.map(function (x, i) {
        return '<div class="m-tl' + A(3 + i) + '"><div class="m-tl-d">' + esc(x.date || x.label || '') + '</div><h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div>';
    },
    steps: function (s) {
      var it = arr(s.items || s.steps);
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-steps" style="grid-template-columns:repeat(' + cols(it.length, 5) + ',1fr)">' + it.map(function (x, i) {
        return '<div class="m-step' + A(3 + i) + '"><div class="m-step-n">' + (x.icon ? icon(x.icon) : i + 1) + '</div><h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div>';
    },
    cards: function (s) {
      var it = arr(s.cards || s.items);
      var flip = !!s.flip;
      var c = cols(it.length, it.length === 4 ? 4 : 3);
      var L = t(s._lang);
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-cards" style="grid-template-columns:repeat(' + c + ',1fr)">' + it.map(function (x, i) {
        var front = (x.icon ? '<div class="m-card-ico">' + icon(x.icon) + '</div>' : '') + '<h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '');
        if (flip || x.back) {
          return '<button type="button" class="m-flip' + A(3 + i) + '"><div class="m-flip-in"><div class="m-card m-flip-f">' + front + '<div class="m-hint">' + esc(L.flip) + ' ↻</div></div><div class="m-card m-flip-b"><p>' + md(x.back || x.text || '') + '</p></div></div></button>';
        }
        return '<div class="m-card' + A(3 + i) + '">' + front + '</div>';
      }).join('') + '</div></div>';
    },
    comparison: function (s) {
      var l = s.left || {}, r = s.right || {};
      function col(c, k, extra) {
        return '<div class="m-col' + extra + A(3 + k) + '"><h3>' + (c.icon ? icon(c.icon) : '') + md(c.heading || c.title || '') + '</h3>' + (c.text ? '<p class="m-text">' + md(c.text) + '</p>' : '') + (c.bullets ? bulletList(c.bullets, false, 0).replace(/ m-a"/g, '"') : '') + '</div>';
      }
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-cmp">' + col(l, 0, '') + col(r, 1, ' m-col-b') + (s.vs !== false ? '<div class="m-vs' + A(5) + '">VS</div>' : '') + '</div></div>';
    },
    table: function (s) {
      var hl = typeof s.highlightColumn === 'number' ? s.highlightColumn : -1;
      return '<div class="m-body">' + headBlock(s, 0) + '<div class="m-a" style="--i:3"><table class="m-table"><thead><tr>' + arr(s.columns).map(function (c, i) { return '<th' + (i === hl ? ' class="m-hl"' : '') + '>' + md(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        arr(s.rows).map(function (r) { return '<tr>' + arr(r).map(function (c, i) { return '<td' + (i === hl ? ' class="m-hl"' : '') + '>' + md(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + (s.source ? '<div class="m-source">' + md(s.source) + '</div>' : '') + '</div>';
    },
    code: function (s) {
      return '<div class="m-body">' + headBlock(s, 0) + '<pre class="m-pre' + A(3) + '" style="font-size:calc(var(--m-fs)*20px)"><code>' + highlight(s.code, s.language) + '</code></pre>' + (s.text ? '<p class="m-text' + A(4) + '">' + md(s.text) + '</p>' : '') + '</div>';
    },
    quiz: function (s) {
      var L = t(s._lang), letters = 'ABCDEFGH';
      return '<div class="m-body">' + (s.kicker ? '<div class="m-kicker' + A(0) + '">' + esc(s.kicker) + '</div>' : '') + '<h2 class="' + A(1).slice(1) + '">' + md(s.question || s.title || '') + '</h2>' +
        '<div class="m-quiz-opts" data-answer="' + (Number(s.answer) || 0) + '">' + arr(s.options).map(function (o, i) {
          return '<button type="button" class="m-opt' + A(2 + i) + '" data-i="' + i + '"><b>' + letters[i] + '</b><span>' + md(o) + '</span></button>';
        }).join('') + '</div><div class="m-feedback" data-ok="' + esc(L.correct) + '" data-no="' + esc(L.wrong) + '" data-exp="' + esc(s.explanation || '') + '"></div></div>';
    },
    agenda: function (s) {
      return '<div class="m-body">' + headBlock(s, 0) + '<ol class="m-agenda">' + arr(s.items || s.bullets).map(function (x, i) {
        return '<li class="m-a" style="--i:' + (2 + i) + '"><span>' + String(i + 1).padStart(2, '0') + '</span>' + md(typeof x === 'object' ? x.title : x) + '</li>';
      }).join('') + '</ol></div>';
    },
    closing: function (s, ctx) {
      var cta = s.cta ? (typeof s.cta === 'object' ? s.cta : { label: s.cta }) : null;
      var href = cta && safeUrl(cta.url);
      return '<div class="m-art">' + genArt(ctx.seed + 'end', s.visual || 'waves') + '</div><div class="m-body">' + (s.kicker ? '<div class="m-kicker' + A(0) + '">' + esc(s.kicker) + '</div>' : '') +
        '<h1 class="' + A(1).slice(1) + '">' + gradTitle(s.title || '') + '</h1>' + (s.subtitle ? '<p class="m-sub' + A(2) + '">' + md(s.subtitle) + '</p>' : '') +
        (cta ? (href ? '<a class="m-cta-btn' + A(3) + '" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(cta.label || href) + icon('arrow') + '</a>' : '<div class="m-cta-btn' + A(3) + '">' + esc(cta.label) + '</div>') : '') +
        (s.contact ? '<div class="m-meta' + A(4) + '">' + arr(s.contact).map(function (c) { return '<span>' + md(c) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    },
    html: function (s) {
      return '<div class="m-body">' + (s.title ? headBlock(s, 0) : '') + '<div class="m-a" style="--i:3">' + String(s.html || '') + '</div></div>';
    }
  };
  LAYOUTS.cover = LAYOUTS.title;
  LAYOUTS['two-column'] = LAYOUTS.comparison;
  LAYOUTS.compare = LAYOUTS.comparison;
  LAYOUTS.process = LAYOUTS.steps;
  LAYOUTS.grid = LAYOUTS.cards;
  LAYOUTS.flashcards = function (s, ctx) { s.flip = true; return LAYOUTS.cards(s, ctx); };
  LAYOUTS.end = LAYOUTS.closing;
  LAYOUTS.big = LAYOUTS.statement;
  LAYOUTS.text = LAYOUTS.bullets;
  LAYOUTS.content = LAYOUTS.bullets;

  function gradTitle(title) {
    // Destaque em gradiente: texto entre {chaves} vira gradiente; sem chaves, título normal.
    var h = md(title || '');
    return /\{[^}]+\}/.test(h) ? h.replace(/\{([^}]+)\}/g, '<span class="m-grad-text">$1</span>') : h;
  }

  function slideBg(s) {
    var b = s.background;
    if (!b) return { cls: '', style: '', layer: '' };
    var u = safeUrl(b) || safeUrl(b && b.image);
    if (u) return { cls: ' m-bg-img', style: '', layer: '<div class="m-bgimg" style="background-image:url(&quot;' + esc(u) + '&quot;)"></div>' };
    if (b === 'gradient') return { cls: ' m-bg-grad', style: 'background:linear-gradient(135deg,color-mix(in srgb,var(--m-accent) 28%,var(--m-bg)),var(--m-bg) 60%,color-mix(in srgb,var(--m-accent2) 22%,var(--m-bg)))', layer: '' };
    if (b === 'accent') return { cls: '', style: 'background:linear-gradient(135deg,var(--m-accent),var(--m-accent2));color:var(--m-on-accent);--m-muted:color-mix(in srgb,var(--m-on-accent) 80%,transparent);--m-text:var(--m-on-accent)', layer: '' };
    if (b === 'surface') return { cls: '', style: 'background:var(--m-surface)', layer: '' };
    if (isColor(b)) return { cls: '', style: 'background:' + b, layer: '' };
    return { cls: '', style: '', layer: '' };
  }

  function parseCount(str) {
    var m = /(-?\d{1,3}(?:[.,]\d{3})+|-?\d+)([.,]\d+)?/.exec(String(str));
    if (!m) return null;
    var intPart = m[1], dec = m[2] || '', thouSep = (intPart.match(/[.,]/) || [''])[0];
    var n = Number(intPart.replace(/[.,]/g, '') + (dec ? '.' + dec.slice(1) : ''));
    if (!isFinite(n)) return null;
    return { pre: String(str).slice(0, m.index), post: String(str).slice(m.index + m[0].length), n: n, dec: dec ? dec.length - 1 : 0, decSep: dec ? dec[0] : (thouSep === '.' ? ',' : '.'), thouSep: thouSep };
  }
  function fmtCount(p, v) {
    var fixed = v.toFixed(p.dec), parts = fixed.split('.');
    var ip = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, p.thouSep || '');
    return p.pre + ip + (p.dec ? p.decSep + parts[1] : '') + p.post;
  }
  function countUp(root) {
    var els = root.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      var p = parseCount(el.getAttribute('data-count'));
      if (!p || p.n === 0) return;
      var t0 = null, dur = 1200;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtCount(p, p.n * e);
        if (k < 1) requestAnimationFrame(step); else el.textContent = el.getAttribute('data-count');
      }
      requestAnimationFrame(step);
    });
  }

  function bindInteractive(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.m-flip'), function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); b.classList.toggle('is-flipped'); });
    });
    Array.prototype.forEach.call(root.querySelectorAll('.m-quiz-opts'), function (box) {
      var ans = Number(box.getAttribute('data-answer')) || 0;
      var fb = box.parentNode.querySelector('.m-feedback');
      box.addEventListener('click', function (e) {
        var b = e.target.closest('.m-opt');
        if (!b) return;
        e.stopPropagation();
        var i = Number(b.getAttribute('data-i'));
        if (i === ans) {
          Array.prototype.forEach.call(box.querySelectorAll('.m-opt'), function (o) { o.classList.remove('is-wrong'); });
          b.classList.add('is-right');
          var exp = fb.getAttribute('data-exp');
          fb.innerHTML = '<b>' + esc(fb.getAttribute('data-ok')) + '</b> ' + md(exp);
        } else {
          b.classList.remove('is-wrong'); void b.offsetWidth; b.classList.add('is-wrong');
          fb.innerHTML = '<b>' + esc(fb.getAttribute('data-no')) + '</b>';
        }
      });
    });
  }

  function renderDeck(p, root, opts) {
    var L = t(p.lang), slides = arr(p.slides), seed = p.title || 'deck';
    var html = '<div class="m-deck" tabindex="0" aria-roledescription="carousel"><div class="m-viewport"><div class="m-stage">';
    slides.forEach(function (s, i) {
      s = s || {};
      s._lang = p.lang;
      var lay = String(s.layout || (i === 0 ? 'title' : 'bullets')).toLowerCase();
      var fn = LAYOUTS[lay] || LAYOUTS.bullets;
      var bg = slideBg(s);
      if (lay === 'image' && (s.imageSide === 'full' || s.fullBleed) && safeUrl(s.image)) { bg = { cls: ' m-bg-img', style: '', layer: '<div class="m-bgimg" style="background-image:url(&quot;' + esc(safeUrl(s.image)) + '&quot;)"></div>' }; }
      if ((lay === 'title' || lay === 'cover') && safeUrl(s.image) && !s.background) { bg = { cls: ' m-bg-img', style: '', layer: '<div class="m-bgimg" style="background-image:url(&quot;' + esc(safeUrl(s.image)) + '&quot;)"></div>' }; }
      var foot = p.footer !== false && lay !== 'title' && lay !== 'cover' ? '<div class="m-foot"><span>' + esc(p.footer || p.title || '') + '</span><span>' + (i + 1) + ' / ' + slides.length + '</span></div>' : '';
      html += '<section class="m-slide m-l-' + esc(lay) + bg.cls + '" style="' + bg.style + '" data-i="' + i + '" aria-label="' + (i + 1) + ' ' + esc(L.of) + ' ' + slides.length + '">' + bg.layer + fn(s, { seed: seed, index: i, lang: p.lang }) + foot + '</section>';
    });
    html += '</div><div class="m-overview" role="dialog" aria-label="' + esc(L.overview) + '"></div></div><div class="m-progress"><i></i></div>';
    html += '<div class="m-bar-ui"><button class="m-btn" data-act="prev" title="' + esc(L.prev) + ' (←)">' + icon('left') + '</button><span class="m-count"></span><button class="m-btn" data-act="next" title="' + esc(L.next) + ' (→)">' + icon('right') + '</button><span class="m-spacer"></span>';
    html += '<button class="m-btn" data-act="overview" title="' + esc(L.overview) + ' (O)">' + icon('grid') + '</button><button class="m-btn" data-act="notes" title="' + esc(L.notes) + ' (N)">' + icon('note') + '</button>';
    (opts.buttons || []).forEach(function (b, k) { html += '<button class="m-btn" data-extra="' + k + '" title="' + esc(b.title || b.label) + '">' + icon(b.icon) + (b.label ? '<span>' + esc(b.label) + '</span>' : '') + '</button>'; });
    html += '<button class="m-btn" data-act="fs" title="' + esc(L.fullscreen) + ' (F)">' + icon('maximize') + '</button></div><div class="m-notes"></div></div>';
    root.innerHTML = html;

    var deck = root.querySelector('.m-deck'), stage = deck.querySelector('.m-stage'), vp = deck.querySelector('.m-viewport');
    var els = Array.prototype.slice.call(stage.querySelectorAll('.m-slide'));
    var bar = deck.querySelector('.m-progress i'), counter = deck.querySelector('.m-count'), notes = deck.querySelector('.m-notes');
    var cur = 0;
    deck.classList.add('m-anim-on');

    function fit() {
      var w = vp.clientWidth, h = vp.clientHeight;
      if (!w || !h) return;
      var sc = Math.min(w / 1280, h / 720);
      stage.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
    }
    function autoshrink() {
      els.forEach(function (el) {
        var body = el.querySelector('.m-body');
        if (!body) return;
        var fs = 1;
        el.style.setProperty('--m-fs', '1');
        for (var k = 0; k < 8 && body.scrollHeight > body.clientHeight + 2; k++) { fs -= 0.06; el.style.setProperty('--m-fs', fs.toFixed(2)); }
      });
    }
    function frags(el) { return Array.prototype.slice.call(el.querySelectorAll('.m-frag')); }
    function show(i, fromBack) {
      i = Math.max(0, Math.min(els.length - 1, i));
      els.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      var fr = frags(els[i]);
      fr.forEach(function (f) { f.classList.toggle('is-shown', !!fromBack); });
      if (fr.length && !fromBack) fr[0].classList.add('is-shown');
      cur = i;
      bar.style.width = ((i + 1) / els.length * 100) + '%';
      counter.textContent = (i + 1) + ' / ' + els.length;
      var n = slides[i] && slides[i].notes;
      notes.innerHTML = n ? md(n) : '<em style="opacity:.6">' + esc(L.noNotes) + '</em>';
      countUp(els[i]);
      // reinicia animações dos gráficos
      Array.prototype.forEach.call(els[i].querySelectorAll('.m-bar,.m-hbar,.m-line,.m-arc'), function (g) { g.style.animation = 'none'; void g.getBoundingClientRect(); g.style.animation = ''; });
      if (opts.onSlide) opts.onSlide(i);
    }
    function next() {
      var fr = frags(els[cur]).filter(function (f) { return !f.classList.contains('is-shown'); });
      if (fr.length) { fr[0].classList.add('is-shown'); return; }
      if (cur < els.length - 1) show(cur + 1);
    }
    function prev() { if (cur > 0) show(cur - 1, true); }
    function toggleOverview() {
      var on = !deck.classList.contains('show-overview');
      if (on) {
        var ov = deck.querySelector('.m-overview');
        ov.innerHTML = '';
        els.forEach(function (el, k) {
          var b = document.createElement('button');
          b.className = 'm-thumb' + (k === cur ? ' is-cur' : '');
          b.type = 'button';
          var inner = document.createElement('div');
          inner.className = 'm-tn';
          var clone = el.cloneNode(true);
          clone.classList.add('is-active');
          inner.appendChild(clone);
          b.appendChild(inner);
          var lab = document.createElement('span'); lab.textContent = k + 1; b.appendChild(lab);
          b.addEventListener('click', function () { deck.classList.remove('show-overview'); show(k); });
          ov.appendChild(b);
        });
        requestAnimationFrame(function () {
          Array.prototype.forEach.call(ov.querySelectorAll('.m-thumb'), function (tb) { tb.querySelector('.m-tn').style.zoom = String(tb.clientWidth / 1280); });
        });
      }
      deck.classList.toggle('show-overview', on);
    }
    function fullscreen() {
      if (opts.onFullscreen) return opts.onFullscreen();
      var el = deck;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    }
    deck.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act],button[data-extra]');
      if (b) {
        var a = b.getAttribute('data-act');
        if (a === 'prev') prev(); else if (a === 'next') next(); else if (a === 'overview') toggleOverview(); else if (a === 'fs') fullscreen();
        else if (a === 'notes') { deck.classList.toggle('show-notes'); b.classList.toggle('is-on'); setTimeout(fit, 0); }
        else if (b.hasAttribute('data-extra')) { var ex = opts.buttons[Number(b.getAttribute('data-extra'))]; if (ex && ex.onClick) ex.onClick(); }
        return;
      }
      if (e.target.closest('a,button,input,textarea,select,.m-overview,.m-notes,.m-pre')) return;
      if (e.target.closest('.m-viewport')) {
        var r = vp.getBoundingClientRect();
        if (e.clientX - r.left < r.width * 0.3) prev(); else next();
      }
    });
    deck.addEventListener('keydown', function (e) {
      if (e.target.closest('input,textarea,select')) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
      else if (k === 'Home') show(0); else if (k === 'End') show(els.length - 1);
      else if (k === 'o' || k === 'O') toggleOverview();
      else if (k === 'n' || k === 'N') { deck.classList.toggle('show-notes'); setTimeout(fit, 0); }
      else if (k === 'f' || k === 'F') fullscreen();
      else if (k === 'Escape') deck.classList.remove('show-overview');
    });
    var tx = null;
    vp.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) { if (dx < 0) next(); else prev(); } tx = null; }, { passive: true });

    bindInteractive(deck);
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(vp); else global.addEventListener('resize', fit);
    fit();
    autoshrink();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { autoshrink(); });
    show(Math.max(0, Math.min(els.length - 1, Number(opts.start) || 0)));
    if (opts.focus !== false) { try { deck.focus({ preventScroll: true }); } catch (e) {} }
    return { el: deck, go: show, next: next, prev: prev, fit: fit, count: els.length, current: function () { return cur; } };
  }

  /* ------------------------------------------------------------------ *
   * Sites
   * ------------------------------------------------------------------ */
  function btn(b, primary) {
    if (!b) return '';
    if (typeof b === 'string') b = { label: b };
    var href = safeUrl(b.url) || (typeof b.url === 'string' && /^#[\w-]+$/.test(b.url) ? b.url : '#');
    return '<a class="' + (primary ? 'm-btn-p' : 'm-btn-s') + '" href="' + esc(href) + '"' + (/^https:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(b.label || '') + (primary ? icon('arrow') : '') + '</a>';
  }
  function avatar(p) {
    var u = safeUrl(p.image || p.avatar);
    if (u) return '<div class="m-avatar"><img src="' + esc(u) + '" alt="" loading="lazy"></div>';
    var ini = String(p.name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
    return '<div class="m-avatar">' + esc(ini) + '</div>';
  }
  function secHead(s) {
    if (!s.title && !s.subtitle && !s.kicker) return '';
    return '<div class="m-sec-head m-rv">' + (s.kicker ? '<div class="m-kicker">' + esc(s.kicker) + '</div>' : '') + (s.title ? '<h2>' + gradTitle(s.title) + '</h2>' : '') + (s.subtitle ? '<p>' + md(s.subtitle) + '</p>' : '') + '</div>';
  }
  function imgOrArt(u, seed, variant, alt) {
    u = safeUrl(u);
    return u ? '<img src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="lazy">' : '<div class="m-art">' + genArt(seed, variant) + '</div>';
  }

  var SECTIONS = {
    hero: function (s, ctx) {
      var badge = s.badge ? '<span class="m-badge">' + icon(s.badgeIcon || 'sparkles') + esc(s.badge) + '</span>' : '';
      var text = badge + (s.kicker ? '<div class="m-kicker">' + esc(s.kicker) + '</div>' : '') + '<h1>' + gradTitle(s.title || ctx.title) + '</h1>' + (s.subtitle ? '<p class="m-lead">' + md(s.subtitle) + '</p>' : '') +
        '<div class="m-ctas">' + btn(s.primaryCta || s.cta, true) + btn(s.secondaryCta, false) + '</div>' + (s.note ? '<small style="color:var(--m-muted)">' + md(s.note) + '</small>' : '');
      if (s.variant === 'split' || s.image) {
        return '<section class="m-hero" id="' + ctx.id + '"><div class="m-art" style="opacity:.5">' + genArt(ctx.seed + 'hero', 'orbs') + '</div><div class="m-wrap"><div class="m-hero-split"><div class="m-hero-c m-rv">' + text + '</div><div class="m-hero-media m-rv" style="--i:2">' + imgOrArt(s.image, ctx.seed + 'hm', s.visual || 'rings', s.alt) + '</div></div></div></section>';
      }
      return '<section class="m-hero" id="' + ctx.id + '"><div class="m-art">' + genArt(ctx.seed + 'hero', s.visual || 'orbs') + '</div><div class="m-wrap"><div class="m-hero-c m-rv">' + text + '</div></div></section>';
    },
    logos: function (s, ctx) {
      return '<section class="m-sec" style="padding:48px 0" id="' + ctx.id + '"><div class="m-wrap">' + (s.title ? '<p class="m-rv" style="text-align:center;color:var(--m-muted);margin-bottom:22px;font-size:14px;letter-spacing:.12em;text-transform:uppercase">' + esc(s.title) + '</p>' : '') + '<div class="m-logos m-rv">' + arr(s.items).map(function (x) { return '<span>' + esc(typeof x === 'object' ? x.name : x) + '</span>'; }).join('') + '</div></div></section>';
    },
    features: function (s, ctx) {
      var it = arr(s.items);
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-grid" style="--cols:' + (s.columns || cols(it.length, it.length === 4 ? 4 : 3)) + '">' + it.map(function (x, i) {
        return '<div class="m-fcard m-rv" style="--i:' + i + '">' + (x.icon ? '<div class="m-card-ico">' + icon(x.icon) + '</div>' : '') + '<h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div></section>';
    },
    split: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap"><div class="m-splitsec' + (s.reverse ? ' m-rev' : '') + '"><div class="m-rv">' + (s.kicker ? '<div class="m-kicker" style="margin-bottom:12px">' + esc(s.kicker) + '</div>' : '') + '<h2>' + gradTitle(s.title || '') + '</h2>' + (s.text ? '<p>' + md(s.text) + '</p>' : '') +
        (s.bullets ? '<ul class="m-checks">' + arr(s.bullets).map(function (b) { return '<li>' + icon('check') + '<span>' + md(b) + '</span></li>'; }).join('') + '</ul>' : '') + (s.cta ? '<div style="margin-top:26px">' + btn(s.cta, true) + '</div>' : '') +
        '</div><div class="m-rv" style="--i:2">' + (s.chart ? chartSvg(s.chart, ctx.lang) : '<div class="m-imgbox">' + imgOrArt(s.image, ctx.seed + ctx.id, s.visual, s.alt) + '</div>') + '</div></div></div></section>';
    },
    stats: function (s, ctx) {
      var st = arr(s.stats || s.items);
      return '<section class="m-sec m-sec-alt" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-sstats" style="--cols:' + cols(st.length, 4) + '">' + st.map(function (x, i) {
        return '<div class="m-sstat m-rv" style="--i:' + i + '"><div class="m-stat-v m-grad-text" data-count="' + esc(x.value) + '">' + esc(x.value) + '</div><div class="m-stat-l">' + md(x.label || '') + '</div></div>';
      }).join('') + '</div></div></section>';
    },
    testimonials: function (s, ctx) {
      var it = arr(s.items);
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-grid" style="--cols:' + cols(it.length, 3) + '">' + it.map(function (x, i) {
        return '<figure class="m-tcard m-rv" style="margin:0;--i:' + i + '">' + (x.rating ? '<div class="m-stars">' + new Array(Math.min(5, Number(x.rating) || 5) + 1).join(icon('star')) + '</div>' : '') + '<blockquote>“' + md(x.quote || x.text || '') + '”</blockquote><figcaption class="m-person">' + avatar(x) + '<div><b>' + esc(x.name || '') + '</b><small>' + esc(x.role || '') + '</small></div></figcaption></figure>';
      }).join('') + '</div></div></section>';
    },
    pricing: function (s, ctx) {
      var it = arr(s.plans || s.items);
      return '<section class="m-sec m-sec-alt" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-grid" style="--cols:' + cols(it.length, 4) + ';align-items:stretch">' + it.map(function (x, i) {
        return '<div class="m-plan m-rv' + (x.highlighted ? ' is-hl' : '') + '" style="--i:' + i + '">' + (x.highlighted ? '<span class="m-plan-tag">' + esc(x.tag || 'Mais popular') + '</span>' : '') + '<h3>' + esc(x.name || '') + '</h3>' + (x.description ? '<p style="color:var(--m-muted);font-size:15px">' + md(x.description) + '</p>' : '') +
          '<div class="m-price">' + esc(x.price || '') + (x.period ? ' <small>' + esc(x.period) + '</small>' : '') + '</div><ul class="m-checks">' + arr(x.features).map(function (f) { return '<li>' + icon('check') + '<span>' + md(f) + '</span></li>'; }).join('') + '</ul>' + btn(x.cta || 'Escolher', !!x.highlighted) + '</div>';
      }).join('') + '</div></div></section>';
    },
    faq: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-faq">' + arr(s.items).map(function (x, i) {
        return '<details class="m-rv" style="--i:' + i + '"' + (i === 0 ? ' open' : '') + '><summary>' + md(x.q || x.question || '') + '</summary><p>' + md(x.a || x.answer || '') + '</p></details>';
      }).join('') + '</div></div></section>';
    },
    steps: function (s, ctx) {
      var it = arr(s.items || s.steps);
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-ssteps" style="--cols:' + cols(it.length, 4) + '">' + it.map(function (x, i) {
        return '<div class="m-step m-rv" style="--i:' + i + '"><div class="m-step-n">' + (x.icon ? icon(x.icon) : i + 1) + '</div><h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div></section>';
    },
    timeline: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-vtl">' + arr(s.items).map(function (x, i) {
        return '<div class="m-vtl-i m-rv" style="--i:' + i + '"><div class="m-tl-d">' + esc(x.date || x.label || '') + '</div><h3>' + md(x.title || '') + '</h3>' + (x.text ? '<p>' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div></section>';
    },
    gallery: function (s, ctx) {
      var it = arr(s.images || s.items);
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-gallery" style="--cols:' + (s.columns || 3) + '">' + it.map(function (x, i) {
        var o = typeof x === 'string' ? { image: x } : (x || {});
        return '<figure class="m-rv" style="--i:' + i + '">' + imgOrArt(o.image || o.url, ctx.seed + 'g' + i, null, o.caption) + (o.caption ? '<figcaption>' + md(o.caption) + '</figcaption>' : '') + '</figure>';
      }).join('') + '</div></div></section>';
    },
    cta: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap"><div class="m-ctaband m-rv"><div class="m-art">' + genArt(ctx.seed + 'cta', 'rings') + '</div><h2 style="position:relative">' + md(s.title || '') + '</h2>' + (s.text || s.subtitle ? '<p style="position:relative">' + md(s.text || s.subtitle) + '</p>' : '') + '<div class="m-ctas" style="position:relative">' + btn(s.button || s.cta || s.primaryCta, true) + '</div></div></div></section>';
    },
    contact: function (s, ctx) {
      var L = t(ctx.lang);
      var fields = arr(s.fields).length ? arr(s.fields) : [{ name: 'nome', label: 'Nome' }, { name: 'email', label: 'E-mail', type: 'email' }, { name: 'mensagem', label: 'Mensagem', type: 'textarea' }];
      var action = safeUrl(s.action);
      return '<section class="m-sec m-sec-alt" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<form class="m-form m-rv"' + (action ? ' action="' + esc(action) + '" method="post" target="_blank"' : ' data-demo="1"') + '>' + fields.map(function (f) {
        var nm = esc(f.name || slug(f.label)), lb = esc(f.label || f.name || '');
        if (f.type === 'textarea') return '<label>' + lb + '<textarea name="' + nm + '" rows="4"' + (f.required ? ' required' : '') + ' placeholder="' + esc(f.placeholder || '') + '"></textarea></label>';
        if (f.type === 'select') return '<label>' + lb + '<select name="' + nm + '">' + arr(f.options).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>';
        return '<label>' + lb + '<input name="' + nm + '" type="' + esc(/^(email|tel|text|number|date|url)$/.test(f.type) ? f.type : 'text') + '"' + (f.required ? ' required' : '') + ' placeholder="' + esc(f.placeholder || '') + '"></label>';
      }).join('') + '<button class="m-btn-p" type="submit" style="justify-content:center">' + esc(s.button || L.send) + '</button><div class="m-form-msg" aria-live="polite"></div></form></div></section>';
    },
    chart: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-rv" style="max-width:900px;margin:0 auto">' + chartSvg(s.chart, ctx.lang) + (s.source ? '<p style="color:var(--m-muted);font-size:14px;margin-top:12px;text-align:center">' + md(s.source) + '</p>' : '') + '</div></div></section>';
    },
    team: function (s, ctx) {
      var it = arr(s.items || s.people);
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + '<div class="m-team" style="--cols:' + cols(it.length, 4) + '">' + it.map(function (x, i) {
        return '<div class="m-rv" style="--i:' + i + '">' + avatar(x) + '<b>' + esc(x.name || '') + '</b><small>' + esc(x.role || '') + '</small>' + (x.text ? '<p style="color:var(--m-muted);font-size:15px;margin-top:8px">' + md(x.text) + '</p>' : '') + '</div>';
      }).join('') + '</div></div></section>';
    },
    text: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap" style="max-width:760px">' + secHead(s) + '<div class="m-rv" style="font-size:18px;line-height:1.75;display:grid;gap:18px">' + arr(s.paragraphs || s.text).map(function (p) { return '<p>' + md(p) + '</p>'; }).join('') + '</div></div></section>';
    },
    html: function (s, ctx) {
      return '<section class="m-sec" id="' + ctx.id + '"><div class="m-wrap">' + secHead(s) + String(s.html || '') + '</div></section>';
    },
    footer: function (s, ctx) {
      return '<footer class="m-footer" id="' + ctx.id + '"><div class="m-wrap"><span>' + md(s.text || ('© ' + new Date().getFullYear() + ' ' + (ctx.brand || ctx.title || ''))) + '</span><nav>' + arr(s.links).map(function (l) {
        var o = typeof l === 'string' ? { label: l } : l;
        var href = safeUrl(o.url) || '#';
        return '<a href="' + esc(href) + '"' + (/^https:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(o.label || '') + '</a>';
      }).join('') + '</nav></div></footer>';
    }
  };
  SECTIONS.process = SECTIONS.steps;
  SECTIONS.about = SECTIONS.split;
  SECTIONS.content = SECTIONS.text;
  SECTIONS.form = SECTIONS.contact;
  SECTIONS.newsletter = SECTIONS.cta;

  function renderSite(p, root, opts) {
    var L = t(p.lang), seed = p.title || 'site';
    var secs = arr(p.sections), nav = p.nav || {};
    var used = {};
    var ids = secs.map(function (s, i) { var id = slug((s && (s.id || s.navLabel || s.title)) || (s && s.type) || ('s' + i)); while (used[id]) id += '-' + i; used[id] = 1; return id; });
    var links = arr(nav.links);
    if (!links.length) secs.forEach(function (s, i) { if (s && s.navLabel) links.push({ label: s.navLabel, url: '#' + ids[i] }); });
    var brand = nav.brand || p.brand || p.title || '';
    var navHtml = nav === false ? '' : '<header class="m-nav"><div class="m-wrap"><a class="m-brand" href="#top"><span class="m-brand-mark">' + (nav.icon ? icon(nav.icon) : esc(String(brand).trim().charAt(0).toUpperCase())) + '</span>' + esc(brand) + '</a><nav class="m-links">' +
      links.map(function (l) { var o = typeof l === 'string' ? { label: l, url: '#' + slug(l) } : l; var href = safeUrl(o.url) || (/^#[\w-]+$/.test(o.url || '') ? o.url : '#'); return '<a href="' + esc(href) + '">' + esc(o.label || '') + '</a>'; }).join('') +
      (nav.cta ? btn(nav.cta, true) : '') + '</nav><button class="m-btn m-burger" type="button" aria-label="' + esc(L.menu) + '">' + icon('menu') + '</button></div></header>';
    var body = secs.map(function (s, i) {
      s = s || {};
      var fn = SECTIONS[String(s.type || 'text').toLowerCase()] || SECTIONS.text;
      return fn(s, { id: ids[i], seed: seed, lang: p.lang, title: p.title, brand: brand });
    }).join('');
    if (!secs.some(function (s) { return s && s.type === 'footer'; })) body += SECTIONS.footer({}, { id: 'rodape', title: p.title, brand: brand });
    root.innerHTML = '<div class="m-site" id="top">' + navHtml + '<main>' + body + '</main></div>';

    var site = root.querySelector('.m-site');
    var scroller = opts.scrollRoot || null;
    var burger = site.querySelector('.m-burger');
    if (burger) burger.addEventListener('click', function () { site.querySelector('.m-nav').classList.toggle('is-open'); });
    site.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      e.preventDefault();
      site.querySelector('.m-nav') && site.querySelector('.m-nav').classList.remove('is-open');
      var target = id && id !== 'top' ? site.querySelector('#' + (global.CSS && global.CSS.escape ? global.CSS.escape(id) : id)) : site;
      if (!target) return;
      var sc = scroller || document.scrollingElement || document.documentElement;
      var navH = (site.querySelector('.m-nav') || { offsetHeight: 0 }).offsetHeight;
      var top = target.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0) + sc.scrollTop - (target === site ? 0 : navH);
      sc.scrollTo({ top: top, behavior: 'smooth' });
    });
    Array.prototype.forEach.call(site.querySelectorAll('form[data-demo]'), function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); f.querySelector('.m-form-msg').textContent = L.sent; });
    });
    var rv = site.querySelectorAll('.m-rv');
    if (typeof IntersectionObserver !== 'undefined') {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            var host = en.target.closest('.m-sec') || en.target;
            if (!host.__counted) { host.__counted = 1; countUp(host); }
            if (en.target.querySelector('.m-chart')) en.target.classList.add('m-anim-on');
            io.unobserve(en.target);
          }
        });
      }, { root: scroller, threshold: 0.12 });
      Array.prototype.forEach.call(rv, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(rv, function (el) { el.classList.add('is-in', 'm-anim-on'); });
    }
    return { el: site };
  }

  /* ------------------------------------------------------------------ *
   * API pública
   * ------------------------------------------------------------------ */
  function render(payload, root, opts) {
    opts = opts || {};
    if (!payload || !root) throw new Error('Mythos.render: payload e root são obrigatórios');
    var kind = payload.kind || (payload.slides ? 'slides' : payload.sections ? 'site' : payload.html ? 'html' : 'slides');
    var th = resolveTheme(payload.theme);
    injectCss(root.ownerDocument, th);
    root.classList.add('m-root');
    root.setAttribute('style', (root.getAttribute('style') || '').replace(/--m-[^;]+;?|color-scheme:[^;]+;?/g, '') + ';' + themeVars(th));
    if (kind === 'site') return renderSite(payload, root, opts);
    if (kind === 'html') {
      root.innerHTML = String(payload.html || '');
      return { el: root };
    }
    return renderDeck(payload, root, opts);
  }

  // Gera um HTML autocontido (motor + conteúdo) para baixar e abrir offline.
  function standalone(payload, engineSource) {
    var title = esc(payload.title || 'Mythos');
    if (payload.kind === 'html') return String(payload.html || '');
    var LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029), BS = String.fromCharCode(92);
    var data = JSON.stringify(payload).split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
    var full = payload.kind === 'slides';
    return '<!doctype html>\n<html lang="' + esc(payload.lang || 'pt-BR') + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
      '<style>html,body{margin:0;height:' + (full ? '100%' : 'auto') + '}#app{' + (full ? 'height:100vh' : 'min-height:100vh') + '}@media print{#app{height:auto}}</style></head><body><div id="app"></div>' +
      '<script>' + String(engineSource).replace(/<\/script/gi, '<\\/script') + '<\/script><script>Mythos.render(' + data + ',document.getElementById("app"),{});<\/script></body></html>';
  }

  global.Mythos = { version: VERSION, render: render, standalone: standalone, themes: Object.keys(THEMES), icons: Object.keys(ICONS), chartSvg: chartSvg, genArt: genArt };
})(typeof window !== 'undefined' ? window : globalThis);
