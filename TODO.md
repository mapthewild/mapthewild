# Map the Wild - TODO

Last updated: December 31, 2025

---

## COMPLETED (December 2025)

### ✅ Fogmap Integration (Dec 26, 2025)
**What was done:**
- Moved fogmap-test into mapthewild as `/explore` page
- Created React component (`BlogFogMap.tsx`) with WASD navigation
- Built explorable-maps skill with 3 working scripts
- Auto-generates map data from all posts (11 posts → 16 territories)
- 2 islands: Nowbrary (5 posts), Map (6 posts)
- All validations passing (8/8 checks)
- Bracket links work correctly
- Navigation between islands functional
- Documentation complete (4 guides created)
- Production ready!

**Files created:**
- `src/components/BlogFogMap.tsx` - Fogmap React component
- `src/pages/explore.astro` - Exploration mode page
- `src/generated/blogMapData.js` - Auto-generated territory data
- `.claude/skills/explorable-maps/` - Complete skill with scripts & docs
- `EXPLORE_GUIDE.md` - User guide for writing posts
- `PUBLISHING.md` - Deployment & Substack guide

**Live at:** http://localhost:4321/mapthewild/explore

---

## Current State

- ✅ Site live at https://mapthewild.github.io/mapthewild/
- ✅ GitHub Actions auto-deploy working
- ✅ **Blog navigation complete** (prev/next, breadcrumbs, footer)
- ✅ **Stacking panes working** (Andy Matuschak-style cascading)
- ✅ **Bracket link syntax working** `[[text:artifact-id]]`
- ✅ **Exploration mode live** (WASD navigation, fog-of-war) 🎉
- ✅ Posts listing page with count
- ✅ 11 published posts

---

## P0 - CRITICAL

*No critical items*

---

## P1 - HIGH (December Goals)

### [FEATURE] Fog Text Reading
**Description:** Paragraphs reveal as you read, progress saved to localStorage
**Why:** Creates intentional reading experience (fog-of-war for text)
**Implementation:** New `FogProse.tsx` component
**Created:** Dec 22, 2025

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

### Inline Artifact Embeds
**Description:** Option to embed artifacts inline (like Medium large images) instead of opening in sliding pane
**Use case:** When artifact illustrates a point in the reading flow vs. interactive exploration
**Current behavior:** `[[text:artifact-id]]` opens content in sliding pane (side trip)
**Proposed:** New syntax like `{{artifact-id}}` for inline embed (part of the scroll)
**Tradeoff:**
- Pane = "explore this when you're ready" (current)
- Inline = "this is part of reading" (new option)
**Decision:** To be determined based on specific artifact examples
**Created:** Dec 31, 2025

### Images in Explore Map View
**Description:** Posts with images show raw MDX component markup (`<ZoomImage .../>`) in the explore map content panel instead of rendering gracefully
**Options:**
1. Strip component tags from content (just show prose)
2. Convert `<ZoomImage>` to `[Image: alt text]` placeholders
3. Actually render images in ContentPanel
4. Add "View full post" link for posts with images
**Files:** `post-to-territory.js`, `ContentPanel.jsx`
**Created:** Dec 27, 2025

### Accessibility Audit
**Description:** No accessibility documentation or systematic a11y implementation
**Current state:**
- Alt attributes on images (ZoomImage component)
- Basic semantic HTML
**Missing:**
- ARIA labels for interactive elements (stacking panes, fogmap)
- Keyboard navigation for explore mode (currently WASD only)
- Screen reader support for pane system
- Focus management when panes open/close
- Color contrast audit
**Created:** Dec 27, 2025

### Search
Client-side search when content grows (Pagefind or similar)

### Tags/categories
Organize posts by theme

### Related posts
Show related content at bottom of posts

### Auto-linking
Scan posts for known terms, insert bracket links automatically

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

