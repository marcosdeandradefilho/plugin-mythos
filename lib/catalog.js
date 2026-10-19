// Catálogo compartilhado: temas, layouts, seções e domínios liberados no widget.

export const THEMES = {
  aurora: 'Dark, violet→cyan gradients, Sora/Inter. Tech, AI, startups, keynotes.',
  editorial: 'Light warm paper, Fraunces serif + DM Sans. Essays, culture, literature, journalism, storytelling.',
  noir: 'Pure black, red/yellow accents, Bricolage Grotesque. Bold manifestos, fashion, film, high-impact pitches.',
  minimal: 'White, near-black, Inter. Clean corporate, product docs, consulting, Apple-like restraint.',
  oceano: 'Deep navy, sky/emerald accents, Space Grotesk/Manrope. Science, data, climate, health, engineering.',
  solar: 'Warm cream, orange/rose, Outfit. Marketing, food, events, kids, energetic and friendly brands.',
  terra: 'Earthy beige, olive/ochre, Instrument Serif. Sustainability, wellness, architecture, crafts, slow living.',
  neon: 'Near-black purple, pink/cyan neon. Gaming, music, nightlife, creators, Gen-Z launches.',
  academia: 'Light lavender-white, indigo/teal, Playfair Display + Source Sans 3. Classes, lectures, research, theses.',
  corporate: 'Slate-white, blue accents, Manrope/Inter. Reports, quarterly reviews, B2B, finance, sales decks.'
};
export const THEME_NAMES = Object.keys(THEMES);

export const SLIDE_LAYOUTS = {
  title: 'Opening slide. title (wrap a word in {braces} for gradient), subtitle, kicker, author, date, event, image (optional full-bleed photo).',
  section: 'Section divider. number (e.g. "01"), title, subtitle.',
  agenda: 'Numbered agenda. title, items: string[] (3-7).',
  bullets: 'Core content. title, text (lead sentence), bullets: (string | {text, icon, detail})[] max 6, reveal: true for click-by-click; add image/chart/visual for a split layout.',
  statement: 'One huge sentence for a key message. title (use {braces} for gradient), kicker, subtitle.',
  quote: 'Big quotation. quote, author, role.',
  stats: 'Big animated numbers. title, stats: {value:"87%", label, detail}[] (2-4), text.',
  chart: 'Data visualization. title, chart: {type: bar|line|area|pie|donut|hbar, labels, series:[{name, values}]} or {type, data:[{label,value}]}, prefix/suffix, text (the insight), bullets, source.',
  timeline: 'Horizontal timeline. title, items: {date, title, text}[] (3-6).',
  steps: 'Process / how-it-works. title, items: {title, text, icon}[] (3-5).',
  cards: 'Grid of cards. title, cards: {icon, title, text, back?}[] (2-6). flip: true makes interactive flashcards (text on front, back on reverse).',
  comparison: 'Side-by-side. title, left: {heading, icon, text, bullets}, right: {...}, vs: false to hide the VS badge.',
  table: 'Styled table. title, columns: string[], rows: string[][], highlightColumn: index, source.',
  image: 'Image-led. title, text, image (https URL), imageSide: left|right|full, caption. Without image, a generative visual is drawn.',
  code: 'Syntax-highlighted code. title, code, language, text.',
  quiz: 'Interactive multiple choice. question, options: string[] (2-6), answer: index of correct option, explanation.',
  closing: 'Final slide. title, subtitle, cta: {label, url}, contact: string[].',
  html: 'Escape hatch: custom HTML fragment inside the slide frame. title, html. Use sparingly.'
};
export const SLIDE_LAYOUT_NAMES = Object.keys(SLIDE_LAYOUTS);

export const SITE_SECTIONS = {
  hero: 'Top hero. title ({braces} for gradient), subtitle, badge, kicker, primaryCta {label,url}, secondaryCta, note, image (switches to split), variant: "split".',
  logos: 'Social proof strip. title, items: string[] (brand names as text).',
  features: 'Feature grid. title, subtitle, kicker, items: {icon, title, text}[] (3-6), columns.',
  split: 'Text + image/chart. title, text, bullets: string[], cta, image or chart, reverse: true, kicker.',
  stats: 'Animated numbers band. title, stats: {value, label}[] (2-4).',
  steps: 'How it works. title, items: {title, text, icon}[] (3-4).',
  timeline: 'Vertical timeline. title, items: {date, title, text}[].',
  testimonials: 'Quotes. title, items: {quote, name, role, rating, image}[] (2-3). Never invent real people: use clearly fictional or user-provided testimonials.',
  pricing: 'Plans. title, plans: {name, price, period, description, features: string[], cta, highlighted, tag}[] (2-4).',
  faq: 'Accordion. title, items: {q, a}[] (4-8).',
  gallery: 'Image grid. title, images: {image, caption}[] or string[], columns.',
  team: 'People. title, items: {name, role, text, image}[].',
  chart: 'Data section. title, subtitle, chart (same format as slides), source.',
  text: 'Long-form prose. title, paragraphs: string[].',
  cta: 'Gradient call-to-action band. title, text, button {label, url}.',
  contact: 'Form. title, subtitle, fields: {name, label, type: text|email|tel|textarea|select, required, options}[], action: https URL that receives POST (e.g. Formspree). Without action it is a demo form.',
  html: 'Escape hatch: custom HTML fragment. title, html.',
  footer: 'Footer. text, links: {label, url}[]. Added automatically when omitted.'
};
export const SITE_SECTION_NAMES = Object.keys(SITE_SECTIONS);

export const VISUALS = ['orbs', 'waves', 'grid', 'dots', 'rings'];

export const ICON_NAMES = ['check', 'star', 'zap', 'shield', 'rocket', 'target', 'users', 'chart', 'trending', 'globe', 'heart', 'book', 'clock', 'lock', 'cloud', 'code', 'sparkles', 'lightbulb', 'message', 'layers', 'trophy', 'compass', 'leaf', 'camera', 'cpu', 'graduation', 'dollar', 'mail', 'phone', 'pin', 'play', 'arrow', 'calendar', 'search', 'settings', 'smile', 'flag', 'alert', 'home', 'briefcase', 'pen', 'eye', 'refresh', 'cart', 'quote'];

// Domínios externos que o widget pode carregar dentro do ChatGPT (CSP do recurso).
// No link compartilhável (/view) não há essa restrição.
export const RESOURCE_DOMAINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net',
  'https://cdnjs.cloudflare.com',
  'https://unpkg.com',
  'https://esm.sh',
  'https://cdn.tailwindcss.com',
  'https://images.unsplash.com',
  'https://plus.unsplash.com',
  'https://picsum.photos',
  'https://fastly.picsum.photos',
  'https://upload.wikimedia.org',
  'https://images.pexels.com',
  'https://cdn.pixabay.com',
  'https://i.imgur.com',
  'https://raw.githubusercontent.com',
  'https://placehold.co',
  'https://api.dicebear.com'
];
