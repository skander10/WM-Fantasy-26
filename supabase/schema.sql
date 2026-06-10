-- ============================================================
-- WM TIPP SPIEL - Datenbankschema
-- In Supabase: SQL Editor → New Query → alles reinkopieren → Run
-- ============================================================

-- 1. PROFILES: Erweiterung der Supabase-Auth-Tabelle
--    Wir speichern hier nur was wir wirklich anzeigen wollen
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,         -- öffentlich angezeigt im Ranking
  first_name text not null,
  last_name text not null,
  role text not null default 'user',     -- 'user' oder 'admin'
  paid boolean not null default false    -- erst nach Zahlung true → Zugang
);

-- 2. TEAMS: Die 48 WM-Mannschaften
create table public.teams (
  id serial primary key,
  name text unique not null,
  flag text not null default '🏳️',
  group_name text not null default 'A'  -- Gruppe A bis L
);

-- 3. MATCHES: Die Spiele des Turniers
create table public.matches (
  id serial primary key,
  home_team_id integer references public.teams(id),
  away_team_id integer references public.teams(id),
  match_date timestamptz not null,
  home_score integer,                    -- null bis Ergebnis eingetragen
  away_score integer,
  status text not null default 'upcoming', -- 'upcoming' | 'live' | 'finished'
  round text not null default 'Gruppenphase'
);

-- 4. TOURNAMENT_PICKS: Einmalige Turnier-Tipps pro User (Meister, Finalisten etc.)
--    total_points wird am Turnierendergebnis gesetzt
create table public.tournament_picks (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  champion_id integer references public.teams(id),
  finalist_a_id integer references public.teams(id),
  finalist_b_id integer references public.teams(id),
  semi_a_id integer references public.teams(id),
  semi_b_id integer references public.teams(id),
  total_points integer not null default 0
);

-- 5. MATCH_PICKS: Tägliche Tipps pro Spiel pro User
--    points_earned: null = noch nicht berechnet, 0 = falsch, 5 oder 10 = richtig
create table public.match_picks (
  id serial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  match_id integer references public.matches(id) on delete cascade,
  home_pick integer not null,
  away_pick integer not null,
  points_earned integer,
  unique(user_id, match_id)             -- ein Tipp pro Spiel pro User
);

-- ============================================================
-- RANKING VIEW: Gesamtpunkte pro User (öffentlich sichtbar)
-- Addiert: alle match_picks.points_earned + tournament_picks.total_points
-- ============================================================
create or replace view public.ranking as
select
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  coalesce(sum(mp.points_earned), 0) + coalesce(tp.total_points, 0) as total_points
from public.profiles p
left join public.match_picks mp on mp.user_id = p.id
left join public.tournament_picks tp on tp.user_id = p.id
where p.paid = true
group by p.id, p.username, p.first_name, p.last_name, tp.total_points
order by total_points desc;

-- ============================================================
-- ROW LEVEL SECURITY (RLS): Wer darf was sehen/ändern?
-- ============================================================
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.tournament_picks enable row level security;
alter table public.match_picks enable row level security;

-- Profiles: jeder kann alle sehen (für Ranking), nur eigene bearbeiten
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
-- Admin darf paid-Status ändern
create policy "profiles_admin_update" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Teams & Matches: jeder lesen, nur Admin schreiben
create policy "teams_select" on public.teams for select using (true);
create policy "teams_admin" on public.teams for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "matches_select" on public.matches for select using (true);
create policy "matches_admin" on public.matches for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Tournament & Match Picks: nur eigene sehen/schreiben
create policy "tp_own" on public.tournament_picks for all using (auth.uid() = user_id);
create policy "mp_own" on public.match_picks for all using (auth.uid() = user_id);
-- Admin darf alle Picks sehen (für Punkte berechnen)
create policy "mp_admin_select" on public.match_picks for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "mp_admin_update" on public.match_picks for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- FUNKTION: Punkte für alle User nach Spielende berechnen
-- Admin ruft diese auf → System vergleicht ALLE Tipps automatisch
-- ============================================================
create or replace function public.calculate_match_points(p_match_id integer)
returns void as $$
declare
  v_match record;
  v_pick record;
  v_points integer;
begin
  select * into v_match from public.matches where id = p_match_id;
  if v_match.home_score is null then
    raise exception 'Kein Ergebnis eingetragen';
  end if;

  -- Für jeden Tipp dieses Spiels Punkte berechnen
  for v_pick in select * from public.match_picks where match_id = p_match_id loop
    v_points := 0;

    -- Exaktes Ergebnis → 10 Punkte
    if v_pick.home_pick = v_match.home_score and v_pick.away_pick = v_match.away_score then
      v_points := 10;
    -- Richtiger Ausgang (Sieg oder Unentschieden) → 5 Punkte
    elsif
      (v_pick.home_pick > v_pick.away_pick and v_match.home_score > v_match.away_score) or
      (v_pick.away_pick > v_pick.home_pick and v_match.away_score > v_match.home_score) or
      (v_pick.home_pick = v_pick.away_pick and v_match.home_score = v_match.away_score)
    then
      v_points := 5;
    end if;

    update public.match_picks set points_earned = v_points where id = v_pick.id;
  end loop;

  -- Match als finished markieren
  update public.matches set status = 'finished' where id = p_match_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- WM 2026 TEAMS (alle 48 Mannschaften mit Gruppen)
-- ============================================================
insert into public.teams (name, flag, group_name) values
-- Gruppe A
('Tschechien','🇨🇿','A'),
('Mexiko','🇲🇽','A'),
('Südafrika','🇿🇦','A'),
('Südkorea','🇰🇷','A'),
-- Gruppe B
('Schweiz','🇨🇭','B'),
('Bosnien-Herzegowina','🇧🇦','B'),
('Kanada','🇨🇦','B'),
('Katar','🇶🇦','B'),
-- Gruppe C
('Schottland','🏴󠁧󠁢󠁳󠁣󠁴󠁿','C'),
('Brasilien','🇧🇷','C'),
('Haiti','🇭🇹','C'),
('Marokko','🇲🇦','C'),
-- Gruppe D
('Türkei','🇹🇷','D'),
('Paraguay','🇵🇾','D'),
('USA','🇺🇸','D'),
('Australien','🇦🇺','D'),
-- Gruppe E
('Deutschland','🇩🇪','E'),
('Ecuador','🇪🇨','E'),
('Elfenbeinküste','🇨🇮','E'),
('Curaçao','🇨🇼','E'),
-- Gruppe F
('Schweden','🇸🇪','F'),
('Niederlande','🇳🇱','F'),
('Tunesien','🇹🇳','F'),
('Japan','🇯🇵','F'),
-- Gruppe G
('Belgien','🇧🇪','G'),
('Ägypten','🇪🇬','G'),
('Iran','🇮🇷','G'),
('Neuseeland','🇳🇿','G'),
-- Gruppe H
('Spanien','🇪🇸','H'),
('Uruguay','🇺🇾','H'),
('Kap Verde','🇨🇻','H'),
('Saudi-Arabien','🇸🇦','H'),
-- Gruppe I
('Frankreich','🇫🇷','I'),
('Norwegen','🇳🇴','I'),
('Senegal','🇸🇳','I'),
('Irak','🇮🇶','I'),
-- Gruppe J
('Österreich','🇦🇹','J'),
('Argentinien','🇦🇷','J'),
('Algerien','🇩🇿','J'),
('Jordanien','🇯🇴','J'),
-- Gruppe K
('Portugal','🇵🇹','K'),
('Kolumbien','🇨🇴','K'),
('DR Kongo','🇨🇩','K'),
('Usbekistan','🇺🇿','K'),
-- Gruppe L
('Kroatien','🇭🇷','L'),
('England','🏴󠁧󠁢󠁥󠁮󠁧󠁿','L'),
('Ghana','🇬🇭','L'),
('Panama','🇵🇦','L')
on conflict (name) do nothing;
