import "server-only";

import { readAvailability } from "@/lib/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RunSessionView } from "@/lib/run-sessions-data";
import type { StrengthSessionView } from "@/lib/strength-sessions-data";

export type HomeData = {
  firstName: string;
  heightCm: string;
  weightKg: string;
  restingHr: string;
  lastRun: RunSessionView | null;
  lastStrength: StrengthSessionView | null;
  weekRuns: number;
  weekStrength: number;
  weekDistanceM: number;
  weekDurationSec: number;
  todayIsRunDay: boolean;
  todayIsStrengthDay: boolean;
  runDays: string[];
  strengthDays: string[];
  longRunDay: string | null;
  activeGoals: { id: string; raceName: string; raceDate: string; distanceM: number | null }[];
  todayCheckin: { form: number | null; fatigue: number | null; pain: string; notes: string } | null;
  recentCheckins: { date: string; form: number | null; fatigue: number | null; pain: string }[];
  todayIso: string;
  nextPlannedSession: {
    date: string;
    sport: string;
    sessionType: string | null;
    durationMin: number | null;
    origin: string;
    briefText: string | null;
  } | null;
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export async function getHomeData(): Promise<HomeData> {
  const empty: HomeData = {
    firstName: "",
    heightCm: "",
    weightKg: "",
    restingHr: "",
    lastRun: null,
    lastStrength: null,
    weekRuns: 0,
    weekStrength: 0,
    weekDistanceM: 0,
    weekDurationSec: 0,
    todayIsRunDay: false,
    todayIsStrengthDay: false,
    runDays: [],
    strengthDays: [],
    longRunDay: null,
    activeGoals: [],
    todayCheckin: null,
    recentCheckins: [],
    todayIso: new Date().toISOString().slice(0, 10),
    nextPlannedSession: null,
  };

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return empty;
  const userId = userData.user.id;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayKey = DAY_KEYS[new Date().getDay()];

  // Week start (Monday)
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const weekStart = monday.toISOString().slice(0, 10);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString().slice(0, 10);

  const [profileResult, weightResult, runsResult, strengthsResult, goalsResult, checkinResult, recentCheckinsResult, plannedResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, height_cm, resting_hr, weekly_availability")
        .eq("user_id", userId)
        .maybeSingle<{
          first_name: string | null;
          height_cm: number | string | null;
          resting_hr: number | null;
          weekly_availability: unknown;
        }>(),
      supabase
        .from("weight_entries")
        .select("weight_kg")
        .eq("user_id", userId)
        .order("measured_on", { ascending: false })
        .limit(1)
        .maybeSingle<{ weight_kg: number | string }>(),
      supabase
        .from("run_sessions")
        .select("id, session_date, session_type, duration_min, duration_sec, distance_m, avg_pace_sec, rpe, notes, goal_id, created_at")
        .eq("user_id", userId)
        .order("session_date", { ascending: false })
        .limit(10)
        .returns<
          {
            id: string;
            session_date: string;
            session_type: string;
            duration_min: number;
            duration_sec: number | null;
            distance_m: number | null;
            avg_pace_sec: number | null;
            rpe: number | null;
            notes: string | null;
            goal_id: string | null;
            created_at: string;
          }[]
        >(),
      supabase
        .from("strength_sessions")
        .select("id, session_date, duration_min, duration_sec, rpe, notes, exercises, created_at")
        .eq("user_id", userId)
        .order("session_date", { ascending: false })
        .limit(10)
        .returns<
          {
            id: string;
            session_date: string;
            duration_min: number;
            duration_sec: number | null;
            rpe: number | null;
            notes: string | null;
            exercises: unknown;
            created_at: string;
          }[]
        >(),
      supabase
        .from("goals")
        .select("id, race_name, race_date, distance_m")
        .eq("user_id", userId)
        .eq("status", "active")
        .returns<{ id: string; race_name: string | null; race_date: string | null; distance_m: number | null }[]>(),
      supabase
        .from("daily_checkins")
        .select("form, fatigue, pain, notes")
        .eq("user_id", userId)
        .eq("checkin_date", todayIso)
        .maybeSingle<{ form: number | null; fatigue: number | null; pain: string | null; notes: string | null }>(),
      supabase
        .from("daily_checkins")
        .select("checkin_date, form, fatigue, pain")
        .eq("user_id", userId)
        .gte("checkin_date", sevenDaysAgoIso)
        .order("checkin_date", { ascending: true })
        .returns<{ checkin_date: string; form: number | null; fatigue: number | null; pain: string | null }[]>(),
      supabase
        .from("planned_sessions")
        .select("date, sport, session_type, duration_min, origin, brief_text")
        .eq("user_id", userId)
        .eq("status", "planned")
        .gte("date", todayIso)
        .order("date", { ascending: true })
        .limit(1)
        .maybeSingle<{
          date: string;
          sport: string;
          session_type: string | null;
          duration_min: number | null;
          origin: string;
          brief_text: string | null;
        }>(),
    ]);

  const profile = profileResult.data;
  const availability = readAvailability(profile?.weekly_availability);

  const runs = runsResult.data ?? [];
  const strengths = strengthsResult.data ?? [];

  const lastRun: RunSessionView | null = runs[0]
    ? {
        id: runs[0].id,
        sessionDate: runs[0].session_date,
        sessionType: runs[0].session_type,
        durationMin: runs[0].duration_min,
        durationSec: runs[0].duration_sec ?? 0,
        distanceM: runs[0].distance_m,
        avgPaceSec: runs[0].avg_pace_sec,
        rpe: runs[0].rpe,
        notes: runs[0].notes ?? "",
        goalId: runs[0].goal_id,
        goalName: "",
        createdAt: runs[0].created_at,
      }
    : null;

  const lastStrength: StrengthSessionView | null = strengths[0]
    ? {
        id: strengths[0].id,
        sessionDate: strengths[0].session_date,
        durationMin: strengths[0].duration_min,
        durationSec: strengths[0].duration_sec ?? 0,
        rpe: strengths[0].rpe,
        notes: strengths[0].notes ?? "",
        exercises: Array.isArray(strengths[0].exercises)
          ? (strengths[0].exercises as StrengthSessionView["exercises"])
          : [],
        createdAt: strengths[0].created_at,
      }
    : null;

  const weekRunsList = runs.filter((r) => r.session_date >= weekStart);
  const weekStrengthsList = strengths.filter((s) => s.session_date >= weekStart);

  const weekDistanceM = weekRunsList.reduce((sum, r) => sum + (r.distance_m ?? 0), 0);
  const weekDurationSec =
    weekRunsList.reduce((sum, r) => sum + r.duration_min * 60 + (r.duration_sec ?? 0), 0) +
    weekStrengthsList.reduce((sum, s) => sum + s.duration_min * 60 + (s.duration_sec ?? 0), 0);

  return {
    firstName: profile?.first_name ?? "",
    heightCm: profile?.height_cm != null ? String(profile.height_cm) : "",
    weightKg: weightResult.data ? String(weightResult.data.weight_kg) : "",
    restingHr: profile?.resting_hr != null ? String(profile.resting_hr) : "",
    lastRun,
    lastStrength,
    weekRuns: weekRunsList.length,
    weekStrength: weekStrengthsList.length,
    weekDistanceM,
    weekDurationSec,
    todayIsRunDay: availability.runDays.includes(todayKey as never),
    todayIsStrengthDay: availability.strengthDays.includes(todayKey as never),
    runDays: availability.runDays,
    strengthDays: availability.strengthDays,
    longRunDay: availability.longRunDay,
    activeGoals: (goalsResult.data ?? []).map((g) => ({
      id: g.id,
      raceName: g.race_name ?? "Course",
      raceDate: g.race_date ?? "",
      distanceM: g.distance_m,
    })),
    todayCheckin: checkinResult.data
      ? {
          form: checkinResult.data.form,
          fatigue: checkinResult.data.fatigue,
          pain: checkinResult.data.pain ?? "",
          notes: checkinResult.data.notes ?? "",
        }
      : null,
    recentCheckins: (recentCheckinsResult.data ?? []).map((row) => ({
      date: row.checkin_date,
      form: row.form,
      fatigue: row.fatigue,
      pain: row.pain ?? "",
    })),
    todayIso,
    nextPlannedSession: plannedResult.data
      ? {
          date: plannedResult.data.date,
          sport: plannedResult.data.sport,
          sessionType: plannedResult.data.session_type,
          durationMin: plannedResult.data.duration_min,
          origin: plannedResult.data.origin,
          briefText: plannedResult.data.brief_text,
        }
      : null,
  };
}
