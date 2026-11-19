import {
  CheckPills,
  DayPicker,
  Field,
  RadioCard,
  inputClass,
} from "@/components/onboarding/fields";
import { EQUIPMENT, MUSCLE_GROUPS, STRENGTH_GOALS } from "@/lib/settings";
import { EXPERIENCE_OPTIONS, type AvailabilityDay } from "@/lib/onboarding";
import type { StepProps } from "@/components/onboarding/types";

export function StepStrength({ draft, errors, update }: StepProps) {
  function toggleStrengthDay(day: AvailabilityDay) {
    update({
      strengthDays: draft.strengthDays.includes(day)
        ? draft.strengthDays.filter((value) => value !== day)
        : [...draft.strengthDays, day],
    });
  }

  function toggleMuscleGroup(group: string) {
    update({
      muscleGroups: draft.muscleGroups.includes(group)
        ? draft.muscleGroups.filter((value) => value !== group)
        : [...draft.muscleGroups, group],
    });
  }

  function toggleEquipment(item: string) {
    update({
      equipment: draft.equipment.includes(item)
        ? draft.equipment.filter((value) => value !== item)
        : [...draft.equipment, item],
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="experienceLevel"
          label="Ton expérience en musculation"
          hint="Pour doser les séries et les charges."
          error={errors.experienceLevel}
        >
          <select
            id="experienceLevel"
            name="experienceLevel"
            value={draft.experienceLevel}
            onChange={(event) => update({ experienceLevel: event.target.value })}
            className={inputClass}
          >
            {EXPERIENCE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="strengthSessionsPerWeek"
          label="Séances de muscu par semaine (optionnel)"
          hint="1, 2, 3… selon ta réalité."
          error={errors.strengthSessionsPerWeek}
        >
          <input
            id="strengthSessionsPerWeek"
            name="strengthSessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            step="1"
            value={draft.strengthSessionsPerWeek}
            onChange={(event) => update({ strengthSessionsPerWeek: event.target.value })}
            className={inputClass}
            placeholder="2"
          />
        </Field>
      </div>

      <Field
        id="sessionDurationMin"
        label="Durée visée d’une séance (minutes, optionnel)"
        hint="Approximatif : le programme s’en rapprochera, sans s’y enfermer. C’est une durée de muscu, pas de course."
        error={errors.sessionDurationMin}
      >
        <input
          id="sessionDurationMin"
          name="sessionDurationMin"
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          step="5"
          value={draft.sessionDurationMin}
          onChange={(event) => update({ sessionDurationMin: event.target.value })}
          className={inputClass}
          placeholder="45"
        />
      </Field>

      <DayPicker
        name="strengthDays"
        label="Tes jours de muscu possibles"
        hint="Séparés des jours de course pour éviter les conflits."
        error={errors.strengthDays}
        selected={draft.strengthDays}
        onToggle={toggleStrengthDay}
      />

      <fieldset>
        <legend className="mb-1.5 block text-sm font-semibold text-[#34493e]">
          Ce que tu cherches en musculation
        </legend>
        <div className="grid gap-2">
          <RadioCard
            name="strengthGoal"
            value=""
            label="Je ne sais pas encore"
            hint="On proposera quelque chose de généraliste."
            checked={draft.strengthGoal === ""}
            onChange={() => update({ strengthGoal: "" })}
          />

          {STRENGTH_GOALS.map((option) => (
            <RadioCard
              key={option.value}
              name="strengthGoal"
              value={option.value}
              label={option.label}
              hint={option.hint}
              checked={draft.strengthGoal === option.value}
              onChange={() => update({ strengthGoal: option.value })}
            />
          ))}
        </div>
        {errors.strengthGoal ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{errors.strengthGoal}</p>
        ) : null}
      </fieldset>

      <CheckPills
        name="muscleGroups"
        label="Groupes musculaires à travailler"
        hint="Tout cocher donne un programme complet ; rien cocher laisse le choix au programme."
        error={errors.muscleGroups}
        options={MUSCLE_GROUPS}
        selected={draft.muscleGroups}
        onToggle={toggleMuscleGroup}
      />

      <CheckPills
        name="equipment"
        label="Matériel à disposition"
        hint="Coche seulement ce que tu peux vraiment utiliser."
        error={errors.equipment}
        options={EQUIPMENT}
        selected={draft.equipment}
        onToggle={toggleEquipment}
      />
    </div>
  );
}
