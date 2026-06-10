'use client'

import { useState, useTransition } from 'react'
import { saveTournamentPick } from '@/app/actions/picks'

type Team = { id: number; name: string; flag: string; group_name: string }
type ExistingPick = {
  champion_team_id: number | null
  second_team_id: number | null
  third_team_id: number | null
  top_scorer: string | null
  top_assist_player: string | null
  best_player: string | null
  tunisia_advances: boolean | null
  is_locked: boolean
}

function TeamSelect({
  value,
  onChange,
  teams,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  teams: Team[]
  placeholder: string
  disabled: boolean
}) {
  const grouped = teams.reduce<Record<string, Team[]>>((acc, t) => {
    if (!acc[t.group_name]) acc[t.group_name] = []
    acc[t.group_name].push(t)
    return acc
  }, {})

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-xl text-white text-sm px-3 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {Object.entries(grouped).sort().map(([grp, ts]) => (
        <optgroup key={grp} label={`Gruppe ${grp}`}>
          {ts.map(t => (
            <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled: boolean
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full bg-slate-700 border border-slate-600 focus:border-amber-400 focus:outline-none rounded-xl text-white text-sm px-3 py-2.5 placeholder-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
    />
  )
}

export function TournamentClient({
  teams,
  existing,
  globalLocked,
}: {
  teams: Team[]
  existing: ExistingPick | null
  globalLocked: boolean
}) {
  const isLocked = existing?.is_locked || globalLocked

  const [champion, setChampion] = useState(String(existing?.champion_team_id ?? ''))
  const [second, setSecond] = useState(String(existing?.second_team_id ?? ''))
  const [third, setThird] = useState(String(existing?.third_team_id ?? ''))
  const [scorer, setScorer] = useState(existing?.top_scorer ?? '')
  const [assists, setAssists] = useState(existing?.top_assist_player ?? '')
  const [bestPlayer, setBestPlayer] = useState(existing?.best_player ?? '')
  const [tunisiaAdv, setTunisiaAdv] = useState<string>(
    existing?.tunisia_advances === null ? '' : existing?.tunisia_advances ? 'yes' : 'no'
  )
  const [feedback, setFeedback] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!champion || !second || !third) {
      setFeedback('Bitte Weltmeister, Finalist und Dritter Platz auswählen.')
      return
    }
    const ids = [Number(champion), Number(second), Number(third)]
    if (new Set(ids).size !== 3) {
      setFeedback('Weltmeister, Finalist und Dritter Platz müssen verschiedene Teams sein.')
      return
    }
    if (!scorer.trim() || !assists.trim() || !bestPlayer.trim()) {
      setFeedback('Bitte alle Spielernamen ausfüllen.')
      return
    }
    if (!tunisiaAdv) {
      setFeedback('Bitte Tunesien-Tipp auswählen.')
      return
    }
    startTransition(async () => {
      const error = await saveTournamentPick({
        championId: Number(champion),
        secondId: Number(second),
        thirdId: Number(third),
        topScorer: scorer.trim(),
        topAssistPlayer: assists.trim(),
        bestPlayer: bestPlayer.trim(),
        tunisiaAdvances: tunisiaAdv === 'yes',
      })
      if (error) {
        setFeedback(error)
      } else {
        setFeedback('Tipp gespeichert und gesperrt ✅')
      }
    })
  }

  const fields: { icon: string; label: string; pts: number; content: React.ReactNode }[] = [
    {
      icon: '🏆',
      label: 'Weltmeister',
      pts: 50,
      content: (
        <TeamSelect value={champion} onChange={setChampion} teams={teams}
          placeholder="— Team auswählen —" disabled={isLocked} />
      ),
    },
    {
      icon: '🥈',
      label: 'Finalist',
      pts: 30,
      content: (
        <TeamSelect value={second} onChange={setSecond} teams={teams}
          placeholder="— Team auswählen —" disabled={isLocked} />
      ),
    },
    {
      icon: '🥉',
      label: 'Dritter Platz',
      pts: 25,
      content: (
        <TeamSelect value={third} onChange={setThird} teams={teams}
          placeholder="— Team auswählen —" disabled={isLocked} />
      ),
    },
    {
      icon: '👟',
      label: 'Torschützenkönig',
      pts: 25,
      content: (
        <TextInput value={scorer} onChange={setScorer}
          placeholder="z.B. Kylian Mbappé" disabled={isLocked} />
      ),
    },
    {
      icon: '🎯',
      label: 'Meiste Assists',
      pts: 35,
      content: (
        <TextInput value={assists} onChange={setAssists}
          placeholder="z.B. Kevin De Bruyne" disabled={isLocked} />
      ),
    },
    {
      icon: '⭐',
      label: 'Bester Spieler des Turniers',
      pts: 25,
      content: (
        <TextInput value={bestPlayer} onChange={setBestPlayer}
          placeholder="z.B. Erling Haaland" disabled={isLocked} />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* Gesperrt-Banner */}
      {isLocked && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">Tipp gesperrt</p>
            <p className="text-slate-400 text-xs">
              {existing?.is_locked
                ? 'Du hast deinen Tipp bereits abgegeben und gesperrt.'
                : 'Das Tippen wurde vom Admin gesperrt.'}
            </p>
          </div>
        </div>
      )}

      {/* Team-Picks + Spieler-Tipps */}
      {fields.map(({ icon, label, pts, content }) => (
        <div key={label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <p className="text-white font-semibold text-sm">{label}</p>
            </div>
            <span className="text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">
              {pts} Pkt
            </span>
          </div>
          {content}
        </div>
      ))}

      {/* Tunesien */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇹🇳</span>
            <p className="text-white font-semibold text-sm">Schafft Tunesien die nächste Runde?</p>
          </div>
          <span className="text-amber-400 text-xs font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">
            25 Pkt
          </span>
        </div>
        <div className="flex gap-3">
          {[{ val: 'yes', label: '✅ Ja, schafft es' }, { val: 'no', label: '❌ Nein, scheidet aus' }].map(opt => (
            <button
              key={opt.val}
              disabled={isLocked}
              onClick={() => setTunisiaAdv(opt.val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:cursor-not-allowed ${
                tunisiaAdv === opt.val
                  ? 'bg-amber-400 border-amber-400 text-slate-900'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`text-sm text-center py-1 ${
          feedback.includes('✅') ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {feedback}
        </p>
      )}

      {/* Speichern-Button */}
      {!isLocked && (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-2xl text-sm transition-colors"
        >
          {isPending ? 'Speichern...' : existing ? 'Tipp abgeben & sperren' : 'Tipp abgeben & sperren'}
        </button>
      )}

      {!isLocked && (
        <p className="text-slate-600 text-xs text-center">
          ⚠️ Nach dem Speichern kannst du deinen Tipp nicht mehr ändern.
        </p>
      )}
    </div>
  )
}
