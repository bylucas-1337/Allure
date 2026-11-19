import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { data: goal, error } = await supabase
    .from("goals")
    .select("id, race_name, race_date, distance_m, target_time_sec, note_text, status")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .maybeSingle<{
      id: string;
      race_name: string | null;
      race_date: string | null;
      distance_m: number | null;
      target_time_sec: number | null;
      note_text: string | null;
      status: string;
    }>();

  if (error || !goal) {
    return new NextResponse("Objectif introuvable", { status: 404 });
  }

  const name = goal.race_name ?? "Course";
  const date = goal.race_date ? formatIcsDate(goal.race_date) : null;

  const descriptionParts: string[] = [];
  if (goal.distance_m) {
    descriptionParts.push(`Distance : ${(goal.distance_m / 1000).toFixed(1).replace(".", ",")} km`);
  }
  if (goal.target_time_sec) {
    const h = Math.floor(goal.target_time_sec / 3600);
    const m = Math.floor((goal.target_time_sec % 3600) / 60);
    const s = goal.target_time_sec % 60;
    const time = h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min${String(s).padStart(2, "0")}`;
    descriptionParts.push(`Temps visé : ${time}`);
  }
  if (goal.note_text) descriptionParts.push(goal.note_text);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Allure//Objectif course//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${goal.id}@allure`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `SUMMARY:${escapeIcs(name)}`,
  ];
  if (date) {
    lines.push(`DTSTART;VALUE=DATE:${date}`);
    // All-day event; add a 1-day duration so calendars show it on that day.
    const next = new Date(goal.race_date as string);
    next.setDate(next.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(next.toISOString().slice(0, 10))}`);
  }
  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcs(descriptionParts.join("\\n"))}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name.replace(/[^a-zA-Z0-9-_]/g, "_")}.ics"`,
    },
  });
}