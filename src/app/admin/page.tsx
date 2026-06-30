import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { AdminClient } from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: lockSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'tournament_picks_locked')
    .single()

  const { data: oneChangeSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'tournament_one_change_mode')
    .maybeSingle()

  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, paid')
    .order('paid', { ascending: false })

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, match_date, status, home_score, away_score, round,
      home_team:home_team_id(name, flag),
      away_team:away_team_id(name, flag)
    `)
    .order('match_date', { ascending: true })

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag, group_name')
    .order('group_name').order('name')

  const { data: tournamentResults } = await supabase
    .from('tournament_results')
    .select('*')
    .maybeSingle()

  const { data: tournamentPicks } = await supabase
    .from('tournament_picks')
    .select('user_id, champion_team_id, second_team_id, third_team_id, top_scorer, top_assist_player, best_player, tunisia_advances, is_locked')

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar isAdmin />
      <AdminClient
        players={(players ?? []) as any}
        matches={(matches ?? []) as any}
        tournamentLocked={lockSetting?.value === 'true'}
        oneChangeMode={oneChangeSetting?.value === 'true'}
        teams={(teams ?? []) as any}
        tournamentResults={tournamentResults ?? null}
        tournamentPicks={(tournamentPicks ?? []) as any}
      />
    </div>
  )
}
