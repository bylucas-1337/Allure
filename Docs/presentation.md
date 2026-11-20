# Allure — fiche de présentation

> Document de référence. Dernière mise à jour : **2026-11-19**.
> Pour l'avancement et les prochaines étapes, voir [`suivi.md`](./suivi.md).

## En bref

| | |
| --- | --- |
| **Nom** | Allure |
| **Type** | PWA (application web installable, utilisable sur mobile et ordinateur) |
| **Usage** | Suivi personnel de la course à pied et de la musculation |
| **Public** | Une seule personne : son propriétaire (pas de multi-utilisateurs en V1) |
| **Coût** | Outils gratuits uniquement : Next.js, Supabase (offre gratuite), Vercel (offre gratuite) |
| **Langue** | Français |
| **Statut** | **V1.5 « Import FIT/GPX et statistiques enrichies » — code livré** (migration V8 à appliquer) |

## Le problème

Les applications d'entraînement courantes cachent leurs calculs, imposent leurs plans et mélangent les données personnelles avec des fonctionnalités dont on ne veut pas. Résultat : on ne sait pas d'où viennent les chiffres, on ne peut pas adapter le plan à sa vie, et on finit par ne plus rien noter.

## La promesse

Allure propose **un journal clair, honnête et transparent** de ses entraînements, puis — plus tard — des plans adaptatifs dont chaque règle est explicable.

Cinq principes directeurs :

1. **Transparence** — aucune boîte noire : chaque règle de calcul cite sa base, ses limites et son garde-fou.
2. **Honnêteté** — pas de chiffre inventé. Une prédiction est une fourchette, jamais une fausse précision.
3. **Le plan propose, l'utilisateur décide** — une séance peut être déplacée, sautée, modifiée ; le moteur recalcule et explique.
4. **Simplicité quotidienne** — noter une séance doit prendre moins d'une minute, sur mobile comme sur ordinateur.
5. **Sobriété et sécurité** — données de santé dans une base protégée par compte (RLS), secrets hors du projet, pas d'envoi de données personnelles à des services d'IA.

## Le parcours visé en V1

1. **Créer son profil** (onboarding en 7 étapes) : identité, taille et poids obligatoires ; volume et allures de course, terrain, records, disponibilités, durée de séance, objectif de musculation, groupes musculaires, matériel, blessures et objectif de course facultatifs. Chaque champ optionnel accepte « je ne sais pas », et le parcours reprend là où il s'est arrêté.
2. **Noter une séance** : course (durée, distance, allure, ressenti) ou musculation (exercices, séries, répétitions, charges).
3. **Voir son accueil réel** : dernière séance, semaine en cours, prochaine séance prévue, check-in du jour.
4. **Consulter l'historique** : séances passées, filtres simples, détail d'une séance.
5. **Suivre ses objectifs** : un objectif de course principal (date, distance, temps visé, export `.ics`) auquel s'ajoutent des courses secondaires sans l'effacer.
6. **Prendre soin de soi** : check-in forme/fatigue 1–5, douleurs, tendance sur 7 jours.
7. **Ajuster ses réglages** : profil, rythme, préférences muscu, poids, blessures et objectifs, modifiables à tout moment.

## Périmètre

### Inclus en V1.0

- Journal manuel course + musculation.
- Onboarding et profil complet.
- Accueil réel connecté à la base.
- Historique et détail des séances.
- Objectif de course principal et courses secondaires, avec export calendrier `.ics`.
- Check-in forme/fatigue et ressenti de fin de séance.
- Statistiques de base calculées depuis les séances (volume, allures, e1RM).
- Réglages complets : profil, rythme, préférences muscu, poids, blessures, objectifs.
- Connexion à un compte unique, pages protégées, déconnexion.
- Installation PWA et page de secours hors ligne.

### Inclus en V1.5

- Import de fichiers FIT/GPX (exports Coros) avec dédoublonnage.
- Records personnels et zones de fréquence cardiaque calculés à l'import.
- Statistiques enrichies : période, records, progression e1RM, volume par groupe, zones FC, comparaison.
- Export avancé : JSON enrichi et CSV par jeu de données.

### Explicitement hors V1.5

- Synchronisation automatique Coros.
- Génération automatique de plans, VDOT et prédictions de performance.
- Notifications push, cyclisme, Strava, multi-utilisateurs.
- Tout calcul de charge d'entraînement opaque.

## Stack technique

| Brique | Choix | Pourquoi |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) | Rendu serveur, routes protégées, PWA, déploiement simple. |
| Langage | **TypeScript** | Moins d'erreurs, code lisible dans le temps. |
| Styles | **Tailwind CSS 4** | Interface rapide à ajuster, responsive. |
| Base + auth | **Supabase** (PostgreSQL + Auth + RLS) | Base relationnelle, authentification, sécurité par ligne, offre gratuite. |
| Hébergement | **Vercel** (prévu) | Déploiement gratuit adapté à Next.js. |
| Configuration | `next.config.ts` + `dotenv` | Charge un fichier privé **hors du projet**. |

### Organisation du code

```text
src/
  app/                 pages et routes (accueil, ajouter, historique, stats, réglages et ses sous-pages, connexion)
  app/onboarding/      assistant de profil en 4 étapes
  app/actions/         actions serveur (déconnexion, onboarding, réglages)
  app/auth/callback/   retour du lien de connexion par email
  components/          interface réutilisable (shell, formulaires, statuts)
  components/onboarding/ assistant de profil (client)
  components/settings/ formulaires des réglages (client)
  lib/                 logique métier, accès Supabase, données de démonstration
  lib/onboarding.ts    types, options et validation partagés client/serveur
  lib/settings.ts      options et validation des réglages
  lib/settings-data.ts lecture du profil, poids, blessures et objectifs (serveur uniquement)
  lib/profile.ts       lecture du profil et de l'onboarding (serveur uniquement)
  lib/supabase/        clients navigateur/serveur et lecture de la configuration
  proxy.ts             protection des pages, session et redirection vers l'onboarding
supabase/
  migrations/          schéma SQL versionné, appliqué manuellement
  archive/             anciens schémas conservés
Docs/                  présentation, suivi, décisions
```

## Modèle de données (V1)

Onze tables, toutes protégées par RLS (chaque ligne n'est visible que par son propriétaire) :

| Groupe | Tables | Contenu |
| --- | --- | --- |
| Profil | `profiles` | Date de naissance, taille, FC de repos, préférences, unités. |
| Suivi corporel | `weight_entries`, `injuries` | Historique de poids daté, blessures et zones sensibles. |
| Objectif | `goals` | Objectif principal ou course secondaire, distance, date, temps visé, note, statut. |
| Référentiel | `exercises` | Catalogue fourni (31 exercices) + exercices personnels. |
| Séances | `sessions`, `run_details`, `strength_sets`, `feelings` | Séance générique, détails course, séries de musculation, ressenti. |
| Planification | `planned_sessions` | Séances prévues, déplaçables, avec état (prévue, faite, sautée). |
| Quotidien | `daily_checkins` | Forme, fatigue, sommeil, douleur, note du jour. |

Règles structurantes :

- L'âge est **calculé** depuis la date de naissance, jamais stocké en double.
- Le poids est un **historique daté**, pas une valeur écrasée.
- Les métriques (allures, volume, e1RM) sont **calculées** depuis les séances.
- Un seul **objectif principal actif** par sport ; les **courses secondaires** s'ajoutent sans l'effacer et l'ancien objectif passe en `abandoned` (historique conservé).
- Le catalogue d'exercices garde un identifiant stable ; le nom reste enregistré dans la série comme instantané lisible.

## Sécurité et vie privée

- **Secrets hors du projet** : fichier privé `C:\Users\lucas\Desktop\Allure-prive\.env`, désigné par la variable système `ALLURE_ENV_FILE`. En production, Vercel fournit les variables.
- **Aucune clé `service_role` côté client.** Seule la clé publique est utilisée ; la RLS protège les données.
- **Un seul compte**, mot de passe géré par Supabase, inscriptions publiques fermées.
- **Garde-fous de l'agent** : `opencode.jsonc` interdit la lecture des `.env`, du dossier privé et des fichiers d'entraînement `.fit`/`.gpx`. C'est un garde-fou, pas un bac à sable : une isolation forte demanderait un compte Windows séparé.
- **Aucune donnée réelle dans le code, les tests ou la documentation.** Les exemples sont fictifs et étiquetés « Données de test ».

## Design

- Thème **clair**, fond crème (`#f7f8f4`), vert profond (`#173d35`), accents vert clair (`#d2ef9c`), pêche et lavande pour différencier les types de séance.
- Minimaliste mais coloré, coins arrondis, typographie lisible, contrastes vérifiés.
- **Mobile et ordinateur à égalité** : navigation basse/barre latérale selon la taille, aucune fonction réservée à un seul format.

## Feuille de route

| Version | Contenu | Statut |
| --- | --- | --- |
| **V0** | Squelette : navigation, accueil de démonstration, PWA, design. | ✅ |
| **V1.0** | Journal : profil, séances course/muscu, accueil réel, historique, ressenti, objectif, `.ics`. | ✅ |
| **V1.5** | Import FIT/GPX, amélioration des stats, export de données. | ✅ |
| **V2** | Moteur de plans adaptatifs, règles expliquées, prédictions en fourchettes, charge d'entraînement encadrée. | ⏳ |
| **Plus tard** | Synchronisation Coros (non officielle), notifications, cyclisme, éventuellement multi-utilisateurs. | 💡 |

## Glossaire

- **PWA** : application web qui s'installe sur l'écran d'accueil et peut fonctionner partiellement hors ligne.
- **RLS** (*Row Level Security*) : sécurité au niveau des lignes ; ici, chaque utilisateur ne voit que ses propres données.
- **Migration** : fichier SQL qui crée ou modifie la structure de la base.
- **VDOT** : estimation de la capacité aérobie à partir d'une performance, utilisée pour proposer des allures d'entraînement.
- **e1RM** : force maximale estimée sur une répétition, calculée à partir d'une série plus longue.
- **FIT / GPX** : formats de fichiers d'activité exportés par les montres et applications.
- **`.ics`** : format de calendrier lisible par la plupart des agendas.

## Où trouver quoi

- Avancement, décisions et prochaines étapes : [`suivi.md`](./suivi.md).
- Détail daté des décisions : [`../DECISIONS.md`](../DECISIONS.md).
- Installation et dépannage : [`../README.md`](../README.md).
