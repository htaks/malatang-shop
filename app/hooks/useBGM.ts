'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Pentatonic scale (C D E G A) — base frequencies
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0]
// One octave up
const PENTATONIC_HIGH = PENTATONIC.map(f => f * 2)

// Main melody pattern (indices into pentatonic scale, -1 = rest)
const MELODY_PATTERN = [
  4, 4, 2, 3, 4, -1, 3, 2,
  1, 1, 0, 1, 3, -1, 4, -1,
  2, 2, 4, 4, 3, 2, 1, -1,
  3, 3, 4, 4, 2, 1, 0, -1,
]

// Bass pattern
const BASS_PATTERN = [0, -1, 2, -1, 1, -1, 3, -1]

export function useBGM() {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const melodyIdxRef = useRef(0)
  const bassIdxRef = useRef(0)
  const schedulerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlayingRef = useRef(false)
  const tempoRef = useRef(200) // ms per beat (lower = faster)

  const [isMuted, setIsMuted] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const isMutedRef = useRef(false)

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume().catch(() => {})
      }
      return ctxRef.current
    } catch {
      return null
    }
  }, [])

  const playNote = useCallback((
    freq: number,
    startTime: number,
    duration: number,
    gainVal: number,
    type: OscillatorType = 'triangle',
  ) => {
    const ctx = ctxRef.current
    if (!ctx || !masterGainRef.current || isMutedRef.current) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02)
      gain.gain.setValueAtTime(gainVal, startTime + duration * 0.8)
      gain.gain.linearRampToValueAtTime(0, startTime + duration)
      osc.connect(gain)
      gain.connect(masterGainRef.current)
      osc.start(startTime)
      osc.stop(startTime + duration)
    } catch {
      // ignore
    }
  }, [])

  const scheduleNext = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !isPlayingRef.current) return

    const tempo = tempoRef.current
    const now = ctx.currentTime
    const beatDur = tempo / 1000

    // Schedule melody note
    const mIdx = MELODY_PATTERN[melodyIdxRef.current % MELODY_PATTERN.length]
    if (mIdx >= 0) {
      const freq = PENTATONIC_HIGH[mIdx]
      playNote(freq, now, beatDur * 0.7, 0.12, 'triangle')
    }

    // Every 2 beats: bass note
    if (melodyIdxRef.current % 2 === 0) {
      const bIdx = BASS_PATTERN[bassIdxRef.current % BASS_PATTERN.length]
      if (bIdx >= 0) {
        const freq = PENTATONIC[bIdx] / 2
        playNote(freq, now, beatDur * 1.5, 0.08, 'sine')
      }
      bassIdxRef.current++
    }

    // Every 4 beats: percussion click
    if (melodyIdxRef.current % 4 === 0) {
      try {
        const bufferSize = Math.floor((ctx.sampleRate * beatDur) / 8)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3
        }
        const src = ctx.createBufferSource()
        const g = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 600
        src.buffer = buffer
        src.connect(filter)
        filter.connect(g)
        if (masterGainRef.current) g.connect(masterGainRef.current)
        g.gain.value = 0.15
        src.start(now)
      } catch {
        // ignore
      }
    }

    melodyIdxRef.current++

    schedulerRef.current = setTimeout(scheduleNext, tempo)
  }, [playNote])

  const start = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    if (!masterGainRef.current) {
      masterGainRef.current = ctx.createGain()
      masterGainRef.current.gain.value = 0.4
      masterGainRef.current.connect(ctx.destination)
    }
    isPlayingRef.current = true
    setIsStarted(true)
    // Fade in
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(0, ctx.currentTime)
      masterGainRef.current.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5)
    }
    scheduleNext()
  }, [getCtx, scheduleNext])

  const stop = useCallback(() => {
    isPlayingRef.current = false
    if (schedulerRef.current) clearTimeout(schedulerRef.current)
    const ctx = ctxRef.current
    if (ctx && masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, ctx.currentTime)
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8)
    }
    setIsStarted(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      isMutedRef.current = next
      if (masterGainRef.current && ctxRef.current) {
        masterGainRef.current.gain.setValueAtTime(
          masterGainRef.current.gain.value,
          ctxRef.current.currentTime,
        )
        masterGainRef.current.gain.linearRampToValueAtTime(
          next ? 0 : 0.4,
          ctxRef.current.currentTime + 0.3,
        )
      }
      return next
    })
  }, [])

  // Adjust tempo based on time pressure
  const setTempo = useCallback((urgency: number) => {
    // urgency: 0 (normal) → 1 (very urgent)
    tempoRef.current = Math.round(200 - urgency * 80) // 200ms → 120ms
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current)
      isPlayingRef.current = false
    }
  }, [])

  // Level-up jingle
  const playLevelUpJingle = useCallback(() => {
    const ctx = getCtx()
    if (!ctx || !masterGainRef.current) return
    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.12 },
      { freq: 783.99, time: 0.24 },
      { freq: 1046.5, time: 0.36 },
      { freq: 1318.5, time: 0.52 },
    ]
    notes.forEach(({ freq, time }) => {
      try {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.value = freq
        const t = ctx.currentTime + time
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.3, t + 0.04)
        g.gain.linearRampToValueAtTime(0, t + 0.18)
        osc.connect(g)
        g.connect(masterGainRef.current!)
        osc.start(t)
        osc.stop(t + 0.18)
      } catch {
        // ignore
      }
    })
  }, [getCtx])

  return { start, stop, toggleMute, isMuted, isStarted, setTempo, playLevelUpJingle }
}
