import { territories, canonicalTerritory, inTerritory } from './territories';
import { territoryNodes, getRoutePosts, getTerritoryRouteMode } from './voyageGraph';

type Post = { slug: string; href?: string; data: { title: string; date: Date; draft?: boolean; islands?: string[] } };
// crop: the scene's centre in the painting (% across, % down) and the painting's width/height,
// from Astra's world-g study (places.js framing); journal.js keeps that point centred in any frame.
export const journalArt: Record<string, { src: string; position: string; size?: string; crop?: string }> = {
  home: { src: '/mapthewild/journal/world-overview.png', position: 'center', size: 'cover' },
  nowbrary: { src: '/mapthewild/world/connected/studies/journey-storyboard/asset-study/shore-layout/motion/art/shore-empty-v1.png', position: '50% 38%', size: 'cover' },
  map: { src: '/mapthewild/journal/world-overview.png', position: '0% 72%', size: '250%', crop: '19 68 1.5' },
  sundayritual: { src: '/mapthewild/images/territory-sundayritual.jpeg', position: 'center', size: 'cover' },
  soulfield: { src: '/mapthewild/images/territory-soulfield.jpeg', position: 'center', size: 'cover' },
  lifein5: { src: '/mapthewild/images/territory-lifein5.jpg', position: 'center', size: 'cover' },
  futuredads: { src: '/mapthewild/journal/future-dads-island.png', position: '50% 55%', size: 'cover' },
};
export const pathKey = (path: string) => path.split(/[?#]/)[0].replace(/\/$/, '');
export function journalNavigation(pathname: string, entries: Post[]) {
  const path = pathKey(pathname);
  const posts = entries.filter(p => !p.data.draft);
  const postHref = (p: Post) => p.href ?? `/mapthewild/posts/${p.slug}`;
  const current = posts.find(p => pathKey(postHref(p)) === path);
  const sourceKey = current?.data.islands?.[0] ?? Object.keys(territories).find(k => pathKey(territories[k].href) === path);
  const key = sourceKey ? canonicalTerritory(sourceKey) : undefined;
  const territory = key ? territories[key] : undefined;
  const route = key ? getRoutePosts(posts.filter(p => inTerritory(p.data.islands, key))) : [];
  const series = getTerritoryRouteMode(key) === 'series';
  const index = current ? route.findIndex(p => p.slug === current.slug) : -1;
  const isCurrent = (href: string) => pathKey(href) === path;
  const stops = territory ? [
    { title: territory.name, href: territory.href, kind: 'place', current: isCurrent(territory.href), meta: 'Place' },
    ...route.map(p => ({title:p.data.title,href:postHref(p),kind:'post',current:isCurrent(postHref(p)),meta:series?`Part ${route.indexOf(p)+1} of ${route.length}`:p.data.date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})})),
  ] : territoryNodes.map(p=>({title:p.label,href:p.href,kind:'place',current:isCurrent(p.href),meta:''}));
  const art = journalArt[key ?? 'home'] ?? journalArt.home;
  return { path: path === pathKey('/mapthewild/') ? '/mapthewild/' : path, title: current?.data.title ?? territory?.name ?? 'Places', territory: key ?? '', isArticle: !!current,
    art, stops, artTitle: territory?.name ?? 'Places', artHref: territory?.href ?? '/mapthewild/islands/',
    collection: territory ? {title:route.length ? (key === 'futuredads' ? 'All episodes' : 'All posts') : 'About this place',href:territory.href} : {title:'All writing',href:'/mapthewild/posts/'},
    next: index >= 0 && route[index+1] ? { title:route[index+1].data.title, href:postHref(route[index+1]) } : null,
  };
}
