export type ActivitySource = "fit" | "gpx";

export type TrackPoint = {
  /** Secondes depuis le début de l'activité. */
  timeSec: number;
  /** Distance cumulée en mètres. */
  distanceM: number;
  heartRate: number | null;
  altitudeM: number | null;
};

export type HrZones = {
  below: number;
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  above: number;
};

export type ParsedActivity = {
  source: ActivitySource;
  fileName: string;
  startedAt: Date;
  durationSec: number;
  elapsedSec: number;
  movingSec: number;
  distanceM: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  elevationGainM: number | null;
  calories: number | null;
  points: TrackPoint[];
  notes: string;
};

export class ImportError extends Error {
  readonly code: "unsupported" | "invalid" | "empty" | "sport" | "too-big";

  constructor(code: ImportError["code"], message: string) {
    super(message);
    this.name = "ImportError";
    this.code = code;
  }
}
