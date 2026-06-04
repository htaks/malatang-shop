'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SteamParticles, SplashEffect } from './Particles'
import { useEffect, useRef, useState } from 'react'

interface PotComponentProps {
  isSelected: boolean
  spiceLevel: string // 'spice1' | 'spice2' | 'spice3' | ''
  ingredients: string[]
  isComplete?: boolean
  onBubble?: boolean
}

// Broth color by spice level
function getBrothColor(spiceLevel: string) {
  switch (spiceLevel) {
    case 'spice3': return { fill: '#7F1D1D', stroke: '#991B1B', highlight: '#DC2626' }
    case 'spice2': return { fill: '#9A3412', stroke: '#C2410C', highlight: '#F97316' }
    default:       return { fill: '#92400E', stroke: '#B45309', highlight: '#F59E0B' }
  }
}

// Animated bubbling liquid using SVG path
function BubblingLiquid({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute inset-0 bottom-0 rounded-b-2xl overflow-hidden"
      style={{ background: color }}
    >
      {/* Surface ripple */}
      <motion.div
        className="absolute inset-x-0 top-0 h-3 opacity-60"
        style={{ background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)` }}
        animate={{ scaleX: [1, 1.05, 0.97, 1], y: [0, -2, 1, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bubbles */}
      {[15, 35, 55, 75, 90].map((x, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full bg-white/30"
          style={{ left: `${x}%`, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3 }}
          animate={{ y: [0, -30, -30], opacity: [0, 0.8, 0], scale: [0.5, 1, 1.5] }}
          transition={{ duration: 1 + i * 0.2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  )
}

export default function PotComponent({
  isSelected,
  spiceLevel,
  ingredients,
  isComplete = false,
  onBubble = false,
}: PotComponentProps) {
  const broth = getBrothColor(spiceLevel || 'spice1')
  const [lastIngredient, setLastIngredient] = useState<string | null>(null)
  const [showSplash, setShowSplash] = useState(false)
  const prevLenRef = useRef(ingredients.length)

  useEffect(() => {
    if (ingredients.length > prevLenRef.current) {
      const newest = ingredients[ingredients.length - 1]
      setLastIngredient(newest)
      setShowSplash(true)
      const t = setTimeout(() => setShowSplash(false), 600)
      return () => clearTimeout(t)
    }
    prevLenRef.current = ingredients.length
  }, [ingredients])

  return (
    <motion.div
      className="relative"
      animate={
        isSelected
          ? { scale: 1.03, filter: 'drop-shadow(0 0 12px rgba(251,146,60,0.6))' }
          : { scale: 1, filter: 'none' }
      }
      transition={{ duration: 0.2 }}
    >
      {/* Complete glow */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3], scale: [1, 1.05, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ background: 'radial-gradient(ellipse, rgba(74,222,128,0.4) 0%, transparent 70%)', zIndex: 5 }}
          />
        )}
      </AnimatePresence>

      <svg width="96" height="88" viewBox="0 0 96 88" xmlns="http://www.w3.org/2000/svg">
        {/* Pot outer body */}
        <path
          d="M 14 32 Q 12 85 48 86 Q 84 85 82 32 Z"
          fill="#1C1917"
          stroke="#44403C"
          strokeWidth="2"
        />
        {/* Pot inner (broth visible area) */}
        <path
          d="M 18 35 Q 16 82 48 83 Q 80 82 78 35 Z"
          fill={broth.fill}
        />
        {/* Broth highlight */}
        <path
          d="M 22 38 Q 20 70 48 72 Q 76 70 74 38"
          fill={broth.highlight}
          opacity="0.15"
        />
        {/* Rim / top lip */}
        <ellipse cx="48" cy="32" rx="35" ry="8" fill="#292524" stroke="#44403C" strokeWidth="2" />
        <ellipse cx="48" cy="30" rx="32" ry="6" fill="#3C3735" />
        {/* Left handle */}
        <path d="M 14 40 Q 2 44 2 52 Q 2 60 14 60" fill="none" stroke="#44403C" strokeWidth="5" strokeLinecap="round" />
        <path d="M 14 40 Q 2 44 2 52 Q 2 60 14 60" fill="none" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
        {/* Right handle */}
        <path d="M 82 40 Q 94 44 94 52 Q 94 60 82 60" fill="none" stroke="#44403C" strokeWidth="5" strokeLinecap="round" />
        <path d="M 82 40 Q 94 44 94 52 Q 94 60 82 60" fill="none" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
        {/* Lid rim screws */}
        <circle cx="24" cy="30" r="2.5" fill="#57534E" />
        <circle cx="72" cy="30" r="2.5" fill="#57534E" />
        <circle cx="48" cy="24" r="2.5" fill="#57534E" />
      </svg>

      {/* Floating ingredient emojis in broth */}
      <div className="absolute inset-0 flex items-end justify-center pb-2 gap-0.5 pointer-events-none overflow-hidden px-4">
        <AnimatePresence>
          {ingredients.slice(0, 5).map((id, idx) => (
            <motion.span
              key={id + idx}
              className="text-sm leading-none"
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{ y: [0, -2, 0], opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                y: { duration: 1.5, repeat: Infinity, delay: idx * 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
            >
              {/* Show a colored dot as ingredient indicator */}
              <span style={{ fontSize: 10 }}>●</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Steam */}
      <div className="absolute inset-x-0 top-0">
        <SteamParticles count={3} />
      </div>

      {/* Splash effect when ingredient added */}
      {showSplash && lastIngredient && (
        <div className="absolute inset-0 flex items-center justify-center">
          <SplashEffect emoji="💧" active={showSplash} />
        </div>
      )}
    </motion.div>
  )
}
