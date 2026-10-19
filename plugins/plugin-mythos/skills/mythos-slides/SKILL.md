---
name: mythos-slides
description: Create a presentation, slide deck, lecture, class, pitch, report or talk and render it live in the chat with Mythos (animated layouts, charts, quizzes, flip cards, speaker notes, shareable link, HTML download and PDF). Use whenever the user asks for slides, a presentation, a deck, "apresentação", "slides", "aula em slides" or similar.
---

# Mythos Slides

Explicit user instructions (length, tone, language, theme, structure) always override the defaults below.

## Inputs to settle first
- Topic, audience and goal (inform, teach, persuade, sell, report).
- Length: default 8-12 slides when the user gives none.
- Language: the user's language unless they ask otherwise.
Ask one short question only when the topic itself is missing. Otherwise infer the rest and state your assumptions in one line at the end.

## Workflow
1. Call `mythos_design_brief` with `kind: "slides"`, the topic, audience, goal and language. Follow its method.
2. Write the full script before rendering: one big idea, a narrative arc, assertion titles (≤ 10 words), max 6 bullets of ≤ 15 words, and `notes` with what the presenter says on every content slide.
3. Turn content into the right layout: numbers → `stats` or `chart`; sequences → `steps` or `timeline`; contrasts → `comparison`; definitions → `cards` with `flip: true`; checks for understanding → `quiz`; one key message → `statement`. Never put three identical layouts in a row.
4. Call `mythos_render_slides` with the complete deck (`title`, `theme`, `lang`, `slides`). See `references/deck-example.json` for a valid example.
5. Read `warnings` in the result. If there are any, fix the content and call `mythos_render_slides` again with the full corrected deck.
6. Reply with: the shareable link (`viewUrl`), a 2-3 line outline, and 2-3 concrete refinement offers (e.g. "add a quiz after slide 5", "switch to the editorial theme", "make it 5 minutes shorter").

## Facts and sources
- Do not invent statistics, quotes, dates or citations. Use well-established facts; when a number is only illustrative, say so on the slide (e.g. `detail: "exemplo ilustrativo"`).
- Do not invent image URLs. Use `visual` (orbs, waves, grid, dots, rings), icons and charts unless the user supplied images.

## Edits
Rendering is stateless: to change anything, re-send the whole deck with the change applied.

## Without the Mythos tools
If the `mythos_*` tools are unavailable, say so in one line and produce a single self-contained HTML file with the same structure (16:9 slides, keyboard navigation, progress bar), so the user still gets a working deck.
