"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createPlanInteractive } from "@/app/actions/plan";

const DAY_LABELS: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim",
};
const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type Step = 1 | 2 | 3 | 4 | 5;

export function PlanAssistant() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape 1 : objectif
  const [raceName, setRaceName] = useState("");
  const [distanceKm, setDistanceKm] = useState("10");
  const [raceDate, setRaceDate] = useState("");
  const [targetTime, setTargetTime] = useState("");

  // Étape 2 : niveau
  const [easyPace, setEasyPace] = useState("");

  // Étape 3 : disponibilités
  const [runDays, setRunDays] = useState<string[]>(["tue", "thu", "sat"]);
  const [longRunDay, setLongRunDay] = useState("sat");

  // Étape 4 : volume
  const [baselineKm, setBaselineKm] = useState("20");
  const [maxKm, setMaxKm] = useState("40");

  function toggleDay(day: string) {
    setRunDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const res = await createPlanInteractive({
      raceName: raceName.trim() || "Course",
      distanceKm: Number(distanceKm.replace(",", ".")),
      raceDate,
      targetTimeSec: targetTime.trim() ? parseTime(targetTime.trim()) : null,
      easyPaceSecPerKm: easyPace.trim() ? parsePace(easyPace.trim()) : null,
      runDays,
      longRunDay,
      baselineKm: Number(baselineKm.replace(",", ".")),
      maxKm: Number(maxKm.replace(",", ".")),
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              n === step
                ? "bg-[#6f9c7d] text-white"
                : n < step
                  ? "bg-[#eaf2df] text-[#245642]"
                  : "bg-[#f2f4ec] text-[#a0a69e]"
            }`}
          >
            {n}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#23372f]">1. Ton objectif de course</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Renseigne la course pour laquelle tu veux un plan. Si tu as déjà un objectif
            principal actif, il sera remplacé.
          </p>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Nom de la course</label>
            <input
              type="text"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              placeholder="Semi de Paris"
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Distance (km)</label>
            <input
              type="text"
              inputMode="decimal"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Date de la course</label>
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Temps visé (optionnel, ex. 1:45:00)</label>
            <input
              type="text"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder="1:45:00"
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!distanceKm || !raceDate}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#23372f]">2. Ton niveau</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Le moteur calcule ton VDOT depuis tes records récents. Si tu n&apos;en as pas,
            renseigne ton allure facile pour une estimation.
          </p>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">
              Allure facile (min/km, optionnel, ex. 6:00)
            </label>
            <input
              type="text"
              value={easyPace}
              onChange={(e) => setEasyPace(e.target.value)}
              placeholder="6:00"
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#23372f]">3. Tes disponibilités</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Choisis les jours où tu peux courir. Ces jours seront enregistrés dans ton profil.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`min-h-10 rounded-xl border px-3 text-sm font-semibold transition ${
                  runDays.includes(day)
                    ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]"
                    : "border-[#dce2d7] bg-white text-[#747a72]"
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Jour de la sortie longue</label>
            <select
              value={longRunDay}
              onChange={(e) => setLongRunDay(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            >
              {ALL_DAYS.map((day) => (
                <option key={day} value={day}>{DAY_LABELS[day]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={runDays.length === 0}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#23372f]">4. Ton volume</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Renseigne ton volume hebdomadaire habituel et ton plafond. Le moteur
            progressera de +2 à +7 km par semaine (max 10 %).
          </p>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Volume habituel (km/sem)</label>
            <input
              type="text"
              inputMode="decimal"
              value={baselineKm}
              onChange={(e) => setBaselineKm(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Volume plafond (km/sem)</label>
            <input
              type="text"
              inputMode="decimal"
              value={maxKm}
              onChange={(e) => setMaxKm(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#23372f]">5. Confirmer</h2>
          <div className="rounded-xl bg-[#f5f7f1] p-4 text-sm">
            <p><span className="font-semibold">Course :</span> {raceName || "Course"} — {distanceKm} km le {raceDate}</p>
            {targetTime && <p><span className="font-semibold">Temps visé :</span> {targetTime}</p>}
            <p><span className="font-semibold">Allure facile :</span> {easyPace || "calculée depuis les records"}</p>
            <p><span className="font-semibold">Jours :</span> {runDays.map((d) => DAY_LABELS[d]).join(", ")}</p>
            <p><span className="font-semibold">Volume :</span> {baselineKm} km/sem (plafond {maxKm} km)</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Création…" : "Créer le plan"}
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseTime(s: string): number | null {
  const parts = s.split(":").map((p) => Number(p));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function parsePace(s: string): number | null {
  const parts = s.split(":").map((p) => Number(p));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}
