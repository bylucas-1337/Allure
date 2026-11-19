"use client";

import { useActionState, useState } from "react";
import { resetOnboardingAction } from "@/app/actions/settings";
import {
  Feedback,
  Field,
  inputClass,
} from "@/components/settings/settings-ui";
import { IDLE_STATE, RESET_CONFIRMATION } from "@/lib/settings";

export function ResetOnboardingForm() {
  const [state, formAction, isPending] = useActionState(resetOnboardingAction, IDLE_STATE);
  const [value, setValue] = useState("");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <p className="text-sm leading-6 text-[#747a72]">
        Pour recommencer l’onboarding, écris{" "}
        <code className="rounded bg-[#f3f1ec] px-1.5 py-0.5 text-[#23372f]">{RESET_CONFIRMATION}</code>{" "}
        ci-dessous. Seront effacés : ton profil, tes pesées, tes zones sensibles et tes
        objectifs. Les séances déjà notées ne sont pas touchées.
      </p>

      <Field
        id="confirm"
        label="Confirmation"
        hint="Sensible à la casse."
        error={state.fieldErrors?.confirm}
      >
        <input
          id="confirm"
          name="confirm"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={inputClass}
          placeholder={RESET_CONFIRMATION}
          autoComplete="off"
        />
      </Field>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={isPending || value !== RESET_CONFIRMATION}
        className="min-h-11 rounded-xl border border-[#e5b7a6] bg-[#fff1e8] px-5 text-sm font-semibold text-[#a94327] transition hover:bg-[#ffe4d6] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Suppression…" : "Supprimer et recommencer l’onboarding"}
      </button>
    </form>
  );
}
