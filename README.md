# Allure

Allure est une PWA de suivi de course et de musculation. La V1 « journal » est en construction : l’interface est en français, claire et adaptée au mobile comme au bureau.

## Lancer l’application

Prérequis : Node.js 20.12 ou supérieur et npm.

```powershell
npm install
```

Les secrets ne vivent **pas** dans le dossier du projet. Ils sont dans un dossier privé, hors du projet :

1. Crée le dossier privé (une seule fois) :

   ```powershell
   New-Item -ItemType Directory -Force "C:\Users\lucas\Desktop\Allure-prive"
   ```

2. Copie le modèle dans ce dossier, puis remplis-le avec tes vraies valeurs :

   ```powershell
   Copy-Item .env.example "C:\Users\lucas\Desktop\Allure-prive\.env"
   notepad "C:\Users\lucas\Desktop\Allure-prive\.env"
   ```

3. Indique ce chemin à l’application avec une variable système utilisateur :

   ```powershell
   [Environment]::SetEnvironmentVariable("ALLURE_ENV_FILE", "C:\Users\lucas\Desktop\Allure-prive\.env", "User")
   ```

4. Ferme puis rouvre ton terminal, et lance :

   ```powershell
   npm run dev
   ```

Ouvre ensuite [http://localhost:3000](http://localhost:3000). Sans session, l’application redirige vers la page de connexion ; une fois connecté, tu arrives sur l’accueil. La page de connexion reste accessible même sans configuration Supabase.

> `Allure-prive` ne contient que des secrets techniques. Tes données de santé et d’entraînement vivent dans Supabase, jamais dans le projet ni dans ce dossier.

## Configurer Supabase gratuitement

1. Crée un projet sur le forfait gratuit Supabase.
2. Dans **Project Settings → API**, copie l’URL du projet et sa clé publique `anon`/publishable dans le fichier privé pointé par `ALLURE_ENV_FILE` :

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-cle-publique
   ```

   Ces deux valeurs sont visibles dans le navigateur : ce ne sont pas des secrets. La protection des données vient des politiques RLS. Ne mets jamais la clé `service_role` ici.

   Si le tableau de bord Supabase affiche **publishable key** au lieu de **anon public**, tu peux utiliser le nom `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : l’application accepte les deux.

3. Dans **Authentication → URL Configuration**, indique `http://localhost:3000` comme Site URL et ajoute `http://localhost:3000/auth/callback` aux URL de redirection autorisées. Ajoute aussi l’URL de production si tu déploies sur Vercel.
4. Exécute le fichier `supabase/migrations/20261119000000_v1_journal.sql` dans le SQL Editor Supabase. La base étant vide, ce fichier unique crée tout le schéma V1. L’ancien schéma initial, jamais appliqué, est conservé dans `supabase/archive/`.
5. Crée ton compte unique dans **Authentication → Users → Add user** : renseigne ton email et un mot de passe solide, puis coche la confirmation automatique si l’option est proposée. C’est ce mot de passe qui sert à te connecter : l’application ne l’enregistre jamais.
6. Dans **Authentication → Sign In / Providers**, garde **Email** activé et désactive les inscriptions publiques (**Allow new users to sign up**) une fois le compte créé.
7. Redémarre le serveur, ouvre **Connexion** et connecte-toi avec ton email et ton mot de passe. Le lien magique reste disponible en second choix, mais le service d’email intégré de Supabase est limité à environ 2 envois par heure.

Ne mets jamais de clé `service_role` dans le navigateur, dans un fichier du projet ou dans une variable préfixée `NEXT_PUBLIC_` : seule la clé publique est utilisée par cette application. Les tables protègent les données avec Row Level Security. La table `planned_sessions` est créée vide.

## Dépannage

- **« Configure NEXT_PUBLIC_SUPABASE_URL… »** : le serveur a démarré avant la variable, ou le fichier privé est incomplet. Vérifie qu’il contient l’URL et une clé (`NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), puis ferme le terminal, ouvres-en un nouveau et relance `npm run dev`.
- Le fichier privé est lu **au démarrage** : après l’avoir modifié, redémarre le serveur.
- Si tu lances `npm run dev` depuis OpenCode, la variable système peut ne pas être héritée : utilise un terminal Windows séparé, ou redémarre OpenCode après avoir défini la variable.
- Si l’erreur persiste dans le navigateur, fais un rafraîchissement forcé (`Ctrl+Shift+R`) pour écarter l’ancien bundle.
- **« Trop de liens demandés… »** : le service d’email intégré de Supabase limite les envois à environ 2 par heure. Utilise la connexion par mot de passe, ou attends une heure. Le compteur se réinitialise tout seul.
- **« Email ou mot de passe incorrect »** : le compte doit exister dans **Authentication → Users**. Un mot de passe oublié se réinitialise depuis ce même écran (menu de l’utilisateur).

## Sécurité du développement

- `opencode.jsonc` interdit à l’agent de lire `.env`, le dossier `Allure-prive`, les fichiers `.fit`/`.gpx`, et d’afficher les variables d’environnement.
- `.env.example` ne contient que des valeurs factices.
- Les tests utilisent uniquement des données fictives.
- Ces règles sont un garde-fou, pas un bac à sable : pour une isolation forte, il faudrait faire tourner l’agent sous un compte Windows séparé, sans accès au dossier privé.

## Tester et vérifier

- `npm run dev` : se connecter, vérifier l’email affiché et le bouton de déconnexion, puis les cinq destinations de navigation et les données de démonstration étiquetées « Données de test ». Sans session, les pages protégées redirigent vers `/connexion`.
- `npm run lint` : vérifier le lint.
- `npm run typecheck` : vérifier les types TypeScript.
- `npm run build` : vérifier le build de production.
- Pour tester l’installation PWA en local, ouvre l’application sur `localhost` dans un navigateur compatible et utilise l’option d’installation du navigateur. Sur un domaine Vercel, l’installation nécessite HTTPS.
- Pour tester le mode hors connexion, visite d’abord la page, puis coupe le réseau et recharge : une page d’indisponibilité simple est prévue. Les données de l’application ne sont pas mises en cache hors ligne.

## Fichiers principaux

| Fichier | Rôle |
| --- | --- |
| `src/app/page.tsx` | Accueil, bouton d’ajout, dernière séance, aperçu hebdomadaire et emplacements réservés. |
| `src/components/app-shell.tsx` | Navigation responsive et identité visuelle commune. |
| `src/components/section-placeholder.tsx` | Gabarit des destinations encore vides du jalon 1. |
| `src/components/service-worker-registration.tsx` | Enregistre le service worker dans le navigateur. |
| `src/app/ajouter/page.tsx`, `historique/page.tsx`, `stats/page.tsx`, `reglages/page.tsx` | Écrans d’attente accessibles depuis la navigation. |
| `src/lib/demo-data.ts` | Exemples chiffrés de l’accueil, isolés des données réelles et signalés comme tests dans l’interface. |
| `src/app/connexion/page.tsx`, `src/components/sign-in-form.tsx` | Écran de connexion : mot de passe par défaut, lien magique en second choix. |
| `src/proxy.ts` | Rafraîchit la session et protège les pages (redirection vers `/connexion`). |
| `src/lib/auth.ts` | Lit l’utilisateur de la requête (nommé `getCurrentUser`). |
| `src/components/auth-status.tsx`, `src/app/actions/auth.ts` | Email affiché et déconnexion. |
| `src/app/auth/callback/route.ts` | Échange le code reçu par email contre la session Supabase. |
| `src/lib/supabase/client.ts`, `server.ts` | Clients Supabase navigateur et serveur. |
| `src/lib/supabase/env.ts` | Lit l’URL et la clé publique (`anon` ou `publishable`) avec un message d’erreur clair. |
| `supabase/migrations/20261119000000_v1_journal.sql` | Schéma V1 complet : profil, poids, blessures, objectif, exercices, séances, ressentis, planifié, check-in, RLS. |
| `src/app/manifest.ts`, `src/app/favicon.ico`, `public/sw.js`, `public/offline.html`, `public/icons/` | Manifeste, icône du site, secours hors ligne et icônes PWA. |
| `.env.example` | Modèle factice à copier dans le dossier privé hors projet. |
| `opencode.jsonc` | Garde-fous de l’agent (secrets, dossier privé, FIT/GPX). |
| `Docs/presentation.md` | Fiche de présentation du projet : vision, périmètre, stack, données, sécurité. |
| `Docs/suivi.md` | **Document vivant** : état actuel, historique par version, décisions, prochaines étapes. À mettre à jour au moindre changement. |
| `DECISIONS.md` | Journal des décisions et des points ouverts. |
| `next.config.ts` | Charge le fichier privé pointé par `ALLURE_ENV_FILE` et configure Next.js. |
| `src/app/layout.tsx`, `src/app/globals.css` | Mise en page française, métadonnées PWA et styles globaux. |

Les fichiers de configuration générés à la racine (`package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `eslint.config.mjs`, `next.config.ts`, `.gitignore`, `AGENTS.md`) gèrent les dépendances, TypeScript, ESLint, Next.js et les consignes adaptées à cette version de Next.js.

## Ce qui marche et ce qui reste à faire

**Inclus dans le jalon 1 :** navigation, accueil responsive, exemples de démonstration explicitement marqués comme tests, **connexion email + mot de passe** avec lien magique en secours, **pages protégées, email affiché et déconnexion**, schéma SQL V1 avec RLS et éléments d’installation PWA.

**À faire dans un prochain jalon :** formulaire d’ajout, lecture et enregistrement des séances dans l’interface, historique et statistiques connectés, réglages et remplissage de la séance du jour/de la forme. Aucun entraînement planifié n’est prérempli.

## Déploiement

Le projet peut être déployé sur le forfait gratuit Vercel. Ajoute les deux variables Supabase dans les paramètres du projet Vercel, puis autorise l’URL de déploiement dans la configuration de redirection email Supabase. En production, `ALLURE_ENV_FILE` n’est pas utilisé : l’hébergeur fournit directement les variables.
