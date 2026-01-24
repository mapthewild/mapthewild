import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TERRITORY_LEVELS, BUILDING_SPRITES, LEY_LINES } from '../generated/blogMapData.js';

// Preload images for building sprites
const usePreloadedImages = () => {
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const imagePromises = Object.entries(BUILDING_SPRITES).map(([key, sprite]) => {
      return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve([key, img]);
        img.onerror = () => {
          console.warn(`Failed to load image for ${key}: ${sprite.image}`);
          resolve([key, null as any]);
        };
        img.src = sprite.image;
      });
    });

    Promise.all(imagePromises).then((results) => {
      const images: Record<string, HTMLImageElement> = {};
      results.forEach(([key, img]) => {
        if (img) images[key] = img;
      });
      setLoadedImages(images);
      setLoading(false);
    });
  }, []);

  return { loadedImages, loading };
};

// Map/player configuration
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const PLAYER_SIZE = 14;
const FOG_TILE_SIZE = 25;
const REVEAL_RADIUS = 90;
const INTERACTION_RADIUS = 70;
const EDGE_THRESHOLD = 30;

// Alive design system color palette
const COLORS = {
  parchment: {
    50: '#ffffff',
    100: '#f5f0e6',
    200: '#f5f0e6',
    300: '#e8e3d9',
    400: '#d4c9aa',
    500: '#b8a990',
  },
  ink: '#4a3f35',
  inkLight: '#6b5d4d',
  inkMuted: '#8a7a66',
  grid: '#b8a990',
  ochre: '#c4a035',
  ochreDark: '#9a7f2a',
  verdigris: '#2d6a6a',
  sienna: '#a03e20',
  rose: '#c9a0a0',
  roseDark: '#8a6b6b',
  // Legacy mappings for compatibility
  cartographic: {
    ink: '#4a3f35',
    sepia: '#8a7a66',
    gold: '#c4a035',
    teal: '#2d6a6a',
    forest: '#4a5d23',
  },
  terra: {
    400: '#c17f59',
    500: '#a66b4b',
    600: '#8b5a3d',
  }
};

export default function EmotionsFogMap() {
  const [currentMapId, setCurrentMapId] = useState('root');
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 500 }); // Start at spawn campfire
  const [revealedTiles, setRevealedTiles] = useState({});
  const [activeZone, setActiveZone] = useState(null);
  const [visitedZones, setVisitedZones] = useState(new Set(['spawn']));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [navigationPath, setNavigationPath] = useState(['root']);
  const [activeLeyLine, setActiveLeyLine] = useState(null);
  const keysPressed = useRef(new Set());
  const gameLoopRef = useRef(null);
  const { loadedImages, loading: imagesLoading } = usePreloadedImages();

  const currentMap = TERRITORY_LEVELS[currentMapId] || TERRITORY_LEVELS['root'];
  const territories = currentMap?.territories || {};

  const revealFog = useCallback((x, y, radius = REVEAL_RADIUS) => {
    setRevealedTiles(prev => {
      const mapTiles = prev[currentMapId] ? new Set(prev[currentMapId]) : new Set();
      const tilesX = Math.ceil(MAP_WIDTH / FOG_TILE_SIZE);
      const tilesY = Math.ceil(MAP_HEIGHT / FOG_TILE_SIZE);

      for (let tx = 0; tx < tilesX; tx++) {
        for (let ty = 0; ty < tilesY; ty++) {
          const tileCenterX = tx * FOG_TILE_SIZE + FOG_TILE_SIZE / 2;
          const tileCenterY = ty * FOG_TILE_SIZE + FOG_TILE_SIZE / 2;
          const dist = Math.sqrt((tileCenterX - x) ** 2 + (tileCenterY - y) ** 2);
          if (dist < radius) mapTiles.add(`${tx},${ty}`);
        }
      }
      return { ...prev, [currentMapId]: mapTiles };
    });
  }, [currentMapId]);

  const checkZoneProximity = useCallback((x, y) => {
    for (const zone of Object.values(territories)) {
      const dist = Math.sqrt((zone.x - x) ** 2 + (zone.y - y) ** 2);
      if (dist < INTERACTION_RADIUS) {
        setActiveZone(zone);
        if (!visitedZones.has(zone.id)) {
          setVisitedZones(prev => new Set([...prev, zone.id]));
        }
        return;
      }
    }
    setActiveZone(null);
  }, [currentMapId, territories, visitedZones]);

  const handleZoomIn = useCallback((zone) => {
    if (!zone.childMapId || isTransitioning) return;
    setIsTransitioning(true);
    setTransitionText(`Entering ${zone.name}...`);
    setZoomLevel(1.5);
    setActiveZone(null);
    setTimeout(() => {
      setCurrentMapId(zone.childMapId);
      setNavigationPath(prev => [...prev, zone.childMapId]);
      setPlayerPos({ x: 80, y: 300 });
      setZoomLevel(1);
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionText('');
        revealFog(80, 300, REVEAL_RADIUS * 1.3);
      }, 300);
    }, 500);
  }, [isTransitioning, revealFog]);

  const handleZoomOut = useCallback(() => {
    if (currentMapId === 'root' || isTransitioning) return;
    const currentLevel = TERRITORY_LEVELS[currentMapId];
    if (!currentLevel?.parentId) return;
    setIsTransitioning(true);
    setTransitionText('Returning...');
    setZoomLevel(0.5);
    setActiveZone(null);
    setTimeout(() => {
      const parentTerritory = TERRITORY_LEVELS[currentLevel.parentId].territories[currentLevel.parentTerritory];
      setCurrentMapId(currentLevel.parentId);
      setNavigationPath(prev => prev.slice(0, -1));
      setPlayerPos({ x: parentTerritory?.x || 280, y: parentTerritory?.y || 300 });
      setZoomLevel(1);
      setTimeout(() => { setIsTransitioning(false); setTransitionText(''); }, 300);
    }, 500);
  }, [currentMapId, isTransitioning]);

  const handleEdgeTransition = useCallback((edge) => {
    if (isTransitioning) return;

    // Default: left edge exits to parent (already working)
    if (edge === 'left' && currentMapId !== 'root') {
      handleZoomOut();
      return;
    }

    // Check if current map level has directional edge definitions
    const currentLevel = TERRITORY_LEVELS[currentMapId];
    if (!currentLevel?.edges?.[edge]) return;

    const targetMapId = currentLevel.edges[edge];
    const targetLevel = TERRITORY_LEVELS[targetMapId];
    if (!targetLevel) return;

    // Transition to the edge-connected territory
    setIsTransitioning(true);
    const edgeLabels = {
      top: 'Rising to more abstract concepts...',
      bottom: 'Descending to more concrete details...',
      right: 'Going deeper...',
    };
    setTransitionText(edgeLabels[edge] || 'Transitioning...');
    setZoomLevel(edge === 'right' ? 1.2 : 0.8);
    setActiveZone(null);

    setTimeout(() => {
      setCurrentMapId(targetMapId);
      // Add to navigation path if going deeper
      if (edge === 'right') {
        setNavigationPath(prev => [...prev, targetMapId]);
      } else {
        // For lateral moves (top/bottom), maintain current depth level
        setNavigationPath(prev => {
          const newPath = [...prev];
          newPath[newPath.length - 1] = targetMapId;
          return newPath;
        });
      }

      // Start at appropriate position based on edge direction
      const entryPos = {
        top: { x: 400, y: MAP_HEIGHT - 100 }, // Enter from bottom
        bottom: { x: 400, y: 100 }, // Enter from top
        right: { x: 80, y: 300 }, // Enter from left
      };
      setPlayerPos(entryPos[edge] || { x: 80, y: 300 });
      setZoomLevel(1);

      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionText('');
        const pos = entryPos[edge] || { x: 80, y: 300 };
        revealFog(pos.x, pos.y, REVEAL_RADIUS * 1.3);
      }, 300);
    }, 500);
  }, [currentMapId, isTransitioning, handleZoomOut, revealFog]);


  const handleInteract = useCallback(() => {
    if (!activeZone || isTransitioning) return;
    if (activeZone.hasChildren) handleZoomIn(activeZone);
    else if (activeZone.isExit) handleZoomOut();
  }, [activeZone, isTransitioning, handleZoomIn, handleZoomOut]);

  const handleTeleport = useCallback((zoneId) => {
    if (zoneId === 'exit') { handleZoomOut(); return; }
    let target = territories[zoneId];
    if (!target && currentMapId !== 'root') {
      if (TERRITORY_LEVELS['root'].territories[zoneId]) { handleZoomOut(); return; }
    }
    if (!target) return;
    setIsTransitioning(true);
    setTransitionText(`Traveling to ${target.name}...`);
    setActiveZone(null);
    setTimeout(() => {
      setPlayerPos({ x: target.x, y: target.y });
      revealFog(target.x, target.y, REVEAL_RADIUS * 1.3);
      setTimeout(() => { setIsTransitioning(false); setTransitionText(''); checkZoneProximity(target.x, target.y); }, 300);
    }, 400);
  }, [territories, currentMapId, revealFog, checkZoneProximity, handleZoomOut]);

  const renderContent = (content) => {
    const parts = content.split(/(\[\[[\w-]+\]\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[\[([\w-]+)\]\]/);
      if (match) {
        const zoneId = match[1];
        const zone = territories[zoneId] || TERRITORY_LEVELS['root'].territories[zoneId];
        return (
          <button key={i} onClick={() => handleTeleport(zoneId)}
            className="underline decoration-dotted cursor-pointer bg-transparent border-none font-inherit"
            style={{ color: COLORS.cartographic.gold }}>
            {zone ? zone.name : zoneId}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key.toLowerCase());
      }
      if ((e.key === 'Enter' || e.key === ' ') && activeZone) { e.preventDefault(); handleInteract(); }
      if (e.key === 'Escape' && currentMapId !== 'root') handleZoomOut();
    };
    const handleKeyUp = (e) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [currentMapId, handleZoomOut, handleInteract, activeZone]);

  const checkEdgeProximity = useCallback((x, y) => {
    if (x <= EDGE_THRESHOLD) return 'left';
    if (x >= MAP_WIDTH - EDGE_THRESHOLD) return 'right';
    if (y <= EDGE_THRESHOLD) return 'top';
    if (y >= MAP_HEIGHT - EDGE_THRESHOLD) return 'bottom';
    return null;
  }, []);

  useEffect(() => {
    const SPEED = 4;
    let lastX = playerPos.x;
    let lastY = playerPos.y;

    const loop = () => {
      if (isTransitioning) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      setPlayerPos(prev => {
        let { x, y } = prev;
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) y -= SPEED;
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) y += SPEED;
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) x -= SPEED;
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) x += SPEED;
        x = Math.max(PLAYER_SIZE, Math.min(MAP_WIDTH - PLAYER_SIZE, x));
        y = Math.max(PLAYER_SIZE, Math.min(MAP_HEIGHT - PLAYER_SIZE, y));

        // Call fog reveal and zone check inline when position changes
        if (x !== lastX || y !== lastY) {
          // Update revealed tiles directly
          setRevealedTiles(prevTiles => {
            const mapTiles = prevTiles[currentMapId] ? new Set(prevTiles[currentMapId]) : new Set();
            const tilesX = Math.ceil(MAP_WIDTH / FOG_TILE_SIZE);
            const tilesY = Math.ceil(MAP_HEIGHT / FOG_TILE_SIZE);

            for (let tx = 0; tx < tilesX; tx++) {
              for (let ty = 0; ty < tilesY; ty++) {
                const tileCenterX = tx * FOG_TILE_SIZE + FOG_TILE_SIZE / 2;
                const tileCenterY = ty * FOG_TILE_SIZE + FOG_TILE_SIZE / 2;
                const dist = Math.sqrt((tileCenterX - x) ** 2 + (tileCenterY - y) ** 2);
                if (dist < REVEAL_RADIUS) mapTiles.add(`${tx},${ty}`);
              }
            }
            return { ...prevTiles, [currentMapId]: mapTiles };
          });

          // Check zone proximity inline
          let foundZone = false;
          for (const zone of Object.values(territories)) {
            const dist = Math.sqrt((zone.x - x) ** 2 + (zone.y - y) ** 2);
            if (dist < INTERACTION_RADIUS) {
              foundZone = true;
              setActiveZone(zone);
              setVisitedZones(prevVisited => {
                if (prevVisited.has(zone.id)) return prevVisited;
                return new Set([...prevVisited, zone.id]);
              });
              break;
            }
          }

          if (!foundZone) {
            setActiveZone(null);
          }

          lastX = x;
          lastY = y;
        }

        return { x, y };
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isTransitioning, currentMapId, territories]);

  const renderFog = () => {
    const tiles = [];
    const tilesX = Math.ceil(MAP_WIDTH / FOG_TILE_SIZE);
    const tilesY = Math.ceil(MAP_HEIGHT / FOG_TILE_SIZE);
    const revealed = revealedTiles[currentMapId] || new Set();
    for (let tx = 0; tx < tilesX; tx++) {
      for (let ty = 0; ty < tilesY; ty++) {
        if (!revealed.has(`${tx},${ty}`)) {
          tiles.push(<div key={`${tx},${ty}`} className="absolute pointer-events-none"
            style={{
              left: tx * FOG_TILE_SIZE,
              top: ty * FOG_TILE_SIZE,
              width: FOG_TILE_SIZE + 1,
              height: FOG_TILE_SIZE + 1,
              backgroundColor: COLORS.parchment[400],
              opacity: 0.95
            }} />);
        }
      }
    }
    return tiles;
  };

  const mapTitle = currentMapId === 'root' ? 'How We Feel' : currentMap.name;

  const getBreadcrumb = () => {
    return navigationPath.map((mapId) => {
      if (mapId === 'root') return { id: 'root', name: 'How We Feel' };
      const level = TERRITORY_LEVELS[mapId];
      return { id: mapId, name: level?.name || mapId };
    });
  };

  const handleBreadcrumbClick = (index) => {
    if (index === navigationPath.length - 1) return;
    const targetPath = navigationPath.slice(0, index + 1);
    const targetMapId = targetPath[targetPath.length - 1];

    setIsTransitioning(true);
    setTransitionText('Returning...');
    setZoomLevel(0.5);
    setActiveZone(null);
    setTimeout(() => {
      setCurrentMapId(targetMapId);
      setNavigationPath(targetPath);
      const targetLevel = TERRITORY_LEVELS[targetMapId];
      const targetTerritories = targetLevel?.territories || {};
      const firstTerritory = Object.values(targetTerritories)[0];
      setPlayerPos({ x: firstTerritory?.x || 150, y: firstTerritory?.y || 300 });
      setZoomLevel(1);
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionText('');
        revealFog(firstTerritory?.x || 150, firstTerritory?.y || 300, REVEAL_RADIUS * 1.3);
      }, 300);
    }, 500);
  };

  const renderLeyLines = () => {
    // Filter ley lines relevant to current map
    const currentLines = LEY_LINES.filter(line =>
      (line.from.mapId === currentMapId || line.to.mapId === currentMapId) && line.visible
    );

    return currentLines.map(line => {
      // Only render if both territories are on the current map
      if (line.from.mapId !== currentMapId || line.to.mapId !== currentMapId) return null;

      const fromZone = territories[line.from.territoryId];
      const toZone = territories[line.to.territoryId];
      if (!fromZone || !toZone) return null;

      // Always show ley lines on current map (reading order guides)
      const isActive = activeLeyLine?.id === line.id;
      const opacity = isActive ? 0.8 : 0.4;

      return (
        <g key={line.id}>
          {/* Glowing background line */}
          <line
            x1={fromZone.x}
            y1={fromZone.y}
            x2={toZone.x}
            y2={toZone.y}
            stroke={COLORS.cartographic.gold}
            strokeWidth={isActive ? 4 : 2}
            opacity={opacity}
            strokeDasharray="5,5"
            style={{
              filter: `drop-shadow(0 0 4px ${COLORS.cartographic.gold}99)`,
              transition: 'all 0.3s ease'
            }}
          />
          {/* Interactive hitbox */}
          <line
            x1={fromZone.x}
            y1={fromZone.y}
            x2={toZone.x}
            y2={toZone.y}
            stroke="transparent"
            strokeWidth={20}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveLeyLine(line)}
            onMouseLeave={() => setActiveLeyLine(null)}
          />
        </g>
      );
    }).filter(Boolean);
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'transparent' }}>
      {navigationPath.length > 1 && (
        <div className="text-sm mb-2 flex items-center gap-1">
          {getBreadcrumb().map((crumb, index) => (
            <span key={crumb.id}>
              {index > 0 && <span style={{ color: COLORS.cartographic.sepia }} className="mx-1">›</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="px-2 py-0.5 rounded transition-colors cursor-pointer border-none"
                style={{
                  backgroundColor: index === navigationPath.length - 1 ? COLORS.parchment[300] : 'transparent',
                  color: index === navigationPath.length - 1 ? COLORS.cartographic.ink : COLORS.cartographic.sepia
                }}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="text-sm mb-3 flex flex-wrap gap-4 justify-center items-center" style={{ color: COLORS.cartographic.sepia }}>
        <span className="font-medium" style={{ color: COLORS.ink, fontFamily: "'Fraunces', Georgia, serif" }}>{mapTitle}</span>
        <span style={{ color: COLORS.parchment[400] }}>|</span>
        <span>WASD to move</span>
        <span style={{ color: COLORS.parchment[400] }}>|</span>
        <span>Enter to interact</span>
        {currentMapId !== 'root' && <><span style={{ color: COLORS.parchment[400] }}>|</span><span>ESC to exit</span></>}
        <span style={{ color: COLORS.parchment[400] }}>|</span>
        <span>{visitedZones.size} discovered</span>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <div className="relative overflow-hidden rounded-xl shadow-2xl"
          style={{
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.4s ease-in-out',
            border: `3px solid ${COLORS.cartographic.sepia}`,
            boxShadow: `inset 0 0 0 1px ${COLORS.parchment[300]}`
          }}>
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${COLORS.parchment[200]}, ${COLORS.parchment[100]})` }}>
            {/* Grid pattern like old maps */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(${COLORS.cartographic.sepia}08 1px, transparent 1px),
                linear-gradient(90deg, ${COLORS.cartographic.sepia}08 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }} />
          </div>

          {currentMapId !== 'root' && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: COLORS.cartographic.sepia }}>← Back</div>
          )}

          {/* Directional edge indicators */}
          {currentMap?.edges?.top && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: COLORS.cartographic.sepia }}>↑ Abstract</div>
          )}
          {currentMap?.edges?.bottom && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs" style={{ color: COLORS.cartographic.sepia }}>↓ Concrete</div>
          )}
          {currentMap?.edges?.right && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: COLORS.cartographic.sepia }}>Deeper →</div>
          )}

          {currentMapId !== 'root' && (
            <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded"
              style={{ color: COLORS.cartographic.sepia, backgroundColor: `${COLORS.parchment[100]}cc` }}>
              📍 {currentMap.name}
            </div>
          )}

          {/* Ley Lines - SVG layer behind territories */}
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            style={{ zIndex: 5 }}
          >
            <g className="pointer-events-auto">
              {renderLeyLines()}
            </g>
          </svg>

          {Object.values(territories).map(zone => {
            const sprite = BUILDING_SPRITES[zone.level];
            const isVisited = visitedZones.has(zone.id);
            const isActive = activeZone?.id === zone.id;
            const hasImage = loadedImages[zone.level];
            return (
              <div key={zone.id} className="absolute flex flex-col items-center transition-all duration-300"
                style={{ left: zone.x - sprite.size / 2, top: zone.y - sprite.size / 2, width: sprite.size, height: sprite.size, opacity: isVisited ? 1 : 0.4, filter: isActive ? 'brightness(1.1)' : 'none' }}>
                <div className="absolute rounded-full transition-all duration-300"
                  style={{ width: sprite.size * 2, height: sprite.size * 2, left: -sprite.size / 2, top: -sprite.size / 2, background: `radial-gradient(circle, ${zone.color}44, transparent 70%)`, opacity: isActive ? 1 : 0.6 }} />
                {hasImage ? (
                  <img
                    src={sprite.image}
                    alt={zone.name}
                    className="relative z-10"
                    style={{
                      width: sprite.size * 0.8,
                      height: sprite.size * 0.8,
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <span className="relative z-10" style={{ fontSize: sprite.size * 0.5, color: COLORS.cartographic.ink }}>●</span>
                )}
                <span className="absolute text-xs font-medium text-center"
                  style={{ top: sprite.size + 4, opacity: isVisited ? 0.9 : 0.5, width: 110, color: COLORS.cartographic.ink, textShadow: `0 1px 2px ${COLORS.parchment[100]}`, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {zone.name}{zone.hasChildren && <span style={{ color: COLORS.cartographic.gold }} className="ml-1">⏎</span>}
                </span>
              </div>
            );
          })}

          {/* Player marker - compass style */}
          <div className="absolute z-20"
            style={{
              left: playerPos.x - PLAYER_SIZE / 2,
              top: playerPos.y - PLAYER_SIZE / 2,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              transition: isTransitioning ? 'none' : 'left 0.05s, top 0.05s'
            }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={COLORS.cartographic.ink} strokeWidth="2" style={{ width: '100%', height: '100%' }}>
              <circle cx="12" cy="12" r="8" fill={COLORS.parchment[50]} />
              <path d="M12 8l2 4-2 4-2-4z" fill={COLORS.cartographic.gold} stroke="none"/>
            </svg>
          </div>

          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, filter: 'blur(8px)' }}>{renderFog()}</div>
        </div>

        {/* Info Panel */}
        <div className="w-80 rounded-xl p-5 overflow-y-auto backdrop-blur"
          style={{
            height: MAP_HEIGHT,
            backgroundColor: `${COLORS.parchment[100]}f0`,
            border: `2px solid ${COLORS.cartographic.sepia}40`
          }}>
          {activeLeyLine ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <span className="text-lg font-bold" style={{ color: COLORS.ochre, fontFamily: "'Fraunces', Georgia, serif" }}>Ley Line</span>
              </div>
              <div className="text-xs mb-3" style={{ color: COLORS.cartographic.sepia }}>
                {territories[activeLeyLine.from.territoryId]?.name} ↔ {territories[activeLeyLine.to.territoryId]?.name}
              </div>
              <p className="text-sm mb-4 pb-3" style={{ color: COLORS.cartographic.ink, borderBottom: `1px solid ${COLORS.cartographic.sepia}30` }}>{activeLeyLine.content.summary}</p>
              <div className="text-xs leading-relaxed mb-4" style={{ color: COLORS.cartographic.ink }}>{activeLeyLine.content.full}</div>
              <div className="text-xs" style={{ color: COLORS.cartographic.sepia }}>
                <p className="mb-1">Source: {activeLeyLine.source.type}</p>
                {activeLeyLine.content.sources.length > 0 && (
                  <div className="mt-2">
                    {activeLeyLine.content.sources.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block truncate" style={{ color: COLORS.cartographic.gold }}>
                        {src}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeZone ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                {loadedImages[activeZone.level] ? (
                  <img
                    src={BUILDING_SPRITES[activeZone.level].image}
                    alt={activeZone.name}
                    style={{ width: 28, height: 28, objectFit: 'contain' }}
                  />
                ) : (
                  <span className="text-2xl">●</span>
                )}
                <span className="text-lg font-bold" style={{ color: activeZone.color, fontFamily: "'Fraunces', Georgia, serif" }}>{activeZone.name}</span>
              </div>
              {activeZone.hasChildren && (
                <button onClick={handleInteract}
                  className="text-xs mb-2 px-2 py-1 rounded cursor-pointer"
                  style={{ color: COLORS.cartographic.gold, backgroundColor: `${COLORS.cartographic.gold}15`, border: `1px solid ${COLORS.cartographic.gold}40` }}>
                  ⏎ Press Enter to go inside
                </button>
              )}
              {activeZone.isExit && (
                <button onClick={handleInteract}
                  className="text-xs mb-2 px-2 py-1 rounded cursor-pointer"
                  style={{ color: COLORS.cartographic.sepia, backgroundColor: `${COLORS.cartographic.sepia}15`, border: `1px solid ${COLORS.cartographic.sepia}40` }}>
                  ⏎ Press Enter to exit
                </button>
              )}
              <p className="text-xs mb-4 pb-3" style={{ color: COLORS.cartographic.sepia, borderBottom: `1px solid ${COLORS.cartographic.sepia}30` }}>{activeZone.description}</p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: COLORS.cartographic.ink }}>{renderContent(activeZone.content)}</div>
            </div>
          ) : (
            <div className="text-sm" style={{ color: COLORS.cartographic.sepia }}>
              <p className="mb-4">Walk toward a location to discover it.</p>
              <p className="mb-4">Press <span style={{ color: COLORS.cartographic.gold }}>Enter</span> to go inside categories.</p>
              <p className="mb-4">Click [[bracket links]] to teleport.</p>
              <p className="mb-6">Hover over <span style={{ color: COLORS.cartographic.gold }}>glowing lines</span> to see connections.</p>
              <div className="pt-4" style={{ borderTop: `1px solid ${COLORS.cartographic.sepia}30` }}>
                <p className="text-xs mb-3 uppercase tracking-wide" style={{ color: COLORS.cartographic.sepia }}>Map Legend</p>
                <div className="text-xs space-y-2" style={{ color: COLORS.cartographic.ink }}>
                  <div className="flex items-center gap-2">
                    {loadedImages.campfire ? (
                      <img src={BUILDING_SPRITES.campfire.image} alt="Compass" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : <span>◎</span>}
                    <span>Compass = Start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadedImages.tower ? (
                      <img src={BUILDING_SPRITES.tower.image} alt="Banner" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : <span>⚑</span>}
                    <span>Banner = Category</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadedImages.village ? (
                      <img src={BUILDING_SPRITES.village.image} alt="Ship" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : <span>⛵</span>}
                    <span>Ship = Subcategory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadedImages.house ? (
                      <img src={BUILDING_SPRITES.house.image} alt="Pin" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : <span>📍</span>}
                    <span>Pin = Article</span>
                  </div>
                  <p>⚡ Lines = Connections</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isTransitioning && transitionText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-xl font-medium px-6 py-3 rounded-lg backdrop-blur"
            style={{
              color: COLORS.ink,
              backgroundColor: `${COLORS.parchment[100]}e0`,
              fontFamily: "'Fraunces', Georgia, serif"
            }}>
            {transitionText}
          </div>
        </div>
      )}

    </div>
  );
}
