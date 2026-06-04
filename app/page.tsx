'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'vegetable' | 'protein' | 'noodle' | 'spice'
type CustomerType = 'normal' | 'impatient' | 'allergic' | 'regular' | 'hungry'
type GamePhase = 'title' | 'tutorial' | 'playing' | 'procurement' | 'result'

interface Ingredient {
  id: string
  name: string
  emoji: string
  category: Category
  cookTime: number // seconds; 0 = instant
  price: number    // coins per unit
}

interface CustomerOrder {
  ingredients: string[]
  spiceLevel: string
  customerEmoji: string
  customerName: string
  customerType: CustomerType
  forbiddenIngredients: string[] // only for allergic
}

interface CookingItem {
  id: string
  ingredientId: string
  progress: number   // 0-100
  ready: boolean
}

interface CoinAnimation {
  id: number
  x: number
  y: number
  amount: number
  positive: boolean
}

interface Stock {
  [ingredientId: string]: number
}

interface ComboOverlay {
  name: string
  bonus: number
  emoji: string
}

// ─── Tutorial steps ───────────────────────────────────────────────────────────

interface TutorialStep {
  target: 'customer' | 'ingredients' | 'pot' | 'timer' | 'serve' | 'score'
  title: string
  body: string
  emoji: string
  position: 'right' | 'left' | 'bottom' | 'top'
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: 'customer',
    title: 'お客さんの注文',
    body: 'ここにお客さんの注文が表示されます。\nどの食材が必要か確認しましょう！\nチェックが付くと正解です ✅\n\n⚡せっかちや🧑‍🍳常連など特殊なお客さんも来ます！',
    emoji: '👩',
    position: 'right',
  },
  {
    target: 'ingredients',
    title: '食材を選ぼう',
    body: 'クリックして食材を選びます。\n料理時間が経過すると鍋に入ります！\n🟩 緑枠 = 正しく選択済み\n🟥 赤枠 = 注文にない食材\n\n秘密のレシピコンボが存在します 🎉',
    emoji: '🛒',
    position: 'bottom',
  },
  {
    target: 'pot',
    title: 'あなたの鍋',
    body: '選んだ食材がここに入ります。\n✓ 緑 = 正解の食材\n✗ 赤 = 余分な食材\n辛さも選ぶのを忘れずに！\n\n満足度が0になるとゲームオーバー！',
    emoji: '🍲',
    position: 'left',
  },
  {
    target: 'timer',
    title: '制限時間',
    body: '時間内に提供しないと\n自動的に送られます！\nレベルが上がるほど短くなります。\n速く出すとタイムボーナス獲得！',
    emoji: '⏰',
    position: 'bottom',
  },
  {
    target: 'serve',
    title: '提供する',
    body: '食材を選び終えたら\n「提供する」ボタンを押そう！\nピッタリ正解で +100コイン！\nタイムボーナスも加算されます 💰\n\n5人ごとに仕入れフェーズがあります！',
    emoji: '🎯',
    position: 'left',
  },
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const INGREDIENTS: Ingredient[] = [
  { id: 'hakusai',   name: '白菜',       emoji: '🥬', category: 'vegetable', cookTime: 3, price: 5 },
  { id: 'moyashi',   name: 'もやし',     emoji: '🌱', category: 'vegetable', cookTime: 3, price: 5 },
  { id: 'kinoko',    name: 'きのこ',     emoji: '🍄', category: 'vegetable', cookTime: 4, price: 7 },
  { id: 'jagaimo',   name: 'じゃがいも', emoji: '🥔', category: 'vegetable', cookTime: 4, price: 6 },
  { id: 'tofu',      name: 'とうふ',     emoji: '🧊', category: 'vegetable', cookTime: 3, price: 5 },
  { id: 'horenso',   name: 'ほうれん草', emoji: '🌿', category: 'vegetable', cookTime: 3, price: 6 },
  { id: 'negi',      name: 'ネギ',       emoji: '🧅', category: 'vegetable', cookTime: 3, price: 5 },
  { id: 'ebi',       name: 'えび',       emoji: '🦐', category: 'protein',   cookTime: 6, price: 15 },
  { id: 'tsumire',   name: 'つみれ',     emoji: '🐟', category: 'protein',   cookTime: 5, price: 10 },
  { id: 'gyoza',     name: 'ぎょうざ',   emoji: '🥟', category: 'protein',   cookTime: 7, price: 12 },
  { id: 'chikuwa',   name: 'ちくわ',     emoji: '🍢', category: 'protein',   cookTime: 5, price: 8 },
  { id: 'uzura',     name: 'うずらたまご', emoji: '🥚', category: 'protein', cookTime: 5, price: 8 },
  { id: 'lamb',      name: 'ラム肉',     emoji: '🥩', category: 'protein',   cookTime: 7, price: 18 },
  { id: 'bifun',     name: 'ビーフン',   emoji: '🍜', category: 'noodle',    cookTime: 4, price: 7 },
  { id: 'udon',      name: 'うどん',     emoji: '🍝', category: 'noodle',    cookTime: 5, price: 8 },
  { id: 'shirataki', name: 'しらたき',   emoji: '🌀', category: 'noodle',    cookTime: 4, price: 6 },
  { id: 'spice1',    name: '普通',       emoji: '🌶️',     category: 'spice', cookTime: 0, price: 0 },
  { id: 'spice2',    name: '辛め',       emoji: '🌶️🌶️',   category: 'spice', cookTime: 0, price: 0 },
  { id: 'spice3',    name: '激辛',       emoji: '🌶️🌶️🌶️', category: 'spice', cookTime: 0, price: 0 },
]

const SPICE_IDS = ['spice1', 'spice2', 'spice3']
const NON_SPICE = INGREDIENTS.filter(i => i.category !== 'spice')
const NON_SPICE_IDS = NON_SPICE.map(i => i.id)

const CUSTOMERS = [
  { emoji: '👩', name: 'さくらさん' },
  { emoji: '👦', name: 'けんくん' },
  { emoji: '👴', name: 'おじいさん' },
  { emoji: '👧', name: 'はなちゃん' },
  { emoji: '🧑', name: 'たろうくん' },
  { emoji: '👩‍🦱', name: 'みほさん' },
  { emoji: '🧓', name: 'おばあさん' },
  { emoji: '🧒', name: 'ゆうくん' },
]

const CUSTOMERS_PER_DAY = 5

// ─── Secret Combos ────────────────────────────────────────────────────────────

interface SecretCombo {
  ids: string[]
  name: string
  bonus: number
  emoji: string
}

const SECRET_COMBOS: SecretCombo[] = [
  { ids: ['ebi', 'horenso', 'shirataki'], name: '海鮮スペシャル', bonus: 200, emoji: '🦐' },
  { ids: ['lamb', 'negi', 'jagaimo'],     name: 'モンゴル風',     bonus: 150, emoji: '🥩' },
  { ids: ['gyoza', 'chikuwa', 'uzura'],   name: 'おでん風',       bonus: 180, emoji: '🥟' },
  { ids: ['hakusai', 'moyashi', 'kinoko'],name: 'ベジスペシャル', bonus: 120, emoji: '🥬' },
  { ids: ['ebi', 'gyoza', 'udon'],        name: '海老うどん',     bonus: 160, emoji: '🍝' },
]

function checkSecretCombo(selectedIds: string[]): SecretCombo | null {
  for (const combo of SECRET_COMBOS) {
    if (combo.ids.every(id => selectedIds.includes(id))) return combo
  }
  return null
}

// ─── Initial Stock ────────────────────────────────────────────────────────────

function buildInitialStock(): Stock {
  const stock: Stock = {}
  for (const ing of NON_SPICE) {
    stock[ing.id] = 4
  }
  return stock
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIngredientById(id: string): Ingredient | undefined {
  return INGREDIENTS.find(i => i.id === id)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickCustomerType(index: number): CustomerType {
  if (index === 0) return 'normal'
  const roll = Math.random()
  if (roll < 0.20) return 'impatient'
  if (roll < 0.35) return 'allergic'
  if (roll < 0.50) return 'regular'
  if (roll < 0.60) return 'hungry'
  return 'normal'
}

function generateOrder(level: number, prevOrder: CustomerOrder | null, customerIndex: number): CustomerOrder {
  const type = pickCustomerType(customerIndex)

  let minIngredients: number
  let maxIngredients: number

  if (type === 'hungry') {
    minIngredients = 6
    maxIngredients = 7
  } else {
    minIngredients = level >= 3 ? 4 : level === 2 ? 3 : 2
    maxIngredients = level >= 3 ? 5 : level === 2 ? 4 : 3
  }

  const count = minIngredients + Math.floor(Math.random() * (maxIngredients - minIngredients + 1))

  let ingredients: string[]
  let spiceLevel: string
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]

  if (type === 'regular' && prevOrder) {
    ingredients = [...prevOrder.ingredients]
    spiceLevel = prevOrder.spiceLevel
  } else {
    ingredients = shuffle(NON_SPICE_IDS).slice(0, count)
    spiceLevel = SPICE_IDS[Math.floor(Math.random() * SPICE_IDS.length)]
  }

  let forbiddenIngredients: string[] = []
  if (type === 'allergic') {
    const available = NON_SPICE_IDS.filter(id => !ingredients.includes(id))
    const numForbidden = 1 + Math.floor(Math.random() * 2) // 1-2
    forbiddenIngredients = shuffle(available).slice(0, numForbidden)
  }

  return {
    ingredients,
    spiceLevel,
    customerEmoji: customer.emoji,
    customerName: customer.name,
    customerType: type,
    forbiddenIngredients,
  }
}

function getTimerForLevel(level: number, type: CustomerType): number {
  const base = level >= 3 ? 20 : level === 2 ? 25 : 30
  return type === 'impatient' ? Math.floor(base / 2) : base
}

function customerTypeBadge(type: CustomerType): { label: string; color: string } | null {
  switch (type) {
    case 'impatient': return { label: '⚡ せっかち', color: 'bg-yellow-600 text-yellow-100' }
    case 'allergic':  return { label: '⚠️ アレルギー', color: 'bg-red-700 text-red-100' }
    case 'regular':   return { label: '🌟 常連さん', color: 'bg-blue-700 text-blue-100' }
    case 'hungry':    return { label: '🍖 大食い', color: 'bg-purple-700 text-purple-100' }
    default: return null
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SteamEffect() {
  return (
    <div className="absolute -top-8 left-0 right-0 flex justify-around pointer-events-none">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-white/50 animate-steam"
          style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
    </div>
  )
}

interface IngredientButtonProps {
  ingredient: Ingredient
  selected: boolean
  inOrder: boolean
  isCooking: boolean
  isOutOfStock: boolean
  isForbidden: boolean
  onClick: () => void
}

function IngredientButton({ ingredient, selected, inOrder, isCooking, isOutOfStock, isForbidden, onClick }: IngredientButtonProps) {
  let borderClass = 'border-2 border-transparent'
  let bgClass = 'bg-orange-950/60 hover:bg-orange-900/80'

  if (isOutOfStock) {
    bgClass = 'bg-orange-950/20 opacity-40 cursor-not-allowed'
  } else if (isForbidden) {
    borderClass = 'border-2 border-red-500'
    bgClass = 'bg-red-950/60'
  } else if (isCooking) {
    borderClass = 'border-2 border-yellow-400'
    bgClass = 'bg-yellow-900/60'
  } else if (selected && inOrder) {
    borderClass = 'border-2 border-green-400'
    bgClass = 'bg-green-900/60'
  } else if (selected && !inOrder) {
    borderClass = 'border-2 border-red-400'
    bgClass = 'bg-red-900/60'
  }

  return (
    <button onClick={onClick} disabled={isOutOfStock}
      className={`${borderClass} ${bgClass} rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer min-w-0`}>
      <span className="text-2xl leading-none select-none">{ingredient.emoji}</span>
      <span className="text-xs text-orange-100 font-medium leading-tight text-center">{ingredient.name}</span>
      {isForbidden && <span className="text-xs text-red-400">❌</span>}
    </button>
  )
}

// ─── Tutorial Overlay ─────────────────────────────────────────────────────────

interface TutorialOverlayProps {
  step: number
  onNext: () => void
  onSkip: () => void
  targetRefs: Record<string, React.RefObject<HTMLElement | null>>
}

function TutorialOverlay({ step, onNext, onSkip, targetRefs }: TutorialOverlayProps) {
  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1
  const ref = targetRefs[current.target]
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!ref?.current) return
    const rect = ref.current.getBoundingClientRect()
    const pad = 8

    setHighlightStyle({
      position: 'fixed',
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      borderRadius: 16,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
      border: '2px solid rgba(251,146,60,0.8)',
      zIndex: 40,
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
    })

    const tooltipW = 260
    const tooltipH = 220
    let top = 0, left = 0

    if (current.position === 'right') {
      top = rect.top + rect.height / 2 - tooltipH / 2
      left = rect.right + pad + 12
    } else if (current.position === 'left') {
      top = rect.top + rect.height / 2 - tooltipH / 2
      left = rect.left - tooltipW - pad - 12
    } else if (current.position === 'bottom') {
      top = rect.bottom + pad + 12
      left = rect.left + rect.width / 2 - tooltipW / 2
    } else {
      top = rect.top - tooltipH - pad - 12
      left = rect.left + rect.width / 2 - tooltipW / 2
    }

    top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8))
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))

    setTooltipStyle({ position: 'fixed', top, left, width: tooltipW, zIndex: 50 })

    const arrowX = rect.left + rect.width / 2
    const arrowY = rect.top + rect.height / 2
    setArrowStyle({ position: 'fixed', top: arrowY, left: arrowX, zIndex: 49, pointerEvents: 'none' })
  }, [step, ref, current.position])

  return (
    <>
      <div style={highlightStyle} />
      <div style={tooltipStyle} className="animate-fadeIn">
        <div className="bg-gradient-to-b from-orange-900 to-orange-950 border-2 border-orange-500/60 rounded-2xl p-4 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{current.emoji}</span>
            <h3 className="text-orange-200 font-black text-sm">{current.title}</h3>
            <span className="ml-auto text-orange-400/60 text-xs">{step + 1}/{TUTORIAL_STEPS.length}</span>
          </div>
          <p className="text-orange-100/80 text-xs leading-relaxed whitespace-pre-line mb-4">
            {current.body}
          </p>
          <div className="flex gap-1 justify-center mb-3">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-orange-400 w-3' : i < step ? 'bg-orange-600' : 'bg-orange-800'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onSkip}
              className="flex-1 text-orange-400/60 text-xs py-1.5 rounded-lg border border-orange-800/40 hover:border-orange-700 transition-all">
              スキップ
            </button>
            <button onClick={onNext}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-xs py-1.5 rounded-lg transition-all active:scale-95">
              {isLast ? '🎮 ゲームスタート！' : '次へ →'}
            </button>
          </div>
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-orange-400 text-xs animate-bounce hidden">▼</div>
      </div>
      <div style={{ ...arrowStyle, transform: 'translate(-50%, -50%)', width: 40, height: 40 }}>
        <div className="w-full h-full rounded-full border-2 border-orange-400/60 animate-ping" />
      </div>
    </>
  )
}

// ─── Satisfaction Bar ─────────────────────────────────────────────────────────

function SatisfactionBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-orange-300/80 whitespace-nowrap">😊 満足度</span>
      <div className="flex-1 bg-orange-950 rounded-full h-2.5 overflow-hidden border border-orange-800">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-orange-300/80 w-6 text-right">{pct}</span>
    </div>
  )
}

// ─── Combo Flash Overlay ──────────────────────────────────────────────────────

function ComboFlashOverlay({ combo, onDone }: { combo: ComboOverlay; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-br from-yellow-600 to-orange-600 border-4 border-yellow-300 rounded-3xl px-10 py-8 shadow-2xl text-center animate-fadeIn">
        <div className="text-5xl mb-2">{combo.emoji}</div>
        <div className="text-2xl font-black text-white mb-1">🎉 コンボ発動！</div>
        <div className="text-xl font-bold text-yellow-200 mb-2">{combo.name}</div>
        <div className="text-3xl font-black text-yellow-300">+{combo.bonus} コイン！</div>
      </div>
    </div>
  )
}

// ─── Procurement Screen ───────────────────────────────────────────────────────

interface ProcurementScreenProps {
  day: number
  budget: number
  stock: Stock
  onDone: (newStock: Stock, spent: number) => void
}

function ProcurementScreen({ day, budget, stock, onDone }: ProcurementScreenProps) {
  const [cart, setCart] = useState<Stock>({})
  const SHOP_ITEMS = NON_SPICE

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const ing = getIngredientById(id)
    return sum + (ing ? ing.price * qty : 0)
  }, 0)

  const remaining = budget - cartTotal

  function addItem(id: string) {
    const ing = getIngredientById(id)
    if (!ing) return
    if (cartTotal + ing.price > budget) return
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  function removeItem(id: string) {
    setCart(prev => {
      const next = { ...prev }
      if (!next[id] || next[id] <= 0) return next
      next[id] = next[id] - 1
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  function handleConfirm() {
    const newStock: Stock = { ...stock }
    for (const [id, qty] of Object.entries(cart)) {
      newStock[id] = (newStock[id] ?? 0) + qty
    }
    onDone(newStock, cartTotal)
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 select-none">
      <div className="max-w-xl w-full animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏪</div>
          <h1 className="text-3xl font-black text-orange-300">Day {day} 仕入れフェーズ</h1>
          <p className="text-orange-400/70 text-sm mt-1">食材を仕入れましょう（残り予算: <span className="text-yellow-400 font-bold">{remaining} コイン</span>）</p>
        </div>

        <div className="space-y-2 mb-6">
          {SHOP_ITEMS.map(ing => {
            const currentStock = (stock[ing.id] ?? 0) + (cart[ing.id] ?? 0)
            const cartQty = cart[ing.id] ?? 0
            return (
              <div key={ing.id} className="bg-orange-950/60 border border-orange-800/40 rounded-xl px-4 py-2 flex items-center gap-3">
                <span className="text-2xl">{ing.emoji}</span>
                <div className="flex-1">
                  <span className="text-orange-200 text-sm font-medium">{ing.name}</span>
                  <span className="text-orange-400/60 text-xs ml-2">{ing.price}コイン/個</span>
                  <span className="text-orange-400/60 text-xs ml-2">在庫: {currentStock}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeItem(ing.id)} disabled={cartQty === 0}
                    className="w-7 h-7 rounded-full bg-orange-800 hover:bg-orange-700 disabled:opacity-30 text-white font-bold transition-all text-sm">
                    −
                  </button>
                  <span className="w-4 text-center text-orange-200 text-sm">{cartQty}</span>
                  <button onClick={() => addItem(ing.id)} disabled={remaining < ing.price}
                    className="w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-bold transition-all text-sm">
                    ＋
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-orange-950/80 border border-orange-700/40 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-orange-300 font-bold">合計: {cartTotal} コイン</span>
          <button onClick={handleConfirm}
            className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black px-6 py-2 rounded-xl transition-all active:scale-95">
            🍳 調理開始！
          </button>
        </div>
        <p className="text-orange-400/50 text-xs text-center">購入しない場合は「調理開始！」をそのまま押してください</p>
      </div>
    </main>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function MalatangGame() {
  const [phase, setPhase] = useState<GamePhase>('title')
  const [tutorialStep, setTutorialStep] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [customerIndex, setCustomerIndex] = useState(0) // global across days
  const [dayIndex, setDayIndex] = useState(1)
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null)
  const [prevOrder, setPrevOrder] = useState<CustomerOrder | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const [selectedSpice, setSelectedSpice] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [maxTime, setMaxTime] = useState(30)
  const [coinAnimations, setCoinAnimations] = useState<CoinAnimation[]>([])
  const [serveFeedback, setServeFeedback] = useState<null | { correct: boolean; delta: number }>(null)
  const [isServing, setIsServing] = useState(false)
  const [isTutorialActive, setIsTutorialActive] = useState(false)

  // Combo system
  const [combo, setCombo] = useState(0) // consecutive correct orders
  const [satisfaction, setSatisfaction] = useState(100)

  // Cooking system
  const [cookingItems, setCookingItems] = useState<CookingItem[]>([])
  const cookingIdRef = useRef(0)

  // Procurement & stock
  const [stock, setStock] = useState<Stock>(buildInitialStock())
  const [procurementBudget, setProcurementBudget] = useState(500)

  // Combo overlay
  const [comboOverlay, setComboOverlay] = useState<ComboOverlay | null>(null)

  const coinIdRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cookingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refs for tutorial targets
  const customerRef = useRef<HTMLDivElement>(null)
  const ingredientsRef = useRef<HTMLDivElement>(null)
  const potRef = useRef<HTMLDivElement>(null)
  const timerRef2 = useRef<HTMLDivElement>(null)
  const serveRef = useRef<HTMLButtonElement>(null)

  const targetRefs = {
    customer: customerRef as React.RefObject<HTMLElement | null>,
    ingredients: ingredientsRef as React.RefObject<HTMLElement | null>,
    pot: potRef as React.RefObject<HTMLElement | null>,
    timer: timerRef2 as React.RefObject<HTMLElement | null>,
    serve: serveRef as React.RefObject<HTMLElement | null>,
    score: customerRef as React.RefObject<HTMLElement | null>,
  }

  // ── Cooking timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing') return
    cookingTimerRef.current = setInterval(() => {
      setCookingItems(prev => {
        const next = prev.map(ci => {
          if (ci.ready) return ci
          const ing = getIngredientById(ci.ingredientId)
          if (!ing || ing.cookTime === 0) return { ...ci, progress: 100, ready: true }
          const increment = 100 / (ing.cookTime * 10) // tick every 100ms
          const newProgress = Math.min(100, ci.progress + increment)
          return { ...ci, progress: newProgress, ready: newProgress >= 100 }
        })
        return next
      })
    }, 100)
    return () => { if (cookingTimerRef.current) clearInterval(cookingTimerRef.current) }
  }, [phase])

  // Sync ready cooking items → selectedIngredients
  useEffect(() => {
    setCookingItems(prev => {
      const newlyReady = prev.filter(ci => ci.ready)
      if (newlyReady.length === 0) return prev
      setSelectedIngredients(sel => {
        const next = new Set(sel)
        for (const ci of newlyReady) next.add(ci.ingredientId)
        return next
      })
      return prev.filter(ci => !ci.ready)
    })
  }, [cookingItems])

  // ── Main timer ─────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback((seconds: number) => {
    stopTimer()
    setTimeLeft(seconds)
    setMaxTime(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev <= 1 ? 0 : prev - 1)
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    if (phase === 'playing' && !isTutorialActive && timeLeft === 0 && !isServing) {
      handleServe(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, isTutorialActive])

  useEffect(() => () => stopTimer(), [stopTimer])

  // ── Game flow ──────────────────────────────────────────────────────────────

  const spawnOrder = useCallback((lv: number, idx: number, prev: CustomerOrder | null, currentStock: Stock) => {
    const order = generateOrder(lv, prev, idx)
    // Filter ingredients if out of stock — regenerate picks to only available ones
    const availableIds = NON_SPICE_IDS.filter(id => (currentStock[id] ?? 0) > 0)
    const filteredIngredients = order.ingredients.filter(id => availableIds.includes(id))
    const finalIngredients = filteredIngredients.length >= 1
      ? filteredIngredients
      : shuffle(availableIds).slice(0, Math.max(1, Math.min(2, availableIds.length)))
    return { ...order, ingredients: finalIngredients }
  }, [])

  const beginPlaying = useCallback((resetAll = true, currentStock?: Stock) => {
    const lv = 1
    const stockToUse = currentStock ?? buildInitialStock()
    const order = spawnOrder(lv, 0, null, stockToUse)
    const t = getTimerForLevel(lv, order.customerType)

    if (resetAll) {
      setScore(0)
      setLevel(lv)
      setCustomerIndex(0)
      setDayIndex(1)
      setCombo(0)
      setSatisfaction(100)
      setStock(stockToUse)
      setProcurementBudget(500)
    }

    setCurrentOrder(order)
    setPrevOrder(null)
    setSelectedIngredients(new Set())
    setSelectedSpice('')
    setServeFeedback(null)
    setIsServing(false)
    setCookingItems([])
    setPhase('playing')
    startTimer(t)
  }, [startTimer, spawnOrder])

  const startGame = useCallback(() => {
    const seen = typeof window !== 'undefined' && localStorage.getItem('malatang_tutorial_done')
    if (!seen) {
      const order = generateOrder(1, null, 0)
      setCurrentOrder(order)
      setScore(0)
      setLevel(1)
      setCustomerIndex(0)
      setDayIndex(1)
      setCombo(0)
      setSatisfaction(100)
      setSelectedIngredients(new Set())
      setSelectedSpice('')
      setServeFeedback(null)
      setIsServing(false)
      setCookingItems([])
      setTutorialStep(0)
      setIsTutorialActive(true)
      setTimeLeft(30)
      setMaxTime(30)
      setPhase('playing')
    } else {
      beginPlaying(true)
    }
  }, [beginPlaying])

  const finishTutorial = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('malatang_tutorial_done', '1')
    setIsTutorialActive(false)
    beginPlaying(true)
  }, [beginPlaying])

  const advanceTutorial = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(s => s + 1)
    } else {
      finishTutorial()
    }
  }, [tutorialStep, finishTutorial])

  const goToNextCustomerOrProcurement = useCallback((
    newScore: number,
    newCombo: number,
    newSatisfaction: number,
    nextIdx: number,
    currentStock: Stock,
  ) => {
    const indexInDay = nextIdx % CUSTOMERS_PER_DAY

    // End of day?
    if (indexInDay === 0 && nextIdx > 0) {
      // Procurement phase
      stopTimer()
      const nextDay = Math.floor(nextIdx / CUSTOMERS_PER_DAY) + 1
      setDayIndex(nextDay)
      setProcurementBudget(Math.max(0, newScore)) // budget = current score
      setPhase('procurement')
      return
    }

    // All customers done?
    if (nextIdx >= CUSTOMERS_PER_DAY * 3) { // 3 days max
      stopTimer()
      setPhase('result')
      return
    }

    const newLevel = nextIdx >= 10 ? 3 : nextIdx >= 5 ? 2 : 1
    const order = spawnOrder(newLevel, nextIdx, currentOrder, currentStock)
    const t = getTimerForLevel(newLevel, order.customerType)
    setLevel(newLevel)
    setCurrentOrder(order)
    setPrevOrder(currentOrder)
    setSelectedIngredients(new Set())
    setSelectedSpice('')
    setServeFeedback(null)
    setIsServing(false)
    setCookingItems([])
    startTimer(t)
  }, [stopTimer, startTimer, spawnOrder, currentOrder])

  const handleServe = useCallback((timedOut = false) => {
    if (!currentOrder || isServing) return
    setIsServing(true)
    stopTimer()

    const orderSet = new Set(currentOrder.ingredients)
    const selected = selectedIngredients
    let delta = 0
    let allCorrect = true

    const spiceCorrect = selectedSpice === currentOrder.spiceLevel
    if (!spiceCorrect) { delta -= 20; allCorrect = false }

    const correctItems = Array.from(orderSet).filter(id => selected.has(id))
    const missingItems = Array.from(orderSet).filter(id => !selected.has(id))
    const extraItems = Array.from(selected).filter(id => !orderSet.has(id) && !SPICE_IDS.includes(id))

    delta += correctItems.length * 20
    delta -= missingItems.length * 20
    delta -= extraItems.length * 10

    const isPerfect = missingItems.length === 0 && extraItems.length === 0 && spiceCorrect

    // Allergic penalty
    let allergicPenalty = false
    if (currentOrder.customerType === 'allergic' && currentOrder.forbiddenIngredients.length > 0) {
      const forbidden = currentOrder.forbiddenIngredients
      if (Array.from(selected).some(id => forbidden.includes(id))) {
        delta -= 50
        allergicPenalty = true
        allCorrect = false
      }
    }

    // Combo multiplier
    const newCombo = isPerfect ? combo + 1 : 0
    const multiplier = isPerfect ? Math.min(3, Math.max(1, newCombo)) : 1

    if (isPerfect) {
      const timeBonus = timedOut ? 0 : Math.floor(timeLeft * 2)
      delta += (100 + timeBonus) * multiplier

      // Check secret combo
      const selectedArr = Array.from(selected)
      const secretCombo = checkSecretCombo(selectedArr)
      if (secretCombo) {
        delta += secretCombo.bonus
        setComboOverlay({ name: secretCombo.name, bonus: secretCombo.bonus, emoji: secretCombo.emoji })
      }
    } else {
      allCorrect = false
    }

    // Satisfaction
    const satDelta = isPerfect ? 20 : (allergicPenalty ? -30 : -15)
    const newSatisfaction = Math.max(0, Math.min(100, satisfaction + satDelta))

    // Deduct stock
    const newStock = { ...stock }
    for (const id of Array.from(selected)) {
      if (!SPICE_IDS.includes(id)) {
        newStock[id] = Math.max(0, (newStock[id] ?? 0) - 1)
      }
    }

    const newScore = Math.max(-999, score + delta)
    setScore(newScore)
    setCombo(newCombo)
    setSatisfaction(newSatisfaction)
    setStock(newStock)
    setServeFeedback({ correct: allCorrect, delta })

    const id = coinIdRef.current++
    setCoinAnimations(prev => [...prev, { id, x: 50, y: 50, amount: Math.abs(delta), positive: delta >= 0 }])
    setTimeout(() => setCoinAnimations(prev => prev.filter(c => c.id !== id)), 900)

    const nextIdx = customerIndex + 1
    setCustomerIndex(nextIdx)

    setTimeout(() => {
      // Game over conditions: satisfaction 0 or score deeply negative
      if (newSatisfaction <= 0) { stopTimer(); setPhase('result'); return }
      if (newScore < 0 && nextIdx < CUSTOMERS_PER_DAY * 3) { stopTimer(); setPhase('result'); return }
      goToNextCustomerOrProcurement(newScore, newCombo, newSatisfaction, nextIdx, newStock)
    }, 1400)
  }, [currentOrder, isServing, selectedIngredients, selectedSpice, score, timeLeft, customerIndex, combo, satisfaction, stock, stopTimer, goToNextCustomerOrProcurement])

  const handleProcurementDone = useCallback((newStock: Stock, spent: number) => {
    const newScore = Math.max(0, score - spent)
    setScore(newScore)
    setStock(newStock)
    beginPlaying(false, newStock)
  }, [score, beginPlaying])

  const startCooking = useCallback((ingredientId: string) => {
    const ing = getIngredientById(ingredientId)
    if (!ing || isServing || isTutorialActive) return

    // If instant (spice), handle separately
    if (ing.category === 'spice') return

    // Check stock
    if ((stock[ingredientId] ?? 0) <= 0) return

    // Already selected or already cooking
    if (selectedIngredients.has(ingredientId)) {
      // Deselect
      setSelectedIngredients(prev => {
        const next = new Set(prev)
        next.delete(ingredientId)
        return next
      })
      return
    }
    if (cookingItems.some(ci => ci.ingredientId === ingredientId)) return

    if (ing.cookTime === 0) {
      // Instant
      setSelectedIngredients(prev => {
        const next = new Set(prev)
        next.add(ingredientId)
        return next
      })
      return
    }

    // Start cooking
    const newId = cookingIdRef.current++
    setCookingItems(prev => [...prev, {
      id: `cook-${newId}`,
      ingredientId,
      progress: 0,
      ready: false,
    }])
  }, [isServing, isTutorialActive, cookingItems, selectedIngredients, stock])

  const selectSpice = useCallback((id: string) => {
    if (isServing || isTutorialActive) return
    setSelectedSpice(prev => prev === id ? '' : id)
  }, [isServing, isTutorialActive])

  // ── Rendering helpers ──────────────────────────────────────────────────────

  const nonSpiceIngredients = INGREDIENTS.filter(i => i.category !== 'spice')
  const spiceIngredients = INGREDIENTS.filter(i => i.category === 'spice')
  const categoryLabel: Record<Category, string> = {
    vegetable: '🥦 野菜', protein: '🍖 たんぱく質', noodle: '🍜 麺類', spice: '🌶️ 辛さ',
  }
  const categories: Category[] = ['vegetable', 'protein', 'noodle']

  // ── Title screen ───────────────────────────────────────────────────────────

  if (phase === 'title') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn">
          <div className="text-8xl mb-6 animate-bubble">🍲</div>
          <h1 className="text-5xl font-black text-orange-300 mb-2 drop-shadow-lg">マーラータン屋さん</h1>
          <p className="text-orange-400 text-lg mb-2">麻辣烫 Shop Game</p>
          <p className="text-orange-300/30 text-xs mb-2">v2.0.0</p>
          <p className="text-orange-300/70 text-sm mb-10 max-w-sm mx-auto">
            お客さんの注文通りに食材を選んで、おいしいマーラータンを作ろう！
          </p>
          <button onClick={startGame}
            className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
              text-white font-black text-2xl px-12 py-4 rounded-full shadow-xl
              transition-all duration-150 active:scale-95 hover:scale-105 hover:shadow-orange-500/30 hover:shadow-2xl">
            🍲 はじめる！
          </button>
          <p className="text-orange-300/40 text-xs mt-4">初回プレイ時はチュートリアルがあります</p>
        </div>
      </main>
    )
  }

  // ── Result screen ──────────────────────────────────────────────────────────

  if (phase === 'result') {
    const rank = score >= 1000 ? '🏆 伝説のシェフ' : score >= 600 ? '⭐ 一流シェフ' : score >= 300 ? '👨‍🍳 見習いシェフ' : '😅 もっと練習が必要'
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn max-w-md w-full">
          <div className="text-7xl mb-4">{score >= 300 ? '🎉' : '😢'}</div>
          <h1 className="text-4xl font-black text-orange-300 mb-2">ゲームオーバー</h1>
          <p className="text-orange-400 mb-8">{rank}</p>
          <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-8 mb-4">
            <p className="text-orange-300/70 text-sm mb-2">最終スコア</p>
            <p className="text-6xl font-black text-yellow-400">{score}</p>
            <p className="text-orange-300/50 text-sm mt-1">コイン</p>
          </div>
          <div className="bg-orange-950/60 border border-orange-800/40 rounded-xl px-6 py-3 mb-8 flex justify-around text-sm">
            <div className="text-center">
              <div className="text-orange-300/60">Day</div>
              <div className="text-orange-200 font-bold">{dayIndex}</div>
            </div>
            <div className="text-center">
              <div className="text-orange-300/60">満足度</div>
              <div className="text-orange-200 font-bold">{satisfaction}</div>
            </div>
            <div className="text-center">
              <div className="text-orange-300/60">最大コンボ</div>
              <div className="text-orange-200 font-bold">{combo}連続</div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => beginPlaying(true)}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
                text-white font-bold text-lg px-8 py-3 rounded-full shadow-xl
                transition-all duration-150 active:scale-95 hover:scale-105">
              🔄 もう一度！
            </button>
            <button onClick={() => setPhase('title')}
              className="bg-orange-950 border border-orange-700 hover:bg-orange-900
                text-orange-300 font-bold text-lg px-8 py-3 rounded-full
                transition-all duration-150 active:scale-95">
              🏠 タイトルへ
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Procurement screen ─────────────────────────────────────────────────────

  if (phase === 'procurement') {
    return (
      <ProcurementScreen
        day={dayIndex}
        budget={procurementBudget}
        stock={stock}
        onDone={handleProcurementDone}
      />
    )
  }

  // ── Playing screen (+ tutorial overlay) ───────────────────────────────────

  const order = currentOrder!
  const timerPct = (timeLeft / maxTime) * 100
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'
  const badge = customerTypeBadge(order.customerType)
  const comboMultiplier = Math.min(3, Math.max(1, combo + 1))
  const customerIndexInDay = customerIndex % CUSTOMERS_PER_DAY

  return (
    <>
      {/* Combo flash overlay */}
      {comboOverlay && (
        <ComboFlashOverlay combo={comboOverlay} onDone={() => setComboOverlay(null)} />
      )}

      <main className={`min-h-screen flex flex-col p-3 gap-3 select-none max-w-5xl mx-auto ${isTutorialActive ? 'pointer-events-none' : ''}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-orange-400 text-sm font-bold">Lv.{level}</span>
            <span className="text-orange-300/60 text-sm">Day{dayIndex} {customerIndexInDay + 1}/{CUSTOMERS_PER_DAY}</span>
          </div>
          <div className="flex items-center gap-3">
            {combo >= 2 && (
              <span className="text-orange-200 text-sm font-black bg-orange-700/60 px-2 py-0.5 rounded-lg animate-pulse">
                {combo}連続！🔥 ×{comboMultiplier}
              </span>
            )}
            <span className="text-yellow-400 text-lg font-black">💰 {score}</span>
          </div>
        </div>

        {/* Satisfaction bar */}
        <SatisfactionBar value={satisfaction} />

        {/* Timer bar */}
        <div ref={timerRef2} className="w-full bg-orange-950 rounded-full h-3 overflow-hidden border border-orange-900">
          <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }} />
        </div>
        <div className="text-center text-sm text-orange-300/70 -mt-1">⏰ {timeLeft}秒</div>

        {/* Main game area */}
        <div className="flex gap-3 flex-col md:flex-row flex-1">

          {/* LEFT: Customer order */}
          <div ref={customerRef} className="md:w-52 shrink-0">
            <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4 h-full">
              <h2 className="text-orange-300 font-bold text-sm mb-3 text-center">お客さん</h2>
              <div className="flex flex-col items-center mb-3">
                <div className={`text-5xl mb-1 ${serveFeedback ? (serveFeedback.correct ? 'animate-bubble' : 'animate-shake') : 'animate-bubble'}`}>
                  {order.customerEmoji}
                </div>
                <span className="text-orange-300/70 text-xs">{order.customerName}</span>
                {badge && (
                  <span className={`mt-1 text-xs px-2 py-0.5 rounded-full font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                {order.customerType === 'regular' && (
                  <span className="text-blue-300 text-xs mt-1">前回と同じ！</span>
                )}
              </div>
              <div className="relative bg-white/10 border border-orange-700/40 rounded-xl p-3 animate-fadeIn">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-2 overflow-hidden">
                  <div className="w-4 h-4 bg-white/10 border border-orange-700/40 rotate-45 translate-y-1" />
                </div>
                <p className="text-orange-200/80 text-xs mb-2 font-medium">ご注文：</p>
                <ul className="space-y-1">
                  {order.ingredients.map(id => {
                    const ing = getIngredientById(id)!
                    const isSelected = selectedIngredients.has(id)
                    const isCooking = cookingItems.some(ci => ci.ingredientId === id)
                    return (
                      <li key={id} className={`flex items-center gap-1 text-xs ${isSelected ? 'text-green-400' : isCooking ? 'text-yellow-400' : 'text-orange-200'}`}>
                        <span>{isSelected ? '✅' : isCooking ? '🔥' : '⬜'}</span>
                        <span>{ing.emoji} {ing.name}</span>
                      </li>
                    )
                  })}
                  {(() => {
                    const spice = getIngredientById(order.spiceLevel)!
                    const isSelected = selectedSpice === order.spiceLevel
                    return (
                      <li className={`flex items-center gap-1 text-xs ${isSelected ? 'text-green-400' : 'text-orange-200'}`}>
                        <span>{isSelected ? '✅' : '⬜'}</span>
                        <span>{spice.emoji} {spice.name}</span>
                      </li>
                    )
                  })()}
                </ul>
                {order.customerType === 'allergic' && order.forbiddenIngredients.length > 0 && (
                  <div className="mt-2 border-t border-red-700/40 pt-2">
                    <p className="text-red-400 text-xs font-bold mb-1">アレルギー NG：</p>
                    {order.forbiddenIngredients.map(id => {
                      const ing = getIngredientById(id)!
                      return (
                        <div key={id} className="flex items-center gap-1 text-xs text-red-400">
                          <span>❌</span>
                          <span>{ing.emoji} {ing.name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {serveFeedback && (
                <div className={`mt-3 rounded-xl p-2 text-center text-sm font-bold animate-fadeIn
                  ${serveFeedback.correct ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
                  {serveFeedback.correct ? '🎉 パーフェクト！' : '😅 惜しい！'}
                  <div className="text-xs font-normal mt-0.5">
                    {serveFeedback.delta >= 0 ? '+' : ''}{serveFeedback.delta} コイン
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Ingredient grid + cooking area */}
          <div className="flex-1 flex flex-col gap-3">
            <div ref={ingredientsRef} className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4">
              <h2 className="text-orange-300 font-bold text-sm mb-3">🛒 食材を選ぼう</h2>
              <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat}>
                    <p className="text-orange-400/70 text-xs mb-1 font-medium">{categoryLabel[cat]}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                      {nonSpiceIngredients.filter(i => i.category === cat).map(ing => {
                        const isCooking = cookingItems.some(ci => ci.ingredientId === ing.id)
                        const outOfStock = (stock[ing.id] ?? 0) <= 0 && !selectedIngredients.has(ing.id) && !isCooking
                        const isForbidden = order.customerType === 'allergic' && order.forbiddenIngredients.includes(ing.id)
                        return (
                          <IngredientButton key={ing.id} ingredient={ing}
                            selected={selectedIngredients.has(ing.id)}
                            inOrder={order.ingredients.includes(ing.id)}
                            isCooking={isCooking}
                            isOutOfStock={outOfStock}
                            isForbidden={isForbidden}
                            onClick={() => startCooking(ing.id)} />
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-orange-400/70 text-xs mb-1 font-medium">{categoryLabel['spice']}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {spiceIngredients.map(ing => {
                      const isSelected = selectedSpice === ing.id
                      const inOrder = order.spiceLevel === ing.id
                      return (
                        <button key={ing.id} onClick={() => selectSpice(ing.id)}
                          className={`rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer
                            ${isSelected && inOrder ? 'border-2 border-green-400 bg-green-900/60'
                              : isSelected && !inOrder ? 'border-2 border-red-400 bg-red-900/60'
                              : !isSelected && inOrder ? 'border-2 border-transparent bg-orange-950/60'
                              : 'border-2 border-transparent bg-orange-950/60 hover:bg-orange-900/80'}`}>
                          <span className="text-xl leading-none select-none">{ing.emoji}</span>
                          <span className="text-xs text-orange-100 font-medium">{ing.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Cooking progress section */}
            {cookingItems.length > 0 && (
              <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-3">
                <h2 className="text-orange-300 font-bold text-xs mb-2">🔥 調理中</h2>
                <div className="flex flex-wrap gap-2">
                  {cookingItems.map(ci => {
                    const ing = getIngredientById(ci.ingredientId)
                    if (!ing) return null
                    return (
                      <div key={ci.id} className="flex flex-col items-center bg-yellow-900/40 border border-yellow-600/40 rounded-xl px-3 py-2 min-w-16">
                        <span className="text-xl">{ing.emoji}</span>
                        <span className="text-xs text-yellow-200 mt-0.5">{ing.name}</span>
                        <div className="w-full bg-yellow-950 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-100"
                            style={{ width: `${ci.progress}%` }} />
                        </div>
                        <span className="text-yellow-400/70 text-xs mt-0.5">{Math.round(ci.progress)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Pot */}
          <div ref={potRef} className="md:w-52 shrink-0">
            <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4 h-full flex flex-col">
              <h2 className="text-orange-300 font-bold text-sm mb-3 text-center">🍲 あなたの鍋</h2>
              <div className="relative flex flex-col items-center mb-4">
                <SteamEffect />
                <div className="relative w-36 h-28 pot-glow">
                  <div className="absolute inset-x-2 top-4 bottom-0 bg-gradient-to-b from-red-900 to-red-950 rounded-b-3xl border-2 border-red-700/60 overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-orange-900/80 to-transparent animate-bubble" />
                    {[10, 40, 70].map((left, i) => (
                      <div key={i} className="absolute bottom-1/2 w-2 h-2 rounded-full bg-orange-400/30 animate-bubble"
                        style={{ left: `${left}%`, animationDelay: `${i * 0.3}s` }} />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 top-4 h-3 bg-gradient-to-b from-red-700 to-red-800 rounded-full border border-red-600/40" />
                  <div className="absolute top-5 -left-2 w-4 h-5 border-2 border-red-700 rounded-l-full" />
                  <div className="absolute top-5 -right-2 w-4 h-5 border-2 border-red-700 rounded-r-full" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
                {selectedIngredients.size === 0 && !selectedSpice && (
                  <p className="text-orange-300/40 text-xs text-center py-2">まだ何も入れていません</p>
                )}
                {Array.from(selectedIngredients).map(id => {
                  const ing = getIngredientById(id)!
                  const inOrder = order.ingredients.includes(id)
                  const isForbidden = order.customerType === 'allergic' && order.forbiddenIngredients.includes(id)
                  return (
                    <div key={id} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg
                      ${isForbidden ? 'text-red-300 bg-red-950/60' : inOrder ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
                      <span>{ing.emoji}</span>
                      <span>{ing.name}</span>
                      <span className="ml-auto">{isForbidden ? '❌' : inOrder ? '✓' : '✗'}</span>
                    </div>
                  )
                })}
                {selectedSpice && (() => {
                  const ing = getIngredientById(selectedSpice)!
                  const inOrder = order.spiceLevel === selectedSpice
                  return (
                    <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg
                      ${inOrder ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
                      <span>{ing.emoji}</span>
                      <span>{ing.name}</span>
                      <span className="ml-auto">{inOrder ? '✓' : '✗'}</span>
                    </div>
                  )
                })()}
              </div>
              <button ref={serveRef}
                onClick={() => handleServe(false)}
                disabled={isServing}
                className="mt-3 w-full bg-gradient-to-r from-red-600 to-orange-500
                  hover:from-red-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed
                  text-white font-black text-base py-3 rounded-xl shadow-lg
                  transition-all duration-150 active:scale-95">
                🍲 提供する
              </button>
            </div>
          </div>
        </div>

        {/* Coin animations */}
        {coinAnimations.map(c => (
          <div key={c.id} className="fixed pointer-events-none z-50 font-black text-2xl animate-coinPop"
            style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }}>
            <span className={c.positive ? 'text-yellow-400' : 'text-red-400'}>
              {c.positive ? '+' : '-'}{c.amount}💰
            </span>
          </div>
        ))}
      </main>

      {/* Tutorial overlay */}
      {isTutorialActive && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={advanceTutorial}
          onSkip={finishTutorial}
          targetRefs={targetRefs}
        />
      )}
    </>
  )
}
