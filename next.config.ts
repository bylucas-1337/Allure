import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Les secrets vivent hors du projet. En local, ALLURE_ENV_FILE pointe vers
// ce fichier (par exemple C:\Users\lucas\Desktop\Allure-prive\.env).
// En production, l'hébergeur fournit les variables : ALLURE_ENV_FILE est absent.
const externalEnvFile = process.env.ALLURE_ENV_FILE;

if (externalEnvFile) {
  const envPath = resolve(externalEnvFile);

  if (!existsSync(envPath)) {
    throw new Error(
      "ALLURE_ENV_FILE est défini mais le fichier est introuvable. Vérifie le chemin indiqué.",
    );
  }

  // override: false => une variable déjà définie dans le système reste prioritaire.
  loadEnv({ path: envPath, override: false, quiet: true });
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
