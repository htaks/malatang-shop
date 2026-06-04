import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'マーラータン屋さん',
  description: 'A fun malatang shop cooking game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-b from-red-950 to-orange-950">
        {children}
      </body>
    </html>
  )
}
