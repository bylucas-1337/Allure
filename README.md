# Allure

Allure est une PWA de suivi de course et de musculation. L'interface est en français, claire et adaptée au mobile comme au bureau.

- **V1.0 « Journal »** : terminée et déployée (`https://allure-orpin-five.vercel.app`).
- **V1.5 « Import FIT/GPX et statistiques enrichies »** : code livré (migration V8 à appliquer dans Supabase).

## Commandes

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Configuration

Les secrets vivent hors du projet dans `C:\Users\lucas\Desktop\Allure-prive\.env`, désigné par la variable système `ALLURE_ENV_FILE`. Voir `Docs/presentation.md` et `Docs/suivi.md` pour le détail. Les migrations SQL sont dans `supabase/migrations/` et s'appliquent à la main dans le SQL Editor de Supabase (V1 à V8).