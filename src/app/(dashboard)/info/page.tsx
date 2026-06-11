'use client'

import { useState } from 'react'

const content = {
  de: {
    title: 'Wie funktioniert das Spiel?',
    intro: 'Tippe die Ergebnisse aller WM 2026 Spiele und sammle Punkte. Wer am Ende die meisten Punkte hat, gewinnt! 🏆',
    section1: '01 Ablauf',
    section2: '02 Punkte pro Spiel',
    section3: '03 Turnier-Tipps',
    section4: '04 Wichtige Regeln',
    tournamentNote: 'Einmalig in den ersten Tagen abgeben — danach gesperrt. Punkte gibt es am Ende des Turniers.',
    maxPoints: 'Max. 215 Punkte aus Turnier-Tipps',
    steps: [
      { icon: '📝', title: 'Registrieren', desc: 'Konto erstellen mit Vorname, Nachname, Username und Email.' },
      { icon: '💶', title: '5€ bezahlen', desc: 'Einmalige Teilnahmegebühr via PayPal.me/SkanderGhedira/5 überweisen. Deinen Username als Verwendungszweck angeben.' },
      { icon: '✅', title: 'Freischaltung', desc: 'Nach Zahlungseingang wird dein Konto vom Admin freigeschaltet. Du bekommst Zugang zum Tippen.' },
      { icon: '⚽', title: 'Spiele tippen', desc: 'Tippe vor Spielbeginn das Ergebnis jedes WM-Spiels. Tipps nach Anpfiff sind nicht mehr möglich.' },
      { icon: '🏆', title: 'Turnier-Tipps', desc: 'In den ersten Tagen des Turniers gibst du einmalig deine Turnier-Vorhersagen ab. Danach gesperrt.' },
      { icon: '👀', title: 'Tipps-Vergleich', desc: 'Nach jedem Spieltag siehst du unter "Vergleich" die Tipps aller Spieler — Grün (10 Pkt), Gelb (5 Pkt), Rot (0 Pkt).' },
      { icon: '📊', title: 'Rangliste', desc: 'Die Punkte werden automatisch nach jedem Spiel berechnet. Den aktuellen Stand siehst du in der Rangliste.' },
    ],
    matchPoints: [
      { label: 'Exaktes Ergebnis', desc: 'z.B. du tippst 2:1 — Ergebnis ist 2:1', pts: 10, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
      { label: 'Richtige Tendenz', desc: 'Sieg, Niederlage oder Unentschieden stimmt, aber nicht das genaue Ergebnis', pts: 5, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
      { label: 'Falsch getippt', desc: 'Weder Ergebnis noch Tendenz stimmen', pts: 0, color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-700' },
    ],
    tournament: [
      { icon: '🏆', label: 'Weltmeister', pts: 50 },
      { icon: '🎯', label: 'Spieler mit meisten Assists', pts: 25 },
      { icon: '🥈', label: 'Finalist', pts: 30 },
      { icon: '🥉', label: 'Dritter Platz', pts: 25 },
      { icon: '👟', label: 'Torschützenkönig', pts: 25 },
      { icon: '⭐', label: 'Bester Spieler des Turniers', pts: 25 },
      { icon: '🇹🇳', label: 'Tunesien schafft nächste Runde', pts: 25 },
    ],
    rules: [
      'Tipps müssen vor Spielbeginn abgegeben werden — danach ist das Eingabefeld gesperrt.',
      'Turnier-Tipps können nur einmal abgegeben werden und sind danach nicht mehr änderbar.',
      'Bei Punktegleichstand entscheidet die Anzahl der exakten Ergebnisse.',
      'Die Teilnahmegebühr von 5€ ist einmalig und nicht erstattbar.',
    ],
  },
  en: {
    title: 'How does the game work?',
    intro: 'Predict the results of all World Cup 2026 matches and collect points. Whoever has the most points at the end wins! 🏆',
    section1: '01 How to play',
    section2: '02 Points per match',
    section3: '03 Tournament predictions',
    section4: '04 Important rules',
    tournamentNote: 'Submit once in the first days — locked after that. Points are awarded at the end of the tournament.',
    maxPoints: 'Max. 215 points from tournament predictions',
    steps: [
      { icon: '📝', title: 'Register', desc: 'Create an account with your first name, last name, username and email.' },
      { icon: '💶', title: 'Pay 5€', desc: 'One-time entry fee via PayPal.me/SkanderGhedira/5. Enter your username as the payment reference.' },
      { icon: '✅', title: 'Activation', desc: 'Once payment is received, your account will be activated by the admin. You get full access to place predictions.' },
      { icon: '⚽', title: 'Predict matches', desc: 'Predict the result of each World Cup match before kick-off. Predictions are locked once the match starts.' },
      { icon: '🏆', title: 'Tournament predictions', desc: 'In the first days of the tournament, submit your one-time tournament predictions. Locked after submission.' },
      { icon: '👀', title: 'Tips comparison', desc: 'After each matchday, check "Compare" to see all players\' predictions — Green (10 pts), Yellow (5 pts), Red (0 pts).' },
      { icon: '📊', title: 'Leaderboard', desc: 'Points are calculated automatically after each match. Check the current standings in the leaderboard.' },
    ],
    matchPoints: [
      { label: 'Exact result', desc: 'e.g. you predict 2:1 — result is 2:1', pts: 10, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
      { label: 'Correct tendency', desc: 'Win, loss or draw is correct, but not the exact score', pts: 5, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
      { label: 'Wrong prediction', desc: 'Neither the score nor the tendency is correct', pts: 0, color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-700' },
    ],
    tournament: [
      { icon: '🏆', label: 'World Champion', pts: 50 },
      { icon: '🎯', label: 'Most assists player', pts: 25 },
      { icon: '🥈', label: 'Runner-up', pts: 30 },
      { icon: '🥉', label: 'Third place', pts: 25 },
      { icon: '👟', label: 'Top scorer', pts: 25 },
      { icon: '⭐', label: 'Best player of the tournament', pts: 25 },
      { icon: '🇹🇳', label: 'Tunisia advances to next round', pts: 25 },
    ],
    rules: [
      'Predictions must be submitted before kick-off — the input is locked once the match starts.',
      'Tournament predictions can only be submitted once and cannot be changed afterwards.',
      'In case of a tie, the number of exact results decides the winner.',
      'The entry fee of 5€ is one-time and non-refundable.',
    ],
  },
}

export default function InfoPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const t = content[lang]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">

      {/* Header + Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">{t.title}</h1>
        <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
          <button
            onClick={() => setLang('de')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              lang === 'de' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇩🇪 DE
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              lang === 'en' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>

      {/* Kurz-Überblick */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl px-5 py-4 mb-6">
        <p className="text-white text-sm leading-relaxed">{t.intro}</p>
      </div>

      {/* Ablauf */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="text-amber-400">{t.section1}</span>
        </h2>
        <div className="flex flex-col gap-3">
          {t.steps.map((step, i) => (
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
        <h2 className="text-white font-semibold mb-3">
          <span className="text-amber-400">{t.section2}</span>
        </h2>
        <div className="flex flex-col gap-3">
          {t.matchPoints.map(({ label, desc, pts, color, bg }) => (
            <div key={label} className={`border rounded-xl px-4 py-3 flex items-center gap-4 ${bg}`}>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${color}`}>{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xl font-bold ${color}`}>{pts}</p>
                <p className="text-slate-500 text-xs">Pts</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Turnier-Tipps */}
      <section className="mb-8">
        <h2 className="text-white font-semibold mb-1">
          <span className="text-amber-400">{t.section3}</span>
        </h2>
        <p className="text-slate-500 text-xs mb-3">{t.tournamentNote}</p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {t.tournament.map(({ icon, label, pts }, i) => (
            <div key={label} className={`flex items-center gap-3 px-4 py-3 ${i < t.tournament.length - 1 ? 'border-b border-slate-700' : ''}`}>
              <span className="text-lg w-7 text-center">{icon}</span>
              <p className="text-slate-300 text-sm flex-1">{label}</p>
              <span className="text-amber-400 font-bold text-sm">{pts} Pts</span>
            </div>
          ))}
          <div className="bg-amber-400/5 px-4 py-2 border-t border-amber-400/20">
            <p className="text-amber-400 text-xs text-center font-medium">{t.maxPoints}</p>
          </div>
        </div>
      </section>

      {/* Regeln */}
      <section>
        <h2 className="text-white font-semibold mb-3">
          <span className="text-amber-400">{t.section4}</span>
        </h2>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex flex-col gap-2.5">
          {t.rules.map((rule, i) => (
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
