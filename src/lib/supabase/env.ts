type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

/**
 * Lit la configuration publique de Supabase.
 *
 * Supabase a renommé la clé « anon » en « publishable key ».
 * On accepte les deux noms pour éviter une configuration fragile.
 * Ces deux valeurs sont publiques par conception : la protection vient de la RLS.
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) dans le fichier privé pointé par ALLURE_ENV_FILE (hors du projet).",
    );
  }

  return { url, anonKey };
}
