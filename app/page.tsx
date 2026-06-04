'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Character, { emojiToCharType, type Expression } from './components/Character'
import ConveyorBeltComponent from './components/ConveyorBelt'
import PotComponent from './components/Pot'
import { CoinBurst, ConfettiEffect, AngerSmoke, AnimatedScore } from './components/Particles'
import { useBGM } from './hooks/useBGM'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'vegetable' | 'protein' | 'noodle' | 'spice'
type CustomerType = 'normal' | 'impatient' | 'allergic' | 'regular' | 'hungry' | 'vip' | 'boss'
type GamePhase = 'title' | 'playing' | 'procurement' | 'result' | 'leaderboard' | 'p2playing' | 'p2result' | 'dayclear' | 'skillTree' | 'achievements' | 'dailyBonus'
type ShopStage = 1 | 2 | 3 | 4

// ─── Skill Tree Types ─────────────────────────────────────────────────────────

interface SkillTree {
  cookSpeed: 0 | 1 | 2 | 3
  patience: 0 | 1 | 2 | 3
  luck: 0 | 1 | 2 | 3
}

const SKILL_COSTS = [200, 400, 800] as const

function loadSkillTree(): SkillTree {
  if (typeof window === 'undefined') return { cookSpeed: 0, patience: 0, luck: 0 }
  try {
    const raw = localStorage.getItem('malatang_skillTree')
    if (!raw) return { cookSpeed: 0, patience: 0, luck: 0 }
    return JSON.parse(raw) as SkillTree
  } catch { return { cookSpeed: 0, patience: 0, luck: 0 } }
}

function saveSkillTree(st: SkillTree) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('malatang_skillTree', JSON.stringify(st)) } catch {}
}

function loadTotalCoins(): number {
  if (typeof window === 'undefined') return 0
  try { return parseInt(localStorage.getItem('malatang_totalCoins') ?? '0', 10) } catch { return 0 }
}

function saveTotalCoins(n: number) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('malatang_totalCoins', String(n)) } catch {}
}

// ─── Achievement Types ────────────────────────────────────────────────────────

type AchievementId =
  | 'firstPerfect'
  | 'combo3'
  | 'speedStar'
  | 'coins100'
  | 'streak3'
  | 'master'
  | 'teamwork'
  | 'spicyMaster'

interface Achievement {
  id: AchievementId
  emoji: string
  title: string
  description: string
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'firstPerfect', emoji: '🍜', title: '初めての一杯', description: '初めてパーフェクトオーダー達成' },
  { id: 'combo3', emoji: '🔥', title: '3連コンボ', description: '3コンボ達成' },
  { id: 'speedStar', emoji: '⚡', title: 'スピードスター', description: '20秒以上残してパーフェクト' },
  { id: 'coins100', emoji: '💰', title: '100コイン', description: '1ゲームで100コイン以上獲得' },
  { id: 'streak3', emoji: '📅', title: '3日連続', description: '3日連続ログイン' },
  { id: 'master', emoji: '🏆', title: '達人', description: 'Day 5 クリア' },
  { id: 'teamwork', emoji: '👥', title: 'チームワーク', description: '2Pモードでプレイ' },
  { id: 'spicyMaster', emoji: '🌶️', title: '激辛マスター', description: '激辛オーダーを5回正解' },
]

function loadAchievements(): Set<AchievementId> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('malatang_achievements')
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as AchievementId[])
  } catch { return new Set() }
}

function saveAchievements(set: Set<AchievementId>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('malatang_achievements', JSON.stringify(Array.from(set))) } catch {}
}

// ─── Daily Bonus Types ────────────────────────────────────────────────────────

const DAILY_BONUS_COINS = [100, 100, 150, 100, 100, 150, 500] as const

function checkDailyBonus(): { shouldShow: boolean; streak: number; bonusIndex: number; coins: number } {
  if (typeof window === 'undefined') return { shouldShow: false, streak: 0, bonusIndex: 0, coins: 0 }
  try {
    const lastLogin = localStorage.getItem('malatang_lastLoginDate')
    const streak = parseInt(localStorage.getItem('malatang_loginStreak') ?? '0', 10)
    const bonusIdx = parseInt(localStorage.getItem('malatang_bonusDayIndex') ?? '0', 10)
    const today = new Date().toDateString()
    if (lastLogin === today) return { shouldShow: false, streak, bonusIndex: bonusIdx, coins: 0 }
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const isConsecutive = lastLogin === yesterday
    const newStreak = isConsecutive ? streak + 1 : 1
    const newBonusIdx = isConsecutive ? (bonusIdx + 1) % DAILY_BONUS_COINS.length : 0
    const coins = DAILY_BONUS_COINS[newBonusIdx]
    localStorage.setItem('malatang_lastLoginDate', today)
    localStorage.setItem('malatang_loginStreak', String(newStreak))
    localStorage.setItem('malatang_bonusDayIndex', String(newBonusIdx))
    return { shouldShow: true, streak: newStreak, bonusIndex: newBonusIdx, coins }
  } catch { return { shouldShow: false, streak: 0, bonusIndex: 0, coins: 0 } }
}

function loadPendingBonusCoins(): number {
  if (typeof window === 'undefined') return 0
  try { return parseInt(localStorage.getItem('malatang_pendingBonus') ?? '0', 10) } catch { return 0 }
}

function savePendingBonusCoins(n: number) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('malatang_pendingBonus', String(n)) } catch {}
}

// ─── Daily Challenge ──────────────────────────────────────────────────────────

interface DailyChallenge {
  id: string
  description: string
  checkFn: (stats: GameStats) => boolean
  reward: number
}

interface GameStats {
  perfectOrders: number
  combos: number
  spicyCorrect: number
  timeBonus: number
  vipSatisfied: number
  score: number
}

const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: 'perfect5', description: '5分以内に5杯完璧に提供', checkFn: (s) => s.perfectOrders >= 5, reward: 300 },
  { id: 'combo3', description: 'コンボ3回達成', checkFn: (s) => s.combos >= 3, reward: 300 },
  { id: 'spicy3', description: '激辛を3杯提供', checkFn: (s) => s.spicyCorrect >= 3, reward: 300 },
  { id: 'timeBonus200', description: 'タイムボーナスで200コイン獲得', checkFn: (s) => s.timeBonus >= 200, reward: 300 },
  { id: 'vip1', description: 'VIPお客様を満足させる', checkFn: (s) => s.vipSatisfied >= 1, reward: 300 },
]

function getTodayChallenge(): DailyChallenge {
  const dayOfYear = Math.floor(Date.now() / 86400000)
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length]
}

function isDailyChallengeCompleted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem('malatang_dailyChallengeDate')
    return stored === new Date().toDateString()
  } catch { return false }
}

function markDailyChallengeCompleted() {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('malatang_dailyChallengeDate', new Date().toDateString()) } catch {}
}

// ─── Weekly Leaderboard helpers ───────────────────────────────────────────────

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const mon = new Date(d.setDate(diff))
  return mon.toDateString()
}

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const daysUntilMon = day === 0 ? 1 : 8 - day
  return new Date(Date.now() + daysUntilMon * 86400000)
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}時間${m}分`
}

// ─── Haptic Feedback ──────────────────────────────────────────────────────────

function haptic(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch {}
}

// ─── Day Config ───────────────────────────────────────────────────────────────

interface DayConfig {
  maxIngredients: number
  timerSeconds: number
  hasConveyor: boolean
  hasSpecialCustomers: boolean
  hasAngerMeter: boolean
  hasRival: boolean
  numPots: number
  hasSpiceChoice: boolean
  hasProcurement: boolean
}

function getDayConfig(dayIndex: number): DayConfig {
  if (dayIndex <= 1) return {
    maxIngredients: 2, timerSeconds: 45, hasConveyor: false,
    hasSpecialCustomers: false, hasAngerMeter: false, hasRival: false,
    numPots: 1, hasSpiceChoice: false, hasProcurement: false,
  }
  if (dayIndex === 2) return {
    maxIngredients: 3, timerSeconds: 35, hasConveyor: true,
    hasSpecialCustomers: false, hasAngerMeter: false, hasRival: false,
    numPots: 1, hasSpiceChoice: true, hasProcurement: false,
  }
  if (dayIndex === 3) return {
    maxIngredients: 4, timerSeconds: 30, hasConveyor: true,
    hasSpecialCustomers: true, hasAngerMeter: true, hasRival: false,
    numPots: 1, hasSpiceChoice: true, hasProcurement: false,
  }
  if (dayIndex === 4) return {
    maxIngredients: 4, timerSeconds: 25, hasConveyor: true,
    hasSpecialCustomers: true, hasAngerMeter: true, hasRival: true,
    numPots: 2, hasSpiceChoice: true, hasProcurement: false,
  }
  // Day 5+
  return {
    maxIngredients: dayIndex >= 6 ? 5 : 4, timerSeconds: 20, hasConveyor: true,
    hasSpecialCustomers: true, hasAngerMeter: true, hasRival: true,
    numPots: dayIndex >= 7 ? 3 : 2, hasSpiceChoice: true, hasProcurement: true,
  }
}

interface DayClearUnlock {
  icon: string
  title: string
  description: string
}

function getDayClearUnlock(dayIndex: number): DayClearUnlock | null {
  switch (dayIndex) {
    case 1: return { icon: '🏭', title: 'コンベアベルト', description: '食材が自動で流れてきます！\nタイミングよくクリックしよう' }
    case 2: return { icon: '👤', title: '特別なお客さん', description: 'せっかちなお客さんや常連さんが\n来るようになります！' }
    case 3: return { icon: '🍲', title: '2つの鍋', description: '鍋が2つに増えます！\n同時に複数の料理を作ろう' }
    case 4: return { icon: '🏪', title: '仕入れフェーズ', description: '毎日の営業前に食材を仕入れよう！\n戦略的に選ぼう' }
    default: return null
  }
}

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

// Shared AudioContext — created once on first user interaction to avoid
// "AudioContext was not allowed to start" browser policy errors.
let sharedAudioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

function playSound(type: 'coin' | 'error' | 'combo' | 'sizzle') {
  if (typeof window === 'undefined') return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
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

function pickCustomerType(index: number, luckLevel: 0 | 1 | 2 | 3 = 0, isBossSlot = false): CustomerType {
  if (isBossSlot) return 'boss'
  if (index === 0) return 'normal'
  const vipChance = 0.05 + (luckLevel === 1 ? 0.05 : luckLevel === 2 ? 0.10 : luckLevel === 3 ? 0.15 : 0)
  const roll = Math.random()
  if (roll < vipChance) return 'vip'
  if (roll < vipChance + 0.20) return 'impatient'
  if (roll < vipChance + 0.35) return 'allergic'
  if (roll < vipChance + 0.50) return 'regular'
  if (roll < vipChance + 0.60) return 'hungry'
  return 'normal'
}

function getUnlockedIngredients(stage: ShopStage): Ingredient[] {
  return NON_SPICE.filter(i => !i.unlockStage || i.unlockStage <= stage)
}

function generateOrder(level: number, prevOrder: CustomerOrder | null, customerIndex: number, stage: ShopStage, dayConfig?: DayConfig, luckLevel: 0 | 1 | 2 | 3 = 0, isBossSlot = false): CustomerOrder {
  const cfg = dayConfig
  const allowSpecial = cfg ? cfg.hasSpecialCustomers : true
  const type = allowSpecial ? pickCustomerType(customerIndex, luckLevel, isBossSlot) : 'normal'
  // On Day 1 (no conveyor), restrict to the 8 ingredients shown in the static grid
  const allUnlocked = getUnlockedIngredients(stage)
  const visibleUnlocked = cfg && !cfg.hasConveyor ? allUnlocked.slice(0, 8) : allUnlocked
  const unlockedIds = visibleUnlocked.map(i => i.id)

  const configMax = cfg ? cfg.maxIngredients : undefined

  let minIngredients: number
  let maxIngredients: number

  if (type === 'hungry') {
    minIngredients = 6; maxIngredients = 7
  } else if (type === 'vip') {
    minIngredients = 4; maxIngredients = 5
  } else if (type === 'boss') {
    // Boss always uses max ingredients
    const mx = configMax ?? 5
    minIngredients = mx; maxIngredients = mx
  } else {
    minIngredients = level >= 3 ? 4 : level === 2 ? 3 : 2
    maxIngredients = level >= 3 ? 5 : level === 2 ? 4 : 3
  }

  if (configMax !== undefined && type !== 'boss') {
    minIngredients = Math.min(minIngredients, configMax)
    maxIngredients = Math.min(maxIngredients, configMax)
  }

  const count = minIngredients + Math.floor(Math.random() * (maxIngredients - minIngredients + 1))
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]
  let ingredients: string[]
  let spiceLevel: string

  const hasSpiceChoice = cfg ? cfg.hasSpiceChoice : true

  if (type === 'regular' && prevOrder) {
    ingredients = [...prevOrder.ingredients]
    spiceLevel = prevOrder.spiceLevel
  } else {
    ingredients = shuffle(unlockedIds).slice(0, count)
    if (hasSpiceChoice) {
      spiceLevel = SPICE_IDS[Math.floor(Math.random() * SPICE_IDS.length)]
    } else {
      spiceLevel = 'spice1' // always 普通 on Day 1
    }
  }

  let forbiddenIngredients: string[] = []
  if (type === 'allergic') {
    const available = unlockedIds.filter(id => !ingredients.includes(id))
    forbiddenIngredients = shuffle(available).slice(0, 1 + Math.floor(Math.random() * 2))
  }

  return { ingredients, spiceLevel, customerEmoji: customer.emoji, customerName: customer.name, customerType: type, forbiddenIngredients }
}

function getTimerForLevel(level: number, type: CustomerType, dayConfig?: DayConfig, cookSpeedLevel: 0 | 1 | 2 | 3 = 0): number {
  const base = dayConfig ? dayConfig.timerSeconds : (level >= 3 ? 20 : level === 2 ? 25 : 30)
  const hasAnger = dayConfig ? dayConfig.hasAngerMeter : true
  let t = (hasAnger && type === 'impatient') ? Math.floor(base / 2) : base
  if (type === 'boss') t = Math.floor(t * 0.8) // 20% shorter for boss
  // Cook speed skill boosts effective timer (more time to cook)
  const speedMulti = cookSpeedLevel === 1 ? 1.1 : cookSpeedLevel === 2 ? 1.2 : cookSpeedLevel === 3 ? 1.3 : 1
  return Math.round(t * speedMulti)
}

function getAngerDuration(type: CustomerType, stage: ShopStage, patienceLevel: 0 | 1 | 2 | 3 = 0): number {
  const base = type === 'impatient' ? 15 : 25
  const dur = Math.max(10, base - (stage - 1) * 2)
  const patienceMulti = patienceLevel === 1 ? 1.1 : patienceLevel === 2 ? 1.2 : patienceLevel === 3 ? 1.3 : 1
  return Math.round(dur * patienceMulti)
}

function customerTypeBadge(type: CustomerType): { label: string; color: string } | null {
  switch (type) {
    case 'impatient': return { label: '⚡ せっかち', color: 'bg-yellow-600 text-yellow-100' }
    case 'allergic':  return { label: '⚠️ アレルギー', color: 'bg-red-700 text-red-100' }
    case 'regular':   return { label: '🌟 常連さん', color: 'bg-blue-700 text-blue-100' }
    case 'hungry':    return { label: '🍖 大食い', color: 'bg-purple-700 text-purple-100' }
    case 'vip':       return { label: '👑 VIP', color: 'bg-yellow-500 text-black' }
    case 'boss':      return { label: '⚠️ ボス客', color: 'bg-red-900 text-red-100' }
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

function loadWeeklyLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const weekKey = `malatang_weekly_${getWeekStart()}`
    const raw = localStorage.getItem(weekKey)
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch { return [] }
}

function saveWeeklyLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return
  try {
    const weekKey = `malatang_weekly_${getWeekStart()}`
    const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10)
    localStorage.setItem(weekKey, JSON.stringify(sorted))
  } catch {}
}

function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('malatang_leaderboard_v3')
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
  } catch { return [] }
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return
  try {
    const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10)
    localStorage.setItem('malatang_leaderboard_v3', JSON.stringify(sorted))
  } catch {}
}

function qualifiesForLeaderboard(score: number): boolean {
  const board = loadWeeklyLeaderboard()
  if (board.length < 10) return score > 0
  return score > board[board.length - 1].score
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SteamEffect() {
  return (
    <div className="absolute -top-8 left-0 right-0 flex justify-around pointer-events-none">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-white/50"
          animate={{ y: [0, -30], opacity: [0.6, 0], scale: [0.5, 1.8] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function SatisfactionBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const gradient = pct > 60
    ? 'linear-gradient(to right, #22c55e, #4ade80)'
    : pct > 30
    ? 'linear-gradient(to right, #eab308, #facc15)'
    : 'linear-gradient(to right, #ef4444, #f97316)'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-orange-300/80 whitespace-nowrap">😊 満足度</span>
      <div className="flex-1 bg-orange-950 rounded-full h-3 overflow-hidden border border-orange-800 relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: gradient }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full pointer-events-none" />
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
      <motion.div
        className="bg-gradient-to-br from-yellow-600 to-orange-600 border-4 border-yellow-300 rounded-3xl px-10 py-8 shadow-2xl text-center"
        initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.div
          className="text-5xl mb-2"
          animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 0.6 }}
        >
          {combo.emoji}
        </motion.div>
        <div className="text-2xl font-black text-white mb-1">🎉 コンボ発動！</div>
        <div className="text-xl font-bold text-yellow-200 mb-2">{combo.name}</div>
        <motion.div
          className="text-3xl font-black text-yellow-300"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          +{combo.bonus} コイン！
        </motion.div>
      </motion.div>
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

// ConveyorBelt is imported from components/ConveyorBelt.tsx

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
      <AnimatePresence mode="popLayout">
        {queue.map((qc, i) => {
          const order = qc.order
          const badge = customerTypeBadge(order.customerType)
          const elapsed = qc.left ? qc.angerDuration : Math.min(qc.angerDuration, (now - qc.angerStart) / 1000)
          const angerPct = Math.min(100, (elapsed / qc.angerDuration) * 100)
          const isActive = qc.id === activeCustomerId
          const angerGradient = angerPct > 66
            ? 'linear-gradient(to right, #ef4444, #b91c1c)'
            : angerPct > 33
            ? 'linear-gradient(to right, #eab308, #f97316)'
            : 'linear-gradient(to right, #22c55e, #16a34a)'

          const charType = emojiToCharType(order.customerEmoji)
          const expression: Expression = qc.reactionEmoji === '😊' ? 'happy'
            : qc.reactionEmoji === '😤' ? 'angry'
            : angerPct > 70 ? 'angry'
            : angerPct > 40 ? 'neutral'
            : isActive ? 'excited'
            : 'neutral'

          return (
            <motion.button
              key={qc.id}
              layout
              initial={{ x: 60, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: qc.left ? 0.4 : 1, scale: 1 }}
              exit={{ x: -40, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => !qc.left && i === 0 && onSelectCustomer(qc.id)}
              className={`flex-shrink-0 rounded-2xl p-2 border-2 transition-colors text-left min-w-32 relative
                ${qc.left ? 'border-orange-800/20 bg-orange-950/20' :
                  isActive ? 'border-orange-400 bg-orange-900/80 shadow-lg shadow-orange-500/20' :
                  i === 0 ? 'border-orange-700/60 bg-orange-950/60 hover:border-orange-500' :
                  'border-orange-800/30 bg-orange-950/40'}`}
            >
              {/* Anger smoke if very angry */}
              {angerPct > 80 && !qc.left && (
                <div className="absolute -top-2 right-1 pointer-events-none">
                  <AngerSmoke active={angerPct > 80} />
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <div className="relative">
                  <Character
                    type={charType}
                    expression={expression}
                    size={44}
                  />
                </div>
                <div>
                  <div className="text-orange-200 text-xs font-bold">{order.customerName}</div>
                  {badge && <span className={`text-xs px-1 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>}
                </div>
              </div>
              {/* Anger bar */}
              <div className="w-full bg-orange-950 rounded-full h-2 overflow-hidden border border-orange-800/40 relative">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: angerGradient }}
                  animate={{ width: `${angerPct}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
              {qc.left && <div className="text-red-400 text-xs mt-1 font-bold">帰った 😤</div>}
              {isActive && !qc.left && <div className="text-orange-300 text-xs mt-1 font-bold animate-pulse">→ 対応中</div>}
            </motion.button>
          )
        })}
      </AnimatePresence>
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
  spiceLevel: string
}

function PotDisplay({ potIndex, isSelected, selectedIngredients, cookingItems, currentOrder, onSelect, onServe, isServing, spiceLevel }: PotProps) {
  const potItems = Array.from(selectedIngredients)
  const order = currentOrder
  const isPotComplete = order !== null && order.ingredients.every(id => potItems.includes(id)) && potItems.length > 0

  return (
    <motion.div
      onClick={() => onSelect(potIndex)}
      className={`bg-orange-950/60 border-2 rounded-2xl p-3 cursor-pointer flex flex-col
        ${isSelected ? 'border-orange-400 shadow-lg shadow-orange-500/30' : 'border-orange-800/40 hover:border-orange-600/60'}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-orange-300 font-bold text-xs">鍋 {potIndex + 1} {isSelected ? '◀ 選択中' : ''}</h3>
        {isSelected && <span className="text-xs text-orange-400/60 animate-pulse">● 選択中</span>}
      </div>

      <div className="flex justify-center mb-2">
        <PotComponent
          isSelected={isSelected}
          spiceLevel={spiceLevel}
          ingredients={potItems}
          isComplete={isPotComplete}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-0.5 max-h-24 min-h-0">
        {potItems.length === 0 && <p className="text-orange-300/40 text-xs text-center py-1">空の鍋</p>}
        <AnimatePresence>
          {potItems.map(id => {
            const ing = getIngredientById(id)!
            const inOrder = order ? order.ingredients.includes(id) : false
            const isForbidden = order?.customerType === 'allergic' && (order?.forbiddenIngredients ?? []).includes(id)
            return (
              <motion.div
                key={id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 10, opacity: 0 }}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg
                  ${isForbidden ? 'text-red-300 bg-red-950/60' : inOrder ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}
              >
                <span>{ing.emoji}</span>
                <span className="truncate">{ing.name}</span>
                <span className="ml-auto">{isForbidden ? '❌' : inOrder ? '✓' : '✗'}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <motion.button
        onClick={e => { e.stopPropagation(); onServe(potIndex) }}
        disabled={isServing}
        className="mt-2 w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400
          disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs py-2 rounded-xl"
        whileTap={{ scale: 0.93 }}
        whileHover={{ scale: 1.02 }}
      >
        🍲 提供
      </motion.button>
    </motion.div>
  )
}

// Day Clear Modal
interface DayClearModalProps {
  dayIndex: number
  score: number
  onNext: () => void
}

function getDayStars(score: number, dayIndex: number): number {
  const thresholds = [dayIndex * 50, dayIndex * 120, dayIndex * 220]
  if (score >= thresholds[2]) return 3
  if (score >= thresholds[1]) return 2
  return 1
}

function DayClearModal({ dayIndex, score, onNext }: DayClearModalProps) {
  const stars = getDayStars(score, dayIndex)
  const unlock = getDayClearUnlock(dayIndex)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <motion.div
        className="bg-gradient-to-b from-orange-900 to-orange-950 border-2 border-orange-500 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
        initial={{ scale: 0.6, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <motion.div
          className="text-5xl mb-3"
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.3, 1] }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          🎉
        </motion.div>
        <h2 className="text-3xl font-black text-orange-300 mb-1">Day {dayIndex} クリア！</h2>
        <div className="flex justify-center gap-1 text-3xl my-4">
          {[1, 2, 3].map(s => (
            <motion.span
              key={s}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + s * 0.15, type: 'spring', stiffness: 400 }}
            >
              {s <= stars ? '🌟' : '⭐'}
            </motion.span>
          ))}
        </div>
        <p className="text-yellow-400 font-bold text-lg mb-4">スコア: {score.toLocaleString()} コイン</p>

        {unlock && (
          <motion.div
            className="bg-orange-950/80 border border-orange-600/60 rounded-2xl p-4 mb-5 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-orange-400/70 text-xs font-bold mb-2">✨ NEW UNLOCK</p>
            <div className="flex items-start gap-3">
              <span className="text-3xl">{unlock.icon}</span>
              <div>
                <p className="text-orange-200 font-bold text-sm">{unlock.title}</p>
                <p className="text-orange-300/70 text-xs mt-0.5 whitespace-pre-line">{unlock.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-lg py-3 rounded-2xl transition-all active:scale-95"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          次のDayへ！ →
        </motion.button>
      </motion.div>
    </div>
  )
}

// In-game contextual tooltip
interface InGameTooltipProps {
  message: string
  position?: 'top' | 'bottom'
}

function InGameTooltip({ message, position = 'bottom' }: InGameTooltipProps) {
  return (
    <motion.div
      className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-30 pointer-events-none`}
      initial={{ opacity: 0, y: position === 'top' ? 8 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg whitespace-nowrap">
        {message}
        <motion.span
          className="ml-1 inline-block"
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >←</motion.span>
      </div>
    </motion.div>
  )
}

// Day Start Banner
function DayStartBanner({ dayIndex }: { dayIndex: number }) {
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="bg-gradient-to-r from-red-700 to-orange-600 text-white font-black text-2xl px-10 py-3 rounded-b-2xl shadow-2xl">
        📅 Day {dayIndex} スタート！
      </div>
    </motion.div>
  )
}

// ─── Daily Bonus Modal ────────────────────────────────────────────────────────

interface DailyBonusModalProps {
  streak: number
  bonusIndex: number
  coins: number
  streakBroke: boolean
  onClose: () => void
}

function DailyBonusModal({ streak, bonusIndex, coins, streakBroke, onClose }: DailyBonusModalProps) {
  const isBigDay = bonusIndex === 6
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <motion.div
        className={`border-4 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center ${isBigDay ? 'bg-gradient-to-b from-yellow-700 to-orange-800 border-yellow-300' : 'bg-gradient-to-b from-orange-900 to-orange-950 border-orange-500'}`}
        initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {streakBroke ? (
          <>
            <div className="text-5xl mb-3">😢</div>
            <h2 className="text-2xl font-black text-orange-300 mb-2">ストリーク終了</h2>
            <p className="text-orange-200/80 mb-4">でもまた始めよう！</p>
          </>
        ) : (
          <>
            <motion.div
              className="text-6xl mb-3 inline-block"
              animate={{ rotate: [0, -15, 15, -10, 10, -5, 5, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              🎁
            </motion.div>
            <h2 className={`text-3xl font-black mb-1 ${isBigDay ? 'text-yellow-200' : 'text-orange-300'}`}>
              デイリーボーナス！
            </h2>
            <p className="text-orange-200/80 mb-2">{streak}日連続プレイ中🔥</p>
          </>
        )}
        <div className="flex justify-center gap-1 mb-4">
          {DAILY_BONUS_COINS.map((c, i) => (
            <div key={i} className={`flex flex-col items-center px-1 ${i === bonusIndex ? 'scale-110' : ''}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold
                ${i < bonusIndex ? 'bg-orange-600 border-orange-400 text-white' :
                  i === bonusIndex ? 'bg-yellow-400 border-yellow-200 text-black' :
                  'bg-orange-950 border-orange-700 text-orange-500'}`}>
                {i === 6 ? '🌟' : c}
              </div>
              <div className="text-orange-400/50 text-xs mt-0.5">{i + 1}日</div>
            </div>
          ))}
        </div>
        <motion.div
          className={`text-4xl font-black mb-4 ${isBigDay ? 'text-yellow-300' : 'text-yellow-400'}`}
          initial={{ scale: 0.5 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          +{coins} コイン！
        </motion.div>
        <motion.button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-lg py-3 rounded-2xl"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          受け取る！
        </motion.button>
      </motion.div>
    </div>
  )
}

// ─── Skill Tree Screen ────────────────────────────────────────────────────────

interface SkillTreeScreenProps {
  skillTree: SkillTree
  totalCoins: number
  onUpgrade: (branch: keyof SkillTree) => void
  onBack: () => void
}

const SKILL_BRANCHES: Array<{ key: keyof SkillTree; emoji: string; name: string; descriptions: string[] }> = [
  { key: 'cookSpeed', emoji: '🍳', name: '調理速度', descriptions: ['調理時間 -10%', '調理時間 -20%', '調理時間 -30%'] },
  { key: 'patience', emoji: '😊', name: '接客力', descriptions: ['お客の待ち時間 +10%', 'お客の待ち時間 +20%', 'お客の待ち時間 +30%'] },
  { key: 'luck', emoji: '⭐', name: '運', descriptions: ['VIP出現率 +5%\nコンボ確率 +5%', 'VIP出現率 +10%\nコンボ確率 +10%', 'VIP出現率 +15%\nコンボ確率 +20%'] },
]

function SkillTreeScreen({ skillTree, totalCoins, onUpgrade, onBack }: SkillTreeScreenProps) {
  return (
    <main className="min-h-screen flex flex-col items-center p-4 select-none">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⬆️</div>
          <h1 className="text-3xl font-black text-orange-300">スキルツリー</h1>
          <p className="text-yellow-400 font-bold mt-1">💰 所持コイン: {totalCoins.toLocaleString()}</p>
        </div>
        <div className="space-y-4 mb-6">
          {SKILL_BRANCHES.map(branch => {
            const currentLevel = skillTree[branch.key]
            return (
              <div key={branch.key} className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{branch.emoji}</span>
                  <span className="text-orange-200 font-black text-base">{branch.name}</span>
                  <span className="ml-auto text-orange-400/60 text-sm">Lv {currentLevel}/3</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(lv => {
                    const isUnlocked = currentLevel >= lv
                    const canUpgrade = currentLevel === lv - 1
                    const cost = SKILL_COSTS[lv - 1]
                    const canAfford = totalCoins >= cost
                    return (
                      <div key={lv} className={`flex-1 rounded-xl p-2 border text-center ${isUnlocked ? 'border-yellow-500 bg-yellow-900/30' : 'border-orange-800/40 bg-orange-950/60'}`}>
                        <div className={`text-xs mb-1 leading-tight whitespace-pre-line ${isUnlocked ? 'text-yellow-200' : 'text-orange-400/50'}`}>
                          {isUnlocked ? branch.descriptions[lv - 1] : `Lv${lv}\n${branch.descriptions[lv - 1]}`}
                        </div>
                        {isUnlocked ? (
                          <div className="text-yellow-400 text-xs font-bold">✅ 習得済</div>
                        ) : canUpgrade ? (
                          <button
                            onClick={() => onUpgrade(branch.key)}
                            disabled={!canAfford}
                            className={`w-full text-xs font-bold py-1 rounded-lg transition-all active:scale-95
                              ${canAfford ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-500' : 'bg-orange-900 text-orange-500 cursor-not-allowed'}`}
                          >
                            {cost}💰
                          </button>
                        ) : (
                          <div className="text-orange-600/40 text-xs">🔒 {cost}💰</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={onBack}
          className="w-full bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-bold py-3 rounded-xl transition-all active:scale-95">
          ← 戻る
        </button>
      </div>
    </main>
  )
}

// ─── Achievements Screen ──────────────────────────────────────────────────────

interface AchievementsScreenProps {
  unlocked: Set<AchievementId>
  onBack: () => void
}

function AchievementsScreen({ unlocked, onBack }: AchievementsScreenProps) {
  return (
    <main className="min-h-screen flex flex-col items-center p-4 select-none">
      <div className="max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏅</div>
          <h1 className="text-3xl font-black text-orange-300">実績</h1>
          <p className="text-orange-400/60 text-sm">{unlocked.size}/{ACHIEVEMENTS.length} 解除済み</p>
        </div>
        <div className="space-y-3 mb-6">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.has(ach.id)
            return (
              <div key={ach.id} className={`flex items-center gap-3 rounded-2xl p-4 border ${isUnlocked ? 'border-yellow-500/60 bg-yellow-900/20' : 'border-orange-800/40 bg-orange-950/60'}`}>
                <span className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-30'}`}>{ach.emoji}</span>
                <div>
                  <div className={`font-black text-sm ${isUnlocked ? 'text-yellow-200' : 'text-orange-500/50'}`}>
                    {isUnlocked ? ach.title : '???'}
                  </div>
                  <div className={`text-xs ${isUnlocked ? 'text-orange-200/70' : 'text-orange-600/40'}`}>
                    {ach.description}
                  </div>
                </div>
                {isUnlocked && <div className="ml-auto text-yellow-400 text-lg">✅</div>}
              </div>
            )
          })}
        </div>
        <button onClick={onBack}
          className="w-full bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-bold py-3 rounded-xl transition-all active:scale-95">
          ← 戻る
        </button>
      </div>
    </main>
  )
}

// ─── Achievement Toast ────────────────────────────────────────────────────────

function AchievementToast({ achievement, onDone }: { achievement: Achievement; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <motion.div
      className="fixed bottom-6 left-1/2 z-50 pointer-events-none"
      style={{ x: '-50%' }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="bg-gradient-to-r from-yellow-700 to-orange-600 border-2 border-yellow-400 rounded-2xl px-6 py-3 shadow-2xl flex items-center gap-3">
        <span className="text-3xl">{achievement.emoji}</span>
        <div>
          <div className="text-white font-black text-sm">実績解除！</div>
          <div className="text-yellow-200 font-bold text-xs">{achievement.title}</div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── VIP Overlay ──────────────────────────────────────────────────────────────

function VIPOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        className="bg-gradient-to-br from-yellow-600 to-amber-700 border-4 border-yellow-300 rounded-3xl px-10 py-8 shadow-2xl text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.div className="text-6xl mb-2" animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }}>
          👑
        </motion.div>
        <div className="text-2xl font-black text-white">VIPお客様登場！</div>
        <div className="text-yellow-200 text-sm mt-1">パーフェクトで +300コイン！</div>
      </motion.div>
    </div>
  )
}

// ─── Boss Warning ─────────────────────────────────────────────────────────────

function BossWarning({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        className="bg-gradient-to-br from-red-900 to-red-950 border-4 border-red-500 rounded-3xl px-10 py-8 shadow-2xl text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: [0, -5, 5, -3, 3, 0] }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <div className="text-5xl mb-2">⚠️</div>
        <div className="text-2xl font-black text-red-300">手強いお客様！</div>
        <div className="text-red-200/80 text-sm mt-1">パーフェクトで 2倍コイン！</div>
      </motion.div>
    </div>
  )
}

// ─── Challenge Complete Banner ────────────────────────────────────────────────

function ChallengeCompleteBanner({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <motion.div
        className="bg-gradient-to-br from-green-700 to-teal-700 border-4 border-green-400 rounded-3xl px-10 py-8 shadow-2xl text-center"
        initial={{ scale: 0.5, opacity: 0, y: -40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <div className="text-5xl mb-2">🎯</div>
        <div className="text-2xl font-black text-white">チャレンジ達成！</div>
        <div className="text-green-200 text-lg font-bold mt-1">+300 コイン！</div>
      </motion.div>
    </div>
  )
}

// ─── Weekly Leaderboard Screen ────────────────────────────────────────────────

function LeaderboardScreen({ onBack, currentScore, isPostGame, onNameSubmit }: {
  onBack: () => void
  currentScore?: number
  isPostGame?: boolean
  onNameSubmit?: (name: string) => void
}) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([])
  const [nameInput, setNameInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    setBoard(loadWeeklyLeaderboard())
    const updateCountdown = () => {
      const next = getNextMonday()
      const ms = next.getTime() - Date.now()
      setCountdown(ms > 0 ? formatCountdown(ms) : '間もなくリセット')
    }
    updateCountdown()
    const iv = setInterval(updateCountdown, 60000)
    return () => clearInterval(iv)
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
    saveWeeklyLeaderboard(newBoard)
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
          <h1 className="text-3xl font-black text-orange-300">今週のランキング 🏆</h1>
          <p className="text-orange-400/60 text-xs mt-1">次のリセットまで: {countdown}</p>
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
            <div className="p-8 text-center text-orange-400/50 text-sm">今週はまだ記録がありません</div>
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

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function MalatangGame() {
  const [phase, setPhase] = useState<GamePhase>('title')
  const [tutorialStep, setTutorialStep] = useState(0)
  const [isTutorialActive, setIsTutorialActive] = useState(false)

  // ── New: Game Theory Features ────────────────────────────────────────────────
  // Daily bonus
  const [dailyBonusInfo, setDailyBonusInfo] = useState<{ streak: number; bonusIndex: number; coins: number; streakBroke: boolean } | null>(null)
  const [bonusCoinsPending, setBonusCoinsPending] = useState(0)
  // Skill tree
  const [skillTree, setSkillTree] = useState<SkillTree>({ cookSpeed: 0, patience: 0, luck: 0 })
  const [totalCoins, setTotalCoins] = useState(0)
  // Achievements
  const [achievements, setAchievements] = useState<Set<AchievementId>>(new Set())
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null)
  // Daily challenge
  const [dailyChallenge] = useState<DailyChallenge>(() => getTodayChallenge())
  const [challengeCompleted, setChallengeCompleted] = useState(false)
  const [showChallengeBanner, setShowChallengeBanner] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({ perfectOrders: 0, combos: 0, spicyCorrect: 0, timeBonus: 0, vipSatisfied: 0, score: 0 })
  // VIP / Boss
  const [showVIPOverlay, setShowVIPOverlay] = useState(false)
  const [showBossWarning, setShowBossWarning] = useState(false)
  const [spicyCorrectCount, setSpicyCorrectCount] = useState(0)

  // Staged difficulty
  const [shownDayBanner, setShownDayBanner] = useState(false)
  const [showDayBanner, setShowDayBanner] = useState(false)
  const [shownTooltips, setShownTooltips] = useState<Set<string>>(new Set())
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [conveyorNewBadgeUntil, setConveyorNewBadgeUntil] = useState<number>(0)
  const [pendingDayClear, setPendingDayClear] = useState<number | null>(null) // dayIndex that just cleared

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

  // Visual effects
  const [screenShake, setScreenShake] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [activeCoinBurst, setActiveCoinBurst] = useState(false)
  const [lastCoinAmount, setLastCoinAmount] = useState(0)
  const bgm = useBGM()

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

  // ── Initialize localStorage-based state on mount ─────────────────────────────

  useEffect(() => {
    const st = loadSkillTree()
    setSkillTree(st)
    const tc = loadTotalCoins()
    setTotalCoins(tc)
    const ach = loadAchievements()
    setAchievements(ach)
    const challengeDone = isDailyChallengeCompleted()
    setChallengeCompleted(challengeDone)

    // Check daily bonus
    const bonus = checkDailyBonus()
    if (bonus.shouldShow) {
      const streakBroke = bonus.streak === 1 && bonus.bonusIndex === 0
      setDailyBonusInfo({ streak: bonus.streak, bonusIndex: bonus.bonusIndex, coins: bonus.coins, streakBroke })
      setBonusCoinsPending(bonus.coins)
      savePendingBonusCoins(bonus.coins)
      // Check achievement streak3
      if (bonus.streak >= 3) {
        setAchievements(prev => {
          if (prev.has('streak3')) return prev
          const next = new Set(prev)
          next.add('streak3')
          saveAchievements(next)
          setPendingAchievement(ACHIEVEMENTS.find(a => a.id === 'streak3') ?? null)
          return next
        })
      }
    } else {
      // Load pending bonus from previous session if not yet used
      const pending = loadPendingBonusCoins()
      if (pending > 0) {
        setBonusCoinsPending(pending)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Now ticker for anger meters ──────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    const interval = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(interval)
  }, [phase])

  // ── Anger overflow ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') return
    const angerEnabled = getDayConfig(dayIndex).hasAngerMeter
    if (!angerEnabled) return // customers wait patiently on early days
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
    if (!getDayConfig(dayIndex).hasRival) return
    rivalRef.current = setInterval(() => {
      setRivalScore(prev => prev + Math.floor(Math.random() * 15) + 5)
    }, 4000)
    return () => { if (rivalRef.current) clearInterval(rivalRef.current) }
  }, [phase, dayIndex])

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

  // Move ready items into pot — run as a plain effect, not inside a state updater
  useEffect(() => {
    const newlyReady = cookingItems.filter(ci => ci.ready)
    if (newlyReady.length === 0) return

    // Remove ready items from cooking queue
    setCookingItems(prev => prev.filter(ci => !ci.ready))

    // Move each ready item into its pot and trigger animations
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
  }, [cookingItems])

  // ── Conveyor belt spawner ─────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'p2playing') {
      if (conveyorSpawnRef.current) clearInterval(conveyorSpawnRef.current)
      return
    }
    if (!getDayConfig(dayIndex).hasConveyor) {
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
  }, [phase, shopStage, dayIndex])

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

  // Keep a ref to the latest handleServe so the timer effect never goes stale
  const handleServeRef = useRef<(potIndex: number, timedOut?: boolean) => void>(() => {})

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

  const spawnCustomersForQueue = useCallback((lv: number, stage: ShopStage, prevOrd: CustomerOrder | null, currentStock: Stock, startIdx: number, dayConfig?: DayConfig, luckLv: 0 | 1 | 2 | 3 = 0, patienceLv: 0 | 1 | 2 | 3 = 0) => {
    const numToSpawn = Math.min(3 + Math.floor(Math.random() * 2), CUSTOMERS_PER_DAY)
    const newQueue: QueuedCustomer[] = []
    let prev = prevOrd
    for (let i = 0; i < numToSpawn; i++) {
      const globalIdx = startIdx + i
      // Every 5th customer (0-indexed: 4, 9, 14...) is a boss
      const isBossSlot = globalIdx > 0 && (globalIdx + 1) % 5 === 0
      const order = generateOrder(lv, prev, globalIdx, stage, dayConfig, luckLv, isBossSlot)
      // Filter to available stock — on Day 1 (no conveyor) restrict to the 8 visible grid items
      const visibleIds = (dayConfig && !dayConfig.hasConveyor)
        ? getUnlockedIngredients(stage).slice(0, 8).map(i => i.id)
        : NON_SPICE_IDS
      const availableIds = visibleIds.filter(id => (currentStock[id] ?? 0) > 0)
      const filtered = order.ingredients.filter(id => availableIds.includes(id))
      const maxIng = dayConfig ? dayConfig.maxIngredients : 5
      const finalIngredients = filtered.length >= 1 ? filtered.slice(0, maxIng) : shuffle(availableIds).slice(0, Math.max(1, Math.min(2, Math.min(maxIng, availableIds.length))))
      const finalOrder = { ...order, ingredients: finalIngredients }
      const id = queueIdRef.current++
      newQueue.push({
        id,
        order: finalOrder,
        angerStart: Date.now(),
        angerDuration: getAngerDuration(order.customerType, stage, patienceLv),
        left: false,
        reactionEmoji: null,
      })
      prev = finalOrder
    }
    return newQueue
  }, [])

  // ── Game flow ─────────────────────────────────────────────────────────────────

  // p2: true = starting P2's turn (phase='p2playing'), false = starting P1's turn or solo
  // isP2ModeVal: whether the overall session is 2-player (preserved across P1→P2 transition)
  const beginPlaying = useCallback((resetAll = true, currentStock?: Stock, p2 = false, isP2ModeVal?: boolean, startDayIndex?: number) => {
    const lv = 1
    const stage: ShopStage = 1
    const stockToUse = currentStock ?? buildInitialStock()
    const startDay = startDayIndex ?? 1
    const dayCfg = getDayConfig(startDay)

    if (resetAll) {
      // Add pending bonus coins to initial score
      const bonus = loadPendingBonusCoins()
      setScore(bonus)
      setBonusCoinsPending(0)
      savePendingBonusCoins(0)
      setLevel(lv)
      setShopStage(stage)
      setNumPots(dayCfg.numPots)
      setCustomerIndex(0)
      setDayIndex(startDay)
      setCombo(0)
      setSatisfaction(100)
      setStock(stockToUse)
      setProcurementBudget(500)
      setShownTooltips(new Set())
      setActiveTooltip(null)
      setGameStats({ perfectOrders: 0, combos: 0, spicyCorrect: 0, timeBonus: 0, vipSatisfied: 0, score: 0 })
      setSpicyCorrectCount(0)
      setChallengeCompleted(isDailyChallengeCompleted())
      // Only reset rival & isP2Mode for a fresh solo game
      if (isP2ModeVal === undefined && !p2) {
        setRivalScore(0)
        setIsP2Mode(false)
      } else if (isP2ModeVal !== undefined) {
        setIsP2Mode(isP2ModeVal)
      }
    }

    const st = loadSkillTree()
    const queue = spawnCustomersForQueue(lv, stage, null, stockToUse, 0, dayCfg, st.luck, st.patience)
    setCustomerQueue(queue)
    setActiveCustomerId(queue[0]?.id ?? null)
    setPrevOrder(null)
    setPotIngredients(Array.from({ length: dayCfg.numPots }, () => []))
    setPotSpices(Array.from({ length: dayCfg.numPots }, () => ''))
    setSelectedPot(0)
    setServeFeedback(null)
    setIsServing(false)
    setCookingItems([])
    setConveyorItems([])

    // Show VIP/Boss announcement for the first customer if applicable
    const firstOrder = queue[0]?.order ?? null
    if (firstOrder?.customerType === 'vip') {
      setShowVIPOverlay(true)
      haptic([100, 50, 100])
    } else if (firstOrder?.customerType === 'boss') {
      setShowBossWarning(true)
    }

    // Show day start banner
    setShowDayBanner(true)
    setTimeout(() => setShowDayBanner(false), 2500)

    // Show "NEW! コンベア" badge when conveyor first appears
    if (dayCfg.hasConveyor) {
      setConveyorNewBadgeUntil(Date.now() + 30000)
    }

    const t = firstOrder ? getTimerForLevel(lv, firstOrder.customerType, dayCfg, st.cookSpeed) : dayCfg.timerSeconds
    startTimer(t)
    setPhase(p2 ? 'p2playing' : 'playing')
  }, [startTimer, spawnCustomersForQueue])

  const startGame = useCallback((p2 = false) => {
    // Always start from Day 1 — the staged system IS the onboarding
    // For 2P mode: start P1's turn (p2=false) but mark session as 2P (isP2ModeVal=p2)
    beginPlaying(true, undefined, false, p2 ? true : undefined, 1)
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

    const serveDayCfg = getDayConfig(dayIndex)
    // On Day 1 spice is always correct (no choice needed)
    const spiceCorrect = !serveDayCfg.hasSpiceChoice || selectedSpice === order.spiceLevel
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

    // VIP/Boss reward multipliers
    const isVIP = order.customerType === 'vip'
    const isBoss = order.customerType === 'boss'
    const rewardMult = isVIP ? 3 : isBoss ? 2 : 1

    if (isPerfect) {
      const timeBonus = timedOut ? 0 : Math.floor(timeLeft * 2)
      delta += (100 + timeBonus) * multiplier * rewardMult
      if (isVIP) delta += 200 // extra VIP bonus
      playSound('coin')
      haptic([50, 30, 100])

      const selectedArr = Array.from(selected)
      const secretCombo = checkSecretCombo(selectedArr)
      if (secretCombo) {
        delta += secretCombo.bonus
        setComboOverlay({ name: secretCombo.name, bonus: secretCombo.bonus, emoji: secretCombo.emoji })
        setDiscoveredCombos(prev => new Set([...Array.from(prev), secretCombo.name]))
        playSound('combo')
        haptic([50, 30, 50, 30, 50])
      }
    } else {
      allCorrect = false
      playSound('error')
      haptic([200])
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

    // ── Achievement & Stats tracking ──────────────────────────────────────────
    if (isPerfect) {
      const timeBonusForStats = timedOut ? 0 : Math.floor(timeLeft * 2)
      const isSpicyOrder = order.spiceLevel === 'spice3'
      const newSpicyCount = isSpicyOrder ? spicyCorrectCount + 1 : spicyCorrectCount
      if (isSpicyOrder) setSpicyCorrectCount(newSpicyCount)

      setGameStats(prev => {
        const updated: GameStats = {
          perfectOrders: prev.perfectOrders + 1,
          combos: Math.max(prev.combos, newCombo),
          spicyCorrect: isSpicyOrder ? prev.spicyCorrect + 1 : prev.spicyCorrect,
          timeBonus: prev.timeBonus + timeBonusForStats,
          vipSatisfied: isVIP ? prev.vipSatisfied + 1 : prev.vipSatisfied,
          score: newScore,
        }
        // Check daily challenge
        if (!challengeCompleted && dailyChallenge.checkFn(updated)) {
          setChallengeCompleted(true)
          markDailyChallengeCompleted()
          setShowChallengeBanner(true)
          setScore(s => s + 300)
        }
        return updated
      })

      // Check achievements
      setAchievements(prev => {
        const next = new Set(prev)
        let newAch: Achievement | null = null
        if (!next.has('firstPerfect')) {
          next.add('firstPerfect')
          newAch = ACHIEVEMENTS.find(a => a.id === 'firstPerfect') ?? null
        } else if (!next.has('combo3') && newCombo >= 3) {
          next.add('combo3')
          newAch = ACHIEVEMENTS.find(a => a.id === 'combo3') ?? null
          haptic([50, 30, 50, 30, 50])
        } else if (!next.has('speedStar') && !timedOut && timeLeft >= 20) {
          next.add('speedStar')
          newAch = ACHIEVEMENTS.find(a => a.id === 'speedStar') ?? null
        } else if (!next.has('coins100') && newScore >= 100) {
          next.add('coins100')
          newAch = ACHIEVEMENTS.find(a => a.id === 'coins100') ?? null
        } else if (!next.has('spicyMaster') && newSpicyCount >= 5) {
          next.add('spicyMaster')
          newAch = ACHIEVEMENTS.find(a => a.id === 'spicyMaster') ?? null
        }
        if (newAch) {
          saveAchievements(next)
          setPendingAchievement(newAch)
        }
        return next
      })
    }

    // Update totalCoins in localStorage
    saveTotalCoins(Math.max(0, newScore))
    setTotalCoins(Math.max(0, newScore))

    // Customer reaction
    const reactionEmoji = isPerfect ? '😊' : '😤'
    setCustomerQueue(prev => prev.map(qc => qc.id === activeCustomerId ? { ...qc, reactionEmoji } : qc))

    const id = coinIdRef.current++
    setCoinAnimations(prev => [...prev, { id, x: 50, y: 50, amount: Math.abs(delta), positive: delta >= 0 }])
    setTimeout(() => setCoinAnimations(prev => prev.filter(c => c.id !== id)), 900)

    // Visual effects
    if (isPerfect) {
      setActiveCoinBurst(true)
      setLastCoinAmount(delta)
      setTimeout(() => setActiveCoinBurst(false), 800)
      if (newCombo >= 3) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 2000)
      }
    } else {
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 500)
    }

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
      if (newSatisfaction <= 0) {
        stopTimer()
        bgm.stop()
        setIsServing(false)
        // In 2P mode: if P1 just finished (playing phase), save P1 score and start P2
        if (isP2Mode && phase === 'playing') {
          setP1Score(newScore)
          beginPlaying(false, undefined, true)
        } else {
          setPhase(isP2Mode ? 'p2result' : 'result')
          setPostGameScore(newScore)
        }
        return
      }

      // Remove served customer, advance queue
      setCustomerQueue(prev => {
        const remaining = prev.filter(qc => qc.id !== activeCustomerId)
        const nextActive = remaining.find(qc => !qc.left)
        const currentDayCfg = getDayConfig(dayIndex)
        if (nextActive) {
          setActiveCustomerId(nextActive.id)
          const st = loadSkillTree()
          const t = getTimerForLevel(level, nextActive.order.customerType, currentDayCfg, st.cookSpeed)
          // Show VIP/Boss overlay for next customer
          if (nextActive.order.customerType === 'vip') {
            setShowVIPOverlay(true)
            haptic([100, 50, 100])
          } else if (nextActive.order.customerType === 'boss') {
            setShowBossWarning(true)
          }
          startTimer(t)
          setIsServing(false)
        } else {
          // Need to advance day or end game
          const indexInDay = nextCustomerIndex % CUSTOMERS_PER_DAY
          if (indexInDay === 0 && nextCustomerIndex > 0) {
            stopTimer()
            const completedDay = dayIndex
            const nextDay = Math.floor(nextCustomerIndex / CUSTOMERS_PER_DAY) + 1
            setDayIndex(nextDay)
            setProcurementBudget(Math.max(0, newScore))
            setIsServing(false)
            // Check master achievement (Day 5 clear)
            if (completedDay >= 5) {
              setAchievements(prev => {
                if (prev.has('master')) return prev
                const next = new Set(prev)
                next.add('master')
                saveAchievements(next)
                setPendingAchievement(ACHIEVEMENTS.find(a => a.id === 'master') ?? null)
                return next
              })
            }
            // Show day clear screen (not procurement yet — procurement gated by day config)
            setPendingDayClear(completedDay)
            setPhase('dayclear')
          } else if (nextCustomerIndex >= CUSTOMERS_PER_DAY * MAX_DAYS) {
            stopTimer()
            setIsServing(false)
            if (isP2Mode && phase === 'playing') {
              setP1Score(newScore)
              beginPlaying(false, undefined, true)
            } else {
              setPhase(isP2Mode ? 'p2result' : 'result')
              setPostGameScore(newScore)
            }
          } else {
            // Spawn new batch
            const newLevel = nextCustomerIndex >= 10 ? 3 : nextCustomerIndex >= 5 ? 2 : 1
            const newStage = getStageFromScore(newScore)
            setLevel(newLevel)
            const st = loadSkillTree()
            const newQueue = spawnCustomersForQueue(newLevel, newStage, order, newStock, nextCustomerIndex, currentDayCfg, st.luck, st.patience)
            setCustomerQueue(newQueue)
            const nextCust = newQueue.find(qc => !qc.left)
            if (nextCust) {
              setActiveCustomerId(nextCust.id)
              const t = getTimerForLevel(newLevel, nextCust.order.customerType, currentDayCfg, st.cookSpeed)
              // Show VIP/Boss overlay for next customer
              if (nextCust.order.customerType === 'vip') {
                setShowVIPOverlay(true)
                haptic([100, 50, 100])
              } else if (nextCust.order.customerType === 'boss') {
                setShowBossWarning(true)
              }
              startTimer(t)
            }
            setIsServing(false)
          }
        }
        return remaining
      })
    }, 1400)
  }, [isServing, customerQueue, activeCustomerId, potIngredients, potSpices, combo, timeLeft, satisfaction, score, stock, customerIndex, level, dayIndex, isP2Mode, phase, stopTimer, startTimer, spawnCustomersForQueue, beginPlaying, challengeCompleted, dailyChallenge, spicyCorrectCount])

  // Keep ref current so the timer effect always calls the latest version
  useEffect(() => { handleServeRef.current = handleServe }, [handleServe])

  // Auto-serve when timer hits 0 — uses ref to avoid stale closure
  useEffect(() => {
    if ((phase === 'playing' || phase === 'p2playing') && !isTutorialActive && timeLeft === 0 && !isServing) {
      handleServeRef.current(0, true)
    }
  }, [timeLeft, phase, isTutorialActive, isServing])

  // BGM tempo based on time urgency
  useEffect(() => {
    if (phase === 'playing' || phase === 'p2playing') {
      const urgency = maxTime > 0 ? Math.max(0, 1 - timeLeft / maxTime) : 0
      bgm.setTempo(urgency)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  // ── Contextual one-shot tooltips for Day 1 ────────────────────────────────────

  useEffect(() => {
    if (dayIndex !== 1) { setActiveTooltip(null); return }
    if (phase !== 'playing') return

    // Show customer tooltip on first customer
    if (!shownTooltips.has('customer') && customerIndex === 0 && customerQueue.length > 0) {
      setActiveTooltip('customer')
      setShownTooltips(prev => new Set([...Array.from(prev), 'customer']))
      const t = setTimeout(() => setActiveTooltip(null), 4000)
      return () => clearTimeout(t)
    }
  }, [dayIndex, phase, customerIndex, customerQueue.length, shownTooltips])

  useEffect(() => {
    if (dayIndex !== 1) return
    const hasSomethingInPot = potIngredients.some(p => p.length > 0)
    if (hasSomethingInPot && !shownTooltips.has('pot')) {
      setActiveTooltip('pot')
      setShownTooltips(prev => new Set([...Array.from(prev), 'pot']))
      const t = setTimeout(() => setActiveTooltip(null), 3000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potIngredients])

  const handleProcurementDone = useCallback((newStock: Stock, spent: number) => {
    const newScore = Math.max(0, score - spent)
    setScore(newScore)
    setStock(newStock)
    // Resume game
    const lv = dayIndex >= 3 ? 3 : dayIndex >= 2 ? 2 : 1
    setLevel(lv)
    const dayCfg = getDayConfig(dayIndex)
    const stage = getStageFromScore(newScore)
    setShopStage(stage)
    const newPots = dayCfg.numPots
    setNumPots(newPots)
    const queue = spawnCustomersForQueue(lv, stage, prevOrder, newStock, customerIndex, dayCfg)
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
    // Show day banner
    setShowDayBanner(true)
    setTimeout(() => setShowDayBanner(false), 2500)
    if (nextCust) {
      const t = getTimerForLevel(lv, nextCust.order.customerType, dayCfg)
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

  // ── Day Clear handler ─────────────────────────────────────────────────────────

  const handleDayClearNext = useCallback(() => {
    const completedDay = pendingDayClear ?? dayIndex - 1
    const nextDay = completedDay + 1
    const nextDayCfg = getDayConfig(nextDay)
    setPendingDayClear(null)

    if (nextDayCfg.hasProcurement) {
      // Go to procurement phase
      setPhase('procurement')
    } else {
      // Start next day directly
      const lv = nextDay >= 3 ? 3 : nextDay >= 2 ? 2 : 1
      setLevel(lv)
      const stage = getStageFromScore(score)
      setShopStage(stage)
      const newPots = nextDayCfg.numPots
      setNumPots(newPots)
      const queue = spawnCustomersForQueue(lv, stage, prevOrder, stock, customerIndex, nextDayCfg)
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
      setShowDayBanner(true)
      setTimeout(() => setShowDayBanner(false), 2500)
      if (nextDayCfg.hasConveyor) {
        setConveyorNewBadgeUntil(Date.now() + 30000)
      }
      if (nextCust) {
        const t = getTimerForLevel(lv, nextCust.order.customerType, nextDayCfg)
        startTimer(t)
      }
      setPhase(isP2Mode ? 'p2playing' : 'playing')
    }
  }, [pendingDayClear, dayIndex, score, stock, prevOrder, customerIndex, isP2Mode, startTimer, spawnCustomersForQueue])

  // ── Skill tree upgrade handler ────────────────────────────────────────────────

  const handleSkillUpgrade = useCallback((branch: keyof SkillTree) => {
    const currentLevel = skillTree[branch]
    if (currentLevel >= 3) return
    if (currentLevel < 0 || currentLevel > 2) return
    const cost: number = SKILL_COSTS[currentLevel as 0 | 1 | 2]
    if (totalCoins < cost) return
    const newTree = { ...skillTree, [branch]: (currentLevel + 1) as 0 | 1 | 2 | 3 }
    setSkillTree(newTree)
    saveSkillTree(newTree)
    const newTotal = totalCoins - cost
    setTotalCoins(newTotal)
    saveTotalCoins(newTotal)
  }, [skillTree, totalCoins])

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

  // ── Skill Tree phase ────────────────────────────────────────────────────────────

  if (phase === 'skillTree') {
    return (
      <SkillTreeScreen
        skillTree={skillTree}
        totalCoins={totalCoins}
        onUpgrade={handleSkillUpgrade}
        onBack={() => setPhase('title')}
      />
    )
  }

  // ── Achievements phase ──────────────────────────────────────────────────────────

  if (phase === 'achievements') {
    return (
      <AchievementsScreen
        unlocked={achievements}
        onBack={() => setPhase('title')}
      />
    )
  }

  // ── Daily Bonus phase ───────────────────────────────────────────────────────────

  if (phase === 'dailyBonus' && dailyBonusInfo) {
    return (
      <div className="fixed inset-0 z-50">
        <DailyBonusModal
          streak={dailyBonusInfo.streak}
          bonusIndex={dailyBonusInfo.bonusIndex}
          coins={dailyBonusInfo.coins}
          streakBroke={dailyBonusInfo.streakBroke}
          onClose={() => { setDailyBonusInfo(null); setPhase('title') }}
        />
      </div>
    )
  }

  // ── Title screen ───────────────────────────────────────────────────────────────

  if (phase === 'title') {
    const board = loadWeeklyLeaderboard()
    const titleChars = 'マーラータン屋さん'.split('')
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-4 select-none"
        style={{
          background: 'linear-gradient(135deg, #1C0A00 0%, #3D1200 30%, #1C0A00 60%, #2D0A0A 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-10"
              style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 13 + 10) % 90}%` }}
              animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
            >
              {['🍲', '🌶️', '🥬', '🦐', '🥩', '🍜'][i % 6]}
            </motion.div>
          ))}
        </div>

        <div className="text-center max-w-sm w-full relative z-10">
          {/* Animated pot logo */}
          <motion.div
            className="text-8xl mb-4 inline-block"
            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🍲
          </motion.div>

          {/* Staggered title letters */}
          <h1 className="text-4xl font-black mb-2 drop-shadow-lg flex justify-center flex-wrap gap-0">
            {titleChars.map((ch, i) => (
              <motion.span
                key={i}
                className="text-orange-300"
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 20 }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="text-orange-400 text-lg mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            麻辣烫 Shop Game
          </motion.p>
          <motion.p
            className="text-orange-300/30 text-xs mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            v5.0.0
          </motion.p>
          <motion.p
            className="text-orange-300/70 text-sm mb-8 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            お客さんの注文通りに食材を選んで、おいしいマーラータンを作ろう！
            コンベアから食材を取り、複数の鍋で同時に調理しよう！
          </motion.p>

          {/* Daily challenge display */}
          <motion.div
            className="bg-green-950/60 border border-green-700/60 rounded-2xl px-4 py-3 mb-4 text-left"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-lg">🎯</span>
              <span className="text-green-300 font-bold text-xs">今日のチャレンジ</span>
              {challengeCompleted && <span className="ml-auto text-green-400 text-xs font-bold">✅ 達成済み！</span>}
            </div>
            <p className="text-green-200/80 text-xs">{dailyChallenge.description}</p>
          </motion.div>

          {/* Streak info */}
          {bonusCoinsPending > 0 && (
            <motion.div
              className="bg-yellow-950/60 border border-yellow-700/60 rounded-2xl px-4 py-2 mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <span className="text-yellow-300 text-sm font-bold">🎁 デイリーボーナス +{bonusCoinsPending}コイン 準備完了！</span>
            </motion.div>
          )}

          <motion.div
            className="space-y-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              onClick={() => {
                if (dailyBonusInfo) { setPhase('dailyBonus'); return }
                bgm.start(); startGame(false)
              }}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-xl px-12 py-4 rounded-full shadow-xl"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              🍲 1人プレイ
            </motion.button>

            <motion.button
              onClick={() => {
                bgm.start()
                setIsP2Mode(true)
                setP1Score(0)
                // Achievement: teamwork
                setAchievements(prev => {
                  if (prev.has('teamwork')) return prev
                  const next = new Set(prev)
                  next.add('teamwork')
                  saveAchievements(next)
                  setPendingAchievement(ACHIEVEMENTS.find(a => a.id === 'teamwork') ?? null)
                  return next
                })
                startGame(true)
              }}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-600 text-white font-black text-xl px-12 py-4 rounded-full shadow-xl"
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(168,85,247,0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              👥 2人対戦モード
            </motion.button>

            <div className="grid grid-cols-3 gap-2">
              <motion.button
                onClick={() => { setPostGameScore(undefined); setPhase('leaderboard') }}
                className="bg-orange-950/80 border border-orange-700 text-orange-300 font-bold text-sm px-3 py-3 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                🏆 ランキング
              </motion.button>
              <motion.button
                onClick={() => setPhase('skillTree')}
                className="bg-orange-950/80 border border-orange-700 text-orange-300 font-bold text-sm px-3 py-3 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ⬆️ スキル
              </motion.button>
              <motion.button
                onClick={() => setPhase('achievements')}
                className="bg-orange-950/80 border border-orange-700 text-orange-300 font-bold text-sm px-3 py-3 rounded-full"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                🏅 実績
              </motion.button>
            </div>
          </motion.div>

          {board.length > 0 && (
            <motion.div
              className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <p className="text-orange-400/70 text-xs mb-2 font-bold">🏆 今週のTOP 3</p>
              {board.slice(0, 3).map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm mb-1">
                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <span className="text-orange-200 flex-1">{entry.name}</span>
                  <span className="text-yellow-400 font-bold">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </motion.div>
          )}

          <p className="text-orange-300/40 text-xs mt-4">Day 1から段階的に難しくなります！</p>
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
      <main className="min-h-screen flex flex-col items-center justify-center p-4 select-none"
        style={{ background: 'linear-gradient(135deg, #1C0A00, #2D0A0A, #1C0A00)' }}
      >
        {score >= 300 && <ConfettiEffect active={true} />}
        <motion.div
          className="text-center max-w-md w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {score >= 300 ? '🎉' : '😢'}
          </motion.div>
          <h1 className="text-4xl font-black text-orange-300 mb-2">ゲーム終了</h1>
          <p className="text-orange-400 mb-6">{rank}</p>

          <div className="bg-orange-950/60 border border-orange-800/40 rounded-2xl p-8 mb-4 relative overflow-hidden">
            {/* Glow bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent pointer-events-none" />
            <p className="text-orange-300/70 text-sm mb-2">最終スコア</p>
            <motion.p
              className="text-6xl font-black text-yellow-400"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 20 }}
            >
              {score.toLocaleString()}
            </motion.p>
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
            <button onClick={() => setPhase('skillTree')}
              className="bg-orange-950 border border-orange-700 hover:bg-orange-900
                text-orange-300 font-bold text-lg px-6 py-3 rounded-full transition-all active:scale-95">
              ⬆️ スキル
            </button>
            <button onClick={() => setPhase('title')}
              className="bg-orange-950 border border-orange-700 hover:bg-orange-900
                text-orange-300 font-bold text-lg px-8 py-3 rounded-full transition-all active:scale-95">
              🏠 タイトル
            </button>
          </div>
        </motion.div>
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
            <button onClick={() => { setP1Score(0); beginPlaying(true, undefined, false, true) }}
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

  // ── Day Clear screen ───────────────────────────────────────────────────────────

  if (phase === 'dayclear') {
    const displayDay = pendingDayClear ?? dayIndex - 1
    return (
      <main className="min-h-screen flex items-center justify-center p-4 select-none"
        style={{ background: 'linear-gradient(135deg, #1C0A00, #2D0A0A, #1C0A00)' }}
      >
        <ConfettiEffect active={true} />
        <DayClearModal dayIndex={displayDay} score={score} onNext={handleDayClearNext} />
      </main>
    )
  }

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

  const dayCfg = getDayConfig(dayIndex)
  const activeCustomer = customerQueue.find(qc => qc.id === activeCustomerId && !qc.left) ?? null
  const order = activeCustomer?.order ?? null
  const timerPct = (timeLeft / maxTime) * 100
  const timerColor = timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-yellow-500' : 'bg-red-500'
  const comboMultiplier = Math.min(3, Math.max(1, combo + 1))
  const customerIndexInDay = customerIndex % CUSTOMERS_PER_DAY
  const showConveyor = dayCfg.hasConveyor
  const showConveyorNewBadge = showConveyor && Date.now() < conveyorNewBadgeUntil

  // For Day 1: static ingredient grid instead of conveyor
  const day1Ingredients = !showConveyor ? getUnlockedIngredients(shopStage).slice(0, 8) : []

  const spiceIngredients = dayCfg.hasSpiceChoice
    ? INGREDIENTS.filter(i => i.category === 'spice')
    : INGREDIENTS.filter(i => i.id === 'spice1') // only 普通 on Day 1

  const displayOrder = order

  return (
    <>
      <AnimatePresence>
        {comboOverlay && <ComboFlashOverlay combo={comboOverlay} onDone={() => setComboOverlay(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showVIPOverlay && <VIPOverlay onDone={() => setShowVIPOverlay(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showBossWarning && <BossWarning onDone={() => setShowBossWarning(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showChallengeBanner && <ChallengeCompleteBanner onDone={() => setShowChallengeBanner(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {pendingAchievement && <AchievementToast achievement={pendingAchievement} onDone={() => setPendingAchievement(null)} />}
      </AnimatePresence>
      {showRecipeBook && <RecipeBookModal discovered={discoveredCombos} onClose={() => setShowRecipeBook(false)} />}

      {/* Confetti for combo */}
      <ConfettiEffect active={showConfetti} />

      {/* Coin burst */}
      <CoinBurst active={activeCoinBurst} amount={lastCoinAmount} x={50} y={40} />

      {/* Day start banner */}
      <AnimatePresence>
        {showDayBanner && <DayStartBanner dayIndex={dayIndex} />}
      </AnimatePresence>

      {/* Drop animations */}
      <AnimatePresence>
        {dropAnimations.map(da => (
          <motion.div
            key={da.id}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
            initial={{ opacity: 1, y: -40, scale: 1.5 }}
            animate={{ opacity: 0, y: 10, scale: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-5xl">{da.emoji}</div>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.main
        className="min-h-screen flex flex-col p-3 gap-3 select-none max-w-5xl mx-auto"
        animate={screenShake ? { x: [-4, 4, -3, 3, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        style={{ background: 'linear-gradient(160deg, #1C0A00 0%, #2D1200 50%, #1C0A00 100%)' }}
      >

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-orange-300 text-base font-black">📅 Day {dayIndex}</span>
            <span className="text-orange-500/40 text-xs">|</span>
            <span className="text-orange-400 text-sm font-bold">{STAGE_INFO[shopStage].name}</span>
            <span className="text-orange-500/40 text-xs">|</span>
            <span className="text-orange-300/60 text-xs">{customerIndexInDay + 1}/{CUSTOMERS_PER_DAY}</span>
            {isP2Mode && phase === 'playing' && (
              <span className="bg-blue-700/60 text-blue-200 text-xs px-2 py-0.5 rounded-full font-bold">👤 P1のターン</span>
            )}
            {phase === 'p2playing' && (
              <span className="bg-purple-700/60 text-purple-200 text-xs px-2 py-0.5 rounded-full font-bold">👤 P2のターン</span>
            )}
            {!challengeCompleted && (
              <span className="text-green-400/70 text-xs truncate max-w-xs">🎯 {dailyChallenge.description}</span>
            )}
            {challengeCompleted && (
              <span className="text-green-400 text-xs font-bold">🎯✅</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {dayCfg.hasRival && (
              <span className="text-red-400/70 text-xs">🤖 ライバル: {rivalScore.toLocaleString()}</span>
            )}
            {combo >= 2 && (
              <span className="text-orange-200 text-xs font-black bg-orange-700/60 px-2 py-0.5 rounded-lg animate-pulse">
                {combo}連続🔥 ×{comboMultiplier}
              </span>
            )}
            <span className="text-yellow-400 font-black">💰 <AnimatedScore value={score} /></span>
            <button onClick={() => setShowRecipeBook(true)} className="text-orange-300 hover:text-orange-100 text-lg" title="レシピ本">
              📖
            </button>
          </div>
        </div>

        {/* Satisfaction — only shown when anger meter active */}
        {dayCfg.hasAngerMeter && <SatisfactionBar value={satisfaction} />}

        {/* Timer */}
        <div ref={timerRef2} className="w-full bg-orange-950 rounded-full h-3 overflow-hidden border border-orange-900 relative">
          <motion.div
            className={`h-full rounded-full ${timerColor}`}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
          {/* Shine */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full pointer-events-none" />
        </div>
        <div className={`text-center text-xs text-orange-300/70 -mt-1 ${timerPct < 25 ? 'animate-pulse text-red-400 font-bold' : ''}`}>
          ⏰ {timeLeft}秒
        </div>

        {/* Customer Queue — anger bar only shown when hasAngerMeter */}
        <div ref={customerRef} className="relative">
          {activeTooltip === 'customer' && (
            <InGameTooltip message="← ここを見て！注文を確認しよう" position="bottom" />
          )}
          <p className="text-orange-400/70 text-xs mb-1 font-bold">👥 お客さん</p>
          <CustomerQueue
            queue={customerQueue}
            activeCustomerId={activeCustomerId}
            now={dayCfg.hasAngerMeter ? now : 0}
            onSelectCustomer={() => {}}
          />
        </div>

        {/* Active customer order panel */}
        {displayOrder && (
          <div className={`rounded-2xl p-3 animate-fadeIn border ${
            displayOrder.customerType === 'vip' ? 'bg-yellow-950/60 border-yellow-500/60' :
            displayOrder.customerType === 'boss' ? 'bg-red-950/60 border-red-600/60' :
            'bg-orange-950/60 border-orange-700/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <Character
                  type={emojiToCharType(displayOrder.customerEmoji)}
                  expression={
                    activeCustomer?.reactionEmoji === '😊' ? 'happy'
                    : activeCustomer?.reactionEmoji === '😤' ? 'angry'
                    : 'excited'
                  }
                  size={56}
                />
                <span className="text-orange-300/70 text-xs">{displayOrder.customerName}</span>
                {dayCfg.hasSpecialCustomers && (() => {
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
                  {dayCfg.hasSpecialCustomers && displayOrder.customerType === 'allergic' && displayOrder.forbiddenIngredients.length > 0 && displayOrder.forbiddenIngredients.map(id => {
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

        {/* Ingredient Section — Conveyor (Day 2+) or Static Grid (Day 1) */}
        <div ref={ingredientsRef}>
          {showConveyor ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-orange-400/70 text-xs font-bold">🏭 コンベア（食材をクリックして取ろう！）</p>
                {showConveyorNewBadge && (
                  <span className="text-xs bg-green-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">NEW!</span>
                )}
              </div>
              <ConveyorBeltComponent
                items={conveyorItems}
                onGrab={grabConveyorItem}
                stage={shopStage}
                getIngredient={getIngredientById}
              />
            </>
          ) : (
            <>
              <p className="text-orange-400/70 text-xs mb-2 font-bold">🥘 食材を選ぼう！（タップして鍋に入れる）</p>
              <div className="grid grid-cols-4 gap-2">
                {day1Ingredients.map(ing => {
                  const isInPot = potIngredients.some(p => p.includes(ing.id))
                  const inOrder = displayOrder?.ingredients.includes(ing.id)
                  return (
                    <button
                      key={ing.id}
                      onClick={() => {
                        if (isServing) return
                        if (isInPot) return
                        playSound('sizzle')
                        const dropId = dropIdRef.current++
                        setDropAnimations(d => [...d, { id: dropId, emoji: ing.emoji }])
                        setTimeout(() => setDropAnimations(d => d.filter(x => x.id !== dropId)), 700)
                        setPotIngredients(pots => pots.map((p, i) => i === selectedPot ? [...p, ing.id] : p))
                      }}
                      className={`rounded-xl p-2 flex flex-col items-center gap-1 border-2 transition-all active:scale-95
                        ${isInPot ? 'border-green-500 bg-green-900/40 opacity-50' :
                          inOrder ? 'border-yellow-400 bg-yellow-900/50 shadow-lg shadow-yellow-500/30 animate-pulse scale-105' :
                          'border-orange-800/40 bg-orange-950/60 hover:border-orange-600'}`}
                    >
                      <span className="text-2xl">{ing.emoji}</span>
                      <span className={`text-xs font-bold ${inOrder && !isInPot ? 'text-yellow-300' : 'text-orange-200'}`}>{ing.name}</span>
                      {isInPot && <span className="text-green-400 text-xs">✅</span>}
                      {inOrder && !isInPot && <span className="text-yellow-400 text-xs">👆</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
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
                    if (isServing) return
                    setPotSpices(spices => spices.map((s, i) => i === selectedPot ? (s === ing.id ? '' : ing.id) : s))
                  }}
                  className={`flex-1 rounded-xl p-2 flex flex-col items-center gap-0.5 transition-all border-2 active:scale-95
                    ${isSelected && inOrder ? 'border-green-400 bg-green-900/60' :
                      isSelected && !inOrder ? 'border-red-400 bg-red-900/60' :
                      inOrder && !isSelected ? 'border-yellow-400 bg-yellow-900/40 animate-pulse' :
                      'border-transparent bg-orange-950/60 hover:bg-orange-900/80'}`}>
                  <span className="text-xl">{ing.emoji}</span>
                  <span className={`text-xs ${inOrder && !isSelected ? 'text-yellow-300 font-bold' : 'text-orange-100'}`}>{ing.name}</span>
                  {inOrder && !isSelected && <span className="text-yellow-400 text-xs">👆</span>}
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
        <div ref={potRef} className="relative">
          {activeTooltip === 'pot' && (
            <InGameTooltip message="鍋に入ったよ！提供ボタンを押そう！" position="top" />
          )}
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
                  spiceLevel={potSpices[i] ?? ''}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Serve button ref for tutorial */}
        <button ref={serveRef} className="hidden" aria-hidden="true" />

        {/* Coin animations */}
        <AnimatePresence>
          {coinAnimations.map(c => (
            <motion.div
              key={c.id}
              className="fixed pointer-events-none z-50 font-black text-2xl"
              style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: -60, opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className={c.positive ? 'text-yellow-400' : 'text-red-400'}>
                {c.positive ? '+' : '-'}{c.amount}💰
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.main>

      {/* Contextual in-game tooltips (Day 1 onboarding) are shown inline */}
    </>
  )
}
