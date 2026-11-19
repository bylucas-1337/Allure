import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readAvailability } from "@/lib/availability";
import {
  createEmptyDraft,
  secondsToPaceInput,
  secondsToTimeInput,
  type InjuryStatus,
  type OnboardingDraft,
} from "@/lib/onboarding";

function toIsoDate(value: string | null): string {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function toNumberInput(value: number | string | null): string {
  if (value === null || value === undefined) {
    return "";
  }

  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

type ProfileRow = {
  first_name: string | null;
  birth_date: string | null;
  height_cm: number | string | null;
  sex: string | null;
  resting_hr: number | null;
  experience_level: string | null;
  weekly_availability: unknown;
  run_experience_level: string | null;
  run_surface: string | null;
  run_weekly_km: number | string | null;
  run_easy_pace_sec: number | null;
  run_threshold_pace_sec: number | null;
  run_race_pace_sec: number | null;
  pb_5k_sec: number | null;
  pb_10k_sec: number | null;
  pb_half_sec: number | null;
  pb_marathon_sec: number | null;
  session_duration_min: number | null;
  strength_goal: string | null;
  target_muscle_groups: unknown;
  equipment: unknown;
  onboarding_completed_at: string | null;
};

type WeightRow = { measured_on: string; weight_kg: number | string };

type InjuryRow = {
  id: string;
  label: string;
  body_area: string | null;
  status: string;
  started_on: string | null;
};

type GoalRow = {
  race_name: string | null;
  distance_m: number | null;
  race_date: string | null;
  target_time_sec: number | null;
};

/**
 * Lit ce qui existe déjà pour ce compte, afin de reprendre l'onboarding
 * là où il s'est arrêté (sur cet appareil ou sur un autre).
 */
export async function getOnboardingDraft(): Promise<{
  draft: OnboardingDraft;
  completedAt: string | null;
}> {
  const draft = createEmptyDraft();
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { draft, completedAt: null };
  }

  const userId = userData.user.id;

  const [{ data: profile }, { data: weight }, { data: injuries }, { data: goal }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "first_name, birth_date, height_cm, sex, resting_hr, experience_level, weekly_availability, run_experience_level, run_surface, run_weekly_km, run_easy_pace_sec, run_threshold_pace_sec, run_race_pace_sec, pb_5k_sec, pb_10k_sec, pb_half_sec, pb_marathon_sec, session_duration_min, strength_goal, target_muscle_groups, equipment, onboarding_completed_at",
        )
        .eq("user_id", userId)
        .maybeSingle<ProfileRow>(),
      supabase
        .from("weight_entries")
        .select("measured_on, weight_kg")
        .eq("user_id", userId)
        .order("measured_on", { ascending: false })
        .limit(1)
        .maybeSingle<WeightRow>(),
      supabase
        .from("injuries")
        .select("id, label, body_area, status, started_on")
        .eq("user_id", userId)
        .neq("status", "recovered")
        .order("created_at", { ascending: false })
        .limit(10)
        .returns<InjuryRow[]>(),
      supabase
        .from("goals")
        .select("race_name, distance_m, race_date, target_time_sec")
        .eq("user_id", userId)
        .eq("sport", "run")
        .eq("goal_kind", "main")
        .eq("status", "active")
        .maybeSingle<GoalRow>(),
    ]);

  if (profile) {
    draft.firstName = profile.first_name ?? "";
    draft.birthDate = toIsoDate(profile.birth_date);
    draft.heightCm = toNumberInput(profile.height_cm);
    draft.sex = profile.sex ?? "";
    draft.restingHr = toNumberInput(profile.resting_hr);

    draft.experienceLevel = profile.experience_level ?? "";
    draft.sessionDurationMin = toNumberInput(profile.session_duration_min);
    draft.strengthGoal = profile.strength_goal ?? "";
    draft.muscleGroups = readStringList(profile.target_muscle_groups);
    draft.equipment = readStringList(profile.equipment);

    draft.runExperienceLevel = profile.run_experience_level ?? "";
    draft.runSurface = profile.run_surface ?? "";
    draft.runWeeklyKm = toNumberInput(profile.run_weekly_km);
    draft.easyPace = secondsToPaceInput(profile.run_easy_pace_sec);
    draft.thresholdPace = secondsToPaceInput(profile.run_threshold_pace_sec);
    draft.racePace = secondsToPaceInput(profile.run_race_pace_sec);
    draft.pb5k = secondsToTimeInput(profile.pb_5k_sec);
    draft.pb10k = secondsToTimeInput(profile.pb_10k_sec);
    draft.pbHalf = secondsToTimeInput(profile.pb_half_sec);
    draft.pbMarathon = secondsToTimeInput(profile.pb_marathon_sec);

    const availability = readAvailability(profile.weekly_availability);
    draft.runDays = availability.runDays;
    draft.runSessionsPerWeek =
      availability.runSessionsPerWeek === null ? "" : String(availability.runSessionsPerWeek);
    draft.longRunDay = availability.longRunDay ?? "";
    draft.strengthDays = availability.strengthDays;
    draft.strengthSessionsPerWeek =
      availability.strengthSessionsPerWeek === null
        ? ""
        : String(availability.strengthSessionsPerWeek);
  }

  if (weight) {
    draft.weightKg = toNumberInput(weight.weight_kg);
    draft.weightDate = toIsoDate(weight.measured_on);
  }

  if (injuries) {
    draft.injuries = injuries.map((injury) => ({
      key: injury.id,
      label: injury.label,
      bodyArea: injury.body_area ?? "",
      status: injury.status as InjuryStatus,
      startedOn: toIsoDate(injury.started_on),
    }));
  }

  if (goal) {
    draft.goal = {
      enabled: true,
      raceName: goal.race_name ?? "",
      distanceKm: goal.distance_m === null ? "" : (goal.distance_m / 1000).toString(),
      raceDate: toIsoDate(goal.race_date),
      targetTime: secondsToTimeInput(goal.target_time_sec),
    };
  }

  return { draft, completedAt: profile?.onboarding_completed_at ?? null };
}
