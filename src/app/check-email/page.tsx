import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 bg-slate-900">
      <div className="w-full max-w-sm text-center">

        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150" />
          <div className="relative bg-amber-400/10 border border-amber-400/30 rounded-full p-5">
            <Mail className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Email bestätigen
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          Wir haben dir eine Bestätigungs-Email geschickt.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Klick auf den Link in der Email um fortzufahren — danach kommst du automatisch zur Bezahl-Seite.
        </p>

        {/* Hinweis Spam */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-8">
          <p className="text-slate-400 text-xs">
            Keine Email bekommen? Schau auch in deinen <span className="text-slate-200">Spam-Ordner</span>.
          </p>
        </div>

        <Link
          href="/login"
          className="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-2 transition-colors"
        >
          Zurück zum Login
        </Link>

      </div>
    </main>
  )
}
