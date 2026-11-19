import { Field, inputClass } from "@/components/onboarding/fields";
import type { StepProps } from "@/components/onboarding/types";

export function StepRunGoal({ draft, errors, updateGoal }: StepProps) {
  return (
    <div className="space-y-5">
      <label className="flex items-start gap-3 rounded-2xl border border-[#dce2d7] bg-[#fbfcfa] p-4">
        <input
          type="checkbox"
          name="goalEnabled"
          checked={draft.goal.enabled}
          onChange={(event) => updateGoal({ enabled: event.target.checked })}
          className="mt-0.5 h-5 w-5 rounded border-[#b8c4b4] accent-[#245642]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#34493e]">
            J’ai une course en vue
          </span>
          <span className="mt-1 block text-xs leading-5 text-[#8a9088]">
            Optionnel. Une seule course principale ici ; les courses secondaires
            s’ajouteront depuis les réglages.
          </span>
        </span>
      </label>

      {draft.goal.enabled ? (
        <div className="space-y-5">
          <Field id="goalRaceName" label="Nom de la course (optionnel)" error={errors.goalRaceName}>
            <input
              id="goalRaceName"
              name="goalRaceName"
              type="text"
              maxLength={120}
              value={draft.goal.raceName}
              onChange={(event) => updateGoal({ raceName: event.target.value })}
              className={inputClass}
              placeholder="Semi-marathon de Paris"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="goalDistanceKm"
              label="Distance (km)"
              hint="10, 21.1, 42.2…"
              error={errors.goalDistanceKm}
            >
              <input
                id="goalDistanceKm"
                name="goalDistanceKm"
                type="number"
                inputMode="decimal"
                min={0.1}
                max={1000}
                step="0.1"
                value={draft.goal.distanceKm}
                onChange={(event) => updateGoal({ distanceKm: event.target.value })}
                className={inputClass}
                placeholder="21.1"
              />
            </Field>

            <Field id="goalDate" label="Date de la course" error={errors.goalDate}>
              <input
                id="goalDate"
                name="goalDate"
                type="date"
                value={draft.goal.raceDate}
                onChange={(event) => updateGoal({ raceDate: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            id="goalTime"
            label="Temps visé (optionnel)"
            hint="Heures:minutes:secondes. Laisse vide si tu n’as pas de chrono en tête."
            error={errors.goalTime}
          >
            <input
              id="goalTime"
              name="goalTime"
              type="time"
              step="1"
              value={draft.goal.targetTime}
              onChange={(event) => updateGoal({ targetTime: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      ) : (
        <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-xs leading-5 text-[#5d675c]">
          Sans course en vue, le programme se construira sur la régularité et le volume.
          Tu pourras ajouter un objectif plus tard depuis les réglages.
        </p>
      )}
    </div>
  );
}
