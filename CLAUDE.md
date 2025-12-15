# Map the Wild

Astro blog with custom bracket syntax for embedding Claude artifacts.

## Commands

```bash
npm run dev      # localhost:4321
npm run build    # Production build
npm run preview  # Preview build
```

## Key Files

- `src/content/posts/*.mdx` — Blog posts
- `src/components/StackingPanes.tsx` — Pane UI + artifact registry
- `src/lib/bracketParser.ts` — `[[word:id]]` syntax parser

## Adding Artifacts

1. Add to `ARTIFACT_REGISTRY` in `StackingPanes.tsx`:
   ```typescript
   'my-id': 'https://claude.site/public/artifacts/xxx/embed',
   ```
2. Use in MDX: `[[Display Text:my-id]]`

## Content Types

| Syntax | Behavior |
|--------|----------|
| `[[text:artifact-id]]` | Opens in stacking pane |
| `[[text:post-slug]]` | Opens internal post in pane |
| `[[text:https://...]]` | Opens external site |

## Gotchas

- **Stacking panes use absolute positioning** — flexbox attempts failed. Read `docs/stacking-panes.md` before changes.
- **Claude artifacts need domain allowlist** — localhost won't embed. Deploy to test embeds.
- **EXTERNAL_APPS open in new tab** — magicpatterns.app blocks iframes

## Full Context

See `../docs/PROJECT_CONTEXT.md` for detailed architecture.
