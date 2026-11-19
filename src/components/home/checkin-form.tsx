"use client";

import { useActionState } from "react";
import { saveCheckinAction } from "@/app/actions/checkins";
import { FORM_LABELS, FATIGUE_LABELS } from "@/lib/settings";
import {
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";

export function CheckinForm({
  todayIso,
  existing,
}: {
  todayIso: string;
  existing: { form: number | null; fatigue: number | null; pain: string; notes: string } | null;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok: boolean; message?: string } | null, formData: FormData) => {
      const result = await saveCheckinAction(formData);
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="date" value={todayIso} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="form" label="Forme (1 à 5)" hint="1 = très fatigué, 5 = en forme.">
          <select
            id="form"
            name="form"
            defaultValue={existing?.form ?? ""}
            className={inputClass}
          >
            <option value="">Non renseigné</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {FORM_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="fatigue" label="Fatigue (1 à 5)" hint="1 = frais, 5 = épuisé.">
          <select
            id="fatigue"
            name="fatigue"
            defaultValue={existing?.fatigue ?? ""}
            className={inputClass}
          >
            <option value="">Non renseigné</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {FATIGUE_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="pain" label="Douleur / gêne (optionnel)">
        <input
          id="pain"
          name="pain"
          type="text"
          maxLength={120}
          defaultValue={existing?.pain ?? ""}
          className={inputClass}
          placeholder="Genou droit, mollet…"
        />
      </Field>

      <Field id="notes" label="Notes (optionnel)">
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={300}
          defaultValue={existing?.notes ?? ""}
          className={`${inputClass} min-h-16 py-3`}
          placeholder="Sensations du jour…"
        />
      </Field>

      {state?.message ? (
        <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a412b]">{state.message}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-[#edf5e6] px-4 py-3 text-sm text-[#315d3d]">Check-in enregistré.</p>
      ) : null}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : existing ? "Mettre à jour le check-in" : "Enregistrer le check-in"}
      </button>
    </form>
  );
}
