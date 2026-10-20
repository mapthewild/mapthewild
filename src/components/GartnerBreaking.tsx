import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Design system colors from global.css
const COLORS = {
  ink: '#4a3f35',
  inkLight: '#6b5d4d',
  inkMuted: '#8a7a66',
  parchment: '#f5f0e6',
  parchmentDark: '#e8e3d9',
  ochre: '#c4a035',
  sienna: '#a03e20',
  verdigris: '#2d6a6a',
  grid: '#b8a990',
  gridLight: 'rgba(180, 170, 150, 0.12)',
}

// Named builders from the essay, positioned in Gartner quadrant space
// x: 0-100 (Completeness of Vision), y: 0-100 (Ability to Execute)
const BUILDERS = [
  { id: 'huntley', label: 'Huntley', subtitle: 'goat farmer', x: 72, y: 35, friction: 'Memory' },
  { id: 'taches', label: 'TACHES', subtitle: 'music producer', x: 78, y: 82, friction: 'Context' },
  { id: 'gigger', label: 'Gigger', subtitle: 'human clipboard', x: 30, y: 38, friction: 'Memory' },
  { id: 'miller', label: 'Miller', subtitle: '15 projects', x: 35, y: 68, friction: 'Memory' },
  { id: 'tcarac', label: 'tcarac', subtitle: 'Taskboard', x: 65, y: 80, friction: 'Interface' },
  { id: 'aroussi', label: 'Aroussi', subtitle: 'CCPM', x: 70, y: 75, friction: 'Memory' },
  { id: 'miessler', label: 'Miessler', subtitle: 'Fabric', x: 82, y: 72, friction: 'Memory' },
  { id: 'vincent', label: 'Vincent', subtitle: 'persuasion', x: 68, y: 42, friction: 'Context' },
  { id: 'hrescak', label: 'Hrescak', subtitle: 'Draftboard', x: 55, y: 60, friction: 'Visibility' },
  { id: 'you', label: 'You', subtitle: '', x: 75, y: 55, friction: 'Discernment' },
]

// Friction cluster positions (where dots settle in phase 3)
const FRICTION_CLUSTERS: Record<string, { cx: number; cy: number; label: string; color: string }> = {
  Memory: { cx: 25, cy: 30, label: 'Memory', color: COLORS.ochre },
  Interface: { cx: 75, cy: 30, label: 'Interface', color: COLORS.ochre },
  Visibility: { cx: 25, cy: 70, label: 'Visibility', color: COLORS.ochre },
  Context: { cx: 75, cy: 70, label: 'Context', color: COLORS.ochre },
  Discernment: { cx: 50, cy: 85, label: 'Discernment', color: COLORS.verdigris },
}

// Generate anonymous flood dots
function generateFloodDots(count: number): Array<{ id: string; x: number; y: number; friction: string }> {
  const frictions = ['Memory', 'Interface', 'Visibility', 'Context']
  const dots = []
  for (let i = 0; i < count; i++) {
    dots.push({
      id: `flood-${i}`,
      x: 5 + Math.random() * 90,
      y: 5 + Math.random() * 90,
      friction: frictions[Math.floor(Math.random() * frictions.length)],
    })
  }
  return dots
}

const STATS = [
  '35% of enterprises have already replaced purchased SaaS with custom builds.',
  '78% expect to build more in 2026.',
  "'Vibe coding' searches up 6,700%.",
]

export default function GartnerBreaking() {
  const [phase, setPhase] = useState(0) // 0: quadrant, 1: flooding, 2: friction clusters
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTriggered = useRef(false)

  const floodDots = useMemo(() => generateFloodDots(200), [])

  // Memoize jitter offsets so dots don't shimmer on re-render
  const jitterMap = useMemo(() => {
    const map: Record<string, { dx: number; dy: number }> = {}
    const jitter = 8
    for (const dot of [...floodDots, ...BUILDERS]) {
      map[dot.id] = {
        dx: (Math.random() - 0.5) * jitter * 2,
        dy: (Math.random() - 0.5) * jitter * 2,
      }
    }
    return map
  }, [floodDots])

  // IntersectionObserver to trigger animation on scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          // Start flooding after a pause to let reader see the clean quadrant
          setTimeout(() => setPhase(1), 1500)
          setTimeout(() => setPhase(2), 4500)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Allow click/tap to advance phases manually
  const handleClick = () => {
    if (phase < 2) setPhase(phase + 1)
    else setPhase(0) // reset
  }

  const getTargetPosition = (dot: { id: string; x: number; y: number; friction: string }, currentPhase: number) => {
    if (currentPhase < 2) {
      return { x: dot.x, y: dot.y }
    }
    // Phase 2: cluster by friction with stable jitter
    const cluster = FRICTION_CLUSTERS[dot.friction]
    if (!cluster) return { x: dot.x, y: dot.y }
    const offsets = jitterMap[dot.id] || { dx: 0, dy: 0 }
    return {
      x: cluster.cx + offsets.dx,
      y: cluster.cy + offsets.dy,
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '680px',
        margin: '2rem auto',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Animated visualization showing AI tool builders clustering not by capability quadrant, but by the friction they encountered. Starts as a Gartner-style quadrant, floods with dots representing builders, then reorganizes into friction clusters: Memory, Interface, Visibility, Context, and Discernment."
        style={{
          width: '100%',
          aspectRatio: '1',
          background: COLORS.parchment,
          borderRadius: '4px',
          border: `1px solid ${COLORS.grid}`,
        }}
      >
        <title>The AI Productivity Tools Market, Reclassified by Friction</title>
        {/* Quadrant grid lines */}
        <motion.line
          x1="50" y1="2" x2="50" y2="98"
          stroke={COLORS.grid}
          strokeWidth="0.3"
          strokeDasharray="1,1"
          animate={{ opacity: phase >= 2 ? 0 : 1 }}
          transition={{ duration: 1.2 }}
        />
        <motion.line
          x1="2" y1="50" x2="98" y2="50"
          stroke={COLORS.grid}
          strokeWidth="0.3"
          strokeDasharray="1,1"
          animate={{ opacity: phase >= 2 ? 0 : 1 }}
          transition={{ duration: 1.2 }}
        />

        {/* Axis labels */}
        <motion.text
          x="50" y="99.5"
          textAnchor="middle"
          fill={COLORS.inkMuted}
          fontSize="2.2"
          fontFamily="system-ui, sans-serif"
          animate={{ opacity: phase >= 2 ? 0 : 0.7 }}
          transition={{ duration: 1 }}
        >
          Completeness of Vision →
        </motion.text>
        <motion.text
          x="1" y="50"
          textAnchor="middle"
          fill={COLORS.inkMuted}
          fontSize="2.2"
          fontFamily="system-ui, sans-serif"
          transform="rotate(-90, 1, 50)"
          animate={{ opacity: phase >= 2 ? 0 : 0.7 }}
          transition={{ duration: 1 }}
        >
          Ability to Execute →
        </motion.text>

        {/* Quadrant labels */}
        {[
          { label: 'Niche Players', x: 25, y: 75 },
          { label: 'Visionaries', x: 75, y: 75 },
          { label: 'Challengers', x: 25, y: 25 },
          { label: 'Leaders', x: 75, y: 25 },
        ].map((q) => (
          <motion.text
            key={q.label}
            x={q.x} y={q.y}
            textAnchor="middle"
            fill={COLORS.inkMuted}
            fontSize="2.5"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            animate={{ opacity: phase >= 1 ? 0 : 0.35 }}
            transition={{ duration: 0.8 }}
          >
            {q.label}
          </motion.text>
        ))}

        {/* Flood dots (phase 1+) */}
        {phase >= 1 && floodDots.map((dot, i) => {
          const target = getTargetPosition(dot, phase)
          return (
            <motion.circle
              key={dot.id}
              r="0.5"
              fill={COLORS.inkMuted}
              opacity={0.3}
              initial={{ cx: 50, cy: 50, opacity: 0 }}
              animate={{
                cx: target.x,
                cy: 100 - target.y, // SVG y is inverted
                opacity: 0.3,
              }}
              transition={{
                duration: 1.5 + Math.random() * 1.5,
                delay: phase === 1 ? i * 0.008 : 0.1 + Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          )
        })}

        {/* Named builder dots */}
        {BUILDERS.map((builder) => {
          const target = getTargetPosition(builder, phase)
          const isYou = builder.id === 'you'
          return (
            <g key={builder.id}>
              <motion.circle
                r={isYou ? '1.2' : '1'}
                fill={isYou ? COLORS.verdigris : COLORS.ink}
                initial={{ cx: builder.x, cy: 100 - builder.y }}
                animate={{
                  cx: target.x,
                  cy: 100 - target.y,
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              <motion.text
                textAnchor="middle"
                fill={isYou ? COLORS.verdigris : COLORS.inkLight}
                fontSize="1.8"
                fontFamily="system-ui, sans-serif"
                fontWeight={isYou ? '600' : '400'}
                animate={{
                  x: target.x,
                  y: 100 - target.y - 2,
                  opacity: phase >= 1 && !isYou ? 0 : 1,
                }}
                transition={{ duration: 1 }}
              >
                {builder.label}
              </motion.text>
              {phase === 0 && builder.subtitle && (
                <motion.text
                  x={builder.x}
                  y={100 - builder.y + 2.5}
                  textAnchor="middle"
                  fill={COLORS.inkMuted}
                  fontSize="1.4"
                  fontFamily="system-ui, sans-serif"
                  fontStyle="italic"
                  animate={{ opacity: phase >= 1 ? 0 : 0.6 }}
                  transition={{ duration: 0.6 }}
                >
                  {builder.subtitle}
                </motion.text>
              )}
            </g>
          )
        })}

        {/* Friction cluster labels (phase 2) */}
        {phase >= 2 && Object.entries(FRICTION_CLUSTERS).map(([key, cluster]) => (
          <motion.text
            key={key}
            x={cluster.cx}
            y={100 - cluster.cy + 14}
            textAnchor="middle"
            fill={cluster.color}
            fontSize={key === 'Discernment' ? '2.5' : '2.2'}
            fontFamily="system-ui, sans-serif"
            fontWeight={key === 'Discernment' ? '600' : '400'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            {cluster.label}
          </motion.text>
        ))}
      </svg>

      {/* Caption and stats */}
      <div style={{
        textAlign: 'center',
        marginTop: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
        color: COLORS.inkMuted,
        fontSize: '0.85rem',
        lineHeight: '1.5',
        minHeight: '4rem',
      }}>
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.p
              key="caption"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontStyle: 'italic' }}
            >
              The AI Productivity Tools Market, Q1 2026
            </motion.p>
          )}
          {phase === 1 && (
            <motion.div key="stats">
              {STATS.map((stat, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 1.0 }}
                  style={{ margin: '0.25rem 0', color: COLORS.sienna, fontSize: '0.8rem' }}
                >
                  {stat}
                </motion.p>
              ))}
            </motion.div>
          )}
          {phase === 2 && (
            <motion.p
              key="reframe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 1, delay: 1.5 }}
              style={{ color: COLORS.verdigris, fontWeight: 500 }}
            >
              The dots don't cluster by capability. They cluster by friction.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Interaction hint */}
      <motion.p
        style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: COLORS.inkMuted,
          opacity: 0.4,
          marginTop: '0.25rem',
        }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {phase < 2 ? 'scroll or tap to advance' : 'tap to reset'}
      </motion.p>
    </div>
  )
}
