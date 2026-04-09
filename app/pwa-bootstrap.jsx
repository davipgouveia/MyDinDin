'use client'

import { useEffect } from 'react'

export function PwaBootstrap() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js').catch((error) => {
            console.error('Falha ao registrar service worker:', error)
          })
        })
      }
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
    }
  }, [])

  return null
}
