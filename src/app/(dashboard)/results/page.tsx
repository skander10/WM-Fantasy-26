import { createClient } from '@/lib/supabase/server'

type Team = { name: string; flag: string }
type Match = {
  id: number
  match_date: string
  home_score: number
  away_score: number
  round: string
  home_team: Team
  away_team: Team
}
type StartedMatch = {
  id: number
  match_date: string
  round: string
  home_team: Team
  away_team: Team
}
type Pick = {
  match_id: number
  home_pick: number | null
  away_pick: number | null
  points_earned: number | null
  user_id: string
}
type ParticipationRow = { match_id: number; username: string }

function pickColor(pts: number | null, hasPick: boolean) {
  if (!hasPick) return { bg: 'bg-slate-700/50', text: 'text-slate-500', label: '—' }
  if (pts === 10) return { bg: 'bg-emerald-500/20 border border-emerald-500/40', text: 'text-emerald-400', label: '🟢 10' }
  if (pts === 5)  return { bg: 'bg-amber-400/20 border border-amber-400/40',   text: 'text-amber-400',   label: '🟡 5'  }
  return           { bg: 'bg-red-500/20 border border-red-500/40',             text: 'text-red-400',     label: '🔴 0'  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  })
}

function groupByDate(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {}
  for (const m of matches) {
    const day = new Date(m.match_date).toLocaleDateString('de-DE', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin',
    })
    if (!groups[day]) groups[day] = []
    groups[day].push(m)
  }
  return groups
}

export default async function ResultsPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Total registered users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Paid/unlocked players
  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name')
    .eq('paid', true)
    .order('username')

  const paidCount = players?.length ?? 0

  // ── 1. Noch nicht gestartet (scheduled + match_date > now) ──────────────
  const { data: participationData } = await supabase.rpc('get_today_participation')
  const participation = (participationData ?? []) as ParticipationRow[]

  // Heute noch nicht gestartete Spiele (für Teilnahme-Anzeige)
  const nowBerlin = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
  const todayStart = new Date(nowBerlin + 'T00:00:00+02:00').toISOString()

  const { data: rawUpcoming } = await supabase
    .from('matches')
    .select('id, match_date, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
    .eq('status', 'scheduled')
    .gte('match_date', todayStart)
    .gt('match_date', now)
    .order('match_date', { ascending: true })

  const upcomingToday = (rawUpcoming ?? []) as unknown as StartedMatch[]

  // ── 2. Gestartet aber noch nicht fertig (scheduled + match_date <= now) ─
  const { data: rawStarted } = await supabase
    .from('matches')
    .select('id, match_date, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
    .eq('status', 'scheduled')
    .lte('match_date', now)
    .order('match_date', { ascending: false })

  const startedMatches = (rawStarted ?? []) as unknown as StartedMatch[]

  // Picks für gestartete Spiele laden
  let startedPicks: Pick[] = []
  if (startedMatches.length > 0) {
    const ids = startedMatches.map(m => m.id)
    const { data } = await supabase
      .from('match_picks')
      .select('match_id, home_pick, away_pick, points_earned, user_id')
      .in('match_id', ids)
    startedPicks = (data ?? []) as Pick[]
  }

  // ── 3. Fertige Spiele (status = finished) ───────────────────────────────
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rawFinished } = await supabase
    .from('matches')
    .select('id, match_date, home_score, away_score, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
    .eq('status', 'finished')
    .gte('match_date', twoDaysAgo)
    .order('match_date', { ascending: false })

  let displayFinished = (rawFinished ?? []) as unknown as Match[]
  if (displayFinished.length === 0) {
    const { data: fallback } = await supabase
      .from('matches')
      .select('id, match_date, home_score, away_score, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(5)
    displayFinished = (fallback ?? []) as unknown as Match[]
  }

  let finishedPicks: Pick[] = []
  if (displayFinished.length > 0) {
    const ids = displayFinished.map(m => m.id)
    const { data } = await supabase
      .from('match_picks')
      .select('match_id, home_pick, away_pick, points_earned, user_id')
      .in('match_id', ids)
    finishedPicks = (data ?? []) as Pick[]
  }

  const finishedGroups = groupByDate(displayFinished)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-xl font-bold text-white mb-6">Tipps-Vergleich</h1>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{totalUsers ?? 0}</p>
          <p className="text-slate-400 text-xs mt-1">Registrierte Spieler</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{paidCount}</p>
          <p className="text-slate-400 text-xs mt-1">Freigeschaltet</p>
        </div>
      </div>

      {/* ── Heute noch nicht gestartet: Teilnahme ── */}
      {upcomingToday.length > 0 && (
        <section className="mb-8">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Heute · Wer hat getippt?</p>
          <div className="flex flex-col gap-3">
            {upcomingToday.map(match => {
              const tipped = participation.filter(p => p.match_id === match.id)
              const tippedUsernames = new Set(tipped.map(p => p.username))
              const notTipped = (players ?? []).filter(p => !tippedUsernames.has(p.username))
              const tippedCount = tipped.length
              return (
                <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-500 text-xs mb-1">{formatTime(match.match_date)} · {match.round}</p>
                      <p className="text-white text-sm font-medium">
                        {match.home_team.flag} {match.home_team.name} vs {match.away_team.name} {match.away_team.flag}
                      </p>
                    </div>
                    <div className="shrink-0 ml-4 text-right">
                      <p className="text-xl font-bold text-white">
                        {tippedCount}<span className="text-slate-500 text-sm font-normal">/{paidCount}</span>
                      </p>
                      <p className="text-slate-500 text-xs">getippt</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full"
                      style={{ width: paidCount > 0 ? `${Math.round((tippedCount / paidCount) * 100)}%` : '0%' }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tipped.map(p => (
                      <span key={p.username} className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2 py-0.5 rounded-lg font-medium">
                        ✓ {p.username}
                      </span>
                    ))}
                    {notTipped.map(p => (
                      <span key={p.username} className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-lg font-medium">
                        ✗ {p.username}
                      </span>
                    ))}
                  </div>
                  {tipped.length === 0 && notTipped.length === 0 && (
                    <p className="text-slate-600 text-xs">Noch niemand hat getippt</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Gestartet, noch kein Ergebnis: Tipps sichtbar, keine Farben ── */}
      {startedMatches.length > 0 && (
        <section className="mb-8">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">🔴 Läuft gerade · Tipps sichtbar</p>
          <div className="flex flex-col gap-4">
            {startedMatches.map(match => {
              const matchPicks = startedPicks.filter(p => p.match_id === match.id)
              const picksMap = Object.fromEntries(matchPicks.map(p => [p.user_id, p]))
              return (
                <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <p className="text-slate-500 text-xs mb-2">{formatDate(match.match_date)} · {match.round}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white text-sm font-medium">
                      {match.home_team.flag} {match.home_team.name}
                    </span>
                    <span className="bg-slate-700 text-slate-400 font-bold text-lg px-4 py-1 rounded-xl">
                      ? : ?
                    </span>
                    <span className="text-white text-sm font-medium text-right">
                      {match.away_team.name} {match.away_team.flag}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(players ?? []).map(player => {
                      const pick = picksMap[player.id]
                      const hasPick = !!pick
                      return (
                        <div key={player.id} className="flex items-center gap-3 rounded-xl px-3 py-2 bg-slate-700/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{player.username}</p>
                          </div>
                          <span className={`text-sm font-bold ${hasPick ? 'text-white' : 'text-slate-600'}`}>
                            {hasPick ? `${pick.home_pick} : ${pick.away_pick}` : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Fertige Spiele: Tipps mit Farben + Punkte ── */}
      {displayFinished.length === 0 && startedMatches.length === 0 && upcomingToday.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-white font-semibold">Noch keine Spiele gestartet</p>
          <p className="text-slate-400 text-sm mt-2">Hier siehst du nach Anpfiff die Tipps aller Spieler.</p>
        </div>
      )}

      {displayFinished.length > 0 && (
        <>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Letzte fertige Spiele</p>
          {Object.entries(finishedGroups).map(([day, dayMatches]) => (
            <div key={day} className="mb-8">
              <p className="text-slate-600 text-xs font-medium mb-3">{day}</p>
              {dayMatches.map(match => {
                const matchPicks = finishedPicks.filter(p => p.match_id === match.id)
                const picksMap = Object.fromEntries(matchPicks.map(p => [p.user_id, p]))
                return (
                  <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
                    <p className="text-slate-500 text-xs mb-2">{formatDate(match.match_date)} · {match.round}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white text-sm font-medium">
                        {match.home_team.flag} {match.home_team.name}
                      </span>
                      <span className="bg-slate-700 text-white font-bold text-lg px-4 py-1 rounded-xl">
                        {match.home_score} : {match.away_score}
                      </span>
                      <span className="text-white text-sm font-medium text-right">
                        {match.away_team.name} {match.away_team.flag}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(players ?? []).map(player => {
                        const pick = picksMap[player.id]
                        const hasPick = !!pick
                        const { bg, text, label } = pickColor(pick?.points_earned ?? null, hasPick)
                        return (
                          <div key={player.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${bg}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{player.username}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-sm font-bold ${text}`}>
                                {hasPick ? `${pick.home_pick} : ${pick.away_pick}` : '—'}
                              </span>
                              <span className={`text-xs font-semibold w-12 text-right ${text}`}>
                                {label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
