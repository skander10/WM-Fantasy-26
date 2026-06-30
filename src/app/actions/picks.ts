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

  // One-Change-Modus prüfen
  const { data: oneChangeSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'tournament_one_change_mode')
    .maybeSingle()

  if (oneChangeSetting?.value === 'true') {
    // Bereits verwendet? (JSON-Array mit User-IDs)
    const { data: usedSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'tournament_change_used_users')
      .maybeSingle()
    const usedUsers: string[] = JSON.parse(usedSetting?.value ?? '[]')
    if (usedUsers.includes(user.id)) return 'Du hast deine eine Änderung bereits verwendet.'

    // Bestehenden Tipp laden
    const { data: existing } = await supabase
      .from('tournament_picks')
      .select('champion_team_id, second_team_id, third_team_id, top_scorer, top_assist_player, best_player, tunisia_advances')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!existing) return 'Kein bestehender Tipp gefunden.'

    // Anzahl geänderter Felder zählen
    const changedCount = [
      existing.champion_team_id !== input.championId,
      existing.second_team_id !== input.secondId,
      existing.third_team_id !== input.thirdId,
      existing.top_scorer !== input.topScorer,
      existing.top_assist_player !== input.topAssistPlayer,
      existing.best_player !== input.bestPlayer,
      existing.tunisia_advances !== input.tunisiaAdvances,
    ].filter(Boolean).length

    if (changedCount === 0) return 'Du hast nichts geändert.'
    if (changedCount > 1) return `Du darfst nur 1 Antwort ändern, aber du hast ${changedCount} geändert.`

    // Genau 1 Änderung — speichern
    const { error } = await supabase
      .from('tournament_picks')
      .update({
        champion_team_id: input.championId,
        second_team_id: input.secondId,
        third_team_id: input.thirdId,
        top_scorer: input.topScorer,
        top_assist_player: input.topAssistPlayer,
        best_player: input.bestPlayer,
        tunisia_advances: input.tunisiaAdvances,
      })
      .eq('user_id', user.id)
    if (error) return `Fehler: ${error.message}`

    // User-ID in JSON-Array eintragen
    await supabase
      .from('app_settings')
      .update({ value: JSON.stringify([...usedUsers, user.id]) })
      .eq('key', 'tournament_change_used_users')

    return null
  }

  // Normaler Modus: globale Sperre prüfen
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
