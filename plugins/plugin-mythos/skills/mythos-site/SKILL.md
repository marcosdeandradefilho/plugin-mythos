---
name: mythos-site
description: Create a website, landing page, sales page, portfolio, event page or institutional page and render it live in the chat with Mythos (responsive, animated, with nav, hero, features, pricing, FAQ, testimonials, forms, shareable link and HTML download). Use whenever the user asks for a site, "site", "landing page", "página de vendas", "página" or similar.
---

# Mythos Site

Explicit user instructions always override the defaults below.

## Inputs to settle first
- What is offered, for whom, and the single action the visitor should take.
- Brand name, colors or fonts if the user has them (use a custom `theme` object: `{"base":"minimal","accent":"#hex","accent2":"#hex","headingFont":"Google Font"}`).
- Language: the user's language unless they ask otherwise.
Ask one short question only if the offer itself is unknown.

## Workflow
1. Call `mythos_design_brief` with `kind: "site"`. Pick the matching structure (produto, curso, evento, portfolio, institucional) and adapt it.
2. Write real copy: a hero promise in ≤ 10 words, a concrete subtitle, benefits (not features), objections answered in the FAQ, and one clear call to action repeated at the end.
3. Add `navLabel` to the 3-5 sections that belong in the menu, and point CTA buttons at `#section-id` anchors or real https URLs.
4. Call `mythos_render_site` with the complete page (`title`, `theme`, `lang`, `nav`, `sections`). See `references/site-example.json`.
5. Fix every item in `warnings` and render again before replying.
6. Reply with the shareable link (`viewUrl`), the section outline, and 2-3 refinement offers (copy variant, theme, extra section, real form endpoint).

## Honesty rules
- Never invent testimonials from real people, client logos, awards or numbers. Use the user's data; otherwise label examples clearly (e.g. "exemplo") or omit the section.
- Contact forms only deliver messages with an `action` URL (for example a Formspree endpoint the user owns). Without it, tell the user the form is a demo.
- Do not invent image URLs; use generative `visual` art, icons and charts unless the user supplied images.

## Without the Mythos tools
If the `mythos_*` tools are unavailable, say so in one line and produce one self-contained responsive HTML file with the same structure.
