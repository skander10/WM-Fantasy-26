import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WM Fantasy 26',
  description: 'Tippe auf alle WM 2026 Spiele und beweise wer die beste Fußball-Nase hat.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
