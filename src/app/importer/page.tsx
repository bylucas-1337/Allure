import type { Metadata } from "next";
import Link from "next/link";

import { ImportForm } from "@/components/import/import-form";
import { SectionCard } from "@/components/settings/settings-ui";

export const metadata: Metadata = {
  title: "Importer une activité",
};

export default function ImporterPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Journal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">
          Importer une activité
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#747a72]">
          Ajoute une séance de course depuis un export Coros. Allure lit le fichier sur le
          serveur, enregistre la séance et calcule les records, les zones de fréquence
          cardiaque et la charge utile aux statistiques. Le fichier d&apos;origine n&apos;est pas
          conservé.
        </p>
      </header>

      <SectionCard
        id="import"
        eyebrow="FIT / GPX"
        title="Déposer des fichiers"
        description="Formats acceptés : .fit et .gpx. Tu peux en sélectionner plusieurs à la fois."
      >
        <ImportForm />
      </SectionCard>

      <SectionCard
        id="coros"
        eyebrow="Depuis Coros"
        title="Récupérer un export"
        description="La procédure dépend de l'application et de la montre, mais elle reste proche de ceci."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[#5d675c]">
          <li>Ouvre l&apos;application Coros et ouvre l&apos;activité concernée.</li>
          <li>Cherche l&apos;action d&apos;export ou de partage du fichier d&apos;activité.</li>
          <li>Choisis le format FIT, ou GPX si le FIT n&apos;est pas proposé.</li>
          <li>Reviens ici, sélectionne le fichier, puis lance l&apos;import.</li>
        </ol>
        <p className="mt-4 text-xs leading-5 text-[#8a9088]">
          Une séance déjà présente (même fichier, ou même date avec une distance et une durée
          très proches) est ignorée par défaut. Tu peux forcer l&apos;import si tu veux vraiment
          créer un doublon.
        </p>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/historique"
          className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
        >
          Voir l&apos;historique
        </Link>
        <Link
          href="/stats"
          className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
        >
          Voir les statistiques
        </Link>
      </div>
    </div>
  );
}
