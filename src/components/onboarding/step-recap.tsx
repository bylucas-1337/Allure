import type { ReactNode } from "react";
import { AVAILABILITY_DAYS, labelFor, type StepNumber } from "@/lib/onboarding";
import { MUSCLE_GROUPS, STRENGTH_GOALS } from "@/lib/settings";
import type { StepProps } from "@/components/onboarding/types";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#eef0e8] py-2 last:border-b-0">
      <span className="text-sm text-[#8a9088]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#23372f]">{value}</span>
    </div>
  );
}

function RecapCard({
  title,
  step,
  goToStep,
  children,
}: {
  title: string;
  step: StepNumber;
  goToStep: (step: StepNumber) => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#34493e]">{title}</p>
        <button
          type="button"
          onClick={() => goToStep(step)}
          className="text-xs font-semibold text-[#32634f] underline decoration-[#b8d5b9] underline-offset-4"
        >
          Modifier
        </button>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function StepRecap({
  draft,
  goToStep,
}: StepProps & { goToStep: (step: StepNumber) => void }) {
  const goalLabel = draft.goal.enabled
    ? `${draft.goal.raceName === "" ? "Course" : draft.goal.raceName}${
        draft.goal.distanceKm === "" ? "" : ` · ${draft.goal.distanceKm} km`
      }${draft.goal.raceDate === "" ? "" : ` · ${draft.goal.raceDate}`}`
    : "Aucune course en vue";

  const injuries =
    draft.injuries.length === 0
      ? "Aucune gêne déclarée"
      : draft.injuries.map((injury) => injury.label).join(", ");

  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-sm leading-6 text-[#5d675c]">
        Voilà ce que tu as indiqué. Rien n’est gravé : tout se modifie ensuite dans les
        réglages, et les champs vides restent facultatifs.
      </p>

      <RecapCard title="Toi" step={1} goToStep={goToStep}>
        <Line label="Taille" value={draft.heightCm === "" ? "—" : `${draft.heightCm} cm`} />
        <Line label="Poids" value={draft.weightKg === "" ? "—" : `${draft.weightKg} kg`} />
        <Line
          label="FC de repos"
          value={draft.restingHr === "" ? "—" : `${draft.restingHr} bpm`}
        />
      </RecapCard>

      <RecapCard title="Course — habitude" step={2} goToStep={goToStep}>
        <Line
          label="Séances / semaine"
          value={draft.runSessionsPerWeek === "" ? "—" : draft.runSessionsPerWeek}
        />
        <Line
          label="Volume"
          value={draft.runWeeklyKm === "" ? "—" : `${draft.runWeeklyKm} km / semaine`}
        />
        <Line
          label="Jours"
          value={
            draft.runDays.length === 0
              ? "—"
              : draft.runDays.map((value) => labelFor(AVAILABILITY_DAYS, value)).join(", ")
          }
        />
        <Line
          label="Sortie longue"
          value={draft.longRunDay === "" ? "—" : labelFor(AVAILABILITY_DAYS, draft.longRunDay)}
        />
      </RecapCard>

      <RecapCard title="Course — allures" step={3} goToStep={goToStep}>
        <Line label="Facile" value={draft.easyPace === "" ? "—" : `${draft.easyPace} /km`} />
        <Line
          label="Seuil"
          value={draft.thresholdPace === "" ? "—" : `${draft.thresholdPace} /km`}
        />
        <Line
          label="Course"
          value={draft.racePace === "" ? "—" : `${draft.racePace} /km`}
        />
        <Line
          label="Records"
          value={
            [draft.pb5k, draft.pb10k, draft.pbHalf, draft.pbMarathon].some((value) => value !== "")
              ? [
                  draft.pb5k === "" ? null : `5 km ${draft.pb5k}`,
                  draft.pb10k === "" ? null : `10 km ${draft.pb10k}`,
                  draft.pbHalf === "" ? null : `semi ${draft.pbHalf}`,
                  draft.pbMarathon === "" ? null : `marathon ${draft.pbMarathon}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "—"
          }
        />
      </RecapCard>

      <RecapCard title="Objectif de course" step={4} goToStep={goToStep}>
        <Line label="Course" value={goalLabel} />
        <Line
          label="Temps visé"
          value={draft.goal.targetTime === "" ? "—" : draft.goal.targetTime}
        />
      </RecapCard>

      <RecapCard title="Musculation" step={5} goToStep={goToStep}>
        <Line
          label="Intention"
          value={
            draft.strengthGoal === ""
              ? "—"
              : labelFor(STRENGTH_GOALS, draft.strengthGoal)
          }
        />
        <Line
          label="Groupes"
          value={
            draft.muscleGroups.length === 0
              ? "—"
              : draft.muscleGroups.map((group) => labelFor(MUSCLE_GROUPS, group)).join(", ")
          }
        />
        <Line
          label="Séances / semaine"
          value={draft.strengthSessionsPerWeek === "" ? "—" : draft.strengthSessionsPerWeek}
        />
        <Line
          label="Durée visée"
          value={
            draft.sessionDurationMin === "" ? "—" : `environ ${draft.sessionDurationMin} min`
          }
        />
      </RecapCard>

      <RecapCard title="Santé" step={6} goToStep={goToStep}>
        <Line label="Zones sensibles" value={injuries} />
      </RecapCard>
    </div>
  );
}
