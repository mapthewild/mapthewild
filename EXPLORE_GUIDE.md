# Exploration Mode Guide

Your blog now has **two ways to navigate**: traditional blog view and spatial exploration mode. This guide explains how to write posts that appear in both.

## What Is Exploration Mode?

Instead of scrolling through a list of posts, you **explore them spatially** with WASD keys, like a game. Posts appear as territories on a map, grouped into "islands" based on their topics. As you move around, fog clears to reveal new territories.

- **Try it**: Visit `/explore` on your blog
- **Move**: WASD or arrow keys
- **Enter**: Drill down into island territories
- **ESC**: Return to the previous level

## Writing a New Post (Quick Start)

### 1. Create the MDX File

```bash
cd mapthewild/src/content/posts
touch your-post-slug.mdx
```

**Filename = slug**: The filename (without `.mdx`) becomes the post's URL and territory ID. Use lowercase, hyphens, no special characters.

Examples:
- `nowbrary-architecture.mdx` → `/posts/nowbrary-architecture` and territory ID `nowbrary-architecture`
- `my-new-post.mdx` → `/posts/my-new-post` and territory ID `my-new-post`

### 2. Add Frontmatter

```yaml
---
title: "Your Post Title"
date: 2025-12-26
description: "Brief description for meta tags and previews"
islands: ["nowbrary"]  # Required: which island this post belongs to
---
```

**Islands explained:**
- `nowbrary` - Books, knowledge, library of thoughts
- `map` - Navigation, meta-thinking, working things out
- `territory` - Space, place, boundaries (currently unused)

**Optional territory customization:**
```yaml
---
title: "Your Post Title"
date: 2025-12-26
islands: ["map"]
territory:
  position: { x: 400, y: 300 }  # Custom position on map (0-800 x, 0-600 y)
  emoji: "🗺️"                    # Custom emoji for this territory
  level: "tower"                 # tower/village/house/campfire
  color: "#8b5cf6"               # Custom hex color
---
```

If you don't add `territory` fields, the system auto-generates them:
- **Position**: Grid layout (3 columns, 200px spacing)
- **Emoji**: Inferred from title keywords ("map" → 🗺️, "nowbrary" → 📖)
- **Level**: Based on word count (>1000 words = tower, 500-1000 = village, <500 = house)
- **Color**: Island theme color (nowbrary = blue, map = purple)

### 3. Write Your Content

Use standard markdown or MDX:

```markdown
## Section Heading

Your content here with **bold** and *italic* text.

- Lists work
- Just like normal
- Markdown

You can use `[[other-post-slug]]` to link to other posts.
```

**Bracket links** create connections between territories:
- Same island: Walk distance (visible on map)
- Different island: Ley lines (teleport only)

Format: `[[Display Text:post-slug]]` or just `[[post-slug]]`

Examples:
```markdown
See also [[nowbrary-architecture]] for more details.

Or with custom text: [[Your nowbrary:nowbrary-living-constellation]]
```

### 4. Regenerate the Map

After writing your post, regenerate the exploration map:

```bash
cd .claude/skills/explorable-maps/scripts
node generate-map-data.js
```

This scans all posts in `src/content/posts/`, groups them by islands, and generates `src/generated/blogMapData.js`.

**Output:**
```
Scanning posts...
Found 12 posts
Converting posts to territories...
Grouping by island...
Islands: map, nowbrary
Generating territory levels...
Generating ley lines...
Generated 0 ley lines

✅ Map data generated successfully!
Output: /Users/focus/Documents/magicpatterns/mapthewild/src/generated/blogMapData.js

Territory levels: 3
Total territories: 17
Ley lines: 0
```

### 5. Validate (Optional but Recommended)

Check for errors before testing:

```bash
cd .claude/skills/explorable-maps/scripts
node validate-territories.js
```

This checks for:
- All territory IDs are unique
- All bracket link targets exist
- All territories are reachable from root
- Positions are within map bounds (0-800 x, 0-600 y)
- No position collisions (min 50px apart)
- Parent-child hierarchy is valid

**Example output:**
```
============================================================
  TERRITORY DATA VALIDATION
============================================================

Levels: 3
Territories: 17

✅ Passed (8):
   - Root level
   - Unique IDs
   - Bracket links
   - Child maps
   - Reachability
   - Positions
   - Collisions
   - Hierarchy

============================================================
✅ ALL VALIDATIONS PASSED
============================================================
```

If you see errors, they'll tell you exactly what's wrong and where.

### 6. Test Locally

```bash
cd mapthewild
npm run dev
```

Then visit:
- **Blog view**: http://localhost:4321/mapthewild/
- **Explore mode**: http://localhost:4321/mapthewild/explore

Navigate to your new post and check:
- Does it appear as a territory?
- Is the position reasonable?
- Do bracket links work?
- Can you drill down into the island?

### 7. Deploy

Once everything looks good, build and deploy:

```bash
npm run build
# Deploy to GitHub Pages or your hosting platform
```

The generated map data (`src/generated/blogMapData.js`) will be included in the build.

## Understanding the Map Structure

### Hierarchy

```
root (entry point)
├─ spawn (starting campfire)
├─ nowbrary-tower (enter this island)
│  └─ nowbrary-level (all nowbrary posts)
│     ├─ nowbrary-architecture
│     ├─ nowbrary-living-constellation
│     ├─ sharing-your-nowbrary
│     ├─ starting-your-nowbrary
│     ├─ notes-on-what-a-nowbrary-isnt
│     └─ exit (return to root)
└─ map-tower (enter this island)
   └─ map-level (all map posts)
      ├─ beyond-the-boxes
      ├─ candor-conversation-flow-test-v1
      ├─ from-digital-hoarding-to-connected-intelligence
      ├─ the-evolution-of-surveillance
      ├─ my-ai-struggle
      ├─ well-log-poc-first-steps
      └─ exit (return to root)
```

### Territory Types (Building Sprites)

| Level | Emoji | Size | Description |
|-------|-------|------|-------------|
| `campfire` | 🔥 | 30px | Spawn points, exits |
| `house` | 🏠 | 40px | Short posts (<500 words) |
| `village` | 🏘️ | 55px | Medium posts (500-1000 words) |
| `tower` | 🗼 | 65px | Long posts (>1000 words), island entry points |

### Island Colors

- **Nowbrary**: `#3b82f6` (blue) - Knowledge, library, books
- **Map**: `#8b5cf6` (purple) - Navigation, meta-thinking
- **Territory**: `#10b981` (green) - Space, place, boundaries

## Troubleshooting

### My post doesn't appear on the map

1. Check the frontmatter has `islands: ["nowbrary"]` or `islands: ["map"]`
2. Regenerate the map: `node generate-map-data.js`
3. Restart the dev server: `npm run dev`

### Bracket link shows as broken in validation

The link target must match the **filename** (without `.mdx`), not the post title.

Example:
- File: `nowbrary-architecture.mdx`
- Link: `[[nowbrary-architecture]]` ✅
- Link: `[[Understanding Your Nowbrary's Architecture]]` ❌ (this is the title, not the slug)

### Position collisions warning

Two territories are too close (< 50px apart). Either:
- Manually set positions in frontmatter
- Or change the grid layout in `generate-map-data.js` (increase spacing)

### Territory appears but fog doesn't clear

The fog reveal radius is 90px. Make sure you're moving close enough to the territory. Try increasing `REVEAL_RADIUS` in the component if needed.

## Advanced: Custom Positioning

If you want precise control over where posts appear on the map, add `territory.position` to frontmatter:

```yaml
---
title: "My Centerpiece Post"
islands: ["nowbrary"]
territory:
  position: { x: 400, y: 300 }  # Center of the map
  emoji: "⭐"
  level: "tower"
---
```

**Map boundaries:**
- Width: 0-800px
- Height: 0-600px
- Safe zone: x: 100-700, y: 100-500 (avoid edges)

**Tips:**
- Island towers appear at y: 200 (top of root map)
- Spawn point is at (400, 500) (bottom center)
- Exits typically at (50, 300) (left edge)

## Next Steps

- **Write more posts** - Add them to islands, regenerate the map
- **Customize positions** - Use frontmatter to arrange posts spatially
- **Add ley lines** - Create bracket links between related posts
- **Deploy** - Share your explorable blog with the world!

---

*This exploration mode was built in December 2025. It combines traditional blog reading with spatial discovery, inspired by Bruno Simon's portfolio navigation and fog-of-war game mechanics.*
