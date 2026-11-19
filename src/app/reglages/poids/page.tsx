import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { deleteWeightAction } from "@/app/actions/settings";
import { WeightForm } from "@/components/settings/weight-form";
import { SchemaWarning } from "@/components/settings/schema-warning";
import { SectionCard, dangerButtonClass, formatDate } from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Poids · Réglages" };

async function Content() {
  const data = await getSettingsData();
  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="poids"
        eyebrow="Ce que tu pèses"
        title="Historique du poids"
        description="Une pesée par jour au maximum. La plus récente est considérée comme ton poids actuel."
      >
        <WeightForm />
        {data.weights.length > 0 ? (
          <ul className="mt-6 divide-y divide-[#eef0e8] border-t border-[#eef0e8]">
            {data.weights.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#23372f]">
                    {entry.weightKg.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} kg
                  </p>
                  <p className="text-xs text-[#8a9088]">{formatDate(entry.measuredOn)}</p>
                </div>
                <form action={deleteWeightAction}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button type="submit" className={dangerButtonClass}>
                    Supprimer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[#8a9088]">Aucune pesée enregistrée pour le moment.</p>
        )}
      </SectionCard>
    </>
  );
}

export default function PoidsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
