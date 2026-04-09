import { motion } from 'framer-motion'
import Logo from './Logo'
import { APP_BUILD_LABEL } from '../constants/appMeta'
import { usePreferences } from '../context/PreferencesContext'

export function LoadingOverlay() {
  const { t, theme } = usePreferences()
  const isLight = theme === 'light'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-4 ${
        isLight ? 'bg-slate-50/95 text-slate-900' : 'bg-slate-950/95 text-white'
      }`}
    >
      <div className="absolute inset-0 opacity-80">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className={`absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed ${
            isLight ? 'border-cyan-300/35' : 'border-cyan-400/20'
          }`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className={`absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            isLight ? 'border-emerald-300/25' : 'border-white/10'
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`relative w-full max-w-lg rounded-[2rem] border p-6 text-center shadow-2xl backdrop-blur-xl ${
          isLight ? 'border-slate-200 bg-white/85' : 'border-white/10 bg-slate-950/85'
        }`}
      >
        <div className="relative mx-auto mb-5 flex h-36 w-36 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-cyan-400/20 border-t-cyan-400/80"
          />
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10"
          >
            <Logo size="xlarge" animated />
          </motion.div>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">MyDinDin</p>
        <h1 className={`mt-3 text-2xl font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('loadingTitle')}</h1>
        <p className={`mt-2 text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{t('loadingSubtitle')}</p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
        </div>

        <p className={`mt-5 text-[11px] uppercase tracking-[0.22em] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{APP_BUILD_LABEL}</p>
      </motion.div>
    </div>
  )
}