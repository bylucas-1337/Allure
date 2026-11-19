import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WeeklyBucket = {
  weekStart: string; // ISO date (Monday)
  label: string; // short label for chart
  runDistanceM: number;
  strengthCount: number;
  runCount: number;
};

export type ExerciseBest = {
  name: string;
  e1rm: number; // kg
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

export type StatsData = {
  totalRuns: number;
  totalStrength: number;
  totalDistanceM: number;
  totalDurationSec: number;
  avgPaceSec: number | null;
  weekly: WeeklyBucket[];
  runByType: RunTypeStat[];
  exerciseBests: ExerciseBest[];
  bestE1rm: number | null;
};



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

function epley(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export async function getStatsData(): Promise<StatsData> {
  const empty: StatsData = {
    totalRuns: 0,
    totalStrength: 0,
    totalDistanceM: 0,
    totalDurationSec: 0,
    avgPaceSec: null,
    weekly: [],
    runByType: [],
    exerciseBests: [],
    bestE1rm: null,
  };

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return empty;
  const userId = userData.user.id;

  const [runsResult, strengthsResult] = await Promise.all([
    supabase
      .from("run_sessions")
      .select("session_date, session_type, duration_min, duration_sec, distance_m, avg_pace_sec")
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .returns<
        {
          session_date: string;
          session_type: string;
          duration_min: number;
          duration_sec: number | null;
          distance_m: number | null;
          avg_pace_sec: number | null;
        }[]
      >(),
    supabase
      .from("strength_sessions")
      .select("session_date, duration_min, duration_sec, exercises")
      .eq("user_id", userId)
      .order("session_date", { ascending: true })
      .returns<
        {
          session_date: string;
          duration_min: number;
          duration_sec: number | null;
          exercises: unknown;
        }[]
      >(),
  ]);

  const runs = runsResult.data ?? [];
  const strengths = strengthsResult.data ?? [];

  // Weekly buckets: last 8 weeks
  const now = new Date();
  const currentMonday = mondayOf(now);
  const buckets: WeeklyBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const m = new Date(currentMonday);
    m.setDate(currentMonday.getDate() - i * 7);
    buckets.push({
      weekStart: isoDate(m),
      label: `${m.getDate()}/${m.getMonth() + 1}`,
      runDistanceM: 0,
      strengthCount: 0,
      runCount: 0,
    });
  }
  const bucketByStart = new Map(buckets.map((b) => [b.weekStart, b]));

  let totalDistanceM = 0;
  let totalDurationSec = 0;
  const paceSamples: number[] = [];

  const byType = new Map<string, { count: number; distanceM: number; paceSum: number; paceN: number }>();

  for (const run of runs) {
    const dur = run.duration_min * 60 + (run.duration_sec ?? 0);
    totalDurationSec += dur;
    if (run.distance_m) {
      totalDistanceM += run.distance_m;
      if (run.avg_pace_sec) paceSamples.push(run.avg_pace_sec);
    }

    const bucket = bucketByStart.get(isoDate(mondayOf(new Date(run.session_date + "T00:00:00"))));
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

  for (const s of strengths) {
    const dur = s.duration_min * 60 + (s.duration_sec ?? 0);
    totalDurationSec += dur;
    const bucket = bucketByStart.get(isoDate(mondayOf(new Date(s.session_date + "T00:00:00"))));
    if (bucket) bucket.strengthCount += 1;
  }

  const runByType: RunTypeStat[] = Array.from(byType.entries()).map(([type, v]) => ({
    type,
    count: v.count,
    avgPaceSec: v.paceN > 0 ? Math.round(v.paceSum / v.paceN) : null,
    totalDistanceM: v.distanceM,
  }));

  // e1RM bests per exercise
  const bestByName = new Map<string, ExerciseBest>();
  for (const s of strengths) {
    const exercises = Array.isArray(s.exercises) ? (s.exercises as { name?: string; sets?: { reps?: string; weightKg?: string }[] }[]) : [];
    for (const ex of exercises) {
      const name = (ex.name ?? "").trim();
      if (!name) continue;
      for (const set of ex.sets ?? []) {
        const reps = Number(set.reps);
        const weight = Number(String(set.weightKg ?? "").replace(",", "."));
        if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps <= 0 || weight <= 0) continue;
        const value = epley(weight, reps);
        const current = bestByName.get(name);
        if (!current || value > current.e1rm) {
          bestByName.set(name, {
            name,
            e1rm: Math.round(value * 10) / 10,
            reps,
            weightKg: weight,
            date: s.session_date,
          });
        }
      }
    }
  }
  const exerciseBests = Array.from(bestByName.values()).sort((a, b) => b.e1rm - a.e1rm);
  const bestE1rm = exerciseBests.length > 0 ? exerciseBests[0].e1rm : null;

  const avgPaceSec =
    paceSamples.length > 0
      ? Math.round(paceSamples.reduce((a, b) => a + b, 0) / paceSamples.length)
      : null;

  return {
    totalRuns: runs.length,
    totalStrength: strengths.length,
    totalDistanceM,
    totalDurationSec,
    avgPaceSec,
    weekly: buckets,
    runByType,
    exerciseBests,
    bestE1rm,
  };
}