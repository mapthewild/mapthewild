import { assetPath } from './assetPath';

export type TerritoryKey = 'map' | 'nowbrary' | 'sunday-ritual' | 'default';
export type AccentKey = 'ochre' | 'verdigris' | 'rose' | 'sienna' | 'ink';

export type PostVisualInput = {
  title?: string;
  description?: string;
  territory?: string;
  island?: string;
  islands?: string[];
  category?: string;
  cardImage?: string;
  heroImage?: string;
  motifs?: string[];
  accent?: string;
};

export type PostVisualResult = {
  image: string;
  accent: AccentKey;
  territory: TerritoryKey;
  motifLabel: string;
  isBespoke: boolean;
};

const polishedFallbacks: Record<TerritoryKey, string> = {
  map: 'assets/images/territories/map-card.png',
  nowbrary: 'assets/images/territories/nowbrary-card.png',
  'sunday-ritual': 'assets/images/territories/sunday-ritual-card.png',
  default: 'assets/images/territories/map-card.png',
};

const territoryAccents: Record<TerritoryKey, AccentKey> = {
  map: 'verdigris',
  nowbrary: 'ochre',
  'sunday-ritual': 'rose',
  default: 'ink',
};

function normalizeTerritory(...values: Array<string | string[] | undefined>): TerritoryKey {
  const joined = values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase();

  if (joined.includes('map')) return 'map';
  if (joined.includes('nowbrary')) return 'nowbrary';
  if (
    joined.includes('sunday ritual') ||
    joined.includes('sunday-ritual') ||
    joined.includes('sunday_ritual') ||
    joined.includes('sundayritual')
  ) {
    return 'sunday-ritual';
  }

  return 'default';
}

function normalizeAccent(value: string | undefined, territory: TerritoryKey): AccentKey {
  const key = (value ?? '').trim().toLowerCase();

  if (key === 'ochre') return 'ochre';
  if (key === 'verdigris') return 'verdigris';
  if (key === 'rose' || key === 'dusty-rose' || key === 'dusty rose') return 'rose';
  if (key === 'sienna' || key === 'burnt-sienna' || key === 'burnt sienna') return 'sienna';
  if (key === 'ink') return 'ink';

  return territoryAccents[territory];
}

function normalizeAssetPath(path: string): string {
  if (/^https?:\/\//.test(path)) return path;

  const clean = path.replace(/^\/mapthewild\//, '').replace(/^\//, '');
  return assetPath(clean);
}

export function getPostVisual(post: PostVisualInput): PostVisualResult {
  const territory = normalizeTerritory(post.territory, post.island, post.islands, post.category);
  const accent = normalizeAccent(post.accent, territory);
  const motifLabel = post.motifs?.filter(Boolean).slice(0, 2).join(' / ') || territory;

  if (post.cardImage) {
    return {
      image: normalizeAssetPath(post.cardImage),
      accent,
      territory,
      motifLabel,
      isBespoke: true,
    };
  }

  return {
    image: assetPath(polishedFallbacks[territory]),
    accent,
    territory,
    motifLabel,
    isBespoke: false,
  };
}

export function getPostVisualFromCollectionEntry(entry: { data: PostVisualInput }): PostVisualResult {
  return getPostVisual(entry.data);
}
