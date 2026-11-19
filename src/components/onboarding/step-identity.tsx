import { Field, inputClass } from "@/components/onboarding/fields";
import { SEX_OPTIONS } from "@/lib/onboarding";
import type { StepProps } from "@/components/onboarding/types";

export function StepIdentity({ draft, errors, update }: StepProps) {
  return (
    <div className="space-y-5">
      <Field
        id="firstName"
        label="Comment veux-tu être appelé ? (optionnel)"
        hint="Laisse vide si tu préfères rester anonyme."
        error={errors.firstName}
      >
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="given-name"
          maxLength={80}
          value={draft.firstName}
          onChange={(event) => update({ firstName: event.target.value })}
          className={inputClass}
          placeholder="Prénom ou surnom"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="birthDate"
          label="Date de naissance (optionnel)"
          hint="Sert à calculer ton âge, jamais à le figer."
          error={errors.birthDate}
        >
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            value={draft.birthDate}
            onChange={(event) => update({ birthDate: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field id="sex" label="Sexe (optionnel)" hint="Utile plus tard pour les zones cardiaques.">
          <select
            id="sex"
            name="sex"
            value={draft.sex}
            onChange={(event) => update({ sex: event.target.value })}
            className={inputClass}
          >
            {SEX_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="heightCm" label="Taille (cm)" error={errors.heightCm}>
          <input
            id="heightCm"
            name="heightCm"
            type="number"
            inputMode="decimal"
            min={50}
            max={250}
            step="0.1"
            required
            value={draft.heightCm}
            onChange={(event) => update({ heightCm: event.target.value })}
            className={inputClass}
            placeholder="170"
          />
        </Field>

        <Field
          id="weightKg"
          label="Poids actuel (kg)"
          hint="Point de départ de ton historique."
          error={errors.weightKg}
        >
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            step="0.1"
            required
            value={draft.weightKg}
            onChange={(event) => update({ weightKg: event.target.value })}
            className={inputClass}
            placeholder="68.5"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="weightDate"
          label="Date de cette pesée (optionnel)"
          hint="Aujourd’hui si tu laisses vide."
          error={errors.weightDate}
        >
          <input
            id="weightDate"
            name="weightDate"
            type="date"
            value={draft.weightDate}
            onChange={(event) => update({ weightDate: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          id="restingHr"
          label="FC de repos (optionnel)"
          hint="Au réveil, au calme. Sert aux zones cardiaques."
          error={errors.restingHr}
        >
          <input
            id="restingHr"
            name="restingHr"
            type="number"
            inputMode="numeric"
            min={25}
            max={120}
            step="1"
            value={draft.restingHr}
            onChange={(event) => update({ restingHr: event.target.value })}
            className={inputClass}
            placeholder="58"
          />
        </Field>
      </div>

      <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-xs leading-5 text-[#5d675c]">
        La taille et le poids sont les seules réponses obligatoires de tout le parcours.
        Tout le reste peut rester vide et se remplir plus tard.
      </p>
    </div>
  );
}
