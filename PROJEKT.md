# WM TIPP SPIEL 2026 — Projekt-Bibel

## Das Ziel
Eine Web-App bei der eine private Gruppe (Freunde/Familie) auf WM 2026 Spiele tippt.
Wer die meisten Punkte sammelt, gewinnt. Zugang nur nach einmaliger Zahlung via PayPal.
Tech-Stack: **Next.js 16 + Supabase (Auth + DB) + Tailwind CSS**

---

## Die Spielregeln

### Wer kann mitspielen?
- Registrierung mit Vorname, Nachname, Username, Email, Passwort
- Nach Registrierung → PayPal-Zahlung → Admin/Webhook setzt `paid = true` → Zugang
- Nicht-bezahlte User sehen nur die `/pending-payment` Seite

### Was wird getippt?

#### 1. Spiel-Tipps (`/predict/matches`)
- Heimmannschaft : Gastmannschaft Tore eingeben
- Tipp-Deadline: Anpfiff des Spiels (danach gesperrt)

**Punkte:**
| Ergebnis | Punkte |
|----------|--------|
| Exaktes Ergebnis (z.B. 2:1 getippt, 2:1 gespielt) | **10 Punkte** |
| Richtiger Ausgang (Sieg/Unentschieden richtig, Tore falsch) | **5 Punkte** |
| Falsch (falscher Ausgang) | **0 Punkte** |

→ **Vollautomatisch**: Ergebnisse kommen von der Fußball-API, Punkte berechnet die DB-Funktion.

#### 2. Turnier-Tipps (`/predict/tournament`) — einmalig vor Turnierstart
Jeder User tippt einmalig:
- **Weltmeister** (1 Team)
- **Finalisten** (2 Teams im Finale)
- **Halbfinalisten** (2 Teams im Halbfinale)

→ **Vollautomatisch**: Nach Finale vergleicht ein API-Job die Tipps mit echten Ergebnissen.

### Ranking (`/ranking`)
- Gesamtpunkte = alle Spiel-Tipps + Turnier-Tipp Punkte
- Öffentlich sichtbar (kein Login nötig)
- Nur bezahlte User erscheinen

---

## Das Turnier — WM 2026

**48 Mannschaften, 12 Gruppen (A–L), je 4 Teams**

| Gruppe | Teams |
|--------|-------|
| A | Tschechien, Mexiko, Südafrika, Südkorea |
| B | Schweiz, Bosnien-Herzegowina, Kanada, Katar |
| C | Schottland, Brasilien, Haiti, Marokko |
| D | Türkei, Paraguay, USA, Australien |
| E | Deutschland, Ecuador, Elfenbeinküste, Curaçao |
| F | Schweden, Niederlande, Tunesien, Japan |
| G | Belgien, Ägypten, Iran, Neuseeland |
| H | Spanien, Uruguay, Kap Verde, Saudi-Arabien |
| I | Frankreich, Norwegen, Senegal, Irak |
| J | Österreich, Argentinien, Algerien, Jordanien |
| K | Portugal, Kolumbien, DR Kongo, Usbekistan |
| L | Kroatien, England, Ghana, Panama |

---

## Automatisierung — Was passiert ohne dein Zutun

### Fußball-API (football-data.org)
- Kostenloser Plan, WM 2026 Daten inklusive
- API-Key in `.env.local` als `FOOTBALL_API_KEY`
- Route: `GET /api/cron/sync-results` — holt aktuelle Ergebnisse und updated die DB
- Kann per Vercel Cron alle 5 Minuten aufgerufen werden (nach Deployment)
- Punkte werden automatisch über `calculate_match_points()` berechnet

### PayPal-Integration
- User zahlt einmalig auf der `/pending-payment` Seite via PayPal-Button
- PayPal schickt Bestätigung an `POST /api/paypal/webhook`
- Webhook verifiziert Echtheit (PayPal-Signatur) → setzt `paid = true` in DB
- Dein PayPal-Konto bekommt das Geld direkt
- Benötigt: PayPal Client ID + Secret in `.env.local`
- User müssen **niemals** Kartendaten an unsere App geben — alles über PayPal

### Was du als Admin noch manuell machst
- Praktisch nichts — außer Turnier-Tipp Punkte nach dem Finale (einmalig, am Ende)
- Optional: Fehlerhafte Ergebnisse der API korrigieren

---

## Die 7 Schritte — Fortschritt

### ✅ Schritt 1 — Projekt-Setup
- Next.js 16 App erstellt (`wm-tipp/`)
- Tailwind CSS 4 konfiguriert
- Ordnerstruktur: `src/app/`, `src/components/`, `src/lib/`

### ✅ Schritt 2 — Supabase-Verbindung
- Supabase-Client für Browser: `src/lib/supabase/client.ts`
- Supabase-Client für Server: `src/lib/supabase/server.ts`
- Keys in `.env.local` eingetragen
- Supabase-Projekt: `whpdhikwhsjariumgaww.supabase.co`

### ✅ Schritt 3 — Datenbank-Schema
- `supabase/schema.sql` in Supabase ausgeführt ✅
- 5 Tabellen: `profiles`, `teams`, `matches`, `tournament_picks`, `match_picks`
- 48 WM-Teams mit Gruppen in DB
- Row Level Security, Ranking-View, Punkte-Funktion

### ✅ Schritt 4 — Middleware (Pay-Gate)
- `src/middleware.ts` schützt alle Routen
- Nicht eingeloggt → `/login`
- Bezahlt aber kein Profil-Eintrag → `/pending-payment`

### ✅ Schritt 5 — Navbar
- `src/components/Navbar.tsx` — Desktop + Mobile (Bottom-Nav)
- Links: Tippen, Turnier, Ranking, Meine Punkte, Admin

---

### 🔲 Schritt 6 — Auth-Flow & Seiten (AKTUELL)
- `src/app/page.tsx` → Landing Page
- `src/app/login/page.tsx` → Login
- `src/app/register/page.tsx` → Registrierung
- `src/app/pending-payment/page.tsx` → Bezahl-Seite mit PayPal-Button
- `src/app/(dashboard)/layout.tsx` → Layout mit Navbar für eingeloggte Seiten
- `src/app/actions/auth.ts` → Server Actions für Login/Register

### 🔲 Schritt 7 — Kern-Features
- `src/app/(dashboard)/predict/matches/page.tsx` → Spiele tippen
- `src/app/(dashboard)/predict/tournament/page.tsx` → Turnier-Tipps
- `src/app/(dashboard)/ranking/page.tsx` → Rangliste
- `src/app/(dashboard)/my-scores/page.tsx` → Meine Punkte
- `src/app/api/paypal/webhook/route.ts` → PayPal Webhook
- `src/app/api/cron/sync-results/route.ts` → Fußball-API Sync
- `src/app/admin/page.tsx` → Admin-Bereich

---

## Datei-Übersicht (aktueller Stand)

```
wm-tipp/
├── src/
│   ├── app/
│   │   ├── globals.css         ✅
│   │   ├── layout.tsx          ✅ Root-Layout
│   │   ├── page.tsx            🔲 Landing Page
│   │   ├── login/page.tsx      🔲
│   │   ├── register/page.tsx   🔲
│   │   ├── pending-payment/    🔲
│   │   ├── actions/auth.ts     🔲 Server Actions
│   │   ├── (dashboard)/        🔲 Geschützte Routen
│   │   └── api/                🔲 Webhooks + Cron
│   ├── components/
│   │   └── Navbar.tsx          ✅
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts       ✅
│   │       └── server.ts       ✅
│   └── middleware.ts           ✅
├── supabase/schema.sql         ✅ in Supabase ausgeführt
├── .env.local                  ✅ Supabase Keys drin
│                               🔲 FOOTBALL_API_KEY fehlt noch
│                               🔲 PAYPAL_CLIENT_ID fehlt noch
│                               🔲 PAYPAL_SECRET fehlt noch
└── PROJEKT.md                  ✅ diese Datei
```
