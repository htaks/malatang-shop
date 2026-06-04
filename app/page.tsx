'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'vegetable' | 'protein' | 'noodle' | 'spice'
type CustomerType = 'normal' | 'impatient' | 'allergic' | 'regular' | 'hungry'
type GamePhase = 'title' | 'playing' | 'procurement' | 'result' | 'leaderboard' | 'p2playing' | 'p2result'
type ShopStage = 1 | 2 | 3 | 4

interface Ingredient {
  id: string
  name: string
  emoji: string
  category: Category
  cookTime: number
  price: number
  unlockStage?: ShopStage
}

interface CustomerOrder {
  ingredients: string[]
  spiceLevel: string
  customerEmoji: string
  customerName: string
  customerType: CustomerType
  forbiddenIngredients: string[]
}

interface QueuedCustomer {
  id: number
  order: CustomerOrder
  angerStart: number
  angerDuration: number
  left: boolean
  reactionEmoji: string | null
}

interface CookingItem {
  id: string
  ingredientId: string
  progress: number
  ready: boolean
  potIndex: number
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

interface ConveyorItem {
  id: number
  ingredientId: string
  duration: number
  startTime: number
}

interface LeaderboardEntry {
  name: string
  score: number
  stage: string
  date: string
}

interface TutorialStep {
  target: 'customer' | 'ingredients' | 'pot' | 'timer' | 'serve' | 'score'
  title: string
  body: string
  emoji: string
  position: 'right' | 'left' | 'bottom' | 'top'
}

// ─── Tutorial steps ───────────────────────────────────────────────────────────

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: 'customer',
    title: 'お客さんの注文',
    body: '3〜5人が並んで待っています。\n怒りゲージが満タンになると帰ってしまいます！\nキューの先頭のお客さんに料理を提供しよう。',
    emoji: '👩',
    position: 'right',
  },
  {
    target: 'ingredients',
    title: 'コンベアから食材を取ろう',
    body: '食材がベルトコンベアで流れてきます！\nクリックして取り逃す前につかもう。\n鍋を選んでから食材を取ると、その鍋に入ります。\n\n秘密のレシピコンボも存在します 🎉',
    emoji: '🛒',
    position: 'bottom',
  },
  {
    target: 'pot',
    title: '複数の鍋',
    body: 'ステージ2から鍋が2つ、ステージ4から3つに！\n鍋をクリックして選択してから食材を入れよう。\n✓ 緑 = 正解の食材\n✗ 赤 = 余分な食材',
    emoji: '🍲',
    position: 'left',
  },
  {
    target: 'timer',
    title: '制限時間',
    body: '時間内に提供しないと\n自動的に送られます！\n速く出すとタイムボーナス獲得！\n店のステージが上がると難しくなります！',
    emoji: '⏰',
    position: 'bottom',
  },
  {
    target: 'serve',
    title: '提供する',
    body: '食材を選び終えたら\n「提供する」ボタンを押そう！\nピッタリ正解で +100コイン！\n📖 レシピ本でコンボを確認できます！',
    emoji: '🎯',
    position: 'left',
  },
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const INGREDIENTS: Ingredient[] = [
  { id: 'hakusai',   name: '白菜',         emoji: '🥬', category: 'vegetable', cookTime: 3,  price: 5  },
  { id: 'moyashi',   name: 'もやし',       emoji: '🌱', category: 'vegetable', cookTime: 3,  price: 5  },
  { id: 'kinoko',    name: 'きのこ',       emoji: '🍄', category: 'vegetable', cookTime: 4,  price: 7  },
  { id: 'jagaimo',   name: 'じゃがいも',   emoji: '🥔', category: 'vegetable', cookTime: 4,  price: 6  },
  { id: 'tofu',      name: 'とうふ',       emoji: '🧊', category: 'vegetable', cookTime: 3,  price: 5  },
  { id: 'horenso',   name: 'ほうれん草',   emoji: '🌿', category: 'vegetable', cookTime: 3,  price: 6  },
  { id: 'negi',      name: 'ネギ',         emoji: '🧅', category: 'vegetable', cookTime: 3,  price: 5  },
  { id: 'ebi',       name: 'えび',         emoji: '🦐', category: 'protein',   cookTime: 6,  price: 15 },
  { id: 'tsumire',   name: 'つみれ',       emoji: '🐟', category: 'protein',   cookTime: 5,  price: 10 },
  { id: 'gyoza',     name: 'ぎょうざ',     emoji: '🥟', category: 'protein',   cookTime: 7,  price: 12 },
  { id: 'chikuwa',   name: 'ちくわ',       emoji: '🍢', category: 'protein',   cookTime: 5,  price: 8  },
  { id: 'uzura',     name: 'うずらたまご', emoji: '🥚', category: 'protein',   cookTime: 5,  price: 8  },
  { id: 'lamb',      name: 'ラム肉',       emoji: '🥩', category: 'protein',   cookTime: 7,  price: 18 },
  { id: 'bifun',     name: 'ビーフン',     emoji: '🍜', category: 'noodle',    cookTime: 4,  price: 7  },
  { id: 'udon',      name: 'うどん',       emoji: '🍝', category: 'noodle',    cookTime: 5,  price: 8  },
  { id: 'shirataki', name: 'しらたき',     emoji: '🌀', category: 'noodle',    cookTime: 4,  price: 6  },
  // Rare ingredients — unlock at stage 3+
  { id: 'truffle',   name: 'トリュフ',     emoji: '🍫', category: 'vegetable', cookTime: 3,  price: 50, unlockStage: 3 },
  { id: 'foiegras',  name: 'フォアグラ',   emoji: '🦆', category: 'protein',   cookTime: 6,  price: 40, unlockStage: 3 },
  { id: 'jinhuaham', name: '金華ハム',     emoji: '🥓', category: 'protein',   cookTime: 5,  price: 35, unlockStage: 4 },
  // Spice
  { id: 'spice1',    name: '普通',         emoji: '🌶️',     category: 'spice', cookTime: 0,  price: 0  },
  { id: 'spice2',    name: '辛め',         emoji: '🌶️🌶️',   category: 'spice', cookTime: 0,  price: 0  },
  { id: 'spice3',    name: '激辛',         emoji: '🌶️🌶️🌶️', category: 'spice', cookTime: 0,  price: 0  },
]

const SPICE_IDS = ['spice1', 'spice2', 'spice3']
const NON_SPICE = INGREDIENTS.filter(i => i.category !== 'spice')
const NON_SPICE_IDS = NON_SPICE.map(i => i.id)

const STAGE_INFO: Record<ShopStage, { name: string; minCoins: number; pots: number }> = {
  1: { name: '屋台',         minCoins: 0,    pots: 1 },
  2: { name: '小さい店',     minCoins: 300,  pots: 2 },
  3: { name: '有名店',       minCoins: 800,  pots: 2 },
  4: { name: '全国チェーン', minCoins: 1500, pots: 3 },
}

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
const MAX_DAYS = 3

// ─── Secret Combos ────────────────────────────────────────────────────────────

interface SecretCombo {
  ids: string[]
  name: string
  bonus: number
  emoji: string
}

const SECRET_COMBOS: SecretCombo[] = [
  { ids: ['ebi', 'horenso', 'shirataki'],  name: '海鮮スペシャル', bonus: 200, emoji: '🦐' },
  { ids: ['lamb', 'negi', 'jagaimo'],      name: 'モンゴル風',     bonus: 150, emoji: '🥩' },
  { ids: ['gyoza', 'chikuwa', 'uzura'],    name: 'おでん風',       bonus: 180, emoji: '🥟' },
  { ids: ['hakusai', 'moyashi', 'kinoko'], name: 'ベジスペシャル', bonus: 120, emoji: '🥬' },
  { ids: ['ebi', 'gyoza', 'udon'],         name: '海老うどん',     bonus: 160, emoji: '🍝' },
]

function checkSecretCombo(selectedIds: string[]): SecretCombo | null {
  for (const combo of SECRET_COMBOS) {
    if (combo.ids.every(id => selectedIds.includes(id))) return combo
  }
  return null
}

// ─── Web Audio SFX ───────────────────────────────────────────────────────────

function playSound(type: 'coin' | 'error' | 'combo' | 'sizzle') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.3
    master.connect(ctx.destination)

    if (type === 'coin') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(master)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(); osc.stop(ctx.currentTime + 0.25)
    } else if (type === 'error') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.connect(gain); gain.connect(master)
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.4, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    } else if (type === 'combo') {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(master)
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.08
        gain.gain.setValueAtTime(0.4, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
        osc.start(t); osc.stop(t + 0.18)
      })
    } else if (type === 'sizzle') {
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const source = ctx.createBufferSource()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'; filter.frequency.value = 3000
      source.buffer = buffer
      source.connect(filter); filter.connect(gain); gain.connect(master)
      gain.gain.setValueAtTime(0.6, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      source.start(); source.stop(ctx.currentTime + 0.15)
    }
  } catch {
    // silently ignore if audio context not available
  }
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

function getUnlockedIngredients(stage: ShopStage): Ingredient[] {
  return NON_SPICE.filter(i => !i.unlockStage || i.unlockStage <= stage)
}

function generateOrder(level: number, prevOrder: CustomerOrder | null, customerIndex: number, stage: ShopStage): CustomerOrder {
  const type = pickCustomerType(customerIndex)
  const unlockedIds = getUnlockedIngredients(stage).map(i => i.id)

  let minIngredients: number
  let maxIngredients: number

  if (type === 'hungry') {
    minIngredients = 6; maxIngredients = 7
  } else {
    minIngredients = level >= 3 ? 4 : level === 2 ? 3 : 2
    maxIngredients = level >= 3 ? 5 : level === 2 ? 4 : 3
  }

  const count = minIngredients + Math.floor(Math.random() * (maxIngredients - minIngredients + 1))
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]
  let ingredients: string[]
  let spiceLevel: string

  if (type === 'regular' && prevOrder) {
    ingredients = [...prevOrder.ingredients]
    spiceLevel = prevOrder.spiceLevel
  } else {
    ingredients = shuffle(unlockedIds).slice(0, count)
    spiceLevel = SPICE_IDS[Math.floor(Math.random() * SPICE_IDS.length)]
  }

  let forbiddenIngredients: string[] = []
  if (type === 'allergic') {
    const available = unlockedIds.filter(id => !ingredients.includes(id))
    forbiddenIngredients = shuffle(available).slice(0, 1 + Math.floor(Math.random() * 2))
  }

  return { ingredients, spiceLevel, customerEmoji: customer.emoji, customerName: customer.name, customerType: type, forbiddenIngredients }
}

function getTimerForLevel(level: number, type: CustomerType): number {
  const base = level >= 3 ? 20 : level === 2 ? 25 : 30
  return type === 'impatient' ? Math.floor(base / 2) : base
}

function getAngerDuration(type: CustomerType, stage: ShopStage): number {
  const base = type === 'impatient' ? 15 : 25
  return Math.max(10, base - (stage - 1) * 2)
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

function getStageFromScore(score: number): ShopStage {
  if (score >= STAGE_INFO[4].minCoins) return 4
  if (score >= STAGE_INFO[3].minCoins) return 3
  if (score >= STAGE_INFO[2].minCoins) return 2
  return 1
}

function buildInitialStock(): Stock {
  const stock: Stock = {}
  for (const ing of NON_SPICE) {
    stock[ing.id] = 4
  }
  return stock
}

function getRank(score: number): string {
  if (score >= 1500) return '🏆 全国チェーンオーナー'
  if (score >= 1000) return '⭐ 有名シェフ'
  if (score >= 600)  return '👨‍🍳 一流シェフ'
  if (score >= 300)  return '🍳 見習いシェフ'
  return '😅 もっと練習が必要'
}

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('malatang_leaderboard_v3')
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch { return [] }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return
  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10)
  localStorage.setItem('malatang_leaderboard_v3', JSON.stringify(sorted))
}

function qualifiesForLeaderboard(score: number): boolean {
  const board = loadLeaderboard()
  if (board.length < 10) return score > 0
  return score > board[board.length - 1].score
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

// Recipe Book Modal
function RecipeBookModal({ discovered, onClose }: { discovered: Set<string>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-gradient-to-b from-orange-900 to-orange-950 border-2 border-orange-600 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-fadeIn"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-orange-200 font-black text-lg">📖 秘密のレシピ本</h2>
          <button onClick={onClose} className="text-orange-400 hover:text-orange-200 text-xl font-bold">✕</button>
        </div>
        <div className="space-y-3">
          {SECRET_COMBOS.map((combo, i) => {
            const isDiscovered = discovered.has(combo.name)
            return (
              <div key={i} className={`rounded-xl p-3 border ${isDiscovered ? 'border-yellow-500/60 bg-yellow-900/30' : 'border-orange-800/40 bg-orange-950/60'}`}>
                {isDiscovered ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{combo.emoji}</span>
                      <span className="text-orange-200 font-bold text-sm">{combo.name}</span>
                      <span className="ml-auto text-yellow-400 text-sm font-bold">+{combo.bonus}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {combo.ids.map(id => {
                        const ing = getIngredientById(id)
                        return ing ? (
                          <span key={id} className="text-xs bg-orange-800/60 text-orange-200 px-2 py-0.5 rounded-full">
                            {ing.emoji} {ing.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">❓</span>
                    <span className="text-orange-500/60 text-sm">未発見のレシピ #{i + 1}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-orange-400/50 text-xs text-center mt-4">
          {discovered.size}/{SECRET_COMBOS.length} 発見済み
        </p>
      </div>
    </div>
  )
}

// Tutorial Overlay
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
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!ref?.current) return
    const rect = ref.current.getBoundingClientRect()
    const pad = 8

    setHighlightStyle({
      position: 'fixed', top: rect.top - pad, left: rect.left - pad,
      width: rect.width + pad * 2, height: rect.height + pad * 2,
      borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
      border: '2px solid rgba(251,146,60,0.8)', zIndex: 40,
      pointerEvents: 'none', transition: 'all 0.3s ease',
    })

    const tooltipW = 260, tooltipH = 240
    let top = 0, left = 0

    if (current.position === 'right') { top = rect.top + rect.height / 2 - tooltipH / 2; left = rect.right + pad + 12 }
    else if (current.position === 'left') { top = rect.top + rect.height / 2 - tooltipH / 2; left = rect.left - tooltipW - pad - 12 }
    else if (current.position === 'bottom') { top = rect.bottom + pad + 12; left = rect.left + rect.width / 2 - tooltipW / 2 }
    else { top = rect.top - tooltipH - pad - 12; left = rect.left + rect.width / 2 - tooltipW / 2 }

    top = Math.max(8, Math.min(top, window.innerHeight - tooltipH - 8))
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))
    setTooltipStyle({ position: 'fixed', top, left, width: tooltipW, zIndex: 50 })
    setArrowStyle({ position: 'fixed', top: rect.top + rect.height / 2, left: rect.left + rect.width / 2, zIndex: 49, pointerEvents: 'none' })
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
          <p className="text-orange-100/80 text-xs leading-relaxed whitespace-pre-line mb-4">{current.body}</p>
          <div className="flex gap-1 justify-center mb-3">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'bg-orange-400 w-3' : i < step ? 'bg-orange-600 w-1.5' : 'bg-orange-800 w-1.5'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onSkip} className="flex-1 text-orange-400/60 text-xs py-1.5 rounded-lg border border-orange-800/40 hover:border-orange-700 transition-all">スキップ</button>
            <button onClick={onNext} className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold text-xs py-1.5 rounded-lg transition-all active:scale-95">
              {isLast ? '🎮 ゲームスタート！' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ ...arrowStyle, transform: 'translate(-50%, -50%)', width: 40, height: 40 }}>
        <div className="w-full h-full rounded-full border-2 border-orange-400/60 animate-ping" />
      </div>
    </>
  )
}

// Procurement Screen
interface ProcurementScreenProps {
  day: number
  budget: number
  stock: Stock
  stage: ShopStage
  onDone: (newStock: Stock, spent: number) => void
}

function ProcurementScreen({ day, budget, stock, stage, onDone }: ProcurementScreenProps) {
  const [cart, setCart] = useState<Stock>({})
  const shopItems = getUnlockedIngredients(stage)

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const ing = getIngredientById(id)
    return sum + (ing ? ing.price * qty : 0)
  }, 0)

  const remaining = budget - cartTotal

  function addItem(id: string) {
    const ing = getIngredientById(id)
    if (!ing || cartTotal + ing.price > budget) return
    setCart(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  function removeItem(id: string) {
    setCart(prev => {
      const next = { ...prev }
      if (!next[id] || next[id] <= 0) return next
      next[id]--
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
          <p className="text-orange-400/70 text-sm mt-1">
            残り予算: <span className="text-yellow-400 font-bold">{remaining} コイン</span>
          </p>
          {stage >= 3 && <p className="text-yellow-400/80 text-xs mt-1">✨ レアな食材が仕入れ可能！</p>}
        </div>

        <div className="space-y-2 mb-6">
          {shopItems.map(ing => {
            const currentStock = (stock[ing.id] ?? 0) + (cart[ing.id] ?? 0)
            const cartQty = cart[ing.id] ?? 0
            const isRare = !!ing.unlockStage
            return (
              <div key={ing.id}
                className={`border rounded-xl px-4 py-2 flex items-center gap-3 ${isRare ? 'bg-yellow-950/60 border-yellow-700/60' : 'bg-orange-950/60 border-orange-800/40'}`}>
                <span className="text-2xl">{ing.emoji}</span>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${isRare ? 'text-yellow-200' : 'text-orange-200'}`}>{ing.name}</span>
                  {isRare && <span className="text-yellow-500 text-xs ml-1">★レア</span>}
                  <span className="text-orange-400/60 text-xs ml-2">{ing.price}コイン/個</span>
                  <span className="text-orange-400/60 text-xs ml-2">在庫: {currentStock}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeItem(ing.id)} disabled={cartQty === 0}
                    className="w-7 h-7 rounded-full bg-orange-800 hover:bg-orange-700 disabled:opacity-30 text-white font-bold transition-all text-sm">−</button>
                  <span className="w-4 text-center text-orange-200 text-sm">{cartQty}</span>
                  <button onClick={() => addItem(ing.id)} disabled={remaining < ing.price}
                    className="w-7 h-7 rounded-full bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-bold transition-all text-sm">＋</button>
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

// Leaderboard Screen
function LeaderboardScreen({ onBack, currentScore, isPostGame, onNameSubmit }: {
  onBack: () => void
  currentScore?: number
  isPostGame?: boolean
  onNameSubmit?: (name: string) => void
}) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [nameInput, setNameInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setBoard(loadLeaderboard())
  }, [])

  const showNameEntry = isPostGame && currentScore !== undefined && qualifiesForLeaderboard(currentScore) && !submitted

  function handleSubmit() {
    if (!nameInput.trim() || currentScore === undefined) return
    const entry: LeaderboardEntry = {
      name: nameInput.trim().slice(0, 12),
      score: currentScore,
      stage: STAGE_INFO[getStageFromScore(currentScore)].name,
      date: new Date().toLocaleDateString('ja-JP'),
    }
    const newBoard = [...board, entry].sort((a, b) => b.score - a.score).slice(0, 10)
    saveLeaderboard(newBoard)
    setBoard(newBoard)
    setSubmitted(true)
    if (onNameSubmit) onNameSubmit(nameInput.trim())
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 select-none">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-3xl font-black text-orange-300">ランキング</h1>
        </div>

        {showNameEntry && (
          <div className="bg-yellow-950/60 border border-yellow-600/40 rounded-2xl p-4 mb-6 animate-slideUp">
            <p className="text-yellow-300 font-bold text-sm mb-2">🎉 ランクイン！名前を入力してください</p>
            <div className="flex gap-2">
              <input
                type="text" maxLength={12}
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="プレイヤー名"
                className="flex-1 bg-orange-950 border border-orange-700 rounded-xl px-3 py-2 text-orange-200 text-sm outline-none focus:border-orange-500"
              />
              <button onClick={handleSubmit}
                className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white font-bold px-4 py-2 rounded-xl text-sm active:scale-95">
                登録
              </button>
            </div>
          </div>
        )}

        <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl overflow-hidden mb-6">
          {board.length === 0 ? (
            <div className="p-8 text-center text-orange-400/50 text-sm">まだ記録がありません</div>
          ) : (
            board.map((entry, i) => {
              const isCurrentGame = isPostGame && currentScore !== undefined && entry.score === currentScore && submitted
              return (
                <div key={i}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-orange-800/30 last:border-b-0 ${isCurrentGame ? 'bg-yellow-900/30' : ''}`}>
                  <span className="text-lg font-black w-6 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <div className="flex-1">
                    <div className="text-orange-200 font-bold text-sm">{entry.name}</div>
                    <div className="text-orange-400/60 text-xs">{entry.stage} · {entry.date}</div>
                  </div>
                  <span className="text-yellow-400 font-black">{entry.score.toLocaleString()}</span>
                </div>
              )
            })
          )}
        </div>

        <button onClick={onBack}
          className="w-full bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-bold py-3 rounded-xl transition-all active:scale-95">
          ← 戻る
        </button>
      </div>
    </main>
  )
}

// ─── Conveyor Belt ────────────────────────────────────────────────────────────

interface ConveyorBeltProps {
  items: ConveyorItem[]
  onGrab: (item: ConveyorItem) => void
  stage: ShopStage
}

function ConveyorBelt({ items, onGrab, stage }: ConveyorBeltProps) {
  return (
    <div className="relative bg-orange-950/80 border border-orange-800/40 rounded-2xl overflow-hidden h-24 select-none">
      <div className="absolute inset-0 flex items-center">
        {/* Belt tracks */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gradient-to-b from-orange-900/60 to-orange-950/80 border-y border-orange-700/40" />
        {/* Rollers */}
        {[0, 25, 50, 75, 100].map(pct => (
          <div key={pct} className="absolute w-4 h-12 bg-orange-800/50 rounded-full border border-orange-700/40"
            style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)' }} />
        ))}
      </div>

      {/* Belt label */}
      <div className="absolute top-1 left-2 text-orange-400/60 text-xs font-bold">
        ▶ コンベア {stage >= 2 ? '⚡ 速い' : ''}
      </div>

      {/* Items on belt */}
      {items.map(item => {
        const ing = getIngredientById(item.ingredientId)
        if (!ing) return null
        const isRare = !!ing.unlockStage
        return (
          <button
            key={item.id}
            onClick={() => onGrab(item)}
            className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10
              hover:scale-125 active:scale-90 transition-transform
              ${isRare ? 'animate-bubble' : ''}`}
            style={{
              animation: `conveyorMove ${item.duration}s linear forwards`,
              animationDelay: '0s',
            }}
          >
            <div className={`rounded-xl p-1.5 border-2 shadow-lg ${isRare ? 'border-yellow-400 bg-yellow-900/80' : 'border-orange-600/60 bg-orange-900/80'}`}>
              <span className="text-2xl leading-none block">{ing.emoji}</span>
            </div>
            <span className="text-xs text-orange-200 font-medium whitespace-nowrap mt-0.5 drop-shadow">{ing.name}</span>
          </button>
        )
      })}

      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-orange-400/40 text-xs">
          食材待ち...
        </div>
      )}
    </div>
  )
}

// Customer Queue
interface CustomerQueueProps {
  queue: QueuedCustomer[]
  activeCustomerId: number | null
  now: number
  onSelectCustomer: (id: number) => void
}

function CustomerQueue({ queue, activeCustomerId, now, onSelectCustomer }: CustomerQueueProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {queue.map((qc, i) => {
        const order = qc.order
        const badge = customerTypeBadge(order.customerType)
        const elapsed = qc.left ? qc.angerDuration : Math.min(qc.angerDuration, (now - qc.angerStart) / 1000)
        const angerPct = Math.min(100, (elapsed / qc.angerDuration) * 100)
        const isActive = qc.id === activeCustomerId
        const angerColor = angerPct > 66 ? 'bg-red-500' : angerPct > 33 ? 'bg-yellow-500' : 'bg-green-500'

        return (
          <button
            key={qc.id}
            onClick={() => !qc.left && i === 0 && onSelectCustomer(qc.id)}
            className={`flex-shrink-0 rounded-2xl p-3 border-2 transition-all text-left min-w-36
              ${qc.left ? 'opacity-40 border-orange-800/20 bg-orange-950/20' :
                isActive ? 'border-orange-400 bg-orange-900/80 shadow-lg shadow-orange-500/20' :
                i === 0 ? 'border-orange-700/60 bg-orange-950/60 hover:border-orange-500' :
                'border-orange-800/30 bg-orange-950/40 opacity-70'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl ${qc.reactionEmoji ? 'animate-customerReact' : ''}`}>
                {qc.reactionEmoji || order.customerEmoji}
              </span>
              <div>
                <div className="text-orange-200 text-xs font-bold">{order.customerName}</div>
                {badge && <span className={`text-xs px-1 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>}
              </div>
            </div>
            {/* Anger bar */}
            <div className="w-full bg-orange-950 rounded-full h-1.5 overflow-hidden border border-orange-800/40">
              <div className={`h-full rounded-full transition-none ${angerColor}`}
                style={{ width: `${angerPct}%` }} />
            </div>
            {qc.left && <div className="text-red-400 text-xs mt-1 font-bold">帰った 😤</div>}
            {isActive && !qc.left && <div className="text-orange-300 text-xs mt-1 font-bold">→ 対応中</div>}
          </button>
        )
      })}
    </div>
  )
}

// Pot Component
interface PotProps {
  potIndex: number
  isSelected: boolean
  selectedIngredients: Set<string>
  cookingItems: CookingItem[]
  currentOrder: CustomerOrder | null
  onSelect: (idx: number) => void
  onServe: (idx: number) => void
  isServing: boolean
}

function PotDisplay({ potIndex, isSelected, selectedIngredients, cookingItems, currentOrder, onSelect, onServe, isServing }: PotProps) {
  const potItems = Array.from(selectedIngredients).filter((_, __) => true) // all selected for this pot
  // Actually we need to track per-pot; we'll use a flat approach per pot
  const order = currentOrder

  return (
    <div
      onClick={() => onSelect(potIndex)}
      className={`bg-orange-950/60 border-2 rounded-2xl p-3 cursor-pointer transition-all flex flex-col
        ${isSelected ? 'border-orange-400 shadow-lg shadow-orange-500/30' : 'border-orange-800/40 hover:border-orange-600/60'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-orange-300 font-bold text-xs">鍋 {potIndex + 1} {isSelected ? '◀ 選択中' : ''}</h3>
        {isSelected && <span className="text-xs text-orange-400/60">クリックして選択</span>}
      </div>

      <div className="relative flex justify-center mb-2">
        <SteamEffect />
        <div className="relative w-24 h-20 pot-glow">
          <div className="absolute inset-x-2 top-3 bottom-0 bg-gradient-to-b from-red-900 to-red-950 rounded-b-3xl border-2 border-red-700/60 overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-orange-900/80 to-transparent animate-bubble" />
          </div>
          <div className="absolute inset-x-0 top-3 h-2.5 bg-gradient-to-b from-red-700 to-red-800 rounded-full border border-red-600/40" />
          <div className="absolute top-4 -left-1.5 w-3 h-4 border-2 border-red-700 rounded-l-full" />
          <div className="absolute top-4 -right-1.5 w-3 h-4 border-2 border-red-700 rounded-r-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 max-h-28 min-h-0">
        {potItems.length === 0 && <p className="text-orange-300/40 text-xs text-center py-1">空の鍋</p>}
        {potItems.map(id => {
          const ing = getIngredientById(id)!
          const inOrder = order ? order.ingredients.includes(id) : false
          const isForbidden = order?.customerType === 'allergic' && (order?.forbiddenIngredients ?? []).includes(id)
          return (
            <div key={id} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg
              ${isForbidden ? 'text-red-300 bg-red-950/60' : inOrder ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
              <span>{ing.emoji}</span>
              <span className="truncate">{ing.name}</span>
              <span className="ml-auto">{isForbidden ? '❌' : inOrder ? '✓' : '✗'}</span>
            </div>
          )
        })}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onServe(potIndex) }}
        disabled={isServing}
        className="mt-2 w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
          disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs py-2 rounded-xl
          transition-all active:scale-95">
        🍲 提供
      </button>
    </div>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function MalatangGame() {
  const [phase, setPhase] = useState<GamePhase>('title')
  const [tutorialStep, setTutorialStep] = useState(0)
  const [isTutorialActive, setIsTutorialActive] = useState(false)

  // Scores
  const [score, setScore] = useState(0)
  const [p1Score, setP1Score] = useState(0)
  const [isP2Mode, setIsP2Mode] = useState(false)

  const [level, setLevel] = useState(1)
  const [shopStage, setShopStage] = useState<ShopStage>(1)
  const [customerIndex, setCustomerIndex] = useState(0)
  const [dayIndex, setDayIndex] = useState(1)
  const [combo, setCombo] = useState(0)
  const [satisfaction, setSatisfaction] = useState(100)

  // Customer queue
  const [customerQueue, setCustomerQueue] = useState<QueuedCustomer[]>([])
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null)
  const [prevOrder, setPrevOrder] = useState<CustomerOrder | null>(null)
  const queueIdRef = useRef(0)
  const [now, setNow] = useState(Date.now())

  // Multi-pot system: selected per-pot
  const [numPots, setNumPots] = useState(1)
  const [selectedPot, setSelectedPot] = useState(0)
  const [potIngredients, setPotIngredients] = useState<string[][]>([[]])
  const [potSpices, setPotSpices] = useState<string[]>([''])

  // Timer
  const [timeLeft, setTimeLeft] = useState(30)
  const [maxTime, setMaxTime] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cooking items
  const [cookingItems, setCookingItems] = useState<CookingItem[]>([])
  const cookingIdRef = useRef(0)
  const cookingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Conveyor belt
  const [conveyorItems, setConveyorItems] = useState<ConveyorItem[]>([])
  const conveyorIdRef = useRef(0)
  const conveyorSpawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Rival
  const [rivalScore, setRivalScore] = useState(0)
  const rivalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Misc
  const [stock, setStock] = useState<Stock>(buildInitialStock())
  const [procurementBudget, setProcurementBudget] = useState(500)
  const [coinAnimations, setCoinAnimations] = useState<CoinAnimation[]>([])
  const coinIdRef = useRef(0)
  const [serveFeedback, setServeFeedback] = useState<null | { correct: boolean; delta: number; potIndex: number }>( null)
  const [isServing, setIsServing] = useState(false)
  const [comboOverlay, setComboOverlay] = useState<ComboOverlay | null>(null)
  const [discoveredCombos, setDiscoveredCombos] = useState<Set<string>>(new Set())
  const [showRecipeBook, setShowRecipeBook] = useState(false)
  const [dropAnimations, setDropAnimations] = useState<{ id: number; emoji: string }[]>([])
  const dropIdRef = useRef(0)

  // Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [postGameScore, setPostGameScore] = useState<number | undefined>(undefined)

  // Tutorial refs
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

  // ── Now ticker for anger meters ──────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    const interval = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(interval)
  }, [phase])

  // ── Anger overflow ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    const n = Date.now()
    setCustomerQueue(prev => prev.map(qc => {
      if (qc.left) return qc
      const elapsed = (n - qc.angerStart) / 1000
      if (elapsed >= qc.angerDuration) {
        setSatisfaction(s => Math.max(0, s - 15))
        return { ...qc, left: true, reactionEmoji: '😤' }
      }
      return qc
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now])

  // ── Rival score ticker ────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') {
      if (rivalRef.current) { clearInterval(rivalRef.current); rivalRef.current = null }
      return
    }
    rivalRef.current = setInterval(() => {
      setRivalScore(prev => prev + Math.floor(Math.random() * 15) + 5)
    }, 4000)
    return () => { if (rivalRef.current) clearInterval(rivalRef.current) }
  }, [phase])

  // ── Cooking timer ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    cookingTimerRef.current = setInterval(() => {
      setCookingItems(prev => prev.map(ci => {
        if (ci.ready) return ci
        const ing = getIngredientById(ci.ingredientId)
        if (!ing || ing.cookTime === 0) return { ...ci, progress: 100, ready: true }
        const increment = 100 / (ing.cookTime * 10)
        const newProgress = Math.min(100, ci.progress + increment)
        return { ...ci, progress: newProgress, ready: newProgress >= 100 }
      }))
    }, 100)
    return () => { if (cookingTimerRef.current) clearInterval(cookingTimerRef.current) }
  }, [phase])

  // Move ready items into pot
  useEffect(() => {
    setCookingItems(prev => {
      const newlyReady = prev.filter(ci => ci.ready)
      if (newlyReady.length === 0) return prev
      for (const ci of newlyReady) {
        const ing = getIngredientById(ci.ingredientId)
        if (ing) {
          playSound('sizzle')
          const dropId = dropIdRef.current++
          setDropAnimations(d => [...d, { id: dropId, emoji: ing.emoji }])
          setTimeout(() => setDropAnimations(d => d.filter(x => x.id !== dropId)), 700)
        }
        setPotIngredients(pots => {
          const next = pots.map(p => [...p])
          const pIdx = Math.min(ci.potIndex, next.length - 1)
          if (!next[pIdx].includes(ci.ingredientId)) {
            next[pIdx] = [...next[pIdx], ci.ingredientId]
          }
          return next
        })
      }
      return prev.filter(ci => !ci.ready)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookingItems])

  // ── Conveyor belt spawner ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') {
      if (conveyorSpawnRef.current) clearInterval(conveyorSpawnRef.current)
      return
    }
    const spawnInterval = shopStage >= 3 ? 1400 : shopStage >= 2 ? 1800 : 2200
    const beltDuration = shopStage >= 3 ? 4 : shopStage >= 2 ? 5 : 6

    conveyorSpawnRef.current = setInterval(() => {
      const unlocked = getUnlockedIngredients(shopStage)
      const ing = unlocked[Math.floor(Math.random() * unlocked.length)]
      if (!ing) return
      const id = conveyorIdRef.current++
      setConveyorItems(prev => {
        // Keep max 5 items on belt
        const filtered = prev.filter(item => {
          const age = (Date.now() - item.startTime) / 1000
          return age < item.duration
        })
        return [...filtered, { id, ingredientId: ing.id, duration: beltDuration, startTime: Date.now() }]
      })
    }, spawnInterval)

    return () => { if (conveyorSpawnRef.current) clearInterval(conveyorSpawnRef.current) }
  }, [phase, shopStage])

  // Purge expired conveyor items
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    const interval = setInterval(() => {
      setConveyorItems(prev => prev.filter(item => {
        const age = (Date.now() - item.startTime) / 1000
        return age < item.duration
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  // ── Main timer ────────────────────────────────────────────────────────────────

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
    if ((phase === 'playing' || phase === 'p2playing') && !isTutorialActive && timeLeft === 0 && !isServing) {
      handleServe(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, isTutorialActive])

  useEffect(() => () => stopTimer(), [stopTimer])

  // ── Stage update ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const newStage = getStageFromScore(score)
    if (newStage !== shopStage) {
      setShopStage(newStage)
      const newPots = STAGE_INFO[newStage].pots
      setNumPots(newPots)
      setPotIngredients(prev => {
        const next = [...prev]
        while (next.length < newPots) next.push([])
        return next.slice(0, newPots)
      })
      setPotSpices(prev => {
        const next = [...prev]
        while (next.length < newPots) next.push('')
        return next.slice(0, newPots)
      })
    }
  }, [score, shopStage])

  // ── Queue management ──────────────────────────────────────────────────────────

  const spawnCustomersForQueue = useCallback((lv: number, stage: ShopStage, prevOrd: CustomerOrder | null, currentStock: Stock, startIdx: number) => {
    const numToSpawn = Math.min(3 + Math.floor(Math.random() * 2), CUSTOMERS_PER_DAY)
    const newQueue: QueuedCustomer[] = []
    let prev = prevOrd
    for (let i = 0; i < numToSpawn; i++) {
      const order = generateOrder(lv, prev, startIdx + i, stage)
      // Filter to available stock
      const availableIds = NON_SPICE_IDS.filter(id => (currentStock[id] ?? 0) > 0)
      const filtered = order.ingredients.filter(id => availableIds.includes(id))
      const finalIngredients = filtered.length >= 1 ? filtered : shuffle(availableIds).slice(0, Math.max(1, Math.min(2, availableIds.length)))
      const finalOrder = { ...order, ingredients: finalIngredients }
      const id = queueIdRef.current++
      newQueue.push({
        id,
        order: finalOrder,
        angerStart: Date.now(),
        angerDuration: getAngerDuration(order.customerType, stage),
        left: false,
        reactionEmoji: null,
      })
      prev = finalOrder
    }
    return newQueue
  }, [])

  // ── Game flow ─────────────────────────────────────────────────────────────────

  const beginPlaying = useCallback((resetAll = true, currentStock?: Stock, p2 = false) => {
    const lv = 1
    const stage: ShopStage = 1
    const stockToUse = currentStock ?? buildInitialStock()

    if (resetAll) {
      setScore(0)
      setLevel(lv)
      setShopStage(stage)
      setNumPots(1)
      setCustomerIndex(0)
      setDayIndex(1)
      setCombo(0)
      setSatisfaction(100)
      setStock(stockToUse)
      setProcurementBudget(500)
      if (!p2) { setRivalScore(0); setIsP2Mode(false) }
    }

    const queue = spawnCustomersForQueue(lv, stage, null, stockToUse, 0)
    setCustomerQueue(queue)
    setActiveCustomerId(queue[0]?.id ?? null)
    setPrevOrder(null)
    setPotIngredients(Array.from({ length: 1 }, () => []))
    setPotSpices([''])
    setSelectedPot(0)
    setServeFeedback(null)
    setIsServing(false)
    setCookingItems([])
    setConveyorItems([])

    const firstOrder = queue[0]?.order ?? null
    const t = firstOrder ? getTimerForLevel(lv, firstOrder.customerType) : 30
    startTimer(t)
    setPhase(p2 ? 'p2playing' : 'playing')
  }, [startTimer, spawnCustomersForQueue])

  const startGame = useCallback((p2 = false) => {
    const seen = typeof window !== 'undefined' && localStorage.getItem('malatang_tutorial_done')
    if (!seen && !p2) {
      const order = generateOrder(1, null, 0, 1)
      setCurrentOrderForTutorial(order)
      setScore(0); setLevel(1); setShopStage(1); setNumPots(1); setCustomerIndex(0)
      setDayIndex(1); setCombo(0); setSatisfaction(100)
      setPotIngredients([[]]); setPotSpices(['']); setSelectedPot(0)
      setServeFeedback(null); setIsServing(false); setCookingItems([])
      setConveyorItems([])
      setTutorialStep(0); setIsTutorialActive(true)
      setTimeLeft(30); setMaxTime(30)
      setPhase('playing')
    } else {
      beginPlaying(true, undefined, p2)
    }
  }, [beginPlaying])

  // Hack: set first queue customer for tutorial
  const setCurrentOrderForTutorial = useCallback((order: CustomerOrder) => {
    const id = queueIdRef.current++
    setCustomerQueue([{
      id,
      order,
      angerStart: Date.now(),
      angerDuration: 30,
      left: false,
      reactionEmoji: null,
    }])
    setActiveCustomerId(id)
  }, [])

  const finishTutorial = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('malatang_tutorial_done', '1')
    setIsTutorialActive(false)
    beginPlaying(true)
  }, [beginPlaying])

  const advanceTutorial = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) setTutorialStep(s => s + 1)
    else finishTutorial()
  }, [tutorialStep, finishTutorial])

  const handleServe = useCallback((potIndex: number, timedOut = false) => {
    if (isServing) return
    const activeCustomer = customerQueue.find(qc => qc.id === activeCustomerId && !qc.left)
    if (!activeCustomer) return

    setIsServing(true)
    stopTimer()

    const order = activeCustomer.order
    const orderSet = new Set(order.ingredients)
    const selected = new Set(potIngredients[potIndex] ?? [])
    const selectedSpice = potSpices[potIndex] ?? ''

    let delta = 0
    let allCorrect = true

    const spiceCorrect = selectedSpice === order.spiceLevel
    if (!spiceCorrect) { delta -= 20; allCorrect = false }

    const correctItems = Array.from(orderSet).filter(id => selected.has(id))
    const missingItems = Array.from(orderSet).filter(id => !selected.has(id))
    const extraItems = Array.from(selected).filter(id => !orderSet.has(id) && !SPICE_IDS.includes(id))

    delta += correctItems.length * 20
    delta -= missingItems.length * 20
    delta -= extraItems.length * 10

    const isPerfect = missingItems.length === 0 && extraItems.length === 0 && spiceCorrect

    let allergicPenalty = false
    if (order.customerType === 'allergic' && order.forbiddenIngredients.length > 0) {
      if (Array.from(selected).some(id => order.forbiddenIngredients.includes(id))) {
        delta -= 50; allergicPenalty = true; allCorrect = false
      }
    }

    const newCombo = isPerfect ? combo + 1 : 0
    const multiplier = isPerfect ? Math.min(3, Math.max(1, newCombo)) : 1

    if (isPerfect) {
      const timeBonus = timedOut ? 0 : Math.floor(timeLeft * 2)
      delta += (100 + timeBonus) * multiplier
      playSound('coin')

      const selectedArr = Array.from(selected)
      const secretCombo = checkSecretCombo(selectedArr)
      if (secretCombo) {
        delta += secretCombo.bonus
        setComboOverlay({ name: secretCombo.name, bonus: secretCombo.bonus, emoji: secretCombo.emoji })
        setDiscoveredCombos(prev => new Set([...Array.from(prev), secretCombo.name]))
        playSound('combo')
      }
    } else {
      allCorrect = false
      playSound('error')
    }

    const satDelta = isPerfect ? 20 : (allergicPenalty ? -30 : -15)
    const newSatisfaction = Math.max(0, Math.min(100, satisfaction + satDelta))
    const newScore = Math.max(-999, score + delta)

    // Deduct stock
    const newStock = { ...stock }
    for (const id of Array.from(selected)) {
      if (!SPICE_IDS.includes(id)) newStock[id] = Math.max(0, (newStock[id] ?? 0) - 1)
    }

    setScore(newScore)
    setCombo(newCombo)
    setSatisfaction(newSatisfaction)
    setStock(newStock)
    setServeFeedback({ correct: allCorrect, delta, potIndex })

    // Customer reaction
    const reactionEmoji = isPerfect ? '😊' : '😤'
    setCustomerQueue(prev => prev.map(qc => qc.id === activeCustomerId ? { ...qc, reactionEmoji } : qc))

    const id = coinIdRef.current++
    setCoinAnimations(prev => [...prev, { id, x: 50, y: 50, amount: Math.abs(delta), positive: delta >= 0 }])
    setTimeout(() => setCoinAnimations(prev => prev.filter(c => c.id !== id)), 900)

    const nextCustomerIndex = customerIndex + 1
    setCustomerIndex(nextCustomerIndex)
    setPrevOrder(order)

    // Clear pot
    setPotIngredients(pots => {
      const next = pots.map((p, i) => i === potIndex ? [] : p)
      return next
    })
    setPotSpices(spices => spices.map((s, i) => i === potIndex ? '' : s))

    setTimeout(() => {
      if (newSatisfaction <= 0) { stopTimer(); setPhase('result'); setPostGameScore(newScore); return }

      // Remove served customer, advance queue
      setCustomerQueue(prev => {
        const remaining = prev.filter(qc => qc.id !== activeCustomerId)
        const nextActive = remaining.find(qc => !qc.left)
        if (nextActive) {
          setActiveCustomerId(nextActive.id)
          const t = getTimerForLevel(level, nextActive.order.customerType)
          startTimer(t)
          setIsServing(false)
        } else {
          // Need to advance day or end game
          const indexInDay = nextCustomerIndex % CUSTOMERS_PER_DAY
          if (indexInDay === 0 && nextCustomerIndex > 0) {
            stopTimer()
            const nextDay = Math.floor(nextCustomerIndex / CUSTOMERS_PER_DAY) + 1
            setDayIndex(nextDay)
            setProcurementBudget(Math.max(0, newScore))
            setPhase('procurement')
            setIsServing(false)
          } else if (nextCustomerIndex >= CUSTOMERS_PER_DAY * MAX_DAYS) {
            stopTimer()
            setPhase(isP2Mode ? 'p2result' : 'result')
            setPostGameScore(newScore)
            setIsServing(false)
          } else {
            // Spawn new batch
            const newLevel = nextCustomerIndex >= 10 ? 3 : nextCustomerIndex >= 5 ? 2 : 1
            const newStage = getStageFromScore(newScore)
            setLevel(newLevel)
            const newQueue = spawnCustomersForQueue(newLevel, newStage, order, newStock, nextCustomerIndex)
            setCustomerQueue(newQueue)
            const nextCust = newQueue.find(qc => !qc.left)
            if (nextCust) {
              setActiveCustomerId(nextCust.id)
              const t = getTimerForLevel(newLevel, nextCust.order.customerType)
              startTimer(t)
            }
            setIsServing(false)
          }
        }
        return remaining
      })
    }, 1400)
  }, [isServing, customerQueue, activeCustomerId, potIngredients, potSpices, combo, timeLeft, satisfaction, score, stock, customerIndex, level, isP2Mode, stopTimer, startTimer, spawnCustomersForQueue])

  const handleProcurementDone = useCallback((newStock: Stock, spent: number) => {
    const newScore = Math.max(0, score - spent)
    setScore(newScore)
    setStock(newStock)
    // Resume game
    const lv = dayIndex >= 3 ? 3 : dayIndex >= 2 ? 2 : 1
    setLevel(lv)
    const stage = getStageFromScore(newScore)
    setShopStage(stage)
    const newPots = STAGE_INFO[stage].pots
    setNumPots(newPots)
    const queue = spawnCustomersForQueue(lv, stage, prevOrder, newStock, customerIndex)
    setCustomerQueue(queue)
    const nextCust = queue.find(qc => !qc.left)
    setActiveCustomerId(nextCust?.id ?? null)
    setPotIngredients(Array.from({ length: newPots }, () => []))
    setPotSpices(Array.from({ length: newPots }, () => ''))
    setSelectedPot(0)
    setServeFeedback(null)
    setIsServing(false)
    setCookingItems([])
    setConveyorItems([])
    if (nextCust) {
      const t = getTimerForLevel(lv, nextCust.order.customerType)
      startTimer(t)
    }
    setPhase(isP2Mode ? 'p2playing' : 'playing')
  }, [score, dayIndex, customerIndex, prevOrder, isP2Mode, startTimer, spawnCustomersForQueue])

  const grabConveyorItem = useCallback((item: ConveyorItem) => {
    const ing = getIngredientById(item.ingredientId)
    if (!ing || isServing || isTutorialActive) return

    // Remove from belt
    setConveyorItems(prev => prev.filter(ci => ci.id !== item.id))
    playSound('sizzle')

    if (ing.category === 'spice') {
      setPotSpices(spices => spices.map((s, i) => i === selectedPot ? ing.id : s))
      return
    }

    // Check if already in pot
    if ((potIngredients[selectedPot] ?? []).includes(ing.id)) return

    if (ing.cookTime === 0) {
      setPotIngredients(pots => pots.map((p, i) => i === selectedPot ? [...p, ing.id] : p))
      return
    }

    // Start cooking
    const newId = cookingIdRef.current++
    setCookingItems(prev => [...prev, {
      id: `cook-${newId}`,
      ingredientId: ing.id,
      progress: 0,
      ready: false,
      potIndex: selectedPot,
    }])
  }, [isServing, isTutorialActive, selectedPot, potIngredients])

  // ── Leaderboard phase ──────────────────────────────────────────────────────────

  if (phase === 'leaderboard') {
    return (
      <LeaderboardScreen
        onBack={() => setPhase('title')}
        currentScore={postGameScore}
        isPostGame={postGameScore !== undefined}
        onNameSubmit={() => setPostGameScore(undefined)}
      />
    )
  }

  // ── Title screen ───────────────────────────────────────────────────────────────

  if (phase === 'title') {
    const board = loadLeaderboard()
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn max-w-sm w-full">
          <div className="text-8xl mb-6 animate-bubble">🍲</div>
          <h1 className="text-5xl font-black text-orange-300 mb-2 drop-shadow-lg">マーラータン屋さん</h1>
          <p className="text-orange-400 text-lg mb-1">麻辣烫 Shop Game</p>
          <p className="text-orange-300/30 text-xs mb-2">v3.0.0</p>
          <p className="text-orange-300/70 text-sm mb-8 max-w-sm mx-auto">
            お客さんの注文通りに食材を選んで、おいしいマーラータンを作ろう！
            コンベアから食材を取り、複数の鍋で同時に調理しよう！
          </p>

          <div className="space-y-3 mb-8">
            <button onClick={() => startGame(false)}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
                text-white font-black text-xl px-12 py-4 rounded-full shadow-xl
                transition-all duration-150 active:scale-95 hover:scale-105 hover:shadow-orange-500/30 hover:shadow-2xl">
              🍲 1人プレイ
            </button>

            <button onClick={() => {
              setIsP2Mode(true)
              setP1Score(0)
              startGame(false)
            }}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500
                text-white font-black text-xl px-12 py-4 rounded-full shadow-xl
                transition-all duration-150 active:scale-95 hover:scale-105">
              👥 2人対戦モード
            </button>

            <button onClick={() => { setShowLeaderboard(true); setPostGameScore(undefined); setPhase('leaderboard') }}
              className="w-full bg-orange-950 border border-orange-700 hover:bg-orange-900
                text-orange-300 font-bold text-lg px-12 py-3 rounded-full
                transition-all duration-150 active:scale-95">
              🏆 ランキング
            </button>
          </div>

          {board.length > 0 && (
            <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4">
              <p className="text-orange-400/70 text-xs mb-2 font-bold">🏆 TOP 3</p>
              {board.slice(0, 3).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm mb-1">
                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <span className="text-orange-200 flex-1">{entry.name}</span>
                  <span className="text-yellow-400 font-bold">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-orange-300/40 text-xs mt-4">初回プレイ時はチュートリアルがあります</p>
        </div>
      </main>
    )
  }

  // ── Result screen ──────────────────────────────────────────────────────────────

  if (phase === 'result') {
    const rank = getRank(score)
    const beatRival = score > rivalScore
    const qualifies = qualifiesForLeaderboard(score)

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn max-w-md w-full">
          <div className="text-7xl mb-4">{score >= 300 ? '🎉' : '😢'}</div>
          <h1 className="text-4xl font-black text-orange-300 mb-2">ゲーム終了</h1>
          <p className="text-orange-400 mb-6">{rank}</p>

          <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-8 mb-4">
            <p className="text-orange-300/70 text-sm mb-2">最終スコア</p>
            <p className="text-6xl font-black text-yellow-400">{score.toLocaleString()}</p>
            <p className="text-orange-300/50 text-sm mt-1">コイン</p>
          </div>

          <div className="bg-orange-950/60 border border-orange-800/40 rounded-xl px-6 py-3 mb-4 flex justify-around text-sm">
            <div className="text-center">
              <div className="text-orange-300/60">店</div>
              <div className="text-orange-200 font-bold">{STAGE_INFO[shopStage].name}</div>
            </div>
            <div className="text-center">
              <div className="text-orange-300/60">満足度</div>
              <div className="text-orange-200 font-bold">{satisfaction}</div>
            </div>
            <div className="text-center">
              <div className="text-orange-300/60">コンボ</div>
              <div className="text-orange-200 font-bold">{combo}連</div>
            </div>
            <div className="text-center">
              <div className="text-orange-300/60">レシピ</div>
              <div className="text-orange-200 font-bold">{discoveredCombos.size}/{SECRET_COMBOS.length}</div>
            </div>
          </div>

          {/* Rival result */}
          <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-bold ${beatRival ? 'bg-green-900/40 border border-green-700/40 text-green-300' : 'bg-red-900/40 border border-red-700/40 text-red-300'}`}>
            {beatRival ? `🏆 ライバルに勝利！ (ライバル: ${rivalScore.toLocaleString()})` : `😤 ライバルに敗北... (ライバル: ${rivalScore.toLocaleString()})`}
          </div>

          {qualifies && (
            <div className="bg-yellow-950/60 border border-yellow-600/40 rounded-xl px-4 py-2 mb-4 text-yellow-300 text-sm font-bold animate-slideUp">
              🎉 ランキング入り！
            </div>
          )}

          {/* SNS Share */}
          <div className="mb-6">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`マーラータン屋さんで${score.toLocaleString()}コイン獲得！${rank} #マーラータン屋さん`)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-800 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-full text-sm transition-all active:scale-95">
              𝕏 シェアする
            </a>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => beginPlaying(true)}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
                text-white font-bold text-lg px-8 py-3 rounded-full shadow-xl transition-all active:scale-95 hover:scale-105">
              🔄 もう一度
            </button>
            {qualifies && (
              <button onClick={() => { setPostGameScore(score); setPhase('leaderboard') }}
                className="bg-gradient-to-r from-yellow-700 to-orange-600 hover:from-yellow-600 hover:to-orange-500
                  text-white font-bold text-lg px-8 py-3 rounded-full shadow-xl transition-all active:scale-95">
                🏆 登録
              </button>
            )}
            <button onClick={() => setPhase('title')}
              className="bg-orange-950 border border-orange-700 hover:bg-orange-900
                text-orange-300 font-bold text-lg px-8 py-3 rounded-full transition-all active:scale-95">
              🏠 タイトル
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── P2 result screen ────────────────────────────────────────────────────────────

  if (phase === 'p2result') {
    const p2Score = score
    const winner = p1Score > p2Score ? 'P1' : p2Score > p1Score ? 'P2' : 'draw'
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn max-w-md w-full">
          <div className="text-7xl mb-4">🎮</div>
          <h1 className="text-4xl font-black text-orange-300 mb-6">2人対戦 結果</h1>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`rounded-2xl p-6 border-2 ${winner === 'P1' ? 'border-yellow-400 bg-yellow-900/30' : 'border-orange-800/40 bg-orange-950/60'}`}>
              <div className="text-3xl mb-2">👤</div>
              <div className="text-orange-300/70 text-sm mb-1">プレイヤー 1</div>
              <div className="text-4xl font-black text-yellow-400">{p1Score.toLocaleString()}</div>
              {winner === 'P1' && <div className="text-yellow-300 font-bold text-sm mt-2">👑 勝利！</div>}
            </div>
            <div className={`rounded-2xl p-6 border-2 ${winner === 'P2' ? 'border-yellow-400 bg-yellow-900/30' : 'border-orange-800/40 bg-orange-950/60'}`}>
              <div className="text-3xl mb-2">👤</div>
              <div className="text-orange-300/70 text-sm mb-1">プレイヤー 2</div>
              <div className="text-4xl font-black text-yellow-400">{p2Score.toLocaleString()}</div>
              {winner === 'P2' && <div className="text-yellow-300 font-bold text-sm mt-2">👑 勝利！</div>}
            </div>
          </div>

          {winner === 'draw' && <p className="text-orange-300 font-black text-2xl mb-8">🤝 引き分け！</p>}

          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setIsP2Mode(true); setP1Score(0); beginPlaying(true, undefined, false) }}
              className="bg-gradient-to-r from-purple-700 to-pink-600 text-white font-bold px-8 py-3 rounded-full transition-all active:scale-95">
              🔄 再戦
            </button>
            <button onClick={() => setPhase('title')}
              className="bg-orange-950 border border-orange-700 text-orange-300 font-bold px-8 py-3 rounded-full transition-all active:scale-95">
              🏠 タイトル
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Procurement screen ──────────────────────────────────────────────────────────

  if (phase === 'procurement') {
    return (
      <ProcurementScreen
        day={dayIndex}
        budget={procurementBudget}
        stock={stock}
        stage={shopStage}
        onDone={handleProcurementDone}
      />
    )
  }

  // ── Playing/P2Playing screen ────────────────────────────────────────────────────

  const isPlaying = phase === 'playing' || phase === 'p2playing'
  if (!isPlaying) return null

  const activeCustomer = customerQueue.find(qc => qc.id === activeCustomerId && !qc.left) ?? null
  const order = activeCustomer?.order ?? null
  const timerPct = (timeLeft / maxTime) * 100
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'
  const comboMultiplier = Math.min(3, Math.max(1, combo + 1))
  const customerIndexInDay = customerIndex % CUSTOMERS_PER_DAY

  const spiceIngredients = INGREDIENTS.filter(i => i.category === 'spice')

  // For tutorial display compat
  const displayOrder = order

  return (
    <>
      {comboOverlay && <ComboFlashOverlay combo={comboOverlay} onDone={() => setComboOverlay(null)} />}
      {showRecipeBook && <RecipeBookModal discovered={discoveredCombos} onClose={() => setShowRecipeBook(false)} />}

      {/* Drop animations */}
      {dropAnimations.map(da => (
        <div key={da.id} className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="text-5xl animate-dropIn">{da.emoji}</div>
        </div>
      ))}

      <main className={`min-h-screen flex flex-col p-3 gap-3 select-none max-w-5xl mx-auto ${isTutorialActive ? 'pointer-events-none' : ''}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-orange-400 text-sm font-bold">{STAGE_INFO[shopStage].name}</span>
            <span className="text-orange-500/40 text-xs">|</span>
            <span className="text-orange-300/60 text-xs">Day{dayIndex} {customerIndexInDay + 1}/{CUSTOMERS_PER_DAY}</span>
            {phase === 'p2playing' && (
              <span className="bg-purple-700/60 text-purple-200 text-xs px-2 py-0.5 rounded-full font-bold">P2番</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-red-400/70 text-xs">🤖 ライバル: {rivalScore.toLocaleString()}</span>
            {combo >= 2 && (
              <span className="text-orange-200 text-xs font-black bg-orange-700/60 px-2 py-0.5 rounded-lg animate-pulse">
                {combo}連続🔥 ×{comboMultiplier}
              </span>
            )}
            <span className="text-yellow-400 font-black">💰 {score.toLocaleString()}</span>
            <button onClick={() => setShowRecipeBook(true)} className="text-orange-300 hover:text-orange-100 text-lg" title="レシピ本">
              📖
            </button>
          </div>
        </div>

        {/* Satisfaction */}
        <SatisfactionBar value={satisfaction} />

        {/* Timer */}
        <div ref={timerRef2} className="w-full bg-orange-950 rounded-full h-3 overflow-hidden border border-orange-900">
          <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }} />
        </div>
        <div className="text-center text-xs text-orange-300/70 -mt-1">⏰ {timeLeft}秒</div>

        {/* Customer Queue */}
        <div ref={customerRef}>
          <p className="text-orange-400/70 text-xs mb-1 font-bold">👥 お客さんキュー</p>
          <CustomerQueue
            queue={customerQueue}
            activeCustomerId={activeCustomerId}
            now={now}
            onSelectCustomer={() => {}} // only first customer served
          />
        </div>

        {/* Active customer order panel */}
        {displayOrder && (
          <div className="bg-orange-950/60 border border-orange-700/40 rounded-2xl p-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className={`text-4xl ${serveFeedback ? (serveFeedback.correct ? 'animate-customerReact' : 'animate-shake') : ''}`}>
                  {activeCustomer?.reactionEmoji || displayOrder.customerEmoji}
                </span>
                <span className="text-orange-300/70 text-xs">{displayOrder.customerName}</span>
                {(() => {
                  const badge = customerTypeBadge(displayOrder.customerType)
                  return badge ? <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${badge.color}`}>{badge.label}</span> : null
                })()}
              </div>
              <div className="flex-1">
                <p className="text-orange-200/80 text-xs mb-1 font-medium">ご注文：</p>
                <div className="flex flex-wrap gap-1">
                  {displayOrder.ingredients.map(id => {
                    const ing = getIngredientById(id)!
                    const isInPot = potIngredients.some(p => p.includes(id))
                    const isCooking = cookingItems.some(ci => ci.ingredientId === id)
                    return (
                      <span key={id} className={`text-xs px-2 py-0.5 rounded-full border
                        ${isInPot ? 'border-green-500 bg-green-900/40 text-green-300' :
                          isCooking ? 'border-yellow-500 bg-yellow-900/40 text-yellow-300' :
                          'border-orange-700/40 bg-orange-950/60 text-orange-200'}`}>
                        {isInPot ? '✅' : isCooking ? '🔥' : '⬜'} {ing.emoji} {ing.name}
                      </span>
                    )
                  })}
                  {(() => {
                    const spice = getIngredientById(displayOrder.spiceLevel)!
                    const isInPot = potSpices.some(s => s === displayOrder.spiceLevel)
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full border
                        ${isInPot ? 'border-green-500 bg-green-900/40 text-green-300' : 'border-orange-700/40 bg-orange-950/60 text-orange-200'}`}>
                        {isInPot ? '✅' : '⬜'} {spice.emoji} {spice.name}
                      </span>
                    )
                  })()}
                  {displayOrder.customerType === 'allergic' && displayOrder.forbiddenIngredients.length > 0 && displayOrder.forbiddenIngredients.map(id => {
                    const ing = getIngredientById(id)!
                    return (
                      <span key={id} className="text-xs px-2 py-0.5 rounded-full border border-red-600/60 bg-red-950/60 text-red-300">
                        ❌ {ing.emoji} {ing.name}
                      </span>
                    )
                  })}
                </div>
              </div>
              {serveFeedback && (
                <div className={`text-center text-sm font-bold px-3 py-2 rounded-xl animate-fadeIn
                  ${serveFeedback.correct ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
                  {serveFeedback.correct ? '🎉' : '😅'}
                  <div className="text-xs font-normal">{serveFeedback.delta >= 0 ? '+' : ''}{serveFeedback.delta}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conveyor Belt */}
        <div ref={ingredientsRef}>
          <p className="text-orange-400/70 text-xs mb-1 font-bold">🏭 コンベア（食材をクリックして取ろう！）</p>
          <ConveyorBelt items={conveyorItems} onGrab={grabConveyorItem} stage={shopStage} />
        </div>

        {/* Spice selection row */}
        <div>
          <p className="text-orange-400/70 text-xs mb-1 font-bold">🌶️ 辛さ選択 → 鍋 {selectedPot + 1} へ</p>
          <div className="flex gap-2">
            {spiceIngredients.map(ing => {
              const isSelected = potSpices[selectedPot] === ing.id
              const inOrder = displayOrder?.spiceLevel === ing.id
              return (
                <button key={ing.id}
                  onClick={() => {
                    if (isServing || isTutorialActive) return
                    setPotSpices(spices => spices.map((s, i) => i === selectedPot ? (s === ing.id ? '' : ing.id) : s))
                  }}
                  className={`flex-1 rounded-xl p-2 flex flex-col items-center gap-0.5 transition-all border-2 active:scale-95
                    ${isSelected && inOrder ? 'border-green-400 bg-green-900/60' :
                      isSelected && !inOrder ? 'border-red-400 bg-red-900/60' :
                      'border-transparent bg-orange-950/60 hover:bg-orange-900/80'}`}>
                  <span className="text-xl">{ing.emoji}</span>
                  <span className="text-xs text-orange-100">{ing.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cooking in progress */}
        {cookingItems.length > 0 && (
          <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-3">
            <h2 className="text-orange-300 font-bold text-xs mb-2">🔥 調理中</h2>
            <div className="flex flex-wrap gap-2">
              {cookingItems.map(ci => {
                const ing = getIngredientById(ci.ingredientId)
                if (!ing) return null
                return (
                  <div key={ci.id} className="flex flex-col items-center bg-yellow-900/40 border border-yellow-600/40 rounded-xl px-3 py-2 min-w-14">
                    <span className="text-xl">{ing.emoji}</span>
                    <span className="text-xs text-yellow-200">鍋{ci.potIndex + 1}</span>
                    <div className="w-full bg-yellow-950 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all duration-100" style={{ width: `${ci.progress}%` }} />
                    </div>
                    <span className="text-yellow-400/70 text-xs">{Math.round(ci.progress)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Multi-Pot Area */}
        <div ref={potRef}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-orange-400/70 text-xs font-bold">🍲 鍋（クリックして選択）</p>
            <p className="text-orange-300/50 text-xs">選択中: 鍋 {selectedPot + 1}</p>
          </div>
          <div className={`grid gap-3 ${numPots === 1 ? 'grid-cols-1' : numPots === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {Array.from({ length: numPots }, (_, i) => (
              <div key={i}>
                <PotDisplay
                  potIndex={i}
                  isSelected={selectedPot === i}
                  selectedIngredients={new Set(potIngredients[i] ?? [])}
                  cookingItems={cookingItems.filter(ci => ci.potIndex === i)}
                  currentOrder={order}
                  onSelect={idx => setSelectedPot(idx)}
                  onServe={idx => handleServe(idx, false)}
                  isServing={isServing}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Serve button ref for tutorial */}
        <button ref={serveRef} className="hidden" aria-hidden="true" />

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
