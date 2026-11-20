import "server-only";

import FitParser from "fit-file-parser";

import {
  elevationGainFromPoints,
  haversineM,
  isRunningSport,
  maxHeartRateFromPoints,
  weightedAverageHeartRate,
} from "./activity";
import { ImportError, type ParsedActivity, type TrackPoint } from "./types";

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toPosition(record: Record<string, unknown>) {
  const lat = toNumber(record.position_lat);
  const lon = toNumber(record.position_long);
  if (lat === null || lon === null) {
    return null;
  }
  return { lat, lon };
}

export async function parseFit(
  input: ArrayBuffer,
  fileName: string,
): Promise<ParsedActivity> {
  const parser = new FitParser({
    force: false,
    strict: false,
    mode: "list",
    lengthUnit: "m",
    speedUnit: "m/s",
    temperatureUnit: "celsius",
  });

  let parsed: Awaited<ReturnType<FitParser["parseAsync"]>>;
  try {
    parsed = await parser.parseAsync(input);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new ImportError(
      "invalid",
      `Fichier FIT illisible (${detail}). Vérifie qu'il s'agit d'un export complet.`,
    );
  }

  const sessions = [...(parsed.sessions ?? []), ...(parsed.activity?.sessions ?? [])];
  if (sessions.length === 0) {
    throw new ImportError("invalid", "Ce fichier FIT ne contient aucune séance.");
  }

  const runningSessions = sessions.filter((session) =>
    isRunningSport(session.sport ? String(session.sport) : null),
  );
  const session = runningSessions[0] ?? sessions[0];
  if (!isRunningSport(session.sport ? String(session.sport) : null)) {
    throw new ImportError(
      "sport",
      `Sport non pris en charge (${String(session.sport)}). Allure importe les activités de course.`,
    );
  }

  const records = (parsed.records ?? []) as Record<string, unknown>[];

  const start =
    toDate(session.start_time) ??
    records.map((record) => toDate(record.timestamp)).find((date): date is Date => Boolean(date)) ??
    null;
  if (!start) {
    throw new ImportError("invalid", "Ce fichier FIT ne contient pas d'heure de départ.");
  }

  const points: TrackPoint[] = [];
  let cumulativeDistance = 0;
  let previousPosition: { lat: number; lon: number } | null = null;
  let previousTimeMs: number | null = null;

  for (const record of records) {
    const timestamp = toDate(record.timestamp);
    if (!timestamp) {
      continue;
    }
    const timeMs = timestamp.getTime();
    if (previousTimeMs !== null && timeMs < previousTimeMs) {
      continue;
    }

    const position = toPosition(record);
    let distance = toNumber(record.distance);
    if (distance === null && position && previousPosition) {
      distance = cumulativeDistance + haversineM(previousPosition, position);
    }
    if (distance === null || distance < 0) {
      previousPosition = position ?? previousPosition;
      continue;
    }

    cumulativeDistance = Math.max(cumulativeDistance, distance);
    const timeSec = Math.max(0, (timeMs - start.getTime()) / 1000);

    points.push({
      timeSec,
      distanceM: cumulativeDistance,
      heartRate: toNumber(record.heart_rate),
      altitudeM: toNumber(record.enhanced_altitude ?? record.altitude),
    });

    previousPosition = position ?? previousPosition;
    previousTimeMs = timeMs;
  }

  points.sort((a, b) => a.timeSec - b.timeSec);

  const firstPoint = points[0] ?? null;
  const lastPoint = points[points.length - 1] ?? null;

  const timerSec = toNumber(session.total_timer_time);
  const elapsedSec = toNumber(session.total_elapsed_time);
  const pointDuration = lastPoint && firstPoint ? lastPoint.timeSec - firstPoint.timeSec : 0;

  const durationSec = Math.round(timerSec ?? elapsedSec ?? pointDuration);
  const totalElapsedSec = Math.round(elapsedSec ?? durationSec);
  const distanceM = Math.round(toNumber(session.total_distance) ?? lastPoint?.distanceM ?? 0);

  if (durationSec <= 0) {
    throw new ImportError("invalid", "Durée introuvable dans le fichier FIT.");
  }
  if (distanceM <= 0) {
    throw new ImportError("invalid", "Distance introuvable dans le fichier FIT.");
  }

  const avgHeartRate =
    toNumber(session.avg_heart_rate) ?? weightedAverageHeartRate(points);
  const maxHeartRate = toNumber(session.max_heart_rate) ?? maxHeartRateFromPoints(points);
  const elevationGainM =
    toNumber(session.total_ascent) ?? elevationGainFromPoints(points);

  let notes = `Importé depuis un fichier FIT (${fileName}).`;
  if (sessions.length > 1) {
    notes += " Plusieurs séances figuraient dans le fichier : une seule a été importée.";
  }

  return {
    source: "fit",
    fileName,
    startedAt: start,
    durationSec,
    elapsedSec: totalElapsedSec,
    movingSec: durationSec,
    distanceM,
    avgHeartRate: avgHeartRate === null ? null : Math.round(avgHeartRate),
    maxHeartRate: maxHeartRate === null ? null : Math.round(maxHeartRate),
    elevationGainM: elevationGainM === null ? null : Math.round(elevationGainM),
    calories: toNumber(session.total_calories),
    points,
    notes,
  };
}
