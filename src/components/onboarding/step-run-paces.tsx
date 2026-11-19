import { Field, inputClass } from "@/components/onboarding/fields";
import type { StepProps } from "@/components/onboarding/types";

export function StepRunPaces({ draft, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-[#f5f7f1] px-4 py-3 text-sm leading-6 text-[#5d675c]">
        Les allures s’écrivent en <strong>minutes:secondes par kilomètre</strong> (par
        exemple <code className="rounded bg-white px-1.5 py-0.5">5:30</code>). Si tu ne
        les connais pas, laisse vide : le programme partira de tes records.
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          id="easyPace"
          label="Allure facile"
          hint="Tu peux tenir une conversation."
          error={errors.easyPace}
        >
          <input
            id="easyPace"
            name="easyPace"
            type="text"
            inputMode="numeric"
            value={draft.easyPace}
            onChange={(event) => update({ easyPace: event.target.value })}
            className={inputClass}
            placeholder="6:15"
          />
        </Field>

        <Field
          id="thresholdPace"
          label="Allure seuil"
          hint="Soutenue, environ une heure max."
          error={errors.thresholdPace}
        >
          <input
            id="thresholdPace"
            name="thresholdPace"
            type="text"
            inputMode="numeric"
            value={draft.thresholdPace}
            onChange={(event) => update({ thresholdPace: event.target.value })}
            className={inputClass}
            placeholder="5:05"
          />
        </Field>

        <Field
          id="racePace"
          label="Allure de course"
          hint="Celle de ton objectif."
          error={errors.racePace}
        >
          <input
            id="racePace"
            name="racePace"
            type="text"
            inputMode="numeric"
            value={draft.racePace}
            onChange={(event) => update({ racePace: event.target.value })}
            className={inputClass}
            placeholder="4:45"
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-[#e8e9e1] bg-[#fbfcfa] p-4 sm:p-5">
        <p className="text-sm font-semibold text-[#34493e]">Tes meilleurs temps (optionnel)</p>
        <p className="mt-1 text-xs leading-5 text-[#8a9088]">
          Un seul record suffit pour estimer les autres allures. Format{" "}
          <code className="rounded bg-white px-1.5 py-0.5">22:30</code> ou{" "}
          <code className="rounded bg-white px-1.5 py-0.5">1:45:00</code>.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="pb5k" label="5 km" error={errors.pb5k}>
            <input
              id="pb5k"
              name="pb5k"
              type="text"
              inputMode="numeric"
              value={draft.pb5k}
              onChange={(event) => update({ pb5k: event.target.value })}
              className={inputClass}
              placeholder="22:30"
            />
          </Field>

          <Field id="pb10k" label="10 km" error={errors.pb10k}>
            <input
              id="pb10k"
              name="pb10k"
              type="text"
              inputMode="numeric"
              value={draft.pb10k}
              onChange={(event) => update({ pb10k: event.target.value })}
              className={inputClass}
              placeholder="46:00"
            />
          </Field>

          <Field id="pbHalf" label="Semi-marathon" error={errors.pbHalf}>
            <input
              id="pbHalf"
              name="pbHalf"
              type="text"
              inputMode="numeric"
              value={draft.pbHalf}
              onChange={(event) => update({ pbHalf: event.target.value })}
              className={inputClass}
              placeholder="1:45:00"
            />
          </Field>

          <Field id="pbMarathon" label="Marathon" error={errors.pbMarathon}>
            <input
              id="pbMarathon"
              name="pbMarathon"
              type="text"
              inputMode="numeric"
              value={draft.pbMarathon}
              onChange={(event) => update({ pbMarathon: event.target.value })}
              className={inputClass}
              placeholder="3:45:00"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
