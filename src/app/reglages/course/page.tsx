import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { RunForm } from "@/components/settings/run-form";
import { SchemaWarning } from "@/components/settings/schema-warning";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Course · Réglages" };

async function Content() {
  const data = await getSettingsData();
  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="course"
        eyebrow="Comment tu cours"
        title="Repères de course"
        description="Expérience, volume, allures et records. Ces repères servent au programme de course."
      >
        <RunForm profile={data.profile} />
      </SectionCard>
    </>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
