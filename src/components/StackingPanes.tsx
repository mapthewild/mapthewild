import { useEffect, useState, useRef, useCallback } from 'react';

type ContentType = 'artifact' | 'site' | 'post';

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

// Internal posts that load in panes
const INTERNAL_POSTS = [
  'death-to-divorce',
  'seven-year-career-navigator',
  'archetypal-reflection-tool',
  'tools-for-thinking',
  'ritual-design',
  'metacognitive-tools',
  'contemplative-pause',
  'phone-passing',
  'nowbrary-living-constellation',
  'starting-your-nowbrary',
  'nowbrary-architecture',
  'what-nowbrary-isnt',
  'sharing-your-nowbrary',
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

const resolveContent = (content: string): { url: string; type: ContentType } => {
  if (EXTERNAL_APPS[content]) {
    return { url: EXTERNAL_APPS[content], type: 'site' };
  }
  if (ARTIFACT_REGISTRY[content]) {
    return { url: ARTIFACT_REGISTRY[content], type: 'artifact' };
  }
  if (INTERNAL_POSTS.includes(content)) {
    return { url: `/posts/${content}/embed`, type: 'post' };
  }
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return { url: content, type: 'site' };
  }
  // Fallback: assume it's a Claude artifact ID
  return {
    url: `https://claude.site/public/artifacts/${content}/embed`,
    type: 'artifact'
  };
};

export default function StackingPanes() {
  const [stackedPages, setStackedPages] = useState<StackedPage[]>([]);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stackedPagesRef = useRef<StackedPage[]>([]);

  // Detect if we're inside an iframe (nested StackingPanes)
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  // Keep ref in sync with state
  stackedPagesRef.current = stackedPages;

  const scrollToPane = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const scrollPosition = index * PEEK_WIDTH;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const navigateToStackedPage = useCallback((content: string, trigger: string) => {
    // Use ref for current state to avoid stale closure
    const currentPages = stackedPagesRef.current;

    // Check if already in stack
    const existingIndex = currentPages.findIndex(p => p.content === content);
    if (existingIndex >= 0) {
      // Already open - scroll to it
      scrollToPane(existingIndex);
      return;
    }

    const resolved = resolveContent(content);
    const newPage: StackedPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: resolved.type,
      content,
      trigger,
      url: resolved.url,
    };

    setStackedPages(prev => [...prev, newPage]);

    // Scroll to new page after render
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          left: scrollContainerRef.current.scrollWidth,
          behavior: 'smooth'
        });
      }
    }, 50);
  }, [scrollToPane]);

  const closePage = useCallback((index: number) => {
    setStackedPages(prev => prev.slice(0, index));
  }, []);

  const closeAllPages = useCallback(() => {
    setStackedPages([]);
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
          window.parent.postMessage({
            type: 'stackingPanes:navigate',
            content: decodedContent,
            trigger: trigger || decodedContent,
          }, '*');
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
      if (event.key === 'Escape' && stackedPagesRef.current.length > 0) {
        closePage(stackedPagesRef.current.length - 1);
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
          className="fixed z-[200] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            left: Math.min(hoverPreview.x, window.innerWidth - 420),
            top: Math.min(hoverPreview.y, window.innerHeight - 320),
            width: 400,
            height: 280,
          }}
          onMouseLeave={() => setHoverPreview(null)}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700 truncate">
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
        <div
          className="fixed inset-0 z-50"
          style={{ pointerEvents: 'none' }}
        >
          {/* Backdrop - click to close all */}
          <div
            className="absolute inset-0 bg-black/30"
            style={{ pointerEvents: 'auto' }}
            onClick={closeAllPages}
          />

          {/* Panes container - uses left positioning with calculated offsets */}
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-x-auto"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Inner container sized to fit all panes with peek spacing */}
            <div
              className="relative h-full"
              style={{
                width: Math.max(PAGE_WIDTH + (stackedPages.length - 1) * PEEK_WIDTH, window.innerWidth),
                minWidth: '100%',
              }}
            >
              {stackedPages.map((page, index) => (
                <div
                  key={page.id}
                  className="absolute top-0 h-full bg-white flex flex-col"
                  style={{
                    width: PAGE_WIDTH,
                    left: index * PEEK_WIDTH,
                    zIndex: index,
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Page Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {page.trigger}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                        {page.type === 'post' ? 'Note' : page.type === 'site' ? 'Site' : 'Artifact'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closePage(index);
                      }}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      aria-label="Close"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Page Content - Full height iframe */}
                  <div className="flex-1 overflow-hidden">
                    <iframe
                      src={page.url}
                      className="w-full h-full border-0 bg-white"
                      title={page.trigger}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close All Button */}
          <button
            onClick={closeAllPages}
            className="absolute bottom-4 left-4 z-[60] flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors"
            style={{ pointerEvents: 'auto' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close all ({stackedPages.length})
          </button>
        </div>
      )}

      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
