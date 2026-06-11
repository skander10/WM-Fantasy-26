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
type Pick = {
  match_id: number
  home_pick: number | null
  away_pick: number | null
  points_earned: number | null
  user_id: string
  profiles: { username: string; first_name: string; last_name: string }
}

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

  // Fertige Spiele der letzten 2 Tage
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rawMatches } = await supabase
    .from('matches')
    .select('id, match_date, home_score, away_score, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
    .eq('status', 'finished')
    .gte('match_date', twoDaysAgo)
    .order('match_date', { ascending: false })

  const matches = (rawMatches ?? []) as unknown as Match[]

  // Fallback: letzte 5 fertige Spiele wenn heute nichts
  let displayMatches = matches
  if (matches.length === 0) {
    const { data: fallback } = await supabase
      .from('matches')
      .select('id, match_date, home_score, away_score, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(5)
    displayMatches = (fallback ?? []) as unknown as Match[]
  }

  if (displayMatches.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white mb-6">Tipps-Vergleich</h1>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-white font-semibold">Noch keine fertigen Spiele</p>
          <p className="text-slate-400 text-sm mt-2">Hier siehst du nach Spielende die Tipps aller Spieler.</p>
        </div>
      </div>
    )
  }

  // Alle Picks für diese Spiele laden
  const matchIds = displayMatches.map(m => m.id)
  const { data: rawPicks } = await supabase
    .from('match_picks')
    .select('match_id, home_pick, away_pick, points_earned, user_id, profiles:user_id(username, first_name, last_name)')
    .in('match_id', matchIds)

  const picks = (rawPicks ?? []) as unknown as Pick[]

  // Alle Spieler (paid=true) für vollständige Liste
  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name')
    .eq('paid', true)
    .order('username')

  const groups = groupByDate(displayMatches)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Tipps-Vergleich</h1>
        <span className="text-slate-500 text-xs">Letzte fertige Spiele</span>
      </div>

      {Object.entries(groups).map(([day, dayMatches]) => (
        <div key={day} className="mb-8">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">{day}</p>

          {dayMatches.map(match => {
            const matchPicks = picks.filter(p => p.match_id === match.id)
            const picksMap = Object.fromEntries(matchPicks.map(p => [p.user_id, p]))

            return (
              <div key={match.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-4">
                {/* Match Header */}
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

                {/* Spieler-Tipps */}
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
    </div>
  )
}
