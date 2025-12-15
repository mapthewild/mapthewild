# Stacking Panes Implementation

Reference: Andy Matuschak's notes UI — https://notes.andymatuschak.org/

## Correct Pattern

```css
.pane-container {
  position: relative;
}

.pane {
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
}
```

```javascript
const PEEK_WIDTH = 40;

function positionPanes(panes) {
  panes.forEach((pane, index) => {
    pane.style.left = `${index * PEEK_WIDTH}px`;
    pane.style.zIndex = index;
  });
}
```

## Why This Works

Absolute positioning removes panes from document flow. Each pane positioned independently. No layout algorithm fighting your intent.

## What Failed (Do Not Retry)

**Flexbox + negative margins**: Flexbox distributes space, doesn't support controlled overlap. Panes fight for space.

**CSS transforms**: Moves visual rendering but not layout box. Click targets wrong.

**Grid + negative margins**: Grid manages space distribution. Negative margins break spacing calculations.

## Reference Implementations

- gatsby-theme-andy: https://github.com/aravindballa/gatsby-theme-andy
- react-stacked-pages-hook: https://github.com/mathieudutour/react-stacked-pages-hook

## Verification Checklist

- [ ] Single pane renders correctly
- [ ] Two panes: second shows behind first, peek visible
- [ ] Three+ panes: cascade effect works
- [ ] Horizontal scroll when many panes
- [ ] Click stacked pane brings to focus
- [ ] Close button works, others reposition
- [ ] No duplicate UI elements
