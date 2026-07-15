'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const VIDEO_ID = 'YTnRlJTusME'
const VOLUME = 20

export default function Navbar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  function sendCommand(cmd: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: cmd, args }),
      'https://www.youtube.com'
    )
  }

  function handleLoad() {
    setReady(true)
  }

  function toggleMusic() {
    if (!ready) return
    if (playing) {
      sendCommand('pauseVideo')
    } else {
      sendCommand('setVolume', [VOLUME])
      sendCommand('playVideo')
    }
    setPlaying(p => !p)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/predict/matches', label: '⚽ Tippen' },
    { href: '/predict/tournament', label: '🏆 Turnier' },
    { href: '/ranking', label: '📊 Ranking' },
    { href: '/results', label: '👀 Vergleich' },
    { href: '/my-scores', label: '📋 Punkte' },
    { href: '/info', label: 'ℹ️ Info' },
  ]

  return (
    <nav className="relative z-50 bg-slate-800 border-b border-slate-700 px-4 py-3">
      {/* Unsichtbarer YouTube-Player */}
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${VIDEO_ID}?enablejsapi=1&autoplay=0&loop=1&playlist=${VIDEO_ID}`}
        allow="autoplay"
        onLoad={handleLoad}
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}
      />

      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-amber-400 font-bold text-lg">WM 2026 🏆</Link>
        <div className="flex items-center gap-3 text-sm">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`hidden sm:block px-2 py-1 rounded transition ${
                pathname === l.href
                  ? 'text-amber-400 bg-slate-700'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="text-red-400 hover:text-red-300 text-sm">Admin</Link>
          )}
          <button
            onClick={toggleMusic}
            title={playing ? 'Musik pausieren' : 'Musik abspielen'}
            className={`text-lg transition-all ml-1 ${
              !ready ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110'
            } ${playing ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'}`}
          >
            {playing ? '♫' : '♪'}
          </button>
          <button onClick={logout} className="text-slate-400 hover:text-white text-sm ml-1">
            Logout
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="sm:hidden flex justify-around mt-2 pt-2 border-t border-slate-700">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-xs flex flex-col items-center gap-0.5 ${
              pathname === l.href ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <span className="text-lg">{l.label.split(' ')[0]}</span>
            <span>{l.label.split(' ').slice(1).join(' ')}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
