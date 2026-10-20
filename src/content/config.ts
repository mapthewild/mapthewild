import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    draft: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional(),
    territory: z.string().optional(),
    island: z.string().optional(),
    islands: z.array(z.string()).optional(),
    category: z.string().optional(),
    cardImage: z.string().optional(),
    heroImage: z.string().optional(),
    accent: z.string().optional(),
    motifs: z.array(z.string()).optional(),
  }),
});

export const collections = {
  posts,
};
