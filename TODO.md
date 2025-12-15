# Map the Wild - TODO List

Last updated: December 12, 2024

---

## P0 - CRITICAL

*No critical items*

---

## P1 - HIGH

*All P1 items completed!*

---

## P2 - MEDIUM

### [FEATURE] - P2 - TODO
**Description:** Add hover previews on bracketed words
**Why:** Andy Matuschak pattern - see snippet before clicking
**Acceptance criteria:**
- Hover shows tooltip with preview
- Small screenshot or first 100 chars of content
- Doesn't interfere with click behavior
**Estimated effort:** L
**Created:** Dec 11, 2024

### [FEATURE] - P2 - TODO
**Description:** Multiple artifacts open simultaneously
**Why:** Compare/contrast different concepts side-by-side
**Acceptance criteria:**
- Stack up to 3 panels horizontally
- Each independently scrollable
- Close individual panels or all at once
**Estimated effort:** L
**Created:** Dec 11, 2024

### [FEATURE] - P2 - TODO
**Description:** Backlinks system
**Why:** Show which posts reference the same artifact/site
**Acceptance criteria:**
- At bottom of each post, show "Referenced in: [Post A, Post B]"
- Automatically generated from bracket usage
- Links are clickable
**Estimated effort:** M
**Created:** Dec 11, 2024

### [CONTENT] - P2 - TODO
**Description:** About page explaining Map the Wild concept
**Why:** New visitors need context for what this site is
**Acceptance criteria:**
- Explain "a blog that's not a blog"
- Show the [[bracket]] system in action
- Philosophical foundation (exploration, digressions)
- Author bio
**Estimated effort:** M
**Created:** Dec 11, 2024

### [FEATURE] - P2 - TODO
**Description:** RSS feed generation
**Why:** Allow people to subscribe to new posts
**Acceptance criteria:**
- Auto-generate from Astro content collection
- Include full post content
- Update on build
**Estimated effort:** S
**Created:** Dec 11, 2024

---

## P3 - LOW

### [FEATURE] - P3 - BACKLOG
**Description:** Analytics integration
**Why:** Understand what content resonates
**Acceptance criteria:**
- Privacy-respecting analytics (Plausible or similar)
- Track: page views, bracket clicks, artifact loads
- No cookies, GDPR compliant
**Estimated effort:** S
**Created:** Dec 11, 2024

### [FEATURE] - P3 - BACKLOG
**Description:** Social sharing meta tags
**Why:** Make posts look good when shared on Twitter/LinkedIn
**Acceptance criteria:**
- OpenGraph tags
- Twitter cards
- Custom images per post (optional)
**Estimated effort:** S
**Created:** Dec 11, 2024

### [FEATURE] - P3 - BACKLOG
**Description:** Search functionality
**Why:** As content grows, need to find specific posts/concepts
**Acceptance criteria:**
- Client-side search (Pagefind or similar)
- Search post titles, descriptions, content
- Search bracketed concepts
**Estimated effort:** M
**Created:** Dec 11, 2024

### [CONTENT] - P3 - BACKLOG
**Description:** Locate and document Wallfly project
**Why:** Complete the case study series
**Acceptance criteria:**
- Find original conversation
- Extract problem/solution/learnings
- Write post following template
**Estimated effort:** L
**Created:** Dec 11, 2024

---

## DONE

### [BUG] - P0 - DONE
**Description:** End-to-end bracket system untested
**Fix:** Added global.css import to Layout.astro (styles weren't loading)
**Completed:** Dec 12, 2024

### [FEATURE] - P1 - DONE
**Description:** Extend bracket parser to support websites
**Implementation:**
- Updated bracketParser.ts to detect URLs vs artifact IDs
- Added support for explicit type declaration: `[[word:site:url]]` or `[[word:artifact:id]]`
- Updated ArtifactPanel.tsx to handle both content types
- Added "Open in new tab" button and iframe error fallback UI
- URLs are encoded/decoded to handle special characters
**Completed:** Dec 12, 2024

### [FEATURE] - P1 - DONE
**Description:** Create homepage with post listing
**Completed:** Dec 12, 2024

### [CONTENT] - P1 - DONE
**Description:** Write "Death to Divorce" case study post
**Completed:** Dec 12, 2024

### [CONTENT] - P1 - DONE
**Description:** Write "Seven Year Career Navigator" case study post
**Completed:** Dec 12, 2024

### [CONTENT] - P1 - DONE
**Description:** Write "Archetypal Reflection Tool" case study post
**Completed:** Dec 12, 2024

---

## WONTFIX

*Items move here when explicitly decided against*

---

## Notes

### Effort Estimates
- **S (Small):** < 2 hours
- **M (Medium):** 2-6 hours
- **L (Large):** 6+ hours

### Priority Guidelines
- **P0:** Blocking core functionality
- **P1:** Critical for MVP/launch
- **P2:** Important but not blocking
- **P3:** Nice to have / future enhancements

### Workflow
1. Pick highest priority unblocked item
2. Move to "In Progress" (update status in item)
3. Create feature branch if using git
4. Complete acceptance criteria
5. Test thoroughly
6. Move to DONE section with completion date
