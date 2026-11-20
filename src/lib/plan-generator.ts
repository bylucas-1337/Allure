// Logique de génération et d'adaptation d'un plan course (V2.1).
// Chaque règle cite sa base scientifique dans Docs/moteur-v2-regles.md.
// Le moteur propose ; l'utilisateur décide.

export type RunZone = "E" | "M" | "T" | "I" | "R";

export type ProfileInput = {
  birthDate: string | null;
  sex: "female" | "male" | "other" | "prefer_not_to_say" | null;
  hrMax: number | null;
  hrRest: number | null;
  baselineWeeklyKm: number | null;
  maxWeeklyKm: number | null;
  experienceLevel: "beginner" | "intermediate" | "advanced" | null;
  weeklyAvailability: Record<string, string[] | undefined> | null;
  declaredEasyPaceSecPerKm: number | null;
};

export type GoalInput = {
  distanceM: number;
  raceDate: string;
  targetTimeSec: number | null;
};

export type HistorySession = {
  date: string;
  distanceM: number | null;
  durationSec: number | null;
  avgPaceSecPerKm: number | null;
  avgHr: number | null;
};

export type CheckinInput = {
  date: string;
  freshness: number; // 1..5
};

export type InjuryInput = {
  status: string;
  bodyArea: string | null;
};

export type PlanInput = {
  profile: ProfileInput;
  goal: GoalInput | null;
  history: HistorySession[];
  checkins: CheckinInput[];
  injuries: InjuryInput[];
  now?: Date;
};

export type VdotResult = {
  value: number;
  source: "record_5k" | "record_10k" | "record_half" | "record_marathon" | "estimated";
  recordDate: string | null;
  isEstimated: boolean;
};

export type ZonePaces = {
  E: [number, number];
  M: [number, number];
  T: [number, number];
  I: [number, number];
  R: [number, number];
};

export type PlanSessionDraft = {
  sessionDate: string; // YYYY-MM-DD
  sport: "run";
  sessionType: "easy" | "threshold" | "intervals" | "long" | "recovery" | "race" | "other";
  durationMin: number;
  distanceM: number | null;
  targetZone: RunZone;
  targetPaceSecPerKm: number | null;
  rationaleText: string;
  recalculationReason: string | null;
};

export type GeneratedPlan = {
  vdot: VdotResult;
  zonePaces: ZonePaces;
  referenceVolumeKm: number;
  targetVolumeKm: number;
  isRecoveryWeek: boolean;
  taperWeeks: number;
  sessions: PlanSessionDraft[];
  rules: { key: string; value: Record<string, unknown>; explanation: string }[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ageFromBirthDate(birthDate: string | null, now: Date): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age <= 120 ? age : null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ---------------------------------------------------------------------------
// VDOT
// ---------------------------------------------------------------------------

function vdotFromPerformance(distanceM: number, timeMin: number): number {
  const v = distanceM / timeMin; // m/min
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const f =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * timeMin) +
    0.2989558 * Math.exp(-0.1932605 * timeMin);
  return vo2 / f;
}

const RECORD_DISTANCES: { key: VdotResult["source"]; meters: number; label: string }[] = [
  { key: "record_5k", meters: 5000, label: "5 km" },
  { key: "record_10k", meters: 10000, label: "10 km" },
  { key: "record_half", meters: 21097, label: "semi" },
  { key: "record_marathon", meters: 42195, label: "marathon" },
];

export function computeVdot(input: PlanInput): VdotResult {
  const now = input.now ?? new Date();
  const twelveMonthsAgo = addDays(now, -365);

  // Chercher le meilleur VDOT parmi les records récents.
  let best: { value: number; source: VdotResult["source"]; date: string } | null = null;

  for (const rd of RECORD_DISTANCES) {
    // On cherche dans l'historique une séance proche de la distance (±5 %).
    const candidates = input.history.filter((s) => {
      if (!s.distanceM || !s.durationSec) return false;
      const ratio = s.distanceM / rd.meters;
      if (ratio < 0.95 || ratio > 1.05) return false;
      const d = new Date(s.date);
      return d >= twelveMonthsAgo;
    });
    for (const c of candidates) {
      const timeMin = (c.durationSec as number) / 60;
      const v = vdotFromPerformance(c.distanceM as number, timeMin);
      if (!best || v > best.value) {
        best = { value: v, source: rd.key, date: c.date };
      }
    }
  }

  if (best) {
    const clamped = clamp(best.value, 25, 85);
    return {
      value: Math.round(clamped * 10) / 10,
      source: best.source,
      recordDate: best.date,
      isEstimated: false,
    };
  }

  // Repli : estimation depuis l'allure facile déclarée (assimilée à 65 % du VDOT).
  const easyPace = input.profile.declaredEasyPaceSecPerKm;
  if (easyPace && easyPace > 0) {
    // allure (s/km) -> vitesse (m/min) = 60000 / pace
    const v = 60000 / easyPace;
    const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
    const estimatedVdot = vo2 / 0.65;
    return {
      value: Math.round(clamp(estimatedVdot, 25, 85) * 10) / 10,
      source: "estimated",
      recordDate: null,
      isEstimated: true,
    };
  }

  // Repli ultime : volume hebdomadaire faible → VDOT 30.
  return { value: 30, source: "estimated", recordDate: null, isEstimated: true };
}

// ---------------------------------------------------------------------------
// Allures par zone (inversion VDOT -> allure)
// ---------------------------------------------------------------------------

function paceFromVdotPercent(vdot: number, pct: number): number {
  // VO2_cible = pct * vdot ; résoudre 0.000104 v² + 0.182258 v - (4.60 + VO2) = 0
  const vo2 = pct * vdot;
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + vo2);
  const disc = b * b - 4 * a * c;
  const v = (-b + Math.sqrt(disc)) / (2 * a); // m/min
  return Math.round(60000 / v); // s/km
}

export function computeZonePaces(vdot: number): ZonePaces {
  // Bornes de chaque zone (min/max % VDOT).
  const zones: { key: RunZone; min: number; max: number }[] = [
    { key: "E", min: 0.59, max: 0.74 },
    { key: "M", min: 0.75, max: 0.84 },
    { key: "T", min: 0.83, max: 0.88 },
    { key: "I", min: 0.95, max: 1.0 },
    { key: "R", min: 1.05, max: 1.1 },
  ];
  const result = {} as ZonePaces;
  for (const z of zones) {
    const slow = paceFromVdotPercent(vdot, z.min); // % bas -> allure plus lente -> nombre plus grand
    const fast = paceFromVdotPercent(vdot, z.max);
    // Fourchette [rapide, lent] en s/km.
    result[z.key] = [Math.min(fast, slow), Math.max(fast, slow)];
  }
  // Garde-fou ordonnancement strict pour faibles VDOT (25-32) : écart min 5 s/km.
  if (vdot <= 32) {
    const keys: RunZone[] = ["R", "I", "T", "M", "E"];
    for (let i = 1; i < keys.length; i++) {
      const prev = result[keys[i - 1]][1]; // lent de la zone plus rapide
      const cur = result[keys[i]][0]; // rapide de la zone plus lente
      if (cur <= prev) {
        result[keys[i]][0] = prev + 5;
        result[keys[i]][1] = Math.max(result[keys[i]][1], result[keys[i]][0] + 5);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Volume de référence et progression
// ---------------------------------------------------------------------------

export function computeReferenceVolumeKm(history: HistorySession[]): number {
  // Moyenne glissante sur les 3 dernières semaines actives.
  const weekBuckets: Record<string, number> = {};
  for (const s of history) {
    if (!s.distanceM) continue;
    const d = new Date(s.date);
    if (Number.isNaN(d.getTime())) continue;
    // Clé = lundi de la semaine.
    const day = d.getDay();
    const monday = addDays(d, day === 0 ? -6 : 1 - day);
    const key = toISODate(monday);
    weekBuckets[key] = (weekBuckets[key] ?? 0) + s.distanceM / 1000;
  }
  const weeks = Object.keys(weekBuckets).sort().reverse().slice(0, 3);
  if (weeks.length === 0) return 0;
  const total = weeks.reduce((acc, w) => acc + weekBuckets[w], 0);
  return Math.round((total / weeks.length) * 10) / 10;
}

export function computeTargetVolumeKm(
  referenceKm: number,
  baselineKm: number | null,
  maxKm: number | null,
  isRecoveryWeek: boolean,
  afterCut: boolean,
): number {
  const base = referenceKm > 0 ? referenceKm : baselineKm ?? 15;
  if (afterCut) {
    return Math.round(base * 0.825 * 10) / 10; // 80-85 %, milieu
  }
  if (isRecoveryWeek) {
    return Math.round(base * 0.75 * 10) / 10; // -25 %
  }
  const increment = clamp(0.1 * base, 2, 7);
  let target = base + increment;
  if (maxKm && maxKm > 0) target = Math.min(target, maxKm);
  return Math.round(target * 10) / 10;
}

// ---------------------------------------------------------------------------
// TRIMP
// ---------------------------------------------------------------------------

export function computeTrimp(
  durationMin: number,
  avgHr: number | null,
  profile: ProfileInput,
  sessionType: string,
): { value: number; estimated: boolean } {
  const age = ageFromBirthDate(profile.birthDate, new Date());
  const hrMax = profile.hrMax ?? (age ? 220 - age : 180);
  const hrRest = profile.hrRest ?? 60;

  if (avgHr && avgHr > 0 && hrMax > hrRest) {
    const hrr = hrMax - hrRest;
    const delta = clamp((avgHr - hrRest) / hrr, 0, 1);
    const sex = profile.sex;
    let k = 1.0;
    if (sex === "male") k = 0.86 * Math.exp(1.67 * delta);
    else if (sex === "female") k = 0.64 * Math.exp(1.92 * delta);
    else k = 1.0;
    const estimated = sex !== "male" && sex !== "female";
    return { value: Math.round(durationMin * delta * k * 10) / 10, estimated };
  }

  // Sans FC : coeff par type.
  const coeffMap: Record<string, number> = {
    easy: 1.0,
    long: 1.2,
    threshold: 1.5,
    intervals: 1.8,
    repetitions: 1.8,
  };
  const coeff = coeffMap[sessionType] ?? 1.0;
  return { value: Math.round(durationMin * coeff * 10) / 10, estimated: true };
}

// ---------------------------------------------------------------------------
// Structure de semaine
// ---------------------------------------------------------------------------

function availableDays(profile: ProfileInput): number[] {
  // 0=dimanche ... 6=samedi. weeklyAvailability est un objet { run: ['mon','tue',...] }.
  const dayMap: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6,
  };
  const days = profile.weeklyAvailability?.run ?? [];
  const nums = days
    .map((d) => dayMap[d.toLowerCase().slice(0, 3)])
    .filter((n): n is number => n !== undefined);
  // Dédupliquer et trier.
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function isRecoveryWeek(now: Date, experienceLevel: string | null): boolean {
  // Toutes les 3 (débutant) ou 4 (intermédiaire/avancé) semaines.
  const weekOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 3600 * 1000),
  );
  const cycle = experienceLevel === "beginner" ? 3 : 4;
  return weekOfYear % cycle === 0;
}

function afterCut(history: HistorySession[], now: Date): boolean {
  // Si la semaine S-1 affiche moins de 50 % du volume prévu.
  const lastWeekStart = addDays(now, -7);
  const monday = addDays(lastWeekStart, lastWeekStart.getDay() === 0 ? -6 : 1 - lastWeekStart.getDay());
  const mondayStr = toISODate(monday);
  const sundayStr = toISODate(addDays(monday, 6));
  const lastWeekKm = history
    .filter((s) => s.date >= mondayStr && s.date <= sundayStr && s.distanceM)
    .reduce((acc, s) => acc + (s.distanceM as number) / 1000, 0);
  // Volume prévu approximatif = moyenne historique. Si lastWeekKm < 0.5 * ref, c'est une coupure.
  // On utilise un seuil simple : si aucune séance la semaine dernière.
  return lastWeekKm === 0;
}

// ---------------------------------------------------------------------------
// Génération du plan (4 semaines glissantes)
// ---------------------------------------------------------------------------

export function generatePlan(input: PlanInput): GeneratedPlan {
  const now = input.now ?? new Date();
  const vdot = computeVdot(input);
  const zonePaces = computeZonePaces(vdot.value);
  const refVolume = computeReferenceVolumeKm(input.history);
  const referenceVolumeKm = refVolume > 0 ? refVolume : input.profile.baselineWeeklyKm ?? 15;
  const recoveryWeek = isRecoveryWeek(now, input.profile.experienceLevel);
  const cut = afterCut(input.history, now);
  const targetVolumeKm = computeTargetVolumeKm(
    referenceVolumeKm,
    input.profile.baselineWeeklyKm,
    input.profile.maxWeeklyKm,
    recoveryWeek,
    cut,
  );

  const days = availableDays(input.profile);
  const n = days.length || 3; // défaut 3 si pas de dispo

  // Blessure active ?
  const activeInjury = input.injuries.some((i) => i.status === "active");

  // Fatigue cumulée ?
  const recentCheckins = input.checkins
    .filter((c) => {
      const d = new Date(c.date);
      return (now.getTime() - d.getTime()) / (24 * 3600 * 1000) <= 3;
    })
    .map((c) => c.freshness);
  const avgFreshness =
    recentCheckins.length > 0
      ? recentCheckins.reduce((a, b) => a + b, 0) / recentCheckins.length
      : 3;
  const fatigueTriggered = avgFreshness <= 2.0;

  // Affûtage : si course dans les 14 prochains jours.
  let taperWeeks = 0;
  if (input.goal) {
    const raceDate = new Date(input.goal.raceDate);
    const daysToRace = (raceDate.getTime() - now.getTime()) / (24 * 3600 * 1000);
    if (daysToRace <= 14 && daysToRace > 0) taperWeeks = 2;
    else if (daysToRace <= 21 && daysToRace > 0) taperWeeks = 1;
  }

  const recoveryWeekFlag = recoveryWeek || fatigueTriggered || activeInjury;

  // Volume cible ajusté.
  let finalVolume = targetVolumeKm;
  if (activeInjury) finalVolume = Math.round(finalVolume * 0.7 * 10) / 10;
  if (fatigueTriggered && !activeInjury) finalVolume = Math.round(finalVolume * 0.75 * 10) / 10;

  // Génération des séances pour 4 semaines.
  const sessions: PlanSessionDraft[] = [];
  const weekStart = startOfWeek(now);

  for (let w = 0; w < 4; w++) {
    const ws = addDays(weekStart, w * 7);
    const weekVolume = taperWeeks > 0 && w >= 4 - taperWeeks
      ? finalVolume * (w === 3 ? 0.55 : 0.75)
      : finalVolume;

    // Structure de la semaine selon n.
    const weekSessions = buildWeekSessions(n, weekVolume, zonePaces, activeInjury, fatigueTriggered, input.goal, w, 4 - taperWeeks);

    for (const ws2 of weekSessions) {
      const sessionDate = addDays(ws, ws2.dayOffset);
      // Ne pas générer de séances dans le passé.
      if (sessionDate < now) continue;
      sessions.push({
        sessionDate: toISODate(sessionDate),
        sport: "run",
        sessionType: ws2.type,
        durationMin: ws2.durationMin,
        distanceM: ws2.distanceM,
        targetZone: ws2.zone,
        targetPaceSecPerKm: zonePaces[ws2.zone][0],
        rationaleText: ws2.rationale,
        recalculationReason: null,
      });
    }
  }

  // Règles appliquées (transparence).
  const rules: GeneratedPlan["rules"] = [
    {
      key: "vdot",
      value: { value: vdot.value, source: vdot.source, isEstimated: vdot.isEstimated },
      explanation: `VDOT estimé à ${vdot.value} depuis ${vdot.source === "estimated" ? "l'allure facile déclarée" : "le record " + vdot.source.replace("record_", "")}.`,
    },
    {
      key: "volume",
      value: { reference: referenceVolumeKm, target: finalVolume, recovery: recoveryWeek, cut, activeInjury, fatigueTriggered },
      explanation: `Volume cible ${finalVolume} km (référence ${referenceVolumeKm} km). ${recoveryWeekFlag ? "Semaine de récupération. " : ""}${activeInjury ? "Blessure active : volume réduit de 30 %. " : ""}${fatigueTriggered ? "Fatigue élevée : volume réduit de 25 %. " : ""}`,
    },
    {
      key: "structure",
      value: { days: n, taperWeeks },
      explanation: `Structure de semaine pour ${n} jour(s) disponible(s). ${taperWeeks > 0 ? `Affûtage sur ${taperWeeks} semaine(s).` : ""}`,
    },
  ];

  return {
    vdot,
    zonePaces,
    referenceVolumeKm,
    targetVolumeKm: finalVolume,
    isRecoveryWeek: recoveryWeekFlag,
    taperWeeks,
    sessions,
    rules,
  };
}

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}

type WeekSession = {
  dayOffset: number;
  type: PlanSessionDraft["sessionType"];
  durationMin: number;
  distanceM: number | null;
  zone: RunZone;
  rationale: string;
};

function buildWeekSessions(
  n: number,
  weekVolumeKm: number,
  zonePaces: ZonePaces,
  activeInjury: boolean,
  fatigueTriggered: boolean,
  goal: GoalInput | null,
  weekIndex: number,
  taperStartWeek: number,
): WeekSession[] {
  const sessions: WeekSession[] = [];
  const isTaper = weekIndex >= taperStartWeek;

  // Durée estimée : on suppose 6 min/km en moyenne pour convertir km -> min.
  const minPerKm = 6;
  const totalMin = Math.round(weekVolumeKm * minPerKm);

  if (activeInjury) {
    // Uniquement endurance plate en Zone E.
    const easyMin = Math.round(totalMin * 0.9);
    sessions.push({ dayOffset: 1, type: "easy", durationMin: easyMin, distanceM: Math.round(weekVolumeKm * 1000 * 0.9), zone: "E", rationale: "Endurance douce (blessure active)." });
    return sessions;
  }

  if (n === 1) {
    sessions.push({ dayOffset: 1, type: "easy", durationMin: totalMin, distanceM: Math.round(weekVolumeKm * 1000), zone: "E", rationale: "Séance unique : endurance facile." });
    return sessions;
  }

  if (n === 2) {
    const longMin = Math.round(totalMin * 0.6);
    const easyMin = totalMin - longMin;
    sessions.push({ dayOffset: 1, type: "easy", durationMin: easyMin, distanceM: Math.round((easyMin / minPerKm) * 1000), zone: "E", rationale: "Endurance facile." });
    sessions.push({ dayOffset: 4, type: "easy", durationMin: longMin, distanceM: Math.round((longMin / minPerKm) * 1000), zone: "E", rationale: "Sortie longue (fin Zone E)." });
    return sessions;
  }

  // n >= 3
  const qualityMin = Math.round(totalMin * 0.2);
  const longMin = Math.round(totalMin * 0.3);
  const easyMin = Math.round((totalMin - qualityMin - longMin) / (n - 2));

  // Qualité
  const qualityType: WeekSession["type"] = isTaper ? "threshold" : (weekIndex % 2 === 0 ? "intervals" : "threshold");
  const qualityZone: RunZone = qualityType === "intervals" ? "I" : "T";
  sessions.push({ dayOffset: 2, type: qualityType, durationMin: qualityMin, distanceM: Math.round((qualityMin / minPerKm) * 1000), zone: qualityZone, rationale: `Séance qualité (${qualityZone === "I" ? "intervalles VO2max" : "seuil"}).` });

  // Sortie longue
  sessions.push({ dayOffset: n >= 4 ? 6 : 5, type: "long", durationMin: longMin, distanceM: Math.round((longMin / minPerKm) * 1000), zone: "E", rationale: "Sortie longue en endurance." });

  // Faciles
  const easyDays = n >= 4 ? [0, 3] : [0];
  if (n >= 5) easyDays.push(4);
  for (const d of easyDays) {
    sessions.push({ dayOffset: d, type: "easy", durationMin: easyMin, distanceM: Math.round((easyMin / minPerKm) * 1000), zone: "E", rationale: "Endurance fondamentale." });
  }

  // Si n >= 6 et intermédiaire/avancé : 2 qualité.
  // (simplifié : on garde 1 qualité pour la V2.1)

  return sessions;
}

// ---------------------------------------------------------------------------
// Adaptation après une séance
// ---------------------------------------------------------------------------

export function adaptAfterSession(
  plan: GeneratedPlan,
  newSession: HistorySession,
  profile: ProfileInput,
  checkins: CheckinInput[],
  injuries: InjuryInput[],
): { reason: string; volumeAdjustment: number } {
  // Fatigue ponctuelle.
  const todayCheckin = checkins.find((c) => c.date === newSession.date);
  if (todayCheckin && todayCheckin.freshness <= 1) {
    return { reason: "Fatigue aiguë : séance du jour convertie en footing léger.", volumeAdjustment: 0 };
  }

  // Fatigue cumulée.
  const recent = checkins
    .filter((c) => {
      const d = new Date(c.date);
      const now = new Date();
      return (now.getTime() - d.getTime()) / (24 * 3600 * 1000) <= 3;
    })
    .map((c) => c.freshness);
  const avg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 3;
  if (avg <= 2.0) {
    return { reason: "Fatigue élevée sur 3 jours : semaine de récupération (-25 % volume).", volumeAdjustment: -0.25 };
  }

  // Blessure active.
  if (injuries.some((i) => i.status === "active")) {
    return { reason: "Blessure active : volume réduit de 30 %, séances de qualité supprimées.", volumeAdjustment: -0.3 };
  }

  // Nouveau record (VDOT supérieur) → recalcul.
  return { reason: "Plan maintenu. Recalcul de la fenêtre glissante.", volumeAdjustment: 0 };
}
