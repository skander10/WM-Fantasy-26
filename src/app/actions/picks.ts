'use server'

import { createClient } from '@/lib/supabase/server'

type Pick = { matchId: number; homePick: number; awayPick: number }

export async function saveAllPicks(picks: Pick[]): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Nicht eingeloggt.'

  const now = new Date()

  // Spiele aus DB holen um Startzeit zu prüfen
  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_date')
    .in('id', picks.map(p => p.matchId))

  // Nur Tipps für Spiele die noch nicht begonnen haben
  const valid = picks.filter(p => {
    const match = matches?.find(m => m.id === p.matchId)
    return match && new Date(match.match_date) > now
  })

  if (valid.length === 0) return 'Alle gewählten Spiele haben bereits begonnen.'

  const { error } = await supabase.from('match_picks').upsert(
    valid.map(p => ({
      user_id: user.id,
      match_id: p.matchId,
      home_pick: p.homePick,
      away_pick: p.awayPick,
    })),
    { onConflict: 'user_id,match_id' }
  )

  return error ? 'Tipps konnten nicht gespeichert werden.' : null
}

type TournamentPickInput = {
  championId: number
  secondId: number
  thirdId: number
  topScorer: string
  topAssistPlayer: string
  bestPlayer: string
  tunisiaAdvances: boolean
}

export async function saveTournamentPick(input: TournamentPickInput): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Nicht eingeloggt.'

  // Globale Sperre prüfen
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'tournament_picks_locked')
    .single()
  if (setting?.value === 'true') return 'Das Tippen wurde vom Admin gesperrt.'

  // Nutzer-eigene Sperre prüfen
  const { data: existing } = await supabase
    .from('tournament_picks')
    .select('is_locked')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing?.is_locked) return 'Dein Tipp wurde bereits gesperrt und kann nicht mehr geändert werden.'

  const { error } = await supabase.from('tournament_picks').upsert(
    {
      user_id: user.id,
      champion_team_id: input.championId,
      second_team_id: input.secondId,
      third_team_id: input.thirdId,
      top_scorer: input.topScorer,
      top_assist_player: input.topAssistPlayer,
      best_player: input.bestPlayer,
      tunisia_advances: input.tunisiaAdvances,
      is_locked: true,
    },
    { onConflict: 'user_id' }
  )

  return error ? `Fehler: ${error.message}` : null
}
