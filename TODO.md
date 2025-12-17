# Map the Wild - TODO

Last updated: December 14, 2025

---

## Current State

- ✅ Site live at https://mapthewild.github.io/mapthewild/
- ✅ GitHub Actions auto-deploy working
- ✅ Simple single-page intro
- ✅ Workflow documented in WORKFLOW.md

---

## P0 - CRITICAL

*No critical items*

---

## P1 - HIGH

### [CONTENT] Write first real post
**Description:** Pick a prototype (Lumina, 7year, archetype, dtd) and write about it
**Why:** Site needs content
**What to include:**
- What it does
- Why I built it
- How it works
- What I learned
- Embed the prototype (claude.site iframe)
**Estimated effort:** M
**Created:** Dec 14, 2025

### [FEATURE] Posts listing page
**Description:** Create `/posts` page that lists all posts
**Why:** Need way to navigate to posts once they exist
**Acceptance criteria:**
- Simple list of post titles + dates
- Link to each post
- Chronological order (newest first)
**Estimated effort:** S
**Created:** Dec 14, 2025

---

## P2 - MEDIUM

### [FEATURE] RSS feed
**Description:** Auto-generate RSS feed from posts
**Why:** Needed for Substack automation, subscribers
**Acceptance criteria:**
- Astro generates RSS automatically
- Full post content included
- Updates on each build
**Estimated effort:** S
**Created:** Dec 14, 2025

### [SETUP] Custom domain
**Description:** Point mapthewild.com to GitHub Pages
**Why:** Professional URL instead of github.io subdomain
**Steps:**
- Add CNAME in GitHub Pages settings
- Update Namecheap DNS records
- Update astro.config.mjs (remove /mapthewild base)
**Estimated effort:** S
**Created:** Dec 14, 2025

### [CONTENT] About page
**Description:** Simple about/bio page
**Why:** People want to know who's behind this
**Keep it short:**
- Who I am
- What this site is
- How to reach me
**Estimated effort:** S
**Created:** Dec 14, 2025

### [WORKFLOW] Easier content editing
**Description:** Set up simpler way to edit content than raw Astro files
**Options:**
- Obsidian Git plugin
- github.dev editor
- Custom /edit slash command
**Estimated effort:** M
**Created:** Dec 14, 2025

---

## P3 - LOW

### [FEATURE] Analytics
**Description:** Privacy-respecting analytics (Plausible or similar)
**Why:** Understand what content resonates
**Estimated effort:** S
**Created:** Dec 14, 2025

### [FEATURE] Social meta tags
**Description:** OpenGraph and Twitter cards
**Why:** Posts look good when shared
**Estimated effort:** S
**Created:** Dec 14, 2025

### [AUTOMATION] Substack cross-posting
**Description:** Automate blog → Substack newsletter
**Why:** Reuse content for email subscribers
**Needs:** Multiple posts + RSS feed first
**Estimated effort:** L
**Created:** Dec 14, 2025

### [FEATURE] Email signup
**Description:** Collect emails for updates on prototypes
**Options:** Google Forms, Tally, GitHub Issues
**Estimated effort:** S
**Created:** Dec 14, 2025

---

## BACKLOG / FUTURE

### Fogmap integration
Merge fog-of-war explorer into blog (see MAP-THE-WILD-ARCHITECTURE-ANALYSIS.md)

### Post templates
Consistent format for prototype posts

### Search
Client-side search when content grows

---

## DONE (Recent)

### Site deployed to GitHub Pages
**Completed:** Dec 14, 2025

### Simplified to single-page intro
**Completed:** Dec 14, 2025
**Details:** Removed stacking panes, bracket links, all complexity

### Workflow documentation
**Completed:** Dec 14, 2025
**File:** WORKFLOW.md

### Architecture analysis
**Completed:** Dec 14, 2025
**File:** docs/MAP-THE-WILD-ARCHITECTURE-ANALYSIS.md

---

## WONTFIX

### Stacking panes feature
**Reason:** Too complex, didn't match desired simplicity

### Hover previews
**Reason:** Removed with bracket link system

### Backlinks system
**Reason:** Not needed without bracket links

---

## Notes

### Effort Estimates
- **S (Small):** < 2 hours
- **M (Medium):** 2-6 hours
- **L (Large):** 6+ hours

### Priority
- **P0:** Site is broken
- **P1:** Needed before site is useful
- **P2:** Important improvements
- **P3:** Nice to have
