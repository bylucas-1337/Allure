"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generatePlan,
  type PlanInput,
} from "@/lib/plan-generator";

export type CreatePlanInput = {
  goalId: string | null;
  startDate: string; // YYYY-MM-DD
  // Données profil (déjà dans la base, mais on les passe pour le calcul)
};

export type CreatePlanInteractiveInput = {
  targetDistanceKm: number;
  hasRace: boolean;
  raceName: string | null;
  raceDate: string | null;
  targetTimeSec: number | null;
  easyPaceSecPerKm: number | null;
  runDays: string[];
  longRunDay: string;
  baselineKm: number;
  maxKm: number;
};

export async function createPlanInteractive(input: CreatePlanInteractiveInput) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Non autorisé" };
  const userId = userData.user.id;

  // Vérifier qu'il n'y a pas déjà un plan actif.
  const { data: existing } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "Un plan est déjà actif. Arrête-le d'abord." };
  }

  // 1. Créer l'objectif principal si course prévue (abandonner l'ancien).
  let goal: { id: string; distance_m: number; race_date: string; target_time_sec: number | null } | null = null;
  if (input.hasRace && input.raceDate) {
    const { data: oldGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("goal_kind", "main")
      .eq("sport", "run")
      .limit(1)
      .maybeSingle();
    if (oldGoal) {
      await supabase
        .from("goals")
        .update({ status: "abandoned" })
        .eq("id", oldGoal.id);
    }

    const distanceM = Math.round(input.targetDistanceKm * 1000);
    const { data: newGoal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        sport: "run",
        goal_kind: "main",
        race_name: input.raceName ?? "Course",
        distance_m: distanceM,
        race_date: input.raceDate,
        target_time_sec: input.targetTimeSec,
        status: "active",
      })
      .select()
      .single();
    if (goalError || !newGoal) {
      return { error: goalError?.message ?? "Erreur création de l'objectif" };
    }
    goal = newGoal;
  } else {
    // Abandonner l'ancien objectif principal s'il existe (le plan n'est plus lié à une course).
    const { data: oldGoal } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("goal_kind", "main")
      .eq("sport", "run")
      .limit(1)
      .maybeSingle();
    if (oldGoal) {
      await supabase
        .from("goals")
        .update({ status: "abandoned" })
        .eq("id", oldGoal.id);
    }
  }

  // 2. Mettre à jour le profil avec les disponibilités et le volume.
  const weeklyAvailability = { run: input.runDays };
  await supabase
    .from("profiles")
    .update({
      weekly_availability: weeklyAvailability,
      baseline_weekly_km: input.baselineKm,
      max_weekly_km: input.maxKm,
    })
    .eq("user_id", userId);

  // 3. Lire le profil mis à jour.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return { error: "Profil introuvable." };

  // 4. Lire l'historique récent.
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const { data: runs } = await supabase
    .from("run_sessions")
    .select("session_date, distance_m, duration_min, duration_sec, avg_pace_sec, avg_hr")
    .eq("user_id", userId)
    .gte("session_date", fourWeeksAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: true });

  const history = (runs ?? []).map((r) => ({
    date: r.session_date,
    distanceM: r.distance_m,
    durationSec: r.duration_sec ?? (r.duration_min ? r.duration_min * 60 : null),
    avgPaceSecPerKm: r.avg_pace_sec,
    avgHr: r.avg_hr,
  }));

  // 5. Lire les checkins et blessures.
  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("checkin_date, freshness_1_5")
    .eq("user_id", userId)
    .gte("checkin_date", fourWeeksAgo.toISOString().slice(0, 10));
  const checkinInput = (checkins ?? []).map((c) => ({
    date: c.checkin_date,
    freshness: c.freshness_1_5,
  }));

  const { data: injuries } = await supabase
    .from("injuries")
    .select("status, body_area")
    .eq("user_id", userId);
  const injuryInput = (injuries ?? []).map((i) => ({
    status: i.status,
    bodyArea: i.body_area,
  }));

  // 6. Construire le profil input.
  const profileInput = {
    birthDate: profile.birth_date,
    sex: profile.sex as "female" | "male" | "other" | "prefer_not_to_say" | null,
    hrMax: profile.hr_max,
    hrRest: profile.resting_hr,
    baselineWeeklyKm: input.baselineKm,
    maxWeeklyKm: input.maxKm,
    experienceLevel: profile.experience_level as "beginner" | "intermediate" | "advanced" | null,
    weeklyAvailability: { run: input.runDays } as Record<string, string[] | undefined>,
    declaredEasyPaceSecPerKm: input.easyPaceSecPerKm,
  };

  const goalInput = goal
    ? { distanceM: goal.distance_m, raceDate: goal.race_date, targetTimeSec: goal.target_time_sec }
    : null;

  const planInput: PlanInput = {
    profile: profileInput,
    goal: goalInput,
    history,
    checkins: checkinInput,
    injuries: injuryInput,
  };

  const generated = generatePlan(planInput);

  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = goal
    ? goal.race_date
    : new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // 7. Créer le plan.
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      goal_id: goal?.id ?? null,
      name: goal ? `${input.raceName ?? "Course"} — ${input.targetDistanceKm} km` : `Plan ${input.targetDistanceKm} km`,
      status: "active",
      start_date: startDate,
      end_date: endDate,
      vdot: generated.vdot.value,
      vdot_source: generated.vdot.source,
      vdot_is_estimated: generated.vdot.isEstimated,
      reference_volume_km: generated.referenceVolumeKm,
      notes_text: null,
    })
    .select()
    .single();

  if (planError || !plan) {
    return { error: planError?.message ?? "Erreur création du plan" };
  }

  // 8. Insérer les règles.
  if (generated.rules.length > 0) {
    await supabase.from("plan_rules").insert(
      generated.rules.map((r) => ({
        plan_id: plan.id,
        rule_key: r.key,
        rule_value: r.value,
        explanation: r.explanation,
      })),
    );
  }

  // 9. Insérer les sessions et synchroniser vers planned_sessions.
  for (const s of generated.sessions) {
    const { data: ps } = await supabase
      .from("plan_sessions")
      .insert({
        plan_id: plan.id,
        user_id: userId,
        session_date: s.sessionDate,
        sport: s.sport,
        session_type: s.sessionType,
        duration_min: s.durationMin,
        distance_m: s.distanceM,
        target_zone: s.targetZone,
        target_pace_sec_per_km: s.targetPaceSecPerKm,
        rationale_text: s.rationaleText,
        recalculation_reason: s.recalculationReason,
        status: "planned",
      })
      .select()
      .single();

    if (ps) {
      const { data: planned } = await supabase
        .from("planned_sessions")
        .insert({
          user_id: userId,
          date: s.sessionDate,
          sport: "run",
          session_type: s.sessionType,
          duration_min: s.durationMin,
          objectives_json: {},
          details_json: { target_zone: s.targetZone, target_pace: s.targetPaceSecPerKm },
          brief_text: s.rationaleText,
          rationale_text: s.rationaleText,
          origin: "engine",
          status: "planned",
        })
        .select()
        .single();

      if (planned) {
        await supabase
          .from("plan_sessions")
          .update({ planned_session_id: planned.id })
          .eq("id", ps.id);
      }
    }
  }

  revalidatePath("/plan");
  revalidatePath("/");
  return { planId: plan.id };
}

export async function getActivePlan() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const userId = userData.user.id;

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) return null;

  const { data: sessions } = await supabase
    .from("plan_sessions")
    .select("*")
    .eq("plan_id", plan.id)
    .order("session_date", { ascending: true });

  const { data: rules } = await supabase
    .from("plan_rules")
    .select("*")
    .eq("plan_id", plan.id);

  return { plan, sessions: sessions ?? [], rules: rules ?? [] };
}

export async function createPlanFromProfile(goalId: string | null) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Non autorisé" };
  const userId = userData.user.id;

  // Vérifier qu'il n'y a pas déjà un plan actif.
  const { data: existing } = await supabase
    .from("training_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);
  if (existing && existing.length > 0) {
    return { error: "Un plan est déjà actif. Arrête-le d'abord." };
  }

  // Lire le profil.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return { error: "Profil introuvable. Complète l'onboarding." };

  // Lire l'objectif principal actif si goalId fourni.
  let goal: { id: string; distance_m: number; race_date: string; target_time_sec: number | null } | null = null;
  if (goalId) {
    const { data: g } = await supabase
      .from("goals")
      .select("id, distance_m, race_date, target_time_sec")
      .eq("id", goalId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    goal = g;
  } else {
    // Chercher le premier objectif principal actif.
    const { data: g } = await supabase
      .from("goals")
      .select("id, distance_m, race_date, target_time_sec")
      .eq("user_id", userId)
      .eq("status", "active")
      .eq("goal_kind", "main")
      .limit(1)
      .maybeSingle();
    goal = g;
  }

  // Lire l'historique récent (4 dernières semaines).
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const { data: runs } = await supabase
    .from("run_sessions")
    .select("session_date, distance_m, duration_min, duration_sec, avg_pace_sec, avg_hr")
    .eq("user_id", userId)
    .gte("session_date", fourWeeksAgo.toISOString().slice(0, 10))
    .order("session_date", { ascending: true });

  const history = (runs ?? []).map((r) => ({
    date: r.session_date,
    distanceM: r.distance_m,
    durationSec: r.duration_sec ?? (r.duration_min ? r.duration_min * 60 : null),
    avgPaceSecPerKm: r.avg_pace_sec,
    avgHr: r.avg_hr,
  }));

  // Lire les checkins récents.
  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("checkin_date, freshness_1_5")
    .eq("user_id", userId)
    .gte("checkin_date", fourWeeksAgo.toISOString().slice(0, 10));
  const checkinInput = (checkins ?? []).map((c) => ({
    date: c.checkin_date,
    freshness: c.freshness_1_5,
  }));

  // Lire les blessures actives.
  const { data: injuries } = await supabase
    .from("injuries")
    .select("status, body_area")
    .eq("user_id", userId);
  const injuryInput = (injuries ?? []).map((i) => ({
    status: i.status,
    bodyArea: i.body_area,
  }));

  // Construire le profil input.
  const weeklyAvailability = (profile.weekly_availability ?? {}) as Record<string, string[] | undefined>;
  const profileInput = {
    birthDate: profile.birth_date,
    sex: profile.sex as "female" | "male" | "other" | "prefer_not_to_say" | null,
    hrMax: profile.hr_max,
    hrRest: profile.resting_hr,
    baselineWeeklyKm: profile.baseline_weekly_km,
    maxWeeklyKm: profile.max_weekly_km,
    experienceLevel: profile.experience_level as "beginner" | "intermediate" | "advanced" | null,
    weeklyAvailability,
    declaredEasyPaceSecPerKm: null, // TODO: lire depuis run profile V3 si disponible
  };

  const goalInput = goal
    ? { distanceM: goal.distance_m, raceDate: goal.race_date, targetTimeSec: goal.target_time_sec }
    : null;

  const planInput: PlanInput = {
    profile: profileInput,
    goal: goalInput,
    history,
    checkins: checkinInput,
    injuries: injuryInput,
  };

  const generated = generatePlan(planInput);

  const startDate = new Date().toISOString().slice(0, 10);
  const endDate = goal
    ? goal.race_date
    : new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  // Créer le plan.
  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      goal_id: goal?.id ?? null,
      name: goal ? `Plan ${goal.distance_m / 1000} km` : "Plan course",
      status: "active",
      start_date: startDate,
      end_date: endDate,
      vdot: generated.vdot.value,
      vdot_source: generated.vdot.source,
      vdot_is_estimated: generated.vdot.isEstimated,
      reference_volume_km: generated.referenceVolumeKm,
      notes_text: null,
    })
    .select()
    .single();

  if (planError || !plan) {
    return { error: planError?.message ?? "Erreur création du plan" };
  }

  // Insérer les règles.
  if (generated.rules.length > 0) {
    await supabase.from("plan_rules").insert(
      generated.rules.map((r) => ({
        plan_id: plan.id,
        rule_key: r.key,
        rule_value: r.value,
        explanation: r.explanation,
      })),
    );
  }

  // Insérer les sessions du plan et synchroniser vers planned_sessions.
  for (const s of generated.sessions) {
    const { data: ps } = await supabase
      .from("plan_sessions")
      .insert({
        plan_id: plan.id,
        user_id: userId,
        session_date: s.sessionDate,
        sport: s.sport,
        session_type: s.sessionType,
        duration_min: s.durationMin,
        distance_m: s.distanceM,
        target_zone: s.targetZone,
        target_pace_sec_per_km: s.targetPaceSecPerKm,
        rationale_text: s.rationaleText,
        recalculation_reason: s.recalculationReason,
        status: "planned",
      })
      .select()
      .single();

    if (ps) {
      // Synchroniser vers planned_sessions (agenda).
      const { data: planned } = await supabase
        .from("planned_sessions")
        .insert({
          user_id: userId,
          date: s.sessionDate,
          sport: "run",
          session_type: s.sessionType,
          duration_min: s.durationMin,
          objectives_json: {},
          details_json: { target_zone: s.targetZone, target_pace: s.targetPaceSecPerKm },
          brief_text: s.rationaleText,
          rationale_text: s.rationaleText,
          origin: "engine",
          status: "planned",
        })
        .select()
        .single();

      if (planned) {
        await supabase
          .from("plan_sessions")
          .update({ planned_session_id: planned.id })
          .eq("id", ps.id);
      }
    }
  }

  revalidatePath("/plan");
  revalidatePath("/");
  return { planId: plan.id };
}

export async function stopPlan(planId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Non autorisé" };
  const userId = userData.user.id;

  // Vérifier que le plan appartient à l'utilisateur.
  const { data: plan } = await supabase
    .from("training_plans")
    .select("id, status")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!plan) return { error: "Plan introuvable" };

  // Supprimer les séances futures planifiées (origin engine, date >= aujourd'hui).
  const today = new Date().toISOString().slice(0, 10);
  const { data: futurePlanSessions } = await supabase
    .from("plan_sessions")
    .select("id, planned_session_id")
    .eq("plan_id", planId)
    .eq("status", "planned")
    .gte("session_date", today);

  for (const ps of futurePlanSessions ?? []) {
    if (ps.planned_session_id) {
      await supabase.from("planned_sessions").delete().eq("id", ps.planned_session_id);
    }
  }
  await supabase
    .from("plan_sessions")
    .delete()
    .eq("plan_id", planId)
    .eq("status", "planned")
    .gte("session_date", today);

  // Marquer le plan comme abandoned.
  await supabase
    .from("training_plans")
    .update({ status: "abandoned" })
    .eq("id", planId);

  revalidatePath("/plan");
  revalidatePath("/");
  return { ok: true };
}

export async function adaptPlanAfterSession(sessionId: string) {
  // Appelé après l'enregistrement d'une séance de course.
  // Recalcule la fenêtre glissante du plan actif.
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const userId = userData.user.id;

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!plan) return;

  // Lire la séance qui vient d'être créée.
  const { data: session } = await supabase
    .from("run_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) return;

  // Lire le profil et l'historique.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return;

  // Lire les checkins récents.
  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("checkin_date, freshness_1_5")
    .eq("user_id", userId);
  const checkinInput = (checkins ?? []).map((c) => ({
    date: c.checkin_date,
    freshness: c.freshness_1_5,
  }));

  // Lire les blessures.
  const { data: injuries } = await supabase
    .from("injuries")
    .select("status, body_area")
    .eq("user_id", userId);
  const injuryInput = (injuries ?? []).map((i) => ({
    status: i.status,
    bodyArea: i.body_area,
  }));

  // Calculer l'adaptation.
  const { adaptAfterSession } = await import("@/lib/plan-generator");
  const historySession = {
    date: session.session_date,
    distanceM: session.distance_m,
    durationSec: session.duration_sec ?? session.duration_min * 60,
    avgPaceSecPerKm: session.avg_pace_sec,
    avgHr: null,
  };
  const profileInput = {
    birthDate: profile.birth_date,
    sex: profile.sex as "female" | "male" | "other" | "prefer_not_to_say" | null,
    hrMax: profile.hr_max,
    hrRest: profile.resting_hr,
    baselineWeeklyKm: profile.baseline_weekly_km,
    maxWeeklyKm: profile.max_weekly_km,
    experienceLevel: profile.experience_level as "beginner" | "intermediate" | "advanced" | null,
    weeklyAvailability: (profile.weekly_availability ?? {}) as Record<string, string[] | undefined>,
    declaredEasyPaceSecPerKm: null,
  };

  const adaptation = adaptAfterSession(
    { vdot: { value: plan.vdot ?? 30, source: (plan.vdot_source as "estimated") ?? "estimated", recordDate: null, isEstimated: plan.vdot_is_estimated ?? true }, zonePaces: {} as never, referenceVolumeKm: plan.reference_volume_km ?? 15, targetVolumeKm: plan.reference_volume_km ?? 15, isRecoveryWeek: false, taperWeeks: 0, sessions: [], rules: [] },
    historySession,
    profileInput,
    checkinInput,
    injuryInput,
  );

  // Mettre à jour le plan avec la raison de recalcul (stockée dans notes ou dans une règle).
  await supabase.from("plan_rules").insert({
    plan_id: plan.id,
    rule_key: "adaptation",
    rule_value: { volumeAdjustment: adaptation.volumeAdjustment, reason: adaptation.reason },
    explanation: adaptation.reason,
  });

  // Recalculer la fenêtre glissante : supprimer les séances futures non verrouillées et régénérer.
  const today = new Date().toISOString().slice(0, 10);
  const { data: futureSessions } = await supabase
    .from("plan_sessions")
    .select("id, planned_session_id, is_locked")
    .eq("plan_id", plan.id)
    .eq("status", "planned")
    .gte("session_date", today);

  for (const fs of futureSessions ?? []) {
    if (fs.is_locked) continue;
    if (fs.planned_session_id) {
      await supabase.from("planned_sessions").delete().eq("id", fs.planned_session_id);
    }
    await supabase.from("plan_sessions").delete().eq("id", fs.id);
  }

  revalidatePath("/plan");
  revalidatePath("/");
}
