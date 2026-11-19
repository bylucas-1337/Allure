"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveWeightAction } from "@/app/actions/settings";
import {
  Feedback,
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE } from "@/lib/settings";

export function WeightForm() {
  const [state, formAction, isPending] = useActionState(saveWeightAction, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="weightKg" label="Poids (kg)" error={state.fieldErrors?.weightKg}>
          <input
            id="weightKg"
            name="weightKg"
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            step="0.1"
            className={inputClass}
            placeholder="68.5"
          />
        </Field>

        <Field
          id="measuredOn"
          label="Date de la pesée"
          hint="Aujourd’hui si tu laisses vide."
          error={state.fieldErrors?.measuredOn}
        >
          <input id="measuredOn" name="measuredOn" type="date" className={inputClass} />
        </Field>
      </div>

      <Feedback state={state} />

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Ajouter cette pesée"}
      </button>
    </form>
  );
}
