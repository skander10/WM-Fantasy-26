'use client'

import { useState, useTransition } from 'react'
import { Lock, Check } from 'lucide-react'
import { saveAllPicks } from '@/app/actions/picks'

type Team = { id: number; name: string; flag: string }
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
type Pick = { match_id: number; home_pick: number; away_pick: number; points_earned: number | null }

export function MatchesClient({
  matches,
  picksMap,
}: {
  matches: Match[]
  picksMap: Record<number, Pick>
}) {
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>(() => {
    const init: Record<number, { home: string; away: string }> = {}
    for (const [id, pick] of Object.entries(picksMap)) {
      init[Number(id)] = { home: String(pick.home_pick), away: String(pick.away_pick) }
    }
    return init
  })

  const [savedIds, setSavedIds] = useState<Set<number>>(
    () => new Set(Object.keys(picksMap).map(Number))
  )
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showTunisiaPopup, setShowTunisiaPopup] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isLocked = (matchDate: string) => new Date(matchDate) <= new Date()

  function isTunisiaTeam(team: Team) {
    const n = team.name.toLowerCase()
    return n.includes('tun') || n.includes('tunisi') || n.includes('tunesien') || team.flag === '🇹🇳'
  }

  function isJapanTeam(team: Team) {
    const n = team.name.toLowerCase()
    return n.includes('japan') || n.includes('jap') || team.flag === '🇯🇵'
  }

  function isTunisiaMatch(match: Match) {
    return (isTunisiaTeam(match.home_team) && isJapanTeam(match.away_team)) ||
           (isTunisiaTeam(match.away_team) && isJapanTeam(match.home_team))
  }

  function violatesTunisiaRule(match: Match, home: number, away: number) {
    if (!isTunisiaMatch(match)) return false
    const tunisiaIsHome = isTunisiaTeam(match.home_team)
    const japanGoals = tunisiaIsHome ? away : home
    const tunisiaGoals = tunisiaIsHome ? home : away
    return japanGoals > tunisiaGoals && (japanGoals - tunisiaGoals) > 1
  }

  // Matches nach Datum gruppieren
  const groups: Record<string, Match[]> = {}
  for (const match of matches) {
    const dateKey = new Date(match.match_date).toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Europe/Berlin',
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(match)
  }

  function handleSave() {
    // Tunisia-Regel prüfen
    for (const m of matches.filter(m => !isLocked(m.match_date))) {
      const s = scores[m.id]
      if (!s || s.home === '' || s.away === '') continue
      const home = Number(s.home)
      const away = Number(s.away)
      if (!isNaN(home) && !isNaN(away) && violatesTunisiaRule(m, home, away)) {
        setShowTunisiaPopup(true)
        return
      }
    }

    const picks = matches
      .filter(m => !isLocked(m.match_date))
      .flatMap(m => {
        const s = scores[m.id]
        if (!s || s.home === '' || s.away === '') return []
        const home = Number(s.home)
        const away = Number(s.away)
        if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return []
        return [{ matchId: m.id, homePick: home, awayPick: away }]
      })

    if (picks.length === 0) {
      setMessage({ type: 'error', text: 'Bitte mindestens einen Tipp eingeben.' })
      return
    }

    startTransition(async () => {
      const error = await saveAllPicks(picks)
      if (error) {
        setMessage({ type: 'error', text: error })
      } else {
        setSavedIds(prev => new Set([...prev, ...picks.map(p => p.matchId)]))
        setMessage({ type: 'success', text: 'Tipps gespeichert!' })
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const BG_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqTQUQ-dMIRqVE6pv8Inc6DJ69I8-qGmeGiQ&s'

  if (matches.length === 0) {
    return (
      <div className="relative">
        <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
        <div className="fixed inset-0 z-0 bg-slate-900/40" />
        <div className="relative z-10 flex flex-col items-center justify-center py-24 text-slate-500 px-6 text-center min-h-screen">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-base font-medium text-slate-400">Noch keine Spiele</p>
          <p className="text-sm mt-1">Der Admin fügt die Spiele bald hinzu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="fixed inset-0 z-0" style={{ backgroundImage: `url(${BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      <div className="fixed inset-0 z-0 bg-slate-900/40" />

      {/* Tunisia Popup */}
      {showTunisiaPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowTunisiaPopup(false)} />
          <div className="relative bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <p className="text-4xl mb-3">🇹🇳</p>
              <p className="text-white font-bold text-base leading-relaxed mb-3">
                Hör auf, Tunesien ist doch nicht so schwach! Mit bisschen Hoffnung können wir das noch zsam packen.. Scheiß auf die 5/10 Punkte diesmal, das gilt für alle 🔥
              </p>
              <p className="text-red-400 font-semibold text-sm mb-3">
                1% Chance, 99% Glaube ❤️
              </p>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                🐭 Wenn du nicht an uns glaubst, dann tipp wenigstens nur 1 Tor Unterschied gegen uns — wäre aber beim Tipps-Vergleich so peinlich, du Verräter!
              </p>
              <p className="text-amber-400 font-bold text-lg" dir="rtl">
                نموت نموت و يحيا الوطن
              </p>
            </div>
            <button
              onClick={() => setShowTunisiaPopup(false)}
              className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
            >
              Ok ok, ich ändere meinen Tipp 😅
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-28 pt-6">
      <h1 className="text-xl font-bold text-white mb-6">Spiele tippen</h1>

      {Object.entries(groups).map(([date, dayMatches]) => (
        <div key={date} className="mb-8">
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">{date}</p>

          <div className="flex flex-col gap-3">
            {dayMatches.map(match => {
              const locked = isLocked(match.match_date)
              const pick = picksMap[match.id]
              const score = scores[match.id] ?? { home: '', away: '' }
              const saved = savedIds.has(match.id)
              const time = new Date(match.match_date).toLocaleTimeString('de-DE', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
              })

              return (
                <div
                  key={match.id}
                  className={`bg-slate-900/50 backdrop-blur-sm border rounded-2xl px-4 py-3 transition-colors ${
                    locked
                      ? 'border-slate-700/50 opacity-70'
                      : saved
                      ? 'border-emerald-700/40'
                      : 'border-slate-700'
                  }`}
                >
                  {/* Kopfzeile: Uhrzeit + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-500 text-xs">{time} Uhr</span>
                    {locked ? (
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <Lock className="w-3 h-3" /> Gesperrt
                      </span>
                    ) : saved ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <Check className="w-3 h-3" /> Gespeichert
                      </span>
                    ) : null}
                  </div>

                  {/* Teams + Eingabefelder */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

                    {/* Heimmannschaft */}
                    <div className="flex items-center justify-end gap-1.5 min-w-0">
                      <span className="text-slate-200 text-sm font-medium text-right leading-tight truncate">
                        {match.home_team.name}
                      </span>
                      <span className="text-xl shrink-0">{match.home_team.flag}</span>
                    </div>

                    {/* Ergebnis-Felder */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {locked ? (
                        <>
                          <div className="w-9 h-9 flex items-center justify-center bg-slate-700 rounded-lg text-white text-sm font-bold">
                            {pick ? pick.home_pick : '–'}
                          </div>
                          <span className="text-slate-500 font-bold text-sm">:</span>
                          <div className="w-9 h-9 flex items-center justify-center bg-slate-700 rounded-lg text-white text-sm font-bold">
                            {pick ? pick.away_pick : '–'}
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="number" min={0} max={20}
                            value={score.home}
                            onChange={e => {
                              setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id] ?? { away: '' }, home: e.target.value } }))
                              setSavedIds(prev => { const n = new Set(prev); n.delete(match.id); return n })
                            }}
                            placeholder="–"
                            className="w-9 h-9 bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-500 font-bold text-sm">:</span>
                          <input
                            type="number" min={0} max={20}
                            value={score.away}
                            onChange={e => {
                              setScores(prev => ({ ...prev, [match.id]: { ...prev[match.id] ?? { home: '' }, away: e.target.value } }))
                              setSavedIds(prev => { const n = new Set(prev); n.delete(match.id); return n })
                            }}
                            placeholder="–"
                            className="w-9 h-9 bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-center text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </>
                      )}
                    </div>

                    {/* Gastmannschaft */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xl shrink-0">{match.away_team.flag}</span>
                      <span className="text-slate-200 text-sm font-medium leading-tight truncate">
                        {match.away_team.name}
                      </span>
                    </div>
                  </div>

                  {/* Punkte wenn Spiel fertig */}
                  {match.status === 'finished' && pick && (
                    <div className="mt-2.5 flex items-center justify-center gap-2 text-xs border-t border-slate-700 pt-2.5">
                      <span className="text-slate-400">
                        Ergebnis: {match.home_score}:{match.away_score}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className={pick.points_earned ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                        {pick.points_earned ?? 0} Punkte
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Speichern-Button — sticky am unteren Rand */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <div className="max-w-lg mx-auto">
          {message && (
            <p className={`text-center text-sm mb-3 px-4 py-2.5 rounded-xl ${
              message.type === 'success'
                ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400'
                : 'bg-red-400/10 border border-red-400/20 text-red-400'
            }`}>
              {message.text}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold py-3.5 rounded-full transition-colors text-base shadow-lg"
          >
            {isPending ? 'Wird gespeichert…' : 'Alle Tips speichern'}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
