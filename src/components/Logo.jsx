import { motion } from 'framer-motion'

export default function Logo({ animated = true, size = 'medium' }) {
  const sizes = {
    small: { width: '40', height: '40' },
    medium: { width: '80', height: '80' },
    large: { width: '120', height: '120' },
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
      {/* Fundo cinza claro sutil */}
      <rect width="120" height="120" fill="#f0f0f0" rx="12" />

      {/* Grupo do escudo e gráfico */}
      <g>
        {/* Escudo externo - linhas interconectadas */}
        <motion.path
          d="M 30 30 Q 60 15 60 15 Q 60 15 90 30 L 90 55 Q 90 85 60 95 Q 30 85 30 55 Z"
          fill="none"
          stroke="#0369a1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={animated ? shieldVariants : {}}
        />

        {/* Linhas interconectadas do escudo - detalhes geométricos */}
        <motion.path
          d="M 45 35 Q 60 28 75 35 M 40 45 L 80 45 M 45 55 Q 60 50 75 55 M 35 65 L 85 65"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
          variants={animated ? connectionVariants : {}}
        />

        {/* Gráfico de barras dentro do escudo */}
        <g>
          {/* Barra 1 */}
          <motion.rect
            x="40"
            y="60"
            width="8"
            height="20"
            fill="#0369a1"
            rx="1"
            variants={animated ? barVariants : {}}
          />

          {/* Barra 2 */}
          <motion.rect
            x="52"
            y="50"
            width="8"
            height="30"
            fill="#06b6d4"
            rx="1"
            variants={animated ? barVariants : {}}
            transition={{ delay: 0.1, duration: 0.8 }}
          />

          {/* Barra 3 */}
          <motion.rect
            x="64"
            y="55"
            width="8"
            height="25"
            fill="#0369a1"
            rx="1"
            variants={animated ? barVariants : {}}
            transition={{ delay: 0.2, duration: 0.8 }}
          />

          {/* Seta para cima - representando crescimento */}
          <motion.path
            d="M 76 62 L 76 48 M 73 52 L 76 48 L 79 52"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={animated ? arrowVariants : {}}
            transition={{ delay: 0.4 }}
          />
        </g>
      </g>

      {/* Texto "FINANÇAS" */}
      <motion.text
        x="60"
        y="105"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fontFamily="sans-serif"
        fill="#0369a1"
        letterSpacing="0.5"
        variants={animated ? textVariants : {}}
        transition={{ delay: 0.5 }}
      >
        FINANÇAS
      </motion.text>

      {/* Texto "APP" */}
      <motion.text
        x="60"
        y="116"
        textAnchor="middle"
        fontSize="6"
        fontWeight="600"
        fontFamily="sans-serif"
        fill="#06b6d4"
        letterSpacing="1"
        variants={animated ? textVariants : {}}
        transition={{ delay: 0.6 }}
      >
        APP
      </motion.text>

      {/* SVG estático para exportar - sem animação */}
      <defs>
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </defs>
    </Wrapper>
  )
}
