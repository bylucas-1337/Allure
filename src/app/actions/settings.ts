"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readAvailability } from "@/lib/availability";
import {
  parseClockToSeconds,
  parseNumber,
  parsePaceToSeconds,
  parseTimeToSeconds,
  readList,
  readText,
  RESET_CONFIRMATION,
  todayIsoDate,
  validateGoal,
  validateInjury,
  validateProfile,
  validateRunProfile,
  validateStrength,
  validateWeight,
  type ActionState,
} from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRITE_ERROR = "L’enregistrement a échoué. Vérifie ta connexion, puis réessaie.";

async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/connexion");
  }

  return data.user.id;
}

function saved(message = "C’est enregistré."): ActionState {
  revalidatePath("/reglages", "layout");
  return { status: "success", message };
}

function failed(error: ActionState["fieldErrors"], message?: string): ActionState {
  return { status: "error", message, fieldErrors: error };
}

function toNullable(value: string): string | null {
  return value === "" ? null : value;
}

/**
 * Lit les disponibilités existantes pour n'écraser que la partie modifiée.
 * Course et musculation partagent `profiles.weekly_availability`.
 */
async function currentAvailability(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("weekly_availability")
    .eq("user_id", userId)
    .maybeSingle<{ weekly_availability: unknown }>();

  return readAvailability(data?.weekly_availability);
}

/* -------------------------------------------------------------------------
 * Profil
 * ---------------------------------------------------------------------- */

export async function saveProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const input = {
    firstName: readText(formData, "firstName"),
    birthDate: readText(formData, "birthDate"),
    heightCm: readText(formData, "heightCm"),
    sex: readText(formData, "sex"),
    experienceLevel: "",
    restingHr: readText(formData, "restingHr"),
  };

  const fieldErrors = validateProfile(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie les champs signalés.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      first_name: toNullable(input.firstName),
      birth_date: toNullable(input.birthDate),
      height_cm: parseNumber(input.heightCm),
      sex: toNullable(input.sex),
      resting_hr: parseNumber(input.restingHr),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved("Profil mis à jour.");
}

/* -------------------------------------------------------------------------
 * Course
 * ---------------------------------------------------------------------- */

export async function saveRunProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const input = {
    runExperienceLevel: readText(formData, "runExperienceLevel"),
    runSurface: readText(formData, "runSurface"),
    runDays: readList(formData, "runDays"),
    runSessionsPerWeek: readText(formData, "runSessionsPerWeek"),
    longRunDay: readText(formData, "longRunDay"),
    runWeeklyKm: readText(formData, "runWeeklyKm"),
    easyPace: readText(formData, "easyPace"),
    thresholdPace: readText(formData, "thresholdPace"),
    racePace: readText(formData, "racePace"),
    pb5k: readText(formData, "pb5k"),
    pb10k: readText(formData, "pb10k"),
    pbHalf: readText(formData, "pbHalf"),
    pbMarathon: readText(formData, "pbMarathon"),
  };

  const fieldErrors = validateRunProfile(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie les champs signalés.");
  }

  const availability = await currentAvailability(userId);
  const sessions = parseNumber(input.runSessionsPerWeek);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      run_experience_level: toNullable(input.runExperienceLevel),
      run_surface: toNullable(input.runSurface),
      run_weekly_km: parseNumber(input.runWeeklyKm),
      run_easy_pace_sec: parsePaceToSeconds(input.easyPace),
      run_threshold_pace_sec: parsePaceToSeconds(input.thresholdPace),
      run_race_pace_sec: parsePaceToSeconds(input.racePace),
      pb_5k_sec: parseTimeToSeconds(input.pb5k),
      pb_10k_sec: parseTimeToSeconds(input.pb10k),
      pb_half_sec: parseTimeToSeconds(input.pbHalf),
      pb_marathon_sec: parseTimeToSeconds(input.pbMarathon),
      weekly_availability: {
        ...availability,
        runDays: input.runDays,
        runSessionsPerWeek: sessions,
        longRunDay: toNullable(input.longRunDay),
      },
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved("Repères de course mis à jour.");
}

/* -------------------------------------------------------------------------
 * Musculation
 * ---------------------------------------------------------------------- */

export async function saveStrengthAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const input = {
    strengthDays: readList(formData, "strengthDays"),
    strengthSessionsPerWeek: readText(formData, "strengthSessionsPerWeek"),
    sessionDurationMin: readText(formData, "sessionDurationMin"),
    strengthGoal: readText(formData, "strengthGoal"),
    muscleGroups: readList(formData, "muscleGroups"),
    equipment: readList(formData, "equipment"),
    experienceLevel: readText(formData, "experienceLevel"),
  };

  const fieldErrors = validateStrength(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie les champs signalés.");
  }

  const availability = await currentAvailability(userId);
  const sessions = parseNumber(input.strengthSessionsPerWeek);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      experience_level: toNullable(input.experienceLevel),
      session_duration_min: parseNumber(input.sessionDurationMin),
      strength_goal: toNullable(input.strengthGoal),
      target_muscle_groups: input.muscleGroups,
      equipment: input.equipment,
      weekly_availability: {
        ...availability,
        strengthDays: input.strengthDays,
        strengthSessionsPerWeek: sessions,
      },
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved("Préférences de musculation mises à jour.");
}

/* -------------------------------------------------------------------------
 * Poids
 * ---------------------------------------------------------------------- */

export async function saveWeightAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const input = {
    weightKg: readText(formData, "weightKg"),
    measuredOn: readText(formData, "measuredOn"),
  };

  const fieldErrors = validateWeight(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie le poids et la date.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("weight_entries").upsert(
    {
      user_id: userId,
      measured_on: input.measuredOn === "" ? todayIsoDate() : input.measuredOn,
      weight_kg: parseNumber(input.weightKg),
    },
    { onConflict: "user_id,measured_on" },
  );

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved("Poids enregistré pour cette date.");
}

export async function deleteWeightAction(formData: FormData): Promise<void> {
  const userId = await getUserId();
  const id = readText(formData, "id");

  if (id !== "") {
    const supabase = await createSupabaseServerClient();
    await supabase.from("weight_entries").delete().eq("id", id).eq("user_id", userId);
  }

  revalidatePath("/reglages", "layout");
}

/* -------------------------------------------------------------------------
 * Blessures
 * ---------------------------------------------------------------------- */

export async function saveInjuryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const id = readText(formData, "id");
  const input = {
    label: readText(formData, "label"),
    bodyArea: readText(formData, "bodyArea"),
    status: readText(formData, "status"),
    startedOn: readText(formData, "startedOn"),
    endedOn: readText(formData, "endedOn"),
  };

  const fieldErrors = validateInjury(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie la gêne décrite.");
  }

  const supabase = await createSupabaseServerClient();
  const row = {
    label: input.label.trim(),
    body_area: toNullable(input.bodyArea),
    status: input.status,
    started_on: toNullable(input.startedOn),
    ended_on: toNullable(input.endedOn),
  };

  const { error } =
    id === ""
      ? await supabase.from("injuries").insert({ user_id: userId, ...row })
      : await supabase.from("injuries").update(row).eq("id", id).eq("user_id", userId);

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved(id === "" ? "Gêne ajoutée." : "Gêne mise à jour.");
}

export async function deleteInjuryAction(formData: FormData): Promise<void> {
  const userId = await getUserId();
  const id = readText(formData, "id");

  if (id !== "") {
    const supabase = await createSupabaseServerClient();
    await supabase.from("injuries").delete().eq("id", id).eq("user_id", userId);
  }

  revalidatePath("/reglages", "layout");
}

/* -------------------------------------------------------------------------
 * Objectifs (course)
 * ---------------------------------------------------------------------- */

export async function saveGoalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId();
  const id = readText(formData, "id");
  const input = {
    kind: readText(formData, "kind") || "main",
    raceName: readText(formData, "raceName"),
    distanceKm: readText(formData, "distanceKm"),
    raceDate: readText(formData, "raceDate"),
    targetTime: readText(formData, "targetTime"),
    note: readText(formData, "note"),
  };

  const fieldErrors = validateGoal(input);
  if (Object.keys(fieldErrors).length > 0) {
    return failed(fieldErrors, "Vérifie la course.");
  }

  const supabase = await createSupabaseServerClient();

  // Un seul objectif principal actif : l'ancien passe en abandonné, il reste
  // dans l'historique. Les courses secondaires ne sont jamais touchées.
  if (input.kind === "main") {
    let query = supabase
      .from("goals")
      .update({ status: "abandoned" })
      .eq("user_id", userId)
      .eq("sport", "run")
      .eq("goal_kind", "main")
      .eq("status", "active");

    if (id !== "") {
      query = query.neq("id", id);
    }

    const { error: resetError } = await query;
    if (resetError) {
      return failed(undefined, WRITE_ERROR);
    }
  }

  const distanceKm = parseNumber(input.distanceKm);
  const row = {
    sport: "run" as const,
    goal_kind: input.kind,
    race_name: toNullable(input.raceName),
    distance_m: distanceKm === null ? null : Math.round(distanceKm * 1000),
    race_date: toNullable(input.raceDate),
    target_time_sec: parseClockToSeconds(input.targetTime),
    note_text: toNullable(input.note),
    status: "active" as const,
  };

  const { error } =
    id === ""
      ? await supabase.from("goals").insert({ user_id: userId, ...row })
      : await supabase.from("goals").update(row).eq("id", id).eq("user_id", userId);

  if (error) {
    return failed(undefined, WRITE_ERROR);
  }

  return saved(id === "" ? "Objectif ajouté." : "Objectif mis à jour.");
}

export async function setGoalStatusAction(formData: FormData): Promise<void> {
  const userId = await getUserId();
  const id = readText(formData, "id");
  const status = readText(formData, "status");

  if (id === "" || !["active", "achieved", "abandoned"].includes(status)) {
    revalidatePath("/reglages", "layout");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("id, sport, goal_kind")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string; sport: string; goal_kind: string }>();

  if (!goal) {
    revalidatePath("/reglages", "layout");
    return;
  }

  // Réactiver un objectif principal doit rester possible : l'ancien principal
  // actif passe en abandonné, pour respecter l'unicité côté base.
  if (status === "active" && goal.goal_kind === "main") {
    await supabase
      .from("goals")
      .update({ status: "abandoned" })
      .eq("user_id", userId)
      .eq("sport", goal.sport)
      .eq("goal_kind", "main")
      .eq("status", "active")
      .neq("id", id);
  }

  await supabase.from("goals").update({ status }).eq("id", id).eq("user_id", userId);
  revalidatePath("/reglages", "layout");
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const userId = await getUserId();
  const id = readText(formData, "id");

  if (id !== "") {
    const supabase = await createSupabaseServerClient();
    await supabase.from("goals").delete().eq("id", id).eq("user_id", userId);
  }

  revalidatePath("/reglages", "layout");
}

/* -------------------------------------------------------------------------
 * Réinitialisation de l'onboarding
 * ---------------------------------------------------------------------- */

/**
 * Efface le profil, les pesées, les zones sensibles et les objectifs de ce
 * compte, puis renvoie vers l'onboarding. Les séances déjà notées ne sont pas
 * touchées : elles ne viennent pas de l'onboarding.
 */
export async function resetOnboardingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (readText(formData, "confirm") !== RESET_CONFIRMATION) {
    return failed(
      { confirm: `Écris ${RESET_CONFIRMATION} pour confirmer.` },
      "La confirmation n’est pas exacte.",
    );
  }

  const userId = await getUserId();
  const supabase = await createSupabaseServerClient();

  const results = await Promise.all([
    supabase.from("weight_entries").delete().eq("user_id", userId),
    supabase.from("injuries").delete().eq("user_id", userId),
    supabase.from("goals").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("user_id", userId),
  ]);

  if (results.some((result) => result.error)) {
    return failed(undefined, WRITE_ERROR);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
