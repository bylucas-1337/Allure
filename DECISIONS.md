# Décisions — Allure

Ce fichier garde la trace des choix importants : la décision, sa raison, sa date.
Il est mis à jour à chaque session. Les points encore ouverts sont listés à la fin.

> Le résumé de l'avancement, l'historique par version et les prochaines étapes sont dans [`Docs/suivi.md`](./Docs/suivi.md). Toute nouvelle décision doit être ajoutée ici **et** résumée là-bas.

## 2026-11-19 — Cadrage initial (V1)

| # | Décision | Raison |
| --- | --- | --- |
| D01 | Continuer le squelette **Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase**, en gardant la direction visuelle vert/crème. | Stack adaptée à une PWA, déploiement gratuit, un seul langage, Supabase fournit auth + base + RLS. Repartir de zéro aurait jeté du travail sans bénéfice. |
| D02 | **Périmètre V1** : journal manuel course + muscu, profil complet, accueil réel, objectif course simple, historique, ressenti, lien `.ics`. | Valider d'abord l'usage quotidien. Le moteur de plans et l'import de fichiers sont des chantiers séparés. |
| D03 | **Hors V1** : import FIT/GPX, synchro Coros, génération de plans, VDOT/prédictions, notifications push, vélo, Strava, multi-utilisateurs. | Éviter une V1 trop large et des promesses que le moteur ne peut pas encore tenir. FIT/GPX visés en V1.5/V2. |
| D04 | **Secrets hors du projet** : `C:\Users\lucas\Desktop\Allure-prive\.env`, lu via la variable système `ALLURE_ENV_FILE` et chargé dans `next.config.ts` avec `dotenv`. | Aucun secret dans le dossier de code. En production, les variables seront fournies par Vercel. |
| D05 | **Données de santé dans Supabase**, protégées par RLS. Jamais dans le dossier du projet, jamais dans `Allure-prive` (qui ne contient que des secrets). | Accessibles depuis tous les appareils, protégées par compte, sans fichier local à synchroniser. |
| D06 | **Date de naissance stockée, âge calculé** à l'affichage. **Poids = historique daté** modifiable dans l'app. Métriques (allures, volume, e1RM) calculées depuis les séances. | Éviter les données figées ou recopiées à la main, qui deviennent fausses. |
| D07 | **Un seul compte**, connexion par lien email, inscriptions désactivées dans Supabase. | Usage personnel, surface d'attaque minimale, reste dans le gratuit. |
| D08 | **Migrations SQL manuelles** : fichiers numérotés collés dans le SQL Editor de Supabase. | Lucas voit exactement ce qui est exécuté ; aucun token CLI supplémentaire à gérer. Le CLI pourra venir plus tard. |
| D09 | **Muscu** : catalogue fourni + exercices personnels, avec pré-remplissage depuis la dernière séance. | Identifiants stables pour un historique fiable ; liberté pour les exercices manquants. |
| D10 | **Agenda** : lien `.ics` en V1, notifications push plus tard. | Le `.ics` est simple et universel ; le push dépend fortement d'iOS/Android. |
| D11 | **Forme/fatigue V1** : check-in rapide 1–5 + tendance sur 7 jours. Pas de score opaque. | Honnête sans moteur de charge validé. Les calculs de charge et leurs garde-fous arrivent en V2. |
| D12 | **Pas de Strava**. Coros via FIT/GPX puis synchro non officielle plus tard. | Strava est écarté pour l'instant ; l'API Coros officielle n'est pas disponible. |
| D13 | **Transparence du moteur** : chaque règle devra citer sa base scientifique, ses limites et son garde-fou. Prédictions en fourchettes uniquement. | Éviter la fausse précision et les boîtes noires. |
| D14 | **Garde-fous agent** : `opencode.jsonc` interdit la lecture de `.env`, du dossier privé, des `.fit`/`.gpx`, et l'affichage des variables d'environnement. | Réduire les risques d'exposition accidentelle. Ce n'est pas un bac à sable : une isolation forte demanderait un compte Windows séparé. |
| D15 | **Clé publique Supabase acceptée sous deux noms** : `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ancien) ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nouveau). | Supabase a renommé la clé ; accepter les deux évite une configuration fragile. |
| D16 | **Un seul fichier de migration V1** : `20261119000000_v1_journal.sql`. L'ancien schéma initial, jamais appliqué, est archivé dans `supabase/archive/`. | La base est vide : un seul copier-coller évite les erreurs d'ordre. Le fichier est rejouable sans supprimer de données. |
| D17 | **Pages protégées par `src/proxy.ts`** (le nom du middleware en Next 16), email affiché et déconnexion dans le shell. Après le lien email, redirection vers l'accueil. | Voir la session, protéger l'accès aux données et rendre la connexion vérifiable. Le proxy rafraîchit aussi les cookies de session. |
| D18 | **Connexion email + mot de passe en principal**, lien magique conservé en second choix. Le compte se crée dans le tableau de bord Supabase, inscriptions publiques fermées. | Le service d'email intégré de Supabase limite les envois à environ 2 par heure : le mot de passe rend la connexion quotidienne immédiate et fiable, sans dépendre d'un email. |

## 2026-11-19 — Onboarding (étape 3)

| # | Décision | Raison |
| --- | --- | --- |
| D19 | **Onboarding en 4 étapes** : Toi (identité, taille, poids), Ton rythme (jours, séances/semaine, expérience), Tes zones sensibles (blessures), Ton objectif (course). Seuls la taille et le poids sont obligatoires ; chaque champ optionnel accepte une réponse vide ou « je ne sais pas ». | Un profil exploitable en moins d'une minute, sans champ imposé inutile. Les étapes suivent l'ordre du parcours réel : mesure, disponibilité, contrainte, but. |
| D20 | **Garde de redirection dans `src/proxy.ts`** : `profiles.onboarding_completed_at` vide → `/onboarding` ; terminé → `/onboarding` renvoie à l'accueil. En cas de doute (réseau, requête en erreur), on ne bloque pas l'accès. | Éviter d'afficher un accueil vide au premier accès, sans risquer une boucle de redirection si la base répond mal. |
| D21 | **Enregistrement étape par étape** via Server Actions, avec une validation partagée client/serveur dans `src/lib/onboarding.ts` et aucune bibliothèque de validation ajoutée. | Reprise réelle après un abandon (même sur un autre appareil), une seule vérité de validation, et zéro dépendance supplémentaire. |
| D22 | **Objectifs** : un nouvel objectif passe l'ancien en `abandoned` au lieu de le supprimer. **Blessures** : la liste est remplacée à chaque passage (elle reflète exactement la saisie). | Garder l'historique des objectifs, et éviter les doublons de blessures lors d'une reprise. |
| D23 | **Cookies lus avant la configuration Supabase** dans `createSupabaseServerClient`. | Avec Cache Components, l'ordre compte : lire les cookies marque la requête comme dynamique. Sinon le prérendu évalue la configuration et le build échoue sans fichier privé. |

## 2026-11-19 — Réglages et objectifs (étape 3 bis)

| # | Décision | Raison |
| --- | --- | --- |
| D24 | **Migration V2** (`supabase/migrations/20261119010000_v2_programme.sql`) : `profiles` gagne `resting_hr`, `session_duration_min`, `strength_goal`, `target_muscle_groups`, `equipment` ; `goals` gagne `goal_kind` (`main`/`secondary`), `note_text`, `target_value`, `target_unit`, `target_exercise`, et accepte `run`/`strength`/`body`. `distance_m` et `race_date` deviennent facultatifs. | Le schéma V1 ne pouvait stocker ni ce qui construit un programme, ni une course secondaire sans écraser l'objectif principal. |
| D25 | **Un seul objectif principal actif par sport, plusieurs courses secondaires actives.** L'ancien principal passe en `abandoned` (historique conservé) ; les secondaires ne sont jamais touchées. Réactiver un principal abandonne l'autre principal actif. Pas de champ « priorité » numérique. (Précise D22.) | Une course majeure structure le programme ; les courses de passage doivent pouvoir s'ajouter sans la supprimer. |
| D26 | **La page `/reglages` est le lieu unique de modification** : profil, rythme et muscu, poids, blessures, objectifs. L'onboarding (étape 2) recueille déjà ces préférences pour éviter la double saisie. | Toute donnée doit rester réparable sans passer par le tableau de bord Supabase, et le parcours initial doit rester utile sans être long. |
| D27 | **Champs muscu limités à ce qui pilote un programme** : intention (`hypertrophy`, `strength`, `endurance`, `recomposition`, `health`), groupes musculaires, matériel, durée et fréquence. Référence utilisée : Schoenfeld, Ogborn et Krieger, *J Sports Sci* 2017 (relation dose-réponse entre volume hebdomadaire et prise de muscle). | Ne pas transformer le profil en questionnaire exhaustif ; le choix des exercices et des séries appartient à la séance et au moteur V2, qui documentera ses règles (D13). |

## 2026-11-19 — Profil course et découpage (étape 3 ter)

| # | Décision | Raison |
| --- | --- | --- |
| D28 | **Migration V3** (`supabase/migrations/20261119020000_v3_run_profile.sql`) : expérience course, terrain, volume hebdomadaire, allures (facile, seuil, course), records (5 km, 10 km, semi, marathon). Les jours et fréquences restent dans `weekly_availability`, séparés par sport. | Un programme de course a besoin de ces repères ; les demander à l'inscription évite de les ressaisir. |
| D29 | **Onboarding en 7 pages** : identité, course — habitude, course — allures, course — objectif, muscu — cadre, santé, récapitulatif. La muscu ne commence qu'après la course. | « Plein de pages pour pas mettre un gros pavé » : chaque page reste courte et lisible. |
| D30 | **Réglages découpés en sous-pages** (`/reglages/profil`, `/course`, `/muscu`, `/poids`, `/sante`, `/objectifs`, `/donnees`) avec navigation par onglets, plutôt qu'une seule page très longue. | Même logique de lisibilité ; chaque section est accessible directement. |
| D31 | **Réinitialisation de l'onboarding** avec confirmation écrite (`SUPPRIMER`) : efface profil, pesées, zones sensibles et objectifs, renvoie vers `/onboarding`. Les séances ne sont pas touchées. | Permet de repartir de zéro sans passer par le tableau de bord Supabase. |

## 2026-11-19 — Saisie manuelle d'une séance (étape 4)

| # | Décision | Raison |
| --- | --- | --- |
| D32 | **Séance de course manuelle en V1** : table `run_sessions` (date, type, durée, distance, allure calculée, ressenti, notes, objectif rattaché). Pas de FC. | L'usage quotidien d'abord ; la synchro Strava/Coros est un chantier V2. |
| D33 | **Colonne `strava_activity_id` nullable et unique** dès la V4, pour anticiper l'import Strava sans migration supplémentaire. | Éviter une migration de plus à la V2. |

## 2026-11-19 — Saisie musculation (étape 5)

| # | Décision | Raison |
| --- | --- | --- |
| D34 | **Séance muscu avec exercices en JSONB** (`strength_sessions.exercises`), sans table dédiée par exercice. | Flexible pour la V1 ; une table normalisée viendra si les stats par exercice le justifient. |
| D35 | **Durée en minutes + secondes** pour course et muscu, colonne `duration_sec` ajoutée à `run_sessions` (V6) et `strength_sessions`. | Plus précis sans changer le type de la colonne existante. |

## 2026-11-19 — Accueil réel (étape 6)

| # | Décision | Raison |
| --- | --- | --- |
| D36 | **Pas de saisie manuelle de la FC** : la FC moyenne viendra de la synchro Strava (V2). L'accueil se contente du profil (FC de repos) et des séances. | Éviter une saisie manuelle fastidieuse et peu fiable. |

## 2026-11-20 — Import FIT/GPX et statistiques enrichies (V1.5)

| # | Décision | Raison |
| --- | --- | --- |
| D37 | **Migration V8** (`supabase/migrations/20261120000000_v8_run_import.sql`) : `run_sessions` gagne `source`, `import_key`, `imported_at`, `avg_hr`, `max_hr`, `elevation_gain_m`, `calories`, `moving_time_sec`, `elapsed_time_sec`, `best_efforts` (jsonb), `hr_zones` (jsonb). `duration_min` est élargi à 0–1440 minutes. Index unique `(user_id, import_key)` quand `import_key` est présent. | Le schéma V4 ne stockait que durée/distance/allure. L'import apporte des mesures supplémentaires à réutiliser dans les stats sans table dédiée. |
| D38 | **`fit-file-parser` côté serveur** pour les FIT ; **GPX parsé en interne** avec un parseur léger. Le fichier d'origine n'est jamais conservé ; seules les mesures dérivées sont enregistrées. | Zéro dépendance lourde, une seule bibliothèque MIT pour le format binaire ; pas de stockage de données personnelles brutes. |
| D39 | **Dédoublonnage en deux temps** : SHA-256 du fichier (`import_key`) puis détection d'une séance très proche (même date, distance et durée à 2 % près). Un mode « importer quand même » outrepasse les deux. | Évite les doublons accidentels sans bloquer un vrai second import ; l'override reste explicite. |
| D40 | **Records personnels calculés à l'import** (meilleur temps sur 1 km, 5 km, 10 km, semi, marathon) à partir des points de piste ; **zones de FC** à partir de la FC max estimée par l'âge (220 − âge). Les records déduits de l'allure moyenne d'une séance manuelle sont marqués « estimé ». | Donner des repères mesurés quand un fichier existe, sans inventer de valeur ; rester honnête quand il n'y a que la saisie. |
| D41 | **Statistiques enrichies** : filtre par période (30 j, 90 j, 1 an, tout), records personnels, progression mensuelle de l'e1RM, volume par groupe musculaire, temps par zone de FC, comparaison 30 j contre 30 j précédents. | Exploiter les données importées et les séries saisies sans moteur de plans ; tout reste calculé depuis les séances réelles. |
| D42 | **Export avancé** : l'export JSON gagne un en-tête (`app`, `schemaVersion`, `counts`) et un export **CSV** par jeu de données (course, musculation, poids, check-ins), séparateur point-virgule avec BOM UTF-8. | Lisible directement dans un tableur français ; pas de dépendance à un service tiers. |
| D43 | **Sport filtré à l'import** : seules les activités de course sont acceptées ; un FIT multi-séances n'importe que la première séance de course. | Allure reste un journal course + muscu ; importer du vélo ou de la natation fausserait les stats. |
| D44 | **Détection du format par extension puis par contenu** (signature FIT `.FIT`, début `<` pour le GPX). Limite : 10 fichiers et 20 Mo par fichier. | Permet d'importer même si l'extension a été perdue ; protège le serveur. |
| D45 | **Durée et distance plafonnées** (24 h, 500 km) et validation des fichiers vides ou sans horodatage. Les erreurs sont renvoyées par fichier dans un rapport JSON. | Éviter d'enregistrer des séances aberrantes et donner un retour clair fichier par fichier. |

## Points ouverts

- Fuseau horaire de référence : `Europe/Paris` par défaut, à confirmer.
- Isolation renforcée : compte Windows séparé pour l'agent (non fait).
- Date et nom du déploiement Vercel.
- RLS : vérification avec un second compte à refaire après la migration V8.
- Canal des futures notifications : push PWA ou email.
- Détail de l'import FIT/GPX (exports Coros, fuseaux, doublons) : premier flux livré, à valider avec des exports réels.
- Choix du modèle de calcul de charge en V2 (à documenter et encadrer).
