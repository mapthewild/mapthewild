// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { bracketParser } from './src/lib/bracketParser.ts';
import { externalLinks } from './src/lib/externalLinks.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://mapthewild.github.io',
  base: '/mapthewild',
  // Nowbrary became two posts (Oct 2026); the old addresses of parts 3 to 5 forward.
  redirects: {
    '/islands/territory': '/mapthewild/islands/map',
    '/posts/nowbrary-architecture': '/mapthewild/posts/starting-your-nowbrary',
    '/posts/what-nowbrary-isnt': '/mapthewild/posts/nowbrary-living-constellation',
    '/posts/sharing-your-nowbrary': '/mapthewild/posts/starting-your-nowbrary',
    // Moe's own /nowbrary, as the posts suggest for every reader (Oct 2026).
    '/nowbrary': 'https://nowbrary.com/gallery#moe',
  },
  markdown: {
    remarkPlugins: [bracketParser],
    rehypePlugins: [externalLinks],
  },
  integrations: [
    mdx({
      remarkPlugins: [bracketParser],
    }),
    react(),
    tailwind({ applyBaseStyles: false })
  ]
});
