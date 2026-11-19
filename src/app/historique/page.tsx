import type { Metadata } from "next";
import { Suspense } from "react";
import { getRunSessionsData } from "@/lib/run-sessions-data";
import { getStrengthSessionsData } from "@/lib/strength-sessions-data";
import { RunSessionList } from "@/components/run/session-form";
import { StrengthSessionList } from "@/components/strength/session-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = {
  title: "Historique",
};

async function HistoriqueContent() {
  const [runData, strengthData] = await Promise.all([
    getRunSessionsData(),
    getStrengthSessionsData(),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Journal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">
          Historique des séances
        </h1>
      </header>
      <SectionCard
        id="course"
        eyebrow="Course"
        title="Séances de course"
        description="Les plus récentes en premier."
      >
        <RunSessionList sessions={runData.sessions} goals={runData.goals} />
      </SectionCard>
      <SectionCard
        id="muscu"
        eyebrow="Musculation"
        title="Séances de musculation"
        description="Les plus récentes en premier."
      >
        <StrengthSessionList sessions={strengthData.sessions} />
      </SectionCard>
    </div>
  );
}

export default function HistoriquePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <HistoriqueContent />
    </Suspense>
  );
}
