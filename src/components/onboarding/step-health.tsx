import {
  Field,
  FieldError,
  hintClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/onboarding/fields";
import { INJURY_STATUS_OPTIONS, type InjuryStatus } from "@/lib/onboarding";
import type { HealthStepProps } from "@/components/onboarding/types";

export function StepHealth({
  draft,
  errors,
  addInjury,
  updateInjury,
  removeInjury,
}: HealthStepProps) {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-sm leading-6 text-[#5d675c]">
        Une gêne déclarée n’interdit rien : elle évite de te proposer exactement ce qui
        fait mal. Tu pourras la modifier ou la retirer à tout moment.
      </p>

      {draft.injuries.length === 0 ? (
        <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-sm leading-6 text-[#5d675c]">
          Aucune gêne déclarée. Tu peux passer directement à la suite.
        </p>
      ) : null}

      {draft.injuries.map((injury, index) => (
        <div key={injury.key} className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81877f]">
              Gêne {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removeInjury(injury.key)}
              className="text-xs font-semibold text-[#a94327] underline decoration-[#e5b7a6] underline-offset-4"
            >
              Retirer
            </button>
          </div>

          <div className="mt-3 space-y-4">
            <Field
              id={`injury-label-${injury.key}`}
              label="Où, et quoi ?"
              hint="Par exemple : « genou droit, gêne au déroulé »."
              error={errors[`injuries.${index}.label`]}
            >
              <input
                id={`injury-label-${injury.key}`}
                type="text"
                maxLength={120}
                value={injury.label}
                onChange={(event) => updateInjury(injury.key, { label: event.target.value })}
                className={inputClass}
                placeholder="Genou droit"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field id={`injury-area-${injury.key}`} label="Zone (optionnel)">
                <input
                  id={`injury-area-${injury.key}`}
                  type="text"
                  maxLength={60}
                  value={injury.bodyArea}
                  onChange={(event) =>
                    updateInjury(injury.key, { bodyArea: event.target.value })
                  }
                  className={inputClass}
                  placeholder="Genou"
                />
              </Field>

              <Field id={`injury-status-${injury.key}`} label="État actuel">
                <select
                  id={`injury-status-${injury.key}`}
                  value={injury.status}
                  onChange={(event) =>
                    updateInjury(injury.key, { status: event.target.value as InjuryStatus })
                  }
                  className={inputClass}
                >
                  {INJURY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id={`injury-started-${injury.key}`}
                label="Depuis (optionnel)"
                error={errors[`injuries.${index}.startedOn`]}
              >
                <input
                  id={`injury-started-${injury.key}`}
                  type="date"
                  value={injury.startedOn}
                  onChange={(event) =>
                    updateInjury(injury.key, { startedOn: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addInjury}
        disabled={draft.injuries.length >= 10}
        className={secondaryButtonClass}
      >
        + Ajouter une gêne
      </button>
      <FieldError message={errors.injuries} />
      <p className={hintClass}>Dix gênes maximum pour garder le parcours lisible.</p>
    </div>
  );
}
