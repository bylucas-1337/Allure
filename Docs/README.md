# Documentation — Allure

Ce dossier rassemble la mémoire du projet : ce qu'il est, ce qui a été décidé, ce qui a été fait et ce qui reste à faire.

## Sommaire

| Fichier | Rôle | Quand le lire |
| --- | --- | --- |
| [`presentation.md`](./presentation.md) | Fiche de présentation : vision, principes, périmètre, stack, données, sécurité. | Pour comprendre le projet ou le présenter à quelqu'un. |
| [`suivi.md`](./suivi.md) | **Document vivant** : état actuel, historique version par version, décisions, prochaines étapes, questions ouvertes. | À chaque session de travail, avant et après une modification. |
| [`../DECISIONS.md`](../DECISIONS.md) | Registre détaillé des décisions : décision, raison, date. | Pour retrouver le détail d'un choix. |
| [`../README.md`](../README.md) | Installation, configuration Supabase, dépannage, tests. | Pour lancer ou réparer l'application. |

## Règles de documentation

1. **`suivi.md` est mis à jour au moindre changement notable** : nouvelle fonctionnalité, décision, correction, migration, dépendance, changement de périmètre, déploiement, question ouverte résolue ou ajoutée.
2. **On ajoute, on ne réécrit pas l'histoire.** Une ligne d'historique ou une décision ne se supprime pas : si un choix change, on ajoute une nouvelle décision qui remplace l'ancienne en le précisant.
3. **Une décision importante va dans deux endroits** : résumé dans `suivi.md`, détail daté dans `DECISIONS.md`.
4. **Aucune donnée réelle, aucun secret, aucun identifiant** dans ces fichiers : uniquement des exemples fictifs.
5. **Chaque fin de session** se termine par : ce qui est décidé, ce qui reste ouvert, la prochaine action.

## Conventions

- Les statuts utilisés dans `suivi.md` : `✅ fait`, `🚧 en cours`, `⏳ à faire`, `💡 idée`, `❌ abandonné`.
- Les décisions sont numérotées `D01`, `D02`, … et ne sont jamais renumérotées.
- Les versions suivent le découpage : `V0` (squelette), `V1.0` (journal), `V1.5` (import FIT/GPX), `V2` (moteur de plans).
- Les dates sont au format `AAAA-MM-JJ`.
