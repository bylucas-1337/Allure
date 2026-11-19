"use server";

import { redirect } from "next/navigation";
import {
  LAST_STEP,
  draftFromFormData,
  toGoalRow,
  toInjuryRows,
  toProfileRow,
  toWeightRow,
  validateStep,
  type SaveOnboardingResult,
  type StepNumber,
} from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRITE_ERROR =
  "L’enregistrement a échoué. Vérifie ta connexion, puis réessaie.";

function readStep(value: FormDataEntryValue | null): StepNumber {
  const step = Number(value);
  if (Number.isInteger(step) && step >= 1 && step <= LAST_STEP) {
    return step as StepNumber;
  }
  return 1;
}

/**
 * Enregistre une étape de l'onboarding.
 *
 * Chaque étape écrit uniquement ce qu'elle concerne : un abandon en cours de
 * route laisse donc un profil partiel mais cohérent, que l'on peut reprendre.
 * La dernière étape marque le profil comme terminé.
 */
export async function saveOnboardingStep(formData: FormData): Promise<SaveOnboardingResult> {
  const step = readStep(formData.get("step"));
  const draft = draftFromFormData(formData);

  const fieldErrors = validateStep(step, draft);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, step, fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/connexion");
  }

  const userId = userData.user.id;
  const completing = step === LAST_STEP;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      ...toProfileRow(draft),
      ...(completing ? { onboarding_completed_at: new Date().toISOString() } : {}),
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return { ok: false, step, message: WRITE_ERROR };
  }

  const weightRow = toWeightRow(draft);
  if (weightRow) {
    const { error: weightError } = await supabase.from("weight_entries").upsert(
      { user_id: userId, ...weightRow },
      { onConflict: "user_id,measured_on" },
    );

    if (weightError) {
      return { ok: false, step, message: WRITE_ERROR };
    }
  }

  // À partir de l'étape 3, le brouillon contient toutes les gênes en cours :
  // on remplace cette liste pour refléter exactement la saisie, sans toucher
  // aux blessures déjà guéries (conservées comme historique).
  if (step >= 3) {
    const { error: deleteError } = await supabase
      .from("injuries")
      .delete()
      .eq("user_id", userId)
      .neq("status", "recovered");

    if (deleteError) {
      return { ok: false, step, message: WRITE_ERROR };
    }

    const injuryRows = toInjuryRows(draft);
    if (injuryRows.length > 0) {
      const { error: injuriesError } = await supabase
        .from("injuries")
        .insert(injuryRows.map((injury) => ({ user_id: userId, ...injury })));

      if (injuriesError) {
        return { ok: false, step, message: WRITE_ERROR };
      }
    }
  }

  if (completing) {
    const goalRow = toGoalRow(draft);

    if (goalRow) {
      // Un seul objectif PRINCIPAL actif : l'ancien passe en abandonné, il
      // reste dans l'historique. Les courses secondaires ne sont pas touchées.
      const { error: goalResetError } = await supabase
        .from("goals")
        .update({ status: "abandoned" })
        .eq("user_id", userId)
        .eq("sport", "run")
        .eq("goal_kind", "main")
        .eq("status", "active");

      if (goalResetError) {
        return { ok: false, step, message: WRITE_ERROR };
      }

      const { error: goalError } = await supabase
        .from("goals")
        .insert({ user_id: userId, ...goalRow });

      if (goalError) {
        return { ok: false, step, message: WRITE_ERROR };
      }
    }
  }

  if (completing) {
    return { ok: true, completed: true, step };
  }

  return { ok: true, completed: false, step };
}
