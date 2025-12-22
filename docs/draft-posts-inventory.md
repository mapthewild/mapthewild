# Draft Posts Inventory

**Last Updated:** December 20, 2025
**Status:** 13 draft posts in various stages of completion

---

## Prototypes/Tools (3)

Ready for PrototypePost component migration.

### 1. The Archetypal Reflection Tool
- **File:** `archetypal-reflection-tool.mdx`
- **Date:** 2024-12-10
- **Description:** A metacognitive tool that helps you see how you think, not what to think
- **Status:** Content complete, needs artifact ID
- **Artifact needed:** archetype-app
- **Project:** `/archetype` folder
- **Next steps:** Get artifact embed URL, migrate to PrototypePost component

### 2. Death to Divorce: A Couples Ritual Tool
- **File:** `death-to-divorce.mdx`
- **Date:** 2024-12-12
- **Description:** Building a phone-passing ritual that helps couples stay connected through structured reflection
- **Status:** Content complete, needs artifact ID
- **Artifact needed:** dtd-app
- **Project:** `/dtd` folder
- **Next steps:** Get artifact embed URL, migrate to PrototypePost component

### 3. Seven Year Career Navigator
- **File:** `seven-year-career-navigator.mdx`
- **Date:** 2024-12-11
- **Description:** An assessment tool built on Peter Weddle's research about career phase transitions
- **Status:** Content complete, needs artifact ID
- **Artifact needed:** 7year-app
- **Project:** `/7year` folder
- **Next steps:** Get artifact embed URL, migrate to PrototypePost component

---

## Concepts/Frameworks (5)

Can be published as standard posts with minimal editing.

### 4. Metacognitive Tools
- **File:** `metacognitive-tools.mdx`
- **Date:** 2024-12-06
- **Description:** Software that helps you see how you think, not just what you think
- **Status:** Conceptual post, mostly complete
- **Next steps:** Review and publish (foundational concept)

### 5. Tools for Thinking
- **File:** `tools-for-thinking.mdx`
- **Date:** 2024-12-08
- **Description:** What makes a tool actually change how you think, rather than just capturing what you already thought?
- **Status:** Conceptual post, mostly complete
- **Next steps:** Review and publish (foundational concept)

### 6. The Contemplative Pause
- **File:** `contemplative-pause.mdx`
- **Date:** 2024-12-05
- **Description:** Why the best thinking tools slow you down
- **Status:** Conceptual post, mostly complete
- **Next steps:** Review and publish

### 7. Phone Passing
- **File:** `phone-passing.mdx`
- **Date:** 2024-12-04
- **Description:** Why a physical handoff creates better conversations than a shared screen
- **Status:** Conceptual post, mostly complete
- **Next steps:** Review and publish (connects to Death to Divorce)

### 8. Ritual Design
- **File:** `ritual-design.mdx`
- **Date:** 2024-12-07
- **Description:** How structured repetition creates containers for transformation
- **Status:** Conceptual post, mostly complete
- **Next steps:** Review and publish (connects to Death to Divorce)

---

## Analysis/Essays (4)

Need visualizations/artifacts from Claude.

### 9. A Year Thinking with Claude
- **File:** `claude-analysis.mdx`
- **Date:** 2024-12-16
- **Description:** Data analysis of 888 conversations, 658,889 words, and what they reveal about how I think
- **Status:** Needs artifact/visualization
- **Artifact needed:** Link to `/analysis/notebook.html` or interactive version
- **Next steps:** Get notebook embed or create standalone artifact

### 10. The Velocity Problem
- **File:** `velocity-problem.mdx`
- **Date:** 2024-12-12
- **Description:** AI capability, products, and organizations all move at different speeds. What if the gap between them is structural?
- **Status:** Essay, may need editing
- **Next steps:** Review for completeness, publish if ready

### 11. Mapping My Thinking Territories
- **File:** `thinking-territories.mdx`
- **Date:** 2024-12-16
- **Description:** An interactive fog map of the intellectual landscapes I explore with Claude
- **Status:** Needs CivFogMap artifact
- **Artifact needed:** CivFogMap interactive embed
- **Project:** `/components/CivFogMap.tsx`
- **Next steps:** Deploy CivFogMap, get embed URL

### 12. Visual Territories: Five Maps of My Mind
- **File:** `visual-territories.mdx`
- **Date:** 2024-12-16
- **Description:** AI-generated concept maps that visualize my intellectual landscape
- **Status:** Uses local images
- **Images:** Available in `/public/images/`
- **Next steps:** Review and publish (images ready)

---

## Demo/Test (1)

### 13. Artifact Embedding Demo
- **File:** `artifact-demo.mdx`
- **Date:** 2024-12-13
- **Description:** Comparing two ways to embed Claude artifacts in posts
- **Status:** Test/demo post
- **Next steps:** Probably archive or delete (was for testing)

---

## Publication Priority

### Quick Wins (can publish soon)
1. **Metacognitive Tools** - Foundational concept
2. **Tools for Thinking** - Foundational concept
3. **The Contemplative Pause** - Complete
4. **Phone Passing** - Complete
5. **Ritual Design** - Complete
6. **Visual Territories** - Images ready
7. **The Velocity Problem** - Essay, may be ready

### Needs Artifact URLs
1. **The Archetypal Reflection Tool** - archetype-app
2. **Death to Divorce** - dtd-app
3. **Seven Year Career Navigator** - 7year-app
4. **A Year Thinking with Claude** - notebook/analysis
5. **Mapping My Thinking Territories** - CivFogMap

### Archive/Delete
1. **Artifact Embedding Demo** - Was just a test

---

## Migration Checklist

When ready to publish a prototype post:

1. [ ] Get artifact embed URL from Claude
2. [ ] Add to `ARTIFACT_REGISTRY` in `StackingPanes.tsx`
3. [ ] Migrate content to PrototypePost component format
4. [ ] Update frontmatter date to publication date
5. [ ] Change `draft: false`
6. [ ] Test locally with `npm run dev`
7. [ ] Build and verify with `npm run build`
8. [ ] Commit and push to deploy

When ready to publish a concept/essay:

1. [ ] Review content for completeness
2. [ ] Check bracket links work
3. [ ] Update frontmatter date to publication date
4. [ ] Change `draft: false`
5. [ ] Test locally
6. [ ] Build and deploy

---

## Content Connections

The posts form a network:

**Foundation:**
- Metacognitive Tools → defines category
- Tools for Thinking → defines philosophy

**Design Patterns:**
- Contemplative Pause → shared pattern
- Phone Passing → specific mechanic
- Ritual Design → structural framework

**Applications:**
- The Archetypal Reflection Tool → uses contemplative pause
- Death to Divorce → uses phone passing + ritual design
- Seven Year Career Navigator → uses metacognitive approach

**Analysis:**
- A Year Thinking with Claude → meta-reflection on the work
- Thinking Territories → visual map of concepts
- Visual Territories → AI-generated maps

Publishing order should consider these dependencies - foundation posts before applications.

---

## Notes

- All drafts use `draft: true` to hide from production
- Template file `_prototype-template.mdx` is not counted (also draft)
- Dates will need updating to publication date when ready
- Bracket link syntax already in use throughout posts
- Some posts cross-reference each other (already linked)
