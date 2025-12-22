# PrototypePost Component

## Overview

Reusable Astro component for showcasing interactive prototypes and tools with consistent structure and styling.

## Location

`src/components/PrototypePost.astro`

## Usage

```mdx
---
title: "Seven Year Career Navigator"
date: 2025-12-20
description: "Career assessment tool for understanding professional transitions"
draft: false
---

import PrototypePost from '../../components/PrototypePost.astro'

<PrototypePost
  title="Seven Year Career Navigator"
  tagline="A career assessment tool built on research about phase transitions"
  artifactId="7year-app"
  artifactLabel="Seven Year Navigator"
  builtDate="December 2024"
  status="Complete"
  projectUrl="https://github.com/username/7year"
>

## What It Does

Main content explaining functionality...

## Why I Built It

Motivation and context...

## What I Learned

Reflections and insights...

</PrototypePost>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | Prototype name |
| `tagline` | string | Yes | - | One-sentence description |
| `artifactId` | string | No | - | Claude artifact ID for interactive demo |
| `artifactLabel` | string | No | - | Display text for artifact bracket link |
| `builtDate` | string | No | - | When built (e.g., "December 2024") |
| `status` | string | No | "Complete" | "Complete", "In Progress", or "Experimental" |
| `projectUrl` | string | No | - | GitHub repo or live project URL |

## Features

### Automatic Styling
- Prototype badge (purple)
- Status badge (gray)
- Build date display
- Professional footer with project link

### Artifact Integration
If both `artifactId` and `artifactLabel` are provided, automatically creates:
```
Click to open the [[Tool Name:artifact-id]] in an interactive panel.
```

This hooks into the existing bracket link system and stacking panes.

### Consistent Structure
Enforces consistent sections across all prototype posts:
- Header with metadata
- Interactive demo callout (if artifact provided)
- Main content (your custom sections)
- Footer with project link and series attribution

### Responsive Design
- Mobile-friendly layout
- Touch-friendly interactive elements
- Readable typography hierarchy

## Content Sections

Recommended structure for content passed as slot:

```md
## What It Does
2-3 paragraphs explaining core functionality

## Why I Built It
Original insight or need

## The Research Foundation (optional)
If built on specific theory/research

### Key Concept 1
### Key Concept 2

## How It Works
User experience walkthrough

## What I Learned
Reflections:
- Technical insights
- Design insights
- Philosophical insights

## Connections to Other Work
Links to related prototypes

## Try It
Invitation to use, what to bring to it
```

## Template

Copy from: `src/content/posts/_prototype-template.mdx`

This template includes all recommended sections with placeholder content.

## Styling

Component includes scoped styles for:
- Headings (h2, h3)
- Paragraphs
- Lists
- Blockquotes
- Code blocks
- Links
- Section dividers

All styling matches the blog's dark theme with purple accents.

## Examples

Existing prototype posts using this component:
- (To be migrated: seven-year-career-navigator.mdx)
- (To be migrated: death-to-divorce.mdx)
- (To be migrated: archetypal-reflection-tool.mdx)

## Integration with Other Features

### Bracket Links
`artifactId` and `artifactLabel` props automatically generate bracket link syntax that works with the existing stacking panes system.

### Navigation
Prototype posts work with all standard blog navigation:
- Previous/Next post navigation
- Breadcrumbs
- Footer links
- RSS feed inclusion

### Draft System
Use `draft: true` in frontmatter to hide from production. Prototype posts respect this flag.

## Best Practices

1. **Keep tagline concise** - One sentence, under 100 chars
2. **Use present tense** - "A tool that helps..." not "A tool that helped..."
3. **Link generously** - Use bracket links to connect to other prototypes/concepts
4. **Show, don't tell** - If possible, provide artifact for hands-on experience
5. **Reflect honestly** - "What I Learned" should include what didn't work
6. **Invite experimentation** - "Try It" section should be welcoming, not prescriptive

## Maintenance

When adding new props or features:
1. Update this documentation
2. Update WORKFLOW.md
3. Update _prototype-template.mdx
4. Test build with `npm run build`

## Questions?

See WORKFLOW.md for post creation workflow or ask Claude Code for help migrating existing prototype posts.
