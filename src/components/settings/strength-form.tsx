"use client";

import { useActionState } from "react";
import { saveStrengthAction } from "@/app/actions/settings";
import {
  CheckboxPill,
  Feedback,
  Field,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { EQUIPMENT, IDLE_STATE, MUSCLE_GROUPS, STRENGTH_GOALS } from "@/lib/settings";
import type { ProfileView } from "@/lib/settings-data";

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Je ne sais pas" },
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
];

const DAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mer" },
  { value: "thu", label: "Jeu" },
  { value: "fri", label: "Ven" },
  { value: "sat", label: "Sam" },
  { value: "sun", label: "Dim" },
];

export function StrengthForm({ profile }: { profile: ProfileView }) {
  const [state, formAction, isPending] = useActionState(saveStrengthAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="experienceLevel"
          label="Ton expérience en musculation"
          hint="Pour doser les séries et les charges."
          error={state.fieldErrors?.experienceLevel}
        >
          <select
            id="experienceLevel"
            name="experienceLevel"
            defaultValue={profile.experienceLevel}
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
          label="Séances de muscu par semaine"
          hint="1, 2, 3… selon ta réalité."
          error={state.fieldErrors?.strengthSessionsPerWeek}
        >
          <input
            id="strengthSessionsPerWeek"
            name="strengthSessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            step="1"
            defaultValue={profile.strengthSessionsPerWeek}
            className={inputClass}
            placeholder="2"
          />
        </Field>
      </div>

      <Field
        id="sessionDurationMin"
        label="Durée visée d’une séance (minutes)"
        hint="Approximatif : le programme s’en rapprochera, sans s’y enfermer. C’est une durée de muscu, pas de course."
        error={state.fieldErrors?.sessionDurationMin}
      >
        <input
          id="sessionDurationMin"
          name="sessionDurationMin"
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          step="5"
          defaultValue={profile.sessionDurationMin}
          className={inputClass}
          placeholder="45"
        />
      </Field>

      <fieldset>
        <legend className={labelClass}>Tes jours de muscu possibles</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => (
            <CheckboxPill
              key={day.value}
              name="strengthDays"
              value={day.value}
              label={day.label}
              defaultChecked={profile.strengthDays.includes(day.value)}
            />
          ))}
        </div>
        {state.fieldErrors?.strengthDays ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{state.fieldErrors.strengthDays}</p>
        ) : (
          <p className={hintClass}>Séparés des jours de course pour éviter les conflits.</p>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Ce que tu cherches en musculation</legend>
        <div className="grid gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dce2d7] bg-[#fbfcfa] p-3.5 transition has-[:checked]:border-[#6f9c7d] has-[:checked]:bg-[#eaf2df]">
            <input
              type="radio"
              name="strengthGoal"
              value=""
              defaultChecked={profile.strengthGoal === ""}
              className="mt-0.5 h-5 w-5 accent-[#245642]"
            />
            <span>
              <span className="block text-sm font-semibold text-[#34493e]">Je ne sais pas encore</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#8a9088]">
                On proposera quelque chose de généraliste.
              </span>
            </span>
          </label>

          {STRENGTH_GOALS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dce2d7] bg-[#fbfcfa] p-3.5 transition has-[:checked]:border-[#6f9c7d] has-[:checked]:bg-[#eaf2df]"
            >
              <input
                type="radio"
                name="strengthGoal"
                value={option.value}
                defaultChecked={profile.strengthGoal === option.value}
                className="mt-0.5 h-5 w-5 accent-[#245642]"
              />
              <span>
                <span className="block text-sm font-semibold text-[#34493e]">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[#8a9088]">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.strengthGoal ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{state.fieldErrors.strengthGoal}</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Groupes musculaires à travailler</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MUSCLE_GROUPS.map((group) => (
            <CheckboxPill
              key={group.value}
              name="muscleGroups"
              value={group.value}
              label={group.label}
              defaultChecked={profile.muscleGroups.includes(group.value)}
            />
          ))}
        </div>
        {state.fieldErrors?.muscleGroups ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{state.fieldErrors.muscleGroups}</p>
        ) : (
          <p className={hintClass}>Tout cocher donne un programme complet ; rien cocher laisse le choix.</p>
        )}
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Matériel à disposition</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EQUIPMENT.map((item) => (
            <CheckboxPill
              key={item.value}
              name="equipment"
              value={item.value}
              label={item.label}
              defaultChecked={profile.equipment.includes(item.value)}
            />
          ))}
        </div>
        {state.fieldErrors?.equipment ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{state.fieldErrors.equipment}</p>
        ) : null}
      </fieldset>

      <Feedback state={state} />

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Enregistrer mes préférences muscu"}
      </button>
    </form>
  );
}
