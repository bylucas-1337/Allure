# Allure — suivi du projet

> ## ⚠️ Document vivant — à maintenir à jour
>
> **Ce fichier doit être mis à jour au moindre changement notable**, le jour même : nouvelle fonctionnalité, décision, correction, migration, dépendance, changement de périmètre, déploiement, question ouverte résolue ou ajoutée, fin de session.
>
> - On **ajoute** une ligne ou une section ; on ne réécrit pas l'historique.
> - Si un choix change, on crée une **nouvelle décision** qui remplace l'ancienne, sans effacer l'ancienne.
> - Chaque mise à jour précise la **date** et, si possible, la **version** concernée.
> - Aucune donnée réelle ni aucun secret dans ce fichier.
>
> *Dernière mise à jour : 2026-11-19.*

## Légende

| Symbole | Signification |
| --- | --- |
| ✅ | Terminé et vérifié |
| 🚧 | En cours |
| ⏳ | Prévu, pas commencé |
| 💡 | Idée à discuter |
| ❌ | Abandonné ou remplacé |

## État actuel

| | |
| --- | --- |
| **Version** | V1.0 « Journal » — étapes 4 à 6 livrées ; Stats et export `.ics` ajoutés (2026-11-19) |
| **Date** | 2026-11-19 |
| **Dernière action** | Saisie et édition course/muscu, accueil réel, check-in + tendance 7 j, Stats, export `.ics` et JSON, migrations V2 à V7 appliquées. |
| **Prochaine action** | Test réel par Lucas (onboarding 7 étapes, réglages, séances, Stats, .ics), vérification RLS avec un second compte. |
| **Blocage** | Aucun blocage technique. Reste la validation manuelle avec des données fictives. |
| **Vérifications** | `npm run typecheck`, `npm run lint` et `npm run build` passent. |
| **Base** | Migrations V1 à V7 appliquées ; catalogue de 31 exercices présent. |

## Historique par version

### V0 — Squelette initial — ✅ (avant le 2026-11-19)

**Objectif** : poser une base visuelle et technique crédible, sans logique métier.

**Livré**

- Projet **Next.js 16 + TypeScript + Tailwind CSS 4**, App Router.
- Navigation responsive : Accueil, Ajouter, Historique, Stats, Réglages.
- Accueil de démonstration avec données fictives explicitement étiquetées « Données de test ».
- Charte verte/crème, thème clair, mobile et ordinateur traités à égalité.
- Éléments PWA : manifeste, icônes, service worker, page de secours hors ligne.
- Pages d'attente pour les écrans non encore fonctionnels.

**Limites assumées** : aucune donnée réelle, aucune connexion, aucune logique de séance.

### V1.0 — Journal — 🚧 (2026-11-19 → …)

**Objectif** : permettre de noter ses séances au quotidien et de retrouver un accueil, un historique et un objectif réellement connectés à la base.

#### Étape 0 — Sécurité, secrets et configuration — ✅ 2026-11-19

- `opencode.jsonc` : interdiction pour l'agent de lire `.env`, le dossier privé et les fichiers `.fit`/`.gpx`.
- Secrets déplacés hors du projet : `C:\Users\lucas\Desktop\Allure-prive\.env`, chargé via la variable système `ALLURE_ENV_FILE` et `dotenv` dans `next.config.ts`.
- `.env.example` avec valeurs factices uniquement.
- README et `DECISIONS.md` créés/mis à jour.
- Vérifié : règle d'interdiction testée, `typecheck`, `lint`, `build`.

#### Étape 1 — Schéma Supabase V1 — ✅ 2026-11-19

- Fichier unique : `supabase/migrations/20261119000000_v1_journal.sql`.
- 11 tables : `profiles`, `weight_entries`, `injuries`, `goals`, `exercises`, `sessions`, `run_details`, `strength_sets`, `feelings`, `planned_sessions`, `daily_checkins`.
- RLS activée sur chaque table, triggers de mise à jour, droits d'accès.
- Catalogue de 31 exercices de musculation.
- Ancien schéma initial, jamais appliqué, archivé dans `supabase/archive/initial_schema_20261117.sql`.
- Vérifié : migration exécutée sans erreur dans Supabase, 31 lignes dans `exercises`, base prête.

#### Étape 2 — Authentification visible et pages protégées — ✅ 2026-11-19

- `src/proxy.ts` (nom du middleware en Next 16) : rafraîchit la session et redirige vers `/connexion` sans session.
- Email du compte affiché et bouton de déconnexion dans le shell (ordinateur et mobile).
- Après le lien email : redirection vers l'accueil.
- Page de connexion, manifeste, service worker et page hors ligne restent publics.
- Vérifié : `/` et `/historique` répondent `307 → /connexion` sans session ; `/connexion` répond `200`.

#### Étape 2 bis — Connexion email + mot de passe — ✅ 2026-11-19

- Motif : le service email intégré de Supabase limite les envois à environ 2 par heure (« email rate limit exceeded »).
- Formulaire à deux onglets : **Mot de passe** (principal) et **Lien par email** (secours).
- Connexion via `signInWithPassword`, redirection vers l'accueil, session rafraîchie.
- Messages d'erreur traduits : limite d'email, identifiants incorrects, compte non confirmé, inscriptions fermées.
- Compte unique créé dans le tableau de bord Supabase ; inscriptions publiques désactivées.
- Vérifié : `typecheck`, `lint`, `build` ; les deux onglets s'affichent ; connexion confirmée par Lucas.

#### Étape 3 — Onboarding complet — 🚧 2026-11-19

**But** : au premier accès, recueillir le profil nécessaire et l'enregistrer dans `profiles`, avec l'historique de poids, les blessures et l'objectif.

**Livré**

- Route `/onboarding` : assistant en **4 étapes** — Toi (identité, taille, poids) · Ton rythme (jours, séances/semaine, durée de séance, expérience, objectif muscu, groupes musculaires, matériel) · Tes zones sensibles (blessures) · Ton objectif (course, distance, date, temps visé).
- **Seuls la taille et le poids sont obligatoires** ; tout le reste accepte une réponse vide ou « je ne sais pas ».
- Enregistrement **à chaque étape** via une Server Action (`src/app/actions/onboarding.ts`) : un parcours interrompu reprend là où il s'est arrêté, sur le même appareil ou un autre (les champs sont pré-remplis depuis la base).
- Validation partagée client/serveur dans `src/lib/onboarding.ts` (aucune bibliothèque ajoutée).
- Poids enregistré comme **entrée datée** dans `weight_entries` (aujourd'hui par défaut).
- Blessures : liste remplacée à chaque passage (statut actif / en récupération / guéri).
- Objectif : l'ancien objectif **principal** actif passe en `abandoned` au lieu d'être supprimé ; les courses secondaires ne sont pas touchées.
- **Garde de redirection** dans `src/proxy.ts` : un compte dont `profiles.onboarding_completed_at` est vide est renvoyé vers `/onboarding` ; une fois terminé, `/onboarding` renvoie vers l'accueil. En cas de doute (réseau, erreur de requête), l'accès n'est pas bloqué pour éviter une boucle.
- Correction technique : `createSupabaseServerClient` lit désormais les cookies **avant** la configuration Supabase, sinon le prérendu statique évaluait la configuration et échouait.

**Reste à faire**

- Test réel par Lucas avec des données fictives, sur mobile et ordinateur.
- Vérifier l'enregistrement puis la relecture dans Supabase, et la reprise après abandon en cours de route.
- Vérification RLS avec un second compte de test, puis suppression de ce compte.

**Procédure de vérification RLS (à faire une fois, avec un compte fictif)**

1. Dans Supabase → Authentication → Users, créer un second compte de test (`test-rls@exemple.fr` par exemple) et noter son mot de passe.
2. Se connecter avec ce compte dans une fenêtre de navigation privée : l'onboarding doit s'afficher, avec un profil vide.
3. Enregistrer un profil fictif minimal (taille et poids seulement).
4. Revenir au compte principal dans la fenêtre normale : le profil, le poids et les éventuelles blessures doivent être intacts et non mélangés.
5. Depuis le compte de test, vérifier qu'aucune donnée du compte principal n'apparaît (aucune ligne réelle dans `weight_entries`, `injuries`, `goals`).
6. Supprimer le compte de test dans Supabase → Authentication → Users (la cascade supprime ses lignes).
7. Noter le résultat ici et mettre à jour la décision si besoin.

**Critères d'acceptation**

- Un compte sans profil est orienté vers l'onboarding.
- Les données sont enregistrées et relues correctement.
- Aucun champ obligatoire inutile ; le parcours reste court.
- Tests réalisés uniquement avec des données fictives.
- `typecheck`, `lint`, `build` passent.

#### Étape 3 bis — Réglages et modèle d'objectifs — 🚧 2026-11-19

**But** : rendre consultable et modifiable tout ce qui a été saisi, et donner une place réelle à l'objectif de course principal, aux courses secondaires et aux préférences de musculation.

**Livré**

- Migration V2 (`supabase/migrations/20261119010000_v2_programme.sql`), **à coller à la main** dans le SQL Editor :
  - `profiles` : FC de repos, durée de séance, objectif muscu (`strength_goal`), groupes musculaires (`target_muscle_groups`), matériel (`equipment`).
  - `goals` : `goal_kind` (`main` / `secondary`), note libre, distance et date facultatives pour une course secondaire, sports `run` / `strength` / `body` acceptés.
  - Un seul objectif **principal** actif par sport ; plusieurs courses secondaires actives possibles.
- Page `/reglages` complète, par sections :
  - **Profil** : prénom, date de naissance, taille, FC de repos, sexe, expérience.
  - **Rythme et musculation** : jours, séances/semaine, durée, objectif muscu, groupes musculaires, matériel.
  - **Poids** : ajout d'une pesée datée (une par jour ; la même date est mise à jour), historique, suppression.
  - **Zones sensibles** : ajout, modification (statut, dates), suppression.
  - **Objectifs** : objectif principal (créer, modifier, marquer atteint, abandonner, supprimer, réactiver), courses secondaires, historique.
- L'onboarding (étape 2) recueille aussi la durée de séance, l'objectif muscu, les groupes musculaires et le matériel : le futur programme n'aura pas à redemander ces bases.
- La page Réglages affiche un avertissement clair si la migration V2 n'est pas appliquée (colonne manquante), au lieu de formulaires silencieusement vides.
- Repères utilisés pour les choix muscu : la relation dose-réponse entre volume hebdomadaire et prise de muscle (Schoenfeld, Ogborn et Krieger, *J Sports Sci*, 2017) et la littérature sur la fréquence d'entraînement par groupe musculaire. Les champs restent descriptifs : aucun programme n'est généré en V1.

**Volontairement laissé de côté**

- Objectif « physique » (poids cible, tour de taille) : le schéma accepte `sport = 'body'`, l'écran ne le propose pas encore.
- Objectifs de musculation par exercice (charge cible, répétitions cibles).
- Objectif principal : le passer en secondaire se fait en le supprimant puis en le recréant (pas de bascule directe).

**Reste à faire**

- Appliquer la migration V3 (`supabase/migrations/20261119020000_v3_run_profile.sql`) dans Supabase.
- Test réel : onboarding complet (7 étapes), puis modification de chaque section des réglages et rechargement.
- Vérifier la RLS avec un second compte de test fictif, puis suppression.
- Vérifier la réinitialisation de l'onboarding (confirmation `SUPPRIMER`).

#### Étapes suivantes de la V1 — ⏳

| # | Étape | Contenu |
| --- | --- | --- |
| 4 | Ajout d'une séance de course | Formulaire durée/distance/allure/ressenti, enregistrement dans `sessions` + `run_details`. |
| 5 | Ajout d'une séance de musculation | Choix d'exercices, séries, répétitions, charges, pré-remplissage depuis la dernière séance. |
| 6 | Accueil réel | Remplacer la démonstration par la dernière séance, la semaine et le check-in du jour. |
| 7 | Historique | Liste, filtres simples, détail d'une séance, modification/suppression. |
| 8 | Ressenti et check-in | Formulaire 1–5, douleur, tendance sur 7 jours, sans score opaque. |
| 9 | Objectif et `.ics` | Édition de l'objectif, export calendrier, compte à rebours. |
| 10 | Statistiques | Volume, allures, e1RM, calculés depuis les séances réelles. |
| 11 | Réglages | Fait en étape 3 bis : profil, poids, blessures, objectifs, préférences muscu. Reste : unités, export des données, gestion du compte. |
| 12 | Finitions et déploiement | Vérifications PWA, accessibilité, Vercel, URL Supabase de production. |

## Décisions

> Résumé. Le détail daté (décision + raison complète) se trouve dans [`../DECISIONS.md`](../DECISIONS.md). Toute nouvelle décision doit être ajoutée **dans les deux fichiers**.

| # | Date | Décision | Raison (résumé) |
| --- | --- | --- | --- |
| D01 | 2026-11-19 | Garder le squelette **Next.js 16 + TypeScript + Tailwind 4 + Supabase**, design vert/crème. | Stack adaptée à une PWA gratuite ; repartir de zéro aurait jeté du travail utile. |
| D02 | 2026-11-19 | **Périmètre V1** : journal manuel course + muscu, profil, accueil réel, objectif simple, historique, ressenti, `.ics`. | Valider d'abord l'usage quotidien ; le moteur et les imports sont des chantiers séparés. |
| D03 | 2026-11-19 | **Hors V1** : FIT/GPX, synchro Coros, génération de plans, VDOT, push, vélo, Strava, multi-utilisateurs. | Éviter une V1 trop large et des promesses non tenables. |
| D04 | 2026-11-19 | **Secrets hors du projet**, lus via `ALLURE_ENV_FILE` et `dotenv`. | Aucun secret dans le code ; Vercel fournira les variables en production. |
| D05 | 2026-11-19 | **Données de santé dans Supabase**, protégées par RLS. | Accessibles partout, protégées par compte, sans fichier local à synchroniser. |
| D06 | 2026-11-19 | **Date de naissance stockée, âge calculé** ; **poids = historique daté** ; métriques calculées. | Éviter les données figées qui deviennent fausses. |
| D07 | 2026-11-19 | **Un seul compte**, inscriptions désactivées. | Usage personnel, surface d'attaque minimale. |
| D08 | 2026-11-19 | **Migrations SQL manuelles** dans le SQL Editor. | Lucas voit exactement ce qui est exécuté ; pas de token CLI supplémentaire. |
| D09 | 2026-11-19 | **Muscu** : catalogue + exercices personnels, pré-remplissage depuis la dernière séance. | Identifiants stables et liberté pour les exercices manquants. |
| D10 | 2026-11-19 | **Agenda** : lien `.ics` en V1, push plus tard. | Simple, universel, sans dépendance à iOS/Android. |
| D11 | 2026-11-19 | **Forme/fatigue V1** : check-in 1–5 + tendance 7 jours, pas de score opaque. | Honnête sans moteur de charge validé. |
| D12 | 2026-11-19 | **Pas de Strava** ; Coros via FIT/GPX puis synchro non officielle. | Strava écarté ; pas d'API Coros officielle. |
| D13 | 2026-11-19 | **Transparence du moteur** : base scientifique, limites et garde-fou cités ; prédictions en fourchettes. | Éviter la fausse précision et les boîtes noires. |
| D14 | 2026-11-19 | **Garde-fous agent** dans `opencode.jsonc` (secrets, dossier privé, FIT/GPX). | Réduire les risques d'exposition ; ce n'est pas un bac à sable. |
| D15 | 2026-11-19 | **Clé publique Supabase acceptée sous deux noms** : `ANON_KEY` ou `PUBLISHABLE_KEY`. | Supabase a renommé la clé ; accepter les deux évite une configuration fragile. |
| D16 | 2026-11-19 | **Un seul fichier de migration V1** ; ancien schéma archivé. | Base vide : un seul copier-coller évite les erreurs d'ordre. |
| D17 | 2026-11-19 | **Pages protégées par `src/proxy.ts`**, email affiché, déconnexion, retour à l'accueil après connexion. | Protéger les données et rendre la connexion vérifiable. |
| D18 | 2026-11-19 | **Connexion email + mot de passe en principal**, lien magique en secours. Compte créé dans Supabase. | La limite d'envoi d'emails de Supabase rend le lien magique peu fiable au quotidien. |
| D19 | 2026-11-19 | **Onboarding en 4 étapes** : Toi, Ton rythme, Tes zones sensibles, Ton objectif. Seuls la taille et le poids sont obligatoires. | Profil exploitable en moins d'une minute, sans champ imposé inutile ; l'ordre suit le parcours réel. |
| D20 | 2026-11-19 | **Garde de redirection dans `src/proxy.ts`** via `onboarding_completed_at`, sans blocage en cas d'erreur base. | Éviter un accueil vide au premier accès sans risquer une boucle de redirection. |
| D21 | 2026-11-19 | **Enregistrement étape par étape** par Server Actions, validation partagée client/serveur, sans nouvelle dépendance. | Reprise réelle après abandon, une seule logique de validation. |
| D22 | 2026-11-19 | **Objectif actif remplacé en `abandoned`** ; liste de blessures remplacée à chaque passage. | Garder l'historique des objectifs et éviter les doublons de blessures. |
| D23 | 2026-11-19 | **Cookies lus avant la configuration Supabase** dans `createSupabaseServerClient`. | Sinon le prérendu évaluait la configuration et le build échouait sans fichier privé. |
| D24 | 2026-11-19 | **Migration V2** : colonnes de programme dans `profiles` (FC de repos, durée de séance, objectif muscu, groupes musculaires, matériel) et `goals` (`goal_kind`, note, distance/date facultatives, sports `run`/`strength`/`body`). | Le schéma V1 ne pouvait pas stocker ce qui sert à construire un programme ni distinguer une course principale d'une course secondaire. |
| D25 | 2026-11-19 | **Un objectif principal + autant de courses secondaires actives que nécessaire** ; pas de champ « priorité » numérique. | Correspond au besoin réel : une course majeure, des courses de passage qui ne l'effacent pas. |
| D26 | 2026-11-19 | **La page Réglages est le lieu unique de modification** ; l'onboarding recueille les mêmes préférences muscu dès l'étape 2. | Éviter la double saisie et rendre toute donnée réparable sans passer par la base. |
| D27 | 2026-11-19 | **Champs muscu limités à ce qui pilote un programme** (intention, groupes, matériel, durée, fréquence), avec références scientifiques citées. | Ne pas transformer le profil en questionnaire ; le détail des exercices appartient à la séance et au moteur V2. |

## Prochaines étapes

### Maintenant

- [x] **Migrations V2 à V7** appliquées dans Supabase.
- [x] **Étape 4 — Saisie course** : formulaire durée/distance/allure/ressenti, enregistrement dans `run_sessions`.
- [x] **Étape 5 — Saisie musculation** : exercices, séries, répétitions, charges.
- [x] **Étape 6 — Accueil réel** : dernière séance, semaine, check-in du jour, disponibilités.
- [x] **Stats** : page `/stats` avec résumé, graphique hebdomadaire, allures par type, e1RM par exercice.
- [x] **Objectif et `.ics`** : export calendrier depuis `/reglages/objectifs`.
- [ ] **Test réel** par Lucas : onboarding 7 étapes, réglages, séances, Stats, `.ics`, sur mobile et ordinateur.
- [ ] **Vérification RLS** avec un second compte de test fictif, puis suppression.
- [ ] **Finitions** : unités, export des données, gestion du compte (réglages restants).

### Ensuite (V1.0)

- [ ] Étapes 4 à 7 : ajout course, ajout muscu, accueil réel, historique.
- [ ] Étapes 8 à 10 : ressenti/check-in, objectif + `.ics`, statistiques.
- [ ] Étape 11 : restes des réglages (unités, export des données, compte).
- [ ] Étape 12 : vérifications finales et déploiement Vercel.

### Après la V1.0

- [ ] **V1.5** : import FIT/GPX (exports Coros), statistiques enrichies, export des données.
- [ ] **V2** : moteur de plans adaptatifs, règles documentées, prédictions en fourchettes, charge encadrée.
- [ ] Synchronisation Coros non officielle, notifications, cyclisme.

## Questions ouvertes

- Fuseau horaire de référence : `Europe/Paris` par défaut, à confirmer.
- Isolation renforcée : compte Windows séparé pour l'agent (non fait).
- Date et nom du déploiement Vercel.
- Vérifier les conditions des offres gratuites Supabase et Vercel avant mise en ligne (limites, mise en pause, usage personnel).
- Canal des futures notifications : push PWA ou email.
- Détail de l'import FIT/GPX : exports Coros, fuseaux, gestion des doublons.
- Choix du modèle de calcul de charge en V2 (à documenter et encadrer).
- Stratégie de sauvegarde/export des données avant la V2.
- **Priorité d'objectif** : pas de champ dédié, un seul objectif principal actif fait office de priorité. À ajouter seulement si plusieurs objectifs principaux deviennent nécessaires.
- Objectif physique (`sport = 'body'`) et objectifs par exercice : schéma prêt, écrans à faire.
- Changer un objectif principal en course secondaire (ou l'inverse) : se fait aujourd'hui par suppression puis recréation.
- RLS : vérification avec un second compte à refaire après la migration V2.

## Journal des mises à jour de ce document

| Date | Changement |
| --- | --- |
| 2026-11-19 | Création du dossier `Docs` et de ce suivi : reprise de l'historique V0 → V1.0 étape 2 bis, des décisions D01–D18 et des prochaines étapes. |
| 2026-11-19 | Étape 3 : assistant d'onboarding en 4 étapes, enregistrement par étape, garde de redirection, décisions D19–D23. Reste le test réel et la vérification RLS. |
| 2026-11-19 | Étape 6 : accueil réel (résumé semaine, dernière séance, objectifs, check-in quotidien, disponibilités), migration V7 (`daily_checkins`), FC non saisie manuellement. Décision D36. |
| 2026-11-19 | Ajout page Stats (`/stats`) avec graphiques (distance hebdomadaire, e1RM par exercice), export `.ics` des objectifs, migrations V2 à V7 appliquées, doc mise à jour. |
| 2026-11-19 | Édition des séances course/muscu dans l'historique, tendance check-in 7 jours sur l'accueil, compte à rebours objectif, export JSON des données. |
