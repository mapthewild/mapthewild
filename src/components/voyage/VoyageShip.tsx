import { useEffect, useState } from 'react';
import type { VoyageNode } from '../../lib/voyageGraph';

type Props = {
  currentNode: Pick<VoyageNode, 'id' | 'x' | 'y'>;
};

type StoredNode = Pick<VoyageNode, 'id' | 'x' | 'y'>;

const STORAGE_KEY = 'mtw:voyage:last-node';

export default function VoyageShip({ currentNode }: Props) {
  const [shipNode, setShipNode] = useState<StoredNode>(currentNode);

  useEffect(() => {
    const previousNode = readPreviousNode();

    if (previousNode && previousNode.id !== currentNode.id) {
      setShipNode(previousNode);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setShipNode(currentNode);
        });
      });
    } else {
      setShipNode(currentNode);
    }

    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentNode));
    } catch {
      // Storage can be blocked; the ship just appears at the current stop.
    }
  }, [currentNode.id, currentNode.x, currentNode.y]);

  useEffect(() => {
    assertVoyageMetaphor();
  }, [currentNode.id]);

  return (
    <div className="voyage-ship-layer" aria-hidden="true">
      <div
        className="voyage-ship-sprite"
        data-kind="ship"
        style={{
          left: `calc(${shipNode.x} / 1200 * 100%)`,
          top: `calc(${shipNode.y} / 220 * 100%)`,
        }}
      >
        <svg className="voyage-ship-sprite__glyph" viewBox="0 0 64 64" focusable="false">
          <path d="M14 42 C23 48 43 49 52 41 C49 50 23 53 14 42 Z" />
          <path d="M32 12 V42" />
          <path d="M31 15 C23 23 20 32 20 41 H31 Z" />
          <path d="M34 16 C43 22 47 32 45 41 H34 Z" />
          <path d="M13 51 C21 48 26 54 34 51 C42 48 48 54 55 51" />
        </svg>
      </div>
    </div>
  );
}

function readPreviousNode(): StoredNode | null {
  try {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as StoredNode;
    if (!parsed.id || typeof parsed.x !== 'number' || typeof parsed.y !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function assertVoyageMetaphor() {
  const ships = document.querySelectorAll('.voyage-ship-sprite');
  if (ships.length !== 1) {
    console.error(`[VoyageHeader] Expected exactly one moving ship sprite. Found ${ships.length}.`);
  }

  const shipPorts = document.querySelectorAll('.voyage-port[data-icon="ship"]');
  if (shipPorts.length > 0) {
    console.error('[VoyageHeader] Port markers must never use the ship icon.', Array.from(shipPorts));
  }

  const badPosts = document.querySelectorAll('.voyage-port[data-kind="post"]:not([data-icon="feather"])');
  if (badPosts.length > 0) {
    console.error('[VoyageHeader] Post markers must render as feathers.', Array.from(badPosts));
  }

  const badTerritories = document.querySelectorAll(
    '.voyage-port[data-kind="territory"]:not([data-icon="flag"])'
  );
  if (badTerritories.length > 0) {
    console.error('[VoyageHeader] Territory markers must render as flags.', Array.from(badTerritories));
  }
}
