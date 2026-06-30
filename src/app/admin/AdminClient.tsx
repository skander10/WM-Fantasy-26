'use client'

import { useState, useTransition } from 'react'
import { Check, X } from 'lucide-react'
import { setUserPaid, saveMatchResult, setTournamentLocked, saveTournamentResults, calculateTournamentPoints, addMatch, updateMatchDate, setOneChangeMode } from '@/app/actions/admin'

type Player = {
  id: string
  username: string
  first_name: string
  last_name: string
  paid: boolean
}

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

type Team = { id: number; name: string; flag: string; group_name: string }
type TournamentResults = {
  champion_team_id: number | null
  second_team_id: number | null
  third_team_id: number | null
  top_scorer: string | null
  top_assist_player: string | null
  best_player: string | null
  tunisia_advances: boolean | null
  calculated_at: string | null
}

export function AdminClient({
  players,
  matches,
  tournamentLocked,
  oneChangeMode,
  teams,
  tournamentResults,
}: {
  players: Player[]
  matches: Match[]
  tournamentLocked: boolean
  oneChangeMode: boolean
  teams: Team[]
  tournamentResults: TournamentResults | null
}) {
  const [tab, setTab] = useState<'players' | 'matches' | 'settings' | 'tournament'>('matches')
  const [tChampion, setTChampion] = useState(String(tournamentResults?.champion_team_id ?? ''))
  const [tSecond, setTSecond] = useState(String(tournamentResults?.second_team_id ?? ''))
  const [tThird, setTThird] = useState(String(tournamentResults?.third_team_id ?? ''))
  const [tScorer, setTScorer] = useState(tournamentResults?.top_scorer ?? '')
  const [tAssist, setTAssist] = useState(tournamentResults?.top_assist_player ?? '')
  const [tBest, setTBest] = useState(tournamentResults?.best_player ?? '')
  const [tTunisia, setTTunisia] = useState<string>(
    tournamentResults?.tunisia_advances === null ? '' : tournamentResults?.tunisia_advances ? 'yes' : 'no'
  )
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [editingDate, setEditingDate] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  // Spiel hinzufügen
  const [showAddMatch, setShowAddMatch] = useState(false)
  const [newHome, setNewHome] = useState('')
  const [newAway, setNewAway] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newRound, setNewRound] = useState('')

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
        {(['matches', 'players', 'tournament', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'matches' ? '⚽ Spiele' : t === 'players' ? '👥 Spieler' : t === 'tournament' ? '🏆 Turnier' : '⚙️ Einst.'}
          </button>
        ))}
      </div>

      {/* Tab: Spiele */}
      {tab === 'matches' && (
        <div className="flex flex-col gap-4">

          {/* Spiel hinzufügen */}
          <button
            onClick={() => setShowAddMatch(v => !v)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-dashed border-slate-600 hover:border-amber-400 text-slate-400 hover:text-amber-400 py-3 rounded-2xl text-sm font-medium transition-colors"
          >
            {showAddMatch ? '✕ Abbrechen' : '＋ Spiel hinzufügen'}
          </button>

          {showAddMatch && (
            <div className="bg-slate-800 border border-amber-400/30 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-white text-sm font-semibold">Neues Spiel</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Heimteam</p>
                  <select value={newHome} onChange={e => setNewHome(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2">
                    <option value="">— Heim —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Auswärtsteam</p>
                  <select value={newAway} onChange={e => setNewAway(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2">
                    <option value="">— Auswärts —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Datum & Uhrzeit (Berlin)</p>
                  <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Runde</p>
                  <input type="text" value={newRound} onChange={e => setNewRound(e.target.value)}
                    placeholder="z.B. Gruppe A"
                    className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2 placeholder-slate-500" />
                </div>
              </div>

              {feedback['add_match'] && (
                <p className={`text-xs text-center ${feedback['add_match'].includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {feedback['add_match']}
                </p>
              )}

              <button
                disabled={isPending || !newHome || !newAway || !newDate || !newRound}
                onClick={() => {
                  startTransition(async () => {
                    // datetime-local liefert "YYYY-MM-DDTHH:mm" ohne TZ → als Berliner Zeit interpretieren
                    const isoDate = new Date(newDate + ':00').toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' }).replace(' ', 'T') + '+02:00'
                    const err = await addMatch({
                      homeTeamId: Number(newHome),
                      awayTeamId: Number(newAway),
                      matchDate: isoDate,
                      round: newRound,
                    })
                    if (err) {
                      showFeedback('add_match', err)
                    } else {
                      showFeedback('add_match', 'Spiel hinzugefügt ✅')
                      setNewHome(''); setNewAway(''); setNewDate(''); setNewRound('')
                      setShowAddMatch(false)
                    }
                  })
                }}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-900 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Spiel speichern
              </button>
            </div>
          )}

          {matches.length === 0 && (
            <p className="text-slate-500 text-center py-10">Keine Spiele vorhanden.</p>
          )}
          {matches.map(match => (
            <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-500 text-xs" suppressHydrationWarning>{time(match.match_date)} · {match.round}</p>
                <button
                  onClick={() => setEditingDate(prev => ({
                    ...prev,
                    [match.id]: new Date(match.match_date).toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' }).slice(0, 16)
                  }))}
                  className="text-slate-500 hover:text-amber-400 text-xs transition-colors"
                >
                  ✏️
                </button>
              </div>

              {editingDate[match.id] !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="datetime-local"
                    value={editingDate[match.id]}
                    onChange={e => setEditingDate(prev => ({ ...prev, [match.id]: e.target.value }))}
                    className="flex-1 bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-xs px-2 py-1.5"
                  />
                  <button
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const iso = new Date(editingDate[match.id] + ':00').toLocaleString('sv-SE', { timeZone: 'Europe/Berlin' }).replace(' ', 'T') + '+02:00'
                        const err = await updateMatchDate(match.id, iso)
                        if (err) { showFeedback(`m${match.id}`, err) }
                        else { showFeedback(`m${match.id}`, 'Datum gespeichert ✅'); setEditingDate(prev => { const n = { ...prev }; delete n[match.id]; return n }) }
                      })
                    }}
                    className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingDate(prev => { const n = { ...prev }; delete n[match.id]; return n })}
                    className="text-slate-500 hover:text-white text-xs px-2 py-1.5"
                  >
                    ✕
                  </button>
                </div>
              )}

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

      {/* Tab: Turnier-Auswertung */}
      {tab === 'tournament' && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-400 text-xs">Trage das echte Turnier-Ergebnis ein und berechne die Punkte für alle Spieler.</p>

          {tournamentResults?.calculated_at && (
            <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl px-4 py-3 text-xs text-emerald-400">
              ✅ Punkte wurden berechnet am {new Date(tournamentResults.calculated_at).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
            </div>
          )}

          {/* Team-Picks */}
          {[
            { label: '🏆 Weltmeister', val: tChampion, set: setTChampion },
            { label: '🥈 Finalist', val: tSecond, set: setTSecond },
            { label: '🥉 Dritter Platz', val: tThird, set: setTThird },
          ].map(({ label, val, set }) => {
            const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
              if (!acc[t.group_name]) acc[t.group_name] = []
              acc[t.group_name].push(t)
              return acc
            }, {})
            return (
              <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                <p className="text-white text-sm font-medium mb-2">{label}</p>
                <select value={val} onChange={e => set(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2">
                  <option value="">— Team auswählen —</option>
                  {Object.entries(grouped).sort().map(([grp, ts]) => (
                    <optgroup key={grp} label={`Gruppe ${grp}`}>
                      {ts.map(t => <option key={t.id} value={t.id}>{t.flag} {t.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            )
          })}

          {/* Text-Felder */}
          {[
            { label: '👟 Torschützenkönig', val: tScorer, set: setTScorer, ph: 'z.B. Kylian Mbappé' },
            { label: '🎯 Meiste Assists', val: tAssist, set: setTAssist, ph: 'z.B. Kevin De Bruyne' },
            { label: '⭐ Bester Spieler', val: tBest, set: setTBest, ph: 'z.B. Erling Haaland' },
          ].map(({ label, val, set, ph }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
              <p className="text-white text-sm font-medium mb-2">{label}</p>
              <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-lg text-white text-sm px-3 py-2 placeholder-slate-500" />
            </div>
          ))}

          {/* Tunesien */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <p className="text-white text-sm font-medium mb-2">🇹🇳 Hat Tunesien die nächste Runde geschafft?</p>
            <div className="flex gap-2">
              {[{ val: 'yes', label: '✅ Ja' }, { val: 'no', label: '❌ Nein' }].map(opt => (
                <button key={opt.val} onClick={() => setTTunisia(opt.val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    tTunisia === opt.val ? 'bg-amber-400 border-amber-400 text-slate-900' : 'bg-slate-700 border-slate-600 text-slate-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {feedback['tournament_save'] && (
            <p className={`text-sm text-center ${feedback['tournament_save'].includes('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
              {feedback['tournament_save']}
            </p>
          )}

          {/* Speichern */}
          <button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const err = await saveTournamentResults({
                  championId: Number(tChampion), secondId: Number(tSecond), thirdId: Number(tThird),
                  topScorer: tScorer, topAssistPlayer: tAssist, bestPlayer: tBest,
                  tunisiaAdvances: tTunisia === 'yes',
                })
                showFeedback('tournament_save', err ?? 'Ergebnis gespeichert ✅')
              })
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            💾 Ergebnis speichern
          </button>

          {/* Punkte berechnen */}
          <button
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const err = await calculateTournamentPoints()
                showFeedback('tournament_save', err ?? '🎉 Punkte für alle Spieler berechnet!')
              })
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            🏆 Turnier-Punkte jetzt berechnen
          </button>
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

          {/* One-Change-Modus */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">✏️</span>
              <div>
                <p className="text-white font-semibold">1-Änderung-Modus</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Jeder User darf genau eine Antwort ändern. Mehr als 1 Änderung wird abgelehnt. Nach der Änderung ist der Tipp wieder endgültig gesperrt.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">
                  Status: {oneChangeMode
                    ? <span className="text-amber-400">✏️ Aktiv</span>
                    : <span className="text-slate-400">⏸ Inaktiv</span>}
                </p>
              </div>
              <button
                onClick={() => {
                  startTransition(async () => {
                    const error = await setOneChangeMode(!oneChangeMode)
                    if (error) showFeedback('onechange', error)
                    else showFeedback('onechange', oneChangeMode ? 'Deaktiviert ✅' : 'Aktiviert ✏️')
                  })
                }}
                disabled={isPending}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  oneChangeMode
                    ? 'bg-red-400/10 hover:bg-red-400/20 text-red-400'
                    : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400'
                }`}
              >
                {oneChangeMode ? '⏹ Deaktivieren' : '▶ Aktivieren'}
              </button>
            </div>
            {feedback['onechange'] && (
              <p className="text-xs text-center mt-2 text-amber-400">{feedback['onechange']}</p>
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
