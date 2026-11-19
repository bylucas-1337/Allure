import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { SchemaWarning } from "@/components/settings/schema-warning";
import { ProfileForm } from "@/components/settings/profile-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Profil · Réglages" };

async function Content() {
  const data = await getSettingsData();
  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="profil"
        eyebrow="Qui tu es"
        title="Profil"
        description="Taille, poids de forme et repères de base. La taille reste la seule mesure vraiment nécessaire."
      >
        <ProfileForm profile={data.profile} />
      </SectionCard>
    </>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
