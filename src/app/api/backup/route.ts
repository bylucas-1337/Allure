import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const USER_TABLES = [
  "profiles",
  "weight_entries",
  "injuries",
  "goals",
  "exercises",
  "sessions",
  "run_details",
  "strength_sets",
  "feelings",
  "run_sessions",
  "strength_sessions",
  "planned_sessions",
  "daily_checkins",
  "training_plans",
  "plan_rules",
  "plan_sessions",
] as const;

type TableName = (typeof USER_TABLES)[number];

// Ordre d'insertion respectant les clés étrangères.
const INSERT_ORDER: TableName[] = [
  "profiles",
  "weight_entries",
  "injuries",
  "goals",
  "exercises",
  "sessions",
  "run_details",
  "strength_sets",
  "feelings",
  "run_sessions",
  "strength_sessions",
  "planned_sessions",
  "daily_checkins",
  "training_plans",
  "plan_rules",
  "plan_sessions",
];

// Ordre de suppression inverse (enfants avant parents).
const DELETE_ORDER: TableName[] = [
  "plan_sessions",
  "plan_rules",
  "training_plans",
  "daily_checkins",
  "planned_sessions",
  "strength_sessions",
  "run_sessions",
  "feelings",
  "strength_sets",
  "run_details",
  "sessions",
  "exercises",
  "goals",
  "injuries",
  "weight_entries",
  "profiles",
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }
  const userId = userData.user.id;

  const results: Record<string, unknown> = {};
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};

  await Promise.all(
    USER_TABLES.map(async (table) => {
      try {
        let query = supabase.from(table).select("*");
        if (table === "profiles") {
          query = query.eq("user_id", userId);
        } else if (table === "exercises") {
          // Seulement les exercices personnels (le catalogue est fixe).
          query = query.eq("user_id", userId);
        } else if (table === "plan_rules") {
          query = query;
        } else if (table === "run_details" || table === "strength_sets" || table === "feelings") {
          // Filtrés via la séance parente ; on récupère tout et on filtre côté client
          // par appartenance. Pour simplifier, on sélectionne tout puis on filtre par
          // session_id présent dans sessions de l'utilisateur (géré plus bas).
          query = query;
        } else {
          query = query.eq("user_id", userId);
        }

        const { data, error } = await query;
        if (error) {
          errors[table] = error.message;
          results[table] = [];
          counts[table] = 0;
          return;
        }
        let rows = data ?? [];
        // Filtrage par appartenance pour les tables liées à sessions.
        if (table === "run_details" || table === "strength_sets" || table === "feelings") {
          const { data: sessions } = await supabase
            .from("sessions")
            .select("id")
            .eq("user_id", userId);
          const ids = new Set((sessions ?? []).map((s) => s.id));
          rows = rows.filter((r) => ids.has((r as { session_id: string }).session_id));
        }
        if (table === "plan_rules") {
          const { data: plans } = await supabase
            .from("training_plans")
            .select("id")
            .eq("user_id", userId);
          const ids = new Set((plans ?? []).map((p) => p.id));
          rows = rows.filter((r) => ids.has((r as { plan_id: string }).plan_id));
        }
        results[table] = rows;
        counts[table] = rows.length;
      } catch (e) {
        errors[table] = e instanceof Error ? e.message : String(e);
        results[table] = [];
        counts[table] = 0;
      }
    }),
  );

  const payload = {
    app: "Allure",
    kind: "backup",
    schemaVersion: "V2.0",
    exportedAt: new Date().toISOString(),
    userId,
    counts,
    tables: results,
    ...(Object.keys(errors).length ? { errors } : {}),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="allure-backup.json"',
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const userId = userData.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!isPlainObject(body)) {
    return NextResponse.json({ error: "Format invalide" }, { status: 400 });
  }
  if (body.app !== "Allure" || body.kind !== "backup") {
    return NextResponse.json(
      { error: "Ce fichier n'est pas une sauvegarde Allure valide" },
      { status: 400 },
    );
  }
  if (body.userId && body.userId !== userId) {
    return NextResponse.json(
      { error: "Cette sauvegarde appartient à un autre compte" },
      { status: 403 },
    );
  }

  const tables = isPlainObject(body.tables) ? body.tables : null;
  if (!tables) {
    return NextResponse.json({ error: "Aucune donnée à restaurer" }, { status: 400 });
  }

  const report: Record<string, { inserted: number; deleted: number; error?: string }> = {};

  // 1. Suppression (ordre inverse des FK).
  for (const table of DELETE_ORDER) {
    try {
      if (table === "profiles") {
        // On ne supprime pas le profil (clé primaire = user_id) ; on upsert.
        report[table] = report[table] ?? { inserted: 0, deleted: 0 };
        continue;
      }
      if (table === "run_details" || table === "strength_sets" || table === "feelings") {
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id")
          .eq("user_id", userId);
        const ids = (sessions ?? []).map((s) => s.id);
        if (ids.length) {
          const { error } = await supabase.from(table).delete().in("session_id", ids);
          if (error) throw error;
        }
        continue;
      }
      if (table === "exercises") {
        const { error } = await supabase.from(table).delete().eq("user_id", userId);
        if (error) throw error;
        continue;
      }
      if (table === "plan_rules") {
        const { data: plans } = await supabase
          .from("training_plans")
          .select("id")
          .eq("user_id", userId);
        const ids = (plans ?? []).map((p) => p.id);
        if (ids.length) {
          const { error } = await supabase.from(table).delete().in("plan_id", ids);
          if (error) throw error;
        }
        continue;
      }
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) throw error;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report[table] = { ...(report[table] ?? { inserted: 0, deleted: 0 }), error: msg };
    }
  }

  // 2. Insertion (ordre FK).
  for (const table of INSERT_ORDER) {
    const rows = Array.isArray(tables[table]) ? (tables[table] as Record<string, unknown>[]) : [];
    if (!rows.length) {
      report[table] = {
        inserted: 0,
        deleted: report[table]?.deleted ?? 0,
        ...(report[table]?.error ? { error: report[table].error } : {}),
      };
      continue;
    }
    try {
      // Filtrer les lignes personnelles pour exercises ; ignorer le catalogue.
      let toInsert = rows;
      if (table === "exercises") {
        toInsert = rows.filter((r) => r.user_id === userId || r.user_id === null);
        // Ne restaurer que les exercices personnels (user_id = userId).
        toInsert = toInsert.filter((r) => r.user_id === userId);
      }
      if (table === "profiles") {
        // Upsert par user_id.
        const profileRow = { ...rows[0], user_id: userId };
        const { error } = await supabase.from(table).upsert(profileRow, { onConflict: "user_id" });
        if (error) throw error;
        report[table] = { inserted: 1, deleted: report[table]?.deleted ?? 0, ...(report[table]?.error ? { error: report[table].error } : {}) };
        continue;
      }
      // S'assurer que user_id est bien celui du compte courant pour les tables à user_id.
      const normalized = toInsert.map((r) => {
        const row = { ...r };
        if (
          table !== "run_details" &&
          table !== "strength_sets" &&
          table !== "feelings" &&
          "user_id" in row
        ) {
          row.user_id = userId;
        }
        return row;
      });
      const { error } = await supabase.from(table).upsert(normalized, { onConflict: "id" });
      if (error) throw error;
      report[table] = {
        inserted: normalized.length,
        deleted: report[table]?.deleted ?? 0,
        ...(report[table]?.error ? { error: report[table].error } : {}),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      report[table] = {
        inserted: report[table]?.inserted ?? 0,
        deleted: report[table]?.deleted ?? 0,
        error: msg,
      };
    }
  }

  const hasError = Object.values(report).some((r) => r.error);
  return NextResponse.json(
    {
      ok: !hasError,
      restoredAt: new Date().toISOString(),
      report,
    },
    { status: hasError ? 207 : 200 },
  );
}
