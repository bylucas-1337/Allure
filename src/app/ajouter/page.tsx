import type { Metadata } from "next";
import { Suspense } from "react";
import { getRunSessionsData } from "@/lib/run-sessions-data";
import { RunSessionForm } from "@/components/run/session-form";
import { StrengthSessionForm } from "@/components/strength/session-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = {
  title: "Ajouter une séance",
};

async function AjouterContent() {
  const runData = await getRunSessionsData();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Journal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">
          Ajouter une séance
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#747a72]">
          Saisie manuelle. La synchronisation Strava viendra dans une prochaine version.
        </p>
      </header>

      <SectionCard
        id="course"
        eyebrow="Course"
        title="Nouvelle séance de course"
        description="Durée et distance suffisent ; l'allure moyenne est calculée."
      >
        <RunSessionForm goals={runData.goals} />
      </SectionCard>

      <SectionCard
        id="muscu"
        eyebrow="Musculation"
        title="Nouvelle séance de musculation"
        description="Détaille les exercices et les séries si tu le souhaites."
      >
        <StrengthSessionForm />
      </SectionCard>
    </div>
  );
}

export default function AjouterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <AjouterContent />
    </Suspense>
  );
}
