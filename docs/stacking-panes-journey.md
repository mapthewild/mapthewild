# Stacking Panes: The Journey

**Date:** December 12, 2024
**Time:** ~4 hours across multiple sessions
**Result:** Simplified stacking panes with absolute positioning + iframe communication

---

## What We Built

Andy Matuschak-style stacking panes where clicking bracket links opens posts/artifacts in cascading panels. Each pane peeks 40px from behind the next.

**Final approach:**
- Absolute positioning (`left: index * PEEK_WIDTH`)
- iframe detection + postMessage for nested links
- `ARTIFACT_REGISTRY` for mapping short IDs to Claude embed URLs
- Hover previews (400ms delay)

---

## Failed Attempts

### Attempts 1-4: Flexbox + Negative Margins

Tried multiple variations of:
```tsx
<div className="flex">
  <div style={{ marginLeft: -(PAGE_WIDTH - PEEK_WIDTH) }}>
```

**Why it failed:** Flexbox distributes space. Negative margins break that calculation. Panes overlap completely instead of cascading.

**Lesson:** When layout algorithms fight your intent, remove the algorithm entirely (use absolute positioning).

---

## The Breakthrough

**Correct pattern:**
```tsx
<div className="relative" style={{ width: totalWidth }}>
  {panes.map((pane, index) => (
    <div
      className="absolute"
      style={{
        left: index * PEEK_WIDTH,  // 0, 40, 80, 120...
        zIndex: index,
      }}
    />
  ))}
</div>
```

Panes positioned independently. No layout algorithm. Works perfectly.

---

## The Hidden Bug: Nested Components

Each post includes `<StackingPanes />`. When loaded in iframe → renders *another* StackingPanes → duplicate headers/buttons.

**Fix:**
```tsx
// Detect iframe
const [isInIframe, setIsInIframe] = useState(false);
useEffect(() => {
  setIsInIframe(window.self !== window.top);
}, []);

// In iframe: forward clicks to parent
if (isInIframe && window.parent) {
  window.parent.postMessage({
    type: 'stackingPanes:navigate',
    content, trigger
  }, '*');
}

// Parent: listen for messages
window.addEventListener('message', (event) => {
  if (event.data?.type === 'stackingPanes:navigate') {
    navigateToStackedPage(content, trigger);
  }
});

// Don't render UI in iframes
if (isInIframe) return null;
```

---

## Simplifications

Added `ARTIFACT_REGISTRY` for explicit artifact mapping:
```tsx
const ARTIFACT_REGISTRY: Record<string, string> = {
  'demo-artifact': 'https://claude.site/public/artifacts/.../embed',
};
```

Removed complexity around dynamic artifact detection. If not in registry → fallback to direct Claude embed URL.

---

## Key Files

**Modified:**
- `src/components/StackingPanes.tsx` — Core implementation
- `docs/stacking-panes.md` — Implementation guide
- `.claude/rules/stacking-panes.md` — Auto-rules
- `CLAUDE.md` — Updated docs

**Created:**
- `src/content/posts/velocity-problem.mdx` — New post

---

## What Actually Works

✅ Absolute positioning with calculated offsets
✅ iframe detection prevents nested UI
✅ postMessage for cross-iframe navigation
✅ Deduplication (clicking open link scrolls to it)
✅ Hover previews
✅ Escape to close

❌ Complex cascade effects (gave up, kept it simple)
❌ Visual focus indicators (not worth the complexity)

---

## The Meta Point

**Lee Robinson's insight:** Spend tokens to remove complexity.

**Our insight:** Document failures to prevent repeating them.

The stacking panes work. The real value is `docs/stacking-panes.md` preventing future attempts at flexbox approaches that fundamentally don't work for overlapping layouts.

**Code + context = maintainable.**
