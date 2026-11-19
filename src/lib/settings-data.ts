import "server-only";

import { readAvailability } from "@/lib/availability";
import {
  secondsToPaceInput,
  secondsToTimeInput,
  type MuscleGroup,
} from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WeightEntryView = {
  id: string;
  measuredOn: string;
  weightKg: number;
  note: string;
};

export type InjuryView = {
  id: string;
  label: string;
  bodyArea: string;
  status: string;
  startedOn: string;
  endedOn: string;
  note: string;
};

export type GoalView = {
  id: string;
  kind: string;
  sport: string;
  raceName: string;
  distanceM: number | null;
  raceDate: string;
  targetTimeSec: number | null;
  note: string;
  status: string;
};

export type ProfileView = {
  // Identité et mesures
  firstName: string;
  birthDate: string;
  heightCm: string;
  sex: string;
  restingHr: string;

  // Course
  runExperienceLevel: string;
  runSurface: string;
  runDays: string[];
  runSessionsPerWeek: string;
  longRunDay: string;
  runWeeklyKm: string;
  easyPace: string;
  thresholdPace: string;
  racePace: string;
  pb5k: string;
  pb10k: string;
  pbHalf: string;
  pbMarathon: string;

  // Musculation
  experienceLevel: string;
  strengthDays: string[];
  strengthSessionsPerWeek: string;
  sessionDurationMin: string;
  strengthGoal: string;
  muscleGroups: string[];
  equipment: string[];
};

export type SettingsData = {
  profile: ProfileView;
  weights: WeightEntryView[];
  injuries: InjuryView[];
  goals: GoalView[];
  /** Vrai si une colonne attendue manque (migration V2 ou V3 non appliquée). */
  schemaOutdated: boolean;
};

function toIsoDate(value: string | null): string {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function toInput(value: number | string | null): string {
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

function emptyProfile(): ProfileView {
  return {
    firstName: "",
    birthDate: "",
    heightCm: "",
    sex: "",
    restingHr: "",

    runExperienceLevel: "",
    runSurface: "",
    runDays: [],
    runSessionsPerWeek: "",
    longRunDay: "",
    runWeeklyKm: "",
    easyPace: "",
    thresholdPace: "",
    racePace: "",
    pb5k: "",
    pb10k: "",
    pbHalf: "",
    pbMarathon: "",

    experienceLevel: "",
    strengthDays: [],
    strengthSessionsPerWeek: "",
    sessionDurationMin: "",
    strengthGoal: "",
    muscleGroups: [],
    equipment: [],
  };
}

type ProfileRow = {
  first_name: string | null;
  birth_date: string | null;
  height_cm: number | string | null;
  sex: string | null;
  resting_hr: number | null;
  experience_level: string | null;

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

  weekly_availability: unknown;
  session_duration_min: number | null;
  strength_goal: string | null;
  target_muscle_groups: unknown;
  equipment: unknown;
};

export async function getSettingsData(): Promise<SettingsData> {
  const empty: SettingsData = {
    profile: emptyProfile(),
    weights: [],
    injuries: [],
    goals: [],
    schemaOutdated: false,
  };

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return empty;
  }

  const userId = userData.user.id;

  const [profileResult, weightsResult, injuriesResult, goalsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, birth_date, height_cm, sex, resting_hr, experience_level, run_experience_level, run_surface, run_weekly_km, run_easy_pace_sec, run_threshold_pace_sec, run_race_pace_sec, pb_5k_sec, pb_10k_sec, pb_half_sec, pb_marathon_sec, weekly_availability, session_duration_min, strength_goal, target_muscle_groups, equipment",
      )
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("weight_entries")
      .select("id, measured_on, weight_kg, note_text")
      .eq("user_id", userId)
      .order("measured_on", { ascending: false })
      .limit(30)
      .returns<
        { id: string; measured_on: string; weight_kg: number | string; note_text: string | null }[]
      >(),
    supabase
      .from("injuries")
      .select("id, label, body_area, status, started_on, ended_on, note_text")
      .eq("user_id", userId)
      .order("status", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          label: string;
          body_area: string | null;
          status: string;
          started_on: string | null;
          ended_on: string | null;
          note_text: string | null;
        }[]
      >(),
    supabase
      .from("goals")
      .select(
        "id, goal_kind, sport, race_name, distance_m, race_date, target_time_sec, note_text, status",
      )
      .eq("user_id", userId)
      .order("status", { ascending: true })
      .order("race_date", { ascending: true, nullsFirst: false })
      .returns<
        {
          id: string;
          goal_kind: string;
          sport: string;
          race_name: string | null;
          distance_m: number | null;
          race_date: string | null;
          target_time_sec: number | null;
          note_text: string | null;
          status: string;
        }[]
      >(),
  ]);

  const profile = profileResult.data;
  const weights = weightsResult.data;
  const injuries = injuriesResult.data;
  const goals = goalsResult.data;

  // Une colonne manquante (code 42703) signifie qu'une migration n'est pas
  // encore appliquée. On l'affiche clairement plutôt que de laisser des
  // formulaires silencieusement vides.
  const schemaOutdated = Boolean(
    profileResult.error?.code === "42703" || goalsResult.error?.code === "42703",
  );

  const profileView = emptyProfile();

  if (profile) {
    profileView.firstName = profile.first_name ?? "";
    profileView.birthDate = toIsoDate(profile.birth_date);
    profileView.heightCm = toInput(profile.height_cm);
    profileView.sex = profile.sex ?? "";
    profileView.restingHr = toInput(profile.resting_hr);

    profileView.runExperienceLevel = profile.run_experience_level ?? "";
    profileView.runSurface = profile.run_surface ?? "";
    profileView.runWeeklyKm = toInput(profile.run_weekly_km);
    profileView.easyPace = secondsToPaceInput(profile.run_easy_pace_sec);
    profileView.thresholdPace = secondsToPaceInput(profile.run_threshold_pace_sec);
    profileView.racePace = secondsToPaceInput(profile.run_race_pace_sec);
    profileView.pb5k = secondsToTimeInput(profile.pb_5k_sec);
    profileView.pb10k = secondsToTimeInput(profile.pb_10k_sec);
    profileView.pbHalf = secondsToTimeInput(profile.pb_half_sec);
    profileView.pbMarathon = secondsToTimeInput(profile.pb_marathon_sec);

    profileView.experienceLevel = profile.experience_level ?? "";
    profileView.sessionDurationMin = toInput(profile.session_duration_min);
    profileView.strengthGoal = profile.strength_goal ?? "";
    profileView.muscleGroups = readStringList(profile.target_muscle_groups) as MuscleGroup[];
    profileView.equipment = readStringList(profile.equipment);

    const availability = readAvailability(profile.weekly_availability);
    profileView.runDays = availability.runDays;
    profileView.runSessionsPerWeek =
      availability.runSessionsPerWeek === null ? "" : String(availability.runSessionsPerWeek);
    profileView.longRunDay = availability.longRunDay ?? "";
    profileView.strengthDays = availability.strengthDays;
    profileView.strengthSessionsPerWeek =
      availability.strengthSessionsPerWeek === null
        ? ""
        : String(availability.strengthSessionsPerWeek);
  }

  return {
    profile: profileView,
    weights: (weights ?? []).map((entry) => ({
      id: entry.id,
      measuredOn: toIsoDate(entry.measured_on),
      weightKg: Number(entry.weight_kg),
      note: entry.note_text ?? "",
    })),
    injuries: (injuries ?? []).map((injury) => ({
      id: injury.id,
      label: injury.label,
      bodyArea: injury.body_area ?? "",
      status: injury.status,
      startedOn: toIsoDate(injury.started_on),
      endedOn: toIsoDate(injury.ended_on),
      note: injury.note_text ?? "",
    })),
    goals: (goals ?? []).map((goal) => ({
      id: goal.id,
      kind: goal.goal_kind,
      sport: goal.sport,
      raceName: goal.race_name ?? "",
      distanceM: goal.distance_m,
      raceDate: toIsoDate(goal.race_date),
      targetTimeSec: goal.target_time_sec,
      note: goal.note_text ?? "",
      status: goal.status,
    })),
    schemaOutdated,
  };
}
