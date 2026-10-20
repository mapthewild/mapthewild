import { useEffect } from 'react';
import type { VoyageNode } from '../../lib/voyageGraph';

type Props = {
  currentNode: Pick<VoyageNode, 'id' | 'href' | 'x' | 'y'>;
};

const VISITED_KEY = 'mtw:voyage:visited-hrefs';
const LAST_NODE_KEY = 'mtw:voyage:last-node';
const SAIL_DURATION = 980;

export default function VoyageRuntime({ currentNode }: Props) {
  useEffect(() => {
    markCurrentVisited(currentNode.href);
    applyVisitedState();
    scrollCurrentPortIntoView();

    const ports = Array.from(document.querySelectorAll<HTMLAnchorElement>('.voyage-port[href]'));
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      // Readers who ask for less motion go straight to the page, no sailing delay.
      if (prefersReducedMotion()) return;

      const port = event.currentTarget as HTMLAnchorElement;
      const href = port.getAttribute('href');
      if (!href || normalizePath(href) === normalizePath(window.location.pathname)) return;

      event.preventDefault();
      markCurrentVisited(href);
      port.classList.add('is-visited');
      port.classList.add('is-sailing-target');
      document.documentElement.classList.add('voyage-is-sailing');
      sailShipTo(port);

      try {
        window.sessionStorage.setItem(
          LAST_NODE_KEY,
          JSON.stringify({
            id: port.dataset.nodeId || href,
            x: Number(port.dataset.x || currentNode.x),
            y: Number(port.dataset.y || currentNode.y),
          })
        );
      } catch {
        // Storage can be blocked; sailing still works without the memory.
      }

      window.setTimeout(() => {
        window.location.href = href;
      }, SAIL_DURATION);
    };

    ports.forEach((port) => port.addEventListener('click', handleClick));

    return () => {
      ports.forEach((port) => port.removeEventListener('click', handleClick));
      document.documentElement.classList.remove('voyage-is-sailing');
    };
  }, [currentNode.href, currentNode.id, currentNode.x, currentNode.y]);

  return null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// On narrow screens the strip scrolls sideways; start it with the reader's stop in view.
function scrollCurrentPortIntoView() {
  const scroller = document.querySelector<HTMLElement>('.voyage-header__scroller');
  const current = document.querySelector<HTMLElement>('.voyage-port.is-current, .voyage-port[data-status="current"]');
  if (!scroller || !current || scroller.scrollWidth <= scroller.clientWidth) return;

  const scrollerBox = scroller.getBoundingClientRect();
  const portBox = current.getBoundingClientRect();
  const portCentre = portBox.left - scrollerBox.left + scroller.scrollLeft + portBox.width / 2;
  scroller.scrollLeft = Math.max(0, portCentre - scroller.clientWidth / 2);
}

function sailShipTo(port: HTMLElement) {
  const ship = document.querySelector<HTMLElement>('.voyage-ship-sprite');
  if (!ship) return;

  const dockX = Number(port.dataset.dockX);
  const dockY = Number(port.dataset.dockY);
  if (!Number.isFinite(dockX) || !Number.isFinite(dockY)) return;

  ship.style.left = `calc(${dockX} / 1200 * 100%)`;
  ship.style.top = `calc(${dockY} / 220 * 100%)`;
}

function applyVisitedState() {
  const visited = getVisited();
  document.querySelectorAll<HTMLAnchorElement>('.voyage-port[href]').forEach((port) => {
    const href = port.getAttribute('href');
    if (href && visited.has(normalizePath(href))) {
      port.classList.add('is-visited');
    }
  });
}

function markCurrentVisited(href: string) {
  const visited = getVisited();
  visited.add(normalizePath(href));
  try {
    window.localStorage.setItem(VISITED_KEY, JSON.stringify(Array.from(visited)));
  } catch {
    // Storage can be blocked; visited marks are a nicety, not required.
  }
}

function getVisited(): Set<string> {
  try {
    const rawValue = window.localStorage.getItem(VISITED_KEY);
    if (!rawValue) return new Set();
    const parsed = JSON.parse(rawValue) as string[];
    return new Set(parsed.map(normalizePath));
  } catch {
    return new Set();
  }
}

function normalizePath(path: string): string {
  try {
    const url = new URL(path, window.location.origin);
    path = url.pathname;
  } catch {
    // Keep the original path if URL parsing fails.
  }

  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}
