import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RunSessionView = {
  id: string;
  sessionDate: string;
  sessionType: string;
  durationMin: number;
  durationSec: number;
  distanceM: number | null;
  avgPaceSec: number | null;
  rpe: number | null;
  notes: string;
  goalId: string | null;
  goalName: string;
  createdAt: string;
};

export type RunSessionsData = {
  sessions: RunSessionView[];
  goals: { id: string; raceName: string }[];
};

export async function getRunSessionsData(): Promise<RunSessionsData> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { sessions: [], goals: [] };
  }
  const userId = userData.user.id;

  const [sessionsResult, goalsResult] = await Promise.all([
    supabase
      .from("run_sessions")
      .select("id, session_date, session_type, duration_min, duration_sec, distance_m, avg_pace_sec, rpe, notes, goal_id, created_at")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(50)
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
      .from("goals")
      .select("id, race_name")
      .eq("user_id", userId)
      .eq("sport", "run")
      .eq("status", "active")
      .returns<{ id: string; race_name: string | null }[]>(),
  ]);

  const goalNameById = new Map(
    (goalsResult.data ?? []).map((goal) => [goal.id, goal.race_name ?? "Course"]),
  );

  const sessions: RunSessionView[] = (sessionsResult.data ?? []).map((row) => ({
    id: row.id,
    sessionDate: row.session_date,
    sessionType: row.session_type,
    durationMin: row.duration_min,
    durationSec: row.duration_sec ?? 0,
    distanceM: row.distance_m,
    avgPaceSec: row.avg_pace_sec,
    rpe: row.rpe,
    notes: row.notes ?? "",
    goalId: row.goal_id,
    goalName: row.goal_id ? (goalNameById.get(row.goal_id) ?? "Course") : "",
    createdAt: row.created_at,
  }));

  return {
    sessions,
    goals: (goalsResult.data ?? []).map((goal) => ({
      id: goal.id,
      raceName: goal.race_name ?? "Course",
    })),
  };
}
