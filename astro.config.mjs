// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { bracketParser } from './src/lib/bracketParser.ts';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [bracketParser],
  },
  integrations: [
    mdx({
      remarkPlugins: [bracketParser],
    }),
    react(),
    tailwind({ applyBaseStyles: false })
  ]
});
