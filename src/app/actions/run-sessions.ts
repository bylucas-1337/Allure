"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  paceSecondsPerKm,
  validateRunSession,
  type SaveRunSessionInput,
} from "@/lib/run-sessions";
import { readText } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRITE_ERROR = "L’enregistrement a échoué. Vérifie ta connexion, puis réessaie.";

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/connexion");
  return data.user.id;
}

export async function saveRunSessionAction(formData: FormData) {
  const userId = await getUserId();

  const input: SaveRunSessionInput = {
    sessionDate: readText(formData, "sessionDate"),
    sessionType: readText(formData, "sessionType") || "easy",
    durationMin: readText(formData, "durationMin"),
    durationSec: readText(formData, "durationSec"),
    distanceKm: readText(formData, "distanceKm"),
    rpe: readText(formData, "rpe"),
    notes: readText(formData, "notes"),
    goalId: readText(formData, "goalId"),
  };

  const errors = validateRunSession(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const duration = Number(input.durationMin);
  const sec = input.durationSec === "" ? 0 : Number(input.durationSec);
  const totalSec = duration * 60 + sec;
  const distanceKm = input.distanceKm === "" ? null : Number(input.distanceKm.replace(",", "."));
  const distanceM = distanceKm === null ? null : Math.round(distanceKm * 1000);
  const avgPace = distanceKm === null ? null : paceSecondsPerKm(totalSec, distanceKm);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("run_sessions").insert({
    user_id: userId,
    session_date: input.sessionDate,
    session_type: input.sessionType,
    duration_min: duration,
    duration_sec: sec,
    distance_m: distanceM,
    avg_pace_sec: avgPace,
    rpe: input.rpe === "" ? null : Number(input.rpe),
    notes: input.notes === "" ? null : input.notes,
    goal_id: input.goalId === "" ? null : input.goalId,
  });

  if (error) {
    return { ok: false, errors: { form: WRITE_ERROR } };
  }

  revalidatePath("/ajouter");
  revalidatePath("/historique");
  return { ok: true };
}

export async function updateRunSessionAction(formData: FormData) {
  const userId = await getUserId();

  const id = readText(formData, "id");
  if (id === "") return { ok: false, errors: { form: "Identifiant manquant." } };

  const input: SaveRunSessionInput = {
    sessionDate: readText(formData, "sessionDate"),
    sessionType: readText(formData, "sessionType") || "easy",
    durationMin: readText(formData, "durationMin"),
    durationSec: readText(formData, "durationSec"),
    distanceKm: readText(formData, "distanceKm"),
    rpe: readText(formData, "rpe"),
    notes: readText(formData, "notes"),
    goalId: readText(formData, "goalId"),
  };

  const errors = validateRunSession(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const duration = Number(input.durationMin);
  const sec = input.durationSec === "" ? 0 : Number(input.durationSec);
  const totalSec = duration * 60 + sec;
  const distanceKm = input.distanceKm === "" ? null : Number(input.distanceKm.replace(",", "."));
  const distanceM = distanceKm === null ? null : Math.round(distanceKm * 1000);
  const avgPace = distanceKm === null ? null : paceSecondsPerKm(totalSec, distanceKm);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("run_sessions")
    .update({
      session_date: input.sessionDate,
      session_type: input.sessionType,
      duration_min: duration,
      duration_sec: sec,
      distance_m: distanceM,
      avg_pace_sec: avgPace,
      rpe: input.rpe === "" ? null : Number(input.rpe),
      notes: input.notes === "" ? null : input.notes,
      goal_id: input.goalId === "" ? null : input.goalId,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, errors: { form: WRITE_ERROR } };
  }

  revalidatePath("/ajouter");
  revalidatePath("/historique");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteRunSessionAction(formData: FormData) {
  const userId = await getUserId();
  const id = readText(formData, "id");
  if (id === "") return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("run_sessions").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/ajouter");
  revalidatePath("/historique");
}
