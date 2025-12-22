# Map the Wild - TODO

Last updated: December 20, 2025

---

## Current State

- ✅ Site live at https://mapthewild.github.io/mapthewild/
- ✅ GitHub Actions auto-deploy working
- ✅ **Blog navigation complete** (prev/next, breadcrumbs, footer)
- ✅ **Stacking panes working** (Andy Matuschak-style cascading)
- ✅ **Bracket link syntax working** `[[text:artifact-id]]`
- ✅ Posts listing page with count
- ✅ 5 published posts (Nowbrary series)
- ✅ 13 draft posts in progress (collating content + artifacts)

---

## P0 - CRITICAL

*No critical items*

---

## P1 - HIGH

### [CONTENT] Complete draft posts
**Description:** Finish collating remaining draft posts with their artifacts
**Current state:** 13 posts in various stages of completion
**Inventory:** See `docs/draft-posts-inventory.md` for full breakdown
**Why:** Main content pipeline
**What to do:**
- **Quick wins (7 posts):** Concept posts ready to publish after light review
- **Needs artifacts (5 posts):** Get embed URLs from Claude, migrate prototypes to PrototypePost
- **Archive (1 post):** Delete artifact-demo.mdx (was just a test)
**Estimated effort:** Ongoing
**Created:** Dec 20, 2025
**Inventory created:** Dec 20, 2025

---

## P2 - MEDIUM

### [SETUP] Custom domain
**Description:** Point mapthewild.com to GitHub Pages
**Why:** Professional URL instead of github.io subdomain
**Steps:**
- Add CNAME in GitHub Pages settings
- Update Namecheap DNS records
- Update astro.config.mjs (remove /mapthewild base)
**Estimated effort:** S
**Created:** Dec 14, 2025

### [FEATURE] Post embed optimization
**Description:** Improve how posts load in stacking panes
**Current:** Posts load full page in iframe
**Improvement:** Create `/posts/[slug]/embed` endpoint that returns just content
**Status:** COMPLETED Dec 20, 2025
**Estimated effort:** S

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

### [FEATURE] Mobile optimization check
**Description:** Test navigation/panes on real mobile devices
**Current:** Responsive classes in place, needs testing
**Estimated effort:** S
**Created:** Dec 20, 2025

---

## BACKLOG / FUTURE

### Interactive fogmap integration
Embed CivFogMap and WikiFogMap as interactive elements in posts

### Post templates
Consistent format for different post types (prototype, essay, tutorial)

### Search
Client-side search when content grows (Pagefind or similar)

### Tags/categories
Organize posts by theme (prototypes, tools for thinking, relationships, etc)

### Related posts
Show related content at bottom of posts

---

## DONE (Recent)

### Prototype showcase template
**Completed:** Dec 20, 2025
**Details:**
- Created PrototypePost.astro component
- Reusable template for tool/prototype posts
- Includes: tagline, status badge, artifact embed, project link
- Consistent structure: What It Does, Why Built, What Learned
- Template file: _prototype-template.mdx
- Documented in WORKFLOW.md

### RSS feed
**Completed:** Dec 20, 2025
**Details:**
- Installed @astrojs/rss package
- Created /rss.xml endpoint
- Includes all published posts (not drafts)
- Full post metadata (title, description, date, link)
- Auto-updates on each build
- Ready for Substack automation

### Blog navigation system
**Completed:** Dec 20, 2025
**Details:**
- Previous/Next post navigation
- Breadcrumbs (Home > Posts > Title)
- Footer with site-wide links
- Post count on listing page
- "Back to posts" replaced with breadcrumbs

### Stacking panes fixes
**Completed:** Dec 20, 2025
**Details:**
- Made component global (works on all pages)
- Fixed stale closure bug (Escape key)
- Created post embed endpoint
- System fully functional

### Posts listing page
**Completed:** Previously
**Details:** Simple list of post titles + dates, chronological order

### About page
**Completed:** Previously

### Site deployed to GitHub Pages
**Completed:** Dec 14, 2025

### Workflow documentation
**Completed:** Dec 14, 2025
**File:** WORKFLOW.md

### Architecture analysis
**Completed:** Dec 14, 2025
**File:** docs/MAP-THE-WILD-ARCHITECTURE-ANALYSIS.md

---

## RECONSIDERED (Was WONTFIX)

### ✅ Stacking panes feature
**Status:** WORKING as of Dec 20, 2025
**Details:** Fixed and functional, not removed

### ✅ Hover previews
**Status:** WORKING as part of stacking panes

### ✅ Bracket link system
**Status:** WORKING with `[[text:id]]` syntax

---

## Project Integration Roadmap

### Prototypes to Feature on Blog

**7year (Career Navigator)**
- Status: Built, ready to write about
- Needs: Artifact embed URL or self-host
- Blog post: Draft in progress

**archetype (Reflection Tool)**
- Status: Built, ready to write about
- Needs: Artifact embed URL or self-host
- Blog post: Draft in progress

**dtd (Death to Divorce)**
- Status: Built, ready to write about
- Needs: Artifact embed URL or self-host
- Blog post: Draft in progress

**wallfly (Voice Recorder)**
- Status: Built, needs completion
- Needs: Finish implementation, then write about
- Blog post: Not started

**fogmap-test (Exploration)**
- Status: Built, could be embedded
- Needs: Deploy as standalone or embed
- Blog post: Thinking Territories draft in progress

**components/ (CivFogMap, WikiFogMap)**
- Status: Standalone React components
- Needs: Deploy and get embed URLs
- Blog posts: Visual Territories draft in progress

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

### Content Pipeline
1. Write/collate post content
2. Build/publish artifacts to Claude
3. Get artifact embed URLs
4. Add to ARTIFACT_REGISTRY in StackingPanes.tsx
5. Set `draft: false` in post frontmatter
6. Deploy (automatic on git push)
