/**
 * Disponibilités hebdomadaires — course et musculation séparées.
 *
 * Stockées dans `profiles.weekly_availability` (jsonb), sans migration :
 *   {
 *     "runDays": ["mon", "wed"],
 *     "runSessionsPerWeek": 3,
 *     "longRunDay": "sun",
 *     "strengthDays": ["tue", "thu"],
 *     "strengthSessionsPerWeek": 2
 *   }
 *
 * Partagé entre le navigateur et le serveur : aucune donnée sensible.
 */

export const AVAILABILITY_DAYS = [
  { value: "mon", label: "Lundi" },
  { value: "tue", label: "Mardi" },
  { value: "wed", label: "Mercredi" },
  { value: "thu", label: "Jeudi" },
  { value: "fri", label: "Vendredi" },
  { value: "sat", label: "Samedi" },
  { value: "sun", label: "Dimanche" },
] as const;

export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number]["value"];

export const DAY_VALUES: readonly string[] = AVAILABILITY_DAYS.map((day) => day.value);

export type Availability = {
  runDays: AvailabilityDay[];
  runSessionsPerWeek: number | null;
  longRunDay: AvailabilityDay | null;
  strengthDays: AvailabilityDay[];
  strengthSessionsPerWeek: number | null;
};

function readDays(value: unknown): AvailabilityDay[] {
  return Array.isArray(value)
    ? (value.filter(
        (day): day is AvailabilityDay =>
          typeof day === "string" && DAY_VALUES.includes(day),
      ) as AvailabilityDay[])
    : [];
}

function readDay(value: unknown): AvailabilityDay | null {
  return typeof value === "string" && DAY_VALUES.includes(value)
    ? (value as AvailabilityDay)
    : null;
}

function readCount(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

export function readAvailability(value: unknown): Availability {
  if (typeof value !== "object" || value === null) {
    return {
      runDays: [],
      runSessionsPerWeek: null,
      longRunDay: null,
      strengthDays: [],
      strengthSessionsPerWeek: null,
    };
  }

  const record = value as Record<string, unknown>;

  return {
    runDays: readDays(record.runDays),
    runSessionsPerWeek: readCount(record.runSessionsPerWeek),
    longRunDay: readDay(record.longRunDay),
    strengthDays: readDays(record.strengthDays),
    strengthSessionsPerWeek: readCount(record.strengthSessionsPerWeek),
  };
}

export function toAvailabilityJson(input: Availability): Availability {
  return {
    runDays: input.runDays,
    runSessionsPerWeek: input.runSessionsPerWeek,
    longRunDay: input.longRunDay,
    strengthDays: input.strengthDays,
    strengthSessionsPerWeek: input.strengthSessionsPerWeek,
  };
}
