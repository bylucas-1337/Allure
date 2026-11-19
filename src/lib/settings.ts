/**
 * Réglages — options, types et validation.
 *
 * Partagé entre le navigateur et les Server Actions : aucune donnée sensible,
 * aucun accès Supabase. Les listes servent aussi bien au formulaire qu'à
 * l'affichage.
 */

export const MUSCLE_GROUPS = [
  { value: "chest", label: "Pectoraux" },
  { value: "back", label: "Dos" },
  { value: "shoulders", label: "Épaules" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "quads", label: "Quadriceps" },
  { value: "hamstrings", label: "Ischio-jambiers" },
  { value: "glutes", label: "Fessiers" },
  { value: "calves", label: "Mollets" },
  { value: "core", label: "Tronc / abdos" },
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]["value"];

export const EQUIPMENT = [
  { value: "barbell", label: "Barre et disques" },
  { value: "dumbbells", label: "Haltères" },
  { value: "machines", label: "Machines de salle" },
  { value: "cables", label: "Poulies" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "bands", label: "Élastiques" },
  { value: "pullup_bar", label: "Barre de traction" },
  { value: "bench", label: "Banc" },
  { value: "bodyweight", label: "Poids du corps seulement" },
  { value: "trx", label: "Sangles / TRX" },
] as const;

export type EquipmentKey = (typeof EQUIPMENT)[number]["value"];

export const STRENGTH_GOALS = [
  {
    value: "hypertrophy",
    label: "Prendre du muscle",
    hint: "Volume et séries multiples ; charges modérées à lourdes.",
  },
  {
    value: "strength",
    label: "Gagner en force",
    hint: "Charges lourdes, peu de répétitions, exercices de base.",
  },
  {
    value: "endurance",
    label: "Endurance musculaire",
    hint: "Séries plus longues, récupérations courtes.",
  },
  {
    value: "recomposition",
    label: "Perdre du gras en gardant du muscle",
    hint: "Maintien des charges et volume régulier.",
  },
  {
    value: "health",
    label: "Bouger régulièrement, en santé",
    hint: "Régularité avant performance ; on progresse sans forcer.",
  },
] as const;

export type StrengthGoal = (typeof STRENGTH_GOALS)[number]["value"];

export const RUN_EXPERIENCE_OPTIONS = [
  { value: "", label: "Je ne sais pas" },
  { value: "beginner", label: "Je débute ou je reprends" },
  { value: "intermediate", label: "Je cours régulièrement" },
  { value: "advanced", label: "Je cours depuis des années, avec des courses" },
] as const;

export const RUN_SURFACE_OPTIONS = [
  { value: "", label: "Je ne sais pas / un peu de tout" },
  { value: "road", label: "Route" },
  { value: "trail", label: "Trail, chemins" },
  { value: "treadmill", label: "Tapis de course" },
  { value: "mixed", label: "Un mélange" },
] as const;

export type RunSurface = (typeof RUN_SURFACE_OPTIONS)[number]["value"];

export const DAY_OPTIONS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mer" },
  { value: "thu", label: "Jeu" },
  { value: "fri", label: "Ven" },
  { value: "sat", label: "Sam" },
  { value: "sun", label: "Dim" },
] as const;

export const RECORD_FIELDS = [  { name: "pb5k", label: "5 km", distance: "5 km" },
  { name: "pb10k", label: "10 km", distance: "10 km" },
  { name: "pbHalf", label: "Semi-marathon", distance: "21,1 km" },
  { name: "pbMarathon", label: "Marathon", distance: "42,2 km" },
] as const;

export const INJURY_STATUSES = [
  { value: "active", label: "Encore douloureux" },
  { value: "recovering", label: "En récupération" },
  { value: "recovered", label: "Guéri" },
] as const;

export type InjuryStatus = (typeof INJURY_STATUSES)[number]["value"];

export const GOAL_KINDS = [
  { value: "main", label: "Objectif principal" },
  { value: "secondary", label: "Course secondaire" },
] as const;

export type GoalKind = (typeof GOAL_KINDS)[number]["value"];

const MUSCLE_VALUES: readonly string[] = MUSCLE_GROUPS.map((item) => item.value);
const EQUIPMENT_VALUES: readonly string[] = EQUIPMENT.map((item) => item.value);
const STRENGTH_GOAL_VALUES: readonly string[] = STRENGTH_GOALS.map((item) => item.value);
const INJURY_STATUS_VALUES: readonly string[] = INJURY_STATUSES.map((item) => item.value);
const GOAL_KIND_VALUES: readonly string[] = GOAL_KINDS.map((item) => item.value);
const RUN_EXPERIENCE_VALUES: readonly string[] = RUN_EXPERIENCE_OPTIONS.map(
  (item) => item.value,
);
const RUN_SURFACE_VALUES: readonly string[] = RUN_SURFACE_OPTIONS.map((item) => item.value);

export const RESET_CONFIRMATION = "SUPPRIMER";

export const RPE_LABELS: Record<number, string> = {
  1: "Très facile",
  2: "Facile",
  3: "Modéré",
  4: "Dur",
  5: "Très dur",
};

export const FORM_LABELS: Record<number, string> = {
  1: "Très fatigué",
  2: "Fatigué",
  3: "Correct",
  4: "En forme",
  5: "Très en forme",
};

export const FATIGUE_LABELS: Record<number, string> = {
  1: "Frais",
  2: "Léger",
  3: "Modéré",
  4: "Fatigué",
  5: "Épuisé",
};

export type FieldErrors = Record<string, string>;

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
};

export const IDLE_STATE: ActionState = { status: "idle" };

export function todayIsoDate(): string {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function isIsoDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return false;
  }

  const date = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(raw);
}

export function parseNumber(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "") {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parseTimeToSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const parts = trimmed.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((value) => !Number.isInteger(value) || value < 0)) {
    return null;
  }

  const [hours, minutes, seconds = 0] =
    numbers.length === 3 ? numbers : [0, numbers[0], numbers[1]];

  if (minutes > 59 || seconds > 59) {
    return null;
  }

  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function secondsToTimeInput(totalSeconds: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return "";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Chrono saisi dans un champ `type="time"` : « 01:45 » vaut 1 h 45,
 * contrairement à un record écrit « 22:30 » (22 min 30 s).
 */
export function parseClockToSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const parts = trimmed.split(":");
  if (parts.length !== 2 && parts.length !== 3) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((value) => !Number.isInteger(value) || value < 0)) {
    return null;
  }

  const [hours, minutes, seconds = 0] =
    numbers.length === 3 ? numbers : [numbers[0], numbers[1], 0];

  if (minutes > 59 || seconds > 59) {
    return null;
  }

  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/** Allure en minutes:secondes par kilomètre → secondes. */
export function parsePaceToSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const parts = trimmed.split(":");

  if (parts.length === 1) {
    const minutes = Number(parts[0]);
    return Number.isInteger(minutes) && minutes > 0 ? minutes * 60 : null;
  }

  if (parts.length !== 2) {
    return null;
  }

  const [minutes, seconds] = parts.map((part) => Number(part));
  if (!Number.isInteger(minutes) || !Number.isInteger(seconds)) {
    return null;
  }

  if (minutes < 0 || seconds < 0 || seconds > 59) {
    return null;
  }

  const total = minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function secondsToPaceInput(totalSeconds: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return "";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------
 * Lecture de formulaires
 * ---------------------------------------------------------------------- */

export function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function readList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */

export function validateProfile(input: {
  firstName: string;
  birthDate: string;
  heightCm: string;
  sex: string;
  experienceLevel: string;
  restingHr: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (input.firstName.length > 80) {
    errors.firstName = "80 caractères maximum.";
  }

  if (input.birthDate !== "") {
    if (!isIsoDate(input.birthDate)) {
      errors.birthDate = "Cette date n’est pas valide.";
    } else if (input.birthDate > todayIsoDate()) {
      errors.birthDate = "La date ne peut pas être dans le futur.";
    }
  }

  const height = parseNumber(input.heightCm);
  if (height === null) {
    errors.heightCm = "Indique ta taille en centimètres.";
  } else if (height < 50 || height > 250) {
    errors.heightCm = "Entre 50 et 250 cm.";
  }

  if (input.sex !== "" && !["female", "male", "other", "prefer_not_to_say"].includes(input.sex)) {
    errors.sex = "Choix invalide.";
  }

  if (
    input.experienceLevel !== "" &&
    !["beginner", "intermediate", "advanced"].includes(input.experienceLevel)
  ) {
    errors.experienceLevel = "Choix invalide.";
  }

  if (input.restingHr !== "") {
    const restingHr = parseNumber(input.restingHr);
    if (restingHr === null || !Number.isInteger(restingHr)) {
      errors.restingHr = "Indique un nombre entier.";
    } else if (restingHr < 25 || restingHr > 120) {
      errors.restingHr = "Entre 25 et 120 battements par minute.";
    }
  }

  return errors;
}

function validatePace(
  errors: FieldErrors,
  field: string,
  raw: string,
  label: string,
): void {
  if (raw === "") {
    return;
  }

  const seconds = parsePaceToSeconds(raw);
  if (seconds === null) {
    errors[field] = `${label} : utilise minutes:secondes, par exemple 5:30.`;
  } else if (seconds < 120 || seconds > 1200) {
    errors[field] = `${label} : allure invraisemblable (entre 2:00 et 20:00 par km).`;
  }
}

function validateRecord(
  errors: FieldErrors,
  field: string,
  raw: string,
  label: string,
): void {
  if (raw === "") {
    return;
  }

  const seconds = parseTimeToSeconds(raw);
  if (seconds === null) {
    errors[field] = `${label} : utilise minutes:secondes ou heures:minutes:secondes.`;
  } else if (seconds < 600 || seconds > 40000) {
    errors[field] = `${label} : chrono invraisemblable.`;
  }
}

export function validateRunProfile(input: {
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
}): FieldErrors {
  const errors: FieldErrors = {};

  if (input.runExperienceLevel !== "" && !RUN_EXPERIENCE_VALUES.includes(input.runExperienceLevel)) {
    errors.runExperienceLevel = "Choix invalide.";
  }

  if (input.runSurface !== "" && !RUN_SURFACE_VALUES.includes(input.runSurface)) {
    errors.runSurface = "Choix invalide.";
  }

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  if (input.runDays.some((day) => !validDays.includes(day))) {
    errors.runDays = "Un des jours sélectionnés n’est pas reconnu.";
  }

  if (input.longRunDay !== "" && !validDays.includes(input.longRunDay)) {
    errors.longRunDay = "Choix invalide.";
  }

  if (input.runSessionsPerWeek !== "") {
    const sessions = parseNumber(input.runSessionsPerWeek);
    if (sessions === null || !Number.isInteger(sessions)) {
      errors.runSessionsPerWeek = "Indique un nombre entier.";
    } else if (sessions < 1 || sessions > 14) {
      errors.runSessionsPerWeek = "Entre 1 et 14 séances par semaine.";
    }
  }

  if (input.runWeeklyKm !== "") {
    const km = parseNumber(input.runWeeklyKm);
    if (km === null || km < 0) {
      errors.runWeeklyKm = "Indique un volume en kilomètres.";
    } else if (km > 500) {
      errors.runWeeklyKm = "Le volume doit rester inférieur à 500 km par semaine.";
    }
  }

  validatePace(errors, "easyPace", input.easyPace, "Allure facile");
  validatePace(errors, "thresholdPace", input.thresholdPace, "Allure seuil");
  validatePace(errors, "racePace", input.racePace, "Allure de course");
  validateRecord(errors, "pb5k", input.pb5k, "Record 5 km");
  validateRecord(errors, "pb10k", input.pb10k, "Record 10 km");
  validateRecord(errors, "pbHalf", input.pbHalf, "Record semi-marathon");
  validateRecord(errors, "pbMarathon", input.pbMarathon, "Record marathon");

  return errors;
}

export function validateStrength(input: {
  strengthDays: string[];
  strengthSessionsPerWeek: string;
  sessionDurationMin: string;
  strengthGoal: string;
  muscleGroups: string[];
  equipment: string[];
  experienceLevel: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  if (input.strengthDays.some((day) => !validDays.includes(day))) {
    errors.strengthDays = "Un des jours sélectionnés n’est pas reconnu.";
  }

  if (input.strengthSessionsPerWeek !== "") {
    const sessions = parseNumber(input.strengthSessionsPerWeek);
    if (sessions === null || !Number.isInteger(sessions)) {
      errors.strengthSessionsPerWeek = "Indique un nombre entier.";
    } else if (sessions < 1 || sessions > 14) {
      errors.strengthSessionsPerWeek = "Entre 1 et 14 séances par semaine.";
    }
  }

  if (input.sessionDurationMin !== "") {
    const duration = parseNumber(input.sessionDurationMin);
    if (duration === null || !Number.isInteger(duration)) {
      errors.sessionDurationMin = "Indique un nombre entier de minutes.";
    } else if (duration < 10 || duration > 240) {
      errors.sessionDurationMin = "Entre 10 et 240 minutes.";
    }
  }

  if (
    input.experienceLevel !== "" &&
    !["beginner", "intermediate", "advanced"].includes(input.experienceLevel)
  ) {
    errors.experienceLevel = "Choix invalide.";
  }

  if (input.strengthGoal !== "" && !STRENGTH_GOAL_VALUES.includes(input.strengthGoal)) {
    errors.strengthGoal = "Choix invalide.";
  }

  if (input.muscleGroups.some((group) => !MUSCLE_VALUES.includes(group))) {
    errors.muscleGroups = "Un des groupes musculaires n’est pas reconnu.";
  }

  if (input.equipment.some((item) => !EQUIPMENT_VALUES.includes(item))) {
    errors.equipment = "Un des équipements n’est pas reconnu.";
  }

  return errors;
}

export function validateWeight(input: { weightKg: string; measuredOn: string }): FieldErrors {
  const errors: FieldErrors = {};

  const weight = parseNumber(input.weightKg);
  if (weight === null) {
    errors.weightKg = "Indique un poids en kilos.";
  } else if (weight < 20 || weight > 400) {
    errors.weightKg = "Entre 20 et 400 kg.";
  }

  if (input.measuredOn !== "") {
    if (!isIsoDate(input.measuredOn)) {
      errors.measuredOn = "Cette date n’est pas valide.";
    } else if (input.measuredOn > todayIsoDate()) {
      errors.measuredOn = "La date ne peut pas être dans le futur.";
    }
  }

  return errors;
}

export function validateInjury(input: {
  label: string;
  status: string;
  startedOn: string;
  endedOn: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (input.label.trim() === "") {
    errors.label = "Donne un nom court à cette gêne.";
  } else if (input.label.trim().length > 120) {
    errors.label = "120 caractères maximum.";
  }

  if (!INJURY_STATUS_VALUES.includes(input.status)) {
    errors.status = "Choix invalide.";
  }

  if (input.startedOn !== "" && !isIsoDate(input.startedOn)) {
    errors.startedOn = "Cette date n’est pas valide.";
  }

  if (input.endedOn !== "" && !isIsoDate(input.endedOn)) {
    errors.endedOn = "Cette date n’est pas valide.";
  }

  if (
    input.startedOn !== "" &&
    input.endedOn !== "" &&
    isIsoDate(input.startedOn) &&
    isIsoDate(input.endedOn) &&
    input.endedOn < input.startedOn
  ) {
    errors.endedOn = "La fin ne peut pas précéder le début.";
  }

  return errors;
}

export function validateGoal(input: {
  kind: string;
  raceName: string;
  distanceKm: string;
  raceDate: string;
  targetTime: string;
  note?: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!GOAL_KIND_VALUES.includes(input.kind)) {
    errors.kind = "Choix invalide.";
  }

  if (input.raceName.length > 120) {
    errors.raceName = "120 caractères maximum.";
  }

  if (input.distanceKm !== "") {
    const distance = parseNumber(input.distanceKm);
    if (distance === null || distance <= 0) {
      errors.distanceKm = "Indique une distance en kilomètres.";
    } else if (distance > 1000) {
      errors.distanceKm = "Moins de 1000 km.";
    }
  } else if (input.kind === "main") {
    errors.distanceKm = "L’objectif principal a besoin d’une distance.";
  }

  if (input.raceDate === "") {
    if (input.kind === "main") {
      errors.raceDate = "La date est nécessaire pour un objectif principal.";
    }
  } else if (!isIsoDate(input.raceDate)) {
    errors.raceDate = "Cette date n’est pas valide.";
  }

  if (input.targetTime !== "" && parseClockToSeconds(input.targetTime) === null) {
    errors.targetTime = "Format attendu : heures:minutes (ou heures:minutes:secondes).";
  }

  if (input.note && input.note.length > 500) {
    errors.note = "500 caractères maximum.";
  }

  return errors;
}
