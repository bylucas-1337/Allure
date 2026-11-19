import type { ReactNode } from "react";
import type { ActionState } from "@/lib/settings";

export const labelClass = "mb-1.5 block text-sm font-semibold text-[#34493e]";
export const inputClass =
  "min-h-12 w-full rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-4 text-sm text-[#23372f] outline-none transition placeholder:text-[#a0a69e] focus:border-[#6f9c7d] focus:ring-4 focus:ring-[#eaf2df] disabled:opacity-60";
export const hintClass = "mt-1.5 text-xs leading-5 text-[#8a9088]";
export const errorClass = "mt-1.5 text-xs font-medium leading-5 text-[#a94327]";
export const primaryButtonClass =
  "min-h-11 rounded-xl bg-[#245642] px-5 text-sm font-bold text-white transition hover:bg-[#173d35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245642] disabled:cursor-wait disabled:opacity-65";
export const secondaryButtonClass =
  "min-h-11 rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f] transition hover:bg-[#f4f6f1] disabled:opacity-50";
export const dangerButtonClass =
  "text-xs font-semibold text-[#a94327] underline decoration-[#e5b7a6] underline-offset-4 transition hover:text-[#7d2f1c] disabled:opacity-50";
export const subtleButtonClass =
  "text-xs font-semibold text-[#32634f] underline decoration-[#b8d5b9] underline-offset-4 transition hover:text-[#173d35] disabled:opacity-50";
export const cardClass =
  "rounded-[1.75rem] border border-[#e8e9e1] bg-white p-5 shadow-sm sm:p-7";

export function SectionCard({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={cardClass}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#81877f]">{eyebrow}</p>
      <h2
        id={`${id}-heading`}
        className="mt-1 text-xl font-semibold tracking-tight text-[#23372f]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#747a72]">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
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
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  );
}

/** Case à cocher présentée comme une pastille, sans état JavaScript. */
export function CheckboxPill({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-[#dce2d7] bg-[#fbfcfa] px-3 text-center text-sm font-semibold text-[#6f776e] transition hover:border-[#b8d5b9] has-[:checked]:border-[#6f9c7d] has-[:checked]:bg-[#eaf2df] has-[:checked]:text-[#245642] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6f9c7d] has-[:focus-visible]:ring-offset-2">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {label}
    </label>
  );
}

export function Feedback({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl px-4 py-3 text-sm leading-6 ${
        state.status === "success"
          ? "bg-[#edf5e6] text-[#315d3d]"
          : "bg-[#fff1e8] text-[#9a412b]"
      }`}
    >
      {state.message}
    </p>
  );
}

export function formatDate(isoDate: string): string {
  if (!isoDate) {
    return "—";
  }

  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDuration(totalSeconds: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return "—";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }

  return `${seconds} s`;
}

export function formatDistance(distanceM: number | null): string {
  if (!distanceM || distanceM <= 0) {
    return "—";
  }

  const km = distanceM / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1).replace(".", ",")} km`;
}
