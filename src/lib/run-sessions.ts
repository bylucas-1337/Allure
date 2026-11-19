export const SESSION_TYPES = [
  { value: "easy", label: "Facile" },
  { value: "threshold", label: "Seuil" },
  { value: "intervals", label: "Fractionné" },
  { value: "long", label: "Sortie longue" },
  { value: "race", label: "Course" },
  { value: "recovery", label: "Récupération" },
  { value: "other", label: "Autre" },
] as const;

export type SessionType = (typeof SESSION_TYPES)[number]["value"];

const SESSION_TYPE_VALUES: readonly string[] = SESSION_TYPES.map((item) => item.value);

export type FieldErrors = Record<string, string>;

export type SaveRunSessionInput = {
  sessionDate: string;
  sessionType: string;
  durationMin: string;
  durationSec: string;
  distanceKm: string;
  rpe: string;
  notes: string;
  goalId: string;
};

export function validateRunSession(input: SaveRunSessionInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate)) {
    errors.sessionDate = "Date invalide.";
  }

  if (!SESSION_TYPE_VALUES.includes(input.sessionType)) {
    errors.sessionType = "Type de séance invalide.";
  }

  const duration = Number(input.durationMin);
  if (!Number.isInteger(duration) || duration < 0 || duration > 600) {
    errors.durationMin = "Minutes entre 0 et 600.";
  }

  const seconds = input.durationSec === "" ? 0 : Number(input.durationSec);
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 59) {
    errors.durationSec = "Secondes entre 0 et 59.";
  }

  if (duration === 0 && seconds === 0) {
    errors.durationMin = "La durée doit être supérieure à zéro.";
  }

  if (input.distanceKm !== "") {
    const km = Number(input.distanceKm.replace(",", "."));
    if (!Number.isFinite(km) || km < 0 || km > 500) {
      errors.distanceKm = "Distance entre 0 et 500 km.";
    }
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

  return errors;
}

export function paceSecondsPerKm(durationSecTotal: number, distanceKm: number): number | null {
  if (distanceKm <= 0 || durationSecTotal <= 0) {
    return null;
  }
  return Math.round(durationSecTotal / distanceKm);
}
