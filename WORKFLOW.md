# Map the Wild - Posting Workflow

## Where Posts Live

```
mapthewild/src/content/posts/
```

Each post is an `.mdx` file with frontmatter.

## Post Format

```mdx
---
title: "Your Post Title"
date: 2025-12-14
description: "One sentence description"
---

Your content here. Markdown works.

You can embed artifacts:

<iframe
  src="https://claude.site/artifacts/YOUR_ID/embed"
  width="100%"
  height="600"
/>
```

## How to Create a Post

### Option 1: Via Claude Code

Tell me:
- Post title
- Content (paste from Claude Desktop or write here)
- Any artifact URLs to embed

I'll create the file, commit, and push. Deploys in ~60 seconds.

### Option 2: Manually

1. Create file: `src/content/posts/YYYY-MM-DD-slug.mdx`
2. Add frontmatter (title, date, description)
3. Write content
4. Commit and push:
   ```bash
   cd mapthewild
   git add .
   git commit -m "Add post: Title"
   git push
   ```

## How Claude Code Knows the Date

The system prompt includes today's date in `<env>`. When creating posts, I use that date for the frontmatter.

Current date format: `YYYY-MM-DD` (e.g., 2025-12-14)

## Post Types

### Standard Posts
Use regular MDX frontmatter (see Post Format above).

### Prototype Posts
Use the `PrototypePost` component for consistent prototype/tool showcase format:

```mdx
---
title: "Your Prototype Name"
date: 2025-12-20
description: "One-sentence description"
draft: false
---

import PrototypePost from '../../components/PrototypePost.astro'

<PrototypePost
  title="Your Prototype Name"
  tagline="A compelling one-liner about what it does"
  artifactId="your-artifact-id"
  artifactLabel="Tool Name"
  builtDate="December 2024"
  status="Complete"
  projectUrl="https://github.com/username/project"
>

## What It Does
[Content here...]

## Why I Built It
[Content here...]

## What I Learned
[Content here...]

</PrototypePost>
```

**Template available:** `src/content/posts/_prototype-template.mdx`

**PrototypePost Props:**
- `title` - Prototype name (required)
- `tagline` - One-sentence description (required)
- `artifactId` - Claude artifact ID (optional)
- `artifactLabel` - Display text for artifact link (optional)
- `builtDate` - When built, e.g. "December 2024" (optional)
- `status` - "Complete", "In Progress", or "Experimental" (optional)
- `projectUrl` - GitHub repo or live URL (optional)

## Embedding Artifacts

### Via PrototypePost Component
Use `artifactId` and `artifactLabel` props - automatically creates bracket link.

### Direct Embedding (Advanced)
Keep artifacts on claude.site. Embed via iframe:
```html
<iframe
  src="https://claude.site/artifacts/ID/embed"
  width="100%"
  height="600"
/>
```

### Static HTML Artifacts
Can extract code and host on GitHub Pages later if needed.

## Deployment

Automatic via GitHub Actions:
1. Push to `main` branch
2. Action builds Astro site
3. Deploys to GitHub Pages
4. Live at: https://mapthewild.github.io/mapthewild/

Build time: ~60 seconds

## RSS Feed

The blog has an RSS feed at `/rss.xml`:
- **Local dev:** http://localhost:4321/mapthewild/rss.xml
- **Production:** https://mapthewild.github.io/mapthewild/rss.xml

The feed includes all published posts (drafts excluded) with:
- Title
- Description
- Publication date
- Full post link

Updates automatically on each build.

## Substack Cross-posting

With RSS feed in place, you can:
1. Subscribe to RSS feed in feed readers
2. Use RSS-to-email services
3. Manually pull recent posts for newsletters
4. Automate cross-posting to Substack (future)

For now: manual copy-paste from live site to Substack when ready.

## File Structure

```
mapthewild/
├── src/
│   ├── content/
│   │   └── posts/           ← Your posts go here
│   │       └── example.mdx
│   ├── pages/
│   │   └── index.astro      ← Homepage
│   └── layouts/
│       └── Layout.astro
├── WORKFLOW.md              ← This file
└── CLAUDE.md                ← Project instructions for Claude
```

## Quick Reference

| Task | Command/Action |
|------|----------------|
| New post | Create `.mdx` in `src/content/posts/` |
| Deploy | `git push` (auto-deploys) |
| View site | https://mapthewild.github.io/mapthewild/ |
| RSS feed | https://mapthewild.github.io/mapthewild/rss.xml |
| Local dev | `npm run dev` (port 4321) |
