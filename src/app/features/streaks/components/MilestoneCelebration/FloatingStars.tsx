// @ts-nocheck
'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { floatingAnimation } from '@/app/shared/lib/animations'

interface StarConfig {
  size: number
  top: string
  left?: string
  right?: string
  delay: number
}

const STAR_CONFIGS: StarConfig[] = [
  { size: 24, top: '24px', left: '24px', delay: 0 },
  { size: 16, top: '40px', right: '32px', delay: 0.3 },
  { size: 20, top: 'auto', left: '40px', delay: 0.6 },
]

export function FloatingStars() {
  return (
    <>
      {STAR_CONFIGS.map((config, index) => (
        <FloatingStar key={index} config={config} />
      ))}
    </>
  )
}

function FloatingStar({ config }: { config: StarConfig }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: config.top,
    ...(config.left ? { left: config.left } : {}),
    ...(config.right ? { right: config.right } : {}),
    ...(config.top === 'auto' ? { bottom: '32px' } : {}),
  }

  return (
    <motion.div
      {...floatingAnimation}
      transition={{
        ...floatingAnimation.transition,
        delay: config.delay,
      }}
      style={style}
    >
      <Star
        style={{ width: config.size, height: config.size }}
        className="text-white/50 fill-white/50"
      />
    </motion.div>
  )
}
