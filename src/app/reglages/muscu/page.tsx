import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { StrengthForm } from "@/components/settings/strength-form";
import { SchemaWarning } from "@/components/settings/schema-warning";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Musculation · Réglages" };

async function Content() {
  const data = await getSettingsData();
  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="muscu"
        eyebrow="Comment tu t’entraînes"
        title="Musculation"
        description="Intention, groupes musculaires, matériel et disponibilités. La durée est approximative."
      >
        <StrengthForm profile={data.profile} />
      </SectionCard>
    </>
  );
}

export default function MuscuPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
