"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createPlanInteractive } from "@/app/actions/plan";

const DAY_LABELS: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mer", thu: "Jeu", fri: "Ven", sat: "Sam", sun: "Dim",
};
const ALL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type DistanceOption = "5" | "10" | "21.1" | "42.2" | "custom";
type LevelMode = "auto" | "records" | "paces";
type VolumeMode = "auto" | "manual";

export function PlanAssistant() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape 1 : distance cible
  const [distanceMode, setDistanceMode] = useState<DistanceOption>("10");
  const [customDistance, setCustomDistance] = useState("");

  // Étape 2 : course prévue
  const [hasRace, setHasRace] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [targetTime, setTargetTime] = useState("");

  // Étape 3 : niveau
  const [levelMode, setLevelMode] = useState<LevelMode>("auto");
  const [record5k, setRecord5k] = useState("");
  const [record10k, setRecord10k] = useState("");
  const [recordHalf, setRecordHalf] = useState("");
  const [recordMarathon, setRecordMarathon] = useState("");
  const [easyPace, setEasyPace] = useState("");
  const [thresholdPace, setThresholdPace] = useState("");

  // Étape 4 : disponibilités
  const [runDays, setRunDays] = useState<string[]>(["tue", "thu", "sat"]);
  const [longRunDay, setLongRunDay] = useState("sat");

  // Étape 5 : volume
  const [volumeMode, setVolumeMode] = useState<VolumeMode>("auto");
  const [baselineKm, setBaselineKm] = useState("20");
  const [maxKm, setMaxKm] = useState("40");

  function toggleDay(day: string) {
    setRunDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  const targetDistanceKm =
    distanceMode === "custom" ? Number(customDistance.replace(",", ".")) : Number(distanceMode);

  async function handleCreate() {
    setBusy(true);
    setError(null);

    const records: { distance: number; timeSec: number }[] = [];
    if (levelMode === "records") {
      if (record5k) records.push({ distance: 5000, timeSec: parseTime(record5k) ?? 0 });
      if (record10k) records.push({ distance: 10000, timeSec: parseTime(record10k) ?? 0 });
      if (recordHalf) records.push({ distance: 21097, timeSec: parseTime(recordHalf) ?? 0 });
      if (recordMarathon) records.push({ distance: 42195, timeSec: parseTime(recordMarathon) ?? 0 });
    }

    const res = await createPlanInteractive({
      targetDistanceKm,
      hasRace,
      raceName: hasRace ? (raceName.trim() || "Course") : null,
      raceDate: hasRace ? raceDate : null,
      targetTimeSec: hasRace && targetTime.trim() ? parseTime(targetTime.trim()) : null,
      levelMode,
      records: records.filter((r) => r.timeSec > 0),
      easyPaceSecPerKm: easyPace.trim() ? parsePace(easyPace.trim()) : null,
      thresholdPaceSecPerKm: thresholdPace.trim() ? parsePace(thresholdPace.trim()) : null,
      runDays,
      longRunDay,
      volumeMode,
      baselineKm: volumeMode === "manual" ? Number(baselineKm.replace(",", ".")) : 0,
      maxKm: volumeMode === "manual" ? Number(maxKm.replace(",", ".")) : 0,
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
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              n <= step ? "bg-[#6f9c7d]" : "bg-[#e8e9e1]"
            }`}
          />
        ))}
      </div>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">
        Étape {step} sur 6
      </p>

      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Distance cible</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Quelle distance veux-tu être capable de courir à la fin du plan ?
          </p>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#34493e]">Distance</label>
            <select
              value={distanceMode}
              onChange={(e) => setDistanceMode(e.target.value as DistanceOption)}
              className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="21.1">Semi-marathon (21.1 km)</option>
              <option value="42.2">Marathon (42.2 km)</option>
              <option value="custom">Autre (saisie libre)</option>
            </select>
          </div>
          {distanceMode === "custom" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#34493e]">Distance (km)</label>
              <input
                type="text"
                inputMode="decimal"
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                placeholder="15"
                className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
              />
            </div>
          )}
          <NavButtons onBack={null} onNext={() => setStep(2)} disabledNext={distanceMode === "custom" && !customDistance} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Course prévue ?</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            As-tu une course de prévue ? Si oui, le moteur ajustera la durée et l&apos;intensité.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHasRace(true)}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold transition ${
                hasRace ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]" : "border-[#dce2d7] bg-white text-[#747a72]"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setHasRace(false)}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold transition ${
                !hasRace ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]" : "border-[#dce2d7] bg-white text-[#747a72]"
              }`}
            >
              Non
            </button>
          </div>

          {hasRace && (
            <div className="space-y-3 rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Nom de la course</label>
                <input
                  type="text"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  placeholder="Semi de Paris"
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Date de la course</label>
                <input
                  type="date"
                  value={raceDate}
                  onChange={(e) => setRaceDate(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Temps visé (optionnel)</label>
                <input
                  type="text"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  placeholder="1:45:00"
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              </div>
            </div>
          )}

          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabledNext={hasRace && (!raceName || !raceDate)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Ton niveau</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Comment veux-tu renseigner ton niveau ? Le moteur en déduira ton VDOT.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["auto", "records", "paces"] as LevelMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLevelMode(m)}
                className={`min-h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                  levelMode === m ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]" : "border-[#dce2d7] bg-white text-[#747a72]"
                }`}
              >
                {m === "auto" ? "Automatique" : m === "records" ? "Mes records" : "Mes allures"}
              </button>
            ))}
          </div>

          {levelMode === "records" && (
            <div className="space-y-3 rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4">
              <p className="text-xs text-[#747a72]">Renseigne un ou plusieurs records (format mm:ss ou h:mm:ss).</p>
              {[
                { label: "5 km", value: record5k, set: setRecord5k, placeholder: "22:30" },
                { label: "10 km", value: record10k, set: setRecord10k, placeholder: "47:00" },
                { label: "Semi-marathon", value: recordHalf, set: setRecordHalf, placeholder: "1:45:00" },
                { label: "Marathon", value: recordMarathon, set: setRecordMarathon, placeholder: "3:45:00" },
              ].map((r) => (
                <div key={r.label}>
                  <label className="mb-1 block text-sm font-semibold text-[#34493e]">{r.label}</label>
                  <input
                    type="text"
                    value={r.value}
                    onChange={(e) => r.set(e.target.value)}
                    placeholder={r.placeholder}
                    className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                  />
                </div>
              ))}
            </div>
          )}

          {levelMode === "paces" && (
            <div className="space-y-3 rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Allure facile (min/km)</label>
                <input
                  type="text"
                  value={easyPace}
                  onChange={(e) => setEasyPace(e.target.value)}
                  placeholder="6:00"
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Allure seuil (min/km, optionnel)</label>
                <input
                  type="text"
                  value={thresholdPace}
                  onChange={(e) => setThresholdPace(e.target.value)}
                  placeholder="5:00"
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              </div>
            </div>
          )}

          {levelMode === "auto" && (
            <div className="rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4 text-sm text-[#747a72]">
              Le moteur calculera ton VDOT depuis ton historique et ton allure facile déclarée.
            </div>
          )}

          <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Disponibilités</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Choisis les jours où tu peux courir.
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
          <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} disabledNext={runDays.length === 0} />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Volume</h2>
          <p className="text-sm leading-6 text-[#747a72]">
            Renseigne ton volume hebdomadaire. Le moteur progressera de +2 à +7 km par semaine (max 10 %).
          </p>
          <div className="flex gap-2">
            {(["auto", "manual"] as VolumeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setVolumeMode(m)}
                className={`min-h-10 rounded-xl border px-4 text-sm font-semibold transition ${
                  volumeMode === m ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]" : "border-[#dce2d7] bg-white text-[#747a72]"
                }`}
              >
                {m === "auto" ? "Automatique" : "Manuel"}
              </button>
            ))}
          </div>

          {volumeMode === "manual" && (
            <div className="space-y-3 rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Volume habituel (km/sem)</label>
                <select
                  value={baselineKm}
                  onChange={(e) => setBaselineKm(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                >
                  <option value="15">15 km</option>
                  <option value="20">20 km</option>
                  <option value="30">30 km</option>
                  <option value="40">40 km</option>
                  <option value="50">50 km</option>
                  <option value="custom">Autre</option>
                </select>
              </div>
              {baselineKm === "custom" && (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="25"
                  onChange={(e) => setBaselineKm(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              )}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#34493e]">Volume plafond (km/sem)</label>
                <select
                  value={maxKm}
                  onChange={(e) => setMaxKm(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                >
                  <option value="20">20 km</option>
                  <option value="30">30 km</option>
                  <option value="40">40 km</option>
                  <option value="50">50 km</option>
                  <option value="60">60 km</option>
                  <option value="custom">Autre</option>
                </select>
              </div>
              {maxKm === "custom" && (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="55"
                  onChange={(e) => setMaxKm(e.target.value)}
                  className="min-h-12 w-full rounded-xl border border-[#dce2d7] bg-white px-4 text-sm text-[#23372f] outline-none focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df]"
                />
              )}
            </div>
          )}

          {volumeMode === "auto" && (
            <div className="rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-4 text-sm text-[#747a72]">
              Le moteur calculera le volume depuis tes 3 dernières semaines actives.
            </div>
          )}

          <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#23372f]">Récapitulatif</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <RecapCard icon="🎯" label="Distance cible" value={`${targetDistanceKm} km`} color="from-[#eaf2df] to-[#d2ef9c]" />
            <RecapCard
              icon="🏁"
              label="Course"
              value={hasRace ? `${raceName || "Course"} — ${raceDate}` : "Pas de course"}
              color="from-[#fce8d8] to-[#f5c9a8]"
            />
            <RecapCard
              icon="📊"
              label="Niveau"
              value={
                levelMode === "auto"
                  ? "Automatique (historique)"
                  : levelMode === "records"
                    ? "Records saisis"
                    : "Allures déclarées"
              }
              color="from-[#e8f0fe] to-[#c8dafc]"
            />
            <RecapCard
              icon="📅"
              label="Disponibilités"
              value={runDays.map((d) => DAY_LABELS[d]).join(", ")}
              color="from-[#f3e8fd] to-[#e0cff8]"
            />
            <RecapCard
              icon="📈"
              label="Volume"
              value={
                volumeMode === "auto"
                  ? "Automatique"
                  : `${baselineKm} km/sem (max ${maxKm})`
              }
              color="from-[#e0f5f0] to-[#b8e8dc]"
            />
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
              onClick={() => setStep(5)}
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

function NavButtons({
  onBack,
  onNext,
  disabledNext,
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  disabledNext?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onNext}
        disabled={disabledNext}
        className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        Continuer
      </button>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
        >
          Retour
        </button>
      )}
    </div>
  );
}

function RecapCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${color} p-4 shadow-sm transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#34493e]/70">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-[#23372f]">{value}</p>
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
