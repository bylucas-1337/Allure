import { NextResponse } from "next/server";

import { toCsv, type CsvColumn } from "@/lib/csv";
import { SESSION_TYPES } from "@/lib/run-sessions";
import { RPE_LABELS } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RUN_COLUMNS: CsvColumn[] = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "durationMin", label: "Durée (min)" },
  { key: "durationSec", label: "Durée (s)" },
  { key: "distanceM", label: "Distance (m)" },
  { key: "pace", label: "Allure (s/km)" },
  { key: "avgHr", label: "FC moyenne (bpm)" },
  { key: "maxHr", label: "FC max (bpm)" },
  { key: "elevation", label: "Dénivelé positif (m)" },
  { key: "calories", label: "Calories" },
  { key: "rpe", label: "Ressenti" },
  { key: "source", label: "Source" },
  { key: "notes", label: "Notes" },
];

const STRENGTH_COLUMNS: CsvColumn[] = [
  { key: "date", label: "Date" },
  { key: "durationMin", label: "Durée (min)" },
  { key: "durationSec", label: "Durée (s)" },
  { key: "rpe", label: "Ressenti" },
  { key: "exercises", label: "Exercices" },
  { key: "notes", label: "Notes" },
];

const WEIGHT_COLUMNS: CsvColumn[] = [
  { key: "date", label: "Date" },
  { key: "weightKg", label: "Poids (kg)" },
  { key: "notes", label: "Notes" },
];

const CHECKIN_COLUMNS: CsvColumn[] = [
  { key: "date", label: "Date" },
  { key: "form", label: "Forme (1-5)" },
  { key: "fatigue", label: "Fatigue (1-5)" },
  { key: "pain", label: "Douleur" },
  { key: "notes", label: "Notes" },
];

const SOURCE_LABELS: Record<string, string> = {
  manual: "Saisie manuelle",
  fit: "Import FIT",
  gpx: "Import GPX",
};

function csvResponse(fileName: string, content: string) {
  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

function formatExercises(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((exercise) => {
      const name = typeof exercise.name === "string" ? exercise.name : "Exercice";
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      const detail = sets
        .filter((set): set is Record<string, unknown> => typeof set === "object" && set !== null)
        .map((set) => `${set.reps ?? "?"}×${set.weightKg ?? "?"} kg`)
        .join(", ");
      return detail ? `${name} (${detail})` : name;
    })
    .join(" | ");
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const userId = userData.user.id;
  const dataset = new URL(request.url).searchParams.get("dataset") ?? "runs";
  const today = new Date().toISOString().slice(0, 10);

  if (dataset === "runs") {
    const { data } = await supabase
      .from("run_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false });

    const rows = (data ?? []).map((row) => ({
      date: row.session_date,
      type: SESSION_TYPES.find((item) => item.value === row.session_type)?.label ?? row.session_type,
      durationMin: row.duration_min,
      durationSec: row.duration_sec ?? 0,
      distanceM: row.distance_m,
      pace: row.avg_pace_sec,
      avgHr: row.avg_hr ?? "",
      maxHr: row.max_hr ?? "",
      elevation: row.elevation_gain_m ?? "",
      calories: row.calories ?? "",
      rpe: row.rpe ? (RPE_LABELS[row.rpe] ?? row.rpe) : "",
      source: SOURCE_LABELS[row.source] ?? row.source,
      notes: row.notes,
    }));

    return csvResponse(`allure-course-${today}.csv`, toCsv(RUN_COLUMNS, rows));
  }

  if (dataset === "strength") {
    const { data } = await supabase
      .from("strength_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("session_date", { ascending: false });

    const rows = (data ?? []).map((row) => ({
      date: row.session_date,
      durationMin: row.duration_min,
      durationSec: row.duration_sec ?? 0,
      rpe: row.rpe ? (RPE_LABELS[row.rpe] ?? row.rpe) : "",
      exercises: formatExercises(row.exercises),
      notes: row.notes,
    }));

    return csvResponse(`allure-musculation-${today}.csv`, toCsv(STRENGTH_COLUMNS, rows));
  }

  if (dataset === "weights") {
    const { data } = await supabase
      .from("weight_entries")
      .select("*")
      .eq("user_id", userId)
      .order("measured_on", { ascending: false });

    const rows = (data ?? []).map((row) => ({
      date: row.measured_on,
      weightKg: row.weight_kg,
      notes: row.note_text,
    }));

    return csvResponse(`allure-poids-${today}.csv`, toCsv(WEIGHT_COLUMNS, rows));
  }

  if (dataset === "checkins") {
    const { data } = await supabase
      .from("daily_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false });

    const rows = (data ?? []).map((row) => ({
      date: row.checkin_date,
      form: row.form ?? "",
      fatigue: row.fatigue ?? "",
      pain: row.pain ?? "",
      notes: row.notes,
    }));

    return csvResponse(`allure-checkins-${today}.csv`, toCsv(CHECKIN_COLUMNS, rows));
  }

  return NextResponse.json(
    { ok: false, error: "Jeu de données inconnu. Utilise runs, strength, weights ou checkins." },
    { status: 400 },
  );
}
