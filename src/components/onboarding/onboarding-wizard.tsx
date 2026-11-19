"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { saveOnboardingStep } from "@/app/actions/onboarding";
import {
  LAST_STEP,
  ONBOARDING_STEPS,
  validateStep,
  type FieldErrors,
  type GoalDraft,
  type InjuryDraft,
  type OnboardingDraft,
  type StepNumber,
} from "@/lib/onboarding";
import { primaryButtonClass, secondaryButtonClass } from "@/components/onboarding/fields";
import { StepHealth } from "@/components/onboarding/step-health";
import { StepIdentity } from "@/components/onboarding/step-identity";
import { StepRecap } from "@/components/onboarding/step-recap";
import { StepRunGoal } from "@/components/onboarding/step-run-goal";
import { StepRunPaces } from "@/components/onboarding/step-run-paces";
import { StepRunPractice } from "@/components/onboarding/step-run-practice";
import { StepStrength } from "@/components/onboarding/step-strength";

/**
 * Reprise : on rouvre la première section encore vide, sans jamais sauter
 * l'étape des mesures obligatoires.
 */
function resumeStep(draft: OnboardingDraft): StepNumber {
  if (draft.heightCm === "" || draft.weightKg === "") {
    return 1;
  }

  const runPracticeEmpty =
    draft.runDays.length === 0 &&
    draft.runSessionsPerWeek === "" &&
    draft.runWeeklyKm === "" &&
    draft.runExperienceLevel === "";
  if (runPracticeEmpty) {
    return 2;
  }

  const pacesEmpty =
    [draft.easyPace, draft.thresholdPace, draft.racePace, draft.pb5k, draft.pb10k, draft.pbHalf, draft.pbMarathon].every(
      (value) => value === "",
    );
  if (pacesEmpty) {
    return 3;
  }

  const strengthEmpty =
    draft.strengthDays.length === 0 &&
    draft.strengthSessionsPerWeek === "" &&
    draft.strengthGoal === "" &&
    draft.muscleGroups.length === 0 &&
    draft.equipment.length === 0;
  if (strengthEmpty) {
    return 5;
  }

  const healthEmpty = draft.injuries.length === 0;
  if (healthEmpty) {
    return 6;
  }

  return LAST_STEP;
}

function StepProgress({ step }: { step: StepNumber }) {
  return (
    <div>
      <div aria-hidden="true" className="flex gap-1.5">
        {ONBOARDING_STEPS.map((item) => (
          <span
            key={item.step}
            className={`h-1.5 flex-1 rounded-full transition ${
              item.step <= step ? "bg-[#6f9c7d]" : "bg-[#e5e8df]"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">
        Étape {step} sur {LAST_STEP}
      </p>
    </div>
  );
}

export function OnboardingWizard({ initialDraft }: { initialDraft: OnboardingDraft }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [step, setStep] = useState<StepNumber>(() => resumeStep(initialDraft));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentStep = ONBOARDING_STEPS[step - 1];

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((previous) => ({ ...previous, ...patch }));
  }

  function updateGoal(patch: Partial<GoalDraft>) {
    setDraft((previous) => ({ ...previous, goal: { ...previous.goal, ...patch } }));
  }

  function addInjury() {
    if (draft.injuries.length >= 10) {
      return;
    }

    const injury: InjuryDraft = {
      key: `local-${Date.now()}-${draft.injuries.length}`,
      label: "",
      bodyArea: "",
      status: "active",
      startedOn: "",
    };

    update({ injuries: [...draft.injuries, injury] });
  }

  function updateInjury(key: string, patch: Partial<InjuryDraft>) {
    update({
      injuries: draft.injuries.map((injury) =>
        injury.key === key ? { ...injury, ...patch } : injury,
      ),
    });
  }

  function removeInjury(key: string) {
    update({ injuries: draft.injuries.filter((injury) => injury.key !== key) });
  }

  function goToStep(target: StepNumber) {
    setErrors({});
    setMessage(null);
    setStep(target);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const clientErrors = validateStep(step, draft);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setMessage("Il reste un ou deux champs à vérifier.");
      return;
    }

    setErrors({});
    setMessage(null);
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("step", String(step));
      const result = await saveOnboardingStep(formData);

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message ?? "Vérifie les champs signalés, puis réessaie.");
        return;
      }

      if (result.completed) {
        router.replace("/");
        router.refresh();
        return;
      }

      setStep((previous) => Math.min(LAST_STEP, previous + 1) as StepNumber);
      setMessage(null);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setMessage("Impossible d’enregistrer pour le moment. Vérifie ta connexion, puis réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={cardRef}
      className="mx-auto max-w-2xl rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm sm:p-9"
    >
      <StepProgress step={step} />

      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#23372f]">
        {currentStep.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#747a72]">{currentStep.subtitle}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-7">
        <input type="hidden" name="step" value={step} />
        <input type="hidden" name="injuries" value={JSON.stringify(draft.injuries)} />

        {/* Toutes les étapes restent montées : le formulaire enregistre ainsi
            l'ensemble du brouillon, même pour les sections déjà passées. */}
        <div hidden={step !== 1}>
          <StepIdentity draft={draft} errors={errors} update={update} updateGoal={updateGoal} />
        </div>

        <div hidden={step !== 2}>
          <StepRunPractice draft={draft} errors={errors} update={update} updateGoal={updateGoal} />
        </div>

        <div hidden={step !== 3}>
          <StepRunPaces draft={draft} errors={errors} update={update} updateGoal={updateGoal} />
        </div>

        <div hidden={step !== 4}>
          <StepRunGoal draft={draft} errors={errors} update={update} updateGoal={updateGoal} />
        </div>

        <div hidden={step !== 5}>
          <StepStrength draft={draft} errors={errors} update={update} updateGoal={updateGoal} />
        </div>

        <div hidden={step !== 6}>
          <StepHealth
            draft={draft}
            errors={errors}
            update={update}
            updateGoal={updateGoal}
            addInjury={addInjury}
            updateInjury={updateInjury}
            removeInjury={removeInjury}
          />
        </div>

        <div hidden={step !== 7}>
          <StepRecap
            draft={draft}
            errors={errors}
            update={update}
            updateGoal={updateGoal}
            goToStep={goToStep}
          />
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setMessage(null);
              setStep((previous) => Math.max(1, previous - 1) as StepNumber);
            }}
            disabled={step === 1 || saving}
            className={`${secondaryButtonClass} ${step === 1 ? "invisible" : ""}`}
          >
            Retour
          </button>

          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving
              ? "Enregistrement…"
              : step === LAST_STEP
                ? "Terminer et ouvrir mon accueil"
                : "Continuer"}
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${
            message ? "bg-[#fff1e8] text-[#9a412b]" : "hidden"
          }`}
        >
          {message}
        </p>
      </form>
    </div>
  );
}
