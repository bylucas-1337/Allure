"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { stopPlan } from "@/app/actions/plan";

type PlanData = {
  plan: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
    vdot: number | null;
    vdot_source: string | null;
    vdot_is_estimated: boolean | null;
    reference_volume_km: number | null;
  };
  sessions: Array<{
    id: string;
    session_date: string;
    session_type: string;
    duration_min: number;
    distance_m: number | null;
    target_zone: string | null;
    target_pace_sec_per_km: number | null;
    rationale_text: string | null;
    status: string;
    is_locked: boolean | null;
  }>;
  rules: Array<{ id: string; rule_key: string; explanation: string | null }>;
};

export function PlanDetail({ data }: { data: PlanData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStop() {
    const confirmed = window.confirm(
      "Arrêter le plan ? Les séances futures seront supprimées, l'historique est conservé.",
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    const res = await stopPlan(data.plan.id);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  // Grouper les séances par semaine.
  const weeks: Record<string, typeof data.sessions> = {};
  for (const s of data.sessions) {
    const d = new Date(s.session_date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(s);
  }

  const zoneLabels: Record<string, string> = {
    E: "Facile",
    M: "Marathon",
    T: "Seuil",
    I: "Intervalles",
    R: "Répétitions",
  };

  function formatPace(sec: number | null): string {
    if (!sec) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#23372f]">
              {data.plan.name}
            </h1>
            <p className="mt-1 text-sm text-[#747a72]">
              {data.plan.start_date} → {data.plan.end_date}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStop}
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? "Arrêt…" : "Arrêter le plan"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#f5f7f1] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#81877f]">VDOT</p>
            <p className="mt-1 text-lg font-bold text-[#23372f]">
              {data.plan.vdot ?? "—"}
              {data.plan.vdot_is_estimated ? " (estimé)" : ""}
            </p>
            <p className="text-xs text-[#747a72]">{data.plan.vdot_source}</p>
          </div>
          <div className="rounded-xl bg-[#f5f7f1] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#81877f]">Volume réf.</p>
            <p className="mt-1 text-lg font-bold text-[#23372f]">
              {data.plan.reference_volume_km ?? "—"} km
            </p>
          </div>
          <div className="rounded-xl bg-[#f5f7f1] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#81877f]">Séances</p>
            <p className="mt-1 text-lg font-bold text-[#23372f]">{data.sessions.length}</p>
          </div>
        </div>
      </div>

      {Object.entries(weeks)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekStart, weekSessions]) => (
          <div key={weekStart} className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#81877f]">
              Semaine du {weekStart}
            </h2>
            <ul className="mt-3 space-y-2">
              {weekSessions
                .sort((a, b) => a.session_date.localeCompare(b.session_date))
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#23372f]">
                        {s.session_date} — {s.session_type}
                      </p>
                      <p className="text-xs text-[#747a72]">
                        {s.duration_min} min
                        {s.distance_m ? ` · ${(s.distance_m / 1000).toFixed(1)} km` : ""}
                        {s.target_zone ? ` · Zone ${s.target_zone} (${zoneLabels[s.target_zone] ?? s.target_zone})` : ""}
                        {s.target_pace_sec_per_km ? ` · ${formatPace(s.target_pace_sec_per_km)}/km` : ""}
                      </p>
                      {s.rationale_text && (
                        <p className="mt-1 text-xs text-[#5c6f66]">{s.rationale_text}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        s.status === "done"
                          ? "text-green-600"
                          : s.status === "skipped"
                            ? "text-gray-400"
                            : "text-[#6f9c7d]"
                      }`}
                    >
                      {s.status}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}

      {data.rules.length > 0 && (
        <div className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#81877f]">
            Règles appliquées
          </h2>
          <ul className="mt-3 space-y-2">
            {data.rules.map((r) => (
              <li key={r.id} className="text-sm text-[#5c6f66]">
                <span className="font-semibold text-[#23372f]">{r.rule_key}</span>
                {r.explanation ? ` — ${r.explanation}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
