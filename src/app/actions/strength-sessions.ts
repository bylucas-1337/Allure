"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  validateStrengthSession,
  type SaveStrengthSessionInput,
} from "@/lib/strength-sessions";
import { readText } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRITE_ERROR = "L’enregistrement a échoué. Vérifie ta connexion, puis réessaie.";

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/connexion");
  return data.user.id;
}

export async function saveStrengthSessionAction(formData: FormData) {
  const userId = await getUserId();

  const input: SaveStrengthSessionInput = {
    sessionDate: readText(formData, "sessionDate"),
    durationMin: readText(formData, "durationMin"),
    durationSec: readText(formData, "durationSec"),
    rpe: readText(formData, "rpe"),
    notes: readText(formData, "notes"),
    exercisesJson: readText(formData, "exercisesJson"),
  };

  const errors = validateStrengthSession(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const duration = Number(input.durationMin || 0);
  const sec = input.durationSec === "" ? 0 : Number(input.durationSec);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("strength_sessions").insert({
    user_id: userId,
    session_date: input.sessionDate,
    duration_min: duration,
    duration_sec: sec,
    rpe: input.rpe === "" ? null : Number(input.rpe),
    notes: input.notes === "" ? null : input.notes,
    exercises: JSON.parse(input.exercisesJson || "[]"),
  });

  if (error) {
    return { ok: false, errors: { form: WRITE_ERROR } };
  }

  revalidatePath("/ajouter");
  revalidatePath("/historique");
  return { ok: true };
}

export async function updateStrengthSessionAction(formData: FormData) {
  const userId = await getUserId();

  const id = readText(formData, "id");
  if (id === "") return { ok: false, errors: { form: "Identifiant manquant." } };

  const input: SaveStrengthSessionInput = {
    sessionDate: readText(formData, "sessionDate"),
    durationMin: readText(formData, "durationMin"),
    durationSec: readText(formData, "durationSec"),
    rpe: readText(formData, "rpe"),
    notes: readText(formData, "notes"),
    exercisesJson: readText(formData, "exercisesJson"),
  };

  const errors = validateStrengthSession(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const duration = Number(input.durationMin || 0);
  const sec = input.durationSec === "" ? 0 : Number(input.durationSec);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("strength_sessions")
    .update({
      session_date: input.sessionDate,
      duration_min: duration,
      duration_sec: sec,
      rpe: input.rpe === "" ? null : Number(input.rpe),
      notes: input.notes === "" ? null : input.notes,
      exercises: JSON.parse(input.exercisesJson || "[]"),
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

export async function deleteStrengthSessionAction(formData: FormData) {
  const userId = await getUserId();
  const id = readText(formData, "id");
  if (id === "") return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("strength_sessions").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/ajouter");
  revalidatePath("/historique");
}
