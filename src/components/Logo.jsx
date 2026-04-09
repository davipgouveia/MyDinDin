"use client"

import { motion } from 'framer-motion'

export default function Logo({ animated = true, size = 'medium' }) {
  const sizes = {
    small: { width: '52', height: '52' },
    medium: { width: '96', height: '96' },
    large: { width: '136', height: '136' },
    xlarge: { width: '178', height: '178' },
  }

  const { width, height } = sizes[size]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const shieldVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: 'easeInOut' },
    },
  }

  const connectionVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: 'easeInOut' },
    },
  }

  const barVariants = {
    hidden: { scaleY: 0, originY: 1 },
    visible: {
      scaleY: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  const arrowVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const textVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  }

  const glowVariants = {
    hidden: { opacity: 0.25 },
    visible: {
      opacity: [0.35, 0.85, 0.35],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  const Wrapper = animated ? motion.svg : 'svg'
  const wrapperProps = animated
    ? {
        initial: 'hidden',
        animate: 'visible',
        variants: containerVariants,
        whileHover: { scale: 1.05 },
        transition: { duration: 0.3 },
      }
    : {}

  return (
    <Wrapper
      width={width}
      height={height}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      {...wrapperProps}
    >
      <defs>
        <linearGradient id="logoShieldGradient" x1="24" y1="20" x2="96" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="logoBarsGradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="57"
        r="34"
        fill="rgba(56,189,248,0.15)"
        variants={animated ? glowVariants : {}}
      />

      <g>
        <motion.path
          d="M 30 30 Q 60 15 60 15 Q 60 15 90 30 L 90 55 Q 90 85 60 95 Q 30 85 30 55 Z"
          fill="none"
          stroke="url(#logoShieldGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={animated ? shieldVariants : {}}
        />

        <motion.path
          d="M 45 35 Q 60 28 75 35 M 40 45 L 80 45 M 45 55 Q 60 50 75 55 M 35 65 L 85 65"
          fill="none"
          stroke="rgba(255,255,255,0.72)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
          variants={animated ? connectionVariants : {}}
        />

        <g>
          <motion.rect
            x="40"
            y="60"
            width="8"
            height="20"
            fill="url(#logoBarsGradient)"
            rx="1"
            variants={animated ? barVariants : {}}
          />

          <motion.rect
            x="52"
            y="50"
            width="8"
            height="30"
            fill="url(#logoBarsGradient)"
            rx="1"
            variants={animated ? barVariants : {}}
            transition={{ delay: 0.1, duration: 0.8 }}
          />

          <motion.rect
            x="64"
            y="55"
            width="8"
            height="25"
            fill="url(#logoBarsGradient)"
            rx="1"
            variants={animated ? barVariants : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          />

          <motion.path
            d="M 76 62 L 76 48 M 73 52 L 76 48 L 79 52"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={animated ? arrowVariants : {}}
            transition={{ delay: 0.4 }}
          />
        </g>
      </g>

      <motion.text
        x="60"
        y="107"
        textAnchor="middle"
        fontSize="7.6"
        fontWeight="700"
        fontFamily="'Trebuchet MS', 'Segoe UI', sans-serif"
        fill="#e2f4ff"
        letterSpacing="0.85"
        variants={animated ? textVariants : {}}
        transition={{ delay: 0.5 }}
        animate={
          animated
            ? {
                letterSpacing: [0.65, 1.05, 0.65],
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
            : undefined
        }
      >
        MYDINDIN
      </motion.text>
    </Wrapper>
  )
}
