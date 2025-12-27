# Publishing & Distribution Guide

Guide for publishing, deploying, and distributing content from mapthewild blog.

---

## Table of Contents

1. [Build & Deploy](#build--deploy)
2. [RSS Feed](#rss-feed)
3. [Substack Cross-posting](#substack-cross-posting)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Analytics](#analytics-optional)

---

## Build & Deploy

### Local Development

```bash
cd mapthewild
npm run dev
```

Runs Astro dev server at http://localhost:4321/mapthewild/

### Production Build

```bash
# Regenerate exploration map
cd ../.claude/skills/explorable-maps/scripts
node generate-map-data.js

# Build site
cd ../../../mapthewild
npm run build
```

Output: `dist/` folder ready for deployment

### Deploy to GitHub Pages

**Automated** (if using GitHub Actions):
- Push to main branch
- GitHub Actions builds and deploys automatically

**Manual**:
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

**Live URL**: https://mapthewild.github.io/mapthewild/

---

## RSS Feed

**URL**: `/rss.xml` (https://mapthewild.github.io/mapthewild/rss.xml)

**Includes**:
- Post titles
- Descriptions
- Publication dates
- Full post links

**Auto-updates** on each build.

**Usage**:
- Subscribe in feed readers (Feedly, Inoreader, etc.)
- Use with RSS-to-email services
- Pull recent posts programmatically

**Implementation**: `src/pages/rss.xml.ts` (Astro RSS integration)

---

## Substack Cross-posting

### Current Workflow (Manual)

**Status**: RSS feed ready (Dec 20, 2025), automation pending

**Steps**:
1. Write and publish post on mapthewild
2. Copy post content (markdown → Substack editor)
3. Paste into Substack draft
4. Adjust formatting as needed
5. Add link back to original: "Originally published at [mapthewild.github.io](URL)"
6. Schedule or publish on Substack

**RSS Feed Integration**:
- Subscribe to your own RSS feed in Substack
- Use Substack's "Import from RSS" feature (if available)
- Or use third-party services like Zapier or IFTTT

### Future Automation (P3 - Low Priority)

**From TODO.md**:
- **Goal**: Automate blog → Substack newsletter
- **Rationale**: Reuse content for email subscribers
- **Dependencies**: Multiple posts + RSS feed (✅ completed)
- **Effort**: Large (L)

**Possible approaches**:
1. **Substack API** (if available) - programmatic post creation
2. **RSS-to-email** services - forward RSS updates to Substack import
3. **Zapier/IFTTT** - trigger on RSS update → create Substack draft
4. **Custom script** - read RSS feed, format for Substack, submit via API

**Reference**: Simon Willison's blog setup
- **Source**: Readwise cache entries from simonwillison.net
- **Topics**: AI/tech blogging, Datasette, cross-posting strategies
- **Note**: Simon Willison (not Ellison) is a tech blogger with extensive cross-posting experience

---

## Custom Domain Setup

**Goal** (P2 - Medium Priority from TODO.md): Point `mapthewild.com` to GitHub Pages

### Steps

1. **Buy domain** at Namecheap (or preferred registrar)

2. **Add CNAME file** to repo:
   ```bash
   echo "mapthewild.com" > public/CNAME
   ```

3. **Configure DNS** at Namecheap:
   - Add A records pointing to GitHub Pages IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - Add CNAME record: `www` → `yourusername.github.io`

4. **Update astro.config.mjs**:
   ```javascript
   export default defineConfig({
     site: 'https://mapthewild.com',
     base: '/',  // Remove /mapthewild base path
   });
   ```

5. **Enable HTTPS** in GitHub Pages settings (automatic after DNS propagates)

6. **Wait for DNS** (can take 24-48 hours)

**Test**: Visit https://mapthewild.com and https://www.mapthewild.com

---

## Analytics (Optional)

**Goal** (P3 - Low Priority from TODO.md): Privacy-respecting analytics

### Recommended Options

1. **Plausible Analytics**
   - Privacy-first, GDPR compliant
   - No cookies, lightweight script
   - ~€9/month for hobby sites
   - Installation: Add script tag to `<head>`

2. **Fathom Analytics**
   - Similar to Plausible
   - Cookie-free, privacy-focused
   - $14/month

3. **GoatCounter**
   - **Free** for non-commercial use
   - Open-source, privacy-friendly
   - Self-hostable or hosted

4. **Umami**
   - Open-source, self-hosted
   - Free (hosting costs only)
   - Privacy-focused

### Implementation

Add analytics script to `src/layouts/Layout.astro`:

```astro
---
// ... existing imports
---

<html lang="en">
  <head>
    <!-- ... existing head content -->

    <!-- Analytics (Plausible example) -->
    <script defer data-domain="mapthewild.com" src="https://plausible.io/js/script.js"></script>
  </head>
  <!-- ... rest of layout -->
</html>
```

**Metrics to track**:
- Page views
- Unique visitors
- Popular posts
- Geographic distribution
- Referral sources
- Exploration mode usage (custom events)

---

## Build Optimization

### Pre-build Checklist

Before deploying, ensure:
- [x] New posts have correct frontmatter
- [x] Exploration map regenerated (`node generate-map-data.js`)
- [x] Validations pass (`node validate-territories.js`)
- [x] Local testing complete (`npm run dev`)
- [x] Images optimized (compress large files)
- [x] No broken links

### Recommended: Add Pre-build Hook

Update `package.json`:
```json
{
  "scripts": {
    "dev": "astro dev",
    "prebuild": "node ../.claude/skills/explorable-maps/scripts/generate-map-data.js",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

This ensures map data is always fresh before building.

---

## Social Sharing (Future)

**Goal** (P3 - Low Priority from TODO.md): Better social meta tags

### Add to Layout Head

```astro
<!-- OpenGraph tags -->
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content={image || "/default-og-image.png"} />
<meta property="og:url" content={Astro.url} />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image || "/default-twitter-card.png"} />
```

**Create default images**:
- `public/default-og-image.png` (1200x630px for Facebook)
- `public/default-twitter-card.png` (1200x675px for Twitter)

---

## Email Signup (Future)

**Goal** (P3 - Low Priority from TODO.md): Email signup for newsletter

### Options

1. **Google Forms** (Free)
   - Simple form → Google Sheet
   - Manual export to email service

2. **Tally** (Free tier available)
   - Beautiful forms
   - Integrations with email services
   - Analytics included

3. **GitHub Issues** (Creative & Free)
   - Users subscribe via GitHub issue comments
   - Notifications via GitHub
   - Very technical, but zero-cost

4. **Substack** (If cross-posting)
   - Native email signup
   - Manages subscribers automatically
   - Free tier available

### Implementation Example (Tally)

```astro
<!-- Add to home page or sidebar -->
<div class="newsletter-signup">
  <h3>Get new posts via email</h3>
  <iframe
    src="https://tally.so/embed/YOUR-FORM-ID"
    width="100%"
    height="300"
    frameborder="0"
  ></iframe>
</div>
```

---

## Publishing Checklist

Before each post goes live:

- [ ] Post written and proofread
- [ ] Frontmatter complete (title, date, islands, description)
- [ ] Images optimized and added to `public/images/`
- [ ] Bracket links use correct slugs
- [ ] Map regenerated: `node generate-map-data.js`
- [ ] Validations pass: `node validate-territories.js`
- [ ] Tested locally: `npm run dev` → check post and `/explore`
- [ ] Built successfully: `npm run build`
- [ ] Deployed to GitHub Pages
- [ ] Post appears correctly on live site
- [ ] (Optional) Cross-posted to Substack
- [ ] (Optional) Shared on social media

---

*Last updated: Dec 26, 2025*
