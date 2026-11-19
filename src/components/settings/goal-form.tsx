"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveGoalAction } from "@/app/actions/settings";
import {
  Feedback,
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE, secondsToTimeInput } from "@/lib/settings";
import type { GoalView } from "@/lib/settings-data";

export function GoalForm({
  goal,
  kind,
  compact = false,
}: {
  goal?: GoalView;
  kind: "main" | "secondary";
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(saveGoalAction, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const effectiveKind = goal?.kind === "secondary" ? "secondary" : kind;

  useEffect(() => {
    if (!goal && state.status === "success") {
      formRef.current?.reset();
    }
  }, [goal, state]);

  const distanceKm =
    goal?.distanceM != null ? String(Math.round(goal.distanceM / 100) / 10) : "";

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {goal ? <input type="hidden" name="id" value={goal.id} /> : null}
      <input type="hidden" name="kind" value={effectiveKind} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={goal ? `goal-name-${goal.id}` : `goal-name-${kind}`}
          label="Nom de la course"
          hint="Facultatif."
          error={state.fieldErrors?.raceName}
        >
          <input
            id={goal ? `goal-name-${goal.id}` : `goal-name-${kind}`}
            name="raceName"
            type="text"
            maxLength={120}
            defaultValue={goal?.raceName ?? ""}
            className={inputClass}
            placeholder="Semi-marathon de Paris"
          />
        </Field>

        <Field
          id={goal ? `goal-distance-${goal.id}` : `goal-distance-${kind}`}
          label="Distance (km)"
          hint={effectiveKind === "main" ? "Nécessaire pour l’objectif principal." : "Facultative."}
          error={state.fieldErrors?.distanceKm}
        >
          <input
            id={goal ? `goal-distance-${goal.id}` : `goal-distance-${kind}`}
            name="distanceKm"
            type="number"
            inputMode="decimal"
            min={0.1}
            max={1000}
            step="0.1"
            defaultValue={distanceKm}
            className={inputClass}
            placeholder="21.1"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={goal ? `goal-date-${goal.id}` : `goal-date-${kind}`}
          label="Date"
          hint="Facultative pour une course secondaire."
          error={state.fieldErrors?.raceDate}
        >
          <input
            id={goal ? `goal-date-${goal.id}` : `goal-date-${kind}`}
            name="raceDate"
            type="date"
            defaultValue={goal?.raceDate ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          id={goal ? `goal-time-${goal.id}` : `goal-time-${kind}`}
          label="Temps visé"
          hint="Heures:minutes:secondes. Facultatif."
          error={state.fieldErrors?.targetTime}
        >
          <input
            id={goal ? `goal-time-${goal.id}` : `goal-time-${kind}`}
            name="targetTime"
            type="time"
            step="1"
            defaultValue={secondsToTimeInput(goal?.targetTimeSec ?? null)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        id={goal ? `goal-note-${goal.id}` : `goal-note-${kind}`}
        label="Note"
        hint="Ce qui compte pour toi sur cette course. Facultatif."
        error={state.fieldErrors?.note}
      >
        <textarea
          id={goal ? `goal-note-${goal.id}` : `goal-note-${kind}`}
          name="note"
          rows={2}
          maxLength={500}
          defaultValue={goal?.note ?? ""}
          className={`${inputClass} min-h-20 py-3`}
          placeholder="Finir sans marcher, battre mon record…"
        />
      </Field>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={isPending}
        className={compact ? secondaryButtonClass : primaryButtonClass}
      >
        {isPending
          ? "Enregistrement…"
          : goal
            ? "Enregistrer"
            : effectiveKind === "main"
              ? "Définir cet objectif principal"
              : "Ajouter cette course"}
      </button>
    </form>
  );
}
