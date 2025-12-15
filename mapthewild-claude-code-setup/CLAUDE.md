# Map the Wild

Tools for thinking — software that changes how you think, not just what you capture.

## Commands

- `npm run dev` — Start dev server at localhost:4321
- `npm run build` — Production build
- `npm test` — Run tests

## Stack

Astro, TypeScript, Tailwind CSS

## Key Patterns

- Notes are markdown in `src/content/notes/`
- Stacking panes UI (Andy Matuschak style) — see rules when editing pane components

## When Working on Stacking Panes

Read `docs/stacking-panes.md` before making changes. Previous attempts using flexbox failed repeatedly. The correct pattern uses absolute positioning.
