export type StrengthSet = {
  reps: string;
  weightKg: string;
};

export type StrengthExercise = {
  name: string;
  sets: StrengthSet[];
};

export const RPE_OPTIONS = [1, 2, 3, 4, 5];

export type FieldErrors = Record<string, string>;

export type SaveStrengthSessionInput = {
  sessionDate: string;
  durationMin: string;
  durationSec: string;
  rpe: string;
  notes: string;
  exercisesJson: string;
};

export function validateStrengthSession(input: SaveStrengthSessionInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate)) {
    errors.sessionDate = "Date invalide.";
  }

  const duration = Number(input.durationMin || 0);
  const seconds = input.durationSec === "" ? 0 : Number(input.durationSec);
  if (!Number.isInteger(duration) || duration < 0 || duration > 600) {
    errors.durationMin = "Minutes entre 0 et 600.";
  }
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
    errors.durationSec = "Secondes entre 0 et 59.";
  }
  if (duration === 0 && seconds === 0) {
    errors.durationMin = "La durée doit être supérieure à zéro.";
  }

  if (input.rpe !== "") {
    const rpe = Number(input.rpe);
    if (!Number.isInteger(rpe) || rpe < 1 || rpe > 5) {
      errors.rpe = "Ressenti entre 1 et 5.";
    }
  }

  if (input.notes.length > 500) {
    errors.notes = "500 caractères maximum.";
  }

  try {
    const parsed = JSON.parse(input.exercisesJson || "[]");
    if (!Array.isArray(parsed)) {
      errors.exercises = "Format des exercices invalide.";
    }
  } catch {
    errors.exercises = "Format des exercices invalide.";
  }

  return errors;
}

export function parseExercises(json: string): StrengthExercise[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        sets: Array.isArray(item.sets)
          ? item.sets
              .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
              .map((s) => ({
                reps: typeof s.reps === "string" ? s.reps : String(s.reps ?? ""),
                weightKg: typeof s.weightKg === "string" ? s.weightKg : String(s.weightKg ?? ""),
              }))
          : [],
      }));
  } catch {
    return [];
  }
}
