import "server-only";

import { createHash } from "node:crypto";

import type { HrZones, TrackPoint } from "./types";

export const RECORD_TARGETS = [
  { distanceM: 1000, label: "1 km" },
  { distanceM: 5000, label: "5 km" },
  { distanceM: 10000, label: "10 km" },
  { distanceM: 21097, label: "Semi-marathon" },
  { distanceM: 42195, label: "Marathon" },
] as const;

const EARTH_RADIUS_M = 6_371_000;

export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isRunningSport(sport: string | null | undefined): boolean {
  if (!sport) {
    return true;
  }
  return /run|jog|trail/i.test(sport);
}

/**
 * Meilleur temps sur chaque distance cible, à partir des points de piste.
 * Les points doivent être ordonnés par temps et par distance croissante.
 */
export function computeBestEfforts(points: TrackPoint[]): Record<string, number> {
  const bestEfforts: Record<string, number> = {};
  if (points.length < 2) {
    return bestEfforts;
  }

  for (const target of RECORD_TARGETS) {
    let best = Number.POSITIVE_INFINITY;
    let end = 0;

    for (let start = 0; start < points.length; start += 1) {
      if (end < start) {
        end = start;
      }
      while (
        end < points.length &&
        points[end].distanceM - points[start].distanceM < target.distanceM
      ) {
        end += 1;
      }
      if (end >= points.length) {
        break;
      }
      const time = points[end].timeSec - points[start].timeSec;
      if (time > 0 && time < best) {
        best = time;
      }
    }

    if (Number.isFinite(best)) {
      bestEfforts[String(target.distanceM)] = Math.round(best);
    }
  }

  return bestEfforts;
}

/**
 * Temps passé dans chaque zone de fréquence cardiaque, en secondes.
 * Les zones sont des pourcentages de la FC max estimée : 50-60, 60-70, 70-80,
 * 80-90 et 90-100 %. Les trous de mesure de plus de 60 secondes sont ignorés.
 */
export function computeHrZones(points: TrackPoint[], maxHeartRate: number | null): HrZones | null {
  if (!maxHeartRate || maxHeartRate < 100) {
    return null;
  }

  const totals: HrZones = {
    below: 0,
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
    above: 0,
  };
  let measured = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous.heartRate === null || current.heartRate === null) {
      continue;
    }
    const delta = current.timeSec - previous.timeSec;
    if (delta <= 0 || delta > 60) {
      continue;
    }
    const ratio = previous.heartRate / maxHeartRate;
    const key: keyof HrZones =
      ratio < 0.5
        ? "below"
        : ratio < 0.6
          ? "z1"
          : ratio < 0.7
            ? "z2"
            : ratio < 0.8
              ? "z3"
              : ratio < 0.9
                ? "z4"
                : ratio <= 1
                  ? "z5"
                  : "above";
    totals[key] += delta;
    measured += delta;
  }

  if (measured < 30) {
    return null;
  }

  for (const key of Object.keys(totals) as (keyof HrZones)[]) {
    totals[key] = Math.round(totals[key]);
  }
  return totals;
}

export function weightedAverageHeartRate(points: TrackPoint[]): number | null {
  let weighted = 0;
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous.heartRate === null || current.heartRate === null) {
      continue;
    }
    const delta = current.timeSec - previous.timeSec;
    if (delta <= 0 || delta > 60) {
      continue;
    }
    weighted += previous.heartRate * delta;
    total += delta;
  }

  if (total > 0) {
    return Math.round(weighted / total);
  }

  const values = points
    .map((point) => point.heartRate)
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function maxHeartRateFromPoints(points: TrackPoint[]): number | null {
  let max: number | null = null;
  for (const point of points) {
    if (point.heartRate !== null && (max === null || point.heartRate > max)) {
      max = point.heartRate;
    }
  }
  return max;
}

export function elevationGainFromPoints(points: TrackPoint[]): number | null {
  let gain = 0;
  let hasAltitude = false;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1].altitudeM;
    const current = points[index].altitudeM;
    if (previous === null || current === null) {
      continue;
    }
    hasAltitude = true;
    const delta = current - previous;
    if (delta >= 0.5) {
      gain += delta;
    }
  }

  return hasAltitude ? Math.round(gain) : null;
}

/**
 * FC max estimée à partir de l'âge (220 − âge). C'est une approximation
 * volontairement simple, affichée comme telle dans les statistiques.
 */
export function estimateMaxHeartRate(
  birthDate: string | null | undefined,
  now = new Date(),
): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return null;
  }
  const born = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) {
    return null;
  }
  const age =
    (now.getTime() - born.getTime()) / (365.2425 * 24 * 60 * 60 * 1000);
  if (age < 10 || age > 100) {
    return null;
  }
  return Math.round(220 - age);
}

export function dateInTimeZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
