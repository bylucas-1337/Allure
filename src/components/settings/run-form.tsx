"use client";

import { useActionState } from "react";
import { saveRunProfileAction } from "@/app/actions/settings";
import {
  CheckboxPill,
  Feedback,
  Field,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE, RUN_EXPERIENCE_OPTIONS, RUN_SURFACE_OPTIONS } from "@/lib/settings";
import type { ProfileView } from "@/lib/settings-data";

const DAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mer" },
  { value: "thu", label: "Jeu" },
  { value: "fri", label: "Ven" },
  { value: "sat", label: "Sam" },
  { value: "sun", label: "Dim" },
];

export function RunForm({ profile }: { profile: ProfileView }) {
  const [state, formAction, isPending] = useActionState(saveRunProfileAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="runExperienceLevel"
          label="Ton expérience en course"
          hint="Pour doser les séances proposées."
          error={state.fieldErrors?.runExperienceLevel}
        >
          <select
            id="runExperienceLevel"
            name="runExperienceLevel"
            defaultValue={profile.runExperienceLevel}
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
          error={state.fieldErrors?.runSurface}
        >
          <select
            id="runSurface"
            name="runSurface"
            defaultValue={profile.runSurface}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="runSessionsPerWeek"
          label="Séances de course par semaine"
          hint="En moyenne, ces derniers mois."
          error={state.fieldErrors?.runSessionsPerWeek}
        >
          <input
            id="runSessionsPerWeek"
            name="runSessionsPerWeek"
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            step="1"
            defaultValue={profile.runSessionsPerWeek}
            className={inputClass}
            placeholder="3"
          />
        </Field>

        <Field
          id="runWeeklyKm"
          label="Volume par semaine (km)"
          hint="Même approximatif."
          error={state.fieldErrors?.runWeeklyKm}
        >
          <input
            id="runWeeklyKm"
            name="runWeeklyKm"
            type="number"
            inputMode="decimal"
            min={0}
            max={500}
            step="0.5"
            defaultValue={profile.runWeeklyKm}
            className={inputClass}
            placeholder="35"
          />
        </Field>
      </div>

      <fieldset>
        <legend className={labelClass}>Tes jours de course possibles</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAYS.map((day) => (
            <CheckboxPill
              key={day.value}
              name="runDays"
              value={day.value}
              label={day.label}
              defaultChecked={profile.runDays.includes(day.value)}
            />
          ))}
        </div>
        {state.fieldErrors?.runDays ? (
          <p className="mt-1.5 text-xs font-medium text-[#a94327]">{state.fieldErrors.runDays}</p>
        ) : (
          <p className={hintClass}>Aucun jour coché reste une réponse valable.</p>
        )}
      </fieldset>

      <Field
        id="longRunDay"
        label="Jour de la sortie longue"
        hint="Souvent le week-end ; le programme évitera d’y placer autre chose."
        error={state.fieldErrors?.longRunDay}
      >
        <select
          id="longRunDay"
          name="longRunDay"
          defaultValue={profile.longRunDay}
          className={inputClass}
        >
          <option value="">Pas de jour fixe</option>
          {DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4 sm:p-5">
        <p className="text-sm font-semibold text-[#34493e]">Tes allures (min:sec par km)</p>
        <p className="mt-1 text-xs leading-5 text-[#8a9088]">
          Même approximatives : elles serviront de repères au programme.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field
            id="easyPace"
            label="Allure facile"
            hint="Tu peux parler."
            error={state.fieldErrors?.easyPace}
          >
            <input
              id="easyPace"
              name="easyPace"
              type="text"
              inputMode="numeric"
              defaultValue={profile.easyPace}
              className={inputClass}
              placeholder="6:15"
            />
          </Field>
          <Field
            id="thresholdPace"
            label="Allure seuil"
            hint="Soutenue, environ une heure."
            error={state.fieldErrors?.thresholdPace}
          >
            <input
              id="thresholdPace"
              name="thresholdPace"
              type="text"
              inputMode="numeric"
              defaultValue={profile.thresholdPace}
              className={inputClass}
              placeholder="5:05"
            />
          </Field>
          <Field
            id="racePace"
            label="Allure de course"
            hint="Celle de ton objectif."
            error={state.fieldErrors?.racePace}
          >
            <input
              id="racePace"
              name="racePace"
              type="text"
              inputMode="numeric"
              defaultValue={profile.racePace}
              className={inputClass}
              placeholder="4:45"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4 sm:p-5">
        <p className="text-sm font-semibold text-[#34493e]">Tes meilleurs temps</p>
        <p className="mt-1 text-xs leading-5 text-[#8a9088]">
          Un seul record suffit pour estimer les autres allures. Format{" "}
          <code className="rounded bg-white px-1.5 py-0.5">22:30</code> ou{" "}
          <code className="rounded bg-white px-1.5 py-0.5">1:45:00</code>.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="pb5k" label="5 km" error={state.fieldErrors?.pb5k}>
            <input
              id="pb5k"
              name="pb5k"
              type="text"
              inputMode="numeric"
              defaultValue={profile.pb5k}
              className={inputClass}
              placeholder="22:30"
            />
          </Field>
          <Field id="pb10k" label="10 km" error={state.fieldErrors?.pb10k}>
            <input
              id="pb10k"
              name="pb10k"
              type="text"
              inputMode="numeric"
              defaultValue={profile.pb10k}
              className={inputClass}
              placeholder="46:00"
            />
          </Field>
          <Field id="pbHalf" label="Semi-marathon" error={state.fieldErrors?.pbHalf}>
            <input
              id="pbHalf"
              name="pbHalf"
              type="text"
              inputMode="numeric"
              defaultValue={profile.pbHalf}
              className={inputClass}
              placeholder="1:45:00"
            />
          </Field>
          <Field id="pbMarathon" label="Marathon" error={state.fieldErrors?.pbMarathon}>
            <input
              id="pbMarathon"
              name="pbMarathon"
              type="text"
              inputMode="numeric"
              defaultValue={profile.pbMarathon}
              className={inputClass}
              placeholder="3:45:00"
            />
          </Field>
        </div>
      </div>

      <Feedback state={state} />

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Enregistrer mes repères de course"}
      </button>
    </form>
  );
}
