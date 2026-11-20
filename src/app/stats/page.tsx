import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  STATS_PERIODS,
  getStatsData,
  normalizeStatsPeriod,
  type StatsData,
  type StatsPeriod,
} from "@/lib/stats-data";
import {
  SectionCard,
  cardClass,
  formatDistance,
  formatDuration,
} from "@/components/settings/settings-ui";

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

const ZONE_COLORS: Record<string, string> = {
  below: "#cfd5c9",
  z1: "#a9cbb2",
  z2: "#6f9c7d",
  z3: "#d2ef9c",
  z4: "#f0c36b",
  z5: "#e58b62",
  above: "#a94327",
};

function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function deltaLabel(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "nouveau" : "—";
  }
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);
  return `${rounded > 0 ? "+" : ""}${rounded} %`;
}

function PeriodTabs({ current }: { current: StatsPeriod }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATS_PERIODS.map((period) => {
        const active = period.value === current;
        return (
          <Link
            key={period.value}
            href={period.value === "all" ? "/stats" : `/stats?period=${period.value}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-4 text-xs font-bold transition ${
              active
                ? "bg-[#245642] text-white"
                : "border border-[#dce2d7] bg-white text-[#52685c] hover:bg-[#f4f6f1]"
            }`}
          >
            {period.label}
          </Link>
        );
      })}
    </div>
  );
}

function WeeklyChart({ buckets }: { buckets: StatsData["weekly"] }) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.runDistanceM));
  const width = 100;
  const height = 120;
  const barWidth = width / buckets.length - 2;
  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${width} ${height + 20}`}
        className="h-40 w-full"
        role="img"
        aria-label="Distance course par semaine"
      >
        {buckets.map((bucket, index) => {
          const barHeight = (bucket.runDistanceM / max) * height;
          const x = index * (width / buckets.length) + 1;
          const y = height - barHeight;
          return (
            <g key={bucket.weekStart}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={1}
                className="fill-[#6f9c7d]"
              />
              {bucket.runDistanceM > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 2}
                  textAnchor="middle"
                  className="fill-[#34493e] text-[7px]"
                >
                  {Math.round(bucket.runDistanceM / 1000)}
                </text>
              ) : null}
              <text
                x={x + barWidth / 2}
                y={height + 12}
                textAnchor="middle"
                className="fill-[#8a9088] text-[7px]"
              >
                {bucket.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-[#8a9088]">
        Distance course (km) par semaine, 8 dernières semaines.
      </p>
    </div>
  );
}

function E1rmChart({ items }: { items: { name: string; e1rm: number }[] }) {
  const top = items.slice(0, 6);
  const max = Math.max(1, ...top.map((item) => item.e1rm));
  const width = 100;
  const rowHeight = 18;
  const height = top.length * rowHeight;
  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-40 w-full"
        role="img"
        aria-label="Meilleur e1RM par exercice"
      >
        {top.map((item, index) => {
          const barWidth = (item.e1rm / max) * (width - 30);
          const y = index * rowHeight + 4;
          return (
            <g key={item.name}>
              <text x={0} y={y + 9} className="fill-[#34493e] text-[8px]">
                {item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name}
              </text>
              <rect x={30} y={y} width={barWidth} height={12} rx={2} className="fill-[#d2ef9c]" />
              <text x={32 + barWidth} y={y + 9} className="fill-[#34493e] text-[8px]">
                {item.e1rm} kg
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HrZoneBars({ zones }: { zones: StatsData["hrZones"] }) {
  return (
    <div className="space-y-4">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#eef1e8]">
        {zones.map((zone) => (
          <span
            key={zone.key}
            style={{ width: `${zone.percent}%`, backgroundColor: ZONE_COLORS[zone.key] }}
            title={`${zone.label} · ${zone.percent} %`}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {zones.map((zone) => (
          <li
            key={zone.key}
            className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2 text-[#34493e]">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ZONE_COLORS[zone.key] }}
              />
              {zone.label}
            </span>
            <span className="text-xs text-[#8a9088]">
              {formatDuration(zone.seconds)} · {zone.percent} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MuscleVolumeBars({ items }: { items: StatsData["muscleVolume"] }) {
  const max = Math.max(1, ...items.map((item) => item.sets));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.group}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-[#23372f]">{item.group}</span>
            <span className="text-xs text-[#8a9088]">
              {item.sets} série{item.sets > 1 ? "s" : ""}
              {item.volumeKg > 0 ? ` · ${item.volumeKg.toLocaleString("fr-FR")} kg` : ""}
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#eef1e8]">
            <span
              className="block h-full rounded-full bg-[#6f9c7d]"
              style={{ width: `${Math.max(4, (item.sets / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProgressionSparkline({
  points,
}: {
  points: { label: string; e1rm: number }[];
}) {
  const values = points.map((point) => point.e1rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - 4 - ((point.e1rm - min) / range) * (height - 8);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-full"
      role="img"
      aria-label={`Progression : ${points.map((point) => `${point.label} ${point.e1rm} kg`).join(", ")}`}
    >
      {points.length > 1 ? (
        <polyline
          points={coordinates.join(" ")}
          fill="none"
          stroke="#6f9c7d"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {coordinates.map((coordinate, index) => {
        const [x, y] = coordinate.split(",").map(Number);
        return <circle key={points[index].label} cx={x} cy={y} r="2.2" fill="#245642" />;
      })}
    </svg>
  );
}

async function StatsContent({ period }: { period: StatsPeriod }) {
  const data = await getStatsData(period);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Analyse</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f] sm:text-4xl">
            Statistiques
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#747a72]">
            Calculées depuis tes séances réelles. Aucune estimation inventée : les allures et
            l&apos;e1RM sont des moyennes et des estimations par formule (Epley). Les records
            issus d&apos;un fichier FIT/GPX sont mesurés ; ceux déduits d&apos;une séance
            manuelle sont signalés.
          </p>
        </div>
        <PeriodTabs current={period} />
      </header>

      {data.migrationMissing ? (
        <p className="rounded-2xl border border-[#f0dfb7] bg-[#fdf7e8] px-4 py-3 text-sm leading-6 text-[#7a5a1d]">
          La migration V8 n&apos;est pas appliquée : les records, zones de FC et la provenance
          des séances ne sont pas encore disponibles. Colle
          <span className="mx-1 font-mono text-xs">supabase/migrations/20261120000000_v8_run_import.sql</span>
          dans le SQL Editor de Supabase.
        </p>
      ) : null}

      {data.totalRuns === 0 && data.totalStrength === 0 ? (
        <div className={cardClass}>
          <p className="text-sm leading-6 text-[#5d675c]">
            Aucune séance sur cette période. Ajoute une séance ou importe une activité pour
            commencer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/importer"
              className="inline-flex min-h-11 items-center rounded-xl bg-[#245642] px-4 text-sm font-bold text-white"
            >
              Importer FIT/GPX
            </Link>
            <Link
              href="/ajouter"
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Ajouter une séance
            </Link>
          </div>
        </div>
      ) : null}

      {/* Résumé */}
      <section className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">
          En un coup d&apos;œil · {data.periodLabel}
        </p>
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
          <div>
            <dt className="text-[#8a9088]">Séances importées</dt>
            <dd className="text-lg font-semibold text-[#23372f]">{data.importedRuns}</dd>
          </div>
        </dl>
      </section>

      {/* Comparaison */}
      <SectionCard
        id="comparaison"
        eyebrow="Tendance"
        title="30 jours contre les 30 jours précédents"
        description="Comparaison indépendante de la période choisie."
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-[#fbfcfa] p-3">
            <dt className="text-[#8a9088]">Séances course</dt>
            <dd className="mt-1 font-semibold text-[#23372f]">
              {data.comparison.currentRuns} <span className="text-xs font-normal text-[#8a9088]">vs {data.comparison.previousRuns}</span>
            </dd>
            <dd className="text-xs text-[#6f9c7d]">{deltaLabel(data.comparison.currentRuns, data.comparison.previousRuns)}</dd>
          </div>
          <div className="rounded-xl bg-[#fbfcfa] p-3">
            <dt className="text-[#8a9088]">Distance course</dt>
            <dd className="mt-1 font-semibold text-[#23372f]">
              {formatDistance(data.comparison.currentDistanceM)}{" "}
              <span className="text-xs font-normal text-[#8a9088]">
                vs {formatDistance(data.comparison.previousDistanceM)}
              </span>
            </dd>
            <dd className="text-xs text-[#6f9c7d]">{deltaLabel(data.comparison.currentDistanceM, data.comparison.previousDistanceM)}</dd>
          </div>
          <div className="rounded-xl bg-[#fbfcfa] p-3">
            <dt className="text-[#8a9088]">Séances muscu</dt>
            <dd className="mt-1 font-semibold text-[#23372f]">
              {data.comparison.currentStrength}{" "}
              <span className="text-xs font-normal text-[#8a9088]">vs {data.comparison.previousStrength}</span>
            </dd>
            <dd className="text-xs text-[#6f9c7d]">{deltaLabel(data.comparison.currentStrength, data.comparison.previousStrength)}</dd>
          </div>
        </dl>
      </SectionCard>

      {/* Records */}
      <SectionCard
        id="records"
        eyebrow="Course"
        title="Records personnels"
        description="Meilleur temps sur chaque distance. « Mesuré » vient des points du fichier importé ; « estimé » est déduit de l'allure moyenne d'une séance manuelle."
      >
        {data.records.length > 0 ? (
          <ul className="space-y-2">
            {data.records.map((record) => (
              <li
                key={record.distanceM}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#eef0e8] pb-2 last:border-0 last:pb-0"
              >
                <span className="text-sm font-semibold text-[#23372f]">{record.label}</span>
                <span className="text-sm text-[#34493e]">
                  {formatDuration(record.timeSec)}
                  <span className="ml-2 text-xs text-[#8a9088]">
                    {record.date} · {record.estimated ? "estimé" : "mesuré"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-[#8a9088]">
            Pas encore de record calculable. Importe un fichier FIT/GPX pour obtenir des
            records mesurés.
          </p>
        )}
      </SectionCard>

      {/* Zones FC */}
      <SectionCard
        id="zones"
        eyebrow="Course"
        title="Temps par zone de fréquence cardiaque"
        description="Calculé à l'import à partir de la FC max estimée par l'âge (220 − âge). C'est un repère indicatif, pas une mesure de laboratoire."
      >
        {data.hrZones.length > 0 ? (
          <HrZoneBars zones={data.hrZones} />
        ) : (
          <p className="text-sm leading-6 text-[#8a9088]">
            Pas encore de zones de FC. Il faut une date de naissance dans le profil et une
            séance importée avec une fréquence cardiaque.
          </p>
        )}
      </SectionCard>

      {/* Volume hebdo */}
      <SectionCard
        id="hebdo"
        eyebrow="Volume"
        title="Distance course par semaine"
        description="8 dernières semaines, en kilomètres."
      >
        {data.weekly.some((bucket) => bucket.runDistanceM > 0) ? (
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

      {/* Volume par groupe musculaire */}
      <SectionCard
        id="groupes"
        eyebrow="Musculation"
        title="Volume par groupe musculaire"
        description="Séries et tonnage calculés depuis les exercices saisis. Les exercices hors catalogue sont classés « Non classé »."
      >
        {data.muscleVolume.length > 0 ? (
          <MuscleVolumeBars items={data.muscleVolume} />
        ) : (
          <p className="text-sm text-[#8a9088]">Pas encore d&apos;exercices détaillés.</p>
        )}
      </SectionCard>

      {/* Progression muscu */}
      <SectionCard
        id="progression"
        eyebrow="Musculation"
        title="Progression mensuelle"
        description="Meilleur e1RM par mois pour les principaux exercices, sur les six derniers mois."
      >
        {data.strengthProgressions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.strengthProgressions.map((progression) => {
              const delta = Math.round((progression.last - progression.first) * 10) / 10;
              return (
                <div key={progression.name} className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#23372f]">{progression.name}</p>
                    <p className="text-xs text-[#8a9088]">
                      {progression.first} → {progression.last} kg
                      {delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
                    </p>
                  </div>
                  <ProgressionSparkline points={progression.points} />
                  <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#8a9088]">
                    {progression.points.map((point) => point.label).join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[#8a9088]">Pas encore assez de séances de musculation.</p>
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

async function StatsPageContent({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  const params = await searchParams;
  const period = normalizeStatsPeriod(params.period);
  return <StatsContent period={period} />;
}

export default function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <StatsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
