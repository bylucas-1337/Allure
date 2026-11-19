import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  // Lire les cookies d'abord : c'est ce qui marque la requête comme dynamique.
  // Cela évite d'évaluer la configuration pendant le prérendu statique.
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Un Server Component ne peut pas écrire de cookies.
          // Le proxy rafraîchit la session à chaque requête.
        }
      },
    },
  });
}
