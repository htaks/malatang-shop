'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

// ─── Coin Burst ────────────────────────────────────────────────────────────────

interface CoinBurstProps {
  active: boolean
  amount: number
  x?: number
  y?: number
}

export function CoinBurst({ active, amount, x = 50, y = 50 }: CoinBurstProps) {
  const coins = Array.from({ length: 8 }, (_, i) => i)
  const angle = (i: number) => (i / 8) * Math.PI * 2

  return (
    <AnimatePresence>
      {active && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          {coins.map(i => (
            <motion.div
              key={i}
              className="absolute text-lg font-black"
              style={{ left: 0, top: 0 }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(angle(i)) * 80,
                y: Math.sin(angle(i)) * 80,
                opacity: 0,
                scale: 0.5,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.02 }}
            >
              💰
            </motion.div>
          ))}
          <motion.div
            className="absolute text-yellow-300 font-black text-2xl whitespace-nowrap"
            style={{ left: -20, top: -30 }}
            initial={{ y: 0, opacity: 1, scale: 0.8 }}
            animate={{ y: -60, opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            +{amount}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Steam Particles ────────────────────────────────────────────────────────────

export function SteamParticles({ count = 4 }: { count?: number }) {
  return (
    <div className="absolute -top-10 left-0 right-0 flex justify-around pointer-events-none overflow-visible">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-white/40"
          animate={{
            y: [-0, -50],
            x: [0, (i % 2 === 0 ? 8 : -8)],
            opacity: [0.7, 0],
            scale: [0.5, 1.8],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.45,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Confetti Effect ────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FB2']

interface ConfettiEffectProps {
  active: boolean
}

export function ConfettiEffect({ active }: ConfettiEffectProps) {
  const pieces = Array.from({ length: 20 }, (_, i) => i)

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map(i => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                rotate: Math.random() * 360,
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 50,
                opacity: [1, 1, 0],
                rotate: (i % 2 === 0 ? 720 : -720),
                x: [(Math.random() - 0.5) * 200],
              }}
              transition={{
                duration: 1.5 + Math.random() * 1,
                delay: Math.random() * 0.5,
                ease: 'easeIn',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Splash Effect ─────────────────────────────────────────────────────────────

interface SplashEffectProps {
  emoji: string
  active: boolean
}

export function SplashEffect({ emoji, active }: SplashEffectProps) {
  const drops = Array.from({ length: 6 }, (_, i) => i)

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          {/* Main ingredient falling in */}
          <motion.div
            className="text-4xl absolute"
            initial={{ y: -60, scale: 1.5, opacity: 1 }}
            animate={{ y: 0, scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          >
            {emoji}
          </motion.div>
          {/* Splash drops */}
          {drops.map(i => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-orange-400/60"
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / drops.length) * Math.PI * 2) * 30,
                y: Math.sin((i / drops.length) * Math.PI * 2) * 30 - 10,
                scale: [0, 1, 0],
                opacity: [1, 0.5, 0],
              }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Anger Smoke ────────────────────────────────────────────────────────────────

export function AngerSmoke({ active }: { active: boolean }) {
  const [puffs, setPuffs] = useState<number[]>([])

  useEffect(() => {
    if (!active) return
    const id = Date.now()
    setPuffs(prev => [...prev, id])
    const t = setTimeout(() => setPuffs(prev => prev.filter(p => p !== id)), 1200)
    return () => clearTimeout(t)
  }, [active])

  return (
    <AnimatePresence>
      {puffs.map(id => (
        <motion.div
          key={id}
          className="absolute -top-8 right-0 text-2xl pointer-events-none z-20"
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{ y: -30, opacity: 0, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          💢
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

// ─── Animated Score Number ────────────────────────────────────────────────────

interface AnimatedScoreProps {
  value: number
  className?: string
}

export function AnimatedScore({ value, className = '' }: AnimatedScoreProps) {
  const [display, setDisplay] = useState(value)
  const [isIncreasing, setIsIncreasing] = useState(false)

  useEffect(() => {
    setIsIncreasing(value > display)
    const diff = value - display
    const steps = Math.min(Math.abs(diff), 20)
    if (steps === 0) return
    let step = 0
    const interval = setInterval(() => {
      step++
      setDisplay(Math.round(display + (diff * step) / steps))
      if (step >= steps) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <motion.span
      className={className}
      key={value}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3 }}
      style={{ color: isIncreasing ? '#FBBF24' : undefined }}
    >
      {display.toLocaleString()}
    </motion.span>
  )
}
