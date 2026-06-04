'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConveyorItem {
  id: number
  ingredientId: string
  duration: number
  startTime: number
}

interface Ingredient {
  id: string
  name: string
  emoji: string
  unlockStage?: number
}

interface ConveyorBeltProps {
  items: ConveyorItem[]
  onGrab: (item: ConveyorItem) => void
  stage: number
  getIngredient: (id: string) => Ingredient | undefined
}

export default function ConveyorBelt({ items, onGrab, stage, getIngredient }: ConveyorBeltProps) {
  const speed = stage >= 3 ? 'fast' : stage >= 2 ? 'medium' : 'slow'

  return (
    <div className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: 'linear-gradient(to bottom, #1C1917 0%, #292524 50%, #1C1917 100%)',
        border: '2px solid #44403C',
        height: 96,
      }}
    >
      {/* Metal texture top/bottom strips */}
      <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-stone-600 to-stone-700 border-b border-stone-500" />
      <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-b from-stone-700 to-stone-600 border-t border-stone-500" />

      {/* Belt surface - animated stripes */}
      <motion.div
        className="absolute inset-x-0 top-3 bottom-3 overflow-hidden"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, #1C1917 0px, #1C1917 28px, #292524 28px, #292524 30px)' }}
        animate={{ backgroundPositionX: [0, -30] }}
        transition={{ duration: speed === 'fast' ? 0.5 : speed === 'medium' ? 0.8 : 1.2, repeat: Infinity, ease: 'linear' }}
      />

      {/* Roller wheels on edges */}
      {[0, 20, 40, 60, 80, 100].map((pct) => (
        <div
          key={pct}
          className="absolute top-1/2 w-5 h-16 rounded-full border border-stone-500"
          style={{
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle at 35% 35%, #78716C, #292524)',
          }}
        >
          {/* Screw */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-stone-400 border border-stone-300" />
          </div>
        </div>
      ))}

      {/* Speed indicator */}
      <div className="absolute top-1 left-2 flex items-center gap-1 z-10">
        <span className="text-stone-400 text-xs font-bold tracking-wide">BELT</span>
        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
          speed === 'fast' ? 'bg-red-700 text-red-100' :
          speed === 'medium' ? 'bg-yellow-700 text-yellow-100' :
          'bg-green-800 text-green-100'
        }`}>
          {speed === 'fast' ? '⚡ FAST' : speed === 'medium' ? '▶ MED' : '▷ SLOW'}
        </span>
      </div>

      {/* Ingredient cards */}
      <div className="absolute inset-y-3 inset-x-0 overflow-hidden">
        <AnimatePresence>
          {items.map(item => {
            const ing = getIngredient(item.ingredientId)
            if (!ing) return null
            const isRare = !!ing.unlockStage
            const elapsed = (Date.now() - item.startTime) / 1000
            const progress = Math.min(1, elapsed / item.duration)
            // Start at 110%, end at -30%
            const xPct = 110 - progress * 140

            return (
              <motion.button
                key={item.id}
                className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10 group`}
                style={{ left: `${xPct}%` }}
                onClick={() => onGrab(item)}
                whileHover={{ scale: 1.25, y: -8 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <motion.div
                  className={`rounded-xl px-2 py-1.5 border-2 shadow-lg transition-colors ${
                    isRare
                      ? 'border-yellow-400 bg-yellow-900/90 shadow-yellow-500/30'
                      : 'border-orange-600/70 bg-orange-900/90 shadow-orange-700/20'
                  }`}
                  animate={isRare ? { boxShadow: ['0 0 6px rgba(234,179,8,0.4)', '0 0 14px rgba(234,179,8,0.7)', '0 0 6px rgba(234,179,8,0.4)'] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-2xl leading-none block">{ing.emoji}</span>
                </motion.div>
                <span className={`text-xs font-medium whitespace-nowrap mt-0.5 drop-shadow ${isRare ? 'text-yellow-200' : 'text-orange-200'}`}>
                  {ing.name}
                </span>
                {isRare && (
                  <span className="text-yellow-400 text-xs font-black animate-pulse">★</span>
                )}
                {/* Hover grab indicator */}
                <motion.div
                  className="absolute -top-6 opacity-0 group-hover:opacity-100 text-white text-xs font-bold bg-orange-600 px-1.5 py-0.5 rounded-md whitespace-nowrap"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  取る!
                </motion.div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-stone-500 text-xs font-medium z-10">
          食材待ち...
        </div>
      )}
    </div>
  )
}
