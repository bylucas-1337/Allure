import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
};

/**
 * Lit l'utilisateur de la requête courante.
 *
 * `getUser()` valide le jeton auprès de Supabase (contrairement à une simple
 * lecture de cookie). En cas de configuration absente ou de réseau coupé, on
 * reste déconnecté plutôt que de faire planter toute l'interface.
 *
 * `cache` évite plusieurs appels Supabase dans la même requête.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
    };
  } catch {
    return null;
  }
});
