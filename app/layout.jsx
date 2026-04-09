import './globals.css'
import { PwaBootstrap } from './pwa-bootstrap'

const isProd = process.env.NODE_ENV === 'production'

export const metadata = {
  title: 'MyDinDin',
  description: 'Gestão financeira multiusuário offline-first',
  ...(isProd ? { manifest: '/manifest.json' } : {}),
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaBootstrap />
        {children}
      </body>
    </html>
  )
}
