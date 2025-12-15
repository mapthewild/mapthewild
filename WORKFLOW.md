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

## Embedding Artifacts

### Claude Artifacts (interactive, needs API)
Keep on claude.site. Embed via iframe:
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

## Future: Substack Cross-posting

When you have a backlog of posts:
1. Posts have RSS feed (Astro generates this)
2. Script can pull recent posts from RSS
3. Format for Substack newsletter
4. Copy-paste or automate

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
| Local dev | `npm run dev` (port 4321) |
