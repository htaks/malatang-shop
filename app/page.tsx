'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'vegetable' | 'protein' | 'noodle' | 'spice'

interface Ingredient {
  id: string
  name: string
  emoji: string
  category: Category
}

interface CustomerOrder {
  ingredients: string[]
  spiceLevel: string
  customerEmoji: string
  customerName: string
}

type GamePhase = 'title' | 'tutorial' | 'playing' | 'result'

interface CoinAnimation {
  id: number
  x: number
  y: number
  amount: number
  positive: boolean
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
    body: 'ここにお客さんの注文が表示されます。\nどの食材が必要か確認しましょう！\nチェックが付くと正解です ✅',
    emoji: '👩',
    position: 'right',
  },
  {
    target: 'ingredients',
    title: '食材を選ぼう',
    body: 'クリックして食材を選びます。\n🟨 点線 = 注文に入っている食材\n🟩 緑枠 = 正しく選択済み\n🟥 赤枠 = 注文にない食材（余分）',
    emoji: '🛒',
    position: 'bottom',
  },
  {
    target: 'pot',
    title: 'あなたの鍋',
    body: '選んだ食材がここに入ります。\n✓ 緑 = 正解の食材\n✗ 赤 = 余分な食材\n辛さも選ぶのを忘れずに！',
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
    body: '食材を選び終えたら\n「提供する」ボタンを押そう！\nピッタリ正解で +100コイン！\nタイムボーナスも加算されます 💰',
    emoji: '🎯',
    position: 'left',
  },
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const INGREDIENTS: Ingredient[] = [
  { id: 'hakusai',   name: '白菜',       emoji: '🥬', category: 'vegetable' },
  { id: 'moyashi',   name: 'もやし',     emoji: '🌱', category: 'vegetable' },
  { id: 'kinoko',    name: 'きのこ',     emoji: '🍄', category: 'vegetable' },
  { id: 'jagaimo',   name: 'じゃがいも', emoji: '🥔', category: 'vegetable' },
  { id: 'tofu',      name: 'とうふ',     emoji: '🧊', category: 'vegetable' },
  { id: 'horenso',   name: 'ほうれん草', emoji: '🌿', category: 'vegetable' },
  { id: 'negi',      name: 'ネギ',       emoji: '🧅', category: 'vegetable' },
  { id: 'ebi',       name: 'えび',       emoji: '🦐', category: 'protein' },
  { id: 'tsumire',   name: 'つみれ',     emoji: '🐟', category: 'protein' },
  { id: 'gyoza',     name: 'ぎょうざ',   emoji: '🥟', category: 'protein' },
  { id: 'chikuwa',   name: 'ちくわ',     emoji: '🍢', category: 'protein' },
  { id: 'uzura',     name: 'うずらたまご', emoji: '🥚', category: 'protein' },
  { id: 'lamb',      name: 'ラム肉',     emoji: '🥩', category: 'protein' },
  { id: 'bifun',     name: 'ビーフン',   emoji: '🍜', category: 'noodle' },
  { id: 'udon',      name: 'うどん',     emoji: '🍝', category: 'noodle' },
  { id: 'shirataki', name: 'しらたき',   emoji: '🌀', category: 'noodle' },
  { id: 'spice1',    name: '普通',       emoji: '🌶️',     category: 'spice' },
  { id: 'spice2',    name: '辛め',       emoji: '🌶️🌶️',   category: 'spice' },
  { id: 'spice3',    name: '激辛',       emoji: '🌶️🌶️🌶️', category: 'spice' },
]

const SPICE_IDS = ['spice1', 'spice2', 'spice3']
const NON_SPICE_IDS = INGREDIENTS.filter(i => i.category !== 'spice').map(i => i.id)

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

const TOTAL_CUSTOMERS = 5

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

function generateOrder(level: number): CustomerOrder {
  const minIngredients = level >= 3 ? 4 : level === 2 ? 3 : 2
  const maxIngredients = level >= 3 ? 5 : level === 2 ? 4 : 3
  const count = minIngredients + Math.floor(Math.random() * (maxIngredients - minIngredients + 1))
  const picked = shuffle(NON_SPICE_IDS).slice(0, count)
  const spice = SPICE_IDS[Math.floor(Math.random() * SPICE_IDS.length)]
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]
  return { ingredients: picked, spiceLevel: spice, customerEmoji: customer.emoji, customerName: customer.name }
}

function getTimerForLevel(level: number): number {
  if (level >= 3) return 20
  if (level === 2) return 25
  return 30
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
  onClick: () => void
}

function IngredientButton({ ingredient, selected, inOrder, onClick }: IngredientButtonProps) {
  let borderClass = 'border-2 border-transparent'
  let bgClass = 'bg-orange-950/60 hover:bg-orange-900/80'
  if (selected && inOrder) { borderClass = 'border-2 border-green-400'; bgClass = 'bg-green-900/60' }
  else if (selected && !inOrder) { borderClass = 'border-2 border-red-400'; bgClass = 'bg-red-900/60' }
  else if (!selected && inOrder) { borderClass = 'border-2 border-transparent'; bgClass = 'bg-orange-950/60' }

  return (
    <button onClick={onClick}
      className={`${borderClass} ${bgClass} rounded-xl p-2 flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer min-w-0`}>
      <span className="text-2xl leading-none select-none">{ingredient.emoji}</span>
      <span className="text-xs text-orange-100 font-medium leading-tight text-center">{ingredient.name}</span>
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
    const tooltipH = 200
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

    // Arrow pointing from tooltip to highlight
    const arrowX = rect.left + rect.width / 2
    const arrowY = rect.top + rect.height / 2
    setArrowStyle({ position: 'fixed', top: arrowY, left: arrowX, zIndex: 49, pointerEvents: 'none' })
  }, [step, ref, current.position])

  return (
    <>
      {/* Highlight ring */}
      <div style={highlightStyle} />

      {/* Tooltip card */}
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

          {/* Progress dots */}
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

        {/* Animated pointer arrow */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-orange-400 text-xs animate-bounce hidden">▼</div>
      </div>

      {/* Pulse ring on highlighted element */}
      <div style={{ ...arrowStyle, transform: 'translate(-50%, -50%)', width: 40, height: 40 }}>
        <div className="w-full h-full rounded-full border-2 border-orange-400/60 animate-ping" />
      </div>
    </>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function MalatangGame() {
  const [phase, setPhase] = useState<GamePhase>('title')
  const [tutorialStep, setTutorialStep] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [customerIndex, setCustomerIndex] = useState(0)
  const [currentOrder, setCurrentOrder] = useState<CustomerOrder | null>(null)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const [selectedSpice, setSelectedSpice] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [maxTime, setMaxTime] = useState(30)
  const [coinAnimations, setCoinAnimations] = useState<CoinAnimation[]>([])
  const [serveFeedback, setServeFeedback] = useState<null | { correct: boolean; delta: number }>(null)
  const [isServing, setIsServing] = useState(false)
  const [isTutorialActive, setIsTutorialActive] = useState(false)

  const coinIdRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  // ── Timer ──────────────────────────────────────────────────────────────────

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

  const beginPlaying = useCallback(() => {
    const lv = 1
    const order = generateOrder(lv)
    const t = getTimerForLevel(lv)
    setScore(0)
    setLevel(lv)
    setCustomerIndex(0)
    setCurrentOrder(order)
    setSelectedIngredients(new Set())
    setSelectedSpice('')
    setServeFeedback(null)
    setIsServing(false)
    setPhase('playing')
    startTimer(t)
  }, [startTimer])

  const startGame = useCallback(() => {
    const seen = typeof window !== 'undefined' && localStorage.getItem('malatang_tutorial_done')
    if (!seen) {
      // Show tutorial first — set up a dummy order so UI renders
      const order = generateOrder(1)
      setCurrentOrder(order)
      setScore(0)
      setLevel(1)
      setCustomerIndex(0)
      setSelectedIngredients(new Set())
      setSelectedSpice('')
      setServeFeedback(null)
      setIsServing(false)
      setTutorialStep(0)
      setIsTutorialActive(true)
      setTimeLeft(30)
      setMaxTime(30)
      setPhase('playing') // render game UI behind tutorial
    } else {
      beginPlaying()
    }
  }, [beginPlaying])

  const finishTutorial = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('malatang_tutorial_done', '1')
    setIsTutorialActive(false)
    beginPlaying()
  }, [beginPlaying])

  const advanceTutorial = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(s => s + 1)
    } else {
      finishTutorial()
    }
  }, [tutorialStep, finishTutorial])

  const nextCustomer = useCallback((newScore: number, newCustomerIndex: number) => {
    if (newCustomerIndex >= TOTAL_CUSTOMERS) { stopTimer(); setPhase('result'); return }
    const newLevel = newCustomerIndex >= 4 ? 3 : newCustomerIndex >= 2 ? 2 : 1
    const order = generateOrder(newLevel)
    const t = getTimerForLevel(newLevel)
    setLevel(newLevel)
    setCurrentOrder(order)
    setSelectedIngredients(new Set())
    setSelectedSpice('')
    setServeFeedback(null)
    setIsServing(false)
    startTimer(t)
  }, [stopTimer, startTimer])

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
    const extraItems = Array.from(selected).filter(id => !orderSet.has(id))

    delta += correctItems.length * 20
    delta -= missingItems.length * 20
    delta -= extraItems.length * 10

    const isPerfect = missingItems.length === 0 && extraItems.length === 0 && spiceCorrect
    if (isPerfect) {
      const timeBonus = timedOut ? 0 : Math.floor(timeLeft * 2)
      delta += 100 + timeBonus
    } else {
      allCorrect = false
    }

    const newScore = Math.max(-999, score + delta)
    setScore(newScore)
    setServeFeedback({ correct: allCorrect, delta })

    const id = coinIdRef.current++
    setCoinAnimations(prev => [...prev, { id, x: 50, y: 50, amount: Math.abs(delta), positive: delta >= 0 }])
    setTimeout(() => setCoinAnimations(prev => prev.filter(c => c.id !== id)), 900)

    const nextIdx = customerIndex + 1
    setCustomerIndex(nextIdx)
    setTimeout(() => {
      if (newScore < 0 && nextIdx < TOTAL_CUSTOMERS) { stopTimer(); setPhase('result') }
      else nextCustomer(newScore, nextIdx)
    }, 1200)
  }, [currentOrder, isServing, selectedIngredients, selectedSpice, score, timeLeft, customerIndex, stopTimer, nextCustomer])

  const toggleIngredient = useCallback((id: string) => {
    if (isServing || isTutorialActive) return
    setSelectedIngredients(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }, [isServing, isTutorialActive])

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
          <p className="text-orange-300/30 text-xs mb-2">v1.1.0</p>
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
    const rank = score >= 500 ? '🏆 伝説のシェフ' : score >= 300 ? '⭐ 一流シェフ' : score >= 150 ? '👨‍🍳 見習いシェフ' : '😅 もっと練習が必要'
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none">
        <div className="text-center animate-fadeIn max-w-md w-full">
          <div className="text-7xl mb-4">{score >= 150 ? '🎉' : '😢'}</div>
          <h1 className="text-4xl font-black text-orange-300 mb-2">ゲームオーバー</h1>
          <p className="text-orange-400 mb-8">{rank}</p>
          <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-8 mb-8">
            <p className="text-orange-300/70 text-sm mb-2">最終スコア</p>
            <p className="text-6xl font-black text-yellow-400">{score}</p>
            <p className="text-orange-300/50 text-sm mt-1">コイン</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={beginPlaying}
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

  // ── Playing screen (+ tutorial overlay) ───────────────────────────────────

  const order = currentOrder!
  const timerPct = (timeLeft / maxTime) * 100
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <>
      <main className={`min-h-screen flex flex-col p-3 gap-3 select-none max-w-5xl mx-auto ${isTutorialActive ? 'pointer-events-none' : ''}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-orange-400 text-sm font-bold">Lv.{level}</span>
            <span className="text-orange-300/60 text-sm">{customerIndex + 1} / {TOTAL_CUSTOMERS} 人目</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg font-black">💰 {score}</span>
          </div>
        </div>

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
              <div className="flex flex-col items-center mb-4">
                <div className={`text-5xl mb-1 ${serveFeedback ? (serveFeedback.correct ? 'animate-bubble' : 'animate-shake') : 'animate-bubble'}`}>
                  {order.customerEmoji}
                </div>
                <span className="text-orange-300/70 text-xs">{order.customerName}</span>
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
                    return (
                      <li key={id} className={`flex items-center gap-1 text-xs ${isSelected ? 'text-green-400' : 'text-orange-200'}`}>
                        <span>{isSelected ? '✅' : '⬜'}</span>
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

          {/* CENTER: Ingredient grid */}
          <div className="flex-1 flex flex-col gap-3">
            <div ref={ingredientsRef} className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4">
              <h2 className="text-orange-300 font-bold text-sm mb-3">🛒 食材を選ぼう</h2>
              <div className="space-y-3">
                {categories.map(cat => (
                  <div key={cat}>
                    <p className="text-orange-400/70 text-xs mb-1 font-medium">{categoryLabel[cat]}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                      {nonSpiceIngredients.filter(i => i.category === cat).map(ing => (
                        <IngredientButton key={ing.id} ingredient={ing}
                          selected={selectedIngredients.has(ing.id)}
                          inOrder={order.ingredients.includes(ing.id)}
                          onClick={() => toggleIngredient(ing.id)} />
                      ))}
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
                  return (
                    <div key={id} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg
                      ${inOrder ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
                      <span>{ing.emoji}</span>
                      <span>{ing.name}</span>
                      <span className="ml-auto">{inOrder ? '✓' : '✗'}</span>
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
