import { createClient } from '@/lib/supabase/server'
import { MatchesClient } from './MatchesClient'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_date, status, home_score, away_score, round,
      home_team:home_team_id(id, name, flag),
      away_team:away_team_id(id, name, flag)
    `)
    .neq('status', 'finished')
    .order('match_date', { ascending: true })

  const { data: picks } = await supabase
    .from('match_picks')
    .select('match_id, home_pick, away_pick, points_earned')
    .eq('user_id', user!.id)

  const picksMap = Object.fromEntries(
    (picks ?? []).map(p => [p.match_id, p])
  )

  return (
    <MatchesClient
      matches={(matches ?? []) as any}
      picksMap={picksMap}
    />
  )
}
