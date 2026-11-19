import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { SchemaWarning } from "@/components/settings/schema-warning";
import { SectionCard, cardClass } from "@/components/settings/settings-ui";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Réglages",
};

const CARDS = [
  { href: "/reglages/profil", title: "Profil", description: "Taille, date de naissance, FC de repos." },
  { href: "/reglages/course", title: "Course", description: "Expérience, volume, allures, records." },
  { href: "/reglages/muscu", title: "Musculation", description: "Intention, groupes, matériel, durée." },
  { href: "/reglages/poids", title: "Poids", description: "Historique des pesées." },
  { href: "/reglages/sante", title: "Santé", description: "Zones sensibles et blessures." },
  { href: "/reglages/objectifs", title: "Objectifs", description: "Course principale et secondaires." },
  { href: "/reglages/donnees", title: "Données", description: "Réinitialiser l’onboarding." },
];

async function SettingsContent() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Ton espace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f] sm:text-4xl">
          Réglages
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#747a72]">
          Tout ce que tu as indiqué à l’inscription se retrouve ici, par section, et se modifie
          à tout moment.
        </p>
      </header>

      {data.schemaOutdated ? <SchemaWarning /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`${cardClass} block transition hover:border-[#b8d5b9]`}
          >
            <p className="text-base font-semibold text-[#23372f]">{card.title}</p>
            <p className="mt-1 text-sm leading-6 text-[#747a72]">{card.description}</p>
          </Link>
        ))}
      </div>

      <SectionCard
        id="resume"
        eyebrow="En un coup d’œil"
        title="Tes repères actuels"
        description="Lecture rapide de ce qui est déjà renseigné."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#8a9088]">Taille</dt>
            <dd className="font-semibold text-[#23372f]">
              {data.profile.heightCm === "" ? "—" : `${data.profile.heightCm} cm`}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Poids actuel</dt>
            <dd className="font-semibold text-[#23372f]">
              {data.weights[0]
                ? `${data.weights[0].weightKg.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kg`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Séances course / semaine</dt>
            <dd className="font-semibold text-[#23372f]">
              {data.profile.runSessionsPerWeek === "" ? "—" : data.profile.runSessionsPerWeek}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Séances muscu / semaine</dt>
            <dd className="font-semibold text-[#23372f]">
              {data.profile.strengthSessionsPerWeek === "" ? "—" : data.profile.strengthSessionsPerWeek}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Objectifs actifs</dt>
            <dd className="font-semibold text-[#23372f]">
              {data.goals.filter((goal) => goal.status === "active").length}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Zones sensibles</dt>
            <dd className="font-semibold text-[#23372f]">{data.injuries.length}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}

export default function ReglagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
