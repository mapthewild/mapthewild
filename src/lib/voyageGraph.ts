export type VoyageKind = 'home' | 'territory' | 'post';

export type VoyageNode = {
  id: string;
  kind: VoyageKind;
  label: string;
  href: string;
  x: number;
  y: number;
  parentId?: string;
  island?: string;
  slug?: string;
  status?: 'past' | 'current' | 'future';
  meta?: string;
  isTerminal?: boolean;
};

type VoyagePost = {
  slug: string;
  href?: string;
  data: {
    title: string;
    date: Date;
    draft?: boolean;
    islands?: string[];
  };
};

export type VoyageRoute = {
  id: string;
  d: string;
  active: boolean;
};

export type VoyageState = {
  nodes: VoyageNode[];
  routes: VoyageRoute[];
  currentNode: VoyageNode;
  activeIsland?: string;
};

export const VOYAGE_WIDTH = 1200;
export const VOYAGE_HEIGHT = 220;
export const SITE_BASE = '/mapthewild';

export type TerritoryRouteMode = 'series' | 'dated';

const VISIBLE_POST_SLOTS = [
  { x: 575, y: 80 },
  { x: 780, y: 110 },
  { x: 985, y: 80 },
] as const;

const territoryRouteModes: Record<string, TerritoryRouteMode> = {
  nowbrary: 'series',
  map: 'dated',
  sundayritual: 'dated',
  futuredads: 'dated',
};

export const territoryNodes: VoyageNode[] = [
  {
    id: 'nowbrary',
    kind: 'territory',
    label: 'Nowbrary',
    href: `${SITE_BASE}/islands/nowbrary`,
    x: 320,
    y: 92,
    parentId: 'home',
    island: 'nowbrary',
  },
  {
    id: 'map',
    kind: 'territory',
    label: 'Map',
    href: `${SITE_BASE}/islands/map`,
    x: 530,
    y: 132,
    parentId: 'home',
    island: 'map',
  },
  {
    id: 'sundayritual',
    kind: 'territory',
    label: 'Sunday Ritual',
    href: `${SITE_BASE}/islands/sundayritual`,
    x: 740,
    y: 92,
    parentId: 'home',
    island: 'sundayritual',
  },
  {
    id: 'futuredads',
    kind: 'territory',
    label: 'Future Dads Club',
    href: `${SITE_BASE}/islands/futuredads`,
    x: 950,
    y: 132,
    parentId: 'home',
    island: 'futuredads',
  },
];

export const homeNode: VoyageNode = {
  id: 'home',
  kind: 'home',
  label: 'Home',
  href: `${SITE_BASE}/`,
  x: 112,
  y: 126,
};

export function symbolForVoyageKind(kind: VoyageKind): string {
  if (kind === 'home') return '#mtw-compass';
  if (kind === 'territory') return '#mtw-flag';
  return '#mtw-feather';
}

export function iconNameForVoyageKind(kind: VoyageKind): string {
  if (kind === 'home') return 'compass';
  if (kind === 'territory') return 'flag';
  return 'feather';
}

export function getVoyageState(pathname: string, posts: VoyagePost[]): VoyageState {
  const publishedPosts = posts.filter((post) => !post.data.draft);

  const normalizedPath = normalizePath(pathname);
  const currentPostSlug = getPostSlug(normalizedPath);
  const currentPost = currentPostSlug
    ? publishedPosts.find((post) => post.slug === currentPostSlug)
    : undefined;

  const isHome = normalizedPath === SITE_BASE || normalizedPath === `${SITE_BASE}/`;
  const pathIsland = getIslandFromPath(normalizedPath);
  const activeIsland = pathIsland || currentPost?.data.islands?.[0];
  const activeTerritory = territoryNodes.find((node) => node.island === activeIsland);
  const nodes = isHome
    ? getHomeNodes()
    : activeTerritory
      ? getRouteNodes(activeTerritory, publishedPosts, currentPostSlug)
      : currentPost
        ? getUnchartedPostNodes(currentPost)
        : getHomeNodes();
  const currentNode = nodes.find((node) => node.status === 'current') || homeNode;

  return {
    nodes,
    routes: getRoutes(nodes),
    currentNode,
    activeIsland,
  };
}

function getHomeNodes(): VoyageNode[] {
  return [
    { ...homeNode, status: 'current' },
    ...territoryNodes.map((node) => ({ ...node, status: 'future' as const })),
  ];
}

function getUnchartedPostNodes(post: VoyagePost): VoyageNode[] {
  return [
    { ...homeNode, status: 'past' },
    makePostNode(post, { ...VISIBLE_POST_SLOTS[0], status: 'current' }),
  ];
}

function getRouteNodes(
  territory: VoyageNode,
  posts: VoyagePost[],
  currentPostSlug?: string
): VoyageNode[] {
  const islandPosts = posts.filter((post) => post.data.islands?.includes(territory.island || ''));
  const routePosts = getRoutePosts(islandPosts);
  const routeMode = getTerritoryRouteMode(territory.island);
  const territoryPort = {
    ...territory,
    x: 330,
    y: 118,
    status: currentPostSlug ? 'past' as const : 'current' as const,
  };

  if (!currentPostSlug) {
    const visiblePosts = getVisiblePosts(routePosts, undefined, routeMode);
    return [
      { ...homeNode, x: 112, y: 126, status: 'past' },
      territoryPort,
      ...visiblePosts.map((post, index) =>
        makePostNode(post, {
          ...VISIBLE_POST_SLOTS[index],
          parentId: territory.id,
          island: territory.island,
          status: 'future',
          meta: getPostMeta(post, routePosts, routeMode),
          isTerminal: isLatestPost(post, routePosts),
        })
      ),
    ];
  }

  const currentIndex = routePosts.findIndex((post) => post.slug === currentPostSlug);
  if (currentIndex < 0) {
    return [{ ...homeNode, x: 112, y: 126, status: 'past' }, territoryPort];
  }

  const visiblePosts = getVisiblePosts(routePosts, currentIndex, routeMode);
  const nodes: VoyageNode[] = [
    { ...homeNode, x: 112, y: 126, status: 'past' },
    territoryPort,
  ];

  visiblePosts.forEach((post, index) => {
    const postIndex = routePosts.findIndex((candidate) => candidate.slug === post.slug);
    nodes.push(makePostNode(post, {
      ...VISIBLE_POST_SLOTS[index],
      parentId: territory.id,
      island: territory.island,
      status: getPostStatus(postIndex, currentIndex),
      meta: getPostMeta(post, routePosts, routeMode),
      isTerminal: isLatestPost(post, routePosts),
    }));
  });

  return nodes;
}

export function getRoutePosts<T extends Pick<VoyagePost, 'slug' | 'data'>>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const dateDifference = a.data.date.valueOf() - b.data.date.valueOf();
    if (dateDifference !== 0) return dateDifference;
    return a.slug.localeCompare(b.slug);
  });
}

export function getTerritoryRouteMode(island: string | undefined): TerritoryRouteMode {
  return island ? territoryRouteModes[island] ?? 'dated' : 'dated';
}

function getVisiblePosts(
  posts: VoyagePost[],
  currentIndex: number | undefined,
  routeMode: TerritoryRouteMode
): VoyagePost[] {
  if (posts.length <= VISIBLE_POST_SLOTS.length) return posts;

  const latestWindowStart = Math.max(0, posts.length - VISIBLE_POST_SLOTS.length);

  if (currentIndex === undefined) {
    return routeMode === 'series'
      ? posts.slice(0, VISIBLE_POST_SLOTS.length)
      : posts.slice(latestWindowStart);
  }

  // Centre the window on the current post so there is always a stop before and after it.
  const startIndex = Math.min(Math.max(currentIndex - 1, 0), latestWindowStart);

  return posts.slice(startIndex, startIndex + VISIBLE_POST_SLOTS.length);
}

function getPostStatus(
  postIndex: number,
  currentIndex: number
): NonNullable<VoyageNode['status']> {
  if (postIndex < currentIndex) return 'past';
  if (postIndex === currentIndex) return 'current';
  return 'future';
}

function getPostMeta(
  post: VoyagePost,
  posts: VoyagePost[],
  routeMode: TerritoryRouteMode
): string {
  const postIndex = posts.findIndex((candidate) => candidate.slug === post.slug);
  if (postIndex < 0) return '';

  if (routeMode === 'series') {
    return `${postIndex + 1} of ${posts.length}`;
  }

  const dateLabel = formatPostDate(post.data.date);
  return isLatestIndex(postIndex, posts) ? `Latest · ${dateLabel}` : dateLabel;
}

function isLatestPost(post: VoyagePost, posts: VoyagePost[]): boolean {
  return posts[posts.length - 1]?.slug === post.slug;
}

function isLatestIndex(index: number, posts: VoyagePost[]): boolean {
  return index === posts.length - 1;
}

function formatPostDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function makePostNode(
  post: VoyagePost,
  options: Pick<VoyageNode, 'x' | 'y' | 'parentId' | 'island' | 'status' | 'meta' | 'isTerminal'>
): VoyageNode {
  return {
    id: `post-${post.slug}`,
    kind: 'post',
    label: post.data.title,
    href: post.href ?? `${SITE_BASE}/posts/${post.slug}`,
    slug: post.slug,
    ...options,
  };
}

function getRoutes(nodes: VoyageNode[]): VoyageRoute[] {
  return nodes.slice(1).map((node, index) => {
    const previous = nodes[index];
    return {
      id: `${previous.id}-${node.id}`,
      d: routePath(previous, node),
      active: previous.status !== 'future' && node.status !== 'future',
    };
  });
}

function routePath(from: VoyageNode, to: VoyageNode): string {
  const dx = to.x - from.x;
  const lift = from.kind === 'home' ? 44 : 34;
  return [
    `M ${from.x} ${from.y}`,
    `C ${from.x + dx * 0.34} ${from.y - lift}`,
    `${from.x + dx * 0.68} ${to.y + lift}`,
    `${to.x} ${to.y}`,
  ].join(' ');
}

function getPostSlug(pathname: string): string | undefined {
  const match = pathname.match(/^\/mapthewild\/posts\/([^/]+)$/);
  return match?.[1];
}

function getIslandFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/mapthewild\/islands\/([^/]+)$/);
  return match?.[1];
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
