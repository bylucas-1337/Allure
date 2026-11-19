import type {
  FieldErrors,
  GoalDraft,
  InjuryDraft,
  OnboardingDraft,
} from "@/lib/onboarding";

export type StepProps = {
  draft: OnboardingDraft;
  errors: FieldErrors;
  update: (patch: Partial<OnboardingDraft>) => void;
  updateGoal: (patch: Partial<GoalDraft>) => void;
};

export type HealthStepProps = StepProps & {
  addInjury: () => void;
  updateInjury: (key: string, patch: Partial<InjuryDraft>) => void;
  removeInjury: (key: string) => void;
};
