import { useState, useEffect, useCallback, useRef } from 'react';
import { TERRITORY_LEVELS, BUILDING_SPRITES, LEY_LINES } from '../generated/blogMapData.js';

// Map/player configuration
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;
const PLAYER_SIZE = 14;
const FOG_TILE_SIZE = 25;
const REVEAL_RADIUS = 90;
const INTERACTION_RADIUS = 70;
const EDGE_THRESHOLD = 30;

export default function EmotionsFogMap() {
  const [currentMapId, setCurrentMapId] = useState('root');
  const [playerPos, setPlayerPos] = useState({ x: 80, y: 300 });
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
            className="text-amber-300 hover:text-amber-100 underline decoration-dotted cursor-pointer bg-transparent border-none font-inherit">
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
          tiles.push(<div key={`${tx},${ty}`} className="absolute bg-slate-900 pointer-events-none"
            style={{ left: tx * FOG_TILE_SIZE, top: ty * FOG_TILE_SIZE, width: FOG_TILE_SIZE + 1, height: FOG_TILE_SIZE + 1 }} />);
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

      // Check if both territories are visited
      const bothVisited = visitedZones.has(line.from.territoryId) && visitedZones.has(line.to.territoryId);
      if (!bothVisited) return null;

      const isActive = activeLeyLine?.id === line.id;
      const opacity = isActive ? 0.8 : 0.3;

      return (
        <g key={line.id}>
          {/* Glowing background line */}
          <line
            x1={fromZone.x}
            y1={fromZone.y}
            x2={toZone.x}
            y2={toZone.y}
            stroke="#fbbf24"
            strokeWidth={isActive ? 4 : 2}
            opacity={opacity}
            strokeDasharray="5,5"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))',
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
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {navigationPath.length > 1 && (
        <div className="text-sm mb-2 flex items-center gap-1">
          {getBreadcrumb().map((crumb, index) => (
            <span key={crumb.id}>
              {index > 0 && <span className="text-slate-600 mx-1">›</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer border-none ${
                  index === navigationPath.length - 1
                    ? 'bg-slate-700 text-white'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="text-slate-400 text-sm mb-3 flex flex-wrap gap-4 justify-center items-center">
        <span className="text-white font-medium">{mapTitle}</span>
        <span className="text-slate-600">•</span>
        <span>WASD to move</span>
        <span className="text-slate-600">•</span>
        <span>Enter to interact</span>
        {currentMapId !== 'root' && <><span className="text-slate-600">•</span><span>ESC to exit</span></>}
        <span className="text-slate-600">•</span>
        <span>{visitedZones.size} discovered</span>
      </div>

      <div className="flex gap-4 flex-wrap justify-center">
        <div className="relative overflow-hidden rounded-xl border border-slate-700 shadow-2xl"
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT, transform: `scale(${zoomLevel})`, transition: 'transform 0.4s ease-in-out' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #1e293b, #0f172a)' }}>
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>

          {currentMapId !== 'root' && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-600">← Back</div>
          )}

          {/* Directional edge indicators */}
          {currentMap?.edges?.top && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">↑ Abstract</div>
          )}
          {currentMap?.edges?.bottom && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-600">↓ Concrete</div>
          )}
          {currentMap?.edges?.right && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-600">Deeper →</div>
          )}

          {currentMapId !== 'root' && <div className="absolute top-3 left-3 text-xs text-slate-500 bg-slate-900/80 px-2 py-1 rounded">📍 {currentMap.name}</div>}

          {/* Ley Lines - SVG layer behind territories */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            <g className="pointer-events-auto">
              {renderLeyLines()}
            </g>
          </svg>

          {Object.values(territories).map(zone => {
            const sprite = BUILDING_SPRITES[zone.level];
            const isVisited = visitedZones.has(zone.id);
            const isActive = activeZone?.id === zone.id;
            return (
              <div key={zone.id} className="absolute flex flex-col items-center transition-all duration-300"
                style={{ left: zone.x - sprite.size / 2, top: zone.y - sprite.size / 2, width: sprite.size, height: sprite.size, opacity: isVisited ? 1 : 0.4, filter: isActive ? 'brightness(1.3)' : 'none' }}>
                <div className="absolute rounded-full transition-all duration-300"
                  style={{ width: sprite.size * 2, height: sprite.size * 2, left: -sprite.size / 2, top: -sprite.size / 2, background: `radial-gradient(circle, ${zone.color}66, transparent 70%)`, opacity: isActive ? 1 : 0.6 }} />
                <span className="relative z-10" style={{ fontSize: sprite.size * 0.7 }}>{sprite.emoji}</span>
                <span className="absolute text-white text-xs font-medium whitespace-nowrap drop-shadow-lg text-center"
                  style={{ top: sprite.size + 4, opacity: isVisited ? 0.9 : 0.5, maxWidth: 90 }}>
                  {zone.name}{zone.hasChildren && <span className="text-amber-400 ml-1">⏎</span>}
                </span>
              </div>
            );
          })}

          <div className="absolute rounded-full bg-white shadow-lg z-20"
            style={{ left: playerPos.x - PLAYER_SIZE / 2, top: playerPos.y - PLAYER_SIZE / 2, width: PLAYER_SIZE, height: PLAYER_SIZE, boxShadow: '0 0 20px rgba(255,255,255,0.9)', transition: isTransitioning ? 'none' : 'left 0.05s, top 0.05s' }} />

          <div className="absolute inset-0 pointer-events-none">{renderFog()}</div>
        </div>

        <div className="w-80 bg-slate-900/90 rounded-xl border border-slate-700 p-5 overflow-y-auto backdrop-blur" style={{ height: MAP_HEIGHT }}>
          {activeLeyLine ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <span className="text-lg font-bold text-amber-300">Ley Line</span>
              </div>
              <div className="text-xs text-slate-500 mb-3">
                {territories[activeLeyLine.from.territoryId]?.name} ↔ {territories[activeLeyLine.to.territoryId]?.name}
              </div>
              <p className="text-slate-300 text-sm mb-4 border-b border-slate-700 pb-3">{activeLeyLine.content.summary}</p>
              <div className="text-slate-400 text-xs leading-relaxed mb-4">{activeLeyLine.content.full}</div>
              <div className="text-xs text-slate-600">
                <p className="mb-1">Source: {activeLeyLine.source.type}</p>
                {activeLeyLine.content.sources.length > 0 && (
                  <div className="mt-2">
                    {activeLeyLine.content.sources.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 block truncate">
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
                <span className="text-2xl">{BUILDING_SPRITES[activeZone.level].emoji}</span>
                <span className="text-lg font-bold" style={{ color: activeZone.color }}>{activeZone.name}</span>
              </div>
              {activeZone.hasChildren && <button onClick={handleInteract} className="text-amber-400 text-xs mb-2 bg-amber-400/10 px-2 py-1 rounded hover:bg-amber-400/20 cursor-pointer border border-amber-400/30">⏎ Press Enter to go inside</button>}
              {activeZone.isExit && <button onClick={handleInteract} className="text-slate-400 text-xs mb-2 bg-slate-400/10 px-2 py-1 rounded hover:bg-slate-400/20 cursor-pointer border border-slate-400/30">⏎ Press Enter to exit</button>}
              <p className="text-slate-400 text-xs mb-4 border-b border-slate-700 pb-3">{activeZone.description}</p>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">{renderContent(activeZone.content)}</div>
            </div>
          ) : (
            <div className="text-slate-500 text-sm">
              <p className="mb-4">Walk toward a location to discover it.</p>
              <p className="mb-4">Press <span className="text-amber-400">Enter</span> to go inside categories.</p>
              <p className="mb-4">Click [[bracket links]] to teleport.</p>
              <p className="mb-6">Hover over <span className="text-amber-400">glowing lines</span> to see connections.</p>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-600 mb-3 uppercase tracking-wide">Wikipedia Structure</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>🗼 Tower = Category</p>
                  <p>🏘️ Village = Subcategory</p>
                  <p>🏠 House = Article</p>
                  <p>⚡ Lines = Connections</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isTransitioning && transitionText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-white text-xl font-medium bg-slate-900/80 px-6 py-3 rounded-lg backdrop-blur">{transitionText}</div>
        </div>
      )}

    </div>
  );
}
