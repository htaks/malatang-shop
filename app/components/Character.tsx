'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export type CharacterType = 'sakura' | 'ken' | 'ojii' | 'hana' | 'taro' | 'miho' | 'obaa' | 'yuu'
export type Expression = 'neutral' | 'happy' | 'angry' | 'excited' | 'sad'

interface CharacterProps {
  type: CharacterType
  expression: Expression
  size?: number
  className?: string
}

// ── Realistic eyebrows ────────────────────────────────────────────────────────
function getEyebrows(expr: Expression, skinColor: string): React.ReactElement {
  const browColor = '#2C1A0E'
  if (expr === 'angry') return (
    <g>
      <path d="M 22 28 Q 30 24 37 27" stroke={browColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 43 27 Q 50 24 58 28" stroke={browColor} strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
  if (expr === 'sad') return (
    <g>
      <path d="M 22 27 Q 30 30 37 28" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 43 28 Q 50 30 58 27" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  )
  if (expr === 'excited') return (
    <g>
      <path d="M 22 26 Q 30 22 37 25" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 43 25 Q 50 22 58 26" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  )
  return (
    <g>
      <path d="M 23 27 Q 30 25 37 26" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 43 26 Q 50 25 57 27" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  )
}

// ── Realistic eyes with eyelids + irises ──────────────────────────────────────
function getEyes(expr: Expression, irisColor: string): React.ReactElement {
  const shadow = 'rgba(0,0,0,0.15)'
  if (expr === 'angry') return (
    <g>
      {/* Left eye */}
      <ellipse cx="32" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="32" cy="38" rx="4" ry="4.5" fill={irisColor} />
      <ellipse cx="32" cy="38" rx="2.5" ry="2.8" fill="#111" />
      <circle cx="33.5" cy="36.5" r="1" fill="white" />
      {/* Upper eyelid crease */}
      <path d="M 25.5 33 Q 32 31 38.5 33" stroke="#C08060" strokeWidth="1.5" fill="none" />
      {/* Angry lid */}
      <path d="M 25.5 33 Q 32 36 38.5 33" fill="rgba(0,0,0,0.08)" />
      {/* Right eye */}
      <ellipse cx="48" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="48" cy="38" rx="4" ry="4.5" fill={irisColor} />
      <ellipse cx="48" cy="38" rx="2.5" ry="2.8" fill="#111" />
      <circle cx="49.5" cy="36.5" r="1" fill="white" />
      <path d="M 41.5 33 Q 48 31 54.5 33" stroke="#C08060" strokeWidth="1.5" fill="none" />
      <path d="M 41.5 33 Q 48 36 54.5 33" fill="rgba(0,0,0,0.08)" />
    </g>
  )
  if (expr === 'excited') return (
    <g>
      <ellipse cx="32" cy="37" rx="7" ry="6.5" fill="white" />
      <ellipse cx="32" cy="37.5" rx="4.5" ry="5" fill={irisColor} />
      <ellipse cx="32" cy="37.5" rx="2.8" ry="3.2" fill="#111" />
      <circle cx="34" cy="35.5" r="1.5" fill="white" />
      <circle cx="30.5" cy="39" r="0.7" fill="white" opacity="0.7" />
      <ellipse cx="48" cy="37" rx="7" ry="6.5" fill="white" />
      <ellipse cx="48" cy="37.5" rx="4.5" ry="5" fill={irisColor} />
      <ellipse cx="48" cy="37.5" rx="2.8" ry="3.2" fill="#111" />
      <circle cx="50" cy="35.5" r="1.5" fill="white" />
      <circle cx="46.5" cy="39" r="0.7" fill="white" opacity="0.7" />
    </g>
  )
  if (expr === 'sad') return (
    <g>
      <ellipse cx="32" cy="39" rx="6.5" ry="5" fill="white" />
      <ellipse cx="32" cy="39" rx="4" ry="4" fill={irisColor} />
      <ellipse cx="32" cy="39" rx="2.5" ry="2.5" fill="#111" />
      <circle cx="33.5" cy="37.5" r="1" fill="white" />
      {/* Teardrop */}
      <path d="M 28 44 Q 27 48 29 50 Q 31 48 28 44" fill="#93C5FD" opacity="0.9" />
      <ellipse cx="48" cy="39" rx="6.5" ry="5" fill="white" />
      <ellipse cx="48" cy="39" rx="4" ry="4" fill={irisColor} />
      <ellipse cx="48" cy="39" rx="2.5" ry="2.5" fill="#111" />
      <circle cx="49.5" cy="37.5" r="1" fill="white" />
    </g>
  )
  if (expr === 'happy') return (
    <g>
      {/* Smiling/squinted eyes */}
      <path d="M 26 37 Q 32 32 38 37" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 42 37 Q 48 32 54 37" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      {/* Under-eye glow */}
      <path d="M 26 37 Q 32 40 38 37" fill="rgba(255,200,180,0.3)" />
      <path d="M 42 37 Q 48 40 54 37" fill="rgba(255,200,180,0.3)" />
    </g>
  )
  // neutral
  return (
    <g>
      <ellipse cx="32" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="32" cy="38" rx="4" ry="4.5" fill={irisColor} />
      <ellipse cx="32" cy="38" rx="2.5" ry="2.8" fill="#111" />
      <circle cx="33.5" cy="36.5" r="1.2" fill="white" />
      <ellipse cx="48" cy="38" rx="6.5" ry="5.5" fill="white" />
      <ellipse cx="48" cy="38" rx="4" ry="4.5" fill={irisColor} />
      <ellipse cx="48" cy="38" rx="2.5" ry="2.8" fill="#111" />
      <circle cx="49.5" cy="36.5" r="1.2" fill="white" />
    </g>
  )
}

// ── Realistic mouth with lips ─────────────────────────────────────────────────
function getMouth(expr: Expression, skinColor: string): React.ReactElement {
  const lipColor = '#C07070'
  const darkLip = '#A05050'
  if (expr === 'happy') return (
    <g>
      <path d="M 27 50 Q 40 62 53 50" stroke={darkLip} strokeWidth="2" fill={lipColor} strokeLinecap="round" />
      <path d="M 27 50 Q 40 54 53 50" fill="rgba(255,255,255,0.3)" />
      {/* Teeth */}
      <path d="M 29 51 Q 40 60 51 51 Q 40 58 29 51" fill="white" />
    </g>
  )
  if (expr === 'excited') return (
    <g>
      <ellipse cx="40" cy="54" rx="13" ry="9" fill={darkLip} />
      <ellipse cx="40" cy="51" rx="13" ry="5" fill={lipColor} />
      <ellipse cx="40" cy="54" rx="11" ry="7" fill="#222" />
      <ellipse cx="40" cy="52" rx="9" ry="4" fill="white" opacity="0.9" />
      <ellipse cx="40" cy="51" rx="13" ry="3" fill={lipColor} />
    </g>
  )
  if (expr === 'angry') return (
    <g>
      <path d="M 30 55 Q 40 47 50 55" stroke={darkLip} strokeWidth="2" fill={lipColor} strokeLinecap="round" />
      {/* Teeth clenched */}
      <path d="M 32 54 L 48 54" stroke="white" strokeWidth="2" />
    </g>
  )
  if (expr === 'sad') return (
    <g>
      <path d="M 29 55 Q 40 48 51 55" stroke={darkLip} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 34 57 Q 40 54 46 57" stroke={darkLip} strokeWidth="1.5" fill="none" />
    </g>
  )
  // neutral
  return (
    <g>
      <path d="M 30 52 Q 40 56 50 52" stroke={darkLip} strokeWidth="2" fill={lipColor} strokeLinecap="round" />
      <path d="M 30 52 Q 40 54 50 52" fill="rgba(255,255,255,0.2)" />
    </g>
  )
}

// ── Nose ──────────────────────────────────────────────────────────────────────
function getNose(skinColor: string): React.ReactElement {
  const shadow = 'rgba(0,0,0,0.12)'
  const nostril = 'rgba(0,0,0,0.18)'
  return (
    <g>
      <path d="M 37 42 Q 40 45 43 42" fill="none" stroke={shadow} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="37.5" cy="44" rx="2" ry="1.2" fill={nostril} />
      <ellipse cx="42.5" cy="44" rx="2" ry="1.2" fill={nostril} />
    </g>
  )
}

// ── Ear ───────────────────────────────────────────────────────────────────────
function getEars(skinColor: string, darkerSkin: string): React.ReactElement {
  return (
    <g>
      {/* Left ear */}
      <ellipse cx="11" cy="40" rx="5" ry="7" fill={skinColor} stroke={darkerSkin} strokeWidth="1" />
      <path d="M 13 35 Q 15 40 13 45" fill="none" stroke={darkerSkin} strokeWidth="1" strokeLinecap="round" />
      {/* Right ear */}
      <ellipse cx="69" cy="40" rx="5" ry="7" fill={skinColor} stroke={darkerSkin} strokeWidth="1" />
      <path d="M 67 35 Q 65 40 67 45" fill="none" stroke={darkerSkin} strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

// ── Character configs ─────────────────────────────────────────────────────────
const CHARACTER_CONFIGS: Record<CharacterType, {
  skinColor: string
  skinShadow: string
  irisColor: string
  bodyColor: string
  bodyColor2: string
  hair: (expr: Expression) => React.ReactElement
  accessory?: React.ReactElement
  clothing: React.ReactElement
}> = {
  sakura: {
    skinColor: '#FFCBA4',
    skinShadow: '#E8A882',
    irisColor: '#5C3D2E',
    bodyColor: '#FF6B8A',
    bodyColor2: '#FF9FB2',
    hair: () => (
      <g>
        {/* Main hair mass */}
        <ellipse cx="40" cy="16" rx="25" ry="16" fill="#2C1A0E" />
        <ellipse cx="17" cy="33" rx="9" ry="16" fill="#2C1A0E" />
        <ellipse cx="63" cy="33" rx="9" ry="16" fill="#2C1A0E" />
        {/* Hair shine */}
        <path d="M 28 8 Q 38 4 48 10" stroke="#5C3A28" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M 30 10 Q 38 6 46 11" stroke="#7A5040" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* Sakura hairpin */}
        <circle cx="57" cy="18" r="5" fill="#FF9FB2" />
        {[0, 72, 144, 216, 288].map((a, i) => (
          <ellipse key={i} cx={57 + 5 * Math.cos((a * Math.PI) / 180)} cy={18 + 5 * Math.sin((a * Math.PI) / 180)} rx="3" ry="2"
            fill="#FFB6C1" transform={`rotate(${a}, ${57 + 5 * Math.cos((a * Math.PI) / 180)}, ${18 + 5 * Math.sin((a * Math.PI) / 180)})`} />
        ))}
        <circle cx="57" cy="18" r="2" fill="#FFD700" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#FF6B8A" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#FF9FB2" />
        {/* Collar */}
        <path d="M 30 74 Q 40 80 50 74" fill="white" stroke="#FFB6C1" strokeWidth="1" />
        {/* Buttons */}
        <circle cx="40" cy="82" r="2" fill="white" />
        <circle cx="40" cy="88" r="2" fill="white" />
      </g>
    ),
  },

  ken: {
    skinColor: '#C8986A',
    skinShadow: '#A87850',
    irisColor: '#1A1A2E',
    bodyColor: '#1E5FA8',
    bodyColor2: '#3A80D0',
    hair: () => (
      <g>
        <ellipse cx="40" cy="14" rx="23" ry="13" fill="#1A1008" />
        {/* Spiky hair */}
        {[[-14, 20, 4], [-7, 10, 5], [0, 6, 5], [7, 10, 5], [14, 20, 4]].map(([dx, dy, r], i) => (
          <ellipse key={i} cx={40 + dx} cy={dy} rx={r} ry={8 - i * 0.3} fill="#1A1008"
            transform={`rotate(${dx * 2}, ${40 + dx}, ${dy})`} />
        ))}
        <path d="M 26 10 Q 38 4 50 9" stroke="#3A2818" strokeWidth="2" fill="none" opacity="0.7" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#1E5FA8" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#3A80D0" />
        {/* Collar */}
        <path d="M 28 74 L 40 82 L 52 74" fill="#3A80D0" stroke="#1E5FA8" strokeWidth="1" />
        {/* Hoodie pocket */}
        <rect x="32" y="84" width="16" height="10" rx="3" fill="#1A5090" />
      </g>
    ),
  },

  ojii: {
    skinColor: '#D4A878',
    skinShadow: '#B08858',
    irisColor: '#3A2510',
    bodyColor: '#4B5563',
    bodyColor2: '#6B7280',
    hair: () => (
      <g>
        <ellipse cx="20" cy="28" rx="8" ry="12" fill="#D5D8DC" />
        <ellipse cx="60" cy="28" rx="8" ry="12" fill="#D5D8DC" />
        {/* Receding hairline */}
        <path d="M 20 22 Q 40 16 60 22 Q 60 30 50 28 Q 40 26 30 28 Q 20 30 20 22" fill="#D5D8DC" />
        {/* Wrinkle lines */}
        <path d="M 22 35 Q 30 33 38 35" stroke="#B09070" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 42 35 Q 50 33 58 35" stroke="#B09070" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Brown-frame glasses */}
        <circle cx="32" cy="38" r="9" fill="none" stroke="#8B5A2B" strokeWidth="2.5" />
        <circle cx="48" cy="38" r="9" fill="none" stroke="#8B5A2B" strokeWidth="2.5" />
        <line x1="41" y1="38" x2="39" y2="38" stroke="#8B5A2B" strokeWidth="2" />
        <line x1="23" y1="36" x2="20" y2="34" stroke="#8B5A2B" strokeWidth="2" />
        <line x1="57" y1="36" x2="60" y2="34" stroke="#8B5A2B" strokeWidth="2" />
        {/* Lens tint */}
        <circle cx="32" cy="38" r="9" fill="rgba(200,220,255,0.12)" />
        <circle cx="48" cy="38" r="9" fill="rgba(200,220,255,0.12)" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#4B5563" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#6B7280" />
        {/* Collar & tie */}
        <path d="M 30 74 L 36 80 L 40 74 L 44 80 L 50 74" fill="white" stroke="#9CA3AF" strokeWidth="1" />
        <path d="M 38 80 L 40 93 L 42 80 Z" fill="#EF4444" />
        <path d="M 38.5 80 L 40 82 L 41.5 80 Z" fill="#DC2626" />
      </g>
    ),
  },

  hana: {
    skinColor: '#FFE5D0',
    skinShadow: '#E8C5A8',
    irisColor: '#6B3FA0',
    bodyColor: '#EC4899',
    bodyColor2: '#F9A8D4',
    hair: () => (
      <g>
        <ellipse cx="40" cy="13" rx="24" ry="14" fill="#7B3F00" />
        <ellipse cx="15" cy="32" rx="9" ry="18" fill="#7B3F00" transform="rotate(-8, 15, 32)" />
        <ellipse cx="65" cy="32" rx="9" ry="18" fill="#7B3F00" transform="rotate(8, 65, 32)" />
        {/* Hair shine */}
        <path d="M 28 6 Q 40 2 52 8" stroke="#A05A20" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* Ribbons */}
        <g transform="translate(14, 20)">
          <polygon points="0,0 8,6 0,12" fill="#EC4899" />
          <polygon points="16,0 8,6 16,12" fill="#F9A8D4" />
          <circle cx="8" cy="6" r="3" fill="#BE185D" />
        </g>
        <g transform="translate(58, 20)">
          <polygon points="0,0 8,6 0,12" fill="#F9A8D4" />
          <polygon points="16,0 8,6 16,12" fill="#EC4899" />
          <circle cx="8" cy="6" r="3" fill="#BE185D" />
        </g>
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#EC4899" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#F9A8D4" />
        {/* Dress collar with bow */}
        <path d="M 28 74 Q 40 82 52 74" fill="white" stroke="#F9A8D4" strokeWidth="1" />
        <path d="M 36 76 L 40 80 L 44 76 Q 40 74 36 76" fill="#F9A8D4" />
        {/* Frills */}
        <path d="M 20 88 Q 25 85 30 88 Q 35 85 40 88 Q 45 85 50 88 Q 55 85 60 88" stroke="#F9A8D4" strokeWidth="2" fill="none" />
      </g>
    ),
  },

  taro: {
    skinColor: '#C09060',
    skinShadow: '#A07040',
    irisColor: '#1A3A1A',
    bodyColor: '#059669',
    bodyColor2: '#34D399',
    hair: () => (
      <g>
        <ellipse cx="40" cy="13" rx="23" ry="13" fill="#111" />
        {/* Baseball cap */}
        <ellipse cx="40" cy="11" rx="25" ry="9" fill="#059669" />
        <rect x="15" y="7" width="50" height="7" rx="3.5" fill="#047857" />
        {/* Cap details */}
        <ellipse cx="40" cy="14" rx="27" ry="5" fill="#065F46" />
        <rect x="36" y="5" width="8" height="4" rx="2" fill="#34D399" />
        {/* Cap button */}
        <circle cx="40" cy="4" r="2.5" fill="#6EE7B7" />
        {/* Brim shadow */}
        <ellipse cx="40" cy="14" rx="27" ry="2" fill="rgba(0,0,0,0.15)" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#059669" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#34D399" />
        {/* Sporty collar */}
        <path d="M 28 74 L 40 84 L 52 74" fill="#34D399" stroke="#059669" strokeWidth="1" />
        {/* Jersey number */}
        <text x="35" y="92" fontSize="10" fill="white" fontWeight="bold" fontFamily="monospace">11</text>
      </g>
    ),
  },

  miho: {
    skinColor: '#F5E0C8',
    skinShadow: '#D8C0A8',
    irisColor: '#2D5A8A',
    bodyColor: '#7C3AED',
    bodyColor2: '#A78BFA',
    hair: () => (
      <g>
        <ellipse cx="40" cy="13" rx="24" ry="14" fill="#0D0D0D" />
        {/* Long flowing hair */}
        <path d="M 16 20 Q 10 45 14 70" stroke="#0D0D0D" strokeWidth="18" fill="none" strokeLinecap="round" />
        <path d="M 64 20 Q 70 45 66 70" stroke="#0D0D0D" strokeWidth="18" fill="none" strokeLinecap="round" />
        {/* Hair shine */}
        <path d="M 28 6 Q 38 2 50 7" stroke="#303030" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M 32 8 Q 40 5 48 9" stroke="#404040" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        {/* Side hair shine */}
        <path d="M 13 28 Q 11 40 13 52" stroke="#303030" strokeWidth="1.5" fill="none" opacity="0.6" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#7C3AED" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#A78BFA" />
        {/* V-neck */}
        <path d="M 28 74 L 40 86 L 52 74" fill="#6D28D9" stroke="#A78BFA" strokeWidth="1" />
        {/* Pattern dots */}
        <circle cx="30" cy="88" r="2" fill="#A78BFA" opacity="0.6" />
        <circle cx="37" cy="83" r="2" fill="#A78BFA" opacity="0.6" />
        <circle cx="44" cy="88" r="2" fill="#A78BFA" opacity="0.6" />
        <circle cx="51" cy="83" r="2" fill="#A78BFA" opacity="0.6" />
      </g>
    ),
  },

  obaa: {
    skinColor: '#D4A878',
    skinShadow: '#B88A58',
    irisColor: '#4A3520',
    bodyColor: '#6B7280',
    bodyColor2: '#9CA3AF',
    hair: () => (
      <g>
        <ellipse cx="40" cy="14" rx="23" ry="13" fill="#E8E8E8" />
        <ellipse cx="17" cy="28" rx="9" ry="15" fill="#DCDCDC" />
        <ellipse cx="63" cy="28" rx="9" ry="15" fill="#DCDCDC" />
        {/* Hair bun */}
        <circle cx="40" cy="9" r="11" fill="#D0D0D0" />
        <circle cx="40" cy="9" r="8" fill="#C8C8C8" />
        {/* Bun spiral */}
        <path d="M 34 9 Q 40 4 46 9 Q 40 14 34 9" fill="none" stroke="#B0B0B0" strokeWidth="1.5" />
        {/* Hairpin */}
        <line x1="34" y1="6" x2="46" y2="12" stroke="#C8A000" strokeWidth="2" strokeLinecap="round" />
        {/* Wrinkles */}
        <path d="M 22 42 Q 28 40 35 42" stroke="#B08858" strokeWidth="1" fill="none" opacity="0.5" />
        <path d="M 45 42 Q 52 40 58 42" stroke="#B08858" strokeWidth="1" fill="none" opacity="0.5" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#6B7280" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#9CA3AF" />
        {/* Kimono-style collar */}
        <path d="M 24 74 L 40 85 L 56 74 L 52 74 L 40 83 L 28 74 Z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
        {/* Pattern */}
        <path d="M 22 82 Q 40 78 58 82" stroke="#9CA3AF" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M 21 87 Q 40 83 59 87" stroke="#9CA3AF" strokeWidth="2" fill="none" opacity="0.5" />
      </g>
    ),
  },

  yuu: {
    skinColor: '#FFDDB8',
    skinShadow: '#E0BB90',
    irisColor: '#2A4A8A',
    bodyColor: '#D97706',
    bodyColor2: '#FCD34D',
    hair: () => (
      <g>
        <ellipse cx="40" cy="14" rx="23" ry="13" fill="#3A2510" />
        {/* Hooded sweatshirt */}
        <path d="M 14 18 Q 40 -4 66 18 Q 66 32 60 28 Q 40 22 20 28 Q 14 32 14 18" fill="#D97706" />
        <path d="M 18 20 Q 40 2 62 20 Q 56 28 40 26 Q 24 28 18 20" fill="#FBBF24" opacity="0.7" />
        {/* Animal ears */}
        <ellipse cx="15" cy="14" rx="7" ry="8" fill="#D97706" />
        <ellipse cx="15" cy="14" rx="4" ry="5" fill="#FDE68A" />
        <ellipse cx="65" cy="14" rx="7" ry="8" fill="#D97706" />
        <ellipse cx="65" cy="14" rx="4" ry="5" fill="#FDE68A" />
        {/* Hair peek */}
        <ellipse cx="40" cy="24" rx="14" ry="6" fill="#3A2510" />
      </g>
    ),
    clothing: (
      <g>
        <rect x="20" y="74" width="40" height="22" rx="6" fill="#D97706" />
        <ellipse cx="40" cy="96" rx="24" ry="8" fill="#FCD34D" />
        {/* Hoodie pocket */}
        <rect x="30" y="82" width="20" height="13" rx="5" fill="#B45309" />
        <rect x="32" y="84" width="16" height="9" rx="3" fill="#92400E" />
      </g>
    ),
  },
}

export default function Character({ type, expression, size = 80, className = '' }: CharacterProps) {
  const cfg = CHARACTER_CONFIGS[type]

  const bodyAnim = {
    neutral: { scale: 1, rotate: 0, y: 0 },
    happy:   { scale: 1.04, rotate: 0, y: -2 },
    excited: { scale: 1.08, rotate: [-1.5, 1.5, -1.5, 0], y: [-3, 0, -3, 0] },
    angry:   { scale: 0.97, rotate: 0, x: [-2, 2, -2, 0], y: 0 },
    sad:     { scale: 0.96, rotate: 1.5, y: 3 },
  }

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size * 1.25 }}
      animate={bodyAnim[expression]}
      transition={{ duration: 0.35, type: 'spring', stiffness: 280, damping: 14 }}
    >
      <svg width={size} height={size * 1.25} viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
        {/* Shadow under body */}
        <ellipse cx="40" cy="99" rx="20" ry="4" fill="rgba(0,0,0,0.15)" />

        {/* Clothing */}
        {cfg.clothing}

        {/* Neck */}
        <rect x="34" y="63" width="12" height="14" rx="5" fill={cfg.skinColor} />
        {/* Neck shadow */}
        <rect x="34" y="63" width="5" height="14" rx="3" fill={cfg.skinShadow} opacity="0.4" />

        {/* Ears (behind head) */}
        {getEars(cfg.skinColor, cfg.skinShadow)}

        {/* Head */}
        <ellipse cx="40" cy="40" rx="30" ry="32" fill={cfg.skinColor} />

        {/* Head shading */}
        <ellipse cx="30" cy="42" rx="10" ry="18" fill={cfg.skinShadow} opacity="0.18" />
        <ellipse cx="50" cy="42" rx="10" ry="18" fill={cfg.skinShadow} opacity="0.18" />

        {/* Hair */}
        {cfg.hair(expression)}

        {/* Cheeks */}
        <ellipse cx="22" cy="47" rx="8" ry="6" fill="rgba(255,130,120,0.28)" />
        <ellipse cx="58" cy="47" rx="8" ry="6" fill="rgba(255,130,120,0.28)" />

        {/* Eyebrows */}
        {getEyebrows(expression, cfg.skinColor)}

        {/* Eyes */}
        {getEyes(expression, cfg.irisColor)}

        {/* Nose */}
        {getNose(cfg.skinColor)}

        {/* Mouth */}
        {getMouth(expression, cfg.skinColor)}

        {/* Accessory */}
        {cfg.accessory}
      </svg>
    </motion.div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
export function emojiToCharType(emoji: string): CharacterType {
  const map: Record<string, CharacterType> = {
    '👩': 'sakura', '👦': 'ken', '👴': 'ojii', '👧': 'hana',
    '🧑': 'taro', '👩‍🦱': 'miho', '🧓': 'obaa', '🧒': 'yuu',
  }
  return map[emoji] ?? 'sakura'
}
