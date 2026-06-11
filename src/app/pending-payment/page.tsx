import Link from 'next/link'
import { ExternalLink, Clock, CheckCircle } from 'lucide-react'

export default function PendingPaymentPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-slate-900">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl">🏆</Link>
          <h1 className="text-2xl font-bold text-white mt-3">Fast geschafft!</h1>
          <p className="text-slate-400 text-sm mt-1">Noch ein letzter Schritt</p>
        </div>

        {/* Erklärung */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-5">
          <p className="text-slate-300 text-sm leading-relaxed">
            Um mitspielen zu können, überweise einmalig{' '}
            <span className="text-amber-400 font-bold text-base">5 €</span>{' '}
            via PayPal. Danach bekommst du vollen Zugang zu allen Tipps.
          </p>
        </div>

        {/* PayPal Button */}
        <a
          href="https://paypal.me/SkanderGhedira/5"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#0070BA] hover:bg-[#005ea6] active:bg-[#004f8f] text-white font-semibold py-4 rounded-full transition-colors text-base mb-6"
        >
          <span className="text-lg font-bold tracking-tight">Pay</span>
          <span className="text-lg font-light tracking-tight">Pal</span>
          <ExternalLink className="w-4 h-4 ml-1" />
        </a>

        {/* Was passiert danach */}
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">Was passiert danach</p>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-slate-400 text-sm">Du überweist 2€ via PayPal</p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-slate-400 text-sm">Der Admin bestätigt deine Zahlung</p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-slate-400 text-sm">
              Du bekommst eine Bestätigungs-Email — danach kannst du sofort tippen
            </p>
          </div>
        </div>

        {/* Hinweis */}
        <p className="text-slate-600 text-xs text-center leading-relaxed">
          Schon bezahlt aber noch kein Zugang?{' '}
          <span className="text-slate-500">Warte kurz — der Admin wird es bald freischalten.</span>
        </p>

      </div>
    </main>
  )
}
