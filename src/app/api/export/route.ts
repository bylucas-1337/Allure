import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const userId = userData.user.id;

  const [profile, weights, injuries, goals, runs, strengths, checkins] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("weight_entries").select("*").eq("user_id", userId),
    supabase.from("injuries").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("run_sessions").select("*").eq("user_id", userId),
    supabase.from("strength_sessions").select("*").eq("user_id", userId),
    supabase.from("daily_checkins").select("*").eq("user_id", userId),
  ]);

  const payload = {
    app: "Allure",
    schemaVersion: "V1.5",
    exportedAt: new Date().toISOString(),
    counts: {
      weightEntries: weights.data?.length ?? 0,
      injuries: injuries.data?.length ?? 0,
      goals: goals.data?.length ?? 0,
      runSessions: runs.data?.length ?? 0,
      strengthSessions: strengths.data?.length ?? 0,
      dailyCheckins: checkins.data?.length ?? 0,
    },
    profile: profile.data,
    weightEntries: weights.data ?? [],
    injuries: injuries.data ?? [],
    goals: goals.data ?? [],
    runSessions: runs.data ?? [],
    strengthSessions: strengths.data ?? [],
    dailyCheckins: checkins.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="allure-export.json"',
    },
  });
}