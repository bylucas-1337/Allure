import {
  DayPicker,
  Field,
  inputClass,
  labelClass,
} from "@/components/onboarding/fields";
import {
  AVAILABILITY_DAYS,
  RUN_EXPERIENCE_OPTIONS,
  RUN_SURFACE_OPTIONS,
  type AvailabilityDay,
} from "@/lib/onboarding";
import type { StepProps } from "@/components/onboarding/types";

export function StepRunPractice({ draft, errors, update }: StepProps) {
  function toggleRunDay(day: AvailabilityDay) {
    update({
      runDays: draft.runDays.includes(day)
        ? draft.runDays.filter((value) => value !== day)
        : [...draft.runDays, day],
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="runExperienceLevel"
          label="Ton expérience en course"
          hint="Pour doser les séances proposées."
          error={errors.runExperienceLevel}
        >
          <select
            id="runExperienceLevel"
            name="runExperienceLevel"
            value={draft.runExperienceLevel}
            onChange={(event) => update({ runExperienceLevel: event.target.value })}
            className={inputClass}
          >
            {RUN_EXPERIENCE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="runSurface"
          label="Où tu cours le plus souvent"
          hint="Route, chemins, tapis : le terrain change les allures."
          error={errors.runSurface}
        >
          <select
            id="runSurface"
            name="runSurface"
            value={draft.runSurface}
            onChange={(event) => update({ runSurface: event.target.value })}
            className={inputClass}
          >
            {RUN_SURFACE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="runSessionsPerWeek"
          label="Séances de course par semaine (optionnel)"
          hint="En moyenne, ces derniers mois."
          error={errors.runSessionsPerWeek}
        >
          <input
            id="runSessionsPerWeek"
            name="runSessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            step="1"
            value={draft.runSessionsPerWeek}
            onChange={(event) => update({ runSessionsPerWeek: event.target.value })}
            className={inputClass}
            placeholder="3"
          />
        </Field>

        <Field
          id="runWeeklyKm"
          label="Volume par semaine (km, optionnel)"
          hint="Même approximatif : 25, 40, 60…"
          error={errors.runWeeklyKm}
        >
          <input
            id="runWeeklyKm"
            name="runWeeklyKm"
            type="number"
            inputMode="decimal"
            min={0}
            max={500}
            step="0.5"
            value={draft.runWeeklyKm}
            onChange={(event) => update({ runWeeklyKm: event.target.value })}
            className={inputClass}
            placeholder="35"
          />
        </Field>
      </div>

      <DayPicker
        name="runDays"
        label="Tes jours de course possibles"
        hint="Aucun jour coché reste une réponse valable."
        error={errors.runDays}
        selected={draft.runDays}
        onToggle={toggleRunDay}
      />

      <div>
        <label htmlFor="longRunDay" className={labelClass}>
          Jour de la sortie longue (optionnel)
        </label>
        <select
          id="longRunDay"
          name="longRunDay"
          value={draft.longRunDay}
          onChange={(event) => update({ longRunDay: event.target.value })}
          className={inputClass}
        >
          <option value="">Pas de jour fixe</option>
          {AVAILABILITY_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        {errors.longRunDay ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{errors.longRunDay}</p>
        ) : (
          <p className="mt-1.5 text-xs leading-5 text-[#8a9088]">
            C’est souvent le week-end : le programme évitera d’y placer autre chose.
          </p>
        )}
      </div>
    </div>
  );
}
