'use client'

import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion'

export type OwnerMood = 'calm' | 'happy' | 'excited' | 'panicked' | 'sad' | 'celebrating' | 'working' | 'angry'

interface ShopOwnerProps {
  mood: OwnerMood
  size?: number
}

// ── Sweat drops ───────────────────────────────────────────────────────────────
function SweatDrops() {
  return (
    <g>
      <motion.ellipse cx="66" cy="22" rx="3" ry="5" fill="#93C5FD" opacity="0.9"
        style={{ originX: '66px', originY: '22px' }}
      />
      <motion.ellipse cx="72" cy="30" rx="2" ry="4" fill="#93C5FD" opacity="0.7"
        style={{ originX: '72px', originY: '30px' }}
      />
    </g>
  )
}

// ── Stars / sparkles ──────────────────────────────────────────────────────────
function Sparkles() {
  return (
    <g>
      {[[10, 15, 8], [70, 12, 6], [8, 50, 5], [72, 55, 7]].map(([x, y, s], i) => (
        <motion.text key={i} x={x} y={y} fontSize={s} textAnchor="middle"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 20, 0] }}
          transition={{ duration: 1.2, delay: i * 0.25, repeat: Infinity }}
          style={{ userSelect: 'none' }}
        >✨</motion.text>
      ))}
    </g>
  )
}

// ── Hearts ─────────────────────────────────────────────────────────────────────
function Hearts() {
  return (
    <g>
      {[[12, 20], [68, 18], [8, 45]].map(([x, y], i) => (
        <motion.text key={i} x={x} y={y} fontSize="10" textAnchor="middle"
          animate={{ y: [y, y - 20, y - 30], opacity: [1, 0.8, 0], scale: [1, 1.3, 0.8] }}
          transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity, ease: 'easeOut' }}
          style={{ userSelect: 'none' }}
        >💕</motion.text>
      ))}
    </g>
  )
}

// ── Action lines (speed/panic) ────────────────────────────────────────────────
function SpeedLines() {
  return (
    <g opacity="0.4">
      {[[-20, 20], [-24, 35], [-22, 50], [20, 20], [24, 35], [22, 50]].map(([dx, y], i) => (
        <motion.line key={i}
          x1={40 + dx} y1={y} x2={40 + dx * 1.6} y2={y}
          stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 0.7, 0], scaleX: [0.5, 1, 0.5] }}
          transition={{ duration: 0.4, delay: i * 0.06, repeat: Infinity }}
        />
      ))}
    </g>
  )
}

// ── The owner face per mood ────────────────────────────────────────────────────
function OwnerEyes({ mood }: { mood: OwnerMood }) {
  if (mood === 'panicked' || mood === 'angry') return (
    <g>
      <ellipse cx="32" cy="36" rx="7" ry="7" fill="white" />
      <ellipse cx="48" cy="36" rx="7" ry="7" fill="white" />
      <motion.ellipse cx="32" cy="36" rx="4.5" ry="5" fill={mood === 'angry' ? '#8B0000' : '#1a1a2e'}
        animate={{ scaleY: [1, 1.3, 1], x: mood === 'panicked' ? [-1, 1, -1, 0] : 0 }}
        transition={{ duration: 0.3, repeat: Infinity }}
      />
      <motion.ellipse cx="48" cy="36" rx="4.5" ry="5" fill={mood === 'angry' ? '#8B0000' : '#1a1a2e'}
        animate={{ scaleY: [1, 1.3, 1], x: mood === 'panicked' ? [1, -1, 1, 0] : 0 }}
        transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
      />
      <circle cx="33.5" cy="34.5" r="1.5" fill="white" />
      <circle cx="49.5" cy="34.5" r="1.5" fill="white" />
      {/* Angry brows */}
      {mood === 'angry' && <>
        <path d="M 24 29 Q 32 25 38 28" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 42 28 Q 48 25 56 29" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>}
    </g>
  )

  if (mood === 'celebrating' || mood === 'excited') return (
    <g>
      <motion.g animate={{ scaleY: [1, 1.2, 0.9, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
        <ellipse cx="32" cy="36" rx="7.5" ry="7" fill="white" />
        <ellipse cx="32" cy="36" rx="5" ry="5.5" fill="#3B82F6" />
        <ellipse cx="32" cy="36" rx="3" ry="3.5" fill="#1a1a2e" />
        <circle cx="34" cy="34" r="1.8" fill="white" />
      </motion.g>
      <motion.g animate={{ scaleY: [1, 1.2, 0.9, 1] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}>
        <ellipse cx="48" cy="36" rx="7.5" ry="7" fill="white" />
        <ellipse cx="48" cy="36" rx="5" ry="5.5" fill="#3B82F6" />
        <ellipse cx="48" cy="36" rx="3" ry="3.5" fill="#1a1a2e" />
        <circle cx="50" cy="34" r="1.8" fill="white" />
      </motion.g>
      {/* Raised brows */}
      <path d="M 24 27 Q 32 23 38 26" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 42 26 Q 48 23 56 27" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  )

  if (mood === 'happy') return (
    <g>
      <path d="M 25 36 Q 32 31 39 36" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 41 36 Q 48 31 55 36" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 25 36 Q 32 39 39 36" fill="rgba(255,200,180,0.3)" />
      <path d="M 41 36 Q 48 39 55 36" fill="rgba(255,200,180,0.3)" />
    </g>
  )

  if (mood === 'sad') return (
    <g>
      <ellipse cx="32" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="32" cy="38" rx="4" ry="4.5" fill="#4A3520" />
      <ellipse cx="32" cy="38" rx="2.5" ry="3" fill="#111" />
      <circle cx="33.5" cy="36.5" r="1" fill="white" />
      <motion.path d="M 28 44 Q 27 50 30 53 Q 33 50 28 44" fill="#93C5FD"
        animate={{ y: [0, 3, 6], opacity: [1, 0.8, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <ellipse cx="48" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="48" cy="38" rx="4" ry="4.5" fill="#4A3520" />
      <ellipse cx="48" cy="38" rx="2.5" ry="3" fill="#111" />
      <circle cx="49.5" cy="36.5" r="1" fill="white" />
      <path d="M 24 29 Q 32 32 38 30" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      <path d="M 42 30 Q 48 32 56 29" stroke="#1a1a1a" strokeWidth="2" fill="none" />
    </g>
  )

  // calm / working
  return (
    <g>
      <ellipse cx="32" cy="37" rx="7" ry="6.5" fill="white" />
      <ellipse cx="32" cy="37" rx="4.5" ry="5" fill="#4A3520" />
      <ellipse cx="32" cy="37" rx="2.8" ry="3.2" fill="#111" />
      <circle cx="34" cy="35" r="1.5" fill="white" />
      <ellipse cx="48" cy="37" rx="7" ry="6.5" fill="white" />
      <ellipse cx="48" cy="37" rx="4.5" ry="5" fill="#4A3520" />
      <ellipse cx="48" cy="37" rx="2.8" ry="3.2" fill="#111" />
      <circle cx="50" cy="35" r="1.5" fill="white" />
      <path d="M 24 29 Q 32 27 38 28" stroke="#1a1a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 42 28 Q 48 27 56 29" stroke="#1a1a1a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function OwnerMouth({ mood }: { mood: OwnerMood }) {
  if (mood === 'excited' || mood === 'celebrating') return (
    <motion.g animate={{ scaleX: [1, 1.1, 1] }} transition={{ duration: 0.4, repeat: Infinity }}>
      <ellipse cx="40" cy="53" rx="12" ry="8" fill="#7B1414" />
      <ellipse cx="40" cy="50" rx="12" ry="5" fill="#C05050" />
      <ellipse cx="40" cy="52" rx="10" ry="6" fill="#111" />
      <ellipse cx="40" cy="50" rx="8" ry="3" fill="white" opacity="0.9" />
      <ellipse cx="40" cy="50" rx="12" ry="3" fill="#C05050" />
    </motion.g>
  )
  if (mood === 'happy') return (
    <g>
      <path d="M 27 51 Q 40 64 53 51" stroke="#7B1414" strokeWidth="2" fill="#C05050" strokeLinecap="round" />
      <path d="M 29 52 Q 40 63 51 52 Q 40 60 29 52" fill="white" />
    </g>
  )
  if (mood === 'panicked') return (
    <motion.g animate={{ scaleX: [1, 0.9, 1.1, 1] }} transition={{ duration: 0.2, repeat: Infinity }}>
      <ellipse cx="40" cy="54" rx="10" ry="7" fill="#7B1414" />
      <ellipse cx="40" cy="51" rx="10" ry="4" fill="#C05050" />
      <ellipse cx="40" cy="54" rx="8.5" ry="5.5" fill="#222" />
      <ellipse cx="40" cy="52" rx="7" ry="3" fill="white" opacity="0.8" />
    </motion.g>
  )
  if (mood === 'sad') return (
    <path d="M 29 56 Q 40 48 51 56" stroke="#7B1414" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  )
  if (mood === 'angry') return (
    <g>
      <path d="M 30 55 Q 40 47 50 55" stroke="#7B1414" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 33 54 L 47 54" stroke="white" strokeWidth="2" />
    </g>
  )
  return (
    <path d="M 30 52 Q 40 57 50 52" stroke="#7B1414" strokeWidth="2" fill="#C05050" strokeLinecap="round" />
  )
}

export default function ShopOwner({ mood, size = 90 }: ShopOwnerProps) {
  const skinColor = '#D4926A'
  const skinShadow = '#B87050'

  // Body animation per mood
  const bodyVariants: Record<OwnerMood, TargetAndTransition> = {
    calm:       { y: 0, rotate: 0, scale: 1 },
    working:    { y: [0, -3, 0], rotate: [0, -1, 1, 0], scale: 1 },
    happy:      { y: [0, -6, 0], rotate: [0, -2, 2, 0], scale: [1, 1.04, 1] },
    excited:    { y: [0, -10, -2, -8, 0], rotate: [-3, 3, -3, 3, 0], scale: [1, 1.07, 1] },
    panicked:   { x: [-4, 4, -6, 6, -4, 4, 0], rotate: [-3, 3, -3, 3, 0], scale: [1, 1.02, 1] },
    sad:        { y: [0, 3, 0], rotate: [0, 2, 0], scale: [1, 0.97, 1] },
    celebrating:{ y: [0, -15, -5, -12, 0], rotate: [-5, 5, -4, 4, 0], scale: [1, 1.1, 1.05, 1.1, 1] },
    angry:      { x: [-5, 5, -5, 5, -3, 3, 0], scale: [1, 1.03, 1], rotate: 0 },
  }

  const repeatMap: Record<OwnerMood, number | boolean> = {
    calm: false, working: Infinity, happy: Infinity, excited: Infinity,
    panicked: Infinity, sad: Infinity, celebrating: Infinity, angry: Infinity,
  }
  const durationMap: Record<OwnerMood, number> = {
    calm: 0.3, working: 1.2, happy: 0.8, excited: 0.6,
    panicked: 0.25, sad: 2, celebrating: 0.7, angry: 0.3,
  }

  return (
    <div style={{ position: 'relative', width: size, height: size * 1.35 }}>
      <motion.div
        style={{ width: size, height: size * 1.35, position: 'relative' }}
        animate={bodyVariants[mood]}
        transition={{
          duration: durationMap[mood],
          repeat: repeatMap[mood] as number,
          type: mood === 'panicked' || mood === 'angry' ? 'tween' : 'spring',
          stiffness: 300,
          damping: 12,
        }}
      >
        <svg width={size} height={size * 1.35} viewBox="0 0 80 108" xmlns="http://www.w3.org/2000/svg">

          {/* Shadow */}
          <ellipse cx="40" cy="107" rx="22" ry="4" fill="rgba(0,0,0,0.18)" />

          {/* Chef body — white coat */}
          <rect x="18" y="72" width="44" height="30" rx="8" fill="#F8F8F8" />
          <ellipse cx="40" cy="102" rx="24" ry="8" fill="#E8E8E8" />
          {/* Coat lapels */}
          <path d="M 26 72 L 40 84 L 54 72 L 50 72 L 40 82 L 30 72 Z" fill="white" stroke="#DDD" strokeWidth="1" />
          {/* Coat buttons */}
          <circle cx="40" cy="86" r="2.5" fill="#DDD" stroke="#BBB" strokeWidth="1" />
          <circle cx="40" cy="93" r="2.5" fill="#DDD" stroke="#BBB" strokeWidth="1" />
          {/* Coat pocket */}
          <rect x="22" y="78" width="10" height="8" rx="2" fill="#EEE" stroke="#DDD" strokeWidth="1" />
          {/* Pen in pocket */}
          <rect x="25" y="75" width="2" height="8" rx="1" fill="#3B82F6" />

          {/* Arms */}
          <motion.g
            animate={
              mood === 'celebrating' ? { rotate: [-30, 30, -30, 30, 0], y: [-4, -8, -4, -8, 0] } :
              mood === 'excited' ? { rotate: [-15, 15, -15, 0], y: [-2, -5, -2, 0] } :
              mood === 'panicked' ? { rotate: [-20, 20, -20, 20, 0] } :
              mood === 'working' ? { rotate: [-10, 10, -10, 0] } :
              mood === 'happy' ? { rotate: [-8, 8, -8, 0], y: [-2, -4, -2, 0] } :
              {}
            }
            transition={{ duration: durationMap[mood], repeat: repeatMap[mood] as number }}
            style={{ originX: '40px', originY: '80px' }}
          >
            {/* Left arm */}
            <path d="M 18 75 Q 6 80 8 92" stroke="#F8F8F8" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 18 75 Q 6 80 8 92" stroke="#E8E8E8" strokeWidth="10" fill="none" strokeLinecap="round" />
            {/* Left hand */}
            <circle cx="9" cy="93" r="6.5" fill={skinColor} />
            <circle cx="5" cy="90" r="3.5" fill={skinColor} />
            <circle cx="4" cy="95" r="3" fill={skinColor} />
            <circle cx="9" cy="98" r="3" fill={skinColor} />
            <circle cx="14" cy="97" r="3.5" fill={skinColor} />
          </motion.g>

          {/* Right arm (mirrored) */}
          <motion.g
            animate={
              mood === 'celebrating' ? { rotate: [30, -30, 30, -30, 0], y: [-8, -4, -8, -4, 0] } :
              mood === 'excited' ? { rotate: [15, -15, 15, 0], y: [-5, -2, -5, 0] } :
              mood === 'panicked' ? { rotate: [20, -20, 20, -20, 0] } :
              mood === 'working' ? { rotate: [10, -10, 10, 0] } :
              mood === 'happy' ? { rotate: [8, -8, 8, 0], y: [-4, -2, -4, 0] } :
              {}
            }
            transition={{ duration: durationMap[mood], repeat: repeatMap[mood] as number, delay: 0.1 }}
            style={{ originX: '40px', originY: '80px' }}
          >
            <path d="M 62 75 Q 74 80 72 92" stroke="#F8F8F8" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M 62 75 Q 74 80 72 92" stroke="#E8E8E8" strokeWidth="10" fill="none" strokeLinecap="round" />
            <circle cx="71" cy="93" r="6.5" fill={skinColor} />
            <circle cx="75" cy="90" r="3.5" fill={skinColor} />
            <circle cx="76" cy="95" r="3" fill={skinColor} />
            <circle cx="71" cy="98" r="3" fill={skinColor} />
            <circle cx="66" cy="97" r="3.5" fill={skinColor} />
          </motion.g>

          {/* Neck */}
          <rect x="33" y="62" width="14" height="13" rx="5" fill={skinColor} />
          <rect x="33" y="62" width="6" height="13" rx="3" fill={skinShadow} opacity="0.3" />

          {/* Ears */}
          <ellipse cx="10" cy="40" rx="5.5" ry="7.5" fill={skinColor} stroke={skinShadow} strokeWidth="1" />
          <path d="M 12 34 Q 14 40 12 46" fill="none" stroke={skinShadow} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="70" cy="40" rx="5.5" ry="7.5" fill={skinColor} stroke={skinShadow} strokeWidth="1" />
          <path d="M 68 34 Q 66 40 68 46" fill="none" stroke={skinShadow} strokeWidth="1" strokeLinecap="round" />

          {/* Head */}
          <ellipse cx="40" cy="38" rx="30" ry="32" fill={skinColor} />
          {/* Head shading */}
          <ellipse cx="29" cy="40" rx="10" ry="18" fill={skinShadow} opacity="0.15" />

          {/* Chef hat */}
          <ellipse cx="40" cy="12" rx="22" ry="10" fill="white" />
          <rect x="18" y="8" width="44" height="16" rx="3" fill="white" />
          {/* Hat band (red) */}
          <rect x="18" y="18" width="44" height="6" rx="2" fill="#EF4444" />
          {/* Hat puff */}
          <ellipse cx="40" cy="7" rx="20" ry="12" fill="white" />
          <ellipse cx="32" cy="6" rx="10" ry="8" fill="white" />
          <ellipse cx="48" cy="6" rx="10" ry="8" fill="white" />
          {/* Hat shading */}
          <ellipse cx="32" cy="6" rx="6" ry="5" fill="rgba(0,0,0,0.05)" />
          <ellipse cx="48" cy="6" rx="6" ry="5" fill="rgba(0,0,0,0.05)" />

          {/* Cheeks */}
          <ellipse cx="21" cy="47" rx="8" ry="6" fill="rgba(255,120,100,0.28)" />
          <ellipse cx="59" cy="47" rx="8" ry="6" fill="rgba(255,120,100,0.28)" />

          {/* Eyes */}
          <OwnerEyes mood={mood} />

          {/* Nose */}
          <path d="M 37 44 Q 40 47 43 44" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="37.5" cy="46" rx="2" ry="1.2" fill="rgba(0,0,0,0.15)" />
          <ellipse cx="42.5" cy="46" rx="2" ry="1.2" fill="rgba(0,0,0,0.15)" />

          {/* Mouth */}
          <OwnerMouth mood={mood} />

          {/* Mustache (chef character detail) */}
          <path d="M 31 51 Q 36 49 40 51 Q 44 49 49 51" stroke="#4A2810" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Mood-specific overlays */}
          {(mood === 'panicked') && <SweatDrops />}
          {(mood === 'celebrating' || mood === 'excited') && <Sparkles />}
          {mood === 'happy' && <Hearts />}
          {(mood === 'panicked' || mood === 'working') && <SpeedLines />}

        </svg>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {mood !== 'calm' && mood !== 'working' && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 4, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <div className="bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded-full shadow-lg border border-gray-200 relative">
              {mood === 'happy' && '😄 いい感じ！'}
              {mood === 'excited' && '🎉 やったー！'}
              {mood === 'panicked' && '😱 急いで！！'}
              {mood === 'sad' && '😢 すみません…'}
              {mood === 'celebrating' && '🏆 最高！！！'}
              {mood === 'angry' && '😡 ちゃんとして！'}
              {/* Triangle pointer */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0
                border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
