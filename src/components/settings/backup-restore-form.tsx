"use client";

import { useState } from "react";

type ReportEntry = { inserted: number; deleted: number; error?: string };

export function BackupRestoreForm() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [report, setReport] = useState<Record<string, ReportEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    if (!file) return;
    const confirmed = window.confirm(
      "La restauration remplacera tes données actuelles par celles de la sauvegarde. Continuer ?",
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    setError(null);
    setReport(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) {
        setError(data?.error ?? "Échec de la restauration");
        return;
      }
      setReport(data.report ?? null);
      setMessage(
        data.ok
          ? "Restauration terminée."
          : "Restauration partielle : certaines tables ont rencontré une erreur.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fichier invalide");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept="application/json,.json"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />
      <button
        type="button"
        onClick={handleRestore}
        disabled={!file || busy}
        className="inline-flex min-h-11 items-center rounded-xl border border-[#dce2d7] bg-white px-4 text-sm font-semibold text-[#32634f] transition hover:bg-[#f4f6f1] disabled:opacity-50"
      >
        {busy ? "Restauration…" : "Restaurer depuis ce fichier"}
      </button>
      {message && <p className="text-sm text-[#32634f]">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {report && (
        <div className="rounded-xl border border-[#dce2d7] bg-[#fbfcfa] p-3 text-xs">
          <p className="mb-2 font-semibold">Rapport par table</p>
          <ul className="space-y-1">
            {Object.entries(report).map(([table, r]) => (
              <li key={table} className="flex justify-between gap-2">
                <span>{table}</span>
                <span>
                  {r.inserted} insérés
                  {r.error ? ` — erreur : ${r.error}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-[#5c6f66]">
        La restauration remplace les données existantes par celles du fichier. Garde
        une copie de ta sauvegarde actuelle avant de restaurer.
      </p>
    </div>
  );
}
