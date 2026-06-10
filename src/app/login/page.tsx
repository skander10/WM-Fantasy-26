'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 bg-slate-900">

      {/* Karte */}
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl">🏆</Link>
          <h1 className="text-2xl font-bold text-white mt-3">Einloggen</h1>
          <p className="text-slate-400 text-sm mt-1">WM Fantasy 26</p>
        </div>

        {/* Formular */}
        <form action={action} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-slate-300 text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="deine@email.de"
              className="bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-slate-300 text-sm font-medium">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors"
            />
          </div>

          {/* Fehlermeldung */}
          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold py-3.5 rounded-full transition-colors text-base"
          >
            {pending ? 'Wird eingeloggt…' : 'Einloggen'}
          </button>

        </form>

        {/* Link zur Registrierung */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Noch kein Konto?{' '}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 font-medium">
            Jetzt registrieren
          </Link>
        </p>

      </div>
    </main>
  )
}
