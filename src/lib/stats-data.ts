import "server-only";

import { RECORD_TARGETS } from "@/lib/import/activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StatsPeriod = "30" | "90" | "365" | "all";

export const STATS_PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "365", label: "1 an" },
  { value: "all", label: "Tout" },
];

export type WeeklyBucket = {
  weekStart: string;
  label: string;
  runDistanceM: number;
  strengthCount: number;
  runCount: number;
};

export type ExerciseBest = {
  name: string;
  e1rm: number;
  reps: number;
  weightKg: number;
  date: string;
};

export type RunTypeStat = {
  type: string;
  count: number;
  avgPaceSec: number | null;
  totalDistanceM: number;
};

export type RecordEffort = {
  distanceM: number;
  label: string;
  timeSec: number;
  date: string;
  estimated: boolean;
};

export type ExerciseProgression = {
  name: string;
  first: number;
  last: number;
  points: { month: string; label: string; e1rm: number }[];
};

export type MuscleVolume = {
  group: string;
  sets: number;
  volumeKg: number;
};

export type HrZoneStat = {
  key: "below" | "z1" | "z2" | "z3" | "z4" | "z5" | "above";
  label: string;
  seconds: number;
  percent: number;
};

export type PeriodComparison = {
  currentRuns: number;
  previousRuns: number;
  currentDistanceM: number;
  previousDistanceM: number;
  currentStrength: number;
  previousStrength: number;
};

export type StatsData = {
  period: StatsPeriod;
  periodLabel: string;
  migrationMissing: boolean;
  totalRuns: number;
  totalStrength: number;
  importedRuns: number;
  totalDistanceM: number;
  totalDurationSec: number;
  avgPaceSec: number | null;
  weekly: WeeklyBucket[];
  runByType: RunTypeStat[];
  exerciseBests: ExerciseBest[];
  bestE1rm: number | null;
  records: RecordEffort[];
  strengthProgressions: ExerciseProgression[];
  muscleVolume: MuscleVolume[];
  hrZones: HrZoneStat[];
  comparison: PeriodComparison;
};

type RunRow = {
  session_date: string;
  session_type: string;
  duration_min: number;
  duration_sec: number | null;
  distance_m: number | null;
  avg_pace_sec: number | null;
  source: string | null;
  best_efforts: unknown;
  hr_zones: unknown;
};

type StrengthRow = {
  session_date: string;
  duration_min: number;
  duration_sec: number | null;
  exercises: unknown;
};

type StrengthSet = { reps?: string; weightKg?: string };
type StrengthExercise = { name?: string; sets?: StrengthSet[] };

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  "30": "30 derniers jours",
  "90": "90 derniers jours",
  "365": "12 derniers mois",
  all: "depuis le début",
};

const HR_ZONE_LABELS: { key: HrZoneStat["key"]; label: string }[] = [
  { key: "below", label: "Sous Z1 (< 50 %)" },
  { key: "z1", label: "Z1 · 50–60 %" },
  { key: "z2", label: "Z2 · 60–70 %" },
  { key: "z3", label: "Z3 · 70–80 %" },
  { key: "z4", label: "Z4 · 80–90 %" },
  { key: "z5", label: "Z5 · 90–100 %" },
  { key: "above", label: "Au-dessus de la FC max" },
];

const MONTH_LABELS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startDateForPeriod(period: StatsPeriod): string | null {
  if (period === "all") {
    return null;
  }
  const days = Number(period);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return isoDate(start);
}

function epley(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

function parseExercises(value: unknown): StrengthExercise[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      name: typeof item.name === "string" ? item.name : "",
      sets: Array.isArray(item.sets)
        ? item.sets
            .filter((set): set is Record<string, unknown> => typeof set === "object" && set !== null)
            .map((set) => ({
              reps: typeof set.reps === "string" ? set.reps : String(set.reps ?? ""),
              weightKg:
                typeof set.weightKg === "string" ? set.weightKg : String(set.weightKg ?? ""),
            }))
        : [],
    }));
}

function readNumberMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const number = Number(raw);
    if (Number.isFinite(number) && number > 0) {
      result[key] = number;
    }
  }
  return result;
}

function emptyStats(period: StatsPeriod, migrationMissing = false): StatsData {
  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    migrationMissing,
    totalRuns: 0,
    totalStrength: 0,
    importedRuns: 0,
    totalDistanceM: 0,
    totalDurationSec: 0,
    avgPaceSec: null,
    weekly: [],
    runByType: [],
    exerciseBests: [],
    bestE1rm: null,
    records: [],
    strengthProgressions: [],
    muscleVolume: [],
    hrZones: [],
    comparison: {
      currentRuns: 0,
      previousRuns: 0,
      currentDistanceM: 0,
      previousDistanceM: 0,
      currentStrength: 0,
      previousStrength: 0,
    },
  };
}

export async function getStatsData(period: StatsPeriod = "all"): Promise<StatsData> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return emptyStats(period);
  }
  const userId = userData.user.id;

  let migrationMissing = false;

  const enrichedRuns = await supabase
    .from("run_sessions")
    .select(
      "session_date, session_type, duration_min, duration_sec, distance_m, avg_pace_sec, source, best_efforts, hr_zones",
    )
    .eq("user_id", userId)
    .order("session_date", { ascending: true })
    .returns<RunRow[]>();

  let runRows = enrichedRuns.data ?? [];
  if (enrichedRuns.error) {
    migrationMissing = true;
    const baseRuns = await supabase
      .from("run_sessions")
      .select(
        "session_date, session_type, duration_min, duration_sec, distance_m, avg_pace_sec",
      )
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .returns<Omit<RunRow, "source" | "best_efforts" | "hr_zones">[]>();
    runRows = (baseRuns.data ?? []).map((row) => ({
      ...row,
      source: "manual",
      best_efforts: {},
      hr_zones: {},
    }));
  }

  const [strengthsResult, exercisesResult] = await Promise.all([
    supabase
      .from("strength_sessions")
      .select("session_date, duration_min, duration_sec, exercises")
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .returns<StrengthRow[]>(),
    supabase.from("exercises").select("name, muscle_group").returns<
      { name: string; muscle_group: string | null }[]
    >(),
  ]);

  const allRuns = runRows;
  const allStrengths = strengthsResult.data ?? [];
  const startDate = startDateForPeriod(period);

  const runs = startDate
    ? allRuns.filter((run) => run.session_date >= startDate)
    : allRuns;
  const strengths = startDate
    ? allStrengths.filter((strength) => strength.session_date >= startDate)
    : allStrengths;

  // ---------------------------------------------------------------------
  // Semaines et totaux
  // ---------------------------------------------------------------------
  const now = new Date();
  const currentMonday = mondayOf(now);
  const buckets: WeeklyBucket[] = [];
  for (let index = 7; index >= 0; index -= 1) {
    const monday = new Date(currentMonday);
    monday.setDate(currentMonday.getDate() - index * 7);
    buckets.push({
      weekStart: isoDate(monday),
      label: `${monday.getDate()}/${monday.getMonth() + 1}`,
      runDistanceM: 0,
      strengthCount: 0,
      runCount: 0,
    });
  }
  const bucketByStart = new Map(buckets.map((bucket) => [bucket.weekStart, bucket]));

  let totalDistanceM = 0;
  let totalDurationSec = 0;
  const paceSamples: number[] = [];
  const byType = new Map<
    string,
    { count: number; distanceM: number; paceSum: number; paceN: number }
  >();

  for (const run of runs) {
    const duration = run.duration_min * 60 + (run.duration_sec ?? 0);
    totalDurationSec += duration;
    if (run.distance_m) {
      totalDistanceM += run.distance_m;
      if (run.avg_pace_sec) {
        paceSamples.push(run.avg_pace_sec);
      }
    }

    const bucket = bucketByStart.get(
      isoDate(mondayOf(new Date(`${run.session_date}T00:00:00`))),
    );
    if (bucket) {
      bucket.runCount += 1;
      bucket.runDistanceM += run.distance_m ?? 0;
    }

    const entry = byType.get(run.session_type) ?? {
      count: 0,
      distanceM: 0,
      paceSum: 0,
      paceN: 0,
    };
    entry.count += 1;
    entry.distanceM += run.distance_m ?? 0;
    if (run.avg_pace_sec) {
      entry.paceSum += run.avg_pace_sec;
      entry.paceN += 1;
    }
    byType.set(run.session_type, entry);
  }

  for (const strength of strengths) {
    totalDurationSec += strength.duration_min * 60 + (strength.duration_sec ?? 0);
    const bucket = bucketByStart.get(
      isoDate(mondayOf(new Date(`${strength.session_date}T00:00:00`))),
    );
    if (bucket) {
      bucket.strengthCount += 1;
    }
  }

  const runByType: RunTypeStat[] = Array.from(byType.entries()).map(([type, value]) => ({
    type,
    count: value.count,
    avgPaceSec: value.paceN > 0 ? Math.round(value.paceSum / value.paceN) : null,
    totalDistanceM: value.distanceM,
  }));

  const avgPaceSec =
    paceSamples.length > 0
      ? Math.round(paceSamples.reduce((sum, value) => sum + value, 0) / paceSamples.length)
      : null;

  // ---------------------------------------------------------------------
  // e1RM : meilleur par exercice et progression mensuelle
  // ---------------------------------------------------------------------
  const bestByName = new Map<string, ExerciseBest>();
  const monthlyByName = new Map<string, Map<string, number>>();

  for (const strength of strengths) {
    const exercises = parseExercises(strength.exercises);
    for (const exercise of exercises) {
      const name = (exercise.name ?? "").trim();
      if (!name) continue;

      for (const set of exercise.sets ?? []) {
        const reps = Number(set.reps);
        const weight = Number(String(set.weightKg ?? "").replace(",", "."));
        if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) {
          continue;
        }
        const value = epley(weight, reps);
        const current = bestByName.get(name);
        if (!current || value > current.e1rm) {
          bestByName.set(name, {
            name,
            e1rm: Math.round(value * 10) / 10,
            reps,
            weightKg: weight,
            date: strength.session_date,
          });
        }

        const month = strength.session_date.slice(0, 7);
        const monthly = monthlyByName.get(name) ?? new Map<string, number>();
        const bestOfMonth = monthly.get(month) ?? 0;
        if (value > bestOfMonth) {
          monthly.set(month, value);
        }
        monthlyByName.set(name, monthly);
      }
    }
  }

  const exerciseBests = Array.from(bestByName.values()).sort((a, b) => b.e1rm - a.e1rm);
  const bestE1rm = exerciseBests.length > 0 ? exerciseBests[0].e1rm : null;

  const monthKeys: { key: string; label: string }[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    monthKeys.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[date.getMonth()] ?? "",
    });
  }

  const topNames = exerciseBests.slice(0, 4).map((item) => item.name);
  const strengthProgressions: ExerciseProgression[] = topNames
    .map((name) => {
      const monthly = monthlyByName.get(name) ?? new Map<string, number>();
      const points = monthKeys
        .filter((month) => monthly.has(month.key))
        .map((month) => ({
          month: month.key,
          label: month.label,
          e1rm: Math.round((monthly.get(month.key) ?? 0) * 10) / 10,
        }));
      const first = points[0]?.e1rm ?? 0;
      const last = points[points.length - 1]?.e1rm ?? 0;
      return { name, first, last, points };
    })
    .filter((progression) => progression.points.length > 0);

  // ---------------------------------------------------------------------
  // Volume par groupe musculaire
  // ---------------------------------------------------------------------
  const muscleGroupByName = new Map<string, string>();
  for (const exercise of exercisesResult.data ?? []) {
    if (exercise.name) {
      muscleGroupByName.set(exercise.name.toLowerCase(), exercise.muscle_group ?? "Non classé");
    }
  }

  const volumeByGroup = new Map<string, { sets: number; volumeKg: number }>();
  for (const strength of strengths) {
    for (const exercise of parseExercises(strength.exercises)) {
      const name = (exercise.name ?? "").trim();
      if (!name) continue;
      const group = muscleGroupByName.get(name.toLowerCase()) ?? "Non classé";
      const entry = volumeByGroup.get(group) ?? { sets: 0, volumeKg: 0 };
      for (const set of exercise.sets ?? []) {
        const reps = Number(set.reps);
        const weight = Number(String(set.weightKg ?? "").replace(",", "."));
        entry.sets += 1;
        if (Number.isFinite(reps) && Number.isFinite(weight) && reps > 0 && weight > 0) {
          entry.volumeKg += reps * weight;
        }
      }
      volumeByGroup.set(group, entry);
    }
  }

  const muscleVolume: MuscleVolume[] = Array.from(volumeByGroup.entries())
    .map(([group, value]) => ({
      group,
      sets: value.sets,
      volumeKg: Math.round(value.volumeKg),
    }))
    .sort((a, b) => b.sets - a.sets);

  // ---------------------------------------------------------------------
  // Records personnels
  // ---------------------------------------------------------------------
  const records: RecordEffort[] = [];
  for (const target of RECORD_TARGETS) {
    let best: RecordEffort | null = null;

    for (const run of runs) {
      const efforts = readNumberMap(run.best_efforts);
      const value = efforts[String(target.distanceM)];
      if (value && (!best || value < best.timeSec)) {
        best = {
          distanceM: target.distanceM,
          label: target.label,
          timeSec: Math.round(value),
          date: run.session_date,
          estimated: false,
        };
      }
    }

    if (!best) {
      for (const run of runs) {
        if (
          run.distance_m &&
          run.distance_m >= target.distanceM &&
          run.avg_pace_sec &&
          run.avg_pace_sec > 0
        ) {
          const estimate = Math.round(
            run.avg_pace_sec * (target.distanceM / 1000),
          );
          if (!best || estimate < best.timeSec) {
            best = {
              distanceM: target.distanceM,
              label: target.label,
              timeSec: estimate,
              date: run.session_date,
              estimated: true,
            };
          }
        }
      }
    }

    if (best) {
      records.push(best);
    }
  }

  // ---------------------------------------------------------------------
  // Zones de fréquence cardiaque
  // ---------------------------------------------------------------------
  const zoneTotals: Record<HrZoneStat["key"], number> = {
    below: 0,
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
    above: 0,
  };
  for (const run of runs) {
    const zones = readNumberMap(run.hr_zones);
    for (const zone of HR_ZONE_LABELS) {
      zoneTotals[zone.key] += zones[zone.key] ?? 0;
    }
  }
  const totalZoneSeconds = Object.values(zoneTotals).reduce((sum, value) => sum + value, 0);
  const hrZones: HrZoneStat[] =
    totalZoneSeconds > 0
      ? HR_ZONE_LABELS.map((zone) => ({
          ...zone,
          seconds: Math.round(zoneTotals[zone.key]),
          percent: Math.round((zoneTotals[zone.key] / totalZoneSeconds) * 1000) / 10,
        })).filter((zone) => zone.seconds > 0)
      : [];

  // ---------------------------------------------------------------------
  // Comparaison 30 jours / 30 jours précédents
  // ---------------------------------------------------------------------
  const comparisonStartCurrent = new Date();
  comparisonStartCurrent.setHours(0, 0, 0, 0);
  comparisonStartCurrent.setDate(comparisonStartCurrent.getDate() - 29);
  const comparisonStartPrevious = new Date(comparisonStartCurrent);
  comparisonStartPrevious.setDate(comparisonStartPrevious.getDate() - 30);

  const currentIso = isoDate(comparisonStartCurrent);
  const previousIso = isoDate(comparisonStartPrevious);

  const comparison: PeriodComparison = {
    currentRuns: 0,
    previousRuns: 0,
    currentDistanceM: 0,
    previousDistanceM: 0,
    currentStrength: 0,
    previousStrength: 0,
  };

  for (const run of allRuns) {
    if (run.session_date >= currentIso) {
      comparison.currentRuns += 1;
      comparison.currentDistanceM += run.distance_m ?? 0;
    } else if (run.session_date >= previousIso) {
      comparison.previousRuns += 1;
      comparison.previousDistanceM += run.distance_m ?? 0;
    }
  }
  for (const strength of allStrengths) {
    if (strength.session_date >= currentIso) {
      comparison.currentStrength += 1;
    } else if (strength.session_date >= previousIso) {
      comparison.previousStrength += 1;
    }
  }

  return {
    period,
    periodLabel: PERIOD_LABELS[period],
    migrationMissing,
    totalRuns: runs.length,
    totalStrength: strengths.length,
    importedRuns: runs.filter((run) => run.source === "fit" || run.source === "gpx").length,
    totalDistanceM,
    totalDurationSec,
    avgPaceSec,
    weekly: buckets,
    runByType,
    exerciseBests,
    bestE1rm,
    records,
    strengthProgressions,
    muscleVolume,
    hrZones,
    comparison,
  };
}

export function normalizeStatsPeriod(value: string | string[] | undefined): StatsPeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "30" || raw === "90" || raw === "365") {
    return raw;
  }
  return "all";
}
