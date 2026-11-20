import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetOnboardingForm } from "@/components/settings/reset-onboarding-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Données · Réglages" };

const CSV_EXPORTS = [
  { dataset: "runs", label: "Séances de course" },
  { dataset: "strength", label: "Séances de musculation" },
  { dataset: "weights", label: "Pesées" },
  { dataset: "checkins", label: "Check-ins quotidiens" },
] as const;

async function Content() {
  return (
    <div className="space-y-6">
      <SectionCard
        id="export"
        eyebrow="Tes données"
        title="Exporter mes données"
        description="Télécharge l'ensemble de ton profil, de tes séances et de tes objectifs au format JSON, ou un jeu de données précis en CSV pour un tableur."
      >
        <a href="/api/export" className="inline-flex items-center rounded-xl bg-[#6f9c7d] px-4 py-2 text-sm font-semibold text-white">
          Télécharger l&apos;export JSON
        </a>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {CSV_EXPORTS.map((item) => (
            <a
              key={item.dataset}
              href={`/api/export/csv?dataset=${item.dataset}`}
              className="inline-flex min-h-11 items-center justify-between rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm font-semibold text-[#32634f] transition hover:bg-[#f4f6f1]"
            >
              {item.label}
              <span aria-hidden="true">CSV</span>
            </a>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="import"
        eyebrow="Tes données"
        title="Importer une activité"
        description="Ajoute une séance de course depuis un export FIT ou GPX."
      >
        <Link
          href="/importer"
          className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f] transition hover:bg-[#f4f6f1]"
        >
          Ouvrir l&apos;import FIT/GPX
        </Link>
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
