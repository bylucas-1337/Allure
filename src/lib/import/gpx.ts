import "server-only";

import {
  elevationGainFromPoints,
  haversineM,
  maxHeartRateFromPoints,
  weightedAverageHeartRate,
} from "./activity";
import { ImportError, type ParsedActivity, type TrackPoint } from "./types";

type RawPoint = {
  timeMs: number;
  lat: number;
  lon: number;
  altitudeM: number | null;
  heartRate: number | null;
};

function readAttribute(attributes: string, name: string): number | null {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*["']\\s*([-+0-9.,]+)\\s*["']`, "i"),
  );
  if (!match) {
    return null;
  }
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function readTag(inner: string, name: string): number | null {
  const match = inner.match(
    new RegExp(`<${name}\\b[^>]*>\\s*([-+0-9.,]+)\\s*</${name}>`, "i"),
  );
  if (!match) {
    return null;
  }
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function readTime(inner: string): number | null {
  const match = inner.match(/<time\b[^>]*>\s*([^<]+?)\s*<\/time>/i);
  if (!match) {
    return null;
  }
  const date = new Date(match[1]);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function readHeartRate(inner: string): number | null {
  const match = inner.match(
    /<(?:[a-zA-Z0-9_.-]+:)?hr\b[^>]*>\s*([-+0-9.,]+)\s*<\//i,
  );
  if (!match) {
    return null;
  }
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function parseTrackPoint(attributes: string, inner: string): RawPoint | null {
  const lat = readAttribute(attributes, "lat");
  const lon = readAttribute(attributes, "lon");
  const timeMs = readTime(inner);
  if (lat === null || lon === null || timeMs === null) {
    return null;
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return null;
  }
  return {
    timeMs,
    lat,
    lon,
    altitudeM: readTag(inner, "ele"),
    heartRate: readHeartRate(inner),
  };
}

export function parseGpx(text: string, fileName: string): ParsedActivity {
  const content = text.replace(/^\uFEFF/, "").trim();
  if (!/<gpx\b/i.test(content)) {
    throw new ImportError("invalid", "Ce fichier n'est pas un GPX valide.");
  }

  const segmentRegex = /<trkseg\b[^>]*>([\s\S]*?)<\/trkseg>/gi;
  const segments = Array.from(content.matchAll(segmentRegex), (match) => match[1]);
  const blocks = segments.length > 0 ? segments : [content];

  const points: TrackPoint[] = [];
  let startMs: number | null = null;
  let cumulativeDistance = 0;
  let previousPosition: { lat: number; lon: number } | null = null;
  let previousTimeMs: number | null = null;

  for (const block of blocks) {
    previousPosition = null;
    const trackPointRegex = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/gi;

    for (const match of block.matchAll(trackPointRegex)) {
      const point = parseTrackPoint(match[1], match[2]);
      if (!point) {
        continue;
      }
      if (previousTimeMs !== null && point.timeMs < previousTimeMs) {
        continue;
      }
      if (previousPosition) {
        cumulativeDistance += haversineM(previousPosition, point);
      }

      if (startMs === null) {
        startMs = point.timeMs;
      }

      const timeSec = Math.max(0, (point.timeMs - startMs) / 1000);
      points.push({
        timeSec,
        distanceM: cumulativeDistance,
        heartRate: point.heartRate,
        altitudeM: point.altitudeM,
      });

      previousPosition = { lat: point.lat, lon: point.lon };
      previousTimeMs = point.timeMs;
    }
  }

  if (points.length < 2 || startMs === null) {
    throw new ImportError(
      "empty",
      "Ce GPX ne contient pas assez de points horodatés pour calculer une séance.",
    );
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const durationSec = Math.round(lastPoint.timeSec - firstPoint.timeSec);
  const distanceM = Math.round(lastPoint.distanceM);

  if (durationSec <= 0) {
    throw new ImportError("invalid", "Durée introuvable dans ce GPX.");
  }
  if (distanceM <= 0) {
    throw new ImportError("invalid", "Distance introuvable dans ce GPX.");
  }

  let movingSec = 0;
  for (let index = 1; index < points.length; index += 1) {
    const delta = points[index].timeSec - points[index - 1].timeSec;
    const distance = points[index].distanceM - points[index - 1].distanceM;
    if (delta > 0 && delta <= 120 && (distance > 0.5 || delta <= 5)) {
      movingSec += delta;
    }
  }
  if (movingSec < 1) {
    movingSec = durationSec;
  }

  return {
    source: "gpx",
    fileName,
    startedAt: new Date(startMs),
    durationSec,
    elapsedSec: durationSec,
    movingSec: Math.round(movingSec),
    distanceM,
    avgHeartRate: weightedAverageHeartRate(points),
    maxHeartRate: maxHeartRateFromPoints(points),
    elevationGainM: elevationGainFromPoints(points),
    calories: null,
    points,
    notes: `Importé depuis un fichier GPX (${fileName}).`,
  };
}
