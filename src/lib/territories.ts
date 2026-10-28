// Visitor-facing names and navigation summaries. Post metadata stays in its source.
export const territories: Record<string, { name: string; description: string; href: string; dedicatedPage?: boolean }> = {
  nowbrary: { name: 'Nowbrary', description: 'Books, notes and reading.', href: '/mapthewild/islands/nowbrary' },
  map: { name: 'Map', description: 'Ideas and experiments.', href: '/mapthewild/islands/map' },
  sundayritual: { name: 'Sunday Ritual', description: 'Questions for couples to answer and discuss.', href: '/mapthewild/islands/sundayritual', dedicatedPage: true },
  lifein5: { name: 'Life in 5', description: 'A conversation game for two or three people.', href: 'https://mylifein5.com', dedicatedPage: true },
  soulfield: { name: 'Soulfield Oasis', description: 'A card game for two players.', href: '/mapthewild/islands/soulfield', dedicatedPage: true },
  futuredads: { name: 'Future Dads Club', description: 'Because you want to become a present dad', href: '/mapthewild/islands/futuredads' },
};

// Keep historical post metadata intact while presenting one collection.
export const canonicalTerritory = (key: string) => key === 'territory' ? 'map' : key;
export const inTerritory = (keys: string[] | undefined, territory: string) =>
  !!keys?.some(key => canonicalTerritory(key) === canonicalTerritory(territory));
