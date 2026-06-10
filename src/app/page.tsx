import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-5">

      {/* Hintergrund-Gradient: oben dunkelblau → unten grün (Rasen-Feeling) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900 via-slate-800 to-emerald-950" />
      {/* Subtiler grüner Schimmer ganz unten */}
      <div className="absolute bottom-0 left-0 right-0 h-48 -z-10 bg-gradient-to-t from-emerald-900/30 to-transparent" />
      {/* Goldener Lichteffekt oben-mitte (wie ein Stadion-Strahler) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 -z-10 bg-amber-400/5 rounded-full blur-3xl" />

      {/* Haupt-Inhalt */}
      <div className="flex flex-col items-center text-center max-w-sm w-full">

        {/* WM Pokal mit goldenem Glow */}
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl scale-150" />
          <span className="relative text-7xl drop-shadow-lg">🏆</span>
        </div>

        {/* App-Name */}
        <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
          WM Fantasy 26
        </h1>

        {/* Untertitel */}
        <p className="text-amber-400 font-medium text-base mb-5">
          FIFA World Cup 2026
        </p>

        {/* Kurztext */}
        <p className="text-slate-400 text-sm leading-relaxed mb-8 px-2">
          Tippe auf alle WM-Spiele, sammle Punkte und beweise wer die beste Fußball-Nase im Freundeskreis hat.
        </p>

        {/* Buttons — auf Handy übereinander, ab sm nebeneinander */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto text-center bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-semibold px-8 py-3.5 rounded-full transition-colors text-base"
          >
            Jetzt mitmachen
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center border border-slate-600 hover:border-slate-400 active:bg-slate-800 text-slate-300 hover:text-white px-8 py-3.5 rounded-full transition-colors text-base"
          >
            Einloggen
          </Link>
        </div>

        {/* Info-Link unten */}
        <Link
          href="/info"
          className="mt-8 text-slate-500 hover:text-slate-300 text-xs underline underline-offset-2 transition-colors"
        >
          Wie funktioniert das Spiel?
        </Link>
      </div>

    </main>
  )
}
