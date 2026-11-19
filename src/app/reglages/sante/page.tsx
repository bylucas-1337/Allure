import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettingsData } from "@/lib/settings-data";
import { INJURY_STATUSES } from "@/lib/settings";
import { deleteInjuryAction } from "@/app/actions/settings";
import { InjuryForm } from "@/components/settings/injury-form";
import { SchemaWarning } from "@/components/settings/schema-warning";
import {
  SectionCard,
  dangerButtonClass,
  formatDate,
} from "@/components/settings/settings-ui";

export const metadata: Metadata = { title: "Santé · Réglages" };

function injuryStatusLabel(value: string) {
  return INJURY_STATUSES.find((item) => item.value === value)?.label ?? value;
}

async function Content() {
  const data = await getSettingsData();
  return (
    <>
      {data.schemaOutdated ? <SchemaWarning /> : null}
      <SectionCard
        id="sante"
        eyebrow="Ce qui te freine"
        title="Zones sensibles"
        description="Une gêne déclarée évite de te proposer exactement ce qui fait mal."
      >
        {data.injuries.length > 0 ? (
          <ul className="space-y-3">
            {data.injuries.map((injury) => (
              <li key={injury.id} className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-semibold text-[#23372f]">{injury.label}</p>
                  {injury.bodyArea ? (
                    <span className="text-xs text-[#8a9088]">{injury.bodyArea}</span>
                  ) : null}
                  <span className="rounded-full bg-[#f3f1ec] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a8378]">
                    {injuryStatusLabel(injury.status)}
                  </span>
                  {injury.startedOn ? (
                    <span className="text-xs text-[#8a9088]">depuis {formatDate(injury.startedOn)}</span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <details className="w-full">
                    <summary className="cursor-pointer text-xs font-semibold text-[#32634f]">
                      Modifier
                    </summary>
                    <div className="mt-3">
                      <InjuryForm injury={injury} compact />
                    </div>
                  </details>
                  <form action={deleteInjuryAction}>
                    <input type="hidden" name="id" value={injury.id} />
                    <button type="submit" className={dangerButtonClass}>
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#8a9088]">Aucune gêne déclarée.</p>
        )}

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#32634f]">
            + Ajouter une gêne
          </summary>
          <div className="mt-4">
            <InjuryForm />
          </div>
        </details>
      </SectionCard>
    </>
  );
}

export default function SantePage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />}>
      <Content />
    </Suspense>
  );
}
