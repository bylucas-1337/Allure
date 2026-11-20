"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createPlanFromProfile } from "@/app/actions/plan";

type Step = "intro" | "goal" | "level" | "availability" | "volume" | "confirm";

export function PlanAssistant() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [goalId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const res = await createPlanFromProfile(goalId);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  const steps: { id: Step; title: string; body: React.ReactNode }[] = [
    {
      id: "intro",
      title: "Créer ton plan course",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Le moteur va proposer un plan sur 4 semaines glissantes, adapté à ton
            objectif, à tes disponibilités et à ton niveau. Tu pourras l&apos;arrêter
            ou le remplacer à tout moment.
          </p>
          <button
            type="button"
            onClick={() => setStep("goal")}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
          >
            Commencer
          </button>
        </div>
      ),
    },
    {
      id: "goal",
      title: "Objectif de course",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Le plan se base sur ton objectif principal actif. Si tu n&apos;en as pas,
            crée-en un dans Réglages → Objectifs.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("level")}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep("intro")}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "level",
      title: "Niveau estimé (VDOT)",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Le moteur calcule ton VDOT à partir de tes records récents (&lt; 12 mois)
            ou, à défaut, depuis ton allure facile déclarée. Les allures cibles seront
            des fourchettes.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("availability")}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep("goal")}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "availability",
      title: "Disponibilités",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Les jours d&apos;entraînement proviennent de ton profil (Réglages → Course).
            Le moteur respectera strictement ces jours.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("volume")}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep("level")}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "volume",
      title: "Volume",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Le volume hebdomadaire cible est calculé depuis tes 3 dernières semaines
            actives (+2 à +7 km, max 10 %). Tu peux ajuster le plafond dans
            Réglages → Course.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStep("availability")}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "confirm",
      title: "Confirmer la création",
      body: (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-[#747a72]">
            Le moteur va générer 4 semaines de séances et les ajouter à ton agenda.
            Tu pourras les déplacer, les sauter ou les modifier.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-xl bg-[#6f9c7d] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Création…" : "Créer le plan"}
            </button>
            <button
              type="button"
              onClick={() => setStep("volume")}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f]"
            >
              Retour
            </button>
          </div>
        </div>
      ),
    },
  ];

  const current = steps.find((s) => s.id === step)!;

  return (
    <div className="rounded-[1.75rem] border border-[#e8e9e1] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#23372f]">{current.title}</h2>
      <div className="mt-4">{current.body}</div>
    </div>
  );
}
