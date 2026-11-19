import type { ReactNode } from "react";
import { AVAILABILITY_DAYS, type AvailabilityDay } from "@/lib/availability";

export const labelClass = "mb-1.5 block text-sm font-semibold text-[#34493e]";
export const inputClass =
  "min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none transition placeholder:text-[#a0a69e] focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df] disabled:opacity-60";
export const hintClass = "mt-1.5 text-xs leading-5 text-[#8a9088]";
export const errorClass = "mt-1.5 text-xs font-medium leading-5 text-[#a94327]";
export const primaryButtonClass =
  "min-h-12 rounded-xl bg-[#245642] px-6 text-sm font-bold text-white transition hover:bg-[#173d35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245642] disabled:cursor-wait disabled:opacity-65";
export const secondaryButtonClass =
  "min-h-12 rounded-xl border border-[#dce2d7] bg-white px-5 text-sm font-semibold text-[#32634f] transition hover:bg-[#f4f6f1] disabled:cursor-not-allowed disabled:opacity-50";

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className={errorClass}>{message}</p>;
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className={hintClass}>{hint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

const pillClass = (selected: boolean) =>
  `flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6f9c7d] has-[:focus-visible]:ring-offset-2 ${
    selected
      ? "border-[#6f9c7d] bg-[#eaf2df] text-[#245642]"
      : "border-[#dce2d7] bg-[#fbfcfa] text-[#6f776e] hover:border-[#b8d5b9]"
  }`;

export function DayPicker({
  name,
  label,
  hint,
  error,
  selected,
  onToggle,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  selected: AvailabilityDay[];
  onToggle: (day: AvailabilityDay) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {AVAILABILITY_DAYS.map((day) => (
          <label key={day.value} className={pillClass(selected.includes(day.value))}>
            <input
              type="checkbox"
              name={name}
              value={day.value}
              checked={selected.includes(day.value)}
              onChange={() => onToggle(day.value)}
              className="sr-only"
            />
            {day.label}
          </label>
        ))}
      </div>
      {hint && !error ? <p className={hintClass}>{hint}</p> : null}
      <FieldError message={error} />
    </fieldset>
  );
}

export function CheckPills({
  name,
  label,
  hint,
  error,
  options,
  selected,
  onToggle,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className={labelClass}>{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className={pillClass(selected.includes(option.value))}>
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {hint && !error ? <p className={hintClass}>{hint}</p> : null}
      <FieldError message={error} />
    </fieldset>
  );
}

export function RadioCard({
  name,
  value,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#dce2d7] bg-[#fbfcfa] p-3.5 transition has-[:checked]:border-[#6f9c7d] has-[:checked]:bg-[#eaf2df]">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 accent-[#245642]"
      />
      <span>
        <span className="block text-sm font-semibold text-[#34493e]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-5 text-[#8a9088]">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}
