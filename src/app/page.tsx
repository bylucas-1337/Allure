import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getHomeData } from "@/lib/home-data";
import { RPE_LABELS } from "@/lib/settings";
import { CheckinForm } from "@/components/home/checkin-form";
import {
  SectionCard,
  cardClass,
  formatDate,
  formatDistance,
  formatDuration,
} from "@/components/settings/settings-ui";


export const metadata: Metadata = {
  title: "Accueil",
};


const DAY_LABELS: Record<string, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

function formatWeekDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

async function HomeContent() {
  await connection();
  const data = await getHomeData();

  const greeting = data.firstName ? `Bonjour ${data.firstName}` : "Bonjour";

  const todaySport = data.todayIsRunDay && data.todayIsStrengthDay
    ? "Course et musculation aujourd’hui"
    : data.todayIsRunDay
      ? "Jour de course"
      : data.todayIsStrengthDay
        ? "Jour de musculation"
        : "Jour de repos";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Aujourd’hui</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23372f] sm:text-4xl">
          {greeting}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#747a72]">{todaySport}</p>
      </header>

      {/* Résumé de la semaine */}
      <section className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Cette semaine</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[#8a9088]">Séances course</dt>
            <dd className="text-lg font-semibold text-[#23372f]">{data.weekRuns}</dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Séances muscu</dt>
            <dd className="text-lg font-semibold text-[#23372f]">{data.weekStrength}</dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Distance</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.weekDistanceM > 0
                ? `${(data.weekDistanceM / 1000).toFixed(1).replace(".", ",")} km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[#8a9088]">Temps total</dt>
            <dd className="text-lg font-semibold text-[#23372f]">
              {data.weekDurationSec > 0 ? formatWeekDuration(data.weekDurationSec) : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Prochaine séance prévue */}
      {data.nextPlannedSession ? (
        <SectionCard
          id="prochaine"
          eyebrow="À venir"
          title="Prochaine séance prévue"
          description={
            data.nextPlannedSession.origin === "engine"
              ? "Séance proposée par ton plan."
              : "Séance planifiée manuellement."
          }
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#23372f]">
              {data.nextPlannedSession.date} · {data.nextPlannedSession.sport}
              {data.nextPlannedSession.sessionType ? ` · ${data.nextPlannedSession.sessionType}` : ""}
            </p>
            <p className="text-xs text-[#8a9088]">
              {data.nextPlannedSession.durationMin ? `${data.nextPlannedSession.durationMin} min` : ""}
              {data.nextPlannedSession.briefText ? ` · ${data.nextPlannedSession.briefText}` : ""}
            </p>
          </div>
        </SectionCard>
      ) : null}
      <SectionCard
        id="derniere"
        eyebrow="Dernière séance"
        title="Ce que tu as fait"
        description="La plus récente, course ou musculation."
      >
        {data.lastRun || data.lastStrength ? (
          <div className="space-y-3">
            {data.lastRun && (!data.lastStrength || data.lastRun.sessionDate >= data.lastStrength.sessionDate) ? (
              <div>
                <p className="text-sm font-semibold text-[#23372f]">
                  Course · {data.lastRun.sessionType} · {data.lastRun.durationMin} min
                  {data.lastRun.durationSec > 0 ? ` ${data.lastRun.durationSec} s` : ""}
                  {data.lastRun.distanceM ? ` · ${formatDistance(data.lastRun.distanceM)}` : ""}
                </p>
                <p className="mt-1 text-xs text-[#8a9088]">
                  {formatDate(data.lastRun.sessionDate)}
                  {data.lastRun.avgPaceSec ? ` · allure ${formatDuration(data.lastRun.avgPaceSec)} /km` : ""}
                  {data.lastRun.rpe ? ` · ${RPE_LABELS[data.lastRun.rpe]}` : ""}
                </p>
                {data.lastRun.notes ? (
                  <p className="mt-2 text-sm leading-6 text-[#747a72]">{data.lastRun.notes}</p>
                ) : null}
              </div>
            ) : data.lastStrength ? (
              <div>
                <p className="text-sm font-semibold text-[#23372f]">
                  Musculation · {data.lastStrength.durationMin} min
                  {data.lastStrength.durationSec > 0 ? ` ${data.lastStrength.durationSec} s` : ""}
                </p>
                <p className="mt-1 text-xs text-[#8a9088]">
                  {formatDate(data.lastStrength.sessionDate)}
                  {data.lastStrength.rpe ? ` · ressenti ${data.lastStrength.rpe}/5` : ""}
                </p>
                {data.lastStrength.exercises.length > 0 ? (
                  <p className="mt-2 text-sm text-[#747a72]">
                    {data.lastStrength.exercises.map((e) => e.name).filter(Boolean).join(", ")}
                  </p>
                ) : null}
                {data.lastStrength.notes ? (
                  <p className="mt-2 text-sm leading-6 text-[#747a72]">{data.lastStrength.notes}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[#8a9088]">
            Aucune séance enregistrée. Commence par en ajouter une.
          </p>
        )}
      </SectionCard>

      {/* Objectifs actifs */}
      {data.activeGoals.length > 0 ? (
        <SectionCard
          id="objectifs"
          eyebrow="Où tu vas"
          title="Objectifs en cours"
          description="Ta course principale et les secondaires."
        >
          <ul className="space-y-2">
            {data.activeGoals.map((goal) => (
              <li key={goal.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[#23372f]">{goal.raceName}</span>
                <span className="text-xs text-[#8a9088]">
                  {goal.raceDate ? formatDate(goal.raceDate) : "date libre"}
                  {goal.raceDate
                    ? ` · ${Math.max(
                        0,
                        Math.ceil(
                          (new Date(goal.raceDate + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) /
                            86400000,
                        ),
                      )} j`
                    : ""}
                  {goal.distanceM ? ` · ${formatDistance(goal.distanceM)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {/* Check-in */}
      <SectionCard
        id="checkin"
        eyebrow="Comment tu te sens"
        title="Check-in du jour"
        description="Forme et fatigue, pour adapter la suite."
      >
        <CheckinForm todayIso={data.todayIso} existing={data.todayCheckin} />
      </SectionCard>

      {/* Tendance 7 jours */}
      {data.recentCheckins.length > 0 ? (
        <section className={cardClass}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Tendance 7 jours</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {data.recentCheckins.map((c) => (
              <li key={c.date} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[#747a72]">{c.date}</span>
                <span className="text-[#23372f]">
                  Forme {c.form ?? "—"} · Fatigue {c.fatigue ?? "—"}
                  {c.pain ? ` · ${c.pain}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Disponibilités */}
      <section className={cardClass}>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">Ta semaine type</p>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-[#23372f]">Course</p>
            <p className="mt-1 text-[#747a72]">
              {data.runDays.length === 0
                ? "Aucun jour"
                : data.runDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}
              {data.longRunDay ? ` · sortie longue le ${DAY_LABELS[data.longRunDay] ?? data.longRunDay}` : ""}
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#23372f]">Musculation</p>
            <p className="mt-1 text-[#747a72]">
              {data.strengthDays.length === 0
                ? "Aucun jour"
                : data.strengthDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[#eef1e8]" />
          <div className="h-64 animate-pulse rounded-[1.75rem] bg-white" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
