"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveInjuryAction } from "@/app/actions/settings";
import {
  Feedback,
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE, INJURY_STATUSES } from "@/lib/settings";
import type { InjuryView } from "@/lib/settings-data";

export function InjuryForm({
  injury,
  compact = false,
}: {
  injury?: InjuryView;
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveInjuryAction, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Une gêne ajoutée vide le formulaire ; une gêne modifiée garde ses valeurs.
  useEffect(() => {
    if (!injury && state.status === "success") {
      formRef.current?.reset();
    }
  }, [injury, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {injury ? <input type="hidden" name="id" value={injury.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={injury ? `injury-label-${injury.id}` : "injury-label"}
          label="Où, et quoi ?"
          hint="Par exemple : « genou droit, gêne au déroulé »."
          error={state.fieldErrors?.label}
        >
          <input
            id={injury ? `injury-label-${injury.id}` : "injury-label"}
            name="label"
            type="text"
            maxLength={120}
            defaultValue={injury?.label ?? ""}
            className={inputClass}
            placeholder="Genou droit"
          />
        </Field>

        <Field
          id={injury ? `injury-area-${injury.id}` : "injury-area"}
          label="Zone du corps"
          hint="Facultatif."
          error={state.fieldErrors?.bodyArea}
        >
          <input
            id={injury ? `injury-area-${injury.id}` : "injury-area"}
            name="bodyArea"
            type="text"
            maxLength={60}
            defaultValue={injury?.bodyArea ?? ""}
            className={inputClass}
            placeholder="Genou"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id={injury ? `injury-status-${injury.id}` : "injury-status"}
          label="État actuel"
          error={state.fieldErrors?.status}
        >
          <select
            id={injury ? `injury-status-${injury.id}` : "injury-status"}
            name="status"
            defaultValue={injury?.status ?? "active"}
            className={inputClass}
          >
            {INJURY_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={injury ? `injury-started-${injury.id}` : "injury-started"}
          label="Depuis"
          hint="Facultatif."
          error={state.fieldErrors?.startedOn}
        >
          <input
            id={injury ? `injury-started-${injury.id}` : "injury-started"}
            name="startedOn"
            type="date"
            defaultValue={injury?.startedOn ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          id={injury ? `injury-ended-${injury.id}` : "injury-ended"}
          label="Fin"
          hint="Si c’est guéri."
          error={state.fieldErrors?.endedOn}
        >
          <input
            id={injury ? `injury-ended-${injury.id}` : "injury-ended"}
            name="endedOn"
            type="date"
            defaultValue={injury?.endedOn ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={isPending}
        className={compact ? secondaryButtonClass : primaryButtonClass}
      >
        {isPending ? "Enregistrement…" : injury ? "Enregistrer" : "Ajouter cette gêne"}
      </button>
    </form>
  );
}
