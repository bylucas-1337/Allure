import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  computeBestEfforts,
  computeHrZones,
  dateInTimeZone,
  estimateMaxHeartRate,
  hashBytes,
} from "@/lib/import/activity";
import { parseFit } from "@/lib/import/fit";
import { parseGpx } from "@/lib/import/gpx";
import { ImportError, type ParsedActivity } from "@/lib/import/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FILES = 10;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_BODY_BYTES = 60 * 1024 * 1024;

type ImportFileResult = {
  fileName: string;
  status: "imported" | "skipped" | "error";
  message: string;
  sessionId?: string;
  summary?: {
    date: string;
    distanceM: number;
    durationSec: number;
    avgPaceSec: number | null;
    avgHeartRate: number | null;
    elevationGainM: number | null;
  };
};

function detectSource(fileName: string, bytes: Uint8Array): "fit" | "gpx" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".fit")) {
    return "fit";
  }
  if (lower.endsWith(".gpx")) {
    return "gpx";
  }

  const isFit =
    bytes.length > 12 &&
    bytes[8] === 0x2e &&
    bytes[9] === 0x46 &&
    bytes[10] === 0x49 &&
    bytes[11] === 0x54;
  if (isFit) {
    return "fit";
  }

  const beginning = new TextDecoder().decode(bytes.slice(0, 64)).trimStart();
  if (beginning.startsWith("<")) {
    return "gpx";
  }

  throw new ImportError(
    "unsupported",
    "Format non reconnu. Utilise un fichier .fit ou .gpx exporté depuis ta montre.",
  );
}

async function parseActivity(
  fileName: string,
  arrayBuffer: ArrayBuffer,
): Promise<ParsedActivity> {
  const bytes = new Uint8Array(arrayBuffer);
  const source = detectSource(fileName, bytes);
  if (source === "fit") {
    return parseFit(arrayBuffer, fileName);
  }
  const text = new TextDecoder("utf-8").decode(arrayBuffer);
  return parseGpx(text, fileName);
}

function isSimilarSession(
  activity: ParsedActivity,
  row: { distance_m: number | null; duration_min: number; duration_sec: number | null },
): boolean {
  const distance = row.distance_m ?? 0;
  const distanceTolerance = Math.max(100, distance * 0.02);
  if (Math.abs(distance - activity.distanceM) > distanceTolerance) {
    return false;
  }

  const duration = row.duration_min * 60 + (row.duration_sec ?? 0);
  const durationTolerance = Math.max(60, duration * 0.02);
  return Math.abs(duration - activity.durationSec) <= durationTolerance;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Envoi trop volumineux (60 Mo maximum)." },
      { status: 413 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  const userId = userData.user.id;

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const force = formData.get("force") === "1";

  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Aucun fichier reçu." },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Importe au maximum ${MAX_FILES} fichiers à la fois.` },
      { status: 400 },
    );
  }
  if (files.some((file) => file.size > MAX_FILE_BYTES)) {
    return NextResponse.json(
      { ok: false, error: "Chaque fichier doit faire moins de 20 Mo." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, birth_date")
    .eq("user_id", userId)
    .maybeSingle<{ timezone: string | null; birth_date: string | null }>();

  const timeZone = profile?.timezone || "Europe/Paris";
  const estimatedMaxHeartRate = estimateMaxHeartRate(profile?.birth_date ?? null);

  const results: ImportFileResult[] = [];
  let importedCount = 0;
  let migrationMissing = false;

  for (const file of files) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const activity = await parseActivity(file.name, arrayBuffer);

      if (activity.durationSec > 86400) {
        throw new ImportError(
          "invalid",
          "Cette activité dépasse 24 heures. Allure ne peut pas l'enregistrer en l'état.",
        );
      }
      if (activity.distanceM > 500000) {
        throw new ImportError(
          "invalid",
          "Cette activité dépasse 500 km. Allure ne peut pas l'enregistrer en l'état.",
        );
      }

      const sessionDate = dateInTimeZone(activity.startedAt, timeZone);

      const importKey = hashBytes(new Uint8Array(arrayBuffer));
      if (!force) {
        const { data: duplicate } = await supabase
          .from("run_sessions")
          .select("id")
          .eq("user_id", userId)
          .eq("import_key", importKey)
          .maybeSingle<{ id: string }>();

        if (duplicate) {
          results.push({
            fileName: file.name,
            status: "skipped",
            message: "Ce fichier a déjà été importé.",
          });
          continue;
        }

        const { data: sameDay } = await supabase
          .from("run_sessions")
          .select("id, distance_m, duration_min, duration_sec")
          .eq("user_id", userId)
          .eq("session_date", sessionDate)
          .returns<
            { id: string; distance_m: number | null; duration_min: number; duration_sec: number | null }[]
          >();

        const similar = (sameDay ?? []).find((row) => isSimilarSession(activity, row));
        if (similar) {
          results.push({
            fileName: file.name,
            status: "skipped",
            message:
              "Une séance très proche existe déjà à cette date (même distance et durée). Coche « importer quand même » pour la créer malgré tout.",
          });
          continue;
        }
      }

      const durationMin = Math.floor(activity.durationSec / 60);
      const durationSec = activity.durationSec % 60;
      const avgPaceSec =
        activity.distanceM > 0
          ? Math.round(activity.durationSec / (activity.distanceM / 1000))
          : null;
      const bestEfforts = computeBestEfforts(activity.points);
      const hrZones = computeHrZones(activity.points, estimatedMaxHeartRate);

      const { data: inserted, error } = await supabase
        .from("run_sessions")
        .insert({
          user_id: userId,
          session_date: sessionDate,
          session_type: "easy",
          duration_min: durationMin,
          duration_sec: durationSec,
          distance_m: activity.distanceM,
          avg_pace_sec: avgPaceSec,
          rpe: null,
          notes: activity.notes,
          goal_id: null,
          source: activity.source,
          import_key: force
            ? `${importKey}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
            : importKey,
          imported_at: new Date().toISOString(),
          avg_hr: activity.avgHeartRate,
          max_hr: activity.maxHeartRate,
          elevation_gain_m: activity.elevationGainM,
          calories:
            activity.calories === null ? null : Math.round(activity.calories),
          moving_time_sec: activity.movingSec,
          elapsed_time_sec: activity.elapsedSec,
          best_efforts: bestEfforts,
          hr_zones: hrZones ?? {},
        })
        .select("id")
        .single<{ id: string }>();

      if (error) {
        if (error.code === "23505") {
          results.push({
            fileName: file.name,
            status: "skipped",
            message: "Ce fichier a déjà été importé.",
          });
          continue;
        }
        if (
          error.code === "42703" ||
          /column .* does not exist/i.test(error.message)
        ) {
          migrationMissing = true;
          results.push({
            fileName: file.name,
            status: "error",
            message:
              "La migration V8 n'est pas appliquée dans Supabase. Colle le fichier supabase/migrations/20261120000000_v8_run_import.sql dans le SQL Editor, puis réessaie.",
          });
          continue;
        }
        results.push({
          fileName: file.name,
          status: "error",
          message: `Enregistrement impossible : ${error.message}`,
        });
        continue;
      }

      importedCount += 1;
      results.push({
        fileName: file.name,
        status: "imported",
        message: "Séance importée.",
        sessionId: inserted?.id,
        summary: {
          date: sessionDate,
          distanceM: activity.distanceM,
          durationSec: activity.durationSec,
          avgPaceSec,
          avgHeartRate: activity.avgHeartRate,
          elevationGainM: activity.elevationGainM,
        },
      });
    } catch (error) {
      if (error instanceof ImportError) {
        results.push({
          fileName: file.name,
          status: "error",
          message: error.message,
        });
      } else {
        results.push({
          fileName: file.name,
          status: "error",
          message: "Lecture impossible. Vérifie que le fichier n'est pas endommagé.",
        });
      }
    }
  }

  if (importedCount > 0) {
    revalidatePath("/");
    revalidatePath("/ajouter");
    revalidatePath("/historique");
    revalidatePath("/stats");
    revalidatePath("/importer");
  }

  return NextResponse.json({
    ok: true,
    importedCount,
    migrationMissing,
    results,
  });
}
