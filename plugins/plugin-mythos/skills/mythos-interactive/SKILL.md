---
name: mythos-interactive
description: Create interactive experiences rendered live in the chat with Mythos - scored quizzes, flashcards, simulations, calculators, games, data dashboards, interactive slides or any fully custom HTML page. Use when the user asks for something interactive, "quiz", "jogo", "simulação", "flashcards", "dashboard", "slides interativos" or a design the structured slide/site renderers cannot express.
---

# Mythos Interactive

Explicit user instructions always override the defaults below.

## Choose the renderer
- Flashcards or a few check-questions inside a lesson → `mythos_render_slides` with `cards` (`flip: true`) and `quiz` slides.
- A page with charts and numbers → `mythos_render_site` with `stats` and `chart` sections.
- Anything with custom logic, scoring, timers, sliders, drag and drop, canvas or a bespoke look → `mythos_render_html`.

## Workflow for `mythos_render_html`
1. Call `mythos_design_brief` with `kind: "interactive"` and follow its HTML rules.
2. Write one complete, self-contained document: `<!doctype html>`, inline `<style>` and `<script>`, CSS variables for the palette, a real type scale. Libraries only from cdn.jsdelivr.net, cdnjs.cloudflare.com, unpkg.com or esm.sh, with pinned versions.
3. Build every state: start, in progress, feedback, end/score, restart. Support keyboard and touch, visible focus, `prefers-reduced-motion`, and widths from 360 px to fullscreen.
4. Do not use network requests, `alert`, `prompt` or `confirm` (blocked in the ChatGPT sandbox). Wrap `localStorage` in try/catch.
5. Call `mythos_render_html` with `title`, `html` and `purpose`. Fix every `warning` and render again.
6. Reply with the shareable link (`viewUrl`), how to use the experience in one or two lines, and refinement offers.

## Content accuracy
Quiz answers and explanations must be correct; double-check each one before rendering. Do not invent facts or data; label illustrative data as such.

## Without the Mythos tools
If the `mythos_*` tools are unavailable, say so in one line and deliver the same self-contained HTML document for the user to save and open.
