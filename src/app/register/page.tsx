'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'

export default function RegisterPage() {
  const [error, action, pending] = useActionState(register, null)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-slate-900">

      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl">🏆</Link>
          <h1 className="text-2xl font-bold text-white mt-3">Konto erstellen</h1>
          <p className="text-slate-400 text-sm mt-1">WM Fantasy 26</p>
        </div>

        <form action={action} className="flex flex-col gap-4">

          {/* Vorname + Nachname nebeneinander */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="firstName" className="text-slate-300 text-sm font-medium">
                Vorname
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                placeholder="Max"
                className="bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="lastName" className="text-slate-300 text-sm font-medium">
                Nachname
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                placeholder="Mustermann"
                className="bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-slate-300 text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="maxmuster"
              className="bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm transition-colors"
            />
            <p className="text-slate-500 text-xs px-1">
              Wird im Ranking öffentlich angezeigt
            </p>
          </div>

          {/* Email */}
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

          {/* Passwort */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-slate-300 text-sm font-medium">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mindestens 6 Zeichen"
              minLength={6}
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
            {pending ? 'Konto wird erstellt…' : 'Registrieren'}
          </button>

        </form>

        {/* Link zum Login */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Schon ein Konto?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">
            Einloggen
          </Link>
        </p>

      </div>
    </main>
  )
}
