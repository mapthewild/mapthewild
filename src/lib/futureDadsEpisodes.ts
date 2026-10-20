import episodes from '../data/future-dads-episodes.json';

// Future Dads Club episodes live on futuredadsclub.com. Map the Wild lists them
// as a territory and links out. The list comes from ~/Documents/futuredads/build.py.
export const futureDadsEpisodes = episodes.map((ep) => ({
  slug: `_futuredads_${ep.slug}`,
  href: ep.href,
  data: {
    title: ep.title,
    date: new Date(ep.date),
    description: ep.summary,
    islands: ['futuredads'],
  },
}));

export const FUTURE_DADS_SITE = 'https://futuredadsclub.com';
