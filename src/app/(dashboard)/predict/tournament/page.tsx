import { createClient } from "@/lib/supabase/server";
import { TournamentClient } from "./TournamentClient";

export default async function TournamentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Globale Sperre prüfen
  const { data: lockSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "tournament_picks_locked")
    .single();
  const globalLocked = lockSetting?.value === "true";

  // One-Change-Modus prüfen
  const { data: oneChangeSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "tournament_one_change_mode")
    .maybeSingle();
  const oneChangeMode = oneChangeSetting?.value === "true";

  const { data: usedSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", `change_used_${user!.id}`)
    .maybeSingle();
  const changeUsed = usedSetting?.value === "true";

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, flag, group_name")
    .order("group_name")
    .order("name");

  const { data: existing } = await supabase
    .from("tournament_picks")
    .select(
      "champion_team_id, second_team_id, third_team_id, top_scorer, top_assist_player, best_player, tunisia_advances, is_locked",
    )
    .eq("user_id", user!.id)
    .maybeSingle();

  // Wer hat Turnier-Tipps abgegeben?
  const { data: paidPlayers } = await supabase
    .from("profiles")
    .select("username")
    .eq("paid", true)
    .order("username");

  const { data: submitted } = await supabase.rpc("get_tournament_participation");
  const submittedSet = new Set((submitted ?? []).map((r: { username: string }) => r.username));
  const notSubmitted = (paidPlayers ?? []).filter(p => !submittedSet.has(p.username));
  const submittedList = (paidPlayers ?? []).filter(p => submittedSet.has(p.username));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-white">Turnier-Tipp</h1>
        {globalLocked && (
          <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
            🔒 Gesperrt
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-6">
        Einmal abgeben — danach nicht mehr änderbar. Punkte werden am Ende
        vergeben.
      </p>

      {/* Teilnahme-Übersicht */}
      {!globalLocked && (paidPlayers ?? []).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-semibold">Turnier-Tipps Übersicht</p>
            <span className="text-xs text-slate-400">
              {submittedList.length}/{(paidPlayers ?? []).length} abgegeben
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
            <div
              className="bg-amber-400 h-1.5 rounded-full"
              style={{ width: (paidPlayers ?? []).length > 0 ? `${Math.round((submittedList.length / (paidPlayers ?? []).length) * 100)}%` : '0%' }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {submittedList.map(p => (
              <span key={p.username} className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-2 py-0.5 rounded-lg font-medium">
                ✓ {p.username}
              </span>
            ))}
            {notSubmitted.map(p => (
              <span key={p.username} className="bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-lg font-medium">
                ✗ {p.username}
              </span>
            ))}
          </div>
        </div>
      )}


      {/* Punkte-Übersicht */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-6 grid grid-cols-3 gap-2 text-xs text-center">
        <div>
          <p className="text-amber-400 font-bold">50 Pkt</p>
          <p className="text-slate-500">🏆 Weltmeister</p>
        </div>
        <div>
          <p className="text-white font-bold">25 Pkt</p>
          <p className="text-slate-500">🎯 Assists</p>
        </div>
        <div>
          <p className="text-white font-bold">30 Pkt</p>
          <p className="text-slate-500">🥈 Finalist</p>
        </div>
        <div>
          <p className="text-white font-bold">25 Pkt</p>
          <p className="text-slate-500">🥉 3. Platz</p>
        </div>
        <div>
          <p className="text-white font-bold">25 Pkt</p>
          <p className="text-slate-500">👟 Torschütze</p>
        </div>
        <div>
          <p className="text-white font-bold">25 Pkt</p>
          <p className="text-slate-500">⭐ Best Player</p>
        </div>
        <div className="col-span-3">
          <p className="text-white font-bold">25 Pkt</p>
          <p className="text-slate-500">🇹🇳 Tunesien</p>
        </div>
      </div>

      <TournamentClient
        teams={(teams ?? []) as any}
        existing={existing ?? null}
        globalLocked={globalLocked}
        oneChangeMode={oneChangeMode}
        changeUsed={changeUsed}
      />
    </div>
  );
}
