# Map the Wild

Astro blog with custom bracket syntax for embedding Claude artifacts.

**Workspace philosophy**: See [../CLAUDE.md - Philosophy & Craft](../CLAUDE.md#philosophy--craft)

## Communication Style

The person working on this project is **not a coder** — explain things in plain language:

- **Avoid jargon** without explaining it first
- **Use analogies** when introducing technical concepts
- **Define terms** like "slug" (URL-friendly version of a title), "component" (reusable piece of UI), etc.
- **Show before/after** examples when explaining changes
- **Ask clarifying questions** rather than assuming technical knowledge

Think of responses as teaching moments, not just task completion.

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
- `src/pages/posts/[slug]/embed.astro` — Post content for stacking panes (separate styling context!)
- `map-the-wild-complete-design-system.html` — Design system reference (colors, typography, components)

### Styling Contexts (Important!)

When updating visual styling, check ALL THREE contexts:

| Context | File | What it styles |
|---------|------|----------------|
| Main site | `src/styles/global.css` | Regular page views |
| Pane chrome | `src/components/StackingPanes.tsx` | Headers, spines, buttons |
| Pane content | `src/pages/posts/[slug]/embed.astro` | Post content inside iframes |

The embed template is a **separate document** loaded in an iframe — changes to global.css don't affect it.

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

- **Astro scoped styles don't reach MDX content** — Use `:global(.class)` for styles that need to apply to rendered MDX content (like `.bracket-link`, `.prose` children)
- **Stacking panes require pane-level sticky** — The entire pane div must be `position: sticky`, NOT just the spine. If only the spine is sticky, it moves visually but doesn't push sibling content, causing overlap. Each pane sticks at `left: index * PEEK_WIDTH` so later panes overlap earlier ones.
- **Claude artifacts need domain allowlist** — localhost won't embed. Deploy to test embeds.
- **TRUSTED_ORIGINS must match deployment** — If site moves to new domain, update `TRUSTED_ORIGINS` in StackingPanes.tsx or postMessage from iframes will be rejected.
- **EXTERNAL_APPS open in new tab** — magicpatterns.app blocks iframes

## Code Style

- **Framework**: Astro with React islands
- **TypeScript**: Used where configured
- **Styling**: Tailwind CSS only, no custom CSS
- **No semicolons**: Follow workspace standard
- **Components**: Functional React components with TypeScript
- See [../STYLE_GUIDE.md](../STYLE_GUIDE.md) for full conventions

## Testing Strategy

### Not Yet Implemented
To add testing for MDX parsing and artifact embedding:

```bash
npm install -D vitest @astro/check
```

### Priority Tests to Write
1. **Bracket parser**: Test `bracketParser.ts` with various inputs
2. **Artifact registry**: Validate artifact IDs resolve correctly
3. **MDX rendering**: Ensure posts render with artifacts
4. **Link behavior**: Test internal vs external vs artifact links

## Development Workflow

### Before Making Changes
1. Read this CLAUDE.md file
2. Review [../STYLE_GUIDE.md](../STYLE_GUIDE.md)
3. If modifying artifacts: check `StackingPanes.tsx` ARTIFACT_REGISTRY
4. If modifying parsing: check `lib/bracketParser.ts`
5. Start dev server: `npm run dev`

### After Changes
1. Test in browser at `localhost:4321`
2. Check console for errors
3. Test artifact embeds (may need deployed environment)
4. Run `npm run build` to check for build errors
5. Commit with message: `feat(mapthewild): [description]`
6. Push to remote: `git push`

### Adding a New Blog Post
1. Create MDX file in `src/content/posts/your-post.mdx`
2. Add frontmatter (title, date, description, tags)
3. Write content using markdown
4. Embed artifacts with `[[Display Text:artifact-id]]` syntax
5. Preview locally (note: Claude embeds require deployed site)
6. Commit and deploy to test embeds

## Common Tasks

### Adding a Claude Artifact
1. Publish artifact to Claude, get public embed URL
2. Extract artifact ID from URL (last segment)
3. Add to `ARTIFACT_REGISTRY` in `StackingPanes.tsx`:
   ```typescript
   'my-artifact-id': 'https://claude.site/public/artifacts/xxx/embed',
   ```
4. Use in MDX: `[[Descriptive Text:my-artifact-id]]`
5. Deploy to test (localhost won't work for Claude embeds)

### Modifying Bracket Syntax Parsing
**Files to check first:**
- `src/lib/bracketParser.ts` - Core parsing logic
- `src/components/StackingPanes.tsx` - Rendering and registry
- `src/content/posts/*.mdx` - Example usage

**Testing checklist:**
- Test with artifact IDs: `[[text:artifact-id]]`
- Test with post slugs: `[[text:post-slug]]`
- Test with URLs: `[[text:https://example.com]]`
- Test with special characters in text
- Test malformed syntax (should gracefully fail)

### Adding a New Territory
1. Create territory page: `src/pages/islands/<territory-name>.astro`
2. Add to homepage grid: `src/pages/index.astro`
3. Add to Territories listing: `src/pages/islands/index.astro` (in `islandMeta`)
4. Test both pages show the new territory

### Debugging Embed Issues
**Where to look:**
- ARTIFACT_REGISTRY in `StackingPanes.tsx` - verify ID exists
- Browser console - check for CSP or iframe errors
- Deployment - Claude embeds blocked on localhost
- Domain allowlist - Claude requires specific domains

**Common causes:**
- Artifact ID not in registry
- Testing on localhost (deploy first)
- CSP blocking iframe embeds
- Incorrect embed URL format

## Adding React Islands

When adding React components as Astro client islands:

1. **Use `import type` for type-only imports** — TypeScript interfaces are erased at runtime. In ESM, importing them as values causes runtime errors.
   ```typescript
   // ❌ Will fail at runtime
   import { MyComponent, MyType } from './file'

   // ✅ Correct
   import { MyComponent } from './file'
   import type { MyType } from './file'
   ```

2. **Use default exports** — Astro's `client:only` works best with default exports

3. **Test in browser, not just build** — Build warnings often become runtime errors

4. **Check image paths** — Use `/mapthewild/` prefix for public assets (due to base path config)

## Deployment Considerations

- **Claude embeds**: Require deployed site, won't work on localhost
- **Image paths**: Public images served from `/images/`
- **Build check**: Always run `npm run build` before deploying
- **Astro check**: Run `npx astro check` for type errors

## Full Context

See `../docs/PROJECT_CONTEXT.md` for detailed architecture and `../STYLE_GUIDE.md` for workspace conventions.
