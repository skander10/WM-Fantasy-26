import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: players } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, total_points')
    .eq('paid', true)
    .order('total_points', { ascending: false })

  const medals = ['🥇', '🥈', '🥉']

  const bgStyle = {
    backgroundImage: 'url(https://www.afrik-foot.com/thumbor/NLEzF_qqL2ejzGEX-mhf5Rg5Z3o=/2560x1707/smart/filters:format(webp)/https%3A%2F%2Fmedia.afrik-foot.com%2Fmain%2F2025%2F11%2FHannibal-Mejbri-scaled.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundAttachment: 'fixed',
  }

  return (
    <div style={bgStyle} className="min-h-screen">
      <div className="min-h-screen bg-slate-900/70">
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-white">Rangliste</h1>
      </div>

      {/* Keine Spieler */}
      {(!players || players.length === 0) && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">⚽</p>
          <p className="text-slate-400 font-medium">Noch keine Spieler</p>
        </div>
      )}

      {/* Top 3 — größer hervorgehoben */}
      {players && players.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {players.slice(0, 3).map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 border transition-colors ${
                player.id === user?.id
                  ? 'bg-amber-400/10 border-amber-400/40'
                  : i === 0
                  ? 'bg-slate-800 border-amber-400/20'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <span className="text-2xl w-8 text-center">{medals[i]}</span>
              <Avatar name={`${player.first_name} ${player.last_name}`} size="md" />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${
                  player.id === user?.id ? 'text-amber-400' : 'text-white'
                }`}>
                  {player.username}
                  {player.id === user?.id && (
                    <span className="text-amber-400/60 text-xs font-normal ml-2">du</span>
                  )}
                </p>
                <p className="text-slate-500 text-xs truncate">
                  {player.first_name} {player.last_name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-lg ${
                  player.id === user?.id ? 'text-amber-400' : 'text-white'
                }`}>
                  {player.total_points}
                </p>
                <p className="text-slate-500 text-xs">Punkte</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rest der Spieler */}
      {players && players.length > 3 && (
        <div className="flex flex-col gap-2">
          {players.slice(3).map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${
                player.id === user?.id
                  ? 'bg-amber-400/10 border-amber-400/40'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <span className="text-slate-500 text-sm font-medium w-8 text-center">
                {i + 4}
              </span>
              <Avatar name={`${player.first_name} ${player.last_name}`} size="sm" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  player.id === user?.id ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {player.username}
                  {player.id === user?.id && (
                    <span className="text-amber-400/60 text-xs font-normal ml-2">du</span>
                  )}
                </p>
              </div>
              <p className={`font-semibold text-sm shrink-0 ${
                player.id === user?.id ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {player.total_points} Pkt.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Hinweis wenn alle 0 Punkte */}
      {players && players.length > 0 && players.every(p => p.total_points === 0) && (
        <p className="text-center text-slate-600 text-xs mt-6">
          Punkte werden nach den ersten Spielen berechnet.
        </p>
      )}

        </div>
      </div>
    </div>
  )
}
