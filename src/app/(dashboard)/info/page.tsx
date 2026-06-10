export default function InfoPage() {
  const matchPoints = [
    { label: 'Exaktes Ergebnis', desc: 'z.B. du tippst 2:1 — Ergebnis ist 2:1', pts: 10, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
    { label: 'Richtige Tendenz', desc: 'Sieg, Niederlage oder Unentschieden stimmt, aber nicht das genaue Ergebnis', pts: 5, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
    { label: 'Falsch getippt', desc: 'Weder Ergebnis noch Tendenz stimmen', pts: 0, color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-700' },
  ]

  const tournamentPoints = [
    { icon: '🏆', label: 'Weltmeister', pts: 50 },
    { icon: '🎯', label: 'Spieler mit meisten Assists', pts: 35 },
    { icon: '🥈', label: 'Finalist', pts: 30 },
    { icon: '🥉', label: 'Dritter Platz', pts: 25 },
    { icon: '👟', label: 'Torschützenkönig', pts: 25 },
    { icon: '⭐', label: 'Bester Spieler des Turniers', pts: 25 },
    { icon: '🇹🇳', label: 'Tunesien schafft nächste Runde', pts: 25 },
  ]

  const steps = [
    { icon: '📝', title: 'Registrieren', desc: 'Konto erstellen mit Vorname, Nachname, Username und Email.' },
    { icon: '💶', title: '2€ bezahlen', desc: 'Einmalige Teilnahmegebühr via PayPal.me/SkanderGhedira/2 überweisen. Deinen Username als Verwendungszweck angeben.' },
    { icon: '✅', title: 'Freischaltung', desc: 'Nach Zahlungseingang wird dein Konto vom Admin freigeschaltet. Du bekommst Zugang zum Tippen.' },
    { icon: '⚽', title: 'Spiele tippen', desc: 'Tippe vor Spielbeginn das Ergebnis jedes WM-Spiels. Tipps nach Anpfiff sind nicht mehr möglich.' },
    { icon: '🏆', title: 'Turnier-Tipps', desc: 'In den ersten Tagen des Turniers gibst du einmalig deine Turnier-Vorhersagen ab. Danach gesperrt.' },
    { icon: '📊', title: 'Rangliste', desc: 'Die Punkte werden automatisch nach jedem Spiel berechnet. Den aktuellen Stand siehst du in der Rangliste.' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-white">Wie funktioniert das Spiel?</h1>
      </div>

      {/* Kurz-Überblick */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl px-5 py-4 mb-6">
        <p className="text-white text-sm leading-relaxed">
          Tippe die Ergebnisse aller WM 2026 Spiele und sammle Punkte. Wer am Ende die meisten Punkte hat, gewinnt! 🏆
        </p>
      </div>

      {/* Ablauf */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="text-amber-400">01</span> Ablauf
        </h2>
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <span className="text-xl mt-0.5">{step.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{step.title}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Punkte Spiele */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="text-amber-400">02</span> Punkte pro Spiel
        </h2>
        <div className="flex flex-col gap-3">
          {matchPoints.map(({ label, desc, pts, color, bg }) => (
            <div key={label} className={`border rounded-xl px-4 py-3 flex items-center gap-4 ${bg}`}>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xl font-bold ${color}`}>{pts}</p>
                <p className="text-slate-500 text-xs">Pkt</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Turnier-Tipps */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-1 flex items-center gap-2">
          <span className="text-amber-400">03</span> Turnier-Tipps
        </h2>
        <p className="text-slate-500 text-xs mb-3">
          Einmalig in den ersten Tagen abgeben — danach gesperrt. Punkte gibt es am Ende des Turniers.
        </p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {tournamentPoints.map(({ icon, label, pts }, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < tournamentPoints.length - 1 ? 'border-b border-slate-700' : ''
              }`}
            >
              <span className="text-lg w-7 text-center">{icon}</span>
              <p className="text-slate-300 text-sm flex-1">{label}</p>
              <span className="text-amber-400 font-bold text-sm">{pts} Pkt</span>
            </div>
          ))}
          <div className="bg-amber-400/5 px-4 py-2 border-t border-amber-400/20">
            <p className="text-amber-400 text-xs text-center font-medium">
              Max. {tournamentPoints.reduce((s, t) => s + t.pts, 0)} Punkte aus Turnier-Tipps
            </p>
          </div>
        </div>
      </section>

      {/* Wichtige Regeln */}
      <section>
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="text-amber-400">04</span> Wichtige Regeln
        </h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex flex-col gap-2.5">
          {[
            'Tipps müssen vor Spielbeginn abgegeben werden — danach ist das Eingabefeld gesperrt.',
            'Turnier-Tipps können nur einmal abgegeben werden und sind danach nicht mehr änderbar.',
            'Bei Punktegleichstand entscheidet die Anzahl der exakten Ergebnisse.',
            'Die Teilnahmegebühr von 2€ ist einmalig und nicht erstattbar.',
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-amber-400 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-slate-400 text-xs leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
