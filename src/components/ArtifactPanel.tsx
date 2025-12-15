import { useEffect, useState } from 'react';

type ContentType = 'artifact' | 'site';

// URL registry for short IDs - avoids markdown auto-linking issues
const URL_REGISTRY: Record<string, string> = {
  // Magic Patterns apps (open in new tab - they block iframes)
  'dtd-app': 'https://project-death-to-divorce-ritual-739.magicpatterns.app',
  '7year-app': 'https://project-seven-year-career-navigator-343.magicpatterns.app',
  'archetype-app': 'https://project-archetypal-reflection-tool-614.magicpatterns.app',

  // Claude artifacts (embed in panel)
  'demo-artifact': 'https://claude.site/public/artifacts/2a378267-bc36-4858-942d-bf0815fdff85/embed',
};

interface PanelState {
  isOpen: boolean;
  type: ContentType | null;
  content: string | null;
  trigger: string | null;
  iframeError: boolean;
}

export default function ArtifactPanel() {
  const [state, setState] = useState<PanelState>({
    isOpen: false,
    type: null,
    content: null,
    trigger: null,
    iframeError: false,
  });

  useEffect(() => {
    const handleBracketClick = (event: Event) => {
      const target = event.target as HTMLElement;

      if (target.classList.contains('bracket-link')) {
        const contentType = target.getAttribute('data-type') as ContentType;
        const content = target.getAttribute('data-content');
        const trigger = target.getAttribute('data-trigger');

        // Handle legacy data-artifact attribute for backwards compatibility
        const legacyArtifact = target.getAttribute('data-artifact');

        if (content || legacyArtifact) {
          const decodedContent = content ? decodeURIComponent(content) : legacyArtifact;

          // Check if this is a Magic Patterns app (blocks iframes) - open directly
          const blockedDomains = ['magicpatterns.app'];
          const registeredUrl = decodedContent && URL_REGISTRY[decodedContent];
          if (registeredUrl && blockedDomains.some(d => registeredUrl.includes(d))) {
            window.open(registeredUrl, '_blank', 'noopener,noreferrer');
            return;
          }

          setState({
            isOpen: true,
            type: contentType || 'artifact',
            content: decodedContent,
            trigger,
            iframeError: false,
          });
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isOpen) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };

    const handleBracketKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.classList.contains('bracket-link') &&
        (event.key === 'Enter' || event.key === ' ')
      ) {
        event.preventDefault();
        handleBracketClick(event as unknown as Event);
      }
    };

    document.addEventListener('click', handleBracketClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleBracketKeyDown);

    return () => {
      document.removeEventListener('click', handleBracketClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleBracketKeyDown);
    };
  }, [state.isOpen]);

  const handleClose = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleIframeError = () => {
    setState(prev => ({ ...prev, iframeError: true }));
  };

  const resolveContent = (content: string): { url: string; type: ContentType } => {
    // Check if it's a registered short ID
    if (URL_REGISTRY[content]) {
      return { url: URL_REGISTRY[content], type: 'site' };
    }

    // Check if it's already a URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      return { url: content, type: 'site' };
    }

    // Default to Claude artifact
    return {
      url: `https://claude.site/public/artifacts/${content}/embed`,
      type: 'artifact'
    };
  };

  const getIframeSrc = (): string => {
    if (!state.content) return '';
    return resolveContent(state.content).url;
  };

  const handleOpenInNewTab = () => {
    if (state.content) {
      const resolved = resolveContent(state.content);
      // For artifacts, remove /embed for the direct link
      const url = resolved.type === 'artifact'
        ? resolved.url.replace('/embed', '')
        : resolved.url;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!state.isOpen || !state.content) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        style={{
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Panel */}
      <div
        className="relative h-full w-full bg-white shadow-2xl flex flex-col"
        style={{
          animation: 'slideIn 0.6s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {state.trigger}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {state.type === 'site' ? 'Website' : 'Artifact'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>

            <button
              onClick={handleClose}
              className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors duration-200"
              aria-label="Close panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative">
          {state.iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Unable to embed this content
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                This website doesn't allow embedding. You can still view it in a new tab.
              </p>
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span>Open in new tab</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <iframe
              src={getIframeSrc()}
              className="w-full h-full border-0"
              title={`${state.type === 'site' ? 'Website' : 'Artifact'}: ${state.trigger || state.content}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox={state.type === 'site'
                ? 'allow-scripts allow-same-origin allow-forms allow-popups'
                : undefined
              }
              referrerPolicy="no-referrer"
              onError={handleIframeError}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
