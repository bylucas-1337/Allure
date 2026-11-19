/**
 * Onboarding — types, options et validation.
 *
 * Ce module est partagé entre le navigateur (assistant) et le serveur
 * (Server Action) : il ne contient donc aucun accès Supabase ni de secret.
 * La validation est ainsi identique des deux côtés.
 *
 * L'assistant sépare volontairement la course et la musculation :
 *   1. Toi (identité, mesures)
 *   2. Course — habitude
 *   3. Course — allures et records
 *   4. Course — objectif
 *   5. Muscu — cadre et préférences
 *   6. Santé — zones sensibles
 *   7. Récapitulatif
 */

import {
  AVAILABILITY_DAYS,
  DAY_VALUES,
  type AvailabilityDay,
} from "./availability";
import { EQUIPMENT, MUSCLE_GROUPS, STRENGTH_GOALS } from "./settings";

export { AVAILABILITY_DAYS };
export type { AvailabilityDay };

const MUSCLE_VALUES: readonly string[] = MUSCLE_GROUPS.map((item) => item.value);
const EQUIPMENT_VALUES: readonly string[] = EQUIPMENT.map((item) => item.value);
const STRENGTH_GOAL_VALUES: readonly string[] = STRENGTH_GOALS.map((item) => item.value);

export const SEX_OPTIONS = [
  { value: "", label: "Je ne sais pas" },
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
  { value: "other", label: "Autre" },
  { value: "prefer_not_to_say", label: "Je préfère ne pas répondre" },
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "", label: "Je ne sais pas" },
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
] as const;

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

export const INJURY_STATUS_OPTIONS = [
  { value: "active", label: "Encore douloureux" },
  { value: "recovering", label: "En récupération" },
  { value: "recovered", label: "Guéri" },
] as const;

export type InjuryStatus = (typeof INJURY_STATUS_OPTIONS)[number]["value"];

const INJURY_STATUS_VALUES: readonly string[] = INJURY_STATUS_OPTIONS.map(
  (option) => option.value,
);

const RUN_EXPERIENCE_VALUES: readonly string[] = RUN_EXPERIENCE_OPTIONS.map(
  (option) => option.value,
);
const RUN_SURFACE_VALUES: readonly string[] = RUN_SURFACE_OPTIONS.map(
  (option) => option.value,
);
const MUSCU_EXPERIENCE_VALUES: readonly string[] = EXPERIENCE_OPTIONS.map(
  (option) => option.value,
);

export type InjuryDraft = {
  /** Clé locale, jamais enregistrée telle quelle. */
  key: string;
  label: string;
  bodyArea: string;
  status: InjuryStatus;
  startedOn: string;
};

export type GoalDraft = {
  enabled: boolean;
  raceName: string;
  distanceKm: string;
  raceDate: string;
  targetTime: string;
};

export type OnboardingDraft = {
  // Toi
  firstName: string;
  birthDate: string;
  heightCm: string;
  sex: string;
  restingHr: string;
  weightKg: string;
  weightDate: string;

  // Course
  runExperienceLevel: string;
  runSurface: string;
  runDays: AvailabilityDay[];
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
  goal: GoalDraft;

  // Muscu
  strengthDays: AvailabilityDay[];
  strengthSessionsPerWeek: string;
  sessionDurationMin: string;
  strengthGoal: string;
  muscleGroups: string[];
  equipment: string[];
  experienceLevel: string;

  // Santé
  injuries: InjuryDraft[];
};

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const LAST_STEP: StepNumber = 7;

/** Libellé lisible d'une valeur d'option, avec repli sur la valeur brute. */
export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export const ONBOARDING_STEPS = [
  { step: 1, title: "Toi", subtitle: "Quelques repères, sans pression." },
  {
    step: 2,
    title: "Course — ton habitude",
    subtitle: "Combien tu cours, quand, et sur quel terrain.",
  },
  {
    step: 3,
    title: "Course — tes allures",
    subtitle: "Même approximatives : elles serviront de repères.",
  },
  {
    step: 4,
    title: "Course — ton objectif",
    subtitle: "Une course en vue, ou pas encore.",
  },
  {
    step: 5,
    title: "Muscu — ton cadre",
    subtitle: "Ce que tu veux travailler, avec quoi, combien de temps.",
  },
  {
    step: 6,
    title: "Santé — tes zones sensibles",
    subtitle: "Pour adapter, pas pour interdire.",
  },
  {
    step: 7,
    title: "Récapitulatif",
    subtitle: "Une dernière vérification, et c’est parti.",
  },
] as const;

export function createEmptyDraft(): OnboardingDraft {
  return {
    firstName: "",
    birthDate: "",
    heightCm: "",
    sex: "",
    restingHr: "",
    weightKg: "",
    weightDate: "",

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
    goal: {
      enabled: false,
      raceName: "",
      distanceKm: "",
      raceDate: "",
      targetTime: "",
    },

    strengthDays: [],
    strengthSessionsPerWeek: "",
    sessionDurationMin: "",
    strengthGoal: "",
    muscleGroups: [],
    equipment: [],
    experienceLevel: "",

    injuries: [],
  };
}

/** Valeurs acceptées par les champs contrôlés, venant de la base. */
export function parseOptionalNumber(raw: string): number | null {
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

/** Chrono d'un champ `type="time"` : « 01:45 » vaut 1 h 45. */
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

/** Vérifie qu'une date `yyyy-mm-dd` existe réellement. */
export function isIsoDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return false;
  }

  const date = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(raw);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function ageFromIsoDate(isoDate: string): number | null {
  if (!isIsoDate(isoDate)) {
    return null;
  }

  const birth = new Date(`${isoDate}T00:00:00Z`);
  const today = new Date(`${isoToday()}T00:00:00Z`);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age;
}

export type FieldErrors = Record<string, string>;

/** Résultat renvoyé par la Server Action d'onboarding. */
export type SaveOnboardingResult =
  | { ok: true; completed: boolean; step: StepNumber }
  | { ok: false; step: StepNumber; message?: string; fieldErrors?: FieldErrors };

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

/**
 * Valide uniquement les champs de l'étape concernée.
 * Les étapes suivantes peuvent rester vides : elles ne bloquent pas.
 */
export function validateStep(step: StepNumber, draft: OnboardingDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 1) {
    if (draft.firstName.trim().length > 80) {
      errors.firstName = "80 caractères maximum.";
    }

    if (draft.birthDate !== "") {
      const age = ageFromIsoDate(draft.birthDate);
      if (age === null) {
        errors.birthDate = "Cette date n’est pas valide.";
      } else if (age < 10 || age > 110) {
        errors.birthDate = "Vérifie la date de naissance : l’âge doit rester réaliste.";
      }
    }

    const height = parseOptionalNumber(draft.heightCm);
    if (height === null) {
      errors.heightCm = "Indique ta taille en centimètres.";
    } else if (height < 50 || height > 250) {
      errors.heightCm = "La taille doit être comprise entre 50 et 250 cm.";
    }

    const weight = parseOptionalNumber(draft.weightKg);
    if (weight === null) {
      errors.weightKg = "Indique ton poids en kilos.";
    } else if (weight < 20 || weight > 400) {
      errors.weightKg = "Le poids doit être compris entre 20 et 400 kg.";
    }

    if (draft.weightDate !== "") {
      if (!isIsoDate(draft.weightDate)) {
        errors.weightDate = "Cette date n’est pas valide.";
      } else if (draft.weightDate > isoToday()) {
        errors.weightDate = "La date ne peut pas être dans le futur.";
      }
    }

    if (draft.restingHr !== "") {
      const restingHr = parseOptionalNumber(draft.restingHr);
      if (restingHr === null || !Number.isInteger(restingHr)) {
        errors.restingHr = "Indique un nombre entier.";
      } else if (restingHr < 25 || restingHr > 120) {
        errors.restingHr = "Entre 25 et 120 battements par minute.";
      }
    }
  }

  if (step === 2) {
    if (draft.runDays.some((day) => !DAY_VALUES.includes(day))) {
      errors.runDays = "Un des jours sélectionnés n’est pas reconnu.";
    }

    if (draft.runSessionsPerWeek !== "") {
      const sessions = parseOptionalNumber(draft.runSessionsPerWeek);
      if (sessions === null || !Number.isInteger(sessions)) {
        errors.runSessionsPerWeek = "Indique un nombre entier.";
      } else if (sessions < 1 || sessions > 14) {
        errors.runSessionsPerWeek = "Entre 1 et 14 séances de course par semaine.";
      }
    }

    if (draft.runWeeklyKm !== "") {
      const km = parseOptionalNumber(draft.runWeeklyKm);
      if (km === null || km < 0) {
        errors.runWeeklyKm = "Indique un volume en kilomètres.";
      } else if (km > 500) {
        errors.runWeeklyKm = "Le volume doit rester inférieur à 500 km par semaine.";
      }
    }

    if (draft.runExperienceLevel !== "" && !RUN_EXPERIENCE_VALUES.includes(draft.runExperienceLevel)) {
      errors.runExperienceLevel = "Choix invalide.";
    }

    if (draft.runSurface !== "" && !RUN_SURFACE_VALUES.includes(draft.runSurface)) {
      errors.runSurface = "Choix invalide.";
    }

    if (draft.longRunDay !== "" && !DAY_VALUES.includes(draft.longRunDay)) {
      errors.longRunDay = "Choix invalide.";
    }
  }

  if (step === 3) {
    validatePace(errors, "easyPace", draft.easyPace, "Allure facile");
    validatePace(errors, "thresholdPace", draft.thresholdPace, "Allure seuil");
    validatePace(errors, "racePace", draft.racePace, "Allure course");
    validateRecord(errors, "pb5k", draft.pb5k, "Record 5 km");
    validateRecord(errors, "pb10k", draft.pb10k, "Record 10 km");
    validateRecord(errors, "pbHalf", draft.pbHalf, "Record semi-marathon");
    validateRecord(errors, "pbMarathon", draft.pbMarathon, "Record marathon");
  }

  if (step === 4 && draft.goal.enabled) {
    if (draft.goal.raceName.trim().length > 120) {
      errors.goalRaceName = "120 caractères maximum.";
    }

    const distance = parseOptionalNumber(draft.goal.distanceKm);
    if (distance === null || distance <= 0) {
      errors.goalDistanceKm = "Indique la distance de la course en kilomètres.";
    } else if (distance > 1000) {
      errors.goalDistanceKm = "La distance doit rester inférieure à 1000 km.";
    }

    if (draft.goal.raceDate === "") {
      errors.goalDate = "La date de la course est nécessaire.";
    } else if (!isIsoDate(draft.goal.raceDate)) {
      errors.goalDate = "Cette date n’est pas valide.";
    }

    if (draft.goal.targetTime !== "" && parseClockToSeconds(draft.goal.targetTime) === null) {
      errors.goalTime = "Utilise le format heures:minutes:secondes.";
    }
  }

  if (step === 5) {
    if (draft.strengthDays.some((day) => !DAY_VALUES.includes(day))) {
      errors.strengthDays = "Un des jours sélectionnés n’est pas reconnu.";
    }

    if (draft.strengthSessionsPerWeek !== "") {
      const sessions = parseOptionalNumber(draft.strengthSessionsPerWeek);
      if (sessions === null || !Number.isInteger(sessions)) {
        errors.strengthSessionsPerWeek = "Indique un nombre entier.";
      } else if (sessions < 1 || sessions > 14) {
        errors.strengthSessionsPerWeek = "Entre 1 et 14 séances de musculation par semaine.";
      }
    }

    if (draft.sessionDurationMin !== "") {
      const duration = parseOptionalNumber(draft.sessionDurationMin);
      if (duration === null || !Number.isInteger(duration)) {
        errors.sessionDurationMin = "Indique un nombre entier de minutes.";
      } else if (duration < 10 || duration > 240) {
        errors.sessionDurationMin = "Entre 10 et 240 minutes.";
      }
    }

    if (draft.strengthGoal !== "" && !STRENGTH_GOAL_VALUES.includes(draft.strengthGoal)) {
      errors.strengthGoal = "Choix invalide.";
    }

    if (draft.experienceLevel !== "" && !MUSCU_EXPERIENCE_VALUES.includes(draft.experienceLevel)) {
      errors.experienceLevel = "Choix invalide.";
    }

    if (draft.muscleGroups.some((group) => !MUSCLE_VALUES.includes(group))) {
      errors.muscleGroups = "Un des groupes musculaires n’est pas reconnu.";
    }

    if (draft.equipment.some((item) => !EQUIPMENT_VALUES.includes(item))) {
      errors.equipment = "Un des équipements n’est pas reconnu.";
    }
  }

  if (step === 6) {
    if (draft.injuries.length > 10) {
      errors.injuries = "Dix blessures suffisent pour commencer.";
    }

    draft.injuries.forEach((injury, index) => {
      if (injury.label.trim() === "") {
        errors[`injuries.${index}.label`] = "Donne un nom court à cette gêne.";
      } else if (injury.label.trim().length > 120) {
        errors[`injuries.${index}.label`] = "120 caractères maximum.";
      }

      if (!INJURY_STATUS_VALUES.includes(injury.status)) {
        errors[`injuries.${index}.status`] = "Choisis un état valide.";
      }

      if (injury.startedOn !== "") {
        if (!isIsoDate(injury.startedOn)) {
          errors[`injuries.${index}.startedOn`] = "Cette date n’est pas valide.";
        } else if (injury.startedOn > isoToday()) {
          errors[`injuries.${index}.startedOn`] = "La date ne peut pas être dans le futur.";
        }
      }
    });
  }

  return errors;
}

/* -------------------------------------------------------------------------
 * Lecture du formulaire
 * ---------------------------------------------------------------------- */

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readDayList(formData: FormData, name: string): AvailabilityDay[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .filter((value) => DAY_VALUES.includes(value)) as AvailabilityDay[];
}

function readInjuries(formData: FormData): InjuryDraft[] {
  const raw = formData.get("injuries");
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .slice(0, 10)
      .map((item, index) => {
        const status = typeof item.status === "string" ? item.status : "";
        return {
          key: typeof item.key === "string" ? item.key : `import-${index}`,
          label: typeof item.label === "string" ? item.label.trim() : "",
          bodyArea: typeof item.bodyArea === "string" ? item.bodyArea.trim() : "",
          status: INJURY_STATUS_VALUES.includes(status)
            ? (status as InjuryStatus)
            : "active",
          startedOn: typeof item.startedOn === "string" ? item.startedOn : "",
        };
      });
  } catch {
    return [];
  }
}

export function draftFromFormData(formData: FormData): OnboardingDraft {
  const muscleGroups = formData
    .getAll("muscleGroups")
    .filter((value): value is string => typeof value === "string")
    .filter((value) => MUSCLE_VALUES.includes(value));

  const equipment = formData
    .getAll("equipment")
    .filter((value): value is string => typeof value === "string")
    .filter((value) => EQUIPMENT_VALUES.includes(value));

  return {
    firstName: readText(formData, "firstName"),
    birthDate: readText(formData, "birthDate"),
    heightCm: readText(formData, "heightCm"),
    sex: readText(formData, "sex"),
    restingHr: readText(formData, "restingHr"),
    weightKg: readText(formData, "weightKg"),
    weightDate: readText(formData, "weightDate"),

    runExperienceLevel: readText(formData, "runExperienceLevel"),
    runSurface: readText(formData, "runSurface"),
    runDays: readDayList(formData, "runDays"),
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
    goal: {
      enabled:
        readText(formData, "goalEnabled") === "on" ||
        readText(formData, "goalEnabled") === "true",
      raceName: readText(formData, "goalRaceName"),
      distanceKm: readText(formData, "goalDistanceKm"),
      raceDate: readText(formData, "goalDate"),
      targetTime: readText(formData, "goalTime"),
    },

    strengthDays: readDayList(formData, "strengthDays"),
    strengthSessionsPerWeek: readText(formData, "strengthSessionsPerWeek"),
    sessionDurationMin: readText(formData, "sessionDurationMin"),
    strengthGoal: readText(formData, "strengthGoal"),
    muscleGroups,
    equipment,
    experienceLevel: readText(formData, "experienceLevel"),

    injuries: readInjuries(formData),
  };
}

/** Convertit le brouillon en lignes Supabase (formats attendus par le schéma). */
export function toProfileRow(draft: OnboardingDraft) {
  const runSessions = parseOptionalNumber(draft.runSessionsPerWeek);
  const strengthSessions = parseOptionalNumber(draft.strengthSessionsPerWeek);

  return {
    first_name: draft.firstName === "" ? null : draft.firstName,
    birth_date: draft.birthDate === "" ? null : draft.birthDate,
    height_cm: parseOptionalNumber(draft.heightCm),
    sex: draft.sex === "" ? null : draft.sex,
    resting_hr: parseOptionalNumber(draft.restingHr),
    experience_level: draft.experienceLevel === "" ? null : draft.experienceLevel,

    run_experience_level:
      draft.runExperienceLevel === "" ? null : draft.runExperienceLevel,
    run_surface: draft.runSurface === "" ? null : draft.runSurface,
    run_weekly_km: parseOptionalNumber(draft.runWeeklyKm),
    run_easy_pace_sec: parsePaceToSeconds(draft.easyPace),
    run_threshold_pace_sec: parsePaceToSeconds(draft.thresholdPace),
    run_race_pace_sec: parsePaceToSeconds(draft.racePace),
    pb_5k_sec: parseTimeToSeconds(draft.pb5k),
    pb_10k_sec: parseTimeToSeconds(draft.pb10k),
    pb_half_sec: parseTimeToSeconds(draft.pbHalf),
    pb_marathon_sec: parseTimeToSeconds(draft.pbMarathon),

    weekly_availability: {
      runDays: draft.runDays,
      runSessionsPerWeek: runSessions,
      longRunDay: draft.longRunDay === "" ? null : draft.longRunDay,
      strengthDays: draft.strengthDays,
      strengthSessionsPerWeek: strengthSessions,
    },

    session_duration_min: parseOptionalNumber(draft.sessionDurationMin),
    strength_goal: draft.strengthGoal === "" ? null : draft.strengthGoal,
    target_muscle_groups: draft.muscleGroups,
    equipment: draft.equipment,
  };
}

export function toWeightRow(draft: OnboardingDraft) {
  const weight = parseOptionalNumber(draft.weightKg);
  if (weight === null) {
    return null;
  }

  return {
    measured_on: draft.weightDate === "" ? isoToday() : draft.weightDate,
    weight_kg: weight,
  };
}

export function toInjuryRows(draft: OnboardingDraft) {
  return draft.injuries
    .filter((injury) => injury.label.trim() !== "")
    .map((injury) => ({
      label: injury.label.trim(),
      body_area: injury.bodyArea === "" ? null : injury.bodyArea,
      status: injury.status,
      started_on: injury.startedOn === "" ? null : injury.startedOn,
    }));
}

export function toGoalRow(draft: OnboardingDraft) {
  if (!draft.goal.enabled) {
    return null;
  }

  const distanceKm = parseOptionalNumber(draft.goal.distanceKm);
  if (distanceKm === null || distanceKm <= 0 || draft.goal.raceDate === "") {
    return null;
  }

  return {
    sport: "run" as const,
    goal_kind: "main" as const,
    race_name: draft.goal.raceName === "" ? null : draft.goal.raceName,
    distance_m: Math.round(distanceKm * 1000),
    race_date: draft.goal.raceDate,
    target_time_sec: parseClockToSeconds(draft.goal.targetTime),
    status: "active" as const,
  };
}
