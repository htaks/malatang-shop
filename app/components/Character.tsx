'use client'

import { motion } from 'framer-motion'

export type CharacterType = 'sakura' | 'ken' | 'ojii' | 'hana' | 'taro' | 'miho' | 'obaa' | 'yuu'
export type Expression = 'neutral' | 'happy' | 'angry' | 'excited' | 'sad'

interface CharacterProps {
  type: CharacterType
  expression: Expression
  size?: number
  className?: string
}

// Mouth paths per expression
function getMouth(expr: Expression): React.ReactElement {
  switch (expr) {
    case 'happy':
      return <path d="M 28 48 Q 40 60 52 48" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    case 'excited':
      return (
        <>
          <path d="M 26 46 Q 40 62 54 46" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 30 46 Q 40 56 50 46" fill="white" stroke="none" />
        </>
      )
    case 'angry':
      return <path d="M 30 54 Q 40 44 50 54" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    case 'sad':
      return <path d="M 29 54 Q 40 46 51 54" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    case 'neutral':
    default:
      return <line x1="30" y1="50" x2="50" y2="50" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
  }
}

// Eye shapes per expression
function getEyes(expr: Expression): React.ReactElement {
  if (expr === 'angry') {
    return (
      <g>
        <circle cx="32" cy="37" r="5" fill="#1a1a2e" />
        <circle cx="48" cy="37" r="5" fill="#1a1a2e" />
        <line x1="27" y1="32" x2="37" y2="35" stroke="#1a1a2e" strokeWidth="2.5" />
        <line x1="43" y1="35" x2="53" y2="32" stroke="#1a1a2e" strokeWidth="2.5" />
        <circle cx="33.5" cy="36" r="1.5" fill="white" />
        <circle cx="49.5" cy="36" r="1.5" fill="white" />
      </g>
    )
  }
  if (expr === 'excited') {
    return (
      <g>
        <circle cx="32" cy="37" r="6" fill="#1a1a2e" />
        <circle cx="48" cy="37" r="6" fill="#1a1a2e" />
        <circle cx="34" cy="35" r="2" fill="white" />
        <circle cx="50" cy="35" r="2" fill="white" />
      </g>
    )
  }
  if (expr === 'sad') {
    return (
      <g>
        <circle cx="32" cy="38" r="5" fill="#1a1a2e" />
        <circle cx="48" cy="38" r="5" fill="#1a1a2e" />
        <circle cx="33.5" cy="37" r="1.5" fill="white" />
        <circle cx="49.5" cy="37" r="1.5" fill="white" />
        {/* Tear */}
        <ellipse cx="28" cy="45" rx="2" ry="3" fill="#60a5fa" opacity="0.8" />
      </g>
    )
  }
  return (
    <g>
      <circle cx="32" cy="37" r="5.5" fill="#1a1a2e" />
      <circle cx="48" cy="37" r="5.5" fill="#1a1a2e" />
      <circle cx="34" cy="35.5" r="1.8" fill="white" />
      <circle cx="50" cy="35.5" r="1.8" fill="white" />
    </g>
  )
}

// Character-specific designs
const CHARACTER_CONFIGS: Record<CharacterType, {
  skinColor: string
  bodyColor: string
  hairColor: string
  hair: React.ReactElement
  accessory?: React.ReactElement
}> = {
  sakura: {
    skinColor: '#FFDAB9',
    bodyColor: '#FF9FB2',
    hairColor: '#3D1A1A',
    hair: (
      <g>
        <ellipse cx="40" cy="16" rx="24" ry="14" fill="#3D1A1A" />
        <ellipse cx="22" cy="28" rx="8" ry="12" fill="#3D1A1A" />
        <ellipse cx="58" cy="28" rx="8" ry="12" fill="#3D1A1A" />
        {/* Sakura flower pin */}
        <circle cx="56" cy="18" r="4" fill="#FF9FB2" />
        <circle cx="56" cy="14" r="2.5" fill="#FF9FB2" />
        <circle cx="60" cy="16" r="2.5" fill="#FF9FB2" />
        <circle cx="52" cy="16" r="2.5" fill="#FF9FB2" />
        <circle cx="56" cy="20" r="2.5" fill="#FF9FB2" />
        <circle cx="56" cy="18" r="1.5" fill="#FFD700" />
      </g>
    ),
  },
  ken: {
    skinColor: '#D4A574',
    bodyColor: '#4A90D9',
    hairColor: '#2C1810',
    hair: (
      <g>
        <ellipse cx="40" cy="14" rx="22" ry="12" fill="#2C1810" />
        {/* Spiky hair */}
        <polygon points="25,20 20,5 30,15" fill="#2C1810" />
        <polygon points="35,14 32,2 40,12" fill="#2C1810" />
        <polygon points="45,14 48,2 40,12" fill="#2C1810" />
        <polygon points="55,20 60,5 50,15" fill="#2C1810" />
      </g>
    ),
  },
  ojii: {
    skinColor: '#E8C99A',
    bodyColor: '#6B7280',
    hairColor: '#D1D5DB',
    hair: (
      <g>
        {/* Bald top with white side hair */}
        <ellipse cx="40" cy="16" rx="22" ry="8" fill="#D1D5DB" />
        <ellipse cx="20" cy="25" rx="7" ry="10" fill="#D1D5DB" />
        <ellipse cx="60" cy="25" rx="7" ry="10" fill="#D1D5DB" />
        {/* Glasses */}
        <circle cx="32" cy="37" r="8" fill="none" stroke="#8B4513" strokeWidth="2" />
        <circle cx="48" cy="37" r="8" fill="none" stroke="#8B4513" strokeWidth="2" />
        <line x1="40" y1="37" x2="40" y2="37" stroke="#8B4513" strokeWidth="2" />
        <line x1="24" y1="37" x2="22" y2="35" stroke="#8B4513" strokeWidth="2" />
        <line x1="56" y1="37" x2="58" y2="35" stroke="#8B4513" strokeWidth="2" />
      </g>
    ),
  },
  hana: {
    skinColor: '#FFE0CC',
    bodyColor: '#F472B6',
    hairColor: '#8B4513',
    hair: (
      <g>
        <ellipse cx="40" cy="14" rx="23" ry="13" fill="#8B4513" />
        {/* Pigtails */}
        <ellipse cx="18" cy="22" rx="7" ry="15" fill="#8B4513" transform="rotate(-10, 18, 22)" />
        <ellipse cx="62" cy="22" rx="7" ry="15" fill="#8B4513" transform="rotate(10, 62, 22)" />
        {/* Ribbons */}
        <polygon points="12,16 18,22 12,28" fill="#F472B6" />
        <polygon points="24,16 18,22 24,28" fill="#F472B6" />
        <polygon points="56,16 62,22 56,28" fill="#F472B6" />
        <polygon points="68,16 62,22 68,28" fill="#F472B6" />
      </g>
    ),
  },
  taro: {
    skinColor: '#C8A882',
    bodyColor: '#10B981',
    hairColor: '#1A1A1A',
    hair: (
      <g>
        <ellipse cx="40" cy="14" rx="22" ry="12" fill="#1A1A1A" />
        {/* Baseball cap */}
        <ellipse cx="40" cy="12" rx="24" ry="8" fill="#10B981" />
        <rect x="16" y="8" width="48" height="6" rx="3" fill="#10B981" />
        <rect x="34" y="6" width="12" height="5" rx="2" fill="#059669" />
        {/* Cap brim */}
        <ellipse cx="40" cy="14" rx="26" ry="5" fill="#059669" />
      </g>
    ),
  },
  miho: {
    skinColor: '#F0D0B0',
    bodyColor: '#A78BFA',
    hairColor: '#1A0A0A',
    hair: (
      <g>
        {/* Long wavy hair */}
        <ellipse cx="40" cy="14" rx="23" ry="13" fill="#1A0A0A" />
        <ellipse cx="17" cy="35" rx="8" ry="20" fill="#1A0A0A" />
        <ellipse cx="63" cy="35" rx="8" ry="20" fill="#1A0A0A" />
        {/* Hair highlight */}
        <path d="M 30 10 Q 35 5 40 8" stroke="#4A2020" strokeWidth="2" fill="none" />
      </g>
    ),
  },
  obaa: {
    skinColor: '#DEB887',
    bodyColor: '#9CA3AF',
    hairColor: '#E5E7EB',
    hair: (
      <g>
        <ellipse cx="40" cy="14" rx="22" ry="12" fill="#E5E7EB" />
        <ellipse cx="19" cy="26" rx="8" ry="14" fill="#E5E7EB" />
        <ellipse cx="61" cy="26" rx="8" ry="14" fill="#E5E7EB" />
        {/* Bun */}
        <circle cx="40" cy="10" r="9" fill="#D1D5DB" />
        <circle cx="40" cy="8" r="5" fill="#9CA3AF" />
      </g>
    ),
  },
  yuu: {
    skinColor: '#FFECD0',
    bodyColor: '#F59E0B',
    hairColor: '#4A3728',
    hair: (
      <g>
        <ellipse cx="40" cy="14" rx="22" ry="12" fill="#4A3728" />
        {/* Hood / hat */}
        <path d="M 16 22 Q 40 -2 64 22" fill="#F59E0B" />
        <path d="M 20 22 Q 40 4 60 22" fill="#FBBF24" />
        {/* Ears of hood */}
        <circle cx="17" cy="20" r="6" fill="#F59E0B" />
        <circle cx="63" cy="20" r="6" fill="#F59E0B" />
        <circle cx="17" cy="20" r="3" fill="#FDE68A" />
        <circle cx="63" cy="20" r="3" fill="#FDE68A" />
      </g>
    ),
  },
}

const CHEEK_COLOR = 'rgba(255,150,150,0.4)'

export default function Character({ type, expression, size = 80, className = '' }: CharacterProps) {
  const config = CHARACTER_CONFIGS[type]

  const expressionVariants = {
    neutral: { scale: 1, rotate: 0 },
    happy: { scale: 1.05, rotate: 0 },
    excited: { scale: 1.1, rotate: [-2, 2, -2, 0] },
    angry: { scale: 0.95, rotate: 0, x: [-3, 3, -3, 0] },
    sad: { scale: 0.97, rotate: 2 },
  }

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size * 1.2 }}
      animate={expressionVariants[expression]}
      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
    >
      <svg
        width={size}
        height={size * 1.25}
        viewBox="0 0 80 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="40" cy="90" rx="22" ry="16" fill={config.bodyColor} />
        <rect x="22" y="74" width="36" height="20" rx="6" fill={config.bodyColor} />

        {/* Neck */}
        <rect x="34" y="65" width="12" height="12" rx="4" fill={config.skinColor} />

        {/* Head */}
        <circle cx="40" cy="40" r="32" fill={config.skinColor} />

        {/* Hair (drawn over head) */}
        {config.hair}

        {/* Cheeks */}
        <circle cx="24" cy="45" r="7" fill={CHEEK_COLOR} />
        <circle cx="56" cy="45" r="7" fill={CHEEK_COLOR} />

        {/* Eyes */}
        {getEyes(expression)}

        {/* Mouth */}
        {getMouth(expression)}

        {/* Accessory */}
        {config.accessory}
      </svg>
    </motion.div>
  )
}

// Helper to map customer emoji/name to CharacterType
export function emojiToCharType(emoji: string): CharacterType {
  const map: Record<string, CharacterType> = {
    '👩': 'sakura',
    '👦': 'ken',
    '👴': 'ojii',
    '👧': 'hana',
    '🧑': 'taro',
    '👩‍🦱': 'miho',
    '🧓': 'obaa',
    '🧒': 'yuu',
  }
  return map[emoji] ?? 'sakura'
}
