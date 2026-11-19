"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readText } from "@/lib/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WRITE_ERROR = "L’enregistrement a échoué. Vérifie ta connexion, puis réessaie.";

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/connexion");
  return data.user.id;
}

export async function saveCheckinAction(formData: FormData) {
  const userId = await getUserId();
  const date = readText(formData, "date") || new Date().toISOString().slice(0, 10);
  const form = readText(formData, "form");
  const fatigue = readText(formData, "fatigue");
  const pain = readText(formData, "pain");
  const notes = readText(formData, "notes");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: userId,
      checkin_date: date,
      form: form === "" ? null : Number(form),
      fatigue: fatigue === "" ? null : Number(fatigue),
      pain: pain === "" ? null : pain,
      notes: notes === "" ? null : notes,
    },
    { onConflict: "user_id,checkin_date" },
  );

  if (error) {
    return { ok: false, message: `${WRITE_ERROR} (${error.code}: ${error.message})` };
  }
  revalidatePath("/");
  return { ok: true };
}
