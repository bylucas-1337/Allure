"use client";

import { useActionState, useState } from "react";
import { saveStrengthSessionAction, updateStrengthSessionAction, deleteStrengthSessionAction } from "@/app/actions/strength-sessions";
import {
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { RPE_LABELS } from "@/lib/settings";
import type { StrengthSessionView } from "@/lib/strength-sessions-data";

type SetRow = { reps: string; weightKg: string };
type ExerciseRow = { name: string; sets: SetRow[] };

export function StrengthSessionForm({ initial }: { initial?: StrengthSessionView } = {}) {
  const isEdit = Boolean(initial);
  const [exercises, setExercises] = useState<ExerciseRow[]>(
    initial
      ? initial.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets.map((set) => ({ reps: set.reps, weightKg: set.weightKg })),
        }))
      : [],
  );
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok: boolean; errors?: Record<string, string> } | null, formData: FormData) => {
      const result = isEdit
        ? await updateStrengthSessionAction(formData)
        : await saveStrengthSessionAction(formData);
      if (result.ok && !isEdit) {
        setExercises([]);
        (document.getElementById("strength-session-form") as HTMLFormElement | null)?.reset();
      }
      return result;
    },
    null,
  );

  const today = new Date().toISOString().slice(0, 10);
  const exercisesJson = JSON.stringify(
    exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weightKg: set.weightKg,
      })),
    })),
  );

  function addExercise() {
    setExercises((prev) => [...prev, { name: "", sets: [{ reps: "", weightKg: "" }] }]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExerciseName(index: number, name: string) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, name } : ex)));
  }

  function addSet(exIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, { reps: "", weightKg: "" }] } : ex,
      ),
    );
  }

  function removeSet(exIndex: number, setIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: ex.sets.filter((_, s) => s !== setIndex) } : ex,
      ),
    );
  }

  function updateSet(exIndex: number, setIndex: number, field: "reps" | "weightKg", value: string) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((set, s) =>
                s === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : ex,
      ),
    );
  }

  return (
    <form id="strength-session-form" action={formAction} className="space-y-5" noValidate>
      {isEdit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="exercisesJson" value={exercisesJson} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="sessionDate" label="Date" error={state?.errors?.sessionDate}>
          <input
            id="sessionDate"
            name="sessionDate"
            type="date"
            defaultValue={initial?.sessionDate ?? today}
            className={inputClass}
          />
        </Field>

        <Field id="durationMin" label="Minutes" error={state?.errors?.durationMin}>
          <input
            id="durationMin"
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            step="1"
            defaultValue={initial?.durationMin ?? ""}
            className={inputClass}
            placeholder="45"
          />
        </Field>

        <Field id="durationSec" label="Secondes" error={state?.errors?.durationSec}>
          <input
            id="durationSec"
            name="durationSec"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step="1"
            defaultValue={initial?.durationSec ?? ""}
            className={inputClass}
            placeholder="0"
          />
        </Field>
      </div>

      <Field id="rpe" label="Ressenti (optionnel)" error={state?.errors?.rpe}>
        <select id="rpe" name="rpe" defaultValue={initial?.rpe ?? ""} className={inputClass}>
          <option value="">Non renseigné</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {RPE_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#34493e]">Exercices</p>
          <button
            type="button"
            onClick={addExercise}
            className="text-xs font-semibold text-[#32634f] underline"
          >
            + Ajouter un exercice
          </button>
        </div>

        {exercises.length === 0 ? (
          <p className="text-xs text-[#8a9088]">
            Aucun exercice ajouté. Tu peux enregistrer la séance sans détail.
          </p>
        ) : null}

        {exercises.map((exercise, exIndex) => (
          <div key={exIndex} className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={exercise.name}
                onChange={(event) => updateExerciseName(exIndex, event.target.value)}
                className={inputClass}
                placeholder="Nom de l'exercice (ex. Squat)"
              />
              <button
                type="button"
                onClick={() => removeExercise(exIndex)}
                className="text-xs font-semibold text-[#a94327] underline"
              >
                Retirer
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div key={setIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="Répétitions"
                    value={set.reps}
                    onChange={(event) => updateSet(exIndex, setIndex, "reps", event.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    placeholder="Charge (kg)"
                    value={set.weightKg}
                    onChange={(event) => updateSet(exIndex, setIndex, "weightKg", event.target.value)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(exIndex, setIndex)}
                    className="text-xs font-semibold text-[#a94327] underline"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(exIndex)}
                className="text-xs font-semibold text-[#32634f] underline"
              >
                + Série
              </button>
            </div>
          </div>
        ))}
      </div>

      <Field id="notes" label="Notes (optionnel)" error={state?.errors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          defaultValue={initial?.notes ?? ""}
          className={`${inputClass} min-h-20 py-3`}
          placeholder="Sensations, charges, progression…"
        />
      </Field>

      {state?.errors?.form ? (
        <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a4327]">
          {state.errors.form}
        </p>
      ) : null}

      {state?.errors?.exercises ? (
        <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a4327]">
          {state.errors.exercises}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-xl bg-[#edf5e6] px-4 py-3 text-sm text-[#315d3d]">
          {isEdit ? "Séance mise à jour." : "Séance enregistrée."}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Enregistrer la séance"}
      </button>
    </form>
  );
}

export function StrengthSessionList({ sessions }: { sessions: StrengthSessionView[] }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-[#8a9088]">Aucune séance enregistrée pour le moment.</p>;
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => {
        const durationLabel =
          session.durationSec > 0
            ? `${session.durationMin} min ${session.durationSec.toString().padStart(2, "0")} s`
            : `${session.durationMin} min`;
        return (
          <li key={session.id} className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
            <details>
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-[#23372f]">
                    Musculation · {durationLabel}
                  </p>
                  <span className="text-xs text-[#8a9088]">{session.sessionDate}</span>
                </div>
                {session.rpe ? <p className="mt-1 text-xs text-[#8a9088]">{RPE_LABELS[session.rpe] ?? session.rpe}</p> : null}
              </summary>
              <div className="mt-3 space-y-2 border-t border-[#eef0e8] pt-3 text-sm text-[#5d675c]">
                {session.exercises.length > 0 ? (
                  <ul className="space-y-1">
                    {session.exercises.map((exercise, index) => (
                      <li key={index}>
                        <span className="font-semibold text-[#23372f]">{exercise.name || "Exercice"}</span>
                        {exercise.sets.length > 0 ? (
                          <span className="ml-2 text-xs text-[#8a9088]">
                            {exercise.sets
                              .map((set) => `${set.reps || "?"}×${set.weightKg || "?"}kg`)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#8a9088]">Aucun exercice détaillé.</p>
                )}
                {session.notes ? <p className="leading-6">{session.notes}</p> : null}
                <details className="pt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-[#32634f] underline">
                    Modifier
                  </summary>
                  <StrengthSessionForm initial={session} />
                </details>
                <form action={deleteStrengthSessionAction} className="pt-2">
                  <input type="hidden" name="id" value={session.id} />
                  <button type="submit" className="text-xs font-semibold text-[#a94327] underline">
                    Supprimer
                  </button>
                </form>
              </div>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
