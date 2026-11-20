"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  formatDistance,
  formatDuration,
  inputClass,
  primaryButtonClass,
} from "@/components/settings/settings-ui";

type ImportResult = {
  fileName: string;
  status: "imported" | "skipped" | "error";
  message: string;
  summary?: {
    date: string;
    distanceM: number;
    durationSec: number;
    avgPaceSec: number | null;
    avgHeartRate: number | null;
    elevationGainM: number | null;
  };
};

type ImportResponse = {
  ok: boolean;
  importedCount?: number;
  migrationMissing?: boolean;
  error?: string;
  results?: ImportResult[];
};

function resultClass(status: ImportResult["status"]): string {
  if (status === "imported") {
    return "border-[#cfe4c2] bg-[#f2f8ed]";
  }
  if (status === "skipped") {
    return "border-[#f0dfb7] bg-[#fdf7e8]";
  }
  return "border-[#f0d0c5] bg-[#fdf1ec]";
}

export function ImportForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [migrationMissing, setMigrationMissing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setError(null);
    setResults([]);
    setImportedCount(0);
    setMigrationMissing(false);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as ImportResponse | null;

      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? "L'import a échoué. Réessaie dans un instant.");
        return;
      }

      setResults(payload.results ?? []);
      setImportedCount(payload.importedCount ?? 0);
      setMigrationMissing(Boolean(payload.migrationMissing));
      form.reset();
      if ((payload.importedCount ?? 0) > 0) {
        router.refresh();
      }
    } catch {
      setError("Impossible de joindre le serveur. Vérifie ta connexion.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="import-files" className="mb-1.5 block text-sm font-semibold text-[#34493e]">
            Fichiers d&apos;activité
          </label>
          <input
            id="import-files"
            name="files"
            type="file"
            multiple
            accept=".fit,.gpx,application/octet-stream,application/gpx+xml"
            className={`${inputClass} py-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eaf2df] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#245642]`}
          />
          <p className="mt-1.5 text-xs leading-5 text-[#8a9088]">
            Jusqu&apos;à 10 fichiers, 20 Mo maximum par fichier. Les fichiers ne sont pas
            conservés : seules les mesures utiles à la séance sont enregistrées.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-[#e8e9e1] bg-[#fbfcfa] px-4 py-3 text-sm text-[#5d675c]">
          <input type="checkbox" name="force" value="1" className="mt-0.5 h-4 w-4 accent-[#245642]" />
          <span>
            <span className="font-semibold text-[#34493e]">Importer quand même</span> — ignore la
            détection des doublons (même fichier ou séance très proche).
          </span>
        </label>

        {error ? (
          <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm text-[#9a412b]">{error}</p>
        ) : null}

        {migrationMissing ? (
          <p className="rounded-xl bg-[#fff1e8] px-4 py-3 text-sm leading-6 text-[#9a412b]">
            La migration V8 doit être appliquée dans Supabase avant le premier import. Colle
            <span className="mx-1 font-mono text-xs">supabase/migrations/20261120000000_v8_run_import.sql</span>
            dans le SQL Editor, puis réessaie.
          </p>
        ) : null}

        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Import en cours…" : "Importer les fichiers"}
        </button>
      </form>

      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#34493e]">
            {importedCount > 0
              ? `${importedCount} séance${importedCount > 1 ? "s" : ""} importée${importedCount > 1 ? "s" : ""}.`
              : "Aucune séance importée."}
          </p>
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li
                key={`${result.fileName}-${index}`}
                className={`rounded-2xl border p-4 text-sm ${resultClass(result.status)}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-[#23372f]">{result.fileName}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7b8178]">
                    {result.status === "imported"
                      ? "Importé"
                      : result.status === "skipped"
                        ? "Ignoré"
                        : "Erreur"}
                  </span>
                </div>
                <p className="mt-1 leading-6 text-[#5d675c]">{result.message}</p>
                {result.summary ? (
                  <p className="mt-1 text-xs leading-5 text-[#7b8178]">
                    {result.summary.date} · {formatDistance(result.summary.distanceM)} ·{" "}
                    {formatDuration(result.summary.durationSec)}
                    {result.summary.avgPaceSec
                      ? ` · ${formatDuration(result.summary.avgPaceSec)} /km`
                      : ""}
                    {result.summary.avgHeartRate
                      ? ` · FC moy. ${result.summary.avgHeartRate} bpm`
                      : ""}
                    {result.summary.elevationGainM
                      ? ` · D+ ${result.summary.elevationGainM} m`
                      : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
