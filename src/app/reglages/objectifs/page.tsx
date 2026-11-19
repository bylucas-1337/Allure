import type { Metadata } from "next";
import { Suspense } from "react";
import {
  deleteGoalAction,
  setGoalStatusAction,
} from "@/app/actions/settings";
import { GoalForm } from "@/components/settings/goal-form";
import { getSettingsData, type GoalView } from "@/lib/settings-data";
import {
  SectionCard,
  dangerButtonClass,
  formatDate,
  formatDistance,
  formatDuration,
  subtleButtonClass,
} from "@/components/settings/settings-ui";
import { SchemaWarning } from "@/components/settings/schema-warning";

export const metadata: Metadata = { title: "Objectifs · Réglages" };

const STATUS_LABELS: Record<string, string> = {
  active: "En cours",
  achieved: "Atteint",
  abandoned: "Abandonné",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-[#eaf2df] text-[#32634f]",
  achieved: "bg-[#e6eefc] text-[#31497a]",
  abandoned: "bg-[#f3f1ec] text-[#8a8378]",
};

function GoalSummary({ goal }: { goal: GoalView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5d675c]">
      <span className="font-semibold text-[#23372f]">
        {goal.raceName === "" ? "Course sans nom" : goal.raceName}
      </span>
      <span>{formatDistance(goal.distanceM)}</span>
      <span>{goal.raceDate === "" ? "date libre" : formatDate(goal.raceDate)}</span>
      {goal.targetTimeSec ? <span>{formatDuration(goal.targetTimeSec)}</span> : null}
      <span
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${
          STATUS_STYLES[goal.status] ?? STATUS_STYLES.abandoned
        }`}
      >
        {STATUS_LABELS[goal.status] ?? goal.status}
      </span>
    </div>
  );
}

function GoalActions({ goal }: { goal: GoalView }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {goal.status !== "active" ? (
        <form action={setGoalStatusAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="status" value="active" />
          <button type="submit" className={subtleButtonClass}>
            Réactiver
          </button>
        </form>
      ) : (
        <form action={setGoalStatusAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="status" value="achieved" />
          <button type="submit" className={subtleButtonClass}>
            Marquer atteint
          </button>
        </form>
      )}

      {goal.status === "active" ? (
        <form action={setGoalStatusAction}>
          <input type="hidden" name="id" value={goal.id} />
          <input type="hidden" name="status" value="abandoned" />
          <button type="submit" className={dangerButtonClass}>
            Abandonner
          </button>
        </form>
      ) : null}

      {goal.raceDate ? (
        <a
          href={`/api/goals/${goal.id}/ics`}
          className={subtleButtonClass}
        >
          Exporter .ics
        </a>
      ) : null}

      <form action={deleteGoalAction}>
        <input type="hidden" name="id" value={goal.id} />
        <button type="submit" className={dangerButtonClass}>
          Supprimer
        </button>
      </form>
    </div>
  );
}

function GoalEditor({ goal, kind }: { goal?: GoalView; kind: "main" | "secondary" }) {
  return (
    <details className="mt-3 rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[#32634f]">
        {goal ? "Modifier cette course" : "Renseigner la course"}
      </summary>
      <div className="mt-4">
        <GoalForm goal={goal} kind={kind} compact={Boolean(goal)} />
      </div>
    </details>
  );
}

async function Content() {
  const data = await getSettingsData();
  const mainGoal = data.goals.find((goal) => goal.kind === "main" && goal.status === "active") ?? null;
  const secondaryGoals = data.goals.filter(
    (goal) => goal.kind === "secondary" && goal.status === "active",
  );
  const pastGoals = data.goals.filter((goal) => goal.status !== "active");

  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="objectifs"
        eyebrow="Où tu veux aller"
        title="Objectifs"
        description="Un objectif principal structure le programme ; les courses secondaires s’y ajoutent sans le remplacer."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#e8e9e1] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81877f]">
              Objectif principal
            </p>
            {mainGoal ? (
              <div className="mt-2">
                <GoalSummary goal={mainGoal} />
                {mainGoal.note ? (
                  <p className="mt-2 text-sm leading-6 text-[#747a72]">{mainGoal.note}</p>
                ) : null}
                <GoalEditor goal={mainGoal} kind="main" />
                <GoalActions goal={mainGoal} />
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm leading-6 text-[#747a72]">
                  Aucun objectif principal actif. C’est le moment d’en poser un.
                </p>
                <GoalEditor kind="main" />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#e8e9e1] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81877f]">
              Courses secondaires
            </p>
            {secondaryGoals.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {secondaryGoals.map((goal) => (
                  <li key={goal.id} className="rounded-xl bg-[#fbfcfa] p-3">
                    <GoalSummary goal={goal} />
                    {goal.note ? (
                      <p className="mt-2 text-sm leading-6 text-[#747a72]">{goal.note}</p>
                    ) : null}
                    <GoalEditor goal={goal} kind="secondary" />
                    <GoalActions goal={goal} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#747a72]">
                Aucune course secondaire. Une 10 km au milieu d’une préparation semi se
                déclare ici.
              </p>
            )}
            <GoalEditor kind="secondary" />
          </div>

          {pastGoals.length > 0 ? (
            <div className="rounded-2xl border border-[#e8e9e1] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81877f]">
                Historique
              </p>
              <ul className="mt-2 space-y-3">
                {pastGoals.map((goal) => (
                  <li key={goal.id} className="rounded-xl bg-[#fbfcfa] p-3">
                    <GoalSummary goal={goal} />
                    <GoalActions goal={goal} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </>
  );
}

export default function ObjectifsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
