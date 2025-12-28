---
paths:
  - src/components/**/Pane*.{astro,tsx,jsx}
  - src/components/**/Stack*.{astro,tsx,jsx}
  - src/components/**/*pane*.{astro,tsx,jsx}
---

# Stacking Panes Rules

Use `position: absolute` with `left: index * PEEK_WIDTH` for pane positioning.

Do not use flexbox or negative margins — these approaches have failed 4+ times on this project.

Before changes, read `docs/stacking-panes.md` for context on what was tried and why it failed.

After changes, verify:
- 2+ panes show peek of previous panes on left edge
- Clicking a pane brings it to focus
- Close removes pane and repositions others
