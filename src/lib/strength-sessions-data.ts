import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StrengthExercise } from "@/lib/strength-sessions";

export type StrengthSessionView = {
  id: string;
  sessionDate: string;
  durationMin: number;
  durationSec: number;
  rpe: number | null;
  notes: string;
  exercises: StrengthExercise[];
  createdAt: string;
};

export type StrengthSessionsData = {
  sessions: StrengthSessionView[];
};

export async function getStrengthSessionsData(): Promise<StrengthSessionsData> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { sessions: [] };

  const { data } = await supabase
    .from("strength_sessions")
    .select("id, session_date, duration_min, duration_sec, rpe, notes, exercises, created_at")
    .eq("user_id", userData.user.id)
    .order("session_date", { ascending: false })
    .limit(50)
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
    >();

  const sessions: StrengthSessionView[] = (data ?? []).map((row) => {
    let exercises: StrengthExercise[] = [];
    if (Array.isArray(row.exercises)) {
      exercises = row.exercises
        .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
        .map((e) => ({
          name: typeof e.name === "string" ? e.name : "",
          sets: Array.isArray(e.sets)
            ? e.sets
                .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
                .map((s) => ({
                  reps: typeof s.reps === "string" ? s.reps : String(s.reps ?? ""),
                  weightKg: typeof s.weightKg === "string" ? s.weightKg : String(s.weightKg ?? ""),
                }))
            : [],
        }));
    }
    return {
      id: row.id,
      sessionDate: row.session_date,
      durationMin: row.duration_min,
      durationSec: row.duration_sec ?? 0,
      rpe: row.rpe,
      notes: row.notes ?? "",
      exercises,
      createdAt: row.created_at,
    };
  });

  return { sessions };
}
