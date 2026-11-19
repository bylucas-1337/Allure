"use client";

import { useActionState } from "react";
import { saveRunSessionAction, updateRunSessionAction, deleteRunSessionAction } from "@/app/actions/run-sessions";
import {
  Field,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";
import { RPE_LABELS } from "@/lib/settings";
import { SESSION_TYPES } from "@/lib/run-sessions";
import type { RunSessionView } from "@/lib/run-sessions-data";
import { formatDistance, formatDuration } from "@/components/settings/settings-ui";

function typeLabel(value: string) {
  return SESSION_TYPES.find((item) => item.value === value)?.label ?? value;
}

export function RunSessionForm({ goals }: { goals: { id: string; raceName: string }[] }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok: boolean; errors?: Record<string, string> } | null, formData: FormData) => {
      const result = await saveRunSessionAction(formData);
      if (result.ok) {
        (document.getElementById("run-session-form") as HTMLFormElement | null)?.reset();
      }
      return result;
    },
    null,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form id="run-session-form" action={formAction} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sessionDate" label="Date" error={state?.errors?.sessionDate}>
          <input
            id="sessionDate"
            name="sessionDate"
            type="date"
            defaultValue={today}
            className={inputClass}
          />
        </Field>

        <Field id="sessionType" label="Type de séance" error={state?.errors?.sessionType}>
          <select
            id="sessionType"
            name="sessionType"
            defaultValue="easy"
            className={inputClass}
          >
            {SESSION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="durationMin"
          label="Minutes"
          hint="Durée totale."
          error={state?.errors?.durationMin}
        >
          <input
            id="durationMin"
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            step="1"
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
            className={inputClass}
            placeholder="0"
          />
        </Field>

        <Field
          id="distanceKm"
          label="Distance (km)"
          hint="Optionnel."
          error={state?.errors?.distanceKm}
        >
          <input
            id="distanceKm"
            name="distanceKm"
            type="number"
            inputMode="decimal"
            min={0}
            max={500}
            step="0.1"
            className={inputClass}
            placeholder="8.5"
          />
        </Field>
      </div>

        <Field id="rpe" label="Ressenti (optionnel)" error={state?.errors?.rpe}>
          <select id="rpe" name="rpe" defaultValue="" className={inputClass}>
            <option value="">Non renseigné</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} — {RPE_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>

      {goals.length > 0 ? (
        <Field id="goalId" label="Objectif rattaché (optionnel)">
          <select id="goalId" name="goalId" defaultValue="" className={inputClass}>
            <option value="">Aucun</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.raceName}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field id="notes" label="Notes (optionnel)" error={state?.errors?.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          className={`${inputClass} min-h-20 py-3`}
          placeholder="Sensations, météo, parcours…"
        />
      </Field>

      {state?.errors?.form ? (
        <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a412b]">
          {state.errors.form}
        </p>
      ) : null}

      {state?.ok ? (
        <p className="rounded-xl bg-[#edf5e6] px-4 py-3 text-sm text-[#315d3d]">
          Séance enregistrée.
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Enregistrer la séance"}
      </button>
    </form>
  );
}

export function RunSessionEditForm({
  session,
  goals,
}: {
  session: RunSessionView;
  goals: { id: string; raceName: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok: boolean; errors?: Record<string, string> } | null, formData: FormData) => {
      const result = await updateRunSessionAction(formData);
      return result;
    },
    null,
  );

  const distanceKm =
    session.distanceM === null ? "" : (session.distanceM / 1000).toString();

  return (
    <form action={formAction} className="mt-3 space-y-4 border-t border-[#eef0e8] pt-3" noValidate>
      <input type="hidden" name="id" value={session.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`rd-${session.id}`} label="Date" error={state?.errors?.sessionDate}>
          <input
            id={`rd-${session.id}`}
            name="sessionDate"
            type="date"
            defaultValue={session.sessionDate}
            className={inputClass}
          />
        </Field>
        <Field id={`rt-${session.id}`} label="Type" error={state?.errors?.sessionType}>
          <select
            id={`rt-${session.id}`}
            name="sessionType"
            defaultValue={session.sessionType}
            className={inputClass}
          >
            {SESSION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id={`rmin-${session.id}`} label="Minutes" error={state?.errors?.durationMin}>
          <input
            id={`rmin-${session.id}`}
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={0}
            max={600}
            step="1"
            defaultValue={session.durationMin}
            className={inputClass}
          />
        </Field>
        <Field id={`rsec-${session.id}`} label="Secondes" error={state?.errors?.durationSec}>
          <input
            id={`rsec-${session.id}`}
            name="durationSec"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step="1"
            defaultValue={session.durationSec}
            className={inputClass}
          />
        </Field>
        <Field id={`rkm-${session.id}`} label="Distance (km)" error={state?.errors?.distanceKm}>
          <input
            id={`rkm-${session.id}`}
            name="distanceKm"
            type="number"
            inputMode="decimal"
            min={0}
            max={500}
            step="0.1"
            defaultValue={distanceKm}
            className={inputClass}
          />
        </Field>
      </div>
      <Field id={`rrpe-${session.id}`} label="Ressenti" error={state?.errors?.rpe}>
        <select
          id={`rrpe-${session.id}`}
          name="rpe"
          defaultValue={session.rpe ?? ""}
          className={inputClass}
        >
          <option value="">Non renseigné</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value} — {RPE_LABELS[value]}
            </option>
          ))}
        </select>
      </Field>
      {goals.length > 0 ? (
        <Field id={`rgoal-${session.id}`} label="Objectif">
          <select
            id={`rgoal-${session.id}`}
            name="goalId"
            defaultValue={session.goalId ?? ""}
            className={inputClass}
          >
            <option value="">Aucun</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.raceName}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field id={`rnotes-${session.id}`} label="Notes" error={state?.errors?.notes}>
        <textarea
          id={`rnotes-${session.id}`}
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={session.notes}
          className={`${inputClass} min-h-16 py-3`}
        />
      </Field>
      {state?.errors?.form ? (
        <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a412b]">
          {state.errors.form}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-[#edf5e6] px-4 py-3 text-sm text-[#315d3d]">
          Séance mise à jour.
        </p>
      ) : null}
      <button type="submit" disabled={isPending} className={primaryButtonClass}>
        {isPending ? "Enregistrement…" : "Mettre à jour"}
      </button>
    </form>
  );
}

export function RunSessionList({
  sessions,
  goals = [],
}: {
  sessions: RunSessionView[];
  goals?: { id: string; raceName: string }[];
}) {
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
                    {typeLabel(session.sessionType)} · {durationLabel}
                    {session.distanceM ? ` · ${formatDistance(session.distanceM)}` : ""}
                  </p>
                  <span className="text-xs text-[#8a9088]">{session.sessionDate}</span>
                </div>
                {session.avgPaceSec ? (
                  <p className="mt-1 text-xs text-[#8a9088]">
                    Allure moyenne : {formatDuration(session.avgPaceSec)} /km
                    {session.rpe ? ` · ${RPE_LABELS[session.rpe] ?? session.rpe}` : ""}
                  </p>
                ) : null}
              </summary>
              <div className="mt-3 space-y-1 border-t border-[#eef0e8] pt-3 text-sm text-[#5d675c]">
                {session.goalName ? <p>Objectif : {session.goalName}</p> : null}
                {session.notes ? <p className="leading-6">{session.notes}</p> : null}
                <details className="pt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-[#32634f] underline">
                    Modifier
                  </summary>
                  <RunSessionEditForm session={session} goals={goals} />
                </details>
                <form action={deleteRunSessionAction} className="pt-2">
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
