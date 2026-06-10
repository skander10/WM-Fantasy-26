import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Avatar } from '@/components/Avatar'

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
type Pick = {
  match_id: number
  home_pick: number | null
  away_pick: number | null
  points_earned: number | null
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

function PointsBadge({ points, status, hasPick }: { points: number | null; status: string; hasPick: boolean }) {
  if (status !== 'finished') {
    return hasPick
      ? <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">Tippt abgegeben</span>
      : <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">Kein Tipp</span>
  }
  if (!hasPick) {
    return <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Nicht getippt – 0 Pkt</span>
  }
  if (points === 10) {
    return <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-semibold">🎯 Exakt +10 Pkt</span>
  }
  if (points === 5) {
    return <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-semibold">✅ Tendenz +5 Pkt</span>
  }
  return <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">❌ 0 Pkt</span>
}

export default async function MyScoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: rawMatches }, { data: picks }] = await Promise.all([
    supabase.from('profiles').select('username, first_name, last_name, total_points').eq('id', user.id).single(),
    supabase
      .from('matches')
      .select('id, match_date, status, home_score, away_score, round, home_team:home_team_id(name, flag), away_team:away_team_id(name, flag)')
      .order('match_date', { ascending: true }),
    supabase
      .from('match_picks')
      .select('match_id, home_pick, away_pick, points_earned')
      .eq('user_id', user.id),
  ])

  const matches = (rawMatches ?? []) as unknown as Match[]
  const picksMap = Object.fromEntries(((picks ?? []) as Pick[]).map(p => [p.match_id, p]))
  const groups = groupByDate(matches)

  const finishedCount = matches.filter(m => m.status === 'finished').length
  const totalPoints = profile?.total_points ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar name={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`} size="lg" />
        <div>
          <h1 className="text-xl font-bold text-white">Meine Punkte</h1>
          <p className="text-slate-400 text-sm">{profile?.username}</p>
        </div>
      </div>

      {/* Punkte-Karte */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-amber-400 text-3xl font-bold">{totalPoints}</p>
          <p className="text-slate-400 text-sm mt-0.5">Gesamtpunkte</p>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{finishedCount}</p>
          <p className="text-slate-500 text-xs">Spiele beendet</p>
        </div>
      </div>

      {/* Punkte-Legende */}
      <div className="flex gap-3 mb-6 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="text-amber-400">🎯</span> Exaktes Ergebnis = 10 Pkt</span>
        <span className="flex items-center gap-1"><span className="text-emerald-400">✅</span> Richtige Tendenz = 5 Pkt</span>
      </div>

      {/* Spiele nach Datum gruppiert */}
      {Object.entries(groups).map(([day, dayMatches]) => (
        <div key={day} className="mb-6">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">{day}</p>
          <div className="flex flex-col gap-3">
            {dayMatches.map(match => {
              const pick = picksMap[match.id] as Pick | undefined
              const hasPick = !!pick

              return (
                <div
                  key={match.id}
                  className={`bg-slate-800 border rounded-2xl p-4 ${
                    pick?.points_earned === 10
                      ? 'border-amber-400/40'
                      : pick?.points_earned === 5
                      ? 'border-emerald-400/30'
                      : 'border-slate-700'
                  }`}
                >
                  {/* Zeit + Runde */}
                  <p className="text-slate-500 text-xs mb-3">
                    {formatDate(match.match_date)} · {match.round}
                  </p>

                  {/* Teams + Scores */}
                  <div className="flex items-center gap-2 mb-3">
                    {/* Heimteam */}
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="text-lg">{match.home_team.flag}</span>
                      <span className="text-white text-sm font-medium truncate">{match.home_team.name}</span>
                    </div>

                    {/* Scores nebeneinander */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Mein Tipp */}
                      <div className="flex flex-col items-center">
                        <span className="text-slate-500 text-xs mb-0.5">Tipp</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                          hasPick ? 'text-white bg-slate-700' : 'text-slate-600 bg-slate-700/50'
                        }`}>
                          {hasPick ? `${pick.home_pick}:${pick.away_pick}` : '—'}
                        </span>
                      </div>

                      {/* Trennlinie */}
                      <span className="text-slate-700 text-xs">|</span>

                      {/* Ergebnis */}
                      <div className="flex flex-col items-center">
                        <span className="text-slate-500 text-xs mb-0.5">Ergeb.</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                          match.status === 'finished'
                            ? 'text-white bg-slate-600'
                            : 'text-slate-600 bg-slate-700/50'
                        }`}>
                          {match.status === 'finished' ? `${match.home_score}:${match.away_score}` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Auswärtsteam */}
                    <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                      <span className="text-white text-sm font-medium truncate text-right">{match.away_team.name}</span>
                      <span className="text-lg">{match.away_team.flag}</span>
                    </div>
                  </div>

                  {/* Punkte-Badge */}
                  <div className="flex justify-end">
                    <PointsBadge points={pick?.points_earned ?? null} status={match.status} hasPick={hasPick} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {matches.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-400 font-medium">Noch keine Spiele</p>
        </div>
      )}
    </div>
  )
}
