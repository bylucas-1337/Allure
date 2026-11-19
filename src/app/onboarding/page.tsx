import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getOnboardingDraft } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Bienvenue",
};

async function OnboardingContent() {
  const { draft } = await getOnboardingDraft();

  return <OnboardingWizard initialDraft={draft} />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm text-[#747a72]">Préparation de ton profil…</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
