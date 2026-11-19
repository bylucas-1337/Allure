import type { Metadata } from "next";
import { Suspense } from "react";
import { getStatsData } from "@/lib/stats-data";
import { SectionCard, cardClass, formatDistance, formatDuration } from "@/components/settings/settings-ui";

export const metadata: Metadata = {
  title: "Stats",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  easy: "Facile",
  threshold: "Seuil",
  intervals: "Fractionné",
  long: "Sortie longue",
  race: "Course",
  recovery: "Récupération",
  other: "Autre",
};

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function WeeklyChart({ buckets }: { buckets: { weekStart: string; label: string; runDistanceM: number; runCount: number; strengthCount: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.runDistanceM));
  const width = 100;
  const height = 120;
  const barWidth = width / buckets.length - 2;
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="h-40 w-full" role="img" aria-label="Distance course par semaine">
        {buckets.map((b, i) => {
          const h = (b.runDistanceM / max) * height;
          const x = i * (width / buckets.length) + 1;
          const y = height - h;
          return (
            <g key={b.weekStart}>
              <rect x={x} y={y} width={barWidth} height={h} rx={1} className="fill-[#6f9c7d]" />
              {b.runDistanceM > 0 ? (
                <text x={x + barWidth / 2} y={y - 2} textAnchor="middle" className="fill-[#34493e] text-[7px]">
                  {Math.round(b.runDistanceM / 1000)}
                </text>
              ) : null}
              <text x={x + barWidth / 2} y={height + 12} textAnchor="middle" className="fill-[#8a9088] text-[7px]">
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-[#8a9088]">Distance course (km) par semaine, 8 dernières semaines.</p>
    </div>
  );
}

function E1rmChart({ items }: { items: { name: string; e1rm: number }[] }) {
  const top = items.slice(0, 6);
  const max = Math.max(1, ...top.map((i) => i.e1rm));
  const width = 100;
  const rowHeight = 18;
  const height = top.length * rowHeight;
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Meilleur e1RM par exercice">
        {top.map((item, i) => {
          const w = (item.e1rm / max) * (width - 30);
          const y = i * rowHeight + 4;
          return (
            <g key={item.name}>
              <text x={0} y={y + 9} className="fill-[#34493e] text-[8px]">
                {item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name}
              </text>
              <rect x={30} y={y} width={w} height={12} rx={2} className="fill-[#d2ef9c]" />
              <text x={32 + w} y={y + 9} className="fill-[#34493e] text-[8px]">
                {item.e1rm} kg
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

async function StatsContent() {
  const data = await getStatsData();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Analyse</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f] sm:text-4xl">
          Statistiques
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#747a72]">
          Calculées depuis tes séances réelles. Aucune estimation inventée : les allures et l&apos;e1RM sont des moyennes et des estimations par formule (Epley).
        </p>
      </header>

      {/* Résumé */}
      <section className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">En un coup d&apos;œil</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[#8a9088]">Séances course</dt>
            <dd className="text-lg font-semibold text-[#23372f]">{data.totalRuns}</dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Séances muscu</dt>
            <dd className="text-lg font-semibold text-[#23372f]">{data.totalStrength}</dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Distance totale</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.totalDistanceM > 0 ? formatDistance(data.totalDistanceM) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Temps total</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.totalDurationSec > 0 ? formatHours(data.totalDurationSec) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Allure moyenne</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.avgPaceSec ? `${formatDuration(data.avgPaceSec)} /km` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Meilleur e1RM</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.bestE1rm ? `${data.bestE1rm} kg` : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Graphique hebdo */}
      <SectionCard
        id="hebdo"
        eyebrow="Volume"
        title="Distance course par semaine"
        description="8 dernières semaines, en kilomètres."
      >
        {data.weekly.some((b) => b.runDistanceM > 0) ? (
          <WeeklyChart buckets={data.weekly} />
        ) : (
          <p className="text-sm text-[#8a9088]">Pas encore de données.</p>
        )}
      </SectionCard>

      {/* Allures par type */}
      <SectionCard
        id="allures"
        eyebrow="Course"
        title="Allures par type de séance"
        description="Moyenne des allures enregistrées."
      >
        {data.runByType.length > 0 ? (
          <ul className="space-y-2">
            {data.runByType.map((item) => (
              <li key={item.type} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[#23372f]">
                  {SESSION_TYPE_LABELS[item.type] ?? item.type}
                  <span className="ml-2 text-xs font-normal text-[#8a9088]">
                    {item.count} séance{item.count > 1 ? "s" : ""}
                    {item.totalDistanceM > 0 ? ` · ${formatDistance(item.totalDistanceM)}` : ""}
                  </span>
                </span>
                <span className="text-sm text-[#747a72]">
                  {item.avgPaceSec ? `${formatDuration(item.avgPaceSec)} /km` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#8a9088]">Pas encore de séances de course.</p>
        )}
      </SectionCard>

      {/* Force */}
      <SectionCard
        id="force"
        eyebrow="Musculation"
        title="Meilleur e1RM par exercice"
        description="Estimation par formule d'Epley à partir de ta meilleure série. Le nom de l'exercice est celui saisi."
      >
        {data.exerciseBests.length > 0 ? (
          <>
            <E1rmChart items={data.exerciseBests} />
            <ul className="mt-4 space-y-1 text-sm">
              {data.exerciseBests.map((item) => (
                <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-[#23372f]">{item.name}</span>
                  <span className="text-xs text-[#8a9088]">
                    {item.e1rm} kg (depuis {item.weightKg} kg × {item.reps}) · {item.date}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-[#8a9088]">Pas encore d&apos;exercices détaillés.</p>
        )}
      </SectionCard>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <StatsContent />
    </Suspense>
  );
}