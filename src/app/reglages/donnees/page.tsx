import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetOnboardingForm } from "@/components/settings/reset-onboarding-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Données · Réglages" };

async function Content() {
  return (
    <div className="space-y-6">
      <SectionCard
        id="export"
        eyebrow="Tes données"
        title="Exporter mes données"
        description="Télécharge l'ensemble de ton profil, de tes séances et de tes objectifs au format JSON."
      >
        <a href="/api/export" className="inline-flex items-center rounded-xl bg-[#6f9c7d] px-4 py-2 text-sm font-semibold text-white">
          Télécharger l&apos;export
        </a>
      </SectionCard>
      <SectionCard
        id="donnees"
        eyebrow="Tes données"
        title="Réinitialiser l’onboarding"
        description="Recommencer le parcours de profil si tu veux repartir de zéro."
      >
        <ResetOnboardingForm />
      </SectionCard>
    </div>
  );
}

export default function DonneesPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
