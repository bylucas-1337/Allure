"use client";

import { useActionState } from "react";
import { saveProfileAction } from "@/app/actions/settings";
import {
  Feedback,
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE } from "@/lib/settings";
import type { ProfileView } from "@/lib/settings-data";

const SEX_OPTIONS = [
  { value: "", label: "Je ne sais pas / je préfère ne pas dire" },
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
  { value: "other", label: "Autre" },
  { value: "prefer_not_to_say", label: "Je préfère ne pas répondre" },
];

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const [state, formAction, isPending] = useActionState(saveProfileAction, IDLE_STATE);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="Prénom" hint="Facultatif." error={state.fieldErrors?.firstName}>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            maxLength={80}
            defaultValue={profile.firstName}
            className={inputClass}
            placeholder="Prénom ou surnom"
          />
        </Field>

        <Field
          id="birthDate"
          label="Date de naissance"
          hint="Facultative. Sert à calculer ton âge."
          error={state.fieldErrors?.birthDate}
        >
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            defaultValue={profile.birthDate}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="heightCm" label="Taille (cm)" error={state.fieldErrors?.heightCm}>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            inputMode="decimal"
            min={50}
            max={250}
            step="0.1"
            defaultValue={profile.heightCm}
            className={inputClass}
            placeholder="170"
          />
        </Field>

        <Field id="restingHr" label="FC de repos (bpm)" hint="Facultative. Au réveil, au calme." error={state.fieldErrors?.restingHr}>
          <input
            id="restingHr"
            name="restingHr"
            type="number"
            inputMode="numeric"
            min={25}
            max={120}
            step="1"
            defaultValue={profile.restingHr}
            className={inputClass}
            placeholder="58"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sex" label="Sexe" hint="Sert plus tard aux zones cardiaques." error={state.fieldErrors?.sex}>
          <select id="sex" name="sex" defaultValue={profile.sex} className={inputClass}>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Feedback state={state} />

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}
