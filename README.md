# Map the Wild

A minimalist blog built with Astro featuring a custom bracket system for embedding Claude artifacts directly into blog posts. Writers can seamlessly reference interactive artifacts using a simple `[[word:id]]` syntax that feels native to markdown.

## Features

- **Custom Bracket System**: Embed Claude artifacts with `[[triggerWord:artifactId]]` syntax
- **Content Collections**: Type-safe blog posts with MDX support
- **Animated Starfield**: CSS-only twinkling star background
- **Stacking Panes**: Andy Matuschak-style cascading panes for viewing artifacts and posts
- **Dark Theme**: Beautiful purple gradient accents on dark background
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: Keyboard navigation and focus states

## Tech Stack

- **Astro 5.x**: Static site generation
- **MDX**: Enhanced markdown with components
- **React**: Interactive components
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety throughout

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── StackingPanes.tsx       # Cascading pane viewer for artifacts/posts
│   │   ├── BlogPost.astro          # Blog post layout
│   │   └── StarField.astro         # Animated background
│   ├── content/
│   │   ├── config.ts               # Content collections setup
│   │   └── posts/
│   │       └── example-post.mdx    # Sample blog post
│   ├── layouts/
│   │   └── Layout.astro            # Base HTML layout
│   ├── lib/
│   │   └── bracketParser.ts        # Remark plugin for brackets
│   ├── pages/
│   │   ├── index.astro             # Homepage
│   │   └── posts/
│   │       └── [...slug].astro     # Dynamic post routes
│   └── styles/
│       └── global.css              # Global styles and utilities
├── astro.config.mjs                # Astro configuration
├── netlify.toml                    # Deployment configuration
└── tailwind.config.mjs             # Tailwind configuration
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:4321` to see your blog.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Writing Blog Posts

### Creating a New Post

1. Create a new `.mdx` file in `src/content/posts/`
2. Add frontmatter with required fields:

```mdx
---
title: "Your Post Title"
date: 2025-10-07
description: "A brief description of your post"
---

Your content here...
```

### Using the Bracket System

To embed a Claude artifact, use the bracket syntax anywhere in your post:

```mdx
Check out this [[visualization:abc123-def456-ghi789]] I created.
```

**Syntax**: `[[triggerWord:artifactId]]`

- **triggerWord**: The text that will be displayed (e.g., "transition", "community", "visualization")
- **artifactId**: The Claude artifact ID (found in the artifact URL)

### Finding Artifact IDs

1. Open your artifact in Claude
2. Look at the URL: `https://claude.site/artifacts/[YOUR-ARTIFACT-ID]`
3. Copy the ID and use it in your bracket syntax

### Example

```mdx
---
title: "My Creative Process"
date: 2025-10-07
description: "Exploring the intersection of art and technology"
---

I've been experimenting with [[generative-art:2a378267-bc36-4858-942d-bf0815fdff85]]
and the results have been fascinating.

The [[interactive-demo:another-artifact-id]] shows how users can engage with the concept.
```

When readers click on "generative-art" or "interactive-demo", a full-screen panel slides in from the right displaying the embedded artifact.

## Styling

### Colors

The blog uses a purple gradient theme:

- **Primary**: `#667eea` to `#764ba2`
- **Background**: `#0f1419`
- **Text**: Shades of gray for hierarchy

### Typography

- **Headings**: System font stack
- **Body Text**: Georgia serif for readability
- **Code**: Courier New monospace

### Customization

Edit `tailwind.config.mjs` to customize colors:

```js
colors: {
  'dark-bg': '#0f1419',
  'purple-start': '#667eea',
  'purple-end': '#764ba2',
}
```

## Deployment

### Netlify

The project includes a `netlify.toml` configuration file:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Build settings are automatically detected
4. Deploy!

### Other Platforms

- **Vercel**: Automatically detects Astro
- **Cloudflare Pages**: Use build command `npm run build`
- **GitHub Pages**: Configure base path in `astro.config.mjs`

## Configuration

### Astro Config

The bracket parser is configured in `astro.config.mjs`:

```js
export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [bracketParser],
    }),
    react(),
    tailwind({ applyBaseStyles: false })
  ]
});
```

### Content Collections

Post schema is defined in `src/content/config.ts`:

```ts
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
  }),
});
```

## How It Works

### Bracket Parser

The `bracketParser.ts` remark plugin:

1. Traverses the markdown AST
2. Finds text nodes matching `[[word:id]]`
3. Replaces them with HTML spans containing data attributes
4. Applies styling classes for visual appearance

### Stacking Panes

The `StackingPanes.tsx` component:

1. Listens for clicks on bracketed elements
2. Validates and resolves content (artifacts, posts, or external URLs)
3. Renders content in cascading panes with hover previews
4. Handles keyboard navigation (Enter/Space to open, Escape to close)
5. Supports nested panes via postMessage communication
6. Restores focus when panes are closed

## Accessibility

- **Keyboard Navigation**: Tab to focus, Enter/Space to activate
- **Focus States**: Visible outlines on interactive elements
- **ARIA Attributes**: Proper roles and labels
- **Screen Readers**: Semantic HTML throughout

## Performance

- **Static Generation**: All pages pre-rendered at build time
- **CSS-Only Animations**: No JavaScript for star effects
- **Code Splitting**: React components loaded only when needed
- **Optimized Assets**: Automatic image and font optimization

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

## Troubleshooting

### Bracket Links Not Working

- Ensure the artifact ID is correct (UUID format or registered in ARTIFACT_REGISTRY)
- Check that the artifact is publicly accessible
- Verify `StackingPanes` is included in the layout

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run astro check`
- Clear cache: `rm -rf node_modules/.astro`

### Styling Issues

- Ensure Tailwind is configured correctly
- Check that `global.css` is imported in the layout
- Verify custom classes are defined

## Contributing

This is a personal blog template. Feel free to fork and customize for your own use.

## License

MIT

## Learn More

- [Astro Documentation](https://docs.astro.build)
- [MDX Documentation](https://mdxjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Claude Artifacts](https://claude.ai)
