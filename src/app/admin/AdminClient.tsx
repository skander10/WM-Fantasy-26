'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { setUserPaid, saveMatchResult, setTournamentLocked } from '@/app/actions/admin'

type Player = {
  id: string
  username: string
  first_name: string
  last_name: string
  paid: boolean
}

type Team = { name: string; flag: string }
type Match = {
  id: number
  match_date: string
  status: string
  home_score: number | null
  away_score: number | null
  round: string
  home_team: Team
  away_team: Team
}

export function AdminClient({
  players,
  matches,
  tournamentLocked,
}: {
  players: Player[]
  matches: Match[]
  tournamentLocked: boolean
}) {
  const [tab, setTab] = useState<'players' | 'matches' | 'settings'>('matches')
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function showFeedback(key: string, msg: string) {
    setFeedback(prev => ({ ...prev, [key]: msg }))
    setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[key]; return n }), 3000)
  }

  function handleTogglePaid(userId: string, currentPaid: boolean) {
    startTransition(async () => {
      const error = await setUserPaid(userId, !currentPaid)
      showFeedback(userId, error ?? (currentPaid ? 'Gesperrt.' : 'Freigeschaltet ✅'))
    })
  }

  function handleSaveResult(matchId: number) {
    const s = scores[matchId]
    if (!s || s.home === '' || s.away === '') {
      showFeedback(`m${matchId}`, 'Bitte beide Tore eingeben.')
      return
    }
    const home = Number(s.home)
    const away = Number(s.away)
    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      showFeedback(`m${matchId}`, 'Ungültige Eingabe.')
      return
    }
    startTransition(async () => {
      const error = await saveMatchResult(matchId, home, away)
      showFeedback(`m${matchId}`, error ?? 'Gespeichert + Punkte berechnet ✅')
    })
  }

  const time = (d: string) => new Date(d).toLocaleString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Admin</h1>

      {/* Tab-Leiste */}
      <div className="flex gap-2 mb-6 bg-slate-800 rounded-xl p-1">
        {(['matches', 'players', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'matches' ? '⚽ Spiele' : t === 'players' ? '👥 Spieler' : '⚙️ Einst.'}
          </button>
        ))}
      </div>

      {/* Tab: Spiele */}
      {tab === 'matches' && (
        <div className="flex flex-col gap-4">
          {matches.length === 0 && (
            <p className="text-slate-500 text-center py-10">Keine Spiele vorhanden.</p>
          )}
          {matches.map(match => (
            <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <p className="text-slate-500 text-xs mb-2" suppressHydrationWarning>{time(match.match_date)} · {match.round}</p>

              {/* Teams */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-medium">
                  {match.home_team.flag} {match.home_team.name}
                </span>
                <span className="text-slate-500 text-xs">vs</span>
                <span className="text-white text-sm font-medium text-right">
                  {match.away_team.name} {match.away_team.flag}
                </span>
              </div>

              {/* Ergebnis bereits eingetragen */}
              {match.status === 'finished' ? (
                <div className="flex items-center justify-center gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-semibold">
                    {match.home_score} : {match.away_score}
                  </span>
                  <span className="text-slate-500 text-xs">Punkte berechnet</span>
                </div>
              ) : (
                /* Ergebnis eintragen */
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={20}
                    placeholder="0"
                    value={scores[match.id]?.home ?? ''}
                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id] ?? { away: '' }, home: e.target.value } }))}
                    className="w-12 h-10 bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-slate-500 font-bold">:</span>
                  <input
                    type="number" min={0} max={20}
                    placeholder="0"
                    value={scores[match.id]?.away ?? ''}
                    onChange={e => setScores(p => ({ ...p, [match.id]: { ...p[match.id] ?? { home: '' }, away: e.target.value } }))}
                    className="w-12 h-10 bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleSaveResult(match.id)}
                    disabled={isPending}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-semibold py-2 rounded-xl text-sm transition-colors"
                  >
                    Speichern
                  </button>
                </div>
              )}

              {feedback[`m${match.id}`] && (
                <p className="text-xs text-center mt-2 text-amber-400">{feedback[`m${match.id}`]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Einstellungen */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-white font-semibold">Turnier-Tipps</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Sperrt nur die Turnier-Fragen: Weltmeister, Finalist, 3. Platz, Torschütze, Assists, Bester Spieler, Tunesien. Die normalen Spiele-Tipps sind davon nicht betroffen.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">
                  Status: {tournamentLocked
                    ? <span className="text-red-400">🔒 Gesperrt</span>
                    : <span className="text-emerald-400">🔓 Offen</span>}
                </p>
              </div>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const error = await setTournamentLocked(!tournamentLocked)
                    if (error) showFeedback('tournament', error)
                    else showFeedback('tournament', tournamentLocked ? 'Entsperrt ✅' : 'Gesperrt 🔒')
                  })
                }}
                disabled={isPending}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  tournamentLocked
                    ? 'bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400'
                    : 'bg-red-400/10 hover:bg-red-400/20 text-red-400'
                }`}
              >
                {tournamentLocked ? '🔓 Entsperren' : '🔒 Jetzt sperren'}
              </button>
            </div>
            {feedback['tournament'] && (
              <p className="text-xs text-center mt-2 text-amber-400">{feedback['tournament']}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Spieler */}
      {tab === 'players' && (
        <div className="flex flex-col gap-3">
          {players.length === 0 && (
            <p className="text-slate-500 text-center py-10">Keine Spieler vorhanden.</p>
          )}
          {players.map(player => (
            <div key={player.id} className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{player.username}</p>
                <p className="text-slate-500 text-xs">{player.first_name} {player.last_name}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  player.paid
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {player.paid ? 'Bezahlt' : 'Ausstehend'}
                </span>
                <button
                  onClick={() => handleTogglePaid(player.id, player.paid)}
                  disabled={isPending}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    player.paid
                      ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400'
                      : 'bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400'
                  }`}
                >
                  {player.paid ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </button>
              </div>

              {feedback[player.id] && (
                <p className="text-xs text-amber-400 absolute">{feedback[player.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
