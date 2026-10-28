import { getCollection } from 'astro:content';
import { standaloneEssays } from '../lib/standaloneEssays';
import { futureDadsEpisodes } from '../lib/futureDadsEpisodes';
import { journalNavigation } from '../lib/journalNavigation';
export async function GET() {
  const entries = [...await getCollection('posts'), ...standaloneEssays, ...futureDadsEpisodes];
  return new Response(JSON.stringify(standaloneEssays.map(p => journalNavigation(p.href, entries))));
}
