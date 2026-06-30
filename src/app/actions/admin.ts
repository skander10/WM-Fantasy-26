'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

export async function setUserPaid(userId: string, paid: boolean): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase.from('profiles').update({ paid }).eq('id', userId)
  if (error) return error.message
  revalidatePath('/admin')
  return null
}

export async function setOneChangeMode(enabled: boolean): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase
    .from('app_settings')
    .update({ value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
    .eq('key', 'tournament_one_change_mode')
  if (error) return error.message
  revalidatePath('/admin')
  revalidatePath('/predict/tournament')
  return null
}

export async function setTournamentLocked(locked: boolean): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase
    .from('app_settings')
    .update({ value: locked ? 'true' : 'false', updated_at: new Date().toISOString() })
    .eq('key', 'tournament_picks_locked')
  if (error) return error.message
  revalidatePath('/admin')
  revalidatePath('/predict/tournament')
  return null
}

export async function saveTournamentResults(data: {
  championId: number
  secondId: number
  thirdId: number
  topScorer: string
  topAssistPlayer: string
  bestPlayer: string
  tunisiaAdvances: boolean
}): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase.from('tournament_results').upsert({
    id: 1,
    champion_team_id: data.championId,
    second_team_id: data.secondId,
    third_team_id: data.thirdId,
    top_scorer: data.topScorer.trim(),
    top_assist_player: data.topAssistPlayer.trim(),
    best_player: data.bestPlayer.trim(),
    tunisia_advances: data.tunisiaAdvances,
  }, { onConflict: 'id' })
  if (error) return error.message
  revalidatePath('/admin')
  return null
}

export async function calculateTournamentPoints(): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase.rpc('admin_calculate_tournament_points')
  if (error) return error.message
  revalidatePath('/admin')
  revalidatePath('/ranking')
  return null
}

export async function addMatch(data: {
  homeTeamId: number
  awayTeamId: number
  matchDate: string
  round: string
}): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  if (data.homeTeamId === data.awayTeamId) return 'Heim- und Auswärtsteam müssen unterschiedlich sein.'
  const { error } = await supabase.from('matches').insert({
    home_team_id: data.homeTeamId,
    away_team_id: data.awayTeamId,
    match_date: data.matchDate,
    round: data.round.trim(),
    status: 'scheduled',
  })
  if (error) return error.message
  revalidatePath('/admin')
  revalidatePath('/predict/matches')
  return null
}

export async function updateMatchDate(matchId: number, matchDate: string): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'
  const { error } = await supabase.from('matches').update({ match_date: matchDate }).eq('id', matchId)
  if (error) return error.message
  revalidatePath('/admin')
  revalidatePath('/predict/matches')
  return null
}

export async function saveMatchResult(
  matchId: number,
  homeScore: number,
  awayScore: number
): Promise<string | null> {
  const supabase = await getAdminClient()
  if (!supabase) return 'Keine Admin-Berechtigung.'

  const { error } = await supabase.rpc('admin_save_match_result', {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  })

  if (error) return `${error.message} | code: ${error.code} | details: ${error.details ?? '-'}`

  revalidatePath('/admin')
  revalidatePath('/ranking')
  return null
}
