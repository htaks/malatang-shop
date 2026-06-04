'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Character, { type CharacterType } from './Character'
import ShopOwner, { type OwnerMood } from './ShopOwner'
// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerOrder {
  ingredients: string[]
  spiceLevel: string
  customerEmoji: string
  customerName: string
  customerType: string
  forbiddenIngredients: string[]
}

export interface SceneCustomer {
  customerId: number
  tableId: number
  seatIndex: number
  order: CustomerOrder
  charType: CharacterType
  reactionEmoji?: string
  isGroup?: boolean
}

interface RestaurantSceneProps {
  seatedCustomers: SceneCustomer[]
  walkingCustomers: SceneCustomer[]
  activeTableId: number | null
  onSelectTable: (tableId: number) => void
  ownerMood: OwnerMood
  combo: number
  satisfaction: number
}

// ── Table layout ──────────────────────────────────────────────────────────────

const TABLES = [
  { id: 1, left: '14%', top: '22%', scale: 0.72, capacity: 2 },
  { id: 2, left: '52%', top: '16%', scale: 0.68, capacity: 2 },
  { id: 3, left: '8%',  top: '52%', scale: 0.92, capacity: 4 },
  { id: 4, left: '54%', top: '46%', scale: 0.88, capacity: 2 },
]

// Seat offsets relative to table center (as px at scale=1)
const SEAT_OFFSETS = [
  { dx: -30, dy: 28 },
  { dx: 30,  dy: 28 },
  { dx: -30, dy: -28 },
  { dx: 30,  dy: -28 },
]

const ENTRANCE = { left: '45%', top: '85%' }

// ── SVG Table ─────────────────────────────────────────────────────────────────

function TableSVG({ selected, capacity }: { selected: boolean; capacity: number }) {
  const w = capacity >= 4 ? 90 : 74
  const h = 46
  return (
    <svg width={w + 20} height={h + 32} viewBox={`0 0 ${w + 20} ${h + 32}`} xmlns="http://www.w3.org/2000/svg">
      {selected && (
        <rect x="2" y="2" width={w + 16} height={h + 28} rx="14"
          fill="none" stroke="#F0C040" strokeWidth="3" opacity="0.9"
          style={{ filter: 'drop-shadow(0 0 8px #F0C040)' }} />
      )}
      {/* Table front face */}
      <rect x="10" y={h - 4} width={w} height="16" rx="4" fill="#A06030" />
      {/* Table top face */}
      <rect x="10" y="10" width={w} height={h - 4} rx="8" fill="#C8864A" stroke="#A06030" strokeWidth="2" />
      {/* Wood grain */}
      <line x1="28" y1="14" x2="28" y2={h - 6} stroke="#B07040" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="14" x2="44" y2={h - 6} stroke="#B07040" strokeWidth="1" opacity="0.5" />
      <line x1="60" y1="14" x2="60" y2={h - 6} stroke="#B07040" strokeWidth="1" opacity="0.4" />
      {capacity >= 4 && (
        <line x1="76" y1="14" x2="76" y2={h - 6} stroke="#B07040" strokeWidth="1" opacity="0.4" />
      )}
      {/* Shine */}
      <rect x="14" y="13" width={Math.floor(w * 0.4)} height="6" rx="3" fill="rgba(255,255,255,0.18)" />
    </svg>
  )
}

// ── Chair SVG ─────────────────────────────────────────────────────────────────

function ChairSVG({ occupied }: { occupied: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      {/* Chair seat */}
      <ellipse cx="14" cy="14" rx="12" ry="9" fill={occupied ? '#A0240C' : '#C0392B'} />
      {/* Cushion */}
      <ellipse cx="14" cy="13" rx="9" ry="6" fill={occupied ? '#D4A020' : '#F0C040'} />
      {/* Shine */}
      <ellipse cx="11" cy="11" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)" />
    </svg>
  )
}

// ── Speech bubble ─────────────────────────────────────────────────────────────

function SpeechBubble({ order }: { order: CustomerOrder }) {
  const items = order.ingredients.slice(0, 3)
  const ing = items.map(id => {
    const emojiMap: Record<string, string> = {
      hakusai: '🥬', moyashi: '🌱', kinoko: '🍄', jagaimo: '🥔',
      tofu: '🧊', horenso: '🌿', negi: '🧅', ebi: '🦐',
      tsumire: '🐟', gyoza: '🥟', chikuwa: '🍢', uzura: '🥚',
      lamb: '🥩', bifun: '🍜', udon: '🍝', shirataki: '🌀',
      truffle: '🍫', foiegras: '🦆', jinhuaham: '🥓',
    }
    return emojiMap[id] ?? '?'
  })
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-2 py-1 text-xs shadow-lg border border-orange-200 whitespace-nowrap z-10"
      style={{ pointerEvents: 'none', minWidth: 44 }}>
      <div className="flex gap-0.5 items-center justify-center">
        {ing.map((e, i) => <span key={i}>{e}</span>)}
        {order.ingredients.length > 3 && <span className="text-gray-400">…</span>}
      </div>
      {/* Tail */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
        style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '8px solid white' }} />
    </div>
  )
}

// ── Table component ───────────────────────────────────────────────────────────

function TableArea({
  table,
  seated,
  selected,
  onSelect,
}: {
  table: typeof TABLES[0]
  seated: SceneCustomer[]
  selected: boolean
  onSelect: () => void
}) {
  const w = table.capacity >= 4 ? 90 : 74
  const h = 46

  return (
    <div
      className="absolute"
      style={{
        left: table.left,
        top: table.top,
        transform: `scale(${table.scale})`,
        transformOrigin: 'top left',
        cursor: seated.length > 0 ? 'pointer' : 'default',
        zIndex: Math.round(parseFloat(table.top) * 10),
      }}
      onClick={seated.length > 0 ? onSelect : undefined}
    >
      {/* Chairs behind (top) */}
      {[2, 3].slice(0, table.capacity >= 4 ? 2 : 0).map(seatIdx => {
        const off = SEAT_OFFSETS[seatIdx]
        const occ = seated.some(s => s.seatIndex === seatIdx)
        return (
          <div key={seatIdx} className="absolute"
            style={{ left: (w / 2 + 10) + off.dx - 14, top: h / 2 + off.dy - 9 }}>
            <ChairSVG occupied={occ} />
          </div>
        )
      })}

      {/* Table */}
      <TableSVG selected={selected} capacity={table.capacity} />

      {/* Chairs in front (bottom) */}
      {[0, 1].map(seatIdx => {
        const off = SEAT_OFFSETS[seatIdx]
        const occ = seated.some(s => s.seatIndex === seatIdx)
        return (
          <div key={seatIdx} className="absolute"
            style={{ left: (w / 2 + 10) + off.dx - 14, top: h / 2 + off.dy - 9 }}>
            <ChairSVG occupied={occ} />
          </div>
        )
      })}

      {/* Seated characters */}
      {seated.map(sc => {
        const off = SEAT_OFFSETS[sc.seatIndex] ?? SEAT_OFFSETS[0]
        return (
          <div key={sc.customerId} className="absolute"
            style={{ left: (w / 2 + 10) + off.dx - 16, top: h / 2 + off.dy - 52, zIndex: 5 }}>
            <div className="relative">
              <SpeechBubble order={sc.order} />
              <Character type={sc.charType} expression="excited" size={32} />
            </div>
          </div>
        )
      })}

      {/* Selection glow pulse */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: '3px solid #F0C040', borderRadius: 12 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  )
}

// ── Walking customer ──────────────────────────────────────────────────────────

function WalkingCustomer({ customer, targetTable }: { customer: SceneCustomer; targetTable: typeof TABLES[0] | undefined }) {
  if (!targetTable) return null

  const off = SEAT_OFFSETS[customer.seatIndex] ?? SEAT_OFFSETS[0]
  const w = targetTable.capacity >= 4 ? 90 : 74

  // Compute target position in scene %
  const tableLeft = parseFloat(targetTable.left) // % of container
  const tableTop = parseFloat(targetTable.top)
  const scale = targetTable.scale

  const targetX = tableLeft + ((w / 2 + 10) + off.dx - 16) * scale / 5
  const targetY = tableTop + (46 / 2 + off.dy - 52) * scale / 5

  const entranceLeft = parseFloat(ENTRANCE.left)
  const entranceTop = parseFloat(ENTRANCE.top)

  const midX = (entranceLeft + targetX) / 2 + (Math.random() * 6 - 3)
  const midY = (entranceTop + targetY) / 2

  return (
    <motion.div
      className="absolute z-20"
      initial={{ left: `${entranceLeft}%`, top: `${entranceTop}%` }}
      animate={{
        left: [`${entranceLeft}%`, `${midX}%`, `${targetX}%`],
        top: [`${entranceTop}%`, `${midY}%`, `${targetY}%`],
      }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >
      <Character type={customer.charType} expression="neutral" size={28} />
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RestaurantScene({
  seatedCustomers,
  walkingCustomers,
  activeTableId,
  onSelectTable,
  ownerMood,
  combo,
  satisfaction,
}: RestaurantSceneProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-b-2xl"
      style={{
        height: '100%',
        background: '#FFF3E8',
      }}
    >
      {/* ── Isometric room wrapper ── */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'perspective(500px) rotateX(28deg)',
          transformOrigin: 'top center',
        }}
      >
        {/* Floor */}
        <div
          className="absolute inset-0"
          style={{
            background: '#F5E6D3',
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, #E8D4BE 39px, #E8D4BE 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, #E8D4BE 39px, #E8D4BE 40px)
            `,
          }}
        />

        {/* Back wall */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '32%', background: '#FAF0E6', borderBottom: '3px solid #E8D4BE' }}
        />

        {/* Left wall panel */}
        <div
          className="absolute top-0 left-0"
          style={{ width: '6%', top: '0', bottom: '0', background: '#F0D4C0', borderRight: '2px solid #E0C4B0' }}
        />

        {/* Counter / kitchen area (back-right) */}
        <div
          className="absolute"
          style={{
            right: '3%', top: '2%', width: '28%', height: '30%',
            background: '#E8C4A0',
            borderRadius: '8px 8px 0 0',
            border: '2px solid #C8A060',
            overflow: 'hidden',
          }}
        >
          {/* Counter top */}
          <div style={{ height: 10, background: '#C8A060', borderBottom: '2px solid #A08040' }} />
          {/* Display cases */}
          <div className="flex gap-1 px-2 pt-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 rounded" style={{ height: 14, background: 'rgba(200,220,255,0.3)', border: '1px solid rgba(200,200,255,0.5)' }} />
            ))}
          </div>
          {/* Shop owner */}
          <div className="absolute bottom-0 right-2 flex items-end justify-center" style={{ height: 60 }}>
            <ShopOwner mood={ownerMood} size={44} />
          </div>
        </div>

        {/* Entrance (bottom center) */}
        <div
          className="absolute"
          style={{ left: '40%', bottom: '2%', width: '16%', height: '10%' }}
        >
          {/* Door frame */}
          <div className="relative flex justify-center" style={{ height: '100%' }}>
            <div style={{ position: 'absolute', left: '10%', top: 0, bottom: 0, width: 8, background: '#8B6040', borderRadius: 2 }} />
            <div style={{ position: 'absolute', right: '10%', top: 0, bottom: 0, width: 8, background: '#8B6040', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 6, background: '#8B6040', borderRadius: 2 }} />
            {/* Mat */}
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 5, background: '#4CAF50', borderRadius: 2 }} />
            {/* Label */}
            <div className="absolute text-center" style={{ bottom: 6, left: 0, right: 0 }}>
              <span style={{ fontSize: 8, color: '#8B6040', fontWeight: 'bold' }}>入口</span>
            </div>
          </div>
        </div>

        {/* Tables */}
        {TABLES.map(table => {
          const seated = seatedCustomers.filter(sc => sc.tableId === table.id)
          return (
            <TableArea
              key={table.id}
              table={table}
              seated={seated}
              selected={activeTableId === table.id}
              onSelect={() => onSelectTable(table.id)}
            />
          )
        })}

        {/* Walking customers */}
        <AnimatePresence>
          {walkingCustomers.map(wc => (
            <WalkingCustomer
              key={`walking-${wc.customerId}`}
              customer={wc}
              targetTable={TABLES.find(t => t.id === wc.tableId)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── HUD overlay (not perspective-transformed) ── */}
      {/* Combo badge */}
      {combo >= 2 && (
        <div className="absolute top-2 left-2 z-30 bg-orange-700/80 text-white text-xs font-black px-2 py-1 rounded-lg">
          {combo}🔥
        </div>
      )}

      {/* No-table prompt */}
      {seatedCustomers.length > 0 && activeTableId === null && (
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white/90 text-orange-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          テーブルをタップしてオーダー！
        </motion.div>
      )}
    </div>
  )
}

// Export table config so page.tsx can use it
export { TABLES }
