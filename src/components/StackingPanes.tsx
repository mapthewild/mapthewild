import { useEffect, useState, useRef, useCallback } from 'react';

type ContentType = 'artifact' | 'site' | 'post';

// Design system color palette (2026 alive)
const COLORS = {
  parchment: {
    DEFAULT: '#f5f0e6',
    dark: '#e8e3d9',
  },
  ink: {
    DEFAULT: '#4a3f35',
    light: '#6b5d4d',
    muted: '#8a7a66',
  },
  grid: '#b8a990',
  ochre: {
    DEFAULT: '#c4a035',
    dark: '#9a7f2a',
    bg: 'rgba(196, 160, 53, 0.15)',
  },
  sienna: {
    DEFAULT: '#a03e20',
    bg: 'rgba(160, 62, 32, 0.15)',
  },
  verdigris: {
    DEFAULT: '#2d6a6a',
    bg: 'rgba(45, 106, 106, 0.12)',
  },
  rose: {
    DEFAULT: '#c9a0a0',
    dark: '#8a6b6b',
    bg: 'rgba(201, 160, 160, 0.25)',
  },
  white: '#ffffff',
};

// Trusted origins for postMessage communication
// Messages from other origins are rejected for security
const TRUSTED_ORIGINS = [
  'https://focusedition.github.io',
  'https://mapthewild.github.io',
  'https://claude.site',
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
  'http://localhost:4324',
  'http://localhost:4325',
  'http://localhost:4326',
  'http://localhost:3000',
];

// External apps that block iframes - open in new tab
const EXTERNAL_APPS: Record<string, string> = {
  'dtd-app': 'https://project-death-to-divorce-ritual-739.magicpatterns.app',
  '7year-app': 'https://project-seven-year-career-navigator-343.magicpatterns.app',
  'archetype-app': 'https://project-archetypal-reflection-tool-614.magicpatterns.app',
};

// Claude artifacts registry - maps short IDs to full embed URLs
const ARTIFACT_REGISTRY: Record<string, string> = {
  'demo-artifact': 'https://claude.site/public/artifacts/2a378267-bc36-4858-942d-bf0815fdff85/embed',
};

// Input validation utilities
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isValidArtifactId(id: string): boolean {
  // UUID format: 8-4-4-4-12 hex chars (standard Claude artifact IDs)
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  // Short alphanumeric (for registry keys like 'demo-artifact')
  const shortIdPattern = /^[a-z0-9][a-z0-9-]{0,50}$/i;
  return uuidPattern.test(id) || shortIdPattern.test(id);
}

function isValidPostSlug(slug: string): boolean {
  // Slugs are lowercase alphanumeric with hyphens, reasonable length
  const slugPattern = /^[a-z0-9][a-z0-9-]{0,100}$/;
  return slugPattern.test(slug);
}

// Internal posts that load in panes
const INTERNAL_POSTS = [
  // Nowbrary series
  'nowbrary-living-constellation',
  'starting-your-nowbrary',
  'nowbrary-architecture',
  'what-nowbrary-isnt',
  'sharing-your-nowbrary',
  // Map territory
  'beyond-the-boxes',
  'candor-conversation-flow',
  'digital-hoarding-intelligence',
  'evolution-of-surveillance',
  'my-ai-struggle',
  'well-log-poc',
];

interface StackedPage {
  id: string;
  type: ContentType;
  content: string;
  trigger: string;
  url: string;
}

interface HoverPreview {
  visible: boolean;
  trigger: string;
  url: string;
  x: number;
  y: number;
}

const PAGE_WIDTH = 640;
const PEEK_WIDTH = 40; // How much of previous pages show

const resolveContent = (content: string): { url: string; type: ContentType } | null => {
  // Check registered apps first (trusted, pre-validated)
  if (EXTERNAL_APPS[content]) {
    return { url: EXTERNAL_APPS[content], type: 'site' };
  }

  // Check artifact registry (trusted, pre-validated)
  if (ARTIFACT_REGISTRY[content]) {
    return { url: ARTIFACT_REGISTRY[content], type: 'artifact' };
  }

  // Validate external URLs
  if (content.startsWith('http://') || content.startsWith('https://')) {
    if (!isValidUrl(content)) {
      console.warn('Invalid URL rejected:', content);
      return null;
    }
    return { url: content, type: 'site' };
  }

  // Check if it's a valid post slug (lowercase alphanumeric with hyphens)
  // This is more permissive - any valid slug is treated as a post
  if (isValidPostSlug(content)) {
    return { url: `/mapthewild/posts/${content}/embed`, type: 'post' };
  }

  // Check if it's a UUID (artifact ID)
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (uuidPattern.test(content)) {
    return {
      url: `https://claude.site/public/artifacts/${content}/embed`,
      type: 'artifact'
    };
  }

  console.warn('Could not resolve content type:', content);
  return null;
};

export default function StackingPanes() {
  const [stackedPages, setStackedPages] = useState<StackedPage[]>([]);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stackedPagesRef = useRef<StackedPage[]>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect if we're inside an iframe (nested StackingPanes)
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle panes-open class on main content
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    if (stackedPages.length > 0) {
      mainContent.classList.add('panes-open');
    } else {
      mainContent.classList.remove('panes-open');
    }
  }, [stackedPages.length]);

  // Keep ref in sync with state
  stackedPagesRef.current = stackedPages;

  const scrollToPane = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      // Each pane is full container width, so scroll to index * containerWidth
      // Subtract the accumulated spine widths so content is fully visible
      const scrollPosition = index * containerWidth - index * PEEK_WIDTH;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const navigateToStackedPage = useCallback((content: string, trigger: string) => {
    // Use ref for current state to avoid stale closure
    const currentPages = stackedPagesRef.current;

    // Store focus before opening first pane (for restoration on close)
    if (currentPages.length === 0) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Check if already in stack
    const existingIndex = currentPages.findIndex(p => p.content === content);
    if (existingIndex >= 0) {
      // Already open - scroll to it
      scrollToPane(existingIndex);
      return;
    }

    const resolved = resolveContent(content);
    if (!resolved) {
      console.warn('Could not resolve content:', content);
      return;
    }

    const newPage: StackedPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: resolved.type,
      content,
      trigger,
      url: resolved.url,
    };

    setStackedPages(prev => {
      const newPages = [...prev, newPage];
      // Scroll to new page after render
      setTimeout(() => {
        scrollToPane(newPages.length - 1);
      }, 50);
      return newPages;
    });
  }, [scrollToPane]);

  const closePage = useCallback((index: number) => {
    setStackedPages(prev => {
      const newPages = prev.slice(0, index);
      // Restore focus when closing the last pane
      if (newPages.length === 0 && previousFocusRef.current) {
        setTimeout(() => {
          previousFocusRef.current?.focus();
          previousFocusRef.current = null;
        }, 0);
      }
      return newPages;
    });
  }, []);

  const closeAllPages = useCallback(() => {
    setStackedPages([]);
    // Restore focus to previously focused element
    setTimeout(() => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }, 0);
  }, []);

  // Handle bracket link interactions
  useEffect(() => {
    // Click handler - works in both parent and iframe contexts
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('bracket-link')) return;

      event.preventDefault();
      event.stopPropagation();

      const content = target.getAttribute('data-content');
      const trigger = target.getAttribute('data-trigger');

      if (content) {
        const decodedContent = decodeURIComponent(content);

        // If we're in an iframe, send message to parent window
        if (isInIframe && window.parent) {
          // Use current origin for same-origin parent, or try trusted origins
          const targetOrigin = window.location.origin;
          window.parent.postMessage({
            type: 'stackingPanes:navigate',
            content: decodedContent,
            trigger: trigger || decodedContent,
          }, targetOrigin);
          return;
        }

        // Parent window: handle directly
        if (EXTERNAL_APPS[decodedContent]) {
          window.open(EXTERNAL_APPS[decodedContent], '_blank', 'noopener,noreferrer');
          return;
        }

        setHoverPreview(null);
        navigateToStackedPage(decodedContent, trigger || decodedContent);
      }
    };

    // Always listen for clicks (both parent and iframe need this)
    document.addEventListener('click', handleClick, true);

    // If in iframe, only need click handler to forward messages
    if (isInIframe) {
      return () => {
        document.removeEventListener('click', handleClick, true);
      };
    }

    // Parent-only: Listen for messages from iframes
    const handleMessage = (event: MessageEvent) => {
      // Security: Validate origin before processing messages
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        console.warn('Rejected postMessage from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'stackingPanes:navigate') {
        const { content, trigger } = event.data;

        if (EXTERNAL_APPS[content]) {
          window.open(EXTERNAL_APPS[content], '_blank', 'noopener,noreferrer');
          return;
        }

        setHoverPreview(null);
        navigateToStackedPage(content, trigger);
      }
    };

    const handleMouseEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('bracket-link')) return;

      const content = target.getAttribute('data-content');
      const trigger = target.getAttribute('data-trigger');

      if (content) {
        const decodedContent = decodeURIComponent(content);
        if (EXTERNAL_APPS[decodedContent]) return;

        const resolved = resolveContent(decodedContent);
        if (!resolved) return; // Invalid content, skip preview

        const rect = target.getBoundingClientRect();

        hoverTimeoutRef.current = setTimeout(() => {
          setHoverPreview({
            visible: true,
            trigger: trigger || decodedContent,
            url: resolved.url,
            x: rect.left,
            y: rect.bottom + 8,
          });
        }, 400);
      }
    };

    const handleMouseLeave = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target.classList.contains('bracket-link')) return;

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setTimeout(() => {
        const previewEl = document.getElementById('hover-preview');
        if (!previewEl?.matches(':hover')) {
          setHoverPreview(null);
        }
      }, 100);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Close pane on Escape
      if (event.key === 'Escape' && stackedPagesRef.current.length > 0) {
        closePage(stackedPagesRef.current.length - 1);
        return;
      }

      // Handle Enter/Space on bracket links for keyboard accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (!target.classList.contains('bracket-link')) return;

        event.preventDefault();
        const content = target.getAttribute('data-content');
        const trigger = target.getAttribute('data-trigger');

        if (content) {
          const decodedContent = decodeURIComponent(content);

          // If we're in an iframe, send message to parent window
          if (isInIframe && window.parent) {
            const targetOrigin = window.location.origin;
            window.parent.postMessage({
              type: 'stackingPanes:navigate',
              content: decodedContent,
              trigger: trigger || decodedContent,
            }, targetOrigin);
            return;
          }

          // Parent window: handle directly
          if (EXTERNAL_APPS[decodedContent]) {
            window.open(EXTERNAL_APPS[decodedContent], '_blank', 'noopener,noreferrer');
            return;
          }

          setHoverPreview(null);
          navigateToStackedPage(decodedContent, trigger || decodedContent);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [isInIframe, navigateToStackedPage, closePage, stackedPages.length]);

  const hasPages = stackedPages.length > 0;

  // Don't render anything if we're inside an iframe
  if (isInIframe) {
    return null;
  }

  return (
    <>
      {/* Hover Preview Popover */}
      {hoverPreview?.visible && (
        <div
          id="hover-preview"
          className="fixed z-[200] rounded-lg shadow-2xl overflow-hidden"
          style={{
            left: Math.min(hoverPreview.x, window.innerWidth - 420),
            top: Math.min(hoverPreview.y, window.innerHeight - 320),
            width: 400,
            height: 280,
            backgroundColor: COLORS.parchment.DEFAULT,
            border: `2px solid ${COLORS.grid}40`,
          }}
          onMouseLeave={() => setHoverPreview(null)}
        >
          <div
            className="flex items-center justify-between"
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${COLORS.grid}20`,
              backgroundColor: COLORS.parchment.dark,
            }}
          >
            <span className="truncate" style={{
              color: COLORS.ink.DEFAULT,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '13px'
            }}>
              {hoverPreview.trigger}
            </span>
          </div>
          <iframe
            src={hoverPreview.url}
            className="w-full border-0"
            style={{ height: 'calc(100% - 40px)' }}
            title={`Preview: ${hoverPreview.trigger}`}
          />
        </div>
      )}

      {/* Stacked Pages Container */}
      {hasPages && (
        <>
          {/* Backdrop - only on mobile */}
          {isMobile && (
            <div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: `${COLORS.ink.muted}40` }}
              onClick={closeAllPages}
            />
          )}

          {/* Panes container - fixed right panel with horizontal scroll */}
          <div
            ref={scrollContainerRef}
            className="fixed top-0 right-0 h-full z-50 flex overflow-x-auto"
            style={{
              width: isMobile ? '100%' : '50vw',
              maxWidth: isMobile ? '100%' : PAGE_WIDTH,
            }}
          >
            {stackedPages.map((page, index) => (
              <div
                key={page.id}
                className="h-full flex flex-shrink-0"
                style={{
                  // PANE is sticky - overlaps previous panes, showing only their spines
                  position: 'sticky',
                  left: index * PEEK_WIDTH,
                  width: PAGE_WIDTH,
                  background: COLORS.parchment.DEFAULT,
                  zIndex: index, // Later panes on top
                }}
              >
                {/* Spine - rotated title tab (no longer sticky, pane handles that) */}
                <div
                  className="h-full flex-shrink-0 cursor-pointer flex items-center justify-center transition-colors"
                  style={{
                    width: PEEK_WIDTH,
                    background: COLORS.parchment.dark,
                    borderRight: `1px solid ${COLORS.grid}`,
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                  }}
                  onClick={() => scrollToPane(index)}
                  title={page.trigger}
                >
                  <span className="truncate px-2 max-h-[200px]" style={{
                    color: COLORS.ink.muted,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: '12px'
                  }}>
                    {page.trigger}
                  </span>
                </div>

                {/* Pane content */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Page Header */}
                  <div
                    className="flex items-center justify-between flex-shrink-0"
                    style={{
                      padding: '10px 16px',
                      background: COLORS.parchment.dark,
                      borderBottom: `1px solid ${COLORS.grid}`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="truncate" style={{
                        color: COLORS.ink.DEFAULT,
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: '14px',
                        fontWeight: 'normal'
                      }}>
                        {page.trigger}
                      </span>
                      <span
                        className="flex-shrink-0"
                        style={{
                          fontSize: '11px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: page.type === 'post' ? COLORS.rose.bg : page.type === 'site' ? COLORS.verdigris.bg : COLORS.ochre.bg,
                          color: page.type === 'post' ? COLORS.rose.dark : page.type === 'site' ? COLORS.verdigris.DEFAULT : COLORS.ochre.dark,
                        }}
                      >
                        {page.type === 'post' ? 'NOTE' : page.type === 'site' ? 'SITE' : 'ARTIFACT'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closePage(index);
                      }}
                      className="flex items-center justify-center rounded transition-colors"
                      style={{
                        width: '28px',
                        height: '28px',
                        color: COLORS.ink.muted,
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.sienna.bg;
                        e.currentTarget.style.color = COLORS.sienna.DEFAULT;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.ink.muted;
                      }}
                      aria-label="Close"
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Page Content - Full height iframe */}
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={page.url}
                      className="w-full h-full border-0"
                      style={{ background: COLORS.parchment.DEFAULT }}
                      title={page.trigger}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close All Button */}
          <button
            onClick={closeAllPages}
            className="fixed z-[60] flex items-center transition-colors"
            style={{
              bottom: '16px',
              right: '16px',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '6px',
              backgroundColor: COLORS.sienna.bg,
              color: COLORS.sienna.DEFAULT,
              border: `1px solid ${COLORS.sienna.DEFAULT}`,
              fontFamily: "Georgia, serif",
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.sienna.DEFAULT;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.sienna.bg;
              e.currentTarget.style.color = COLORS.sienna.DEFAULT;
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close all ({stackedPages.length})
          </button>
        </>
      )}

      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
