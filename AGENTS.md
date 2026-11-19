<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Documentation du projet

- `Docs/suivi.md` est le **document vivant** du projet : état actuel, historique par version, décisions et prochaines étapes. Il doit être mis à jour **au moindre changement notable** (fonctionnalité, décision, correction, migration, dépendance, périmètre, déploiement, question ouverte).
- `Docs/presentation.md` décrit la vision, le périmètre et la stack. `DECISIONS.md` garde le détail daté des décisions : toute nouvelle décision s'ajoute dans les deux fichiers.
- `Docs/README.md` rappelle les règles de documentation.
- Ne jamais écrire de secret ni de donnée réelle dans ces fichiers.
